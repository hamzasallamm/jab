from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.deps import get_current_user
from app.database import get_db
from app.models.enums import AccountType
from app.models.fighter_profile import FighterProfile
from app.models.gym_profile import GymProfile, GymSport
from app.models.user import User
from app.schemas.profile import (
    FighterProfileOut,
    FighterProfileUpdate,
    GymProfileOut,
    GymProfileUpdate,
    MeOut,
)

router = APIRouter(prefix="/profiles", tags=["profiles"])


@router.get("/me", response_model=MeOut)
def get_me(current_user: User = Depends(get_current_user)):
    return MeOut(
        id=current_user.id,
        email=current_user.email,
        account_type=current_user.account_type,
        fighter_profile=(
            FighterProfileOut.model_validate(current_user.fighter_profile) if current_user.fighter_profile else None
        ),
        gym_profile=(GymProfileOut.from_model(current_user.gym_profile) if current_user.gym_profile else None),
    )


@router.patch("/me/fighter", response_model=FighterProfileOut)
def update_my_fighter_profile(
    payload: FighterProfileUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if current_user.account_type != AccountType.fighter or current_user.fighter_profile is None:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not a fighter account")

    profile = current_user.fighter_profile
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(profile, field, value)
    db.commit()
    db.refresh(profile)
    return profile


@router.patch("/me/gym", response_model=GymProfileOut)
def update_my_gym_profile(
    payload: GymProfileUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if current_user.account_type != AccountType.gym or current_user.gym_profile is None:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not a gym account")

    profile = current_user.gym_profile
    data = payload.model_dump(exclude_unset=True)
    sports = data.pop("sports", None)
    for field, value in data.items():
        setattr(profile, field, value)
    if sports is not None:
        profile.sports = [GymSport(sport=s) for s in set(sports)]
    db.commit()
    db.refresh(profile)
    return GymProfileOut.from_model(profile)


@router.get("/fighters/{fighter_id}", response_model=FighterProfileOut)
def get_fighter_profile(fighter_id: int, db: Session = Depends(get_db)):
    profile = db.get(FighterProfile, fighter_id)
    if profile is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Fighter not found")
    return profile


@router.get("/gyms/{gym_id}", response_model=GymProfileOut)
def get_gym_profile(gym_id: int, db: Session = Depends(get_db)):
    profile = db.get(GymProfile, gym_id)
    if profile is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Gym not found")
    return GymProfileOut.from_model(profile)
