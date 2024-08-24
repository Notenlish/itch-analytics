import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"
import { GraphBarPoint } from "./types";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

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

export const calculatePointsIntervals = ({sortedRatings}:{sortedRatings:number[]},{sortedKarmas}:{sortedKarmas:number[]}) => {
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
        const k = sortedKarmas[karmaIndex]
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
      karma: avgKarmaInBar,
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
