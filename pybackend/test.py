from scraper import Scraper
from bandwidth import BandwidthLimiter
bandwidth_limiter = BandwidthLimiter(1)

scraper = Scraper(bandwidth_limiter)


result = scraper.scrape_game_page("https://pataniskers.itch.io/form-a27")

print(result)