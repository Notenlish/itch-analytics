import { sql } from "@vercel/postgres";
import { unstable_cache as cache, unstable_noStore as noStore } from "next/cache";

import { JamGame } from "./types";

import axios from "axios";
import * as cheerio from "cheerio";
import { calculateSkewness, calculateKurtosis, calculatePointsIntervals, calculateVariance, calculateStandardDeviation } from "./utils";
import { performance } from "perf_hooks";

let minute = 60
let hour = minute * 60
let day = hour * 24

if (process.env.NEXT_PUBLIC_IS_DEV) {
    minute = 1;
    hour = 1;
    day = 1;
}

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




// the problem is this, for me to calculate position etc. correctly I need to cache stuff
// BUT I CANNOT CACHE THE FRIGGEN GAMES BCUZ TOO BIG
// solution? add ratelink to the _analyzeJam function, and let next.js happily fetch 2mb for every single friggen game
// I hate next.js
const _analyzeJam = async (entryJsonLink: string, rateLink:string) => {    
    const response = await axios.get(entryJsonLink);
    const data = response.data;

    // sorted in ascending order
    const games: JamGame[] = data["jam_games"].sort((a:JamGame, b:JamGame) => a.rating_count - b.rating_count)
    const numGames = games.length
    // small to big
    const sortedRatings = games.map(game => game.rating_count);
    const sumOfRatings = sortedRatings.reduce((pre, cur) => pre + cur);
    
    const sortedKarmas = games.map(game => game.coolness);
    const sumOfKarmas = sortedKarmas.reduce((pre, cur) => pre + cur);
    
    const medianRating = sortedRatings[Math.round(numGames / 2)];
    const meanRating = Math.round(sumOfRatings / numGames);
    const medianKarma = sortedKarmas[Math.round(numGames) / 2];
    const meanKarma = Math.round(sumOfKarmas / numGames);

    const kurtosis = calculateKurtosis(sortedRatings);
    const skewness = calculateSkewness(sortedRatings);
    const variance = calculateVariance(sortedRatings, meanRating);
    const standardDeviation = calculateStandardDeviation(sortedRatings, meanRating)

    const percentile = (percent: number) => {
        const index = Math.floor(percent * numGames);
        return sortedRatings[index];
    };
    const getGameFromPercentile = (percent:number) => {
        const i = Math.floor(percent * numGames)
        return games[i];
    }

    const points = calculatePointsIntervals({sortedRatings}, {sortedKarmas})
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
    const position = sortedRatings.indexOf(ratedGame.rating_count) + 1; // Adding 1 to make it 1-based index

    let ratedGamePercentile = (position / numGames) * 100;
    ratedGamePercentile = Math.round(ratedGamePercentile * 100) / 100
    

    const out = {
        smallestRating: sortedRatings[0],
        biggestRating: sortedRatings[numGames - 1],
        medianRating,
        meanRating,
        variance,
        standardDeviation,
        kurtosis,
        skewness,
        points,
        smolRatings: smolData.ratings,
        numGames: games.length,
        ratedGame,
        ratedGamePercentile,
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
