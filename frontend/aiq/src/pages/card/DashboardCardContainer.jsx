import React, { useState, useEffect, useContext } from "react";

import "../../index.css";
import "../../styling/card.css";

import { DashboardCard } from "./DashboardCard";
import { ConstantValue, ConstantText } from "../../constant/Constant";
import { DashboardProviderContext } from "../../provider/DashboardProvider";

export const DashboardCardContainer = () => {
  const { sensorDataList } = useContext(DashboardProviderContext);

  const [temperature, setTemperature] = useState(0);
  const [humidity, setHumidity] = useState(0);
  const [co, setCo] = useState(0);

  useEffect(() => {
    if (sensorDataList && sensorDataList.length > 0) {
      const latestData = sensorDataList[sensorDataList.length - 1];
      setTemperature(latestData.temperature);
      setHumidity(latestData.humidity);
      setCo(latestData.co);
    }
  }, [sensorDataList]);

  return (
    <div className="card-container">
      <DashboardCard
        value={temperature}
        maxValue={ConstantValue.maxTemperature}
        title={ConstantText.TemperatureTitle}
        desc={ConstantText.TemperatureDesc}
        unit={ConstantText.TemperatureUnit}
      />
      <DashboardCard
        value={humidity}
        maxValue={ConstantValue.maxHumidity}
        title={ConstantText.HumidityTitle}
        desc={ConstantText.HumidityDesc}
        unit={ConstantText.HumidityUnit}
      />
      <DashboardCard
        value={co}
        maxValue={ConstantValue.maxCO}
        title={ConstantText.COTitle}
        desc={ConstantText.CODesc}
        unit={ConstantText.COUnit}
      />
    </div>
  );
};
