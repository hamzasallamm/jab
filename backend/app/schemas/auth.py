from pydantic import BaseModel, EmailStr, Field

from app.models.enums import FighterStatus, Sport


class FighterSignupExtra(BaseModel):
    first_name: str
    last_name: str
    fight_name: str | None = None
    age: int = Field(ge=0, le=100)
    sport: Sport
    gym: str | None = None
    status: FighterStatus


class GymSignupExtra(BaseModel):
    org_name: str
    location: str | None = None
    bio: str | None = None
    sports: list[Sport] = Field(default_factory=list)


class FighterSignup(BaseModel):
    email: EmailStr
    password: str = Field(min_length=8)
    fighter: FighterSignupExtra


class GymSignup(BaseModel):
    email: EmailStr
    password: str = Field(min_length=8)
    gym: GymSignupExtra


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
