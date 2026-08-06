from datetime import date, datetime, time

from pydantic import BaseModel, ConfigDict

from app.models.enums import AccountType, FightOutcome, MediaType, PostType, Sport
from app.models.post import Post


class PostMediaOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    media_url: str
    media_type: MediaType


class TaggedUserOut(BaseModel):
    user_id: int
    display_name: str


class PostAuthorOut(BaseModel):
    user_id: int
    account_type: AccountType
    display_name: str
    profile_picture_url: str | None


class FightResultOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    opponent_name: str
    sport: Sport
    result: FightOutcome
    event_name: str | None
    event_date: date | None


class SparringSessionOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    sport: Sport
    session_date: date
    session_time: time
    location: str
    skill_level_notes: str | None


class PostOut(BaseModel):
    id: int
    post_type: PostType
    body: str | None
    created_at: datetime
    author: PostAuthorOut
    media: list[PostMediaOut]
    tags: list[TaggedUserOut]
    fight_result: FightResultOut | None
    sparring_session: SparringSessionOut | None

    @classmethod
    def from_model(cls, post: Post) -> "PostOut":
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

        return cls(
            id=post.id,
            post_type=post.post_type,
            body=post.body,
            created_at=post.created_at,
            author=PostAuthorOut(
                user_id=author.id,
                account_type=author.account_type,
                display_name=display_name,
                profile_picture_url=picture,
            ),
            media=[PostMediaOut.model_validate(m) for m in post.media],
            tags=[_tag_out(t) for t in post.tags],
            fight_result=FightResultOut.model_validate(post.fight_result) if post.fight_result else None,
            sparring_session=SparringSessionOut.model_validate(post.sparring_session) if post.sparring_session else None,
        )


def _tag_out(tag) -> TaggedUserOut:
    user = tag.tagged_user
    if user.account_type == AccountType.fighter and user.fighter_profile:
        fp = user.fighter_profile
        name = f"{fp.first_name} {fp.last_name}"
    elif user.account_type == AccountType.gym and user.gym_profile:
        name = user.gym_profile.org_name
    else:
        name = user.email
    return TaggedUserOut(user_id=user.id, display_name=name)
