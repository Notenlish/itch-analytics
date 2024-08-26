import {
    ChartConfig,
    ChartContainer,
    ChartLegend,
    ChartLegendContent,
    ChartTooltip,
    ChartTooltipContent,
  } from "@/components/ui/chart";
  import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
  } from "@/components/ui/card";
  import { GraphRatingCountToScorePoint, GraphTeamToScorePoint } from "@/lib/types";
  import { Bar, BarChart, CartesianGrid, XAxis, YAxis, Label } from "recharts";
  import { TypographyH3, TypographyH2, TypographyH4 } from "./typography";
  
  const chartConfig = {
    ratingCount: { label: "Rating Count" },
    score: {
      label: "",
      color: "#16a34a",
    },
  } satisfies ChartConfig;
  
  export default function RatingCountByScore({
    results,
    jamTitle,
  }: {
    results: GraphRatingCountToScorePoint[] | undefined;
    jamTitle: string;
  }) {
    return (
      <>
        {results ? (
          <Card>
            <CardHeader className="items-center pb-0">
              <CardTitle className="text-center">
                Average Score by Rating Count for {jamTitle}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ChartContainer config={chartConfig} className="min-h-[200px] w-full">
                {/* @ts-ignore */}
                <BarChart accessibilityLayer data={results}>
                  <CartesianGrid vertical={false} />
                  <XAxis
                    dataKey="name"
                    tickLine={false}
                    tickMargin={7}
                    axisLine={false}
                    label={
                      <Label
                        value={"Rating Count"}
                        dy={15}
                        position={"center"}
                      />
                    }
                    tickFormatter={(value) => value.slice(0, 6)}
                  />
                  <ChartTooltip content={<ChartTooltipContent indicator="line" />} />
                  <ChartLegend content={<ChartLegendContent />} />
                  <YAxis
                    label={
                      <Label
                        value="Average score"
                        angle={-90}
                        dx={-5}
                        offset={-10}
                      />
                    }
                    domain={[0,5]}
                    dataKey="score"
                  />
                  <Bar
                    dataKey="score"
                    fill="var(--color-score)"
                    radius={4}
                    barSize={"2.8%"}
                  />
                </BarChart>
              </ChartContainer>
            </CardContent>
            {/* <CardFooter></CardFooter> */}
          </Card>
        ) : (
          <></>
        )}
      </>
    );
  }
  