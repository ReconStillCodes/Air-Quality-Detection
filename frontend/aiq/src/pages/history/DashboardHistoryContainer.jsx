import React, { useContext, useState, useEffect } from "react";

import "../../index.css";
import "../../styling/history.css";
import { DashboardProviderContext } from "../../provider/DashboardProvider";
import { ConstantText } from "../../constant/Constant";

import { DashboardHistoryChart } from "./DashboardHistoryChart";

export const DashboardHistoryContainer = () => {
  const { sensorDataList, historyOption } = useContext(
    DashboardProviderContext
  );

  const [data, setData] = useState([]);
  const [unit, setUnit] = useState("");
  const [subtitle, setSubtitle] = useState("");

  useEffect(() => {
    let filteredData = [];
    let currentUnit = "";
    let currentSubtitle = "";

    switch (historyOption) {
      case 0: //Temperature
        currentUnit = ConstantText.TemperatureUnit;
        currentSubtitle = ConstantText.TemperatureTitle;
        filteredData = sensorDataList.map((item) => ({
          data: item.timestamp,
          value: item.temperature,
        }));
        break;

      case 1: //humidity
        currentUnit = ConstantText.HumidityUnit;
        currentSubtitle = ConstantText.HumidityTitle;
        filteredData = sensorDataList.map((item) => ({
          data: item.timestamp,
          value: item.humidity,
        }));
        break;

      case 2: // CO
        currentUnit = ConstantText.COUnit;
        currentSubtitle = ConstantText.COTitle;
        filteredData = sensorDataList.map((item) => ({
          data: item.timestamp,
          value: item.co,
        }));
        break;

      case 3:
        currentUnit = ConstantText.QualityUnit;
        currentSubtitle = ConstantText.Quality;
        filteredData = sensorDataList.map((item) => ({
          data: item.timestamp,
          value: item.getQualityIndex(),
        }));
        break;
      default:
        break;
    }

    setData(filteredData);
    setUnit(currentUnit);
    setSubtitle(currentSubtitle);
  }, [sensorDataList, historyOption]);

  return (
    <div className="history-container">
      <h3 className="history-title">History Chart</h3>
      <h4 className="history-subtitle">{subtitle}</h4>
      <DashboardHistoryChart
        data={data}
        unit={unit}
        historyOption={historyOption}
      />
    </div>
  );
};
