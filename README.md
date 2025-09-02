# Itch.io Analytics Source Code

Remake code.

## TODO

- add popularity to JamGame model
- historical gamejam fetching, scheduled shallow fetching

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

verify its running: `pgrep -af "uvicorn main:app"`

`pgrep -a uvicorn` -> check which processes are active

check logs: `tail -f itch-analytics.log` --> press `Ctrl+C` to stop tail

send request to deep scrape a jam:

curl -d '{"url":"https://itch.io/jam/gmtk-2024/rate/2911191"}' -X POST http://0.0.0.0:12345/api/get-jam -H "Content-Type: application/json"

curl -d '{"url":"https://itch.io/jam/gmtk-2025/rate/3777397"}' -X POST http://0.0.0.0:12345/api/get-jam -H "Content-Type: application/json"

curl -d '{"url":"https://itch.io/jam/pygame-community-summer-jam-2024/rate/2830429"}' -X POST http://0.0.0.0:12345/api/get-jam -H "Content-Type: application/json"

`kill -9 <PID>` --> force it to kill process

