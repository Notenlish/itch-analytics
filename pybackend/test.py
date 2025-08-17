from scraper import Scraper
from bandwidth import BandwidthLimiter

bandwidth_limiter = BandwidthLimiter(1)

scraper = Scraper(bandwidth_limiter)


result = scraper.scrape_user_page("https://terresquall.itch.io")

print(result)

