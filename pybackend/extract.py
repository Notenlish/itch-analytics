from datetime import datetime
import random

from sqlmodel import Session, select
from models import (
    Criteria,
    DownloadItem,
    GameComment,
    GameJam,
    JamGame,
    MetadataEntry,
    Screenshot,
    User,
    Game,
    JamComment,
)
from utils import send_get_request
from scraper import Scraper
from bandwidth import BandwidthLimiter
import json
import time as time_sleeper


class Extractor:
    def __init__(self):
        self.bandwidth_limiter = BandwidthLimiter(limit_mbps=1)
        self.scraper = Scraper(bandwidth_limiter=self.bandwidth_limiter)

    def find_entries_json(self, url: str, session: Session):
        jam_page_url = url.split("/rate/")[0]
        gamejam = self.extract_jam_page(jam_page_url, session)

        print("finding entries json of", url)
        # https://itch.io/jam/godot-wild-jam-72/rate/2902486 --> https://itch.io/jam/godot-wild-jam-72/entries
        submissions_url = url.split("/rate/")[0] + "/entries"
        entries_json_url = self.scraper.scrape_submissions_page(submissions_url)
        results_json_url = entries_json_url.replace("entries.json", "results.json")

        print("found entries json url", entries_json_url)

        res = send_get_request(
            entries_json_url, self.bandwidth_limiter, timeout_base=15
        )
        if res is None:
            print("ERROR: Couldn't fetch entries.json. Quitting...")
            raise Exception(f"Couldnt fetch entries.json: {entries_json_url}")
        data = json.loads(res.text)

        self.extract_entries_json(gamejam, data, session)
        session.commit()

        res = send_get_request(
            results_json_url, self.bandwidth_limiter, timeout_base=15
        )
        if res is None:
            print(
                "WARNING: Couldn't fetch results.json. Skipping results json processing"
            )
        else:
            data = json.loads(res.text)
            self.extract_results_json(gamejam, data, session)
        print("FINALLY. DONEEEEEE.")

    def extract_jam_page(self, url: str, session: Session):
        results = self.scraper.scrape_jam_page(url)
        if results is None:
            raise Exception("Couldn't fetch jam page, quitting...", url)
        statement = select(GameJam).where(GameJam.id == results["id"])
        gamejam = session.exec(statement).first()
        if gamejam is None:
            gamejam = GameJam(
                id=results["id"],
                logo=results["logo"],
                title=results["title"],
                url=url,
                entries_count=results["entries_count"],
                ratings_count=results["ratings_count"],
                joined_count=results["joined_count"],
                start_date=results["start_date"],
                end_date=results["end_date"],
                voting_end_date=results["voting_end_date"],
            )
            session.add(gamejam)
        else:
            gamejam.start_date = results["start_date"]
            gamejam.end_date = results["end_date"]
            gamejam.logo = results["logo"]
            gamejam.title = results["title"]
            gamejam.url = url
            gamejam.voting_end_date = results["voting_end_date"]
            gamejam.joined_count = results["joined_count"]
            gamejam.entries_count = results["entries_count"]
            gamejam.ratings_count = results["ratings_count"]
        return gamejam

    def extract_entries_json(self, gamejam: GameJam, data: dict, session: Session):
        print("extracting entries json.")
        num_of_obj = len(data["jam_games"])
        saved_num_of_obj = 0
        for i, obj in enumerate(data["jam_games"]):
            print(
                f"{i / num_of_obj * 100:.5f}% - working on obj::", obj["game"]["title"]
            )

            statement = select(User).where(User.id == obj["game"]["user"]["id"])
            user = session.exec(statement).first()
            if user is None:
                created_user = User(
                    id=obj["game"]["user"]["id"],
                    name=obj["game"]["user"]["name"],
                    url=obj["game"]["user"]["url"],
                )
                session.add(created_user)
                user = created_user
                # print("created user:", created_user.name)
            else:
                pass
                # print("found user:", user.name)

            # print(
            #    f"DEBUG: Before trying to select game from db using {obj['game']['id']}"
            # )

            jam_rate_url = "https://itch.io" + obj["url"]
            # before creating game object, first check the jamgame page to get some extra data.
            jampage_scrape_results = self.scraper.scrape_jamgame_page(jam_rate_url)
            if jampage_scrape_results is None:
                print(
                    "WARNING: Couldnt fetch jamgame page, skipping this entry object.",
                    jam_rate_url,
                )
                continue
            time_sleeper.sleep(random.uniform(0, 1))
            gamepage_scrape_results = self.scraper.scrape_game_page(
                jampage_scrape_results["page_link"]
            )
            if gamepage_scrape_results is None:
                print(
                    "WARNING: Couldnt fetch game page, skipping this entry object.",
                    jampage_scrape_results["page_link"],
                )
                continue
            time_sleeper.sleep(random.uniform(0, 1))
            # print(f"JAMPAGE scrape results: {jampage_scrape_results}")

            statement = select(Game).where(Game.id == obj["game"]["id"])
            game = session.exec(statement).first()
            # print(f"DEBUG: After selecting Game, found: {game is not None}")
            cover_color = obj["game"].get("cover_color")
            gif_cover = obj["game"].get("gif_cover")
            platforms = obj["game"].get("platforms")
            short_text = obj["game"].get("short_text")

            if platforms:
                # get rid of any possible , present in platforms
                platforms = [p.replace(",", "_") for p in platforms]
                platforms = ",".join(platforms)

            if game is None:
                contributors_list = []

                if obj.get("contributors"):
                    # print("obj has contributors.")
                    for contributor_obj in obj["contributors"]:
                        # print(f"Working on contributor {contributor_obj['name']}")
                        # Scrape the individual pages of the users to get their user ids
                        scraped_contributor_data = self.scraper.scrape_user_page(
                            contributor_obj["url"]
                        )

                        if (
                            scraped_contributor_data
                            and "id" in scraped_contributor_data
                        ):
                            pass
                            # print("scraped contributor", contributor_obj["name"])
                        else:
                            print(
                                "WARNING! Received invalid scrape data from scraper for the contributor."
                            )
                            continue

                        statement = select(User).where(
                            User.id == scraped_contributor_data["id"]
                        )
                        contributor = session.exec(statement).first()
                        if contributor is None:
                            contributor = User(
                                id=scraped_contributor_data["id"],
                                url=contributor_obj["url"],
                                name=scraped_contributor_data["name"],
                            )
                            session.add(contributor)
                        contributors_list.append(contributor)

                # print("DEBUG: Before creating new Game instance")
                game = Game(
                    id=obj["game"]["id"],
                    cover=obj["game"]["cover"],
                    cover_color=cover_color,
                    title=obj["game"]["title"],
                    url=obj["game"]["url"],
                    user=user,
                    user_id=user.id,
                    contributors=contributors_list,
                    platforms=platforms,
                    short_text=short_text,
                    gif_cover=gif_cover,
                    logo=gamepage_scrape_results["logo"],
                    iframe_width=gamepage_scrape_results["iframe_width"],
                    iframe_height=gamepage_scrape_results["iframe_height"],
                    description=gamepage_scrape_results["description"],
                )
                # print("DEBUG: After creating new Game instance")
                session.add(game)
                # print(f"DEBUG: Added created game {game.title} to session")
            else:  # game obj exists already
                game.cover = obj["game"]["cover"]
                game.title = obj["game"]["title"]
                game.cover_color = cover_color
                game.url = obj["game"]["url"]
                game.platforms = platforms
                game.short_text = short_text
                game.gif_cover = gif_cover
                game.logo = gamepage_scrape_results["logo"]
                game.iframe_width = gamepage_scrape_results["iframe_width"]
                game.iframe_height = gamepage_scrape_results["iframe_height"]
                game.description = gamepage_scrape_results["description"]
                # print("found game", game.title)

            ### Screenshot stuff
            for sc_obj in jampage_scrape_results["screenshots"]:
                statement = select(Screenshot).where(Screenshot.id == sc_obj["id"])
                sc = session.exec(statement).first()  # error happens here.
                if sc is None:  # not found
                    sc = Screenshot(
                        id=sc_obj["id"], src=sc_obj["src"], game=game, game_id=game.id
                    )
                    session.add(sc)
                else:
                    sc.src = sc_obj["src"]
            ### Download Items
            for dobj in session.exec(
                select(DownloadItem).where(DownloadItem.game_id == game.id)
            ):
                session.delete(dobj)  # delete all past download item objects.
            for download_item_obj in gamepage_scrape_results["download_info"]:
                di = DownloadItem(
                    name=download_item_obj["name"],
                    size=download_item_obj["size"],
                    platforms=download_item_obj["platforms"],
                    date=download_item_obj["date"],
                    game_id=game.id,
                    game=game,
                    external=download_item_obj["external"],
                )
                session.add(di)
            # Field Responses are stored as json in a column.

            ### MetadataEntry
            for metadata_key, metadata_value in gamepage_scrape_results[
                "metadata"
            ].items():
                # if I use 'and' instead of '&' it doesnt work.
                statement = select(MetadataEntry).where(
                    (MetadataEntry.key == metadata_key)
                    & (MetadataEntry.game_id == game.id)
                )
                metadata = session.exec(statement).first()
                if metadata:
                    metadata.value = metadata_value
                else:
                    metadata = MetadataEntry(
                        key=metadata_key,
                        value=metadata_value,
                        game_id=game.id,
                        game=game,
                    )
                    session.add(metadata)

            ### Game Comments
            print("Getting GAMECOMMENTS...")
            for gamecomment_obj in gamepage_scrape_results["comments"]:
                # print("WORKING ON GAMECOMMENT", gamecomment_obj)
                statement = select(GameComment).where(
                    GameComment.id == gamecomment_obj["id"]
                )
                gamecomment = session.exec(statement).first()
                if gamecomment is None:
                    # print("COULDNT FIND GAMECOMMENT")
                    gamecomment = GameComment(
                        id=gamecomment_obj["id"],
                        content=gamecomment_obj["content"],
                        date=gamecomment_obj["date"],
                        game_id=game.id,
                        game=game,
                    )
                    session.add(gamecomment)
                else:
                    # print("FOUND GAMECOMMENT, UPDATING...")
                    gamecomment.date = gamecomment_obj["date"]
                    gamecomment.content = gamecomment_obj["content"]

            statement = select(JamGame).where(JamGame.id == obj["id"])
            jamgame = session.exec(statement).first()
            if jamgame is None:
                # create JamGame
                jamgame = JamGame(
                    id=obj["id"],
                    url=jam_rate_url,
                    coolness=obj["coolness"],
                    title=obj["game"]["title"],
                    rating_count=obj["rating_count"],
                    created_at=datetime.strptime(
                        obj["created_at"], "%Y-%m-%d %H:%M:%S"
                    ),
                    game_id=game.id,
                    game=game,
                    user_id=user.id,
                    user=user,
                    gamejam_id=gamejam.id,
                    gamejam=gamejam,
                    raw_score=-1,
                    rank=-1,
                    score=-1,
                )
                session.add(jamgame)
                # print("DEBUG: Successfully added new JamGame to session")
            else:
                # update jamgame
                jamgame.url = jam_rate_url
                jamgame.coolness = obj["coolness"]
                jamgame.title = obj["game"]["title"]
                jamgame.rating_count = obj["rating_count"]
                jamgame.game_id = game.id
                jamgame.user_id = user.id
                jamgame.gamejam_id = gamejam.id
                jamgame.gamejam = gamejam

                # print(f"found jamgame {jamgame.title} and updated it. ")

            ### Jam Comments
            for comment_obj in jampage_scrape_results["comments"]:
                statement = select(JamComment).where(JamComment.id == comment_obj["id"])
                comment = session.exec(statement).first()
                if comment is None:
                    comment = JamComment(
                        id=comment_obj["id"],
                        content=comment_obj["content"],
                        author_submitted=comment_obj["author_submitted"],
                        date=comment_obj["date"],
                        jamgame_id=jamgame.id,
                        jamgame=jamgame,
                    )
                    session.add(comment)
                else:
                    comment.content = comment_obj["content"]
                    comment.author_submitted = comment_obj["author_submitted"]
                    comment.date = comment_obj["date"]

            ## RESULTS
            for result_obj in jampage_scrape_results["results"]:
                statement = select(Criteria).where(
                    (Criteria.jamgame_id == obj["id"])
                    & (Criteria.name == result_obj["name"])
                )
                criteria = session.exec(statement).first()
                if criteria:
                    criteria.rank = result_obj["rank"]
                    criteria.score = result_obj["score"]
                    criteria.raw_score = result_obj["raw_score"]
                else:
                    criteria = Criteria(
                        score=result_obj["score"],
                        raw_score=result_obj["raw_score"],
                        rank=result_obj["rank"],
                        name=result_obj["name"],
                        jamgame_id=obj["id"],
                    )
                    session.add(criteria)

            # finished processing for this game_obj
            saved_num_of_obj += 1
        session.commit()  # save changes to db

        print(
            f"INFO: Was able to scrape {saved_num_of_obj} out of {num_of_obj} - {saved_num_of_obj / num_of_obj * 100:.3f}% scraped."
        )
        print("Session committed successfully.")
        print("Done.")

    def extract_results_json(self, gamejam: GameJam, data: dict, session: Session):
        print("extracting results.json")
        num_of_obj = len(data["results"])
        for i, obj in enumerate(data["results"]):
            print(
                f"{i / num_of_obj * 100:.5f}% - working on results for {obj['title']}"
            )
            statement = select(JamGame).where(
                (JamGame.game_id == obj["id"]) & (JamGame.url == obj["url"])
            )
            # even if they change the url, the url in the entries.json would have also changed. so no worries ig.
            jamgame = session.exec(statement).first()
            if not jamgame:
                # the game was probably hidden(404) so it couldnt be added to the database.
                # therefore we cant process it here.
                print(
                    f"WARNING: The {obj['title']} game couldnt be found, most likely a 404 prevented it from being added to DB. Skipping the object."
                )
                continue
            if obj.get("raw_score"):
                jamgame.raw_score = obj["raw_score"]
            if obj.get("score"):
                jamgame.score = obj["score"]
            jamgame.rating_count = obj["rating_count"]
            jamgame.rank = obj["rank"]
            print("working on criteria...")
            for criteria_obj in obj["criteria"]:
                # print(f"finding criteria of {criteria_obj['name']}")
                # The problem in here is that the obj['id'] gives the game id, not the JamGame id.
                # I need to get the jamgame object in some other way.
                statement = select(Criteria).where(
                    (Criteria.jamgame_id == obj["id"])
                    & (Criteria.name == criteria_obj["name"])
                )
                criteria = session.exec(statement).first()
                if criteria:
                    # print(f"Updating criteria: {criteria.name}")
                    criteria.raw_score = criteria_obj["raw_score"]
                    criteria.score = criteria_obj["score"]
                    criteria.rank = criteria_obj["rank"]
                else:
                    criteria = Criteria(
                        score=criteria_obj["score"],
                        raw_score=criteria_obj["raw_score"],
                        rank=criteria_obj["rank"],
                        name=criteria_obj["name"],
                        jamgame_id=obj["id"],
                    )
                    session.add(criteria)
                    # print(f"created criteria: {criteria.name}")
        print("DONE PROCESSING RESULTS. FINALLY.")
        session.commit()


def get_extractor():
    extractor = Extractor()
    return extractor
