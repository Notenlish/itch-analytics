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
import { roundValue, getAdjustmentDropText, rankingTextInt } from "@/lib/utils";
import FAQ from "./faq";
import PlatformsChart from "./platformsCharts";
import WordCloud from "./wordCloud";
import ResponsesPieChart from "./responsesChart";
import ScoreByTeamSizeGraph from "@/ui/scoreByTeamSizeGraph";
import ScoreByRatingCount from "./ScoreByRatingCount";
import RatingCountByScore from "./RatingCountByScore";

const chartConfig = {
  rating: {
    label: "Avg Rating per Percentile",
    color: "#FACC15",
  },
  coolness: {
    label: "Avg votes given",
    color: "#F59E0B",
  },
} satisfies ChartConfig;

/*
Important: Remember to set a min-h-[VALUE] on the ChartContainer component.
This is required for the chart be responsive.
*/

export default function JamGraph({ data }: { data: JamGraphData }) {
  const ratedGame = data.ratedGame;
  const ratedGameResult = data.ratedGameResult;
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
            <span>
              Your Coolness: <span className="font-bold">{data.actualCoolness}</span>
              <br />
              Coolness is used by itch.io to calculate Karma.
            </span>
            <br />
            <span>Your karma: </span>
            <span className="font-bold">{data.actualKarma}</span>
            <br />
            <span className="normal-case">
              Karma is what itch.io uses to give people who rate other peoples an boost in
              ratings and votes.{" "}
              <span className="font-bold">
                Karma calculation may not be 100% accurate.
              </span>
            </span>{" "}
            <span className="font-bold normal-case">
              Please note that its expected for karma to be a negative value. You should
              aim for the karma to be as close to zero.
            </span>
            <br />
          </p>
          <p>
            <span className="">rating count: </span>
            <span className="font-bold">{ratedGame.rating_count}</span>
          </p>
          <div>
            {data.ratedGamePercentile >= 50 ? (
              <p>
                Your game placed in the
                <span className="font-bold">
                  {" "}
                  top {roundValue(100 - data.ratedGamePercentile, 3)}%{" "}
                </span>
                of games, with a ranking of
                <span className="font-bold">
                  {" "}
                  {rankingTextInt(data.ratedGamePosition)}{" "}
                </span>
                in rating count. No score reduction will be applied since your rating
                count is higher than the median of
                <span className="font-bold"> {data.medianRating} </span>.
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
          <p>
            <span className="font-bold">Votes you gave to other people:</span>{" "}
            {ratedGame.coolness}
          </p>
          <div>
            {ratedGameResult ? (
              <div>
                Your games score in the criteria:
                <div className="mt-4 flex flex-col gap-4">
                  {ratedGameResult?.criteria.map((e, i) => {
                    return (
                      <div key={i} className="grid grid-cols-4 gap-2">
                        <p className="font-xl">
                          <span className="font-bold">{e.name}:</span>
                        </p>
                        <p>
                          Rank:{" "}
                          <span className="font-bold">{rankingTextInt(e.rank)}</span>
                        </p>
                        <p>
                          Raw score:{" "}
                          <span className="font-bold">{roundValue(e.raw_score, 3)}</span>
                        </p>
                        <p>
                          Score:{" "}
                          <span className="font-bold">{roundValue(e.score, 3)}</span>
                        </p>
                      </div>
                    );
                  })}
                </div>
                <p>
                  Your rank is{" "}
                  <span className="font-bold">
                    {rankingTextInt(ratedGameResult?.rank as number)}
                  </span>
                </p>
                <p>
                  Your raw score is{" "}
                  <span className="font-bold">
                    {roundValue(ratedGameResult?.raw_score as number, 3)}
                  </span>
                </p>
                <p>
                  Your score is{" "}
                  <span className="font-bold">
                    {roundValue(ratedGameResult?.score as number, 3)}
                  </span>
                </p>
              </div>
            ) : (
              <></>
            )}
          </div>
        </div>
      </div>
      <div className="flex flex-col gap-8">
        <TypographyH2>
          <span className="font-normal">Statistics about </span>{" "}
          <span className="capitalize font-bold" style={{ color: data.color as string }}>
            {data.jamTitle.replace("gmtk", "GMTK")}
          </span>
        </TypographyH2>
        <>
          <div className="flex flex-col gap-1">
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
              Median is the amount of ratings of top 50%. If you get below median, Itch.io
              will lower your score.
            </p>
            <p>
              Average Rating count: <span className="font-bold">{data.meanRating}</span>
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
          <div className="flex flex-col gap-1">
            <div className="mb-2">
              <TypographyH3>Coolness: </TypographyH3>
            </div>
            <p>
              Coolness is used to determine your &quot;karma&quot; rating. Itch uses it to
              balance how many ratings you give vs how many you receive. You should rate
              other games and give feedback to the developers to increase your
              coolness(and karma) value.
            </p>
            <p>
              Median Coolness is: <span className="font-bold">{data.medianKarma}</span>
              <br />
              Median is the Coolness value of top 50%.
            </p>
            <p>
              Average Coolness: <span className="font-bold">{data.meanKarma}</span>
            </p>
            <p>
              Smallest Coolness: <span className="font-bold">{data.smallestKarma}</span>
            </p>
            <p>
              Highest Coolness is:
              <span className="font-bold"> {data.highestKarma}</span>
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
                        // Rating Count Percentile
                        value={""}
                        dy={-5}
                        position={"bottom"}
                      />
                    }
                    tickFormatter={(value) => value.slice(0, 4)}
                  />
                  <ChartTooltip content={<ChartTooltipContent indicator="line" />} />
                  <ChartLegend content={<ChartLegendContent />} />
                  <YAxis
                    scale={"log"}
                    domain={["auto", "auto"]}
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
            <TypographyH3>
              Average Votes Given Compared To Rating Count Percentile
            </TypographyH3>
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
                        // so it will just not write average coolness for now
                        // im waiting for a pr to merge..
                        /*
                      formatter={(v) => {
                        return `Average Coolness: ${roundValue(v,2)}`;
                      }}
                      */
                      />
                    }
                  />
                  <ChartLegend content={<ChartLegendContent />} />
                  <YAxis
                    label={{
                      value: "Average votes given",
                      angle: -90,
                      position: "insideCenter",
                      offset: 20,
                    }}
                    dataKey="coolness"
                  />
                  <Bar
                    // label={{ value: 0, offset: 10 }}
                    dataKey="coolness"
                    fill="var(--color-coolness)"
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
          <PlatformsChart chartData={data.PlatformPieData} jamTitle={data.jamTitle} />
          <ScoreByTeamSizeGraph
            results={data.teamToScorePoints}
            jamTitle={data.jamTitle}
          />
          <ScoreByRatingCount
            results={data.ratingCountToScorePoints}
            jamTitle={data.jamTitle}
          />
          <RatingCountByScore
            results={data.scoreToRatingNumPoints}
            jamTitle={data.jamTitle}
          />
          {/*
          <ResponsesPieChart chartData={data.responsesChart} jamTitle={data.jamTitle} />
          */}
          <WordCloud data={data.wordCloud} />
        </>
      </div>
    </div>
  );
}
