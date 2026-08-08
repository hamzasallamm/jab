from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.deps import get_current_user
from app.database import get_db
from app.models.connection import Follow
from app.models.enums import Sport
from app.models.gym_profile import GymProfile, GymSport
from app.models.user import User
from app.schemas.post import _author_out
from app.schemas.social import FollowOut, GymSummary

router = APIRouter(prefix="/follows", tags=["follows"])


@router.get("/gyms", response_model=list[GymSummary])
def list_gyms(sport: Sport | None = None, location: str | None = None, db: Session = Depends(get_db)):
    query = db.query(GymProfile)
    if sport:
        query = query.join(GymSport).filter(GymSport.sport == sport)
    if location:
        query = query.filter(GymProfile.location.ilike(f"%{location}%"))
    gyms = query.order_by(GymProfile.org_name).limit(100).all()
    return [GymSummary.from_model(g) for g in gyms]


@router.get("/me", response_model=list[FollowOut])
def list_my_follows(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    follows = db.query(Follow).filter(Follow.follower_id == current_user.id).all()
    return [FollowOut(id=f.id, target=_author_out(f.followee)) for f in follows]


@router.post("/{user_id}", response_model=FollowOut, status_code=status.HTTP_201_CREATED)
def follow_user(user_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    if user_id == current_user.id:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Cannot follow yourself")

    target = db.get(User, user_id)
    if target is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

    existing = db.query(Follow).filter(Follow.follower_id == current_user.id, Follow.followee_id == user_id).first()
    if existing is not None:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Already following")

    follow = Follow(follower_id=current_user.id, followee_id=user_id)
    db.add(follow)
    db.commit()
    db.refresh(follow)
    return FollowOut(id=follow.id, target=_author_out(target))


@router.delete("/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
def unfollow_user(user_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    follow = db.query(Follow).filter(Follow.follower_id == current_user.id, Follow.followee_id == user_id).first()
    if follow is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Not following this user")
    db.delete(follow)
    db.commit()
