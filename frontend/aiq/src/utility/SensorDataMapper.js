import { SensorData } from "../model/SensorData";

export const mapSensorData = (data) => {
  return data.map((d) => {
    return new SensorData(
      d.temperature,

      d.humidity,
      d.co,
      new Date(d.timestamp),
      d.quality
    );
  });
};
