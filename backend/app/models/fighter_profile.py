from sqlalchemy import Enum, ForeignKey, Integer, String, Text, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base
from app.models.enums import BeltColor, FighterStatus, Sport


class FighterProfile(Base):
    __tablename__ = "fighter_profiles"

    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), unique=True, nullable=False)

    first_name: Mapped[str] = mapped_column(String(120), nullable=False)
    last_name: Mapped[str] = mapped_column(String(120), nullable=False)
    fight_name: Mapped[str] = mapped_column(String(120), nullable=True)  # AKA / ring name, e.g. "The Notorious"
    profile_picture_url: Mapped[str] = mapped_column(String(500), nullable=True)
    bio: Mapped[str] = mapped_column(Text, nullable=True)
    age: Mapped[int] = mapped_column(Integer, nullable=False)

    user: Mapped["User"] = relationship(back_populates="fighter_profile")
    sports: Mapped[list["FighterSport"]] = relationship(
        back_populates="fighter_profile", cascade="all, delete-orphan"
    )


class FighterSport(Base):
    """One row per sport a fighter competes in - a fighter can train boxing at one
    gym and BJJ at another, each with its own record (and, for BJJ, belt rank)."""

    __tablename__ = "fighter_sports"

    id: Mapped[int] = mapped_column(primary_key=True)
    fighter_profile_id: Mapped[int] = mapped_column(
        ForeignKey("fighter_profiles.id", ondelete="CASCADE"), nullable=False
    )
    sport: Mapped[Sport] = mapped_column(Enum(Sport, name="sport"), nullable=False)
    gym: Mapped[str] = mapped_column(String(200), nullable=True)
    status: Mapped[FighterStatus] = mapped_column(Enum(FighterStatus, name="fighter_status"), nullable=False)
    belt: Mapped[BeltColor] = mapped_column(Enum(BeltColor, name="belt_color"), nullable=True)  # BJJ only

    amateur_wins: Mapped[int] = mapped_column(Integer, default=0)
    amateur_losses: Mapped[int] = mapped_column(Integer, default=0)
    amateur_draws: Mapped[int] = mapped_column(Integer, default=0)

    pro_wins: Mapped[int] = mapped_column(Integer, default=0)
    pro_losses: Mapped[int] = mapped_column(Integer, default=0)
    pro_draws: Mapped[int] = mapped_column(Integer, default=0)

    fighter_profile: Mapped["FighterProfile"] = relationship(back_populates="sports")

    __table_args__ = (UniqueConstraint("fighter_profile_id", "sport", name="uq_fighter_sport"),)
