from datetime import datetime
from bandwidth import BandwidthLimiter


class Stats:
    def __init__(self):
        self.bandwidth_used: float = 0
        self.time_spent: float = 0
        self.total_pages_crawled: int = 0
        self.total_games_crawled: int = 0
        self.game_pages_crawled: int = 0
        self.jamgame_pages_crawled: int = 0
        self.profile_pages_crawled: int = 0
        self.start_time: datetime | None = None
        self.end_time: datetime | None = None

    def final_stats(self, bandwidth_limiter: BandwidthLimiter):
        self.bandwidth_used = float(bandwidth_limiter.total_transferred)

        self.start_time = self.start_time or datetime.now()
        self.end_time = self.end_time or datetime.now()  # meh
        self.time_spent = self.end_time.timestamp() - self.start_time.timestamp()

        print(f"Started scrape at {self.start_time} and ended it on {self.end_time}")
        print(
            f"Used {self.bandwidth_used:.2} megabytes. Avg of {self.bandwidth_used / self.total_games_crawled:.2} mb per game and {self.bandwidth_used / self.total_pages_crawled:.2} mb per page"
        )
        print(
            f"Spent a total of {self.time_spent} seconds with {self.time_spent / self.total_games_crawled} seconds per game"
        )
        print(
            f"Crawled {self.total_pages_crawled} pages, {self.game_pages_crawled} game pages, {self.jamgame_pages_crawled} jamgame pages, {self.profile_pages_crawled}"
        )
