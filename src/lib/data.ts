"use strict";

import { sql } from "@vercel/postgres";
import { unstable_cache as cache, unstable_noStore as noStore } from "next/cache";

import {
  RawJamGame,
  JamGraphData,
  ParsedJamGame,
  JsonEntryData,
  WordCloudData,
  RawGameResult,
  MinifiedGameResult,
  ParsedGameResult,
  responsesChartData,
  GraphTeamToScorePoint,
  GraphRatingCountToScorePoint,
  JsonOptions,
} from "./types";

import axios, { toFormData } from "axios";
import * as cheerio from "cheerio";
import {
  calculateSkewness,
  calculateKurtosis,
  calculatePointsIntervals,
  calculateVariance,
  calculateStandardDeviation,
  roundValue,
  parseGame,
  compressJson,
  decompressJson,
  minifyGame,
  deMinifyGame,
  analyzePlatforms,
  countStrInArr,
  UTF8AsASCII,
  PrepareWordCloud,
  parseGameResult,
  minifyGameResult,
  deMinifyGameResult,
} from "./utils";
import { performance } from "perf_hooks";

import { hour, halfHour, minute, day } from "./types";

const _scrapeJamJSONLink = async (entrieslink: string, rateLink: string) => {
  // TODO: actually refactor this (not a joke)
  const response = await axios.get(entrieslink);
  const data = response.data;
  const $ = cheerio.load(data); // /jam/entries page
  const fullPage = $.html();
  // @ts-ignore
  const scriptTag = $(`script`)
    // @ts-ignore  hahahha
    .filter((i: number, el: Element) => {
      // @ts-ignore
      return $(el).html()?.includes("entries.json");
    })
    .html();
  if (!scriptTag) {
    throw Error("No script Tag found");
  }
  const searchFor = "R.Jam.BrowseEntries";
  const i = scriptTag.search(searchFor);

  let obj = scriptTag.slice(i + 1 + searchFor.length);

  const entry_search = "entries.json";
  const entries_i = obj.search(entry_search);
  let right = entries_i + entry_search.length;

  let optionsData: JsonOptions | undefined;
  if (fullPage.includes("fields:")) {
    const OptionsLeftIndex = fullPage.search("fields:") + "fields:".length;
    const optionsRightIndex = fullPage.search(',"lunr_js_url');
    const optionsRaw = fullPage.slice(OptionsLeftIndex, optionsRightIndex) as string;
    optionsData = JSON.parse(optionsRaw);
  }

  const entry_key = "entries_url";
  let left = obj.search(entry_key) + entry_key.length + 3;

  let _json_url = obj.slice(left, right) as string;
  _json_url = _json_url.replaceAll(/\\\//g, "/").replaceAll("//", "/");
  if (_json_url.length > 100 || _json_url.includes("/unrated")) {
    const a = `"entries_url":"`;
    left = _json_url.search(a) + a.length;
    const b = `entries.json`;
    right = _json_url.search(b) + b.length;
    _json_url = _json_url.slice(left, right);
  }
  const json_url = `https://itch.io${_json_url}`; // /jam/stuff/entries.json

  const rawtitle = $("h1.jam_title_header a").html() as string;
  let jamTitle = rawtitle.trim();

  // TODO: cache this, im too lazy to do it rn
  const response2 = await axios.get(rateLink);
  const data2 = response2.data;
  const $2 = cheerio.load(data2);

  let _gametitle = $2(`title`).html()?.toLowerCase() as string;
  // Rate Honey Our House is 10 Feet Deep by Notenlish for GMTK Game Jam 2024 - itch.io
  // itch puts "rate" word if a jam isnt over
  // if it is over, theres no "rate" word
  // although a game name could potentially include the word rate
  // I gotta be careful about that to see if the jam is still active
  // I can use this to see if jam active
  // we cant use this to see if jam active, even if I do .startswith someone could just have a game starting with 'rate this game'
  // aka, gotta fetch results.json :sad:
  if (_gametitle.includes("rate")) {
    _gametitle = _gametitle.split("rate")[1].trim();
  }
  // no need to check for 'for' as if we just get slice from 0 to the last by it will work.
  const lasti = _gametitle.lastIndexOf("by");
  _gametitle = _gametitle.slice(0, lasti);

  _gametitle = _gametitle.trim();

  let color = $("style#jam_theme").html();
  if (color) {
    const c = "--itchio_button_color: ";
    const left = color.search(c);
    color = color.slice(left + c.length);
    color = color.split(";")[0].trim();
  } else {
    color = "#F59E0B";
  }

  const gameTitle = _gametitle;
  return { json_url, jamTitle, gameTitle, color, optionsData };
};

export const scrapeJamJSONLink = cache(
  async (entrieslink, rateLink) => _scrapeJamJSONLink(entrieslink, rateLink),
  ["jamJsonLink"],
  {
    revalidate: halfHour, // seconds
  }
);
// what is this function :skull:
// https://itch.io/jam/379683/entries.json
const _getRatings = async (entryJsonLink: string) => {
  const response = await axios.get(entryJsonLink);
  const data: RawJamGame[] = response.data;

  return data.map((e) => e.rating_count);
};
const getRatings = 1; // = cache(()=>{})

const _scrapeNormalGamePage = async (gameLink: string) => {
  // not possible, I'd need to store game urls too.
};

const _scrapeGameRatingPage = async (rateLink: string) => {
  const response = await axios.get(rateLink);
  const data = response.data;
  const $ = cheerio.load(data);

  const d = $(`div.post_body.user_formatted`);
  const comments = d
    .map((i, el) => {
      return PrepareWordCloud(UTF8AsASCII($(el).text().trim()));
    })
    .get();

  const words: string[] = [];
  for (const comment of comments) {
    words.push(
      ...comment.split(" ").filter((e) => {
        return e.slice(1); // get rid of 1 letter words and also '' words
      })
    );
  }
  const wordCounter = Object.entries(countStrInArr(words)).sort((a, b) => b[1] - a[1]);

  const highest20 = wordCounter.slice(0, 20).map(([word, count], i) => {
    let size = "small";
    if (i < 5) {
      size = "large";
    } else if (i < 10) {
      size = "medium";
    }
    return { word, count, size };
  });
  return highest20 as WordCloudData;
};

const scrapeGameRatingPage = cache(
  (rateLink: string) => _scrapeGameRatingPage(rateLink),
  ["ScrapeGameRatingPageLOL"],
  {
    revalidate: halfHour,
  }
);

const _getEntryJSON = async (entryJsonLink: string) => {
  const response = await axios.get(entryJsonLink);
  const data = response.data;

  // sorted in ascending order
  const _GamesByRatingNum: ParsedJamGame[] = data["jam_games"]
    .map((obj: RawJamGame) => parseGame(obj))
    .sort((a: ParsedJamGame, b: ParsedJamGame) => a.rating_count - b.rating_count);

  const numGames = _GamesByRatingNum.length;
  // small to big
  const sortedRatings = _GamesByRatingNum.map((game) => game.rating_count);
  const sumOfRatings = sortedRatings.reduce((pre, cur) => pre + cur);

  // @ts-ignore
  const responsesInput = _GamesByRatingNum.map((g) => {
    const responses = g.field_responses;
    const firstresponse = responses ? responses[0] : "doesnt exist";
    return firstresponse;
  });
  const responsesChart = countStrInArr(responsesInput) as responsesChartData;
  // todo: itch doesnt give what the responses mean :sadge:
  // so, if its gmtk 2024, I will write smth
  // else just write response 1 response 2 etc.

  // NOTE: "coolness" in itch api is actually just votes given
  // or if its something else
  const CoolnessByRating = _GamesByRatingNum.map((game) => game.coolness);

  const sumOfCoolness = CoolnessByRating.reduce((pre, cur) => pre + cur);
  const sortedCoolness = _GamesByRatingNum
    .sort((a: ParsedJamGame, b: ParsedJamGame) => a.coolness - b.coolness)
    .map((a) => a.coolness);

  const medianRating = sortedRatings[Math.round(numGames / 2)];
  const meanRating = Math.round(sumOfRatings / numGames);
  const medianCoolness = sortedCoolness[Math.round(numGames / 2)];
  const meanCoolness = Math.round(sumOfCoolness / numGames);

  const kurtosis = calculateKurtosis(sortedRatings);
  const skewness = calculateSkewness(sortedRatings);
  const variance = calculateVariance(sortedRatings, meanRating);
  const standardDeviation = calculateStandardDeviation(sortedRatings, meanRating);

  const percentile = (percent: number) => {
    const index = Math.floor(percent * numGames);
    return sortedRatings[index];
  };
  const getGameFromPercentile = (percent: number) => {
    const i = Math.floor(percent * numGames);
    return _GamesByRatingNum[i];
  };

  const points = calculatePointsIntervals({ sortedRatings }, { CoolnessByRating });
  const platformsByRatingNum = _GamesByRatingNum
    .map((e) => e.game.platforms)
    .filter((e) => {
      return e !== undefined;
    });
  const PlatformPieData = analyzePlatforms(platformsByRatingNum);

  const minifiedGames = _GamesByRatingNum.map((e) => minifyGame(e));

  const out = {
    responsesChart,
    minifiedGames,
    sortedRatings,
    KarmaByRating: CoolnessByRating,
    numGames,
    medianRating,
    meanRating,
    medianKarma: medianCoolness,
    meanKarma: meanCoolness,
    variance,
    standardDeviation,
    kurtosis,
    skewness,
    points,
    PlatformPieData,
  } as JsonEntryData;
  return compressJson(out);
};

const getEntryJSON = cache(
  (entryJsonLink) => _getEntryJSON(entryJsonLink),
  ["EntryJSON"],
  {
    revalidate: halfHour,
  }
);

// results dont change after jam ends and theyre released once: aka cache that boi
/**
 * Must be called only if the jam has ended
 * @param {string} resultsJsonLink
 *
 */
const _getResultsJson = async (resultsJsonLink: string) => {
  try {
    const response = await axios.get(resultsJsonLink);
    // jam has, in fact, ended
    const data: RawGameResult[] = response.data["results"];
    return compressJson(data.map((e) => minifyGameResult(parseGameResult(e))));
  } catch (e) {
    // 404
    console.log("Probably 404?");
    console.error(e);
    return null;
  }
};

const getResultsJson = cache(
  (resultsJsonLink: string) => _getResultsJson(resultsJsonLink),
  ["ResultsJsonFetchAndAnalyze"],
  {
    revalidate: 15 * minute,
  }
);

const _analyzeResults = async (
  results: ParsedGameResult[],
  games: ParsedJamGame[],
  ratedGame: ParsedJamGame
) => {
  // console.log("ASDSADSADAS 11111111111111111")
  // ascending(towards the end team size is bigger)
  // console.log("LEANASD", results.length)
  const resultsByTeamSize = results.sort((a, b) => a.team_size - b.team_size);
  const arrLength = results.length;

  // bar points for average team size(x axis) to average score(y axis)
  const teamToScorePoints: GraphTeamToScorePoint[] = [];
  // get avg score in 0 - 1 range
  const calc = (v: number, stepSize: number) => {
    const index = Math.floor(v * (arrLength - 1));
    const getAverage = () => {
      const right = index;
      const _left = v - stepSize;
      const left = Math.floor(_left * (arrLength - 1));
      const countPerBar = right - left;

      let totalScore = 0;
      let totalRawScore = 0;
      let totalRank = 0;
      for (let avgIndex = left; avgIndex <= right; avgIndex++) {
        const el = resultsByTeamSize[avgIndex];
        totalScore += el.score;
        totalRawScore += el.raw_score;
        totalRank += el.rank;
      }
      const avgScore = totalScore / countPerBar;
      const avgRawScore = totalRawScore / countPerBar;
      const avgRank = totalRank / countPerBar;
      return {
        avgScore,
        avgRawScore,
        avgRank,
      };
    };

    const result = resultsByTeamSize[index];
    const { avgScore, avgRawScore, avgRank } = getAverage();
    const obj = {
      teamSize: result.team_size,
      score: avgScore,
      rawScore: avgRawScore,
      ranking: avgRank,
      // todo: fix this
      name: `${result.team_size}`,
    } as GraphTeamToScorePoint;
    return obj;
  };
  const stepSize = 0.05;
  for (let index = stepSize; index < 0.8; index += stepSize) {
    const point = calc(index, stepSize);
    teamToScorePoints.push(point);
  }
  // wow, no for loop, how expressive
  // too lazy, too bad
  teamToScorePoints.push(calc(0.825, 0.025));
  teamToScorePoints.push(calc(0.85, 0.025));
  teamToScorePoints.push(calc(0.875, 0.025));
  teamToScorePoints.push(calc(0.9, 0.025));
  teamToScorePoints.push(calc(0.925, 0.025));
  teamToScorePoints.push(calc(0.95, 0.025));
  teamToScorePoints.push(calc(0.975, 0.025));
  teamToScorePoints.push(calc(1.0, 0.025));

  // console.log("ASDSADSADAS 22222222222222222222")

  // score ==> x axis  rating count ==> y axis
  const resultsByScore = results.sort((a, b) => a.score - b.score);
  const ratingCountToScorePoints: GraphRatingCountToScorePoint[] = [];
  // get avg score in 0 - 1 range
  const calc2 = (v: number, stepSize: number) => {
    const right = Math.floor(v * (arrLength - 1));
    const result = resultsByScore[right];
    const getAverage = () => {
      const left = Math.floor((v - stepSize) * (arrLength - 1));
      const gamePerBar = right - left;
      let totalRatingCount = 0;
      for (let avgIndex = left; avgIndex <= right; avgIndex++) {
        const result = resultsByScore[avgIndex];
        // How to match the games array to the results array
        // games in results array contain .title attribute which is also included in items of games array
        const matchingGame = games.find(
          (game) => game.game.title == result.title
        ) as ParsedJamGame;
        totalRatingCount += matchingGame?.rating_count;
      }
      const avgRatingCount = totalRatingCount / gamePerBar;
      return { avgRatingCount };
    };
    const { avgRatingCount } = getAverage();
    const obj = {
      ratingCount: avgRatingCount,
      score: roundValue(result.score, 3),
      rawScore: result.raw_score,
      name: `${roundValue(result.score, 2)}`,
    } as GraphRatingCountToScorePoint;
    return obj;
  };
  for (let index = stepSize; index < 0.8; index += stepSize) {
    const point = calc2(index, stepSize);
    ratingCountToScorePoints.push(point);
  }
  ratingCountToScorePoints.push(calc2(0.825, 0.025));
  ratingCountToScorePoints.push(calc2(0.85, 0.025));
  ratingCountToScorePoints.push(calc2(0.875, 0.025));
  ratingCountToScorePoints.push(calc2(0.9, 0.025));
  ratingCountToScorePoints.push(calc2(0.925, 0.025));
  ratingCountToScorePoints.push(calc2(0.95, 0.025));
  ratingCountToScorePoints.push(calc2(0.975, 0.025));
  ratingCountToScorePoints.push(calc2(1.0, 0.025));

  // console.log("ASDSADSADAS 3333333333333333")

  const gamesByRatingNum = games.sort((a, b) => a.rating_count - b.rating_count);
  // why the same type? well uhh bcuz I dont need to write a new type and why not lol
  const scoreToRatingNumPoints: GraphRatingCountToScorePoint[] = [];
  const calc3 = (v: number, stepSize: number) => {
    const right = Math.floor(v * (arrLength - 1));
    const game = gamesByRatingNum[right];
    if (!game) {
      return {
        ratingCount: 0,
        score: 0,
        rawScore: 0,
        name: `Error happened`,
      } as GraphRatingCountToScorePoint;
    }
    const getAverage = () => {
      const left = Math.floor((v - stepSize) * (arrLength - 1));
      const gamePerBar = right - left;
      let totalScore = 0;
      let totalRawScore = 0;
      for (let avgIndex = left; avgIndex <= right; avgIndex++) {
        const __game = gamesByRatingNum[avgIndex];
        // ew
        const matchingResult = results.find(
          (result) => result.title == __game.game.title
        );
        totalScore += matchingResult?.score as number;
        totalRawScore += matchingResult?.raw_score as number;
      }
      const avgScore = totalScore / gamePerBar;
      const avgRawScore = totalRawScore / gamePerBar;
      return { avgScore, avgRawScore };
    };
    const { avgScore, avgRawScore } = getAverage();
    const obj = {
      ratingCount: game.rating_count,
      score: avgScore,
      rawScore: avgRawScore,
      name: `${roundValue(game.rating_count, 2)}`,
    } as GraphRatingCountToScorePoint;
    return obj;
  };
  for (let index = stepSize; index < 0.8; index += stepSize) {
    const point = calc3(index, stepSize);
    scoreToRatingNumPoints.push(point);
  }
  scoreToRatingNumPoints.push(calc3(0.825, 0.025));
  scoreToRatingNumPoints.push(calc3(0.85, 0.025));
  scoreToRatingNumPoints.push(calc3(0.875, 0.025));
  scoreToRatingNumPoints.push(calc3(0.9, 0.025));
  scoreToRatingNumPoints.push(calc3(0.925, 0.025));
  scoreToRatingNumPoints.push(calc3(0.95, 0.025));
  scoreToRatingNumPoints.push(calc3(0.975, 0.025));
  scoreToRatingNumPoints.push(calc3(1.0, 0.025));

  const ratedGameResult = results.find((r) => r.title == ratedGame.game.title);

  // console.log("ASDSADSADAS 999999999999999999")

  return {
    teamToScorePoints,
    ratingCountToScorePoints,
    scoreToRatingNumPoints,
    ratedGameResult,
  };
};

const analyzeResults = cache(
  (results, games, ratedGame) => _analyzeResults(results, games, ratedGame),
  ["analyzeResults"],
  {
    revalidate: halfHour,
  }
);

const _analyzeJam = async (
  entryJsonLink: string,
  rateLink: string,
  jamTitle: string,
  gameTitle: string,
  optionsData: JsonOptions | undefined
) => {
  const resultsJsonLink = entryJsonLink.replace("entries.json", "results.json");
  const _inp = (await getEntryJSON(entryJsonLink)) as Buffer;
  // console.log("HAAHHAHAHAHHA 1111111111")
  let results;
  const _inp_result = (await getResultsJson(resultsJsonLink)) as Buffer;

  const {
    responsesChart,
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
    PlatformPieData,
  } = (await decompressJson(_inp)) as JsonEntryData;

  // console.log("HAAHHAHAHAHHA 22222222222222222")

  const wordCloud = await scrapeGameRatingPage(rateLink);

  // console.log("HAAHHAHAHAHHA 33333333333333")

  // de-minify games bcuz next cache size
  const games = minifiedGames.map((e) => deMinifyGame(e));

  // console.log("HAAHHAHAHAHHA 4444444444444444")

  // avg score by

  const _ratedGame = await _getGameFromGames(games, rateLink);
  const ratedGame = parseGame(_ratedGame);
  let teamToScorePoints: GraphTeamToScorePoint[] | undefined;
  let ratingCountToScorePoints: GraphRatingCountToScorePoint[] | undefined;
  let scoreToRatingNumPoints: GraphRatingCountToScorePoint[] | undefined;
  let ratedGameResult: ParsedGameResult | undefined;
  if (_inp_result) {
    const _results = (await decompressJson(_inp_result)) as MinifiedGameResult[];
    results = _results.map((e) => deMinifyGameResult(e));
    if (results.length != 0) {
      const {
        teamToScorePoints: _1,
        ratingCountToScorePoints: _2,
        scoreToRatingNumPoints: _3,
        ratedGameResult: _4,
      } = await analyzeResults(results, games, ratedGame);
      teamToScorePoints = _1;
      ratingCountToScorePoints = _2;
      scoreToRatingNumPoints = _3;
      ratedGameResult = _4;
    }
  }

  // Adding 1 to make it 1-based
  const position = sortedRatings.indexOf(ratedGame.rating_count) + 1;

  let ratedGamePercentile = (position / numGames) * 100;
  ratedGamePercentile = roundValue(ratedGamePercentile, 3);
  const ratedGamePosition = numGames - position + 1;
  // we use a 1 based system but computer doesnt understand that

  const _sortedKarma = KarmaByRating.sort((a, b) => a - b);

  // todo: fix variable names for coolness/karma
  // calculation formula from: https://itch.io/t/4046566/what-exactly-is-karma-coolness-in-gamejams
  const votes_given = ratedGame.coolness;
  const actualCoolness = ratedGame.coolness;
  const actualKarma =
    Math.log(1 + ratedGame.coolness) - Math.log(1 + ratedGame.rating_count) / Math.log(5);

  const out = {
    responsesChart,
    smallestRating: sortedRatings[0],
    biggestRating: sortedRatings[numGames - 1],
    smallestKarma: _sortedKarma[0],
    highestKarma: _sortedKarma[numGames - 1],
    medianRating,
    meanRating,
    meanKarma,
    medianKarma,
    variance,
    standardDeviation,
    kurtosis,
    skewness,
    points,
    teamToScorePoints,
    ratingCountToScorePoints,
    scoreToRatingNumPoints,
    numGames: games.length,
    ratedGame,
    ratedGamePercentile,
    ratedGamePosition,
    jamTitle,
    PlatformPieData,
    wordCloud,
    actualKarma: roundValue(actualKarma, 3),
    actualCoolness: roundValue(actualCoolness, 3),
    ratedGameResult,
  } as JamGraphData;
  return out;
};

const analyzeJam = cache(
  (entryJsonLink, rateLink, jamTitle, gameTitle, optionsData) =>
    _analyzeJam(entryJsonLink, rateLink, jamTitle, gameTitle, optionsData),
  ["JamAnalyze"],
  {
    revalidate: halfHour, // seconds
  }
);

const _getGameFromGames = (games: ParsedJamGame[], rateLink: string) => {
  const ratedGame = games.find((obj, index) => {
    const absUrl = `https://itch.io${obj.url}`;
    if (absUrl == rateLink) {
      return true;
    }
  }) as ParsedJamGame;
  return ratedGame;
};

const _analyzeAll = async (
  entryJsonLink: string,
  rateLink: string,
  jamTitle: string,
  gameTitle: string,
  optionsData: JsonOptions | undefined
) => {
  const startTime = performance.now();
  const data = await analyzeJam(
    entryJsonLink,
    rateLink,
    jamTitle,
    gameTitle,
    optionsData
  );

  const endTime = performance.now();
  const dif = endTime - startTime;
  console.log(`Took ${dif / 1000} seconds for ${data.numGames} games in jam.`);
  return data;
};
// maybe cache this?
// meh, dunno
export const analyzeAll = _analyzeAll;
