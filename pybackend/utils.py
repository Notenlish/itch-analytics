from datetime import datetime, timezone
import re
import html
import unicodedata


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
        print(f"WORKING ON DOWNLOAD TAG {download_tag.text}")
        download_name = download_tag.select(".info_column .upload_name .name")[0].text

        is_external_tag = download_tag.select(".external_label")
        is_external = len(is_external_tag) > 0
        download_size_bytes = -1
        if not is_external:
            download_sizetext = download_tag.select(".info_column .file_size")[
                0
            ].text.lower()
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
