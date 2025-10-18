import { mapSensorData } from "./SensorDataMapper";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

export const fetchChartData = async () => {
  if (!API_BASE_URL) return [];
  try {
    const response = await fetch(`${API_BASE_URL}/data/chart`);
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

    const result = await response.json();
    const data = result?.data;
    return Array.isArray(data) ? mapSensorData(data) : [];
  } catch (error) {
    console.error("Error fetching chart data:", error);
    return [];
  }
};

export const fetchTablePage = async (page, pageSize = 20) => {
  if (!API_BASE_URL) return { data: [], metadata: { total_pages: 0 } };
  try {
    const response = await fetch(
      `${API_BASE_URL}/data/table?page=${page}&size=${pageSize}`
    );
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

    const result = await response.json();
    return {
      data: Array.isArray(result?.data) ? result.data : [],
      metadata: result?.metadata || { total_pages: 0 },
    };
  } catch (error) {
    console.error(`Error fetching table data for page ${page}:`, error);
    return { data: [], metadata: { total_pages: 0 } };
  }
};

export const fetchTrendData = async (option) => {
  if (!API_BASE_URL)
    return {
      data: { good: 0, moderate: 0, poor: 0, hazardous: 0 },
    };
  try {
    const response = await fetch(`${API_BASE_URL}/data/trend?option=${option}`);
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

    const result = await response.json();

    return result;
  } catch (error) {
    console.error(`Error fetching trend data for option ${option}:`, error);
    return {
      data: { good: 0, moderate: 0, poor: 0, hazardous: 0 },
    };
  }
};

export const postControlStatus = async (status) => {
  if (!API_BASE_URL) return null;
  if (!["auto", "on", "off"].includes(status)) {
    console.error("Invalid control status:", status);
    return null;
  }

  try {
    const response = await fetch(`${API_BASE_URL}/control/status`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ status: status }),
    });

    if (!response.ok) {
      if (response.status === 400) {
        const errorResult = await response.json();
        throw new Error(
          errorResult.error || `HTTP error! status: ${response.status}`
        );
      }
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    return result;
  } catch (error) {
    console.error(`Error posting control status ${status}:`, error);
    throw error;
  }
};
