import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"
import { ParsedJamGame, GraphBarPoint, RawJamGame, MinifiedJamGame, PlatformPieChartData } from "./types";
import zlib from "zlib"
import util from 'util';

// Convert zlib functions to promises
const gzipPromise = util.promisify(zlib.gzip);
const unzipPromise = util.promisify(zlib.unzip);

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}


var escapable = /[\\\"\x00-\x1f\x7f-\uffff]/g;
var meta = {    // table of character substitutions
    '\b': '\\b',
    '\t': '\\t',
    '\n': '\\n',
    '\f': '\\f',
    '\r': '\\r',
    '"' : '\\"',
    '\\': '\\\\',
};

// @ts-ignore
export function UTF8AsASCII(string) {

    // Replace non-breaking spaces (\u00a0) with regular spaces (\x20)
    string = string.replace(/\u00a0/g, ' ');

    // If the string contains no control characters, no quote characters, and no
    // backslash characters, then we can safely slap some quotes around it.
    // Otherwise we must also replace the offending characters with safe escape
    // sequences.
    escapable.lastIndex = 0;
    return escapable.test(string) ?
        // @ts-ignore
        '"' + string.replace(escapable, function (a) {
            // @ts-ignore  
            var c = meta[a];
            return typeof c === 'string' ? c :
                '\\u' + ('0000' + a.charCodeAt(0).toString(16)).slice(-4);
        }) + '"' :
        '"' + string + '"';
}

/**
 * 
 * @param {string} : string
 * @returns {string} - a string
 */
export function PrepareWordCloud(input: string): string {
  const getRidOf = ["'", '"',"the","game", "the", "The","and", "to","To","with","With","In", "and","is","my", "as", "bit", ",","in", "on", "of"]
  let out = input.toLowerCase();
  getRidOf.forEach((e)=>{
    out = out.replaceAll(e, "")
  })
  return out;
}

const __typeSizes = {
  undefined: () => 0,
  boolean: () => 4,
  number: () => 8,
  string: (item:string) => 2 * item.length,
  // @ts-ignore
  object: (item:object) =>
    !item
      ? 0
      : Object.keys(item).reduce(
        // @ts-ignore
          (total, key) => sizeOfObject(key) + sizeOfObject(item[key]) + total,
          0
        ),
};
// @ts-ignore
const sizeOfObject = (value) => __typeSizes[typeof value](value);
const sizeOfBuffer = (buf:Buffer) => buf.byteLength; 


export const calculateMean = (data: number[]) => {
  const sum = data.reduce((acc, value) => acc + value, 0);
  return sum / data.length;
};

export const calculateStandardDeviation = (data: number[], mean: number) => {
  const variance = data.reduce((acc, value) => acc + Math.pow(value - mean, 2), 0) / data.length;
  return roundValue(Math.sqrt(variance), 2);
};

export const calculateSkewness = (data: number[]) => {
  const n = data.length;
  const mean = calculateMean(data);
  const stdDev = calculateStandardDeviation(data, mean);

  const skewness = (n * data.reduce((acc, value) => acc + Math.pow((value - mean) / stdDev, 3), 0)) /
                   ((n - 1) * (n - 2));

  return roundValue(skewness, 2);
};

export const calculateKurtosis = (data: number[]) => {
  const n = data.length;
  const mean = calculateMean(data);
  const stdDev = calculateStandardDeviation(data, mean);

  const kurtosis = (n * (n + 1) * data.reduce((acc, value) => acc + Math.pow((value - mean) / stdDev, 4), 0)) /
                   ((n - 1) * (n - 2) * (n - 3)) -
                   (3 * Math.pow(n - 1, 2)) / ((n - 2) * (n - 3));

  return roundValue(kurtosis, 2);
};

export const calculateCDF = (ratings: number[]) => {
  // Step 1: Sort the rating counts
  const sortedRatings = [...ratings].sort((a, b) => a - b);

  // Step 2: Calculate the CDF
  const cdf = sortedRatings.map((rating, index) => {
      return {
          rating,
          cdf: (index + 1) / sortedRatings.length
      };
  });

  return cdf;
};

export const calculatePointsIntervals = ({sortedRatings}:{sortedRatings:number[]},{KarmaByRating}:{KarmaByRating:number[]}) => {
  const arrlength = sortedRatings.length;

  const percentile = (i: number) => {
      const index = Math.floor(i * (arrlength - 1));
      const rating = sortedRatings[index];
      return {rating};
  };
  const to_percentage_str = (v:number) => {
    const out = Math.round(v * 2) / 2
    return out.toString()
  }

  
  const calc = (v:number, rangeSize:number) => {
    const _percent = v * 100
    const getAvgKarmaBar = () => {
      const right = v;
      const left = v - rangeSize;
      const rightIndex = Math.floor(right * (arrlength - 1));
      const leftIndex = Math.floor(left * (arrlength - 1));
      /* 
      if (leftIndex < 0) {  // if negative(aka v = 0)
        return 0;
      }
      */
      const countPerBar = rightIndex - leftIndex;
      let totalKarmaInBar = 0;
      // console.log(leftIndex, "to", rightIndex)
      for (let karmaIndex = leftIndex; karmaIndex <= rightIndex; karmaIndex++) {
        const k = KarmaByRating[karmaIndex]
        totalKarmaInBar += k;
      }
      const avgKarmaInBar = totalKarmaInBar / countPerBar
      return avgKarmaInBar
    }
    const avgKarmaInBar = getAvgKarmaBar();
    

    const {rating} = percentile(v); // Convert v to percentage
    const percent = to_percentage_str(_percent);
    const obj = {
      percentile: _percent,  // 5% 10% etc.
      rating: rating,
      coolness: avgKarmaInBar,
      name:`${percent}%`,
    } as GraphBarPoint
    return obj;
  }
  
  const points:GraphBarPoint[] = [];
  const stepSize = 0.05; // 5% step size
  // Dont start at 0, because the calc function uses the v value as the end
  // and uses stepsize to get start, aka, the 0% will become Nan
  // but it looks weird in graph, so I'm just going to go ahead and make it back at 0
  // then just add a if statement to check if 0
  for (let v = stepSize; v <= 0.9; v += stepSize) {
      points.push(calc(v, stepSize));  // elements up to 90%
  } // 90 92.5 97.5
  points.push(calc(0.925, 0.025))
  points.push(calc(0.95, 0.025))
  points.push(calc(0.96, 0.01))
  points.push(calc(0.97, 0.01))
  points.push(calc(0.975, 0.005))
  points.push(calc(0.98, 0.005))
  points.push(calc(0.985, 0.005))
  points.push(calc(0.99, 0.005))
  points.push(calc(0.995, 0.005))
  points.push(calc(1.0, 0.005))
  return points;
};

export const calculateDeviance = (data: number[], mean:number): number[] => {
  return data.map(value => value - mean);
};

export const calculateVariance = (data: number[], mean:number): number => {
  const v = data.reduce((acc, value) => acc + Math.pow(value - mean, 2), 0) / data.length
  return roundValue(v, 2);
};

/**
 * Python-like set counter for an array of strings
 * @param {string[]} array - The number to be rounded.
 * @returns {object} - Object with key:count structure.
 */
export function countStrInArr(array:string[]) {
  var counter = new Object;
  // @ts-ignore
  array.forEach(val => counter[val] = (counter[val] || 0) + 1);
  return counter;
}

export const analyzePlatforms = (platformsByRatingNum:string[][])=>{
  const counter = countStrInArr(platformsByRatingNum.flat());
  const data = Object.entries(counter).map((o)=>{
    const platform = o[0]
    const count = o[1]
    return {"platform":platform, "count":count, fill:`var(--color-${platform})`} as PlatformPieChartData
  });
  return data;
}


/**
 * Rounds a number to a specified number of decimal places.
 * 
 * @param {number} value - The number to be rounded.
 * @param {number} decimals - The number of decimal places to round to.
 * @returns {number} - The rounded number.
 */
export const roundValue = (value:number, decimals = 0) => {
  const factor = Math.pow(10, decimals);
  return Math.round(value * factor) / factor;
}

export const rankingTextInt = (v:number)=>{
  // Handle special cases for 11th, 12th, 13th
  let suffix;
  let lastDigit;
  if (10 <= v % 100 && v % 100 <= 13){
      suffix = "th"
    }
  else{
      // Determine the suffix based on the last digit
      lastDigit = v % 10
      if (lastDigit == 1){
          suffix = "st"}
      else if (lastDigit == 2){
          suffix = "nd"}
      else if (lastDigit == 3){
          suffix = "rd"
        }
      else{
          suffix = "th"
        }
  }
  return `${v}${suffix}`
}

export const calculateAdjustment = (median:number, rating_count:number) => {
  const adjustment = Math.sqrt(Math.min(median, rating_count) / median)
  return adjustment
}

export const getAdjustmentDropText = (median:number, rating_count:number) => {
  const adjustment = calculateAdjustment(median, rating_count) * 100
  // console.log("Adjustment", adjustment)
  const drop = 100 - adjustment;
  // console.log("drop", drop)
  const dropText = `${roundValue(drop, 2)}%`
  return dropText
}

export const parseGame = (obj:RawJamGame) => {
  delete obj.id;
  delete obj.game.id;
  delete obj.game.user
  delete obj.game.url
  delete obj.game.cover

  if (obj.contributors) {
    delete obj.contributors;
  }
  // @ts-ignore
  // contributors has the other team members, so team size is a minimum of 1(solo)
  obj.team_size = obj.contributors ? obj.contributors.length : 1;
  return obj as ParsedJamGame
}

export const minifyGame = (obj:ParsedJamGame) => {
  const out = {
    a:obj.coolness,
    // only adds the key if value isnt null
    // a great way to get rid of unnecessary keys that are null
    ...(obj.field_responses && {b: obj.field_responses}),
    c:obj.created_at,
    d:obj.rating_count,
    e:obj.url,
    f:{
      g:obj.game.title,
      ...(obj.game.short_text && {l: obj.game.short_text}),
      ...(obj.game.gif_cover && {m: obj.game.gif_cover}),
      ...(obj.game.cover_color && {n: obj.game.cover_color}),
      ...(obj.game.platforms && {o: obj.game.platforms}),
    },
    p:obj.team_size
  } as MinifiedJamGame
  
  return out
}

export const deMinifyGame = (obj:MinifiedJamGame) => {
  const out = {
    coolness:obj.a,
    created_at:obj.c,
    rating_count:obj.d,
    ...(obj.b && {field_responses: obj.b}),
    url:obj.e,
    game:{
      title:obj.f.g,
      ...(obj.f.l && {short_text: obj.f.l}),
      ...(obj.f.m && {gif_cover: obj.f.m}),
      ...(obj.f.n && {cover_color: obj.f.n}),
      ...(obj.f.o && {platforms: obj.f.o}),
    },
    team_size:obj.p
  } as ParsedJamGame
  
  return out
}

// EXPECTS ASCII DATA
export const compressJson = async (entry:Object) => {
  console.log(`Uncompressed as bytelength: ${roundValue(Buffer.byteLength(JSON.stringify(entry))/1024/1024,2)} MB`)
  // console.log(`Uncompressed size: ${roundValue(sizeOfObject(entry)/1024/1024,2)} MB`)


  const dataStr = JSON.stringify(entry)
  try {
      const buffer = await gzipPromise(dataStr);
      console.log(`Compressed size with bytelength: ${roundValue(sizeOfBuffer(buffer) / 1024 / 1024,2)} MB`);
      // console.log(`Compressed size with sizeofobj func: ${roundValue(sizeOfObject(buffer) / 1024 / 1024,2)} MB`)
      return buffer
    } catch {
      console.error("ERROR! Couldn't compress entry. Returning null.")
      return null
    }
  }


// EXPECTS ASCII DATA
export const decompressJson = async (buffer:Buffer)=>{
  console.log(`Compressed size: ${roundValue(sizeOfBuffer(buffer) / 1024 / 1024,2)} MB`)

  try {
      const decompressedBuffer = await unzipPromise(buffer);
      const jsonData = decompressedBuffer.toString("utf-8");
      const decompressedData:Object = JSON.parse(jsonData);
      console.log(
        `Decompressed data size: ${roundValue(sizeOfObject(decompressedData) / 1024 / 1024,2)} MB`
      );
      return decompressedData
    } catch (e){
      console.error("Error decompressing data:", e);
      return null
    }
  }
