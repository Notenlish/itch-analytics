import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const calculateMean = (data: number[]) => {
  const sum = data.reduce((acc, value) => acc + value, 0);
  return sum / data.length;
};

export const calculateStandardDeviation = (data: number[], mean: number) => {
  const variance = data.reduce((acc, value) => acc + Math.pow(value - mean, 2), 0) / data.length;
  return Math.sqrt(variance);
};

export const calculateSkewness = (data: number[]) => {
  const n = data.length;
  const mean = calculateMean(data);
  const stdDev = calculateStandardDeviation(data, mean);

  const skewness = (n * data.reduce((acc, value) => acc + Math.pow((value - mean) / stdDev, 3), 0)) /
                   ((n - 1) * (n - 2));

  return skewness;
};

export const calculateKurtosis = (data: number[]) => {
  const n = data.length;
  const mean = calculateMean(data);
  const stdDev = calculateStandardDeviation(data, mean);

  const kurtosis = (n * (n + 1) * data.reduce((acc, value) => acc + Math.pow((value - mean) / stdDev, 4), 0)) /
                   ((n - 1) * (n - 2) * (n - 3)) -
                   (3 * Math.pow(n - 1, 2)) / ((n - 2) * (n - 3));

  return kurtosis;
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

export const calculatePointsIntervals = (sortedValues: number[]) => {
  // Sort the rating counts
  const arrlength = sortedValues.length;

  const percentile = (percent: number) => {
      const index = Math.round((percent / 100) * arrlength);
      return sortedValues[index];
  };

  const points = [];
  const stepSize = 0.05; // 5% step size

  for (let v = 0; v <= 1; v += stepSize) {
      const val = percentile(v * 100); // Convert v to percentage
      const _percent = Math.round(v*100)
      points.push({
          percentile: _percent,  // Store the percentile value (0%, 5%, 10%, etc.)
          cdf: val,  // The corresponding CDF value
          rating: sortedValues[Math.floor(v*arrlength)],
          name:`${_percent}%`
      });
  }

  return points;
};


