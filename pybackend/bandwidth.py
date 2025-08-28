from datetime import datetime
import time as time_sleeper


class BandwidthLimiter:
    def __init__(self, limit_mbps: float) -> None:
        self.limit_bytes_per_second = limit_mbps * (1024**2)
        self.start_time = datetime.now()
        self.bytes_transferred = 0
        self.total_transferred = 0

    def add_bytes(self, bytes_count: int):
        self.bytes_transferred += bytes_count
        self.total_transferred += bytes_count
        self.check_and_limit()

    def check_and_limit(self):
        elapsed_time = (datetime.now() - self.start_time).total_seconds()
        if elapsed_time > 0:
            current_rate = self.bytes_transferred / elapsed_time
            if current_rate > self.limit_bytes_per_second:
                delay_needed = (
                    self.bytes_transferred / self.limit_bytes_per_second
                ) - elapsed_time
                if delay_needed > 0:
                    print(
                        f"INFO: Bandwidth limit exceeded. Pausing for {delay_needed:.2f} seconds."
                    )
                    time_sleeper.sleep(delay_needed)
                    self.start_time = datetime.now()
                    self.bytes_transferred = 0
