import { sql } from "@vercel/postgres";
import { unstable_cache as cache, unstable_noStore as noStore } from "next/cache";

import axios from "axios";
import * as cheerio from "cheerio";
import { calculateSkewness, calculateKurtosis, calculatePointsIntervals, calculateVariance, calculateStandardDeviation } from "./utils";
import { performance } from "perf_hooks";

const minute = 60
const hour = minute * 60
const day = hour * 24


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

    const entry_search = "entries.json"
    const entries_i = obj.search(entry_search);
    let right = entries_i + entry_search.length

    const entry_key = "entries_url"
    let left = obj.search(entry_key) + entry_key.length + 3;

    let _json_url = obj.slice(left, right) as string;
    _json_url = _json_url.replaceAll(/\\\//g, '/').replaceAll("//", "/")
    if (_json_url.length > 100 || _json_url.includes("/unrated")) {
        const a = `"entries_url":"`;
        left = _json_url.search(a) + a.length;
        const b = `entries.json`;
        right = _json_url.search(b) + b.length;
        _json_url = _json_url.slice(left, right)
    }
    const json_url = `https://itch.io${_json_url}`  // /jam/stuff/entries.json

    const rawtitle = "Rate Honey Our House is 10 Feet for Deep for by for Notenlish for GMTK Game Jam 2024"//$('[property="og:title"]').attr("content") as string;
    // "Rate Honey Our House is 10 Feet Deep by for Notenlish for GMTK Game Jam 2024"
    let jamTitle = rawtitle.toLowerCase();
    // in case the title has more than 1 for
    while (jamTitle.includes("for")) {
        const i = jamTitle.search("for")
        jamTitle = jamTitle.slice(i + "for".length)
    }
    jamTitle = jamTitle.trim()
    return {json_url, jamTitle}
}

export const scrapeJamJSONLink = cache(async (entrieslink) => _scrapeJamJSONLink(entrieslink),
    ["jamJsonLink"],
    {
        revalidate: 1  // seconds
    }
)


type JamGame = {
    rating_count: number,
    created_at: string,
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

// the problem is this, for me to calculate position etc. correctly I need to cache stuff
// BUT I CANNOT CACHE THE FRIGGEN GAMES BCUZ TOO BIG
// solution? add ratelink to the _analyzeJam function, and let next.js happily fetch 2mb for every single friggen game
// I hate next.js
const _analyzeJam = async (entryJsonLink: string, rateLink:string) => {    
    const response = await axios.get(entryJsonLink);
    const data = response.data;

    const games: JamGame[] = data["jam_games"]
    // small to big
    const ratings = games.map(game => game.rating_count).sort((a, b) => a - b);
    const sumOfRatings = ratings.reduce((pre, cur, cur_i) => pre + cur);
    const numGames = ratings.length

    const median = ratings[Math.round(numGames / 2)];
    const mean = Math.round(sumOfRatings / numGames);
    const kurtosis = calculateKurtosis(ratings);
    const skewness = calculateSkewness(ratings);
    const variance = calculateVariance(ratings, mean);
    const standardDeviation = calculateStandardDeviation(ratings, mean)

    const percentile = (percent: number) => {
        const index = Math.floor(percent * numGames);
        return ratings[index];
    };
    const getGameFromPercentile = (percent:number) => {
        const i = Math.floor(percent * numGames)
        return games[i];
    }

    const points = calculatePointsIntervals(ratings, sumOfRatings, mean)
    const smolData = {games:[], ratings:[]}
    const size = 0.01  // every 1%
    for (let index = 0; index <= 1; index += size) {
        const smolGame = getGameFromPercentile(size);
        // @ts-ignore
        smolData.games.push(smolGame);
        // @ts-ignore
        smolData.ratings.push(smolGame.rating_count)
    }

    const ratedGame = _getGame(games, rateLink)

    // why add 1? i dont get
    const position = ratings.indexOf(ratedGame.rating_count) + 1; // Adding 1 to make it 1-based index

    let ratedGamePercentile = (position / numGames) * 100;
    ratedGamePercentile = Math.round(ratedGamePercentile * 100) / 100
    

    const out = {
        smallest: ratings[0],
        biggest: ratings[numGames - 1],
        median: median,
        mean: mean,
        variance:variance,
        standardDeviation: standardDeviation,
        kurtosis: kurtosis,
        skewness: skewness,
        points: points,
        top99Percent: percentile(.99),
        top99_5Percent: percentile(.995),
        smolGames: smolData.games,
        smolRatings: smolData.ratings,
        numGames: games.length,
        ratedGame: ratedGame,
        ratedGamePercentile: ratedGamePercentile,
    }
    return out
}

// AAAA, HOW AM I SUPPOSED TO GET GAMES AND RATINGS IF THE CACHE SIZE IS BIGGER THAN 2MB
// IMAGINE LIMITING CACHE TO 2MB
// AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA

// who cares, if they dont allow bigger caches, 
// then Ill just fetch it, per game, per jam, bcuz cache system looks at func args :shrug:
const analyzeJam = cache((entryJsonLink,rateLink) => _analyzeJam(entryJsonLink,rateLink), ["JamAnalyze"], {
    revalidate: hour  // seconds
})

const _getGame = (games:JamGame[], rateLink:string) => {
    const ratedGame = games.find((game, index) => {
        const absUrl = `https://itch.io${game.url}`
        if (absUrl == rateLink) {
            return true
        }
    }) as JamGame
    return ratedGame
}

const _analyzeAll = async (entryJsonLink: string, rateLink: string) => {
    const startTime = performance.now()
    const data = await analyzeJam(entryJsonLink, rateLink)

    const endTime = performance.now()
    console.log(`Took ${endTime - startTime} seconds for ${data.numGames} games in jam.`)
    return data;
}
// I cant cache bcuz over 2mb :sadge:
export const analyzeAll = _analyzeAll;
