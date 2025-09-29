import React, { useContext, useEffect, useState } from "react";
import io from "socket.io-client";

import { generateRandomSensorData } from "../model/SensorData";
import { SensorData } from "../model/SensorData";
export const DashboardProviderContext = React.createContext();

const socket = io(import.meta.env.VITE_SOCKET_URL);

export const DashboardProvider = ({ children }) => {
  const [historyOption, setHistoryOption] = useState(0);
  const [sensorDataList, setSensorDataList] = useState([]);

  useEffect(() => {
    const handleNewData = (data) => {
      console.log("Received data from backend:", data);
      setSensorDataList((prevData) => {
        const newSensorData = new SensorData(
          data.temperature,
          data.humidity,
          data.co,
          new Date(data.timestamp),
          data.quality
        );
        return [...prevData, newSensorData];
      });
    };

    socket.on("new_sensor_data", handleNewData);

    return () => {
      socket.off("new_sensor_data", handleNewData);
    };
  }, []);

  // useEffect(() => {
  //   const initialData = generateRandomSensorData(20);
  //   setSensorDataList(initialData);

  //   console.log("--- Sensor Data Log ---");
  //   initialData.forEach((item, index) => {
  //     console.log(
  //       `[${
  //         index + 1
  //       }] Timestamp: ${item.timestamp.toLocaleString()}, Temperature: ${
  //         item.temperature
  //       }°C, Quality: ${item.quality}`
  //     );
  //   });
  //   console.log("------------------------");
  // }, []);

  return (
    <DashboardProviderContext.Provider
      value={{
        historyOption,
        setHistoryOption,
        sensorDataList,
        setSensorDataList,
      }}
    >
      {children}
    </DashboardProviderContext.Provider>
  );
};
