import { sql } from "@vercel/postgres";
import { unstable_cache as cache, unstable_noStore as noStore } from "next/cache";

import { JamGame, JamGraphData } from "./types";

import axios from "axios";
import * as cheerio from "cheerio";
import { calculateSkewness, calculateKurtosis, calculatePointsIntervals, calculateVariance, calculateStandardDeviation, roundValue } from "./utils";
import { performance } from "perf_hooks";

import { hour, minute, day } from "./types";

const _scrapeJamJSONLink = async (entrieslink: string, rateLink:string) => {
    // TODO: actually refactor this (not a joke)
    const response = await axios.get(entrieslink)
    const data = response.data;
    const $ = cheerio.load(data);  // /jam/entries page
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
    
    //"Rate Honey Our House is 10 Feet for Deep for by for Notenlish for GMTK Game Jam 2024"
    const rawtitle = $('h1.jam_title_header a').html() as string;
    let jamTitle = rawtitle.toLowerCase();
    // in case the title has more than 1 for
    while (jamTitle.includes("for")) {
        const i = jamTitle.search("for")
        jamTitle = jamTitle.slice(i + "for".length)
    }
    jamTitle = jamTitle.trim()

    // TODO: cache this, im too lazy to do it rn
    const response2 = await axios.get(rateLink)
    const data2 = response2.data;
    const $2 = cheerio.load(data2);

    let _gametitle = $2(`title`).html()?.toLowerCase() as string
    // Rate Honey Our House is 10 Feet Deep by Notenlish for GMTK Game Jam 2024 - itch.io
    // itch puts "rate" word if a jam isnt over
    // if it is over, theres no "rate" word
    // although a game name could potentially include the word rate
    // I gotta be careful about that to see if the jam is still active
    if (_gametitle.includes("rate")) {
        _gametitle = _gametitle.split("rate")[1].trim()
    }
    while (_gametitle.includes("for")) {
        const i = _gametitle.search("for")
        _gametitle.replace("for", "")
        _gametitle = _gametitle.slice(0, i)
    }
    while (_gametitle.includes("by")) {
        const i = _gametitle.search("by")
        _gametitle.replace("by", "")
        _gametitle = _gametitle.slice(0, i)
    }
    _gametitle = _gametitle.trim()

    let color = $("style#jam_theme").html();
    // color :root{--itchio_ui_bg: #282828}.page_widget{--itchio_link_color: #db0a14;--itchio_button_color: #db0a15;--itchio_button_fg_color: #ffffff;--itchio_button_shadow_color: #cf0009}
    if (color) {
        const c = "--itchio_button_color: "
        const left = color.search(c)
        color = color.slice(left + c.length)
        color = color.split(";")[0].trim()
    } else {
        color = "#F59E0B"
    }

    const gameTitle = _gametitle;
    return {json_url, jamTitle, gameTitle, color}
}

export const scrapeJamJSONLink = cache(async (entrieslink, rateLink) => _scrapeJamJSONLink(entrieslink, rateLink),
    ["jamJsonLink"],
    {
        revalidate: hour  // seconds
    }
)


const _getEntryJSON = async (entryJsonLink: string) => {
    const response = await axios.get(entryJsonLink);
    const data = response.data;

    // sorted in ascending order
    const games: JamGame[] = data["jam_games"]
        .map((game:JamGame)=>{
            delete game.created_at;
            delete game.field_responses
            delete game.id
            // We cant delete url because thats what we use to find the game from entries.json
            delete game.game;
            // muhahahaha
            // cache system beni alt edemeyecek!!
            return game
        })
        .sort((a:JamGame, b:JamGame) => a.rating_count - b.rating_count)
    const numGames = games.length
    // small to big
    const sortedRatings = games.map(game => game.rating_count);
    const sumOfRatings = sortedRatings.reduce((pre, cur) => pre + cur);
    
    // TODO: actually try to see if coolness is karma
    // or if its something else
    const KarmaByRating = games.map(game => game.coolness);
    const sumOfKarmas = KarmaByRating.reduce((pre, cur) => pre + cur);
    const sortedKarma = games.sort((a:JamGame, b:JamGame) => a.coolness - b.coolness).map((a)=>a.coolness)
    
    const medianRating = sortedRatings[Math.round(numGames / 2)];
    const meanRating = Math.round(sumOfRatings / numGames);
    const medianKarma = sortedKarma[Math.round(numGames / 2)];
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

    const points = calculatePointsIntervals({sortedRatings}, {KarmaByRating})
    
    const smolData = {games:[], ratings:[]}
    const size = 0.01  // every 1%
    for (let index = 0; index <= 1; index += size) {
        const smolGame = getGameFromPercentile(size);
        // @ts-ignore
        smolData.games.push(smolGame);
        // @ts-ignore
        smolData.ratings.push(smolGame.rating_count)
    }
    console.log("median karma", medianKarma)
    return {
        games,
        sortedRatings,
        KarmaByRating,
        numGames,
        medianRating,
        meanRating,
        medianKarma,
        meanKarma,
        variance,
        standardDeviation,
        kurtosis,
        skewness,
        points,
        smolData
    }
}

const getEntryJSON = cache((entryJsonLink)=>_getEntryJSON(entryJsonLink), ["EntryJSON"], {
    revalidate:hour
})


const _analyzeJam = async (entryJsonLink: string, rateLink:string, jamTitle:string, gameTitle:string) => {    
    const {
        games, sortedRatings, KarmaByRating, numGames,
        medianRating, meanRating, medianKarma, meanKarma, smolData, variance, standardDeviation,kurtosis, skewness,points
    } = await getEntryJSON(entryJsonLink);

    const ratedGame = await _getGameFromGames(games, rateLink)
    ratedGame.game = {
        title:gameTitle,
    }
    console.log("median karma", medianKarma)

    // why add 1? i dont get
    const position = sortedRatings.indexOf(ratedGame.rating_count) + 1; // Adding 1 to make it 1-based index

    let ratedGamePercentile = (position / numGames) * 100;
    ratedGamePercentile = roundValue(ratedGamePercentile, 3)

    const _sortedKarma = KarmaByRating.sort((a,b) => a-b)

    const out = {
        smallestRating: sortedRatings[0],
        biggestRating: sortedRatings[numGames - 1],
        smallestKarma: _sortedKarma[0],
        highestKarma:_sortedKarma[numGames-1],
        medianRating,
        meanRating,
        meanKarma,
        medianKarma,
        variance,
        standardDeviation,
        kurtosis,
        skewness,
        points,
        smolRatings: smolData.ratings,
        numGames: games.length,
        ratedGame,
        ratedGamePercentile,
        jamTitle,
        gameTitle:"If you see this, something is broken"
    } as JamGraphData
    return out
}

// AAAA, HOW AM I SUPPOSED TO GET GAMES AND RATINGS IF THE CACHE SIZE IS BIGGER THAN 2MB
// IMAGINE LIMITING CACHE TO 2MB
// AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA

// who cares, if they dont allow bigger caches, 
// then Ill just fetch it, per game, per jam, bcuz cache system looks at func args :shrug:
const analyzeJam = cache((entryJsonLink,rateLink,jamTitle,gameTitle) => _analyzeJam(entryJsonLink,rateLink,jamTitle,gameTitle), ["JamAnalyze"], {
    revalidate: hour  // seconds
})

const _getGameFromGames = (games:JamGame[], rateLink:string) => {
    const ratedGame = games.find((game, index) => {
        const absUrl = `https://itch.io${game.url}`
        if (absUrl == rateLink) {
            return true
        }
    }) as JamGame
    return ratedGame
}

const _analyzeAll = async (entryJsonLink: string, rateLink: string, jamTitle:string, gameTitle:string) => {
    const startTime = performance.now()
    const data = await analyzeJam(entryJsonLink, rateLink, jamTitle, gameTitle)

    const endTime = performance.now()
    const dif = endTime - startTime
    console.log(`Took ${dif / 1000} seconds for ${data.numGames} games in jam.`)
    return data;
}
// maybe cache this?
export const analyzeAll = _analyzeAll;
