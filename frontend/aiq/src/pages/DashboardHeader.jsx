import React, { useState, useEffect, useContext } from "react";

import "../index.css";
import "../styling/header.css";
import { ConstantHeaderText } from "../constant/Constant";
import { dateFormatterForTooltip } from "../formatter/DateFormatter";

import { DashboardProviderContext } from "../provider/DashboardProvider";

export const DashboardHeader = () => {
  const { sensorDataList } = useContext(DashboardProviderContext);

  const [quality, setQuality] = useState("Normal");
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    if (sensorDataList && sensorDataList.length > 0) {
      const latestData = sensorDataList[sensorDataList.length - 1];
      setQuality(latestData.quality);
      setTime(latestData.timestamp);
    }
  }, [sensorDataList]);
  return (
    <div className="header">
      <h3>{ConstantHeaderText.title}</h3>
      <h4>{ConstantHeaderText.subtitle}</h4>
      <h1 className={quality === "Hot" ? "quality-hot" : "quality-normal"}>
        {quality}
      </h1>
      <p>
        {ConstantHeaderText.updateDesc} {dateFormatterForTooltip(time)}
      </p>
    </div>
  );
};
