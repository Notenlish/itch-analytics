import { PlatformPieChartData } from "@/lib/types";
import { Pie, PieChart, LabelList } from "recharts";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
} from "@/components/ui/chart";

const chartConfig = {
  count: {
    label: "Count",
  },
  windows: {
    label: "Windows",
    color: "#2563EB",
  },
  osx: {
    label: "MacOS",
    color: "#dc2626",
  },
  linux: {
    label: "Linux",
    color: "#fb923c",
  },
  android: {
    label: "Android",
    color: "#16a34a",
  },
  web: {
    label: "Web",
    color: "#6d28d9",
  },
} satisfies ChartConfig;

export default function PlatformsChart({
  chartData,
  jamTitle,
}: {
  chartData: PlatformPieChartData[];
  jamTitle: string;
}) {
  return (
    <Card className="flex flex-col">
      <CardHeader className="items-center pb-0">
        <CardTitle className="text-center">Platform Pie Chart for {jamTitle}</CardTitle>
      </CardHeader>
      <CardContent className="flex-1 pb-0">
        <ChartContainer
          config={chartConfig}
          className="mx-auto aspect-square max-h-[250px]">
          <PieChart>
            <ChartTooltip cursor={false} content={<ChartTooltipContent hideLabel />} />
            <Pie data={chartData} dataKey="count" nameKey="platform"></Pie>
            <ChartLegend
              fontSize={20}
              content={<ChartLegendContent nameKey="platform" />}
              className="-translate-y-2 flex-wrap gap-2 [&>*]:basis-1/4 [&>*]:justify-center"
            />
          </PieChart>
        </ChartContainer>
      </CardContent>
      <CardFooter className="flex-col gap-2 text-sm">
        <div className="flex items-center gap-2 font-medium leading-none">
          Pie chart of available platforms in games for {jamTitle}
        </div>
      </CardFooter>
    </Card>
  );
}
