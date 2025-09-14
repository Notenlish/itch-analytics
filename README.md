# Itch.io Analytics Source Code

Remake code.

## TODO

- TODO: do shallow scraping for entered urls.
- add popularity to JamGame model + extractor
- historical gamejam fetching, scheduled shallow fetching
- Fİnd users who submitted to gmtk 2024 and also 2025, then figure out how better theyve gotten in terms of games.
- store custom css + colors a game uses(foreground background etc.)

## TODO for comments analysis.
to find even bigger correlation between commens & ratings/score etc. I need to check the "quality" of comments

cgpt gave these examples:
```
🔹 Comment-Based Features

Comment Length

Average length per game/jamgame (in characters or words).

Distribution of lengths (e.g. variance — do some games get many short “cool!” comments vs. fewer, detailed reviews?).

Sentiment Analysis

Polarity (positive ↔ negative).

Subjectivity (opinionated ↔ factual).

Could use something lightweight like VADER, or a modern transformer-based model for better nuance.

Lexical Richness

Vocabulary diversity (unique words / total words).

Presence of “emotional” words (wow, love, amazing, frustrating, etc.).

Engagement Density

Ratio: comments per rating.

Ratio: words per rating.

Ratio: comments per unique user (are the same people spamming vs. broad engagement?).

🔹 User/Author Features

Author Activity

Are commenters also creators (i.e. other jam participants)?

Comments from other devs might correlate more strongly with rating behavior than random players.

Author Reputation

Track if the commenting user has contributed games to other jams.

Hypothesis: “experienced dev feedback” might align better with final rankings.

🔹 Structural/Temporal Features

Timing of Comments

Were comments made early vs. late in the jam/voting window?

Early engagement could drive more visibility and ratings.

Comment-to-Rating Lag

Measure time gap between comment and rating.

Hypothesis: “detailed comments → immediate rating” might be stronger than “drive-by comment with no rating.”

🔹 Advanced NLP Features

Topic Modeling

Identify topics (e.g., “graphics”, “controls”, “fun”, “bugs”).

See if certain topic clusters correlate more strongly with ratings (e.g., positive mentions of “fun” → higher overall score).

Emotion Detection

Go beyond polarity: track specific emotions (joy, surprise, anger, disappointment).

Games with higher joy/positive surprise mentions might correlate with better ranks.

Readability / Writing Style

Measure complexity (Flesch score).

Hypothesis: “thoughtful reviews” (longer, more complex writing) may signal higher engagement and align with higher scores.

🔹 Graph Ideas

Scatterplot: Avg. comment length vs. avg. rating.

Boxplot: Rating distribution grouped by sentiment polarity bucket.

Time series: Cumulative comments vs. cumulative ratings over jam duration.

Wordcloud per score tier: Words used in comments on top 10% vs. bottom 10% of games.

👉 If you want to look for stronger predictors of success, my hunch is:

Sentiment polarity + comment length (together) will outperform just comment count.

Commenter type (dev vs. player) could also explain a lot.

```





## Install Dependencies

`py -m pip install -r requirements.txt` or `pip install -r requirements.txt`

start backend server:
`uvicorn main:app --reload --host 0.0.0.0 --port 12345`

## API Structure Stuffs

api / get-jam
api / check-jam

user enters their game rate jam link --> send req to api/get-jam. It adds it to the scraping queue and redirects user to /jam/<JAM_NAME>-<JAM_ID>. In that page, it displays a loading icon or a skeleton, and it periodically sends requests to /api/check-jam

When scraping is done, it updates the data for Jam model so the /api/check-jam returns a valid response.

If api gets an error during scraping, send a msg to the discord webhook.

I need to change the way scraping process works, so that instead of doing the deep scrape, it does a shallow scrape of just the entries.json, and then just saves the remaining scrape tasks to a db/list etc. and does them later.

## Scraping On VPS

Scraping takes too long. You cant always just stay connected to the server to keep uvicorn running. use nohup to make it still work even if you disconnect from ssh session.

`source .venv/bin/activate`

`nohup uvicorn main:app --host 0.0.0.0 --port 12345 > ~/itch-analytics.log 2>&1 &`
NOTE: add --reload only for dev, not prod.


This should help with getting "realtime" logs

nohup stdbuf -oL -eL uvicorn main:app --host 0.0.0.0 --port 12345 > ~/itch-analytics.log 2>&1 &



verify its running: `pgrep -af "uvicorn main:app"`

`pgrep -a uvicorn` -> check which processes are active

check logs: `tail -f itch-analytics.log` --> press `Ctrl+C` to stop tail

send request to deep scrape a jam:

curl -d '{"url":"https://itch.io/jam/gmtk-2024/rate/2911191"}' -X POST http://0.0.0.0:12345/api/get-jam -H "Content-Type: application/json"

curl -d '{"url":"https://itch.io/jam/gmtk-2025/rate/3777397"}' -X POST http://0.0.0.0:12345/api/get-jam -H "Content-Type: application/json"

curl -d '{"url":"https://itch.io/jam/pygame-community-summer-jam-2024/rate/2830429"}' -X POST http://0.0.0.0:12345/api/get-jam -H "Content-Type: application/json"

curl -d '{"url":"https://itch.io/jam/brackeys-14/rate/3851771"}' -X POST http://0.0.0.0:12345/api/get-jam -H "Content-Type: application/json"

`kill -9 <PID>` --> force it to kill process

