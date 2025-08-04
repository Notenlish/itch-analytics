from bs4 import BeautifulSoup
import requests
from utils import clean_text
from scraper import Scraper

scraper = Scraper()
results = scraper.scrape_game_page(
    "https://robomarchello.itch.io/mediocre-game-with-golf-like-gameplay-in-space"
)
print(results)
print("-" * 20)
res = requests.get(
    "https://robomarchello.itch.io/mediocre-game-with-golf-like-gameplay-in-space"
)
soup = BeautifulSoup(res.content, "html.parser", from_encoding="utf-8")
t = soup.select(".formatted_description")[0].get_text(separator="\n")

print(t)
