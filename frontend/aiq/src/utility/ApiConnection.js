import { mapSensorData } from "./SensorDataMapper";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

export const fetchChartData = async () => {
  if (!API_BASE_URL) return [];
  try {
    // Fetches via the Nginx proxy: /api/data/chart
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
    // Fetches via the Nginx proxy: /api/data/table?page=X&size=Y
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
