import React, { useState, useEffect, useContext } from "react";

import "../index.css";
import "../styling/header.css";
import { dateFormatterForTooltip } from "../formatter/DateFormatter";

import { DashboardProviderContext } from "../provider/DashboardProvider";

export const DashboardHeader = () => {
  const { sensorDataList } = useContext(DashboardProviderContext);

  const [quality, setQuality] = useState("Good");
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
      <h3>Air Quality Detector</h3>
      <h1>{quality}</h1>
      <p>Updated {dateFormatterForTooltip(time)}</p>
    </div>
  );
};
