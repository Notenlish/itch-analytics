from contextlib import asynccontextmanager
from fastapi import FastAPI, BackgroundTasks, Depends
from pydantic import BaseModel
from sqlmodel import Session
from models import (
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
):
    from models import engine
    from extract import get_extractor
    import traceback
    from sqlmodel import Session

    print("MAIN: INFO: starting long scrape jam task for", url)
    try:
        with Session(engine) as session:
            extractor = get_extractor()
            extractor.find_entries_json(url, session)
    except Exception as e:
        print(
            f"MAIN: ERROR: Background scrape failed with this starting scrape url: {url} - Here is the error: {e}"
        )
        traceback.print_exc()


app = FastAPI(
    lifespan=lifespan,
)


@app.post("/api/get-jam")
def get_jam(
    jam: JamRequest,
    background_tasks: BackgroundTasks,
    session: Session = Depends(get_session),
    extractor: Extractor = Depends(get_extractor),
):
    background_tasks.add_task(long_scrape_jam_task, jam.url)
    print("responding to request to /api/get-jam")
    return {"message": "Scraping started in background"}
