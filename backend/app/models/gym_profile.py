from sqlalchemy import Enum, ForeignKey, String, Text, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base
from app.models.enums import Sport


class GymProfile(Base):
    __tablename__ = "gym_profiles"

    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), unique=True, nullable=False)

    org_name: Mapped[str] = mapped_column(String(200), nullable=False)
    location: Mapped[str] = mapped_column(String(200), nullable=True)
    bio: Mapped[str] = mapped_column(Text, nullable=True)

    user: Mapped["User"] = relationship(back_populates="gym_profile")
    sports: Mapped[list["GymSport"]] = relationship(back_populates="gym_profile", cascade="all, delete-orphan")


class GymSport(Base):
    """One row per sport a gym offers — enables 'gyms offering boxing' style filtering."""

    __tablename__ = "gym_sports"

    id: Mapped[int] = mapped_column(primary_key=True)
    gym_profile_id: Mapped[int] = mapped_column(ForeignKey("gym_profiles.id", ondelete="CASCADE"), nullable=False)
    sport: Mapped[Sport] = mapped_column(Enum(Sport, name="sport"), nullable=False)

    gym_profile: Mapped["GymProfile"] = relationship(back_populates="sports")

    __table_args__ = (UniqueConstraint("gym_profile_id", "sport", name="uq_gym_sport"),)
