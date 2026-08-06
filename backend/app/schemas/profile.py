from pydantic import BaseModel, ConfigDict, Field

from app.models.enums import AccountType, FighterStatus, Sport


class FighterProfileOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    user_id: int
    name: str
    age: int
    sport: Sport
    gym: str | None
    status: FighterStatus
    amateur_wins: int
    amateur_losses: int
    amateur_draws: int
    pro_wins: int
    pro_losses: int
    pro_draws: int


class FighterProfileUpdate(BaseModel):
    name: str | None = None
    age: int | None = Field(default=None, ge=0, le=100)
    sport: Sport | None = None
    gym: str | None = None
    status: FighterStatus | None = None
    amateur_wins: int | None = Field(default=None, ge=0)
    amateur_losses: int | None = Field(default=None, ge=0)
    amateur_draws: int | None = Field(default=None, ge=0)
    pro_wins: int | None = Field(default=None, ge=0)
    pro_losses: int | None = Field(default=None, ge=0)
    pro_draws: int | None = Field(default=None, ge=0)


class GymProfileOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    user_id: int
    org_name: str
    location: str | None
    bio: str | None
    sports: list[Sport]

    @classmethod
    def from_model(cls, gym_profile) -> "GymProfileOut":
        return cls(
            id=gym_profile.id,
            user_id=gym_profile.user_id,
            org_name=gym_profile.org_name,
            location=gym_profile.location,
            bio=gym_profile.bio,
            sports=[s.sport for s in gym_profile.sports],
        )


class GymProfileUpdate(BaseModel):
    org_name: str | None = None
    location: str | None = None
    bio: str | None = None
    sports: list[Sport] | None = None


class MeOut(BaseModel):
    id: int
    email: str
    account_type: AccountType
    fighter_profile: FighterProfileOut | None = None
    gym_profile: GymProfileOut | None = None
