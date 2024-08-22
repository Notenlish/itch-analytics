"use client";

import { Bar, BarChart, CartesianGrid, XAxis } from "recharts";

import {
  ChartConfig,
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";

const chartData = [
  { month: "January", desktop: 186, mobile: 80 },
  { month: "February", desktop: 305, mobile: 200 },
  { month: "March", desktop: 237, mobile: 120 },
  { month: "April", desktop: 73, mobile: 190 },
  { month: "May", desktop: 209, mobile: 130 },
  { month: "June", desktop: 214, mobile: 140 },
];

/* 
{
  percentile: _percent,  // Store the percentile value (0%, 5%, 10%, etc.)
  cdf: val,  // The corresponding CDF value
  rating: sortedValues[Math.floor(v*arrlength)],
  name:`${_percent}%`
}
*/

const chartConfig = {
  cdf: {
    label: "CDF",
    color: "#F59E0B",
  },
  rating: {
    label: "Rating",
    color: "#FACC15",
  },
} satisfies ChartConfig;

/*
Important: Remember to set a min-h-[VALUE] on the ChartContainer component.
This is required for the chart be responsive.
*/

type JamData = {
  smallest: number;
  biggest: number;
  median: number;
  mean: number;
  kurtosis: number;
  skewness: number;
  CdfPoints: { percentile: number; cdf: number; rating: number; name: string }[];
  top99Percent: number;
  top99_5Percent: number;
};

export default function JamGraph({ data }: { data: JamData }) {
  return (
    <ChartContainer config={chartConfig} className="min-h-[200px] w-full">
      {/* @ts-ignore */}
      <BarChart accessibilityLayer data={data["CdfPoints"]}>
        <CartesianGrid vertical={false} />
        <XAxis
          dataKey="name"
          tickLine={false}
          tickMargin={10}
          axisLine={false}
          tickFormatter={(value) => value.slice(0, 3)}
        />
        <ChartTooltip content={<ChartTooltipContent />} />
        <ChartLegend content={<ChartLegendContent />} />
        <Bar dataKey="rating" fill="var(--color-rating)" radius={4} />
        {/*
        <Bar dataKey="cdf" fill="var(--color-cdf)" radius={4} />
        <Bar dataKey="mobile" fill="var(--color-mobile)" radius={4} />
        */}
      </BarChart>
    </ChartContainer>
  );
}
