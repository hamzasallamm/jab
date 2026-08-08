from fastapi import APIRouter, Depends, File, HTTPException, UploadFile, status
from sqlalchemy.orm import Session

from app.core.deps import get_current_user
from app.core.media import save_avatar
from app.database import get_db
from app.models.enums import AccountType, Sport
from app.models.fighter_profile import FighterProfile, FighterSport
from app.models.gym_profile import GymProfile, GymSport
from app.models.user import User
from app.schemas.profile import (
    FighterProfileOut,
    FighterProfileUpdate,
    FighterSportCreate,
    FighterSportOut,
    FighterSportUpdate,
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


@router.post("/me/fighter/sports", response_model=FighterSportOut, status_code=status.HTTP_201_CREATED)
def add_my_fighter_sport(
    payload: FighterSportCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if current_user.account_type != AccountType.fighter or current_user.fighter_profile is None:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not a fighter account")

    profile = current_user.fighter_profile
    if any(s.sport == payload.sport for s in profile.sports):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"Already tracking {payload.sport.value}")

    entry = FighterSport(
        fighter_profile_id=profile.id,
        sport=payload.sport,
        gym=payload.gym,
        status=payload.status,
        belt=payload.belt if payload.sport == Sport.bjj else None,
    )
    db.add(entry)
    db.commit()
    db.refresh(entry)
    return entry


@router.patch("/me/fighter/sports/{sport_id}", response_model=FighterSportOut)
def update_my_fighter_sport(
    sport_id: int,
    payload: FighterSportUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    entry = _owned_fighter_sport(sport_id, current_user, db)
    data = payload.model_dump(exclude_unset=True)
    if "belt" in data and entry.sport != Sport.bjj:
        data["belt"] = None  # belt only makes sense for BJJ
    for field, value in data.items():
        setattr(entry, field, value)
    db.commit()
    db.refresh(entry)
    return entry


@router.delete("/me/fighter/sports/{sport_id}", status_code=status.HTTP_204_NO_CONTENT)
def remove_my_fighter_sport(
    sport_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)
):
    entry = _owned_fighter_sport(sport_id, current_user, db)
    db.delete(entry)
    db.commit()


def _owned_fighter_sport(sport_id: int, current_user: User, db: Session) -> FighterSport:
    if current_user.account_type != AccountType.fighter or current_user.fighter_profile is None:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not a fighter account")
    entry = db.get(FighterSport, sport_id)
    if entry is None or entry.fighter_profile_id != current_user.fighter_profile.id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Sport entry not found")
    return entry


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


@router.post("/me/fighter/photo", response_model=FighterProfileOut)
def upload_my_fighter_photo(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if current_user.account_type != AccountType.fighter or current_user.fighter_profile is None:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not a fighter account")

    profile = current_user.fighter_profile
    profile.profile_picture_url = save_avatar(current_user.id, file)
    db.commit()
    db.refresh(profile)
    return profile


@router.get("/fighters/{user_id}", response_model=FighterProfileOut)
def get_fighter_profile(user_id: int, db: Session = Depends(get_db)):
    profile = db.query(FighterProfile).filter(FighterProfile.user_id == user_id).first()
    if profile is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Fighter not found")
    return profile


@router.get("/gyms/{user_id}", response_model=GymProfileOut)
def get_gym_profile(user_id: int, db: Session = Depends(get_db)):
    profile = db.query(GymProfile).filter(GymProfile.user_id == user_id).first()
    if profile is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Gym not found")
    return GymProfileOut.from_model(profile)
