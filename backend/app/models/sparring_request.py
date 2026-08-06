from datetime import datetime, timezone

from sqlalchemy import DateTime, Enum, ForeignKey, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base
from app.models.enums import SparringRequestStatus


class SparringRequest(Base):
    __tablename__ = "sparring_requests"

    id: Mapped[int] = mapped_column(primary_key=True)
    sparring_session_id: Mapped[int] = mapped_column(
        ForeignKey("sparring_sessions.id", ondelete="CASCADE"), nullable=False
    )
    requester_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    status: Mapped[SparringRequestStatus] = mapped_column(
        Enum(SparringRequestStatus, name="sparring_request_status"),
        default=SparringRequestStatus.pending,
        nullable=False,
    )
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))

    sparring_session: Mapped["SparringSession"] = relationship(back_populates="requests")
    requester: Mapped["User"] = relationship()

    __table_args__ = (UniqueConstraint("sparring_session_id", "requester_id", name="uq_sparring_request"),)
