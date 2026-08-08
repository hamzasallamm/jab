from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import or_
from sqlalchemy.orm import Session

from app.core.deps import get_current_user
from app.database import get_db
from app.models.message import Message
from app.models.user import User
from app.schemas.message import ConversationOut, MessageCreate, MessageOut
from app.schemas.post import _author_out

router = APIRouter(prefix="/messages", tags=["messages"])


@router.get("/conversations", response_model=list[ConversationOut])
def list_conversations(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    messages = (
        db.query(Message)
        .filter(or_(Message.sender_id == current_user.id, Message.recipient_id == current_user.id))
        .order_by(Message.created_at.desc())
        .all()
    )

    latest_by_other: dict[int, Message] = {}
    unread_by_other: dict[int, int] = {}
    for m in messages:
        other_id = m.recipient_id if m.sender_id == current_user.id else m.sender_id
        if other_id not in latest_by_other:
            latest_by_other[other_id] = m  # first seen per key is the latest, since sorted desc
        if m.recipient_id == current_user.id and m.read_at is None:
            unread_by_other[other_id] = unread_by_other.get(other_id, 0) + 1

    conversations = [
        ConversationOut(
            other_user=_author_out(latest.sender if latest.sender_id != current_user.id else latest.recipient),
            last_message=MessageOut.model_validate(latest),
            unread_count=unread_by_other.get(other_id, 0),
        )
        for other_id, latest in latest_by_other.items()
    ]
    conversations.sort(key=lambda c: c.last_message.created_at, reverse=True)
    return conversations


@router.get("/{other_user_id}", response_model=list[MessageOut])
def get_thread(other_user_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    if db.get(User, other_user_id) is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

    messages = (
        db.query(Message)
        .filter(
            or_(
                (Message.sender_id == current_user.id) & (Message.recipient_id == other_user_id),
                (Message.sender_id == other_user_id) & (Message.recipient_id == current_user.id),
            )
        )
        .order_by(Message.created_at.asc())
        .all()
    )

    unread = [m for m in messages if m.recipient_id == current_user.id and m.read_at is None]
    if unread:
        now = datetime.now(timezone.utc)
        for m in unread:
            m.read_at = now
        db.commit()

    return messages


@router.post("/{other_user_id}", response_model=MessageOut, status_code=status.HTTP_201_CREATED)
def send_message(
    other_user_id: int,
    payload: MessageCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if other_user_id == current_user.id:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Cannot message yourself")
    if db.get(User, other_user_id) is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

    message = Message(sender_id=current_user.id, recipient_id=other_user_id, body=payload.body)
    db.add(message)
    db.commit()
    db.refresh(message)
    return message
