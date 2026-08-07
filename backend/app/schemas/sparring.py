from datetime import date, datetime, time
from typing import Literal

from pydantic import BaseModel

from app.models.enums import AccountType, SparringRequestStatus, Sport
from app.models.post import Post


class SparringAuthorOut(BaseModel):
    user_id: int
    account_type: AccountType
    display_name: str
    profile_picture_url: str | None


class SparringRequesterOut(BaseModel):
    request_id: int
    status: SparringRequestStatus
    requester_user_id: int
    requester_display_name: str
    requester_profile_picture_url: str | None


MyRequestStatus = Literal["none", "pending", "accepted", "declined"]


class SparringSessionCard(BaseModel):
    post_id: int
    session_id: int
    sport: Sport
    session_date: date
    session_time: time
    location: str
    skill_level_notes: str | None
    body: str | None
    created_at: datetime
    author: SparringAuthorOut
    is_owner: bool
    my_request_status: MyRequestStatus
    pending_request_count: int

    @classmethod
    def from_post(cls, post: Post, current_user_id: int) -> "SparringSessionCard":
        session = post.sparring_session
        author = post.author
        if author.account_type == AccountType.fighter and author.fighter_profile:
            fp = author.fighter_profile
            display_name = f'{fp.first_name} "{fp.fight_name}" {fp.last_name}' if fp.fight_name else f"{fp.first_name} {fp.last_name}"
            picture = fp.profile_picture_url
        elif author.account_type == AccountType.gym and author.gym_profile:
            display_name = author.gym_profile.org_name
            picture = None
        else:
            display_name = author.email
            picture = None

        is_owner = post.author_id == current_user_id
        my_status: MyRequestStatus = "none"
        pending_count = 0
        for req in session.requests:
            if req.status == SparringRequestStatus.pending:
                pending_count += 1
            if req.requester_id == current_user_id:
                my_status = req.status.value

        return cls(
            post_id=post.id,
            session_id=session.id,
            sport=session.sport,
            session_date=session.session_date,
            session_time=session.session_time,
            location=session.location,
            skill_level_notes=session.skill_level_notes,
            body=post.body,
            created_at=post.created_at,
            author=SparringAuthorOut(
                user_id=author.id,
                account_type=author.account_type,
                display_name=display_name,
                profile_picture_url=picture,
            ),
            is_owner=is_owner,
            my_request_status=my_status,
            pending_request_count=pending_count,
        )
