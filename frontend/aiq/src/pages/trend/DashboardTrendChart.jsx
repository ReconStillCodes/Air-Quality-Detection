import { Pie, PieChart, ResponsiveContainer, Tooltip, Cell } from "recharts";
import { useContext } from "react";
import { DashboardProviderContext } from "../../provider/DashboardProvider";

const TREND_MAP = [
  { key: "good", name: "Good" },
  { key: "moderate", name: "Moderate" },
  { key: "poor", name: "Poor" },
  { key: "hazardous", name: "Hazardous" },
];

const COLORS = ["#778bfc", "#46a348", "#ffc054", "#db2f2c"];

export const DashboardTrendChart = () => {
  const { trendData } = useContext(DashboardProviderContext);

  const dynamicData = TREND_MAP.map((item) => ({
    name: item.name,
    value: trendData ? trendData[item.key] || 0 : 0,
  })).filter((entry) => entry.value > 0);

  const isDataAvailable = dynamicData.length > 0;

  return (
    <ResponsiveContainer width="100%" height="100%">
      <PieChart>
        {isDataAvailable ? (
          <Pie
            dataKey="value"
            isAnimationActive={false}
            data={dynamicData}
            cx="50%"
            cy="50%"
            outerRadius={80}
            fill="#8884d8"
            label={{ fill: "hsl(264 74% 38%)", fontWeight: "500" }}
          >
            {dynamicData.map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={COLORS[index % COLORS.length]}
              />
            ))}
          </Pie>
        ) : null}

        <Tooltip />
      </PieChart>
    </ResponsiveContainer>
  );
};
