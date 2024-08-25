"use strict"

import { sql } from "@vercel/postgres";
import { unstable_cache as cache, unstable_noStore as noStore } from "next/cache";

import { RawJamGame, JamGraphData, ParsedJamGame, JsonEntryData } from "./types";

import axios from "axios";
import * as cheerio from "cheerio";
import { calculateSkewness, calculateKurtosis, calculatePointsIntervals, calculateVariance, calculateStandardDeviation, roundValue, parseGame, compressJson, decompressJson, minifyGame, deMinifyGame, analyzePlatforms } from "./utils";
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
    
    const rawtitle = $('h1.jam_title_header a').html() as string;
    let jamTitle = rawtitle.trim()

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
    // I can use this to see if jam active
    if (_gametitle.includes("rate")) {
        _gametitle = _gametitle.split("rate")[1].trim()
    }
    // no need to check for 'for' as if we just get slice from 0 to the last by it will work.
    const lasti = _gametitle.lastIndexOf("by");
    _gametitle = _gametitle.slice(0, lasti);

    _gametitle = _gametitle.trim()

    let color = $("style#jam_theme").html();
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
// https://itch.io/jam/379683/entries.json
const _getRatings = async (entryJsonLink: string) => {
    const response = await axios.get(entryJsonLink);
    const data: RawJamGame[] = response.data;

    return data.map((e)=>e.rating_count)
}
const getRatings =1// = cache(()=>{})



const _getEntryJSON = async (entryJsonLink: string) => {
    const response = await axios.get(entryJsonLink);
    const data = response.data;

    // sorted in ascending order
    const _GamesByRatingNum: ParsedJamGame[] = data["jam_games"]
        .map((obj:RawJamGame)=> parseGame(obj) )
        .sort((a:ParsedJamGame, b:ParsedJamGame) => a.rating_count - b.rating_count)

    const numGames = _GamesByRatingNum.length
    // small to big
    const sortedRatings = _GamesByRatingNum.map(game => game.rating_count);
    const sumOfRatings = sortedRatings.reduce((pre, cur) => pre + cur);
    
    // TODO: actually try to see if coolness is karma
    // or if its something else
    const KarmaByRating = _GamesByRatingNum.map(game => game.coolness);
    const sumOfKarmas = KarmaByRating.reduce((pre, cur) => pre + cur);
    const sortedKarma = _GamesByRatingNum.sort((a:ParsedJamGame, b:ParsedJamGame) => a.coolness - b.coolness).map((a)=>a.coolness)
    
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
        return _GamesByRatingNum[i];
    }

    const points = calculatePointsIntervals({sortedRatings}, {KarmaByRating})
    const platformsByRatingNum = _GamesByRatingNum.map((e)=>e.game.platforms).filter((e)=>{
        return e !== undefined
    })
    const PlatformPieData = analyzePlatforms(platformsByRatingNum);

    const minifiedGames = _GamesByRatingNum.map((e)=>minifyGame(e))

    const out = {
        minifiedGames,
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
        PlatformPieData
    } as JsonEntryData
    return compressJson(out)
}

const getEntryJSON = cache((entryJsonLink)=>_getEntryJSON(entryJsonLink), ["EntryJSON"], {
    revalidate:hour
})


const _analyzeJam = async (entryJsonLink: string, rateLink:string, jamTitle:string, gameTitle:string) => {
    const _inp = await getEntryJSON(entryJsonLink) as Buffer;
    
    const {
        minifiedGames, sortedRatings, KarmaByRating, numGames,
        medianRating, meanRating, medianKarma, meanKarma, variance, standardDeviation,kurtosis, skewness, points, PlatformPieData
    } = await decompressJson(_inp) as JsonEntryData

    
    // what a bad solution...
    const games = minifiedGames.map(e=>deMinifyGame(e))

    const _ratedGame = await _getGameFromGames(games, rateLink)
    const ratedGame = parseGame(_ratedGame);
    
    // Adding 1 to make it 1-based index(cgpt wrote this idk why add 1)
    const position = sortedRatings.indexOf(ratedGame.rating_count) + 1;

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
        numGames: games.length,
        ratedGame,
        ratedGamePercentile,
        jamTitle,
        // lol  // TODO: fix
        gameTitle:"If you see this, something is broken",
        PlatformPieData
    } as JamGraphData
    return out
}

const analyzeJam = cache((entryJsonLink,rateLink,jamTitle,gameTitle) => _analyzeJam(entryJsonLink,rateLink,jamTitle,gameTitle), ["JamAnalyze"], {
    revalidate: hour  // seconds
})

const _getGameFromGames = (games:ParsedJamGame[], rateLink:string) => {
    const ratedGame = games.find((obj, index) => {
        const absUrl = `https://itch.io${obj.url}`
        if (absUrl == rateLink) {
            return true
        }
    }) as ParsedJamGame
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
// meh, dunno
export const analyzeAll = _analyzeAll;
