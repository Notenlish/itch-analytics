"use client";
import { TypographyH3, TypographyH2, TypographyH4 } from "./typography";
import { Bar, BarChart, CartesianGrid, XAxis, YAxis, Label } from "recharts";
import { JamGraphData } from "@/lib/types";
import {
  ChartConfig,
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { roundValue, getAdjustmentDropText } from "@/lib/utils";

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
  data.points = data.points.map((e, i) => {
    // @ts-ignore
    e.average_karma = e.karma;
    return e;
  });
  const _5to99percent = data.points.filter((e, i) => {
    if (5 <= e.percentile && e.percentile <= 99) {
      return true;
    }
  });
  return (
    <div className="flex flex-col gap-16">
      <div className="text-lg">
        <TypographyH2>
          <span className="font-normal">Information About Your Game: </span>
          <div className="capitalize mb-4">
            <span className="capitalize">{ratedGame.game?.title}</span>
          </div>
        </TypographyH2>
        <div className="capitalize">
          <p>
            <span className="font-bold">Karma:</span> {ratedGame.coolness}
          </p>
          <p>
            <span className="font-bold">rating count:</span> {ratedGame.rating_count}
          </p>
          <div>
            {data.ratedGamePercentile > 50 ? (
              <p>
                Your game placed in the
                <span className="font-bold">
                  {" "}
                  top {roundValue(100 - data.ratedGamePercentile, 3)}%{" "}
                </span>
                of games in rating count. You will not get a score reduction since your
                rating count is higher than median rating of{" "}
                <span className="font-bold">{data.medianRating}</span>.
                <br />
                <br />
                <span className="font-bold">Congrats on participating!</span>
              </p>
            ) : (
              <p>
                Your game placed in the
                <span className="font-bold"> bottom {data.ratedGamePercentile}% </span>
                of games.{" "}
                <span className="font-bold">
                  You will get a score reduction of{" "}
                  {getAdjustmentDropText(data.medianRating, ratedGame.rating_count)}
                </span>{" "}
                as your rating count is lower than median rating of{" "}
                <span className="font-bold">{data.medianRating}</span>
                <br />
                <br />
                <span className="font-bold">
                  Don&apos;t worry! You still have a chance.
                </span>
              </p>
            )}
          </div>
        </div>
      </div>
      <div className="flex flex-col gap-8">
        <TypographyH2>
          <span className="font-normal">Statistics about </span>{" "}
          <span className="capitalize">{data.jamTitle.replace("gmtk", "GMTK")}</span>
        </TypographyH2>
        <>
          <div className="">
            <div className="mb-2">
              <TypographyH3>Rating Count: </TypographyH3>
            </div>
            <p>
              Kurtosis: <span className="font-bold">{data.kurtosis}</span>
            </p>
            <p>
              Skewness: <span className="font-bold">{data.skewness}</span>
            </p>
            <p>
              Variance: <span className="font-bold">{data.variance}</span>
            </p>
            <p>
              Standard Deviation:{" "}
              <span className="font-bold">{data.standardDeviation}</span>
            </p>
            <p>
              Median: <span className="font-bold">{data.medianRating}</span>
              <br />
              If you get below median, Itch.io will lower your score.
            </p>
            <p>
              Mean Rating: <span className="font-bold">{data.meanRating}</span>
            </p>
            <p>
              Highest rating count:{" "}
              <span className="font-bold">{data.biggestRating}</span>
            </p>
            <p>
              Lowest rating count:{" "}
              <span className="font-bold">{data.smallestRating}</span>
            </p>
          </div>
          <div>
            <TypographyH3>Rating Counts By Percentile</TypographyH3>
            <div className="mt-4">
              <ChartContainer config={chartConfig} className="min-h-[200px] w-full">
                {/* @ts-ignore */}
                <BarChart accessibilityLayer data={data["points"]}>
                  <CartesianGrid vertical={false} />
                  <XAxis
                    dataKey="name"
                    tickLine={false}
                    tickMargin={7}
                    axisLine={false}
                    // className="translate-y-8"
                    label={
                      <Label
                        value={"Rating Count Percentile"}
                        dy={-5}
                        position={"bottom"}
                      />
                    }
                    tickFormatter={(value) => value.slice(0, 4)}
                  />
                  <ChartTooltip content={<ChartTooltipContent indicator="line" />} />
                  <ChartLegend content={<ChartLegendContent />} />
                  <YAxis
                    label={<Label value="Rating" angle={-90} dx={-5} offset={-10} />}
                    dataKey="rating"
                  />
                  <Bar
                    dataKey="rating"
                    fill="var(--color-rating)"
                    radius={4}
                    barSize={"2.8%"}
                  />
                </BarChart>
              </ChartContainer>
            </div>
          </div>
          <div>
            <TypographyH3>Average Karma Compared To Rating Count Percentile</TypographyH3>
            <div className="mt-4">
              <ChartContainer config={chartConfig} className="min-h-[200px] w-full">
                {/* @ts-ignore */}
                <BarChart accessibilityLayer data={data["points"]}>
                  <CartesianGrid vertical={false} />
                  <XAxis
                    dataKey="name"
                    className="translate-y-8"
                    label={
                      <Label value={"Rating Count Percentile"} position={"insideTop"} />
                    }
                    tickLine={false}
                    tickMargin={-20}
                    axisLine={false}
                    tickFormatter={(value) => value.slice(0, 4)}
                  />
                  <ChartTooltip
                    label={<Label />}
                    content={
                      <ChartTooltipContent
                        indicator="line"
                        // I cant do this as it gets rid of the beautiful colors of the chartooltipcontent
                        // so it will just not write average karma for now
                        // im waiting for a pr to merge..
                        /*
                      formatter={(v) => {
                        return `Average Karma: ${roundValue(v,2)}`;
                      }}
                      */
                      />
                    }
                  />
                  <ChartLegend content={<ChartLegendContent />} />
                  <YAxis
                    label={{
                      value: "Average Karma",
                      angle: -90,
                      position: "insideCenter",
                      offset: 20,
                    }}
                    dataKey="karma"
                  />
                  <Bar
                    // label={{ value: 0, offset: 10 }}
                    dataKey="karma"
                    fill="var(--color-karma)"
                    radius={4}
                    barSize={"2.8%"}
                  />
                </BarChart>
              </ChartContainer>
            </div>
          </div>
          <div>
            <TypographyH3>Bottom 95% to top 1%</TypographyH3>
            <div className="mt-4">
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
                  <Bar
                    dataKey="rating"
                    scale="log"
                    fill="var(--color-rating)"
                    radius={4}
                  />
                  {/*
        <Bar dataKey="cdf" fill="var(--color-cdf)" radius={4} />
        <Bar dataKey="mobile" fill="var(--color-mobile)" radius={4} />
        */}
                </BarChart>
              </ChartContainer>
            </div>
          </div>
        </>
      </div>
    </div>
  );
}
