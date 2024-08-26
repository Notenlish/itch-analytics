import { PlatformPieChartData, responsesChartData } from "@/lib/types";
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

/*
{
    response: string;
    count: any;
    fill: string;
}[]
*/
const getConfig = (data: responsesChartData, jamTitle: string) => {
  // example: { '29887:2': 11, '29887:1': 13 }
  /*
    for gmtk
    wanted output => {
      count: {label:"Count"},
      "29768:1": {
        label: "48 Hours",
        color: "#2563EB",
      },
      "29768:2": {
        label:"96 hours",
        color: "#dc2626"
      }
    }
  */
  let out = {} satisfies ChartConfig;
  if (
    jamTitle.toLowerCase().includes("gmtk") &&
    jamTitle.toLowerCase().includes("2024")
  ) {
    // hardcoded variables? // les gooo
    out = {
      count: { label: "Count" },
      "29768:1": {
        label: "48 Hours",
        color: "#2563EB",
      },
      "29768:2": {
        label: "96 hours",
        color: "#dc2626",
      },
    } satisfies ChartConfig;
  } else {
    out = {
      count: { label: "Count" },
      ...Object.entries(data).reduce((acc, [responseType, responseCount], idx) => {
        acc[responseType] = {
          label: `Response ${idx + 1}`, // Customize this label logic
          color: `#${Math.floor(Math.random() * 16777215).toString(16)}`, // Random color or custom logic
        };
        return acc;
      }, {} as ChartConfig),
    };
  }
  console.log(out);
  return out;
};

export default function ResponsesPieChart({
  chartData,
  jamTitle,
}: {
  chartData: responsesChartData;
  jamTitle: string;
}) {
  const chartConfig = getConfig(chartData, jamTitle);
  return (
    <Card className="flex flex-col">
      <CardHeader className="items-center pb-0">
        <CardTitle className="text-center">Responses Pie Chart for {jamTitle}</CardTitle>
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
