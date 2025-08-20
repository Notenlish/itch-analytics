from scraper import Scraper
from bandwidth import BandwidthLimiter
import json

bandwidth_limiter = BandwidthLimiter(1)

scraper = Scraper(bandwidth_limiter)


# result = scraper.scrape_user_page("https://terresquall.itch.io")

# print(result)

print("aaa")
i = """
<div class="loader_outer"><div class="loader_label">Loading</div><div class="loader_bar"><div class="loader_bar_slider"></div></div></div></div></script><script type="text/javascript">I.user_page = new I.UserPage('#user_4395093', {"ac":"txbHXzLDXvG","user_id":2003071});
I.setup_page();</script><script type="text/javascript">new I.UserLayout(document.body);</script></body></html>
"""

t: str = i
if "new I.UserPage(" in t:
    t = t.split("new I.UserPage(")[1]
    print("t1", t)
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
print("id", id)
print(type(id))
