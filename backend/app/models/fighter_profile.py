from sqlalchemy import Enum, ForeignKey, Integer, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base
from app.models.enums import FighterStatus, Sport


class FighterProfile(Base):
    __tablename__ = "fighter_profiles"

    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), unique=True, nullable=False)

    name: Mapped[str] = mapped_column(String(120), nullable=False)
    age: Mapped[int] = mapped_column(Integer, nullable=False)
    sport: Mapped[Sport] = mapped_column(Enum(Sport, name="sport"), nullable=False)
    gym: Mapped[str] = mapped_column(String(200), nullable=True)
    status: Mapped[FighterStatus] = mapped_column(Enum(FighterStatus, name="fighter_status"), nullable=False)

    amateur_wins: Mapped[int] = mapped_column(Integer, default=0)
    amateur_losses: Mapped[int] = mapped_column(Integer, default=0)
    amateur_draws: Mapped[int] = mapped_column(Integer, default=0)

    pro_wins: Mapped[int] = mapped_column(Integer, default=0)
    pro_losses: Mapped[int] = mapped_column(Integer, default=0)
    pro_draws: Mapped[int] = mapped_column(Integer, default=0)

    user: Mapped["User"] = relationship(back_populates="fighter_profile")
