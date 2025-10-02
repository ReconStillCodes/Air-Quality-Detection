import React from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Brush,
  ResponsiveContainer,
  ReferenceLine,
  ReferenceArea,
  Area,
} from "recharts";

import "../../index.css";
import "../../styling/history.css";
import { ConstantChartColor } from "../../constant/Constant";
import {
  dateFormatterForTooltip,
  dateFormatterForXAxis,
} from "../../formatter/DateFormatter";
import {
  textFormatterForTooltip,
  textFormatterForQuality,
} from "../../formatter/TextFormatter";

const THRESHOLD_Y = 27;
const RED_COLOR = "#FF6347"; // Used for ReferenceLine

export const DashboardHistoryChart = ({ data, unit, historyOption }) => {
  return (
    <div className="history-chart-container">
      <ResponsiveContainer>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />

          {/* Add SVG Gradient Definition for Area Fill */}
          <defs>
            <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
              {/* Darker at the top (near the line) */}
              <stop
                offset="0%"
                stopColor={ConstantChartColor.areaFill}
                stopOpacity={0.4}
              />
              {/* Lighter/transparent at the bottom (near the X-axis) */}
              <stop
                offset="100%"
                stopColor={ConstantChartColor.areaFill}
                stopOpacity={0.0}
              />
            </linearGradient>
          </defs>

          <XAxis
            dataKey="data"
            stroke={ConstantChartColor.axisLabel}
            tickFormatter={(tick) => dateFormatterForXAxis(tick)}
          />
          <YAxis
            stroke={ConstantChartColor.axisLabel}
            tickFormatter={
              historyOption === 3 ? textFormatterForQuality : undefined
            }
            tick={{
              angle: historyOption === 3 ? -60 : 0,
            }}
          />
          <Tooltip
            labelFormatter={(tick) => dateFormatterForTooltip(tick)}
            formatter={
              historyOption === 3
                ? textFormatterForQuality
                : (value) =>
                    textFormatterForTooltip({ value: value, unit: unit })
            }
          />

          {/* Conditional Threshold Visualization: Only include the ReferenceLine when historyOption is 0 */}
          {historyOption === 0 && (
            <ReferenceLine
              y={THRESHOLD_Y}
              stroke={RED_COLOR}
              strokeDasharray="5 5"
            />
          )}

          <Line
            type="monotone"
            dataKey="value"
            stroke={ConstantChartColor.line}
            strokeWidth={3}
          />
          <Brush
            dataKey="data"
            height={20}
            stroke="black"
            fill={ConstantChartColor.sliderBackground}
            tickFormatter={(tick) => ""}
            traveller={
              <rect
                fill={ConstantChartColor.sliderHandle}
                width={8}
                height={16}
                rx={8}
                ry={8}
              />
            }
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};
