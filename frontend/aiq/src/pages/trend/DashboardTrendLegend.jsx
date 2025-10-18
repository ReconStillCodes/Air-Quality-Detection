import "../../index.css";
import "../../styling/trend.css";
import { ConstantTrendText } from "../../constant/Constant";

export const DashboardTrendLegend = () => {
  return (
    <div className="trend-legend-container">
      <div className="trend-legend-item">
        <span className="trend-circle  trend-good"></span>
        {ConstantTrendText.legend.good}
      </div>

      <div className="trend-legend-item ">
        <span className="trend-circle trend-moderate"></span>
        {ConstantTrendText.legend.moderate}
      </div>

      <div className="trend-legend-item ">
        <span className="trend-circle trend-poor"></span>
        {ConstantTrendText.legend.poor}
      </div>

      <div className="trend-legend-item ">
        <span className="trend-circle trend-hazardous"></span>
        {ConstantTrendText.legend.hazardous}
      </div>
    </div>
  );
};
