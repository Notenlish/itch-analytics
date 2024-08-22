import { sql } from "@vercel/postgres";
import { unstable_cache as cache, unstable_noStore as noStore } from "next/cache";

import axios from "axios";
import * as cheerio from "cheerio";
import { calculateSkewness, calculateKurtosis, calculatePointsIntervals } from "./utils";


const _scrapeJamJSONLink = async (entrieslink: string) => {
    // TODO: actually refactor this (not a joke)

    const response = await axios.get(entrieslink)
    const data = response.data;
    const $ = cheerio.load(data);
    // @ts-ignore
    const scriptTag = $(`script`).filter((i: number, el: Element) => {
        // @ts-ignore
        return $(el).html()?.includes("entries.json");
    }).html();
    if (!scriptTag) {
        throw Error("No script Tag found")
    }
    const searchFor = "R.Jam.BrowseEntries";
    const i = scriptTag.search(searchFor);

    let obj = scriptTag.slice(i + 1 + searchFor.length);

    // "entries_url":"\/jam\/379683\/entries.json"
    const entry_search = "entries.json"
    const entries_i = obj.search(entry_search);
    let right = entries_i + entry_search.length

    const entry_key = "entries_url"
    let left = obj.search(entry_key) + entry_key.length + 3;

    let _json_url = obj.slice(left, right) as string;
    _json_url = _json_url.replaceAll(/\\\//g, '/').replaceAll("//", "/")
    if (_json_url.length > 100 || _json_url.includes("/unrated")) {
        // console.log("AAAA EVERYTHING IS BROKEN. IDK WHY THIS EVEN HAPPENS")
        const a = `"entries_url":"`;
        left = _json_url.search(a) + a.length;
        const b = `entries.json`;
        right = _json_url.search(b) + b.length;
        _json_url = _json_url.slice(left, right)
        // console.log("THIS BETTER WORK", _json_url)
    }
    const json_url = `https://itch.io${_json_url}`  // /jam/stuff/entries.json
    return json_url
}

// export const scrapeJamJSONLink = _scrapeJamJSONLink

// Bu aptal cache system nedense bazen manyıyor
// o yüzden cache yok.
// EDİT: sorun cache system de değilmiş
// mal olan benim
// zort

export const scrapeJamJSONLink = cache(async (entrieslink) => _scrapeJamJSONLink(entrieslink),
    ["jamJsonLink"],
    {
        revalidate: 1  // 1 hour
    }
)


type JamGame = {
    rating_count: number,
    created_at: Date,
    id: number,
    url: string,
    coolness: number,
    game: {
        title: string,
        url: string,
        user: {
            url: string,
            id: number,
            name: string
        },
        id: number,
        cover: string,
        short_text: string,
        cover_color: string,
        platforms: string[]
    },
    // what is this?
    field_responses: string[]
}

export const _analyzeJam = async (entryJsonLink: string) => {
    // console.log("BANA BAK ENTRY JSON LINK BU:", entryJsonLink)
    const response = await axios.get(entryJsonLink);
    const data = response.data;

    const games: JamGame[] = data["jam_games"]
    // small to big
    const ratings = games.map(game => game.rating_count).sort((a, b) => a - b);
    const totalRatings = ratings.reduce((pre, cur, cur_i) => pre + cur);
    const numGames = ratings.length

    const median = ratings[Math.round(numGames / 2)];
    const mean = Math.round(totalRatings / numGames);
    const kurtosis = calculateKurtosis(ratings);
    const skewness = calculateSkewness(ratings);

    const percentile = (percent: number) => {
        const index = Math.floor(percent * numGames);
        return ratings[index];
    };

    const CdfPoints = calculatePointsIntervals(ratings)

    const out = {
        smallest: ratings[0],
        biggest: ratings[numGames - 1],
        median: median,
        mean: mean,
        kurtosis: kurtosis,
        skewness: skewness,
        CdfPoints: CdfPoints,
        top99Percent: percentile(.99),
        top99_5Percent: percentile(.995)
    }
    return out
}

export const analyzeJam = cache((entryJsonLink) => _analyzeJam(entryJsonLink), ["JamAnalyze"], {
    revalidate: 1  // 1 min
})

// Todo: analyze the statistics for the entered jam game
