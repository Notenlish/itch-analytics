# Itch.io Analytics Source Code

so yeah.

its spaghetti code that needs to be recoded from scratch, with an actual rented server.

Disclaimer: this is the source code of the itchanalytics.vercel.app website, not the analytics itch.io offers.

# Version 2

## a

py -m pip install -r requirements.txt
pip install -r requirements.txt

uvicorn main:app --reload

## stuff

<https://itch.io/jam/godot-wild-jam-72/entries>
<https://itch.io/jam/godot-wild-jam-72/rate/2906210>
<https://itch.io/jam/389358/entries.json>

## api structure

api / get-jam
api / check-jam

user enters their game rate jam link --> send req to api/get-jam. It adds it to the scraping queue and redirects user to /jam/<JAM_NAME>-<JAM_ID>. In that page, it displays a loading icon or a skeleton, and it periodically sends requests to /api/check-jam

When scraping is done, it updates the data for Jam model so the /api/check-jam returns a valid response.

If api gets an error during scraping, send a msg to the discord webhook.

I need to change the way scraping process works, so that instead of doing the deep scrape, it does a shallow scrape of just the entries.json, and then just saves the remaining scrape tasks to a db/list etc. and does them later.

## TODO

I also need to scrape the game pages themselves, and get the metadata(genre, play time, tags, languages, inputs, made_with(engine), etc)
also wtf is wrong with itch, on game rating page it shows no button to download but on the games page it does show downloads?????
eg: <https://itch.io/jam/gmtk-2024/rate/2905061#comments> <https://sealestial-games.itch.io/gecko-runner>

???

If a web version exists, itch.io only displays the button for playing it. If it doesnt exist, it lists out the downloads.(talking about game rating page.)
I also need to scrape and extract data from results.json or ratings.json whatever its named
and also scrape jam page itself, and scrape the game page as well.

TODO: fix the game page scraper not getting Updated and Published key value pairs for MetadataEntry

TODO: fix the weird unicode errors for other parts of the code too, just use that clean_text function and do .get_text() to bs4 tags.
in order to fix weird unicode errors, set encoding to explicitly utf-8

TODO: handle updating contributors when updating games.

## scraping

scraping takes too long. You cant always just stay connected to the server to keep uvicorn running. use nohup to make it still work even if you disconnect from ssh session.

`source .venv/bin/activate`
`nohup uvicorn main:app --reload --host 0.0.0.0 --port 12345 > ~/uvicorn-itch-analytics.log 2>&1 &`
verify its running: `pgrep -af "uvicorn main:app"`
check logs: `tail -f uvicorn-itch-analytics.log` --> press `Ctrl+C` to stop tail
send request to deep scrape a jam: `curl -d '{"url":"https://itch.io/jam/gmtk-2024/rate/2911191"}' -X POST http://0.0.0.0:12345/api/get-jam -H "Content-Type: application/json"`

example curl command for getting the code to scrape smth:

`curl -d '{"url":"<https://itch.io/jam/pygame-community-summer-jam-2024/rate/2830429"}>' -X POST <http://0.0.0.0:12345/api/get-jam> -H "Content-Type: application/json"`
