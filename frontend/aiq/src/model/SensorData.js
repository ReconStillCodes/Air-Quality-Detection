export class SensorData {
  constructor(temperature, humidity, co, timestamp, quality) {
    this.temperature = temperature;
    this.humidity = humidity;
    this.co = co;
    this.timestamp = timestamp;
    this.quality = quality;
  }

  getQualityIndex() {
    switch (this.quality) {
      case "Good":
        return 1;
      case "Moderate":
        return 2;
      case "Poor":
        return 3;
      case "Hazardous":
        return 4;
    }
  }
}

export const generateRandomSensorData = (count = 10) => {
  const data = [];
  const now = new Date();
  const qualityOptions = ["Good", "Moderate", "Poor", "Hazardous"];

  for (let i = 0; i < count; i++) {
    // Generate a timestamp 1 minute in the past for each point
    const timestamp = new Date(now.getTime() - i * 60000);

    // Generate random values for each property
    const temperature = Math.floor(Math.random() * 20) + 20; // 20-39°C
    const humidity = Math.floor(Math.random() * 40) + 40; // 40-79%
    const co = Math.floor(Math.random() * 1000) + 100; // 100-1099 ppm
    const quality =
      qualityOptions[Math.floor(Math.random() * qualityOptions.length)];

    data.unshift(new SensorData(temperature, humidity, co, timestamp, quality));
  }

  return data;
};
