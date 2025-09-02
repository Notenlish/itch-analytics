from datetime import datetime
import sqlalchemy
from sqlmodel import (
    Field,
    Relationship,
    SQLModel,
    create_engine,
    Session,
)
import json
from sqlalchemy.types import TypeDecorator, String
from typing import Optional, List, Dict, TYPE_CHECKING


if TYPE_CHECKING:
    from models import Game, JamGame, User


# custom class to be able to save json lists as a column.
class JSONList(TypeDecorator):
    impl = String

    def process_bind_param(self, value: List[Dict], dialect):  # type: ignore
        if value is not None:
            return json.dumps(value)
        return None

    def process_result_value(self, value, dialect):
        if value is not None:
            return json.loads(value)
        return None


class GameContributorLink(SQLModel, table=True):
    game_id: Optional[int] = Field(
        default=None, foreign_key="game.id", primary_key=True
    )
    user_id: Optional[int] = Field(
        default=None, foreign_key="user.id", primary_key=True
    )


class User(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    url: str  # pydantic.HttpUrl
    name: str

    # Note: You do not need <model>_id fields in this model because this is the "one" side of the many-to-one relationship.
    jamgames: List["JamGame"] = Relationship(back_populates="user")
    games: List["Game"] = Relationship(back_populates="user")

    # I need a link class for this many-to-many
    contributed_jamgames: List["Game"] = Relationship(
        back_populates="contributors", link_model=GameContributorLink
    )


class JamGame(SQLModel, table=True):
    title: str
    id: Optional[int] = Field(default=None, primary_key=True)
    coolness: int
    created_at: datetime
    url: str  # pydantic.HttpUrl
    rating_count: Optional[int]

    # Note: You *DO* need <model>_id fields in this model because this is the "many" side of the many-to-one relationship.
    # Used by sql for the actual indexing column.
    user_id: Optional[int] = Field(default=None, foreign_key="user.id")
    user: Optional["User"] = Relationship(back_populates="jamgames")

    # used by SQL as the actual column for the relationship.
    game_id: Optional[int] = Field(foreign_key="game.id")
    game: Optional["Game"] = Relationship(back_populates="jamgames")

    question_responses: List[Dict] = Field(
        sa_column=sqlalchemy.Column(JSONList), default=[]
    )

    # one part in the one-to-many relationship
    comments: list["JamComment"] = Relationship(back_populates="jamgame")

    # many part in the one-to-many relationship.
    gamejam_id: Optional[int] = Field(foreign_key="gamejam.id")
    gamejam: Optional["GameJam"] = Relationship(back_populates="jamgames")

    # gamejam results
    raw_score: Optional[float]
    rank: int
    score: Optional[float]
    criterias: list["Criteria"] = Relationship(back_populates="jamgame")


class Criteria(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    score: float
    rank: int
    raw_score: float
    name: str

    # many part of one-to-many
    jamgame_id: Optional[int] = Field(foreign_key="jamgame.id")
    jamgame: Optional["JamGame"] = Relationship(back_populates="criterias")


class Game(SQLModel, table=True):
    cover: str  # pydantic.HttpUrl
    id: Optional[int] = Field(default=None, primary_key=True)
    title: str
    url: str  # pydantic.HttpUrl
    logo: str
    iframe_width: int
    iframe_height: int

    # Note: You *DO* need <model>_id fields in this model because this is the "many" side of the many-to-one relationship.
    user_id: Optional[int] = Field(foreign_key="user.id")
    user: Optional["User"] = Relationship(back_populates="games")

    short_text: Optional[str]
    gif_cover: Optional[str]  # pydantic.HttpUrl | None
    cover_color: Optional[str]
    platforms: Optional[str]
    screenshots: List["Screenshot"] = Relationship(back_populates="game")
    download_items: List["DownloadItem"] = Relationship(back_populates="game")

    contributors: List["User"] = Relationship(
        back_populates="contributed_jamgames", link_model=GameContributorLink
    )

    # 1 game can be used as multiple jamgames.
    jamgames: List["JamGame"] = Relationship(back_populates="game")

    description: Optional[str]

    comments: List["GameComment"] = Relationship(back_populates="game")
    metadata_entries: List["MetadataEntry"] = Relationship(back_populates="game")


class GameJam(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    logo: str  # pydantic.HttpUrl
    title: str
    url: str  # pydantic.HttpUrl
    entries_count: Optional[int]
    ratings_count: Optional[int]
    joined_count: Optional[int]
    start_date: datetime
    end_date: datetime
    voting_end_date: datetime

    # one part in the one-to-many.
    jamgames: list["JamGame"] = Relationship(back_populates="gamejam")

    historical: list["JamGameHistorical"] = Relationship(back_populates="jamgame")


# not being used right now
class JamGameHistorical(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    popularity: int
    coolness: int
    rating_count: int
    fetch_date: datetime

class JamComment(SQLModel, table=True):
    content: str
    id: Optional[int] = Field(primary_key=True)
    author_submitted: bool
    date: datetime

    author_id: Optional[int] = Field(default=None, foreign_key="user.id")

    # the jamgame that this comment was submitted to.
    jamgame_id: Optional[int] = Field(foreign_key="jamgame.id")
    jamgame: Optional["JamGame"] = Relationship(back_populates="comments")


class GameComment(SQLModel, table=True):
    content: str
    id: Optional[int] = Field(primary_key=True)
    date: datetime

    author_id: Optional[int] = Field(default=None, foreign_key="user.id")

    # the game this was submitted to. many side in one-to-many
    game_id: Optional[int] = Field(foreign_key="game.id")
    game: Optional["Game"] = Relationship(back_populates="comments")


class Screenshot(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    src: str
    game_id: Optional[int] = Field(foreign_key="game.id")
    game: Optional["Game"] = Relationship(back_populates="screenshots")


class DownloadItem(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    name: str
    size: int  # bytes
    platforms: str
    date: Optional[datetime]
    external: bool

    game_id: Optional[int] = Field(foreign_key="game.id")
    game: Optional["Game"] = Relationship(back_populates="download_items")


class MetadataEntry(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    key: Optional[str]
    value: Optional[str]

    game_id: Optional[int] = Field(foreign_key="game.id")
    game: Optional["Game"] = Relationship(back_populates="metadata_entries")


print("creating engine...")
engine = create_engine("sqlite:///database.db", echo=False)


def create_db_and_tables():
    print("creating db and tables. metadata.create_all()")
    SQLModel.metadata.create_all(engine)


def get_session():
    with Session(engine) as session:
        yield session
