"use client";

import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";
import {
  ChartContainer,
  ChartTooltipContent,
  ChartLegend,
  ChartTooltip,
} from "@/components/ui/chart";

const chartConfig = {
  requests: {
    label: "Leave Requests",
    color: "hsl(var(--primary))",
  },
} satisfies Record<string, any>;

type ReportsChartProps = {
  data: any[];
  dataKey: string;
};

export function ReportsChart({ data, dataKey }: ReportsChartProps) {
  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-muted-foreground">
        No data to display for this period.
      </div>
    );
  }

  return (
    <ChartContainer config={chartConfig} className="min-h-[200px] w-full h-96">
      <BarChart accessibilityLayer data={data}>
        <CartesianGrid vertical={false} />
        <XAxis
          dataKey={dataKey}
          tickLine={false}
          tickMargin={10}
          axisLine={false}
          tickFormatter={(value) => String(value ?? "").slice(0, 10)}
        />
        <YAxis allowDecimals={false} />
        <ChartTooltip
          cursor={false}
          content={<ChartTooltipContent indicator="dot" />}
        />
        <ChartLegend content={<ChartLegend />} />
        <Bar dataKey="requests" fill="var(--color-requests)" radius={4} />
      </BarChart>
    </ChartContainer>
  );
}
