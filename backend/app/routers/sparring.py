from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session, selectinload

from app.core.deps import get_current_user
from app.database import get_db
from app.models.enums import AccountType, PostType, SparringRequestStatus, Sport
from app.models.post import Post, SparringSession
from app.models.sparring_request import SparringRequest
from app.models.user import User
from app.schemas.sparring import SparringRequesterOut, SparringSessionCard

router = APIRouter(tags=["sparring"])


def _session_post_options():
    return [
        selectinload(Post.author).selectinload(User.fighter_profile),
        selectinload(Post.author).selectinload(User.gym_profile),
        selectinload(Post.sparring_session)
        .selectinload(SparringSession.requests)
        .selectinload(SparringRequest.requester)
        .selectinload(User.fighter_profile),
        selectinload(Post.sparring_session)
        .selectinload(SparringSession.requests)
        .selectinload(SparringRequest.requester)
        .selectinload(User.gym_profile),
    ]


@router.get("/sparring-sessions", response_model=list[SparringSessionCard])
def list_sparring_sessions(
    location: str | None = None,
    sport: Sport | None = None,
    limit: int = 50,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    query = (
        db.query(Post)
        .join(Post.sparring_session)
        .filter(Post.post_type == PostType.sparring_session)
        .options(*_session_post_options())
    )
    if location:
        query = query.filter(SparringSession.location.ilike(f"%{location}%"))
    if sport:
        query = query.filter(SparringSession.sport == sport)

    posts = query.order_by(SparringSession.session_date, SparringSession.session_time).limit(limit).all()
    return [SparringSessionCard.from_post(p, current_user.id) for p in posts]


@router.post("/sparring-sessions/{session_id}/request", status_code=status.HTTP_201_CREATED)
def request_to_join(
    session_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)
):
    if current_user.account_type != AccountType.fighter:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Only fighters can request to join")

    session = db.get(SparringSession, session_id)
    if session is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Sparring session not found")
    if session.post.author_id == current_user.id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="Cannot request to join your own session"
        )

    existing = (
        db.query(SparringRequest)
        .filter(SparringRequest.sparring_session_id == session_id, SparringRequest.requester_id == current_user.id)
        .first()
    )
    if existing is not None:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Already requested to join this session")

    db.add(SparringRequest(sparring_session_id=session_id, requester_id=current_user.id))
    db.commit()
    return {"status": "requested"}


@router.delete("/sparring-sessions/{session_id}/request", status_code=status.HTTP_204_NO_CONTENT)
def cancel_join_request(
    session_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)
):
    req = (
        db.query(SparringRequest)
        .filter(SparringRequest.sparring_session_id == session_id, SparringRequest.requester_id == current_user.id)
        .first()
    )
    if req is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="No request found")
    db.delete(req)
    db.commit()


@router.get("/sparring-sessions/{session_id}/requests", response_model=list[SparringRequesterOut])
def list_requesters(
    session_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)
):
    session = db.get(SparringSession, session_id)
    if session is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Sparring session not found")
    if session.post.author_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not your session")

    out = []
    for req in session.requests:
        u = req.requester
        if u.account_type == AccountType.fighter and u.fighter_profile:
            fp = u.fighter_profile
            name = f"{fp.first_name} {fp.last_name}"
            pic = fp.profile_picture_url
        else:
            name = u.email
            pic = None
        out.append(
            SparringRequesterOut(
                request_id=req.id,
                status=req.status,
                requester_user_id=u.id,
                requester_display_name=name,
                requester_profile_picture_url=pic,
            )
        )
    return out


@router.post("/sparring-requests/{request_id}/accept")
def accept_request(request_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    req = _owned_request(request_id, current_user, db)
    req.status = SparringRequestStatus.accepted
    db.commit()
    return {"status": "accepted"}


@router.post("/sparring-requests/{request_id}/decline")
def decline_request(request_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    req = _owned_request(request_id, current_user, db)
    req.status = SparringRequestStatus.declined
    db.commit()
    return {"status": "declined"}


def _owned_request(request_id: int, current_user: User, db: Session) -> SparringRequest:
    req = db.get(SparringRequest, request_id)
    if req is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Request not found")
    if req.sparring_session.post.author_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not your session")
    return req
