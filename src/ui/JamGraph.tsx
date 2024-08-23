"use client";
import { TypographyH3 } from "./typography";
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";

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

const chartConfig = {
  /*
  cdf: {
    label: "CDF",
    color: "#F59E0B",
  },
  */
  rating: {
    label: "Rating",
    color: "#FACC15",
  },
} satisfies ChartConfig;

/*
Important: Remember to set a min-h-[VALUE] on the ChartContainer component.
This is required for the chart be responsive.
*/

type JamGame = {
  rating_count: number;
  created_at: string;
  id: number;
  url: string;
  coolness: number;
  game: {
    title: string;
    url: string;
    user: {
      url: string;
      id: number;
      name: string;
    };
    id: number;
    cover: string;
    short_text: string;
    cover_color: string;
    platforms: string[];
  };
  // what is this?
  field_responses: string[];
};

type JamData = {
  smallest: number;
  biggest: number;
  median: number;
  mean: number;
  kurtosis: number;
  skewness: number;
  points: {
    percentile: number;
    // cdf: number;
    rating: number;
    name: string;
  }[];
  top99Percent: number;
  top99_5Percent: number;
  ratedGame: JamGame;
  ratedGamePercentile: number;
};

export default function JamGraph({ data }: { data: JamData }) {
  const game = data.ratedGame;
  const _5to99percent = data.points.filter((e, i) => {
    if (5 <= e.percentile && e.percentile <= 99) {
      return true;
    }
  });
  return (
    <div className="flex flex-col gap-12">
      <div>
        <TypographyH3 text="All Games"></TypographyH3>
        <ChartContainer config={chartConfig} className="min-h-[200px] w-full">
          {/* @ts-ignore */}
          <BarChart accessibilityLayer data={data["points"]}>
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="name"
              tickLine={false}
              tickMargin={10}
              axisLine={false}
              tickFormatter={(value) => value.slice(0, 4)}
            />
            <ChartTooltip content={<ChartTooltipContent />} />
            <ChartLegend content={<ChartLegendContent />} />
            <YAxis dataKey="rating" />
            <Bar dataKey="rating" scale="log" fill="var(--color-rating)" radius={4} />
            {/*
        <Bar dataKey="cdf" fill="var(--color-cdf)" radius={4} />
        <Bar dataKey="mobile" fill="var(--color-mobile)" radius={4} />
        */}
          </BarChart>
        </ChartContainer>
      </div>
      <div>
        <TypographyH3 text="5% to 99%"></TypographyH3>
        <ChartContainer config={chartConfig} className="min-h-[200px] w-full">
          {/* @ts-ignore */}
          <BarChart accessibilityLayer data={_5to99percent}>
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="name"
              tickLine={false}
              tickMargin={10}
              axisLine={false}
              tickFormatter={(value) => value.slice(0, 4)}
            />
            <ChartTooltip content={<ChartTooltipContent />} />
            <ChartLegend content={<ChartLegendContent />} />
            <YAxis dataKey="rating" />
            <Bar dataKey="rating" scale="log" fill="var(--color-rating)" radius={4} />
            {/*
        <Bar dataKey="cdf" fill="var(--color-cdf)" radius={4} />
        <Bar dataKey="mobile" fill="var(--color-mobile)" radius={4} />
        */}
          </BarChart>
        </ChartContainer>
      </div>
      <div className="text-lg">
        <TypographyH3 text={`Information About Your Game: ${game.game.title}`} />
        <div>
        <p>
          <span className="font-bold">Coolness:</span> {game.coolness}
        </p>
        <p>
          <span className="font-bold">platforms:</span> {game.game.platforms.join(",")}
        </p>
        <p>
          <span className="font-bold">rating count:</span> {game.rating_count}
        </p>
        <p>
          <span className="font-bold">Your game's percentile in rating count:</span>{" "}
          {data.ratedGamePercentile}%
        </p>
        </div>
      </div>
    </div>
  );
}
