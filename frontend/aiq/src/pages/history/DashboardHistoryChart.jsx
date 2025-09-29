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

export const DashboardHistoryChart = ({ data, unit, historyOption }) => {
  return (
    <div className="history-chart-container">
      <ResponsiveContainer>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
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
