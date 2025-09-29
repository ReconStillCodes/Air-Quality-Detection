import React from "react";
import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";

import "../../index.css";
import "../../styling/card.css";
import { ConstantChartColor } from "../../constant/Constant";

export const DashboardCard = ({ value, maxValue, title, desc, unit }) => {
  const data = [
    { value: value, name: "Current" },
    { value: maxValue - value, name: "Remaining" },
  ];

  const COLORS = [ConstantChartColor.remaining, ConstantChartColor.current];

  return (
    <div className="card">
      <h4>{title}</h4>
      <p>{desc}</p>

      <div className="chart-container">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              dataKey="value"
              startAngle={180}
              endAngle={0}
              innerRadius={70}
              outerRadius={90}
              cy="80%"
            >
              {data.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={COLORS[index % COLORS.length]}
                />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>

        <div className="chart-label">
          {value} <span className="chart-label-unit">{unit}</span>
        </div>
      </div>
    </div>
  );
};
