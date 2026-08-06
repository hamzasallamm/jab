import enum


class AccountType(str, enum.Enum):
    fighter = "fighter"
    gym = "gym"


class Sport(str, enum.Enum):
    boxing = "boxing"
    mma = "mma"
    bjj = "bjj"


class FighterStatus(str, enum.Enum):
    pro = "pro"
    amateur = "amateur"


class ConnectionStatus(str, enum.Enum):
    pending = "pending"
    accepted = "accepted"
    declined = "declined"


class PostType(str, enum.Enum):
    fight_result = "fight_result"
    sparring_session = "sparring_session"
    text = "text"


class FightOutcome(str, enum.Enum):
    win = "win"
    loss = "loss"
    draw = "draw"
    no_contest = "no_contest"


class SparringRequestStatus(str, enum.Enum):
    pending = "pending"
    accepted = "accepted"
    declined = "declined"
