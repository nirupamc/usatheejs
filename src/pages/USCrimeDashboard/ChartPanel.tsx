import { useMemo } from "react";
import ReactECharts from "echarts-for-react";
import styled from "styled-components";
import type { EChartsOption } from "echarts";
import type { CityConfig } from "../../config/cities";
import type { CrimeRecord } from "../../hooks/useCrimeData";

const LOW_HEX = "#0d1b3e";
const HIGH_HEX = "#e84855";

const AXIS_COLOR = "#8b949e";
const SPLIT_COLOR = "#21262d";
const CHART_HEIGHT = 220;

const Panel = styled.div`
  width: 400px;
  background: #0d1117;
  display: flex;
  flex-direction: column;
  gap: 20px;
  font-family: system-ui, -apple-system, "Segoe UI", sans-serif;
`;

const Card = styled.div`
  background: #0d1117;
  border: 1px solid #21262d;
  border-radius: 8px;
  padding: 12px 14px;
`;

const CardTitle = styled.div`
  font-size: 13px;
  font-weight: 600;
  color: #e6edf3;
  margin-bottom: 8px;
`;

interface ChartPanelProps {
  city: CityConfig;
  crimeData: CrimeRecord[];
}

/** Count occurrences of a record field, skipping empty values. */
function countBy(data: CrimeRecord[], field: string): Map<string, number> {
  const counts = new Map<string, number>();
  for (const record of data) {
    const value = record[field];
    if (value == null || value === "") continue;
    const key = String(value).trim();
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  return counts;
}

/** Top N [label, count] pairs, ascending so the largest renders at the top of a horizontal bar. */
function topAscending(counts: Map<string, number>, n: number): [string, number][] {
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, n)
    .reverse();
}

/** "YYYY-MM" bucket for a date string, or null if unparseable. */
function monthKey(value: unknown): string | null {
  if (value == null) return null;
  const date = new Date(String(value));
  if (Number.isNaN(date.getTime())) return null;
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

function hexToRgb(hex: string): [number, number, number] {
  const n = parseInt(hex.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

/** Interpolate between two hex colors → CSS rgb() string. */
function hexLerp(a: string, b: string, t: number): string {
  const [ar, ag, ab] = hexToRgb(a);
  const [br, bg, bb] = hexToRgb(b);
  const r = Math.round(ar + (br - ar) * t);
  const g = Math.round(ag + (bg - ag) * t);
  const bl = Math.round(ab + (bb - ab) * t);
  return `rgb(${r}, ${g}, ${bl})`;
}

/** Shared dark-theme axis/grid styling for the horizontal bar charts. */
const horizontalBarBase = {
  grid: { left: 8, right: 24, top: 10, bottom: 8, containLabel: true },
  xAxis: {
    type: "value" as const,
    axisLine: { lineStyle: { color: AXIS_COLOR } },
    axisLabel: { color: AXIS_COLOR },
    splitLine: { lineStyle: { color: SPLIT_COLOR } },
  },
  tooltip: { trigger: "axis" as const, axisPointer: { type: "shadow" as const } },
};

export default function ChartPanel({ city, crimeData }: ChartPanelProps) {
  // Chart 1 — Crime trend by month.
  const trendOption = useMemo<EChartsOption>(() => {
    const byMonth = new Map<string, number>();
    for (const record of crimeData) {
      const key = monthKey(record[city.dateField]);
      if (!key) continue;
      byMonth.set(key, (byMonth.get(key) ?? 0) + 1);
    }
    const months = [...byMonth.keys()].sort();
    return {
      grid: { left: 8, right: 16, top: 16, bottom: 8, containLabel: true },
      tooltip: { trigger: "axis" },
      xAxis: {
        type: "category",
        data: months,
        boundaryGap: false,
        axisLine: { lineStyle: { color: AXIS_COLOR } },
        axisLabel: { color: AXIS_COLOR },
      },
      yAxis: {
        type: "value",
        axisLine: { lineStyle: { color: AXIS_COLOR } },
        axisLabel: { color: AXIS_COLOR },
        splitLine: { lineStyle: { color: SPLIT_COLOR } },
      },
      series: [
        {
          type: "line",
          smooth: true,
          showSymbol: false,
          data: months.map((m) => byMonth.get(m) ?? 0),
          lineStyle: { color: city.accent, width: 2 },
          areaStyle: { color: city.accent, opacity: 0.15 },
          itemStyle: { color: city.accent },
        },
      ],
    };
  }, [crimeData, city.dateField, city.accent]);

  // Chart 2 — Top 8 crime categories.
  const categoryOption = useMemo<EChartsOption>(() => {
    const top = topAscending(countBy(crimeData, city.crimeTypeField), 8);
    return {
      ...horizontalBarBase,
      yAxis: {
        type: "category",
        data: top.map(([label]) => label),
        axisLine: { lineStyle: { color: AXIS_COLOR } },
        axisLabel: { color: AXIS_COLOR, width: 110, overflow: "truncate" },
      },
      series: [
        {
          type: "bar",
          data: top.map(([, count]) => count),
          itemStyle: { color: city.accent, borderRadius: [0, 3, 3, 0] },
        },
      ],
    };
  }, [crimeData, city.crimeTypeField, city.accent]);

  // Chart 3 — Top 8 districts, colored dark→red to match the choropleth.
  const districtOption = useMemo<EChartsOption>(() => {
    const top = topAscending(countBy(crimeData, city.crimeDistrictField), 8);
    const max = top.reduce((m, [, c]) => Math.max(m, c), 0);
    return {
      ...horizontalBarBase,
      yAxis: {
        type: "category",
        data: top.map(([label]) => label),
        axisLine: { lineStyle: { color: AXIS_COLOR } },
        axisLabel: { color: AXIS_COLOR, width: 110, overflow: "truncate" },
      },
      series: [
        {
          type: "bar",
          data: top.map(([, count]) => ({
            value: count,
            itemStyle: {
              color: hexLerp(LOW_HEX, HIGH_HEX, max > 0 ? count / max : 0),
              borderRadius: [0, 3, 3, 0],
            },
          })),
        },
      ],
    };
  }, [crimeData, city.crimeDistrictField]);

  const chartStyle = { height: CHART_HEIGHT, width: "100%" };

  return (
    <Panel>
      <Card>
        <CardTitle>Crime Trend (by month)</CardTitle>
        <ReactECharts option={trendOption} style={chartStyle} notMerge />
      </Card>
      <Card>
        <CardTitle>Crime Categories (top 8)</CardTitle>
        <ReactECharts option={categoryOption} style={chartStyle} notMerge />
      </Card>
      <Card>
        <CardTitle>Top {city.districtLabel} (top 8)</CardTitle>
        <ReactECharts option={districtOption} style={chartStyle} notMerge />
      </Card>
    </Panel>
  );
}
