from models import get_session, GameJam, JamGame, Criteria
from sqlmodel import select, Session, desc
from utils import competitive_ranking

# adds the rankings back to the jamgames.

gamejam_id = 385727

session = next(get_session())

jamgames = session.exec(
    select(JamGame)
    .where(JamGame.gamejam_id == gamejam_id)
    .order_by(JamGame.score.desc())
).all()
arr = [jamgame.score for jamgame in jamgames]
ranks = competitive_ranking(arr)
for i, rank in enumerate(ranks):
    jamgame = jamgames[i]
    jamgame.rank = rank

session.commit()
