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
      const karma = sortedKarmas[index]
      return {rating, karma};
  };
  const to_percentage_str = (v:number) => {
    const out = Math.round(v * 2) / 2
    return out.toString()
  }

  const points:GraphBarPoint[] = [];
  const stepSize = 0.05; // 5% step size

  const calc = (v:number) => {
      const _percent = v * 100;
      const {rating, karma} = percentile(v); // Convert v to percentage
      const percent = to_percentage_str(_percent);
      const obj = {
        percentile: _percent,  // 5% 10% etc.
        rating: rating,
        karma: karma,
        name:`${percent}%`,
    } as GraphBarPoint
      return obj;
  }

  for (let v = 0; v <= 0.9; v += stepSize) {
      points.push(calc(v));  // elements up to 90%
  } // 90 92.5 97.5
  points.push(calc(0.925))
  points.push(calc(0.95))
  points.push(calc(0.96))
  points.push(calc(0.97))
  points.push(calc(0.975))
  points.push(calc(0.98))
  points.push(calc(0.985))
  points.push(calc(0.99))
  points.push(calc(0.995))
  points.push(calc(1.0))
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
