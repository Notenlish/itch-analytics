from datetime import datetime
import json
from bs4 import BeautifulSoup

from bandwidth import BandwidthLimiter
from utils import (
    clean_text,
    get_download_info_from_tags,
    send_get_request,
)
import json


class Scraper:
    def __init__(self, bandwidth_limiter: BandwidthLimiter):
        self.bandwidth_limiter = bandwidth_limiter

    def scrape_jam_page(self, url: str):
        print(f"Scraping jam page {url}")
        res = send_get_request(
            url, bandwidth_limiter=self.bandwidth_limiter, timeout_base=10
        )
        if res is None:
            return None
        soup = BeautifulSoup(res.content, "html.parser", from_encoding="utf-8")
        stats_container = soup.select(".stats_container")[0]
        stats = {}
        for stat_box in stats_container.select(".stat_box"):
            value = stat_box.select(".stat_value")[0].text.strip().lower()
            label = stat_box.select(".stat_label")[0].text.strip().lower()
            stats[label] = value

        jam_banner_outer_tag = soup.select(".jam_banner_outer")[0]
        jam_logo_src = jam_banner_outer_tag.select("img.jam_banner")[0]["src"]

        jam_title_header_tag = soup.select(".jam_title_header")[0]
        jam_title = jam_title_header_tag.text

        all_scripts = soup.select("script")
        data_from_script = {}
        for script in all_scripts:
            if "new I.ViewJam(" in script.text:
                t = script.text.strip()
                t = t[t.find("{") :]
                t = t[: t.find("}")] + "}"
                # print("found json:", t)
                data_from_script = json.loads(t)
                data_from_script["end_date"] = datetime.strptime(
                    data_from_script["end_date"], "%Y-%m-%d %H:%M:%S"
                )
                data_from_script["start_date"] = datetime.strptime(
                    data_from_script["start_date"], "%Y-%m-%d %H:%M:%S"
                )
                data_from_script["voting_end_date"] = datetime.strptime(
                    data_from_script["voting_end_date"], "%Y-%m-%d %H:%M:%S"
                )
                break
        # print("Here is the data from the JSON:", data_from_script)

        return {
            "entries_count": stats.get("entries"),
            "ratings_count": stats.get("ratings"),
            "joined_count": stats.get("jouined"),
            "end_date": data_from_script["end_date"],
            "start_date": data_from_script["start_date"],
            "voting_end_date": data_from_script["voting_end_date"],
            "id": data_from_script["id"],
            "logo": jam_logo_src,
            "title": jam_title,
        }

    def scrape_submissions_page(self, url: str):
        print("Fetching submissions page:", url)
        res = send_get_request(
            url, bandwidth_limiter=self.bandwidth_limiter, timeout_base=10
        )
        if res is None:
            raise Exception("Couldnt fetch submissions page.")
        soup = BeautifulSoup(res.content, "html.parser", from_encoding="utf-8")
        found = False
        entries_url: str | None = None
        for script_tag in soup.find_all("script"):
            if '"entries_url"' in script_tag.text:
                t = script_tag.text
                t = (
                    t.split('"entries_url":')[1]
                    .split(',"submitted_games"')[0]
                    .split('","')[0]
                    .replace('"', "")
                    .replace("\\/", "/")
                )
                entries_url = "https://itch.io" + t
                if not isinstance(entries_url, str):
                    raise Exception("Entries url isnt string. my lsp is weird.")
                entries_url = entries_url.split("}),")[0]
                # print("entries url is", entries_url)
                found = True
        if not found or entries_url is None:
            raise Exception("Couldn't find entries.json")
        return entries_url

    def scrape_user_page(self, url: str):
        print("Fetching user page:", url)
        res = send_get_request(
            url, bandwidth_limiter=self.bandwidth_limiter, timeout_base=10
        )
        if res is None:
            return None

        t = res.text
        if "new I.UserPage(" in t:
            t = res.text.split("new I.UserPage(")[1]
        t = t.split("});init_UserProfileHeader")[0]
        if '{"user_id":' in t:
            t = t.split('{"user_id":')[1]
        t = t.split("});\nI.setup_page();")[0]
        if "user_id:" in t:
            t = t.split("user_id: ")[1]
            t = t.split(",")[0]
        if "I.libs.react.done(function(){" in t:
            if ',"user_id":' in t:
                t = t.split(',"user_id":')[1]
            if ',"name":' in t:
                t = t.split(',"name":')[0]
            if "," in t:
                t = t.split(",")[0]
            t = t.split("})")[0]
        t = t.split(',"')[0]
        t = t.split("})")[0]

        id_str = t

        try:
            id = int(id_str)
        except ValueError:
            print("ERROR: Couldnt convert to int in user scraper.")
            print("Here is the original string: ", res.text)
            print("Retrying...")

            print("Trying again...")
            t = res.text
            if "new I.UserPage(" in t:
                t = t.split("new I.UserPage(")[1]
            if "," in t:
                index = t.find(",")
                t = t[index + 1 :]
                print("t2", t)
            if ");" in t:
                index = t.find(");")
                t = t[:index]
                print("t3", t)

            print("trying to strip t:", t)
            t = t.strip()
            t_data = json.loads(t)
            id = t_data["user_id"]
            if isinstance(id, str):
                id = int(id)
            elif isinstance(id, int):
                pass
            else:
                print("id is of type", type(id))
                raise Exception()

        soup = BeautifulSoup(res.content, "html.parser", from_encoding="utf-8")
        tag = soup.select("#profile_header h1")
        if tag:
            # print("found h1 tag", tag)
            name = tag[0].text
        else:
            tag = soup.select(".stat_header_widget .text_container h2")
            name = tag[0].text

        # TODO: possible to fetch all the games of the user here, but I wont be doing this for now.
        scraped_data = {"id": id, "name": name}
        return scraped_data

    def _scrape_comments(self, soup: BeautifulSoup):
        comments = []
        for comment_tag in soup.select(".community_post"):
            header = comment_tag.select(".post_header")[0]
            author_submitted = False
            header_author_flag = header.select("span.author_flag")
            if header_author_flag:
                header_author_flag = header_author_flag[0]
                if header_author_flag.text.strip().lower() in (
                    "submitted",
                    "developer",
                ):
                    author_submitted = True
            comment_date = datetime.strptime(
                str(comment_tag.select(".post_date")[0]["title"]),
                "%Y-%m-%d %H:%M:%S",
            )
            comment_content = comment_tag.select(".post_content .post_body")[0].text
            comment_id = int(str(comment_tag["id"]).replace("post-", ""))

            comments.append(
                {
                    "author_submitted": author_submitted,
                    "date": comment_date,
                    "id": comment_id,
                    "content": comment_content,
                }
            )
        return comments

    def scrape_jamgame_page(self, url: str):
        print(f"Sending request to {url} - jamgame page.")
        res = send_get_request(
            url, bandwidth_limiter=self.bandwidth_limiter, timeout_base=10
        )

        if res is None:
            return None

        screenshots = []
        soup = BeautifulSoup(res.content, "html.parser", from_encoding="utf-8")

        ## Screenshots
        screenshot_tags = soup.select(".game_screenshots .screenshot")
        if screenshot_tags:
            for tag in screenshot_tags:
                screenshots.append(
                    {"src": tag["src"], "id": int(str(tag["data-screenshot_id"]))}
                )

        ## Responses
        responses = []
        field_responses_tag = soup.select(".field_responses")
        if field_responses_tag:
            # get all the elements with a depth of 1.
            response_tags = soup.select(".field_responses > *")

            key = None
            value = None
            for response_tag in response_tags:
                if response_tag.name == "p":
                    key = response_tag.select("strong")[0].text
                    other_text_exists = response_tag.text.replace(key, "").strip() != ""
                    if other_text_exists:
                        value = response_tag.text.replace(key, "")
                    else:
                        # this is a <p> that only has the key. The value is in the next
                        # response_tag, the text within the <strong> tag
                        continue
                elif response_tag.name == "div":
                    value = response_tag.select("strong")[0].text
                if key and value:
                    responses.append({key: value})
                    key = None
                    value = None
            # print("Got all responses:", responses)

        ## Download Items
        # I commented this out since itch.io hides download items if youre unauthenticated.
        # I will scrape download items from game page instead.
        # with open("debug.txt", "w", encoding="utf-8") as f:
        #     f.write(soup.prettify())
        # download_tags = soup.select(".game_downloads upload")

        game_page_link = ""
        game_page_link_elements = soup.select(".responsive_column .forward_link")
        if len(game_page_link_elements) > 0:
            game_page_link = game_page_link_elements[0]["href"]
        else:
            print(f"WARNING: Couldn't find an gamepage link element in {url}")

        ## Comments
        comments = []
        soup_for_comments = soup
        while True:
            # print("working on scraping comments")
            scraped_all_comments = True
            nextlink = ""
            comments.extend(self._scrape_comments(soup_for_comments))
            topic_pager_links = soup_for_comments.select(".topic_pager a.page_link")
            if topic_pager_links:
                for tpl in topic_pager_links:
                    if tpl.text.strip().lower() == "next page":
                        nextlink = "https://itch.io" + str(tpl["href"])
                        scraped_all_comments = False
            if scraped_all_comments:
                # print("scraped all comments, breaking out of loop.")
                break
            else:
                # print("DEBUG: getting url for the next page containing comments")
                res = send_get_request(
                    nextlink, bandwidth_limiter=self.bandwidth_limiter, timeout_base=10
                )
                if res is None:
                    break  # comments were deleted while fetching that spesific page, assume all comments are fetched.
                soup_for_comments = BeautifulSoup(
                    res.content, "html.parser", from_encoding="utf-8"
                )
        result = {
            "screenshots": screenshots,
            "field_responses": responses,
            "comments": comments,
            "page_link": game_page_link,
        }
        return result

    def scrape_game_page(self, url: str):
        res = send_get_request(
            url, bandwidth_limiter=self.bandwidth_limiter, timeout_base=10
        )
        if res is None:
            return None
        soup = BeautifulSoup(res.content, "html.parser", from_encoding="utf-8")

        # game logo
        header_tag = soup.select("#header")
        game_logo = ""
        if header_tag:
            if header_tag[0].select("img"):
                game_logo = header_tag[0].select("img")[0]["src"]

        # iframe
        iframe_tag = soup.select(".game_frame")
        iframe_width, iframe_height = 0, 0
        if iframe_tag:
            iframe_width = int(str(iframe_tag[0]["data-width"]))
            iframe_height = int(str(iframe_tag[0]["data-height"]))

        # description
        description_tag = soup.select(".formatted_description")
        description = ""
        if description_tag:
            description = clean_text(
                str(description_tag[0].get_text(separator="\n").strip())
            )

        # metadata
        metadata = {}
        metadata_panel = soup.select(".info_panel_wrapper table")
        if metadata_panel:
            for tr_el in metadata_panel[0].select("tr"):
                items = tr_el.select("td")
                key = str(items[0].text).lower().strip()
                value = str(items[1].text).lower().strip()
                if key in (
                    "platforms",
                    "authors",
                    "genre",
                    "made with",
                    "tags",
                    "inputs",
                ):
                    value = value.replace(" ", "")
                metadata[key] = value

        download_tags = soup.select(".upload_list_widget .upload")
        download_info = get_download_info_from_tags(download_tags)

        # comments

        comments = []
        comment_tags = soup.select(".community_post")
        for comment_tag in comment_tags:
            comment_id = int(str(comment_tag["id"]).replace("post-", ""))

            comment_content = comment_tag.select(".post_content .post_body")[
                0
            ].get_text()
            comment_content = clean_text(comment_content)

            comment_date = datetime.strptime(
                str(comment_tag.select(".post_date")[0]["title"]),
                "%Y-%m-%d %H:%M:%S",
            )
            comments.append(
                {"id": comment_id, "content": comment_content, "date": comment_date}
            )
        return {
            "logo": game_logo,
            "iframe_width": iframe_width,
            "iframe_height": iframe_height,
            "description": description,
            "metadata": metadata,
            "download_info": download_info,
            "comments": comments,
        }
