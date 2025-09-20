from contextlib import asynccontextmanager
from fastapi import FastAPI, BackgroundTasks, Depends
from pydantic import BaseModel
from sqlmodel import Session
from stats import Stats
from models import (
    create_db_and_tables,
    get_session,
)
from extract import Extractor, get_extractor
from datetime import datetime


from fastapi_amis_admin.admin.settings import Settings
from fastapi_amis_admin.admin.site import AdminSite
from fastapi_scheduler import SchedulerAdmin

from apscheduler.schedulers.asyncio import AsyncIOScheduler

admin_site = AdminSite(
    settings=Settings(database_url_async="sqlite+aiosqlite:///amisadmin.db")
)
scheduler = SchedulerAdmin.bind(admin_site)

print("scheduling job.")


@scheduler.scheduled_job("interval", seconds=60)  # TODO: for prod use every hour.
def interval_task_historical():
    """For fetching data for historical data tracking"""
    print('interval task is run...')
    pass

@scheduler.scheduled_job("interval", seconds=60*60)  # TODO: for prod use every hour.
def interval_task_historical2():
    """For fetching data for historical data tracking"""
    print('interval task is run...')
    _discover_jam_task()


@asynccontextmanager
async def lifespan(app: FastAPI):
    # startup
    create_db_and_tables()

    # why is this giving a problem??
    scheduler.start()
    # take requests
    yield
    # shutdown


class JamRequest(BaseModel):
    url: str


class DiscoverRequest(BaseModel):
    pass


def long_scrape_jam_task(
    url: str,
):
    from models import engine
    from extract import get_extractor
    import traceback
    from sqlmodel import Session

    stats = Stats()

    print("MAIN: INFO: starting long scrape jam task for", url)
    try:
        with Session(engine) as session:
            extractor = get_extractor()
            stats.start_time = datetime.now()
            extractor.find_entries_json(url, session, stats)
    except Exception as e:
        print(
            f"MAIN: ERROR: Background scrape failed with this starting scrape url: {url} - Here is the error: {e}"
        )
        traceback.print_exc()


def _discover_jam_task():
    from models import engine
    from extract import get_extractor
    import traceback
    from sqlmodel import Session

    stats = Stats()
    print("MAIN: INFO: discovering jams")
    try:
        with Session(engine) as session:
            extractor = get_extractor()
            stats.start_time = datetime.now()
            extractor.discover_jams(session, stats)
    except Exception as e:
        print(
            f"MAIN: ERROR: Background scrape failed with this discovering jams - Here is the error: {e}"
        )
        traceback.print_exc()


app = FastAPI(
    lifespan=lifespan,
)
admin_site.mount_app(app)


@app.post("/api/get-jam")
def get_jam(
    jam: JamRequest,
    background_tasks: BackgroundTasks,
    session: Session = Depends(get_session),
    extractor: Extractor = Depends(get_extractor),
):
    print("responding to request to /api/get-jam")
    background_tasks.add_task(long_scrape_jam_task, jam.url)
    return {"message": "Scraping started in background"}


@app.post("/api/discover-jams")
def discover_jams_manually(
    a: DiscoverRequest,
    background_tasks: BackgroundTasks,
    session: Session = Depends(get_session),
    extractor: Extractor = Depends(get_extractor),
):
    print("responding to request to /api/discover-jams")
    background_tasks.add_task(_discover_jam_task)
    return {"message":"manually discovering jams"}
