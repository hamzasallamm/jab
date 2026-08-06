from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.security import create_access_token, hash_password, verify_password
from app.database import get_db
from app.models.enums import AccountType
from app.models.fighter_profile import FighterProfile
from app.models.gym_profile import GymProfile, GymSport
from app.models.user import User
from app.schemas.auth import FighterSignup, GymSignup, LoginRequest, TokenResponse

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/signup/fighter", response_model=TokenResponse, status_code=status.HTTP_201_CREATED)
def signup_fighter(payload: FighterSignup, db: Session = Depends(get_db)):
    _assert_email_available(payload.email, db)

    user = User(
        email=payload.email,
        hashed_password=hash_password(payload.password),
        account_type=AccountType.fighter,
    )
    db.add(user)
    db.flush()  # assign user.id before creating the profile row

    profile = FighterProfile(
        user_id=user.id,
        name=payload.fighter.name,
        age=payload.fighter.age,
        sport=payload.fighter.sport,
        gym=payload.fighter.gym,
        status=payload.fighter.status,
    )
    db.add(profile)
    db.commit()

    return TokenResponse(access_token=create_access_token(subject=str(user.id)))


@router.post("/signup/gym", response_model=TokenResponse, status_code=status.HTTP_201_CREATED)
def signup_gym(payload: GymSignup, db: Session = Depends(get_db)):
    _assert_email_available(payload.email, db)

    user = User(
        email=payload.email,
        hashed_password=hash_password(payload.password),
        account_type=AccountType.gym,
    )
    db.add(user)
    db.flush()

    profile = GymProfile(
        user_id=user.id,
        org_name=payload.gym.org_name,
        location=payload.gym.location,
        bio=payload.gym.bio,
    )
    profile.sports = [GymSport(sport=s) for s in set(payload.gym.sports)]
    db.add(profile)
    db.commit()

    return TokenResponse(access_token=create_access_token(subject=str(user.id)))


@router.post("/login", response_model=TokenResponse)
def login(payload: LoginRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == payload.email).first()
    if user is None or not verify_password(payload.password, user.hashed_password):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid email or password")

    return TokenResponse(access_token=create_access_token(subject=str(user.id)))


def _assert_email_available(email: str, db: Session) -> None:
    if db.query(User).filter(User.email == email).first() is not None:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Email already registered")
