from contextlib import asynccontextmanager
from fastapi import FastAPI, BackgroundTasks, Depends
from pydantic import BaseModel
import pydantic
from sqlmodel import Session, select
from models import (
    Game,
    GameJam,
    JamGame,
    User,
    # Comment,
    create_db_and_tables,
    get_session,
)
from extract import Extractor, get_extractor


@asynccontextmanager
async def lifespan(app: FastAPI):
    # startup
    create_db_and_tables()
    # take requests
    yield
    # shutdown


class JamRequest(BaseModel):
    url: str


def long_scrape_jam_task(
    url: str,
    session: Session,
    extractor: Extractor,
):
    print("starting long scrape jam task for", url)
    extractor.find_entries_json(url, session)


app = FastAPI(lifespan=lifespan)


@app.post("/api/get-jam")
def get_jam(
    jam: JamRequest,
    background_tasks: BackgroundTasks,
    session: Session = Depends(get_session),
    extractor: Extractor = Depends(get_extractor),
):
    background_tasks.add_task(long_scrape_jam_task, jam.url, session, extractor)
    return {"message": "Scraping started in background"}
