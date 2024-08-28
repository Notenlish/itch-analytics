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
  "linux-osx-web-windows": {
    label: "Linux Osx Web Windows ",
    color: "#EF4444",
  },
  "android-web": {
    label: "Android Web ",
    color: "#F97316",
  },
  "osx-windows": {
    label: "Windows Osx ",
    color: "#A3FA15",
  },
  "osx-web-windows": {
    label: "Web Windows Osx ",
    color: "#15B5FA",
  },
  "web-windows": {
    label: "Web Windows ",
    color: "#153AFA",
  },
  "linux-web-windows": {
    label: "Linux Web Windows ",
    color: "#A60EDB",
  },
  "linux-osx-windows": {
    label: "Linux Osx Windows ",
    color: "#C321A9",
  },
  "linux-windows": {
    label: "Linux Windows ",
    color: "#DB358F",
  },
  "android-web-windows": {
    label: "Android Web Windows ",
    color: "#DB3553",
  },
  "android-windows": {
    label: "Android Windows ",
    color: "#B99619",
  },
  "android-linux-windows": {
    label: "Android Linux Windows ",
    color: "#60CC1F",
  },
  "android-linux-web-windows": {
    label: "Android Linux Web Windows ",
    color: "#B94919",
  },
  // bro what kinda combination is this
  "android-linux-osx-web-windows": {
    label: "Android Linux Osx Web Windows ",
    color: "#B8D448",
  },
  "android-linux-osx-windows": {
    label: "Android Linux Osx Windows ",
    color: "#1FCC64",
  },
  "linux-web": {
    label: "Linux Web ",
    color: "#54CCE6",
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
          className="mx-auto aspect-square max-h-[400px]">
          <PieChart>
            <ChartTooltip cursor={false} content={<ChartTooltipContent hideLabel />} />
            <Pie data={chartData} dataKey="count" nameKey="platform"></Pie>
            <ChartLegend
              fontSize={16}
              content={<ChartLegendContent nameKey="platform" />}
              className=" w-full -translate-y-2 flex-wrap gap-2 [&>*]:basis-1/4 [&>*]:justify-center"
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
