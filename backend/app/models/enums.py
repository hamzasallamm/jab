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
    repost = "repost"


class FightOutcome(str, enum.Enum):
    win = "win"
    loss = "loss"
    draw = "draw"
    no_contest = "no_contest"


class SparringRequestStatus(str, enum.Enum):
    pending = "pending"
    accepted = "accepted"
    declined = "declined"


class MediaType(str, enum.Enum):
    image = "image"
    video = "video"


class BeltColor(str, enum.Enum):
    white = "white"
    blue = "blue"
    purple = "purple"
    brown = "brown"
    black = "black"
