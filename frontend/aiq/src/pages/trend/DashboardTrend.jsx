import "../../index.css";
import "../../styling/trend.css";
import { DashboardProviderContext } from "../../provider/DashboardProvider";

import { ConstantTrendText } from "../../constant/Constant";
import { DashboardTrendChart } from "./DashboardTrendChart";
import { DashboardTrendDD } from "./DashboardTrendDD";
import { DashboardTrendLegend } from "./DashboardTrendLegend";

export const DashboardTrend = () => {
  return (
    <div className="trend-container">
      <h3 className="trend-title">{ConstantTrendText.title}</h3>
      {/* <h4 className="trend-subtitle">{ConstantTrendText.desc}</h4> */}

      <DashboardTrendDD />
      <DashboardTrendChart />
      <DashboardTrendLegend />
    </div>
  );
};
