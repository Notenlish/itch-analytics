from datetime import datetime, timezone
import re
import html
import unicodedata
import time as time_sleeper
import requests
from bandwidth import BandwidthLimiter
import random


def send_get_request(
    url: str, bandwidth_limiter: BandwidthLimiter, timeout_base=15, max_retries=15
):
    headers = {
        "User-Agent": "ItchAnalytics Scraper/1.0 (Contact: https://notenlish.vercel.app/contact)"
    }

    failed_counter = 0
    res = None

    while failed_counter <= max_retries:
        try:
            # TLDR; this is needed because some profiles, like justin_c.itch.io have ssl certificates not working.
            # dont know why. it just doesnt.
            should_verify = (
                failed_counter < 5
            )  # verify ssl if 1st - 5th try, otherwise disable it.

            res = requests.get(
                url, timeout=timeout_base, headers=headers, verify=should_verify
            )
            res.encoding = "utf-8"

            # track bandwidth
            if bandwidth_limiter:
                bandwidth_limiter.add_bytes(len(res.content))

            res.raise_for_status()

            return res
        except requests.HTTPError as e:
            if e.response is not None:
                status_code = e.response.status_code
                if status_code == 404:
                    print(f"Got 404 for {url}. Skipping.")
                    return None
                elif status_code in (429, 503):
                    # rate limiting / server unavailable
                    backoff_time = min(
                        50 * (2**failed_counter) + random.uniform(0, 5), 3600
                    )
                    print(
                        f"Server responded {status_code} | backoff for {backoff_time:.1f} seconds"
                    )
                    time_sleeper.sleep(backoff_time)
                else:
                    backoff_time = min(
                        10 * (1.5**failed_counter) + random.uniform(0, 3), 3600
                    )
                    print(
                        f"HTTP {status_code} received | backoff for {backoff_time:.1f} seconds"
                    )
                    time_sleeper.sleep(backoff_time)
            failed_counter += 1
            print(f"Retry {failed_counter} / {max_retries} for {url}")
        except requests.RequestException as e:
            print(f"Connection error for {url} : {e}")
            backoff_time = min(9 * (1.5**failed_counter) + random.uniform(0, 4), 3600)
            time_sleeper.sleep(backoff_time)
            failed_counter += 1
            print(
                f"Encountered Error: {e} when fetching {url}. Retry {failed_counter}/{max_retries}."
            )

    raise Exception(f"ERROR! Failed to fetch {url} after {max_retries} attempts.")


def clean_text(text):
    if isinstance(text, bytes):
        text = text.decode("utf-8", errors="replace")

    text = text.replace("\xa0", " ")  # non-breaking space to space
    text = text.replace("\\xa0", " ")

    text = html.unescape(text)  # decode &nbsp; and other HTML entities

    text = unicodedata.normalize("NFKC", text)  # normalize unicode

    return text.strip()


def get_filesize_from_string(s: str) -> int:
    s = s.strip().lower()
    mul = 1  # 1 byte
    if "kib" in s:
        mul = 1024
    if "kb" in s:
        mul = 1000
    if "mib" in s:
        mul = 1024**2
    if "mb" in s:
        mul = 1000**2
    if "gib" in s:
        mul = 1024**3
    if "gb" in s:
        mul = 1000**3
    # itch.io has a limit of 1gb.

    match = re.search(r"[\d.]+", s)
    if match:
        size = float(match.group()) * mul
        return int(size)
    return -1


def get_download_info_from_tags(download_tags):
    download_items = []
    for download_tag in download_tags:
        # print(f"WORKING ON DOWNLOAD TAG {download_tag.text}")
        download_name = download_tag.select(".info_column .upload_name .name")[0].text

        is_external_tag = download_tag.select(".external_label")
        is_external = len(is_external_tag) > 0
        download_size_bytes = -1
        if not is_external:
            download_sizetext_el = download_tag.select(".info_column .file_size")
            if len(download_sizetext_el) == 0:
                print(
                    "WARNING: Skipping this download item as the download_sizetext could not be found."
                )
                continue  # skip this download item.

            # successfully got the download item, continue processing.
            download_sizetext = download_sizetext_el[0].text.lower()
            download_size_bytes = get_filesize_from_string(download_sizetext)

        # you can say
        download_platforms = []
        for download_platform_tag in download_tag.select(
            ".download_platforms > span.icon"
        ):
            if "windows" in str(download_platform_tag["title"]).lower():
                download_platforms.append("windows")
            if "linux" in str(download_platform_tag["title"]).lower():
                download_platforms.append("linux")
            if "macos" in str(download_platform_tag["title"]).lower():
                download_platforms.append("macos")
            if "android" in str(download_platform_tag["title"]).lower():
                download_platforms.append("android")
        download_platforms = ",".join(download_platforms)

        date_tag = download_tag.select(".upload_date abbr")
        download_date = None
        if date_tag:
            download_date_str = str(date_tag[0]["title"])
            download_date = datetime.strptime(download_date_str, "%d %B %Y @ %H:%M UTC")
            download_date = download_date.replace(tzinfo=timezone.utc)

        download_items.append(
            {
                "name": download_name,
                "size": download_size_bytes,
                "platforms": download_platforms,
                "date": download_date,
                "external": is_external,
            }
        )
    return download_items
