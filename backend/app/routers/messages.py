from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session, selectinload

from app.core.deps import get_current_user
from app.database import get_db
from app.models.message import Conversation, ConversationParticipant, Message, MessageReaction
from app.models.post import Post
from app.models.user import User
from app.schemas.message import (
    ConversationCreate,
    ConversationOut,
    MessageCreate,
    MessageOut,
    MessageUpdate,
    ParticipantOut,
    ReactionToggle,
)
from app.schemas.post import _author_out

router = APIRouter(prefix="/conversations", tags=["messages"])


def _conversation_options():
    return [
        selectinload(Conversation.participants).selectinload(ConversationParticipant.user).selectinload(
            User.fighter_profile
        ),
        selectinload(Conversation.participants).selectinload(ConversationParticipant.user).selectinload(
            User.gym_profile
        ),
        selectinload(Conversation.messages).selectinload(Message.reactions),
        selectinload(Conversation.messages).selectinload(Message.shared_post).selectinload(Post.author).selectinload(
            User.fighter_profile
        ),
        selectinload(Conversation.messages).selectinload(Message.shared_post).selectinload(Post.author).selectinload(
            User.gym_profile
        ),
        selectinload(Conversation.messages).selectinload(Message.shared_post).selectinload(Post.media),
        selectinload(Conversation.messages).selectinload(Message.shared_post).selectinload(Post.fight_result),
        selectinload(Conversation.messages).selectinload(Message.shared_post).selectinload(Post.sparring_session),
    ]


def _message_options():
    return [
        selectinload(Message.reactions),
        selectinload(Message.shared_post).selectinload(Post.author).selectinload(User.fighter_profile),
        selectinload(Message.shared_post).selectinload(Post.author).selectinload(User.gym_profile),
        selectinload(Message.shared_post).selectinload(Post.media),
        selectinload(Message.shared_post).selectinload(Post.fight_result),
        selectinload(Message.shared_post).selectinload(Post.sparring_session),
    ]


def _load_message(db: Session, message_id: int) -> Message:
    return db.get(Message, message_id, options=_message_options())


def _require_participant(conversation_id: int, current_user: User, db: Session) -> Conversation:
    conv = db.get(Conversation, conversation_id, options=_conversation_options())
    if conv is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Conversation not found")
    if not any(p.user_id == current_user.id for p in conv.participants):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not a participant in this conversation")
    return conv


def _conversation_out(conv: Conversation, current_user_id: int) -> ConversationOut:
    last_msg = conv.messages[-1] if conv.messages else None
    my_participant = next((p for p in conv.participants if p.user_id == current_user_id), None)
    last_read = my_participant.last_read_at if my_participant else None
    unread = sum(
        1 for m in conv.messages if m.sender_id != current_user_id and (last_read is None or m.created_at > last_read)
    )
    return ConversationOut(
        id=conv.id,
        is_group=conv.is_group,
        name=conv.name,
        participants=[ParticipantOut(**_author_out(p.user).model_dump()) for p in conv.participants],
        last_message=MessageOut.from_model(last_msg, current_user_id) if last_msg else None,
        unread_count=unread,
    )


def _find_existing_1on1(db: Session, user_a: int, user_b: int) -> Conversation | None:
    my_conv_ids = {
        cp.conversation_id for cp in db.query(ConversationParticipant).filter(ConversationParticipant.user_id == user_a)
    }
    candidates = (
        db.query(Conversation)
        .join(ConversationParticipant, ConversationParticipant.conversation_id == Conversation.id)
        .filter(
            Conversation.is_group.is_(False),
            ConversationParticipant.user_id == user_b,
            Conversation.id.in_(my_conv_ids),
        )
        .options(*_conversation_options())
        .all()
    )
    for c in candidates:
        if {p.user_id for p in c.participants} == {user_a, user_b}:
            return c
    return None


@router.get("", response_model=list[ConversationOut])
def list_conversations(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    my_conv_ids = [
        cp.conversation_id
        for cp in db.query(ConversationParticipant).filter(ConversationParticipant.user_id == current_user.id)
    ]
    conversations = (
        db.query(Conversation).filter(Conversation.id.in_(my_conv_ids)).options(*_conversation_options()).all()
    )
    out = [_conversation_out(c, current_user.id) for c in conversations]
    epoch = datetime.min.replace(tzinfo=timezone.utc)
    out.sort(key=lambda c: c.last_message.created_at if c.last_message else epoch, reverse=True)
    return out


@router.post("", response_model=ConversationOut, status_code=status.HTTP_201_CREATED)
def create_conversation(
    payload: ConversationCreate, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)
):
    participant_ids = set(payload.participant_ids) - {current_user.id}
    if not participant_ids:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Need at least one other participant")
    for uid in participant_ids:
        if db.get(User, uid) is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"User {uid} not found")

    is_group = payload.is_group or len(participant_ids) > 1

    if not is_group:
        existing = _find_existing_1on1(db, current_user.id, next(iter(participant_ids)))
        if existing is not None:
            return _conversation_out(existing, current_user.id)

    conv = Conversation(is_group=is_group, name=payload.name if is_group else None)
    db.add(conv)
    db.flush()
    now = datetime.now(timezone.utc)
    for uid in participant_ids | {current_user.id}:
        db.add(ConversationParticipant(conversation_id=conv.id, user_id=uid, last_read_at=now))
    db.commit()

    return _conversation_out(db.get(Conversation, conv.id, options=_conversation_options()), current_user.id)


@router.get("/{conversation_id}/messages", response_model=list[MessageOut])
def get_messages(
    conversation_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)
):
    conv = _require_participant(conversation_id, current_user, db)

    messages = (
        db.query(Message)
        .filter(Message.conversation_id == conversation_id)
        .options(*_message_options())
        .order_by(Message.created_at.asc())
        .all()
    )

    my_participant = next(p for p in conv.participants if p.user_id == current_user.id)
    my_participant.last_read_at = datetime.now(timezone.utc)
    db.commit()

    return [MessageOut.from_model(m, current_user.id) for m in messages]


@router.post("/{conversation_id}/messages", response_model=MessageOut, status_code=status.HTTP_201_CREATED)
def send_message(
    conversation_id: int,
    payload: MessageCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    _require_participant(conversation_id, current_user, db)
    if not payload.body and not payload.shared_post_id:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Message needs a body or a shared post")
    if payload.shared_post_id is not None and db.get(Post, payload.shared_post_id) is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Shared post not found")

    message = Message(
        conversation_id=conversation_id,
        sender_id=current_user.id,
        body=payload.body,
        shared_post_id=payload.shared_post_id,
    )
    db.add(message)
    db.commit()
    return MessageOut.from_model(_load_message(db, message.id), current_user.id)


@router.patch("/{conversation_id}/messages/{message_id}", response_model=MessageOut)
def edit_message(
    conversation_id: int,
    message_id: int,
    payload: MessageUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    message = db.get(Message, message_id)
    if message is None or message.conversation_id != conversation_id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Message not found")
    if message.sender_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not your message")

    message.body = payload.body
    message.edited_at = datetime.now(timezone.utc)
    db.commit()
    return MessageOut.from_model(_load_message(db, message.id), current_user.id)


@router.post("/{conversation_id}/messages/{message_id}/react", response_model=MessageOut)
def toggle_reaction(
    conversation_id: int,
    message_id: int,
    payload: ReactionToggle,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    _require_participant(conversation_id, current_user, db)
    message = db.get(Message, message_id)
    if message is None or message.conversation_id != conversation_id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Message not found")

    existing = (
        db.query(MessageReaction)
        .filter(
            MessageReaction.message_id == message_id,
            MessageReaction.user_id == current_user.id,
            MessageReaction.emoji == payload.emoji,
        )
        .first()
    )
    if existing is not None:
        db.delete(existing)
    else:
        db.add(MessageReaction(message_id=message_id, user_id=current_user.id, emoji=payload.emoji))
    db.commit()

    return MessageOut.from_model(_load_message(db, message_id), current_user.id)
