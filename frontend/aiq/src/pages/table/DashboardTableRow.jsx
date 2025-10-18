import "../../index.css";
import "../../styling/table.css";
import { DashboardProviderContext } from "../../provider/DashboardProvider";

import { dateFormatterForTooltip } from "../../formatter/DateFormatter";
import { textFormatterForTooltip } from "../../formatter/TextFormatter";
import { ConstantText } from "../../constant/Constant";

export const DashboardTableRow = ({
  timestamp,
  temperature,
  humidity,
  co,
  quality,
}) => {
  return (
    <div className="table-row">
      <div className="table-cell">{dateFormatterForTooltip(timestamp)}</div>
      <div className="table-cell">
        {textFormatterForTooltip({
          value: temperature,
          unit: ConstantText.TemperatureUnit,
        })}
      </div>
      <div className="table-cell">
        {textFormatterForTooltip({
          value: humidity,
          unit: ConstantText.HumidityUnit,
        })}
      </div>
      <div className="table-cell">
        {textFormatterForTooltip({ value: co, unit: ConstantText.COUnit })}
      </div>
      <div className={`table-cell`}>
        <span
          className={`table-circle ${
            quality === "Good"
              ? "table-quality-good"
              : quality === "Moderate"
              ? "table-quality-moderate"
              : quality === "Poor"
              ? "table-quality-poor"
              : quality === "Hazardous"
              ? "table-quality-hazardous"
              : "table-quality-good"
          }`}
        ></span>
        {quality}
      </div>
    </div>
  );
};
