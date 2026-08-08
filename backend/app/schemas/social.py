from typing import Literal

from pydantic import BaseModel, ConfigDict

from app.models.enums import ConnectionStatus, Sport
from app.schemas.post import PostAuthorOut
from app.schemas.profile import FighterSportOut


class FighterSummary(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    user_id: int
    first_name: str
    last_name: str
    fight_name: str | None
    profile_picture_url: str | None
    sports: list[FighterSportOut]


class GymSummary(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    user_id: int
    org_name: str
    location: str | None
    sports: list[Sport]

    @classmethod
    def from_model(cls, gym_profile) -> "GymSummary":
        return cls(
            user_id=gym_profile.user_id,
            org_name=gym_profile.org_name,
            location=gym_profile.location,
            sports=[s.sport for s in gym_profile.sports],
        )


class ConnectionOut(BaseModel):
    id: int
    status: ConnectionStatus
    direction: Literal["incoming", "outgoing"]
    fighter: FighterSummary


class FollowOut(BaseModel):
    id: int
    target: PostAuthorOut
