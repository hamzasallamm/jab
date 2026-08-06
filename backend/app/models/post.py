from datetime import datetime, timezone

from sqlalchemy import DateTime, Enum, ForeignKey, Integer, String, Text, Time, UniqueConstraint
from sqlalchemy import Date
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base
from app.models.enums import FightOutcome, MediaType, PostType, Sport


class Post(Base):
    __tablename__ = "posts"

    id: Mapped[int] = mapped_column(primary_key=True)
    author_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    post_type: Mapped[PostType] = mapped_column(Enum(PostType, name="post_type"), nullable=False)
    body: Mapped[str] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))

    author: Mapped["User"] = relationship()
    fight_result: Mapped["FightResult"] = relationship(
        back_populates="post", uselist=False, cascade="all, delete-orphan"
    )
    sparring_session: Mapped["SparringSession"] = relationship(
        back_populates="post", uselist=False, cascade="all, delete-orphan"
    )
    media: Mapped[list["PostMedia"]] = relationship(
        back_populates="post", cascade="all, delete-orphan", order_by="PostMedia.position"
    )
    tags: Mapped[list["PostTag"]] = relationship(back_populates="post", cascade="all, delete-orphan")


class PostMedia(Base):
    """A photo or video attached to a post. Multiple rows -> a gallery/carousel."""

    __tablename__ = "post_media"

    id: Mapped[int] = mapped_column(primary_key=True)
    post_id: Mapped[int] = mapped_column(ForeignKey("posts.id", ondelete="CASCADE"), nullable=False)
    media_url: Mapped[str] = mapped_column(String(500), nullable=False)
    media_type: Mapped[MediaType] = mapped_column(Enum(MediaType, name="media_type"), nullable=False)
    position: Mapped[int] = mapped_column(Integer, default=0)

    post: Mapped["Post"] = relationship(back_populates="media")


class PostTag(Base):
    """A user tagged in a post (e.g. tagging a sparring partner or opponent)."""

    __tablename__ = "post_tags"

    id: Mapped[int] = mapped_column(primary_key=True)
    post_id: Mapped[int] = mapped_column(ForeignKey("posts.id", ondelete="CASCADE"), nullable=False)
    tagged_user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), nullable=False)

    post: Mapped["Post"] = relationship(back_populates="tags")
    tagged_user: Mapped["User"] = relationship()

    __table_args__ = (UniqueConstraint("post_id", "tagged_user_id", name="uq_post_tag"),)


class FightResult(Base):
    __tablename__ = "fight_results"

    id: Mapped[int] = mapped_column(primary_key=True)
    post_id: Mapped[int] = mapped_column(ForeignKey("posts.id", ondelete="CASCADE"), unique=True, nullable=False)

    opponent_name: Mapped[str] = mapped_column(String(200), nullable=False)
    sport: Mapped[Sport] = mapped_column(Enum(Sport, name="sport"), nullable=False)
    result: Mapped[FightOutcome] = mapped_column(Enum(FightOutcome, name="fight_outcome"), nullable=False)
    event_name: Mapped[str] = mapped_column(String(200), nullable=True)
    event_date: Mapped[datetime] = mapped_column(Date, nullable=True)

    post: Mapped["Post"] = relationship(back_populates="fight_result")


class SparringSession(Base):
    __tablename__ = "sparring_sessions"

    id: Mapped[int] = mapped_column(primary_key=True)
    post_id: Mapped[int] = mapped_column(ForeignKey("posts.id", ondelete="CASCADE"), unique=True, nullable=False)

    sport: Mapped[Sport] = mapped_column(Enum(Sport, name="sport"), nullable=False)
    session_date: Mapped[datetime] = mapped_column(Date, nullable=False)
    session_time: Mapped[datetime] = mapped_column(Time, nullable=False)
    location: Mapped[str] = mapped_column(String(255), nullable=False)
    skill_level_notes: Mapped[str] = mapped_column(Text, nullable=True)

    post: Mapped["Post"] = relationship(back_populates="sparring_session")
    requests: Mapped[list["SparringRequest"]] = relationship(
        back_populates="sparring_session", cascade="all, delete-orphan"
    )
