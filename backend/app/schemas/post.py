from datetime import date, datetime, time

from pydantic import BaseModel, ConfigDict

from app.models.enums import AccountType, FightOutcome, MediaType, PostType, Sport
from app.models.post import Post
from app.models.user import User


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


class CommentOut(BaseModel):
    id: int
    body: str
    created_at: datetime
    author: PostAuthorOut


class RepostOfOut(BaseModel):
    """A lightweight, non-interactive preview of the original post embedded in a repost."""

    id: int
    post_type: PostType
    body: str | None
    created_at: datetime
    author: PostAuthorOut
    media: list[PostMediaOut]
    fight_result: FightResultOut | None
    sparring_session: SparringSessionOut | None


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
    repost_of: RepostOfOut | None
    like_count: int
    comment_count: int
    repost_count: int
    liked_by_me: bool
    my_repost_id: int | None

    @classmethod
    def from_model(cls, post: Post, current_user_id: int) -> "PostOut":
        my_repost = next((r for r in post.reposts if r.author_id == current_user_id), None)

        return cls(
            id=post.id,
            post_type=post.post_type,
            body=post.body,
            created_at=post.created_at,
            author=_author_out(post.author),
            media=[PostMediaOut.model_validate(m) for m in post.media],
            tags=[_tag_out(t) for t in post.tags],
            fight_result=FightResultOut.model_validate(post.fight_result) if post.fight_result else None,
            sparring_session=(
                SparringSessionOut.model_validate(post.sparring_session) if post.sparring_session else None
            ),
            repost_of=_repost_of_out(post.repost_of) if post.repost_of else None,
            like_count=len(post.likes),
            comment_count=len(post.comments),
            repost_count=len(post.reposts),
            liked_by_me=any(like.user_id == current_user_id for like in post.likes),
            my_repost_id=my_repost.id if my_repost else None,
        )


def _author_out(user: User) -> PostAuthorOut:
    if user.account_type == AccountType.fighter and user.fighter_profile:
        fp = user.fighter_profile
        display_name = (
            f'{fp.first_name} "{fp.fight_name}" {fp.last_name}' if fp.fight_name else f"{fp.first_name} {fp.last_name}"
        )
        picture = fp.profile_picture_url
    elif user.account_type == AccountType.gym and user.gym_profile:
        display_name = user.gym_profile.org_name
        picture = None
    else:
        display_name = user.email
        picture = None
    return PostAuthorOut(
        user_id=user.id, account_type=user.account_type, display_name=display_name, profile_picture_url=picture
    )


def _tag_out(tag) -> TaggedUserOut:
    author = _author_out(tag.tagged_user)
    return TaggedUserOut(user_id=author.user_id, display_name=author.display_name)


def _repost_of_out(post: Post) -> RepostOfOut:
    return RepostOfOut(
        id=post.id,
        post_type=post.post_type,
        body=post.body,
        created_at=post.created_at,
        author=_author_out(post.author),
        media=[PostMediaOut.model_validate(m) for m in post.media],
        fight_result=FightResultOut.model_validate(post.fight_result) if post.fight_result else None,
        sparring_session=SparringSessionOut.model_validate(post.sparring_session) if post.sparring_session else None,
    )
