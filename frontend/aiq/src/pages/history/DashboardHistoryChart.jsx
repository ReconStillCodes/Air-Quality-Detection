import React from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Brush,
  ResponsiveContainer,
  ReferenceLine,
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
const RED_COLOR = "#FF6347";

export const DashboardHistoryChart = ({ data, unit, historyOption }) => {
  return (
    <div className="history-chart-container">
      <ResponsiveContainer>
        <AreaChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />

          <defs>
            {/* Vertical gradient fill */}
            <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
              <stop
                offset="0%"
                stopColor={ConstantChartColor.areaFill}
                stopOpacity={0.8}
              />
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
            tickFormatter={dateFormatterForXAxis}
          />
          <YAxis
            stroke={ConstantChartColor.axisLabel}
            tickFormatter={
              historyOption === 3 ? textFormatterForQuality : undefined
            }
            tick={{ angle: historyOption === 3 ? -60 : 0 }}
          />
          <Tooltip
            labelFormatter={dateFormatterForTooltip}
            formatter={
              historyOption === 3
                ? textFormatterForQuality
                : (value) => textFormatterForTooltip({ value, unit })
            }
          />

          {historyOption === 0 && (
            <ReferenceLine y={THRESHOLD_Y} stroke={RED_COLOR} strokeWidth={3} />
          )}

          {/* Main Area with line + gradient fill */}
          <Area
            type="monotone"
            dataKey="value"
            stroke={ConstantChartColor.line}
            strokeWidth={3}
            fill="url(#areaGradient)"
            isAnimationActive={false}
          />

          <Brush
            dataKey="data"
            height={20}
            stroke="black"
            fill={ConstantChartColor.sliderBackground}
            tickFormatter={() => ""}
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
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};
