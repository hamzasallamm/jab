from datetime import datetime, timezone

from sqlalchemy import DateTime, Enum, ForeignKey, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base
from app.models.enums import ConnectionStatus


class Connection(Base):
    """Fighter <-> fighter connection request. Directional row, symmetric once accepted."""

    __tablename__ = "connections"

    id: Mapped[int] = mapped_column(primary_key=True)
    requester_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    addressee_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    status: Mapped[ConnectionStatus] = mapped_column(
        Enum(ConnectionStatus, name="connection_status"), default=ConnectionStatus.pending, nullable=False
    )
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))

    requester: Mapped["User"] = relationship(foreign_keys=[requester_id])
    addressee: Mapped["User"] = relationship(foreign_keys=[addressee_id])

    __table_args__ = (UniqueConstraint("requester_id", "addressee_id", name="uq_connection_pair"),)


class Follow(Base):
    """One-directional follow: a fighter (or gym) follows a gym/org account."""

    __tablename__ = "follows"

    id: Mapped[int] = mapped_column(primary_key=True)
    follower_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    followee_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))

    follower: Mapped["User"] = relationship(foreign_keys=[follower_id])
    followee: Mapped["User"] = relationship(foreign_keys=[followee_id])

    __table_args__ = (UniqueConstraint("follower_id", "followee_id", name="uq_follow_pair"),)
