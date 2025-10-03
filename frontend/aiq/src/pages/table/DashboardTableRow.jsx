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
      <div
        className={`table-cell ${
          quality === "Normal" ? "table-quality-normal" : "table-quality-hot"
        }`}
      >
        {quality}
      </div>
    </div>
  );
};
