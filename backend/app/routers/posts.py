from datetime import date, time

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile, status
from sqlalchemy import or_
from sqlalchemy.orm import Session, selectinload

from app.core.deps import get_current_user
from app.core.media import save_post_media
from app.database import get_db
from app.models.connection import Connection, Follow
from app.models.enums import ConnectionStatus, FightOutcome, PostType, Sport
from app.models.post import FightResult, Post, PostComment, PostLike, PostMedia, PostTag, SparringSession
from app.models.user import User
from app.schemas.post import CommentOut, PostOut, _author_out

router = APIRouter(prefix="/posts", tags=["posts"])


def _post_options():
    return [
        selectinload(Post.media),
        selectinload(Post.tags).selectinload(PostTag.tagged_user).selectinload(User.fighter_profile),
        selectinload(Post.tags).selectinload(PostTag.tagged_user).selectinload(User.gym_profile),
        selectinload(Post.author).selectinload(User.fighter_profile),
        selectinload(Post.author).selectinload(User.gym_profile),
        selectinload(Post.fight_result),
        selectinload(Post.sparring_session),
        selectinload(Post.likes),
        selectinload(Post.comments),
        selectinload(Post.reposts),
        selectinload(Post.repost_of).selectinload(Post.author).selectinload(User.fighter_profile),
        selectinload(Post.repost_of).selectinload(Post.author).selectinload(User.gym_profile),
        selectinload(Post.repost_of).selectinload(Post.media),
        selectinload(Post.repost_of).selectinload(Post.fight_result),
        selectinload(Post.repost_of).selectinload(Post.sparring_session),
    ]


def _load_post(db: Session, post_id: int) -> Post:
    post = db.get(Post, post_id, options=_post_options())
    if post is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Post not found")
    return post


def _attach_media_and_tags(
    db: Session, post: Post, current_user: User, files: list[UploadFile], tagged_user_ids: list[int]
) -> None:
    for i, file in enumerate(f for f in files if f.filename):
        url, media_type = save_post_media(current_user.id, file)
        db.add(PostMedia(post_id=post.id, media_url=url, media_type=media_type, position=i))

    for uid in set(tagged_user_ids):
        if uid == current_user.id:
            continue
        if db.get(User, uid) is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Tagged user {uid} not found")
        db.add(PostTag(post_id=post.id, tagged_user_id=uid))


@router.post("/text", response_model=PostOut, status_code=status.HTTP_201_CREATED)
def create_text_post(
    body: str = Form(...),
    tagged_user_ids: list[int] = Form(default=[]),
    files: list[UploadFile] = File(default=[]),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    post = Post(author_id=current_user.id, post_type=PostType.text, body=body)
    db.add(post)
    db.flush()
    _attach_media_and_tags(db, post, current_user, files, tagged_user_ids)
    db.commit()
    return PostOut.from_model(_load_post(db, post.id), current_user.id)


@router.post("/fight-result", response_model=PostOut, status_code=status.HTTP_201_CREATED)
def create_fight_result_post(
    opponent_name: str = Form(...),
    sport: Sport = Form(...),
    result: FightOutcome = Form(...),
    event_name: str | None = Form(default=None),
    event_date: date | None = Form(default=None),
    body: str | None = Form(default=None),
    tagged_user_ids: list[int] = Form(default=[]),
    files: list[UploadFile] = File(default=[]),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    post = Post(author_id=current_user.id, post_type=PostType.fight_result, body=body)
    db.add(post)
    db.flush()
    db.add(
        FightResult(
            post_id=post.id,
            opponent_name=opponent_name,
            sport=sport,
            result=result,
            event_name=event_name,
            event_date=event_date,
        )
    )
    _attach_media_and_tags(db, post, current_user, files, tagged_user_ids)
    db.commit()
    return PostOut.from_model(_load_post(db, post.id), current_user.id)


@router.post("/sparring-session", response_model=PostOut, status_code=status.HTTP_201_CREATED)
def create_sparring_session_post(
    sport: Sport = Form(...),
    session_date: date = Form(...),
    session_time: time = Form(...),
    location: str = Form(...),
    skill_level_notes: str | None = Form(default=None),
    body: str | None = Form(default=None),
    tagged_user_ids: list[int] = Form(default=[]),
    files: list[UploadFile] = File(default=[]),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    post = Post(author_id=current_user.id, post_type=PostType.sparring_session, body=body)
    db.add(post)
    db.flush()
    db.add(
        SparringSession(
            post_id=post.id,
            sport=sport,
            session_date=session_date,
            session_time=session_time,
            location=location,
            skill_level_notes=skill_level_notes,
        )
    )
    _attach_media_and_tags(db, post, current_user, files, tagged_user_ids)
    db.commit()
    return PostOut.from_model(_load_post(db, post.id), current_user.id)


@router.post("/{post_id}/repost", response_model=PostOut, status_code=status.HTTP_201_CREATED)
def repost(
    post_id: int,
    body: str | None = Form(default=None),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    original = db.get(Post, post_id)
    if original is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Post not found")

    # Flatten chains: reposting a repost reposts the underlying original, not the repost wrapper.
    target_id = original.repost_of_id or original.id

    existing = (
        db.query(Post)
        .filter(Post.author_id == current_user.id, Post.repost_of_id == target_id)
        .first()
    )
    if existing is not None:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Already reposted")

    repost_post = Post(author_id=current_user.id, post_type=PostType.repost, body=body, repost_of_id=target_id)
    db.add(repost_post)
    db.commit()
    return PostOut.from_model(_load_post(db, repost_post.id), current_user.id)


@router.post("/{post_id}/like", response_model=PostOut)
def like_post(post_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    if db.get(Post, post_id) is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Post not found")

    existing = db.query(PostLike).filter(PostLike.post_id == post_id, PostLike.user_id == current_user.id).first()
    if existing is None:
        db.add(PostLike(post_id=post_id, user_id=current_user.id))
        db.commit()
    return PostOut.from_model(_load_post(db, post_id), current_user.id)


@router.delete("/{post_id}/like", response_model=PostOut)
def unlike_post(post_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    like = db.query(PostLike).filter(PostLike.post_id == post_id, PostLike.user_id == current_user.id).first()
    if like is not None:
        db.delete(like)
        db.commit()
    return PostOut.from_model(_load_post(db, post_id), current_user.id)


@router.get("/{post_id}/comments", response_model=list[CommentOut])
def list_comments(post_id: int, db: Session = Depends(get_db)):
    post = db.get(
        Post,
        post_id,
        options=[
            selectinload(Post.comments)
            .selectinload(PostComment.author)
            .selectinload(User.fighter_profile),
            selectinload(Post.comments).selectinload(PostComment.author).selectinload(User.gym_profile),
        ],
    )
    if post is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Post not found")

    return [
        CommentOut(id=c.id, body=c.body, created_at=c.created_at, author=_author_out(c.author)) for c in post.comments
    ]


@router.post("/{post_id}/comments", response_model=CommentOut, status_code=status.HTTP_201_CREATED)
def create_comment(
    post_id: int,
    body: str = Form(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if db.get(Post, post_id) is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Post not found")

    comment = PostComment(post_id=post_id, author_id=current_user.id, body=body)
    db.add(comment)
    db.commit()
    db.refresh(comment)

    return CommentOut(id=comment.id, body=comment.body, created_at=comment.created_at, author=_author_out(current_user))


@router.get("/feed", response_model=list[PostOut])
def get_feed(limit: int = 50, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    connections = (
        db.query(Connection)
        .filter(
            Connection.status == ConnectionStatus.accepted,
            or_(Connection.requester_id == current_user.id, Connection.addressee_id == current_user.id),
        )
        .all()
    )
    connected_ids = {
        (c.addressee_id if c.requester_id == current_user.id else c.requester_id) for c in connections
    }
    followed_gym_ids = {f.followee_id for f in db.query(Follow).filter(Follow.follower_id == current_user.id).all()}
    author_ids = connected_ids | followed_gym_ids | {current_user.id}

    posts = (
        db.query(Post)
        .options(*_post_options())
        .filter(Post.author_id.in_(author_ids), Post.post_type != PostType.sparring_session)
        .order_by(Post.created_at.desc())
        .limit(limit)
        .all()
    )
    return [PostOut.from_model(p, current_user.id) for p in posts]


@router.delete("/{post_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_post(post_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    post = db.get(Post, post_id)
    if post is None or post.author_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Post not found")
    db.delete(post)
    db.commit()
