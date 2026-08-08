from datetime import datetime

from pydantic import BaseModel, Field

from app.models.message import Message
from app.schemas.post import FightResultOut, PostAuthorOut, PostMediaOut, PostType, SparringSessionOut


class ReactionSummary(BaseModel):
    emoji: str
    count: int
    reacted_by_me: bool


class SharedPostOut(BaseModel):
    id: int
    post_type: PostType
    body: str | None
    author: PostAuthorOut
    media: list[PostMediaOut]
    fight_result: FightResultOut | None
    sparring_session: SparringSessionOut | None


class MessageOut(BaseModel):
    id: int
    conversation_id: int
    sender_id: int
    body: str | None
    shared_post: SharedPostOut | None
    edited_at: datetime | None
    created_at: datetime
    reactions: list[ReactionSummary]

    @classmethod
    def from_model(cls, message: Message, current_user_id: int) -> "MessageOut":
        from app.schemas.post import _author_out  # avoid a circular import at module load time

        reaction_groups: dict[str, list[int]] = {}
        for r in message.reactions:
            reaction_groups.setdefault(r.emoji, []).append(r.user_id)

        shared = None
        if message.shared_post is not None:
            p = message.shared_post
            shared = SharedPostOut(
                id=p.id,
                post_type=p.post_type,
                body=p.body,
                author=_author_out(p.author),
                media=[PostMediaOut.model_validate(m) for m in p.media],
                fight_result=FightResultOut.model_validate(p.fight_result) if p.fight_result else None,
                sparring_session=(
                    SparringSessionOut.model_validate(p.sparring_session) if p.sparring_session else None
                ),
            )

        return cls(
            id=message.id,
            conversation_id=message.conversation_id,
            sender_id=message.sender_id,
            body=message.body,
            shared_post=shared,
            edited_at=message.edited_at,
            created_at=message.created_at,
            reactions=[
                ReactionSummary(emoji=emoji, count=len(user_ids), reacted_by_me=current_user_id in user_ids)
                for emoji, user_ids in reaction_groups.items()
            ],
        )


class MessageCreate(BaseModel):
    body: str | None = None
    shared_post_id: int | None = None


class MessageUpdate(BaseModel):
    body: str = Field(min_length=1)


class ReactionToggle(BaseModel):
    emoji: str = Field(min_length=1, max_length=16)


class ParticipantOut(PostAuthorOut):
    pass


class ConversationOut(BaseModel):
    id: int
    is_group: bool
    name: str | None
    participants: list[ParticipantOut]
    last_message: MessageOut | None
    unread_count: int


class ConversationCreate(BaseModel):
    participant_ids: list[int] = Field(min_length=1)
    is_group: bool = False
    name: str | None = None
