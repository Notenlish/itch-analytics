"use client";
import { TypographyH3, TypographyH2 } from "./typography";
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";
import { JamGraphData } from "@/lib/types";
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
  rating: {
    label: "Rating",
    color: "#FACC15",
  },
  karma: {
    label: "Karma",
    color: "#F59E0B",
  },
} satisfies ChartConfig;

/*
Important: Remember to set a min-h-[VALUE] on the ChartContainer component.
This is required for the chart be responsive.
*/

export default function JamGraph({ data }: { data: JamGraphData }) {
  const ratedGame = data.ratedGame;
  const _5to99percent = data.points.filter((e, i) => {
    if (5 <= e.percentile && e.percentile <= 99) {
      return true;
    }
  });
  return (
    <div className="flex flex-col gap-12">
      <div>
        <TypographyH2 text={`Statistics about ${data.jamTitle}`}></TypographyH2>
      </div>
      <div>
        <TypographyH3>Rating Counts By Percentile</TypographyH3>
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
          </BarChart>
        </ChartContainer>
      </div>
      <div>
        <TypographyH3>Average Karma By Rating Count</TypographyH3>
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
            <YAxis dataKey="karma" />
            <Bar dataKey="karma" fill="var(--color-karma)" radius={4} />
          </BarChart>
        </ChartContainer>
      </div>
      <div>
        <TypographyH3>Bottom 95% to top 1%</TypographyH3>
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
        <TypographyH3>
          Information About Your Game:{" "}
          <span className="capitalize">{ratedGame.game?.title}</span>
        </TypographyH3>
        <div className="capitalize">
          <p>
            <span className="font-bold">Karma:</span> {ratedGame.coolness}
          </p>
          <p>
            <span className="font-bold">rating count:</span> {ratedGame.rating_count}
          </p>
          <p>
            Your game placed in the
            <span className="font-bold"> top {100 - data.ratedGamePercentile}% </span>
            of games.
          </p>
        </div>
      </div>
    </div>
  );
}
