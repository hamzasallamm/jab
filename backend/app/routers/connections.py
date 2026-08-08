from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import or_
from sqlalchemy.orm import Session

from app.core.deps import get_current_user
from app.database import get_db
from app.models.connection import Connection
from app.models.enums import AccountType, ConnectionStatus, Sport
from app.models.fighter_profile import FighterProfile, FighterSport
from app.models.user import User
from app.schemas.social import ConnectionOut, FighterSummary

router = APIRouter(prefix="/connections", tags=["connections"])


def _require_fighter(user: User) -> None:
    if user.account_type != AccountType.fighter or user.fighter_profile is None:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Fighter account required")


def _to_connection_out(connection: Connection, current_user_id: int) -> ConnectionOut:
    is_requester = connection.requester_id == current_user_id
    other = connection.addressee if is_requester else connection.requester
    return ConnectionOut(
        id=connection.id,
        status=connection.status,
        direction="outgoing" if is_requester else "incoming",
        fighter=FighterSummary.model_validate(other.fighter_profile),
    )


@router.get("/fighters", response_model=list[FighterSummary])
def list_fighters(
    sport: Sport | None = None,
    gym: str | None = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    query = db.query(FighterProfile).filter(FighterProfile.user_id != current_user.id)
    if sport or gym:
        query = query.join(FighterSport)
        if sport:
            query = query.filter(FighterSport.sport == sport)
        if gym:
            query = query.filter(FighterSport.gym.ilike(f"%{gym}%"))
    return query.order_by(FighterProfile.first_name).distinct().limit(100).all()


@router.get("", response_model=list[ConnectionOut])
def list_my_connections(
    status_filter: ConnectionStatus | None = Query(default=None, alias="status"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    query = db.query(Connection).filter(
        or_(Connection.requester_id == current_user.id, Connection.addressee_id == current_user.id)
    )
    if status_filter is not None:
        query = query.filter(Connection.status == status_filter)
    return [_to_connection_out(c, current_user.id) for c in query.all()]


@router.post("/{fighter_user_id}", response_model=ConnectionOut, status_code=status.HTTP_201_CREATED)
def send_connection_request(
    fighter_user_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    _require_fighter(current_user)
    if fighter_user_id == current_user.id:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Cannot connect with yourself")

    target = db.get(User, fighter_user_id)
    if target is None or target.account_type != AccountType.fighter:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Fighter not found")

    existing = (
        db.query(Connection)
        .filter(
            or_(
                (Connection.requester_id == current_user.id) & (Connection.addressee_id == fighter_user_id),
                (Connection.requester_id == fighter_user_id) & (Connection.addressee_id == current_user.id),
            )
        )
        .first()
    )
    if existing is not None:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Connection already exists")

    connection = Connection(requester_id=current_user.id, addressee_id=fighter_user_id)
    db.add(connection)
    db.commit()
    db.refresh(connection)
    return _to_connection_out(connection, current_user.id)


@router.post("/{connection_id}/accept", response_model=ConnectionOut)
def accept_connection(
    connection_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)
):
    connection = _get_incoming_connection(connection_id, current_user, db)
    connection.status = ConnectionStatus.accepted
    db.commit()
    db.refresh(connection)
    return _to_connection_out(connection, current_user.id)


@router.post("/{connection_id}/decline", response_model=ConnectionOut)
def decline_connection(
    connection_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)
):
    connection = _get_incoming_connection(connection_id, current_user, db)
    connection.status = ConnectionStatus.declined
    db.commit()
    db.refresh(connection)
    return _to_connection_out(connection, current_user.id)


@router.delete("/{connection_id}", status_code=status.HTTP_204_NO_CONTENT)
def remove_connection(
    connection_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)
):
    connection = db.get(Connection, connection_id)
    if connection is None or current_user.id not in (connection.requester_id, connection.addressee_id):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Connection not found")
    db.delete(connection)
    db.commit()


def _get_incoming_connection(connection_id: int, current_user: User, db: Session) -> Connection:
    connection = db.get(Connection, connection_id)
    if connection is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Connection not found")
    if connection.addressee_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not your request to respond to")
    return connection
