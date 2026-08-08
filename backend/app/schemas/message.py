from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field

from app.schemas.post import PostAuthorOut


class MessageOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    sender_id: int
    recipient_id: int
    body: str
    created_at: datetime
    read_at: datetime | None


class MessageCreate(BaseModel):
    body: str = Field(min_length=1)


class ConversationOut(BaseModel):
    other_user: PostAuthorOut
    last_message: MessageOut
    unread_count: int
