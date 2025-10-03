import React, { useEffect, useState } from "react";
import io from "socket.io-client";
import { fetchChartData, fetchTablePage } from "../utility/ApiConnection";

export const DashboardProviderContext = React.createContext();

const getBackendUrl = () => {
  return import.meta.env.VITE_SOCKET_URL;
};

export const DashboardProvider = ({ children }) => {
  const backendUrl = getBackendUrl();
  const [historyOption, setHistoryOption] = useState(0);

  const [sensorDataList, setSensorDataList] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const [currPage, setCurrPage] = useState(1);
  const [tableData, setTableData] = useState([]);
  const [tableDataCache, setTableDataCache] = useState({});
  const [totalPages, setTotalPages] = useState(0);

  useEffect(() => {
    // Socket connection uses backendUrl (VITE_SOCKET_URL = /)
    const socket = io(backendUrl);

    const initLoad = async () => {
      try {
        // 1. fetch chart data (fetchChartData now gets the URL internally)
        const chartData = await fetchChartData();
        setSensorDataList(chartData); // 2. fetch first table page (fetchTablePage now gets the URL internally)

        const tablePage = await fetchTablePage(currPage, 20);

        setTableData(tablePage.data);
        setTableDataCache((prev) => ({ ...prev, [currPage]: tablePage.data }));
        setTotalPages(tablePage.metadata.total_pages);

        setIsLoading(false);
      } catch (err) {
        console.error("Init load error:", err);
        setIsLoading(false);
      }
    };

    initLoad();

    socket.on("live_data_update", (payload) => {
      const latestRecords = payload.data;

      if (latestRecords?.length > 0) {
        setSensorDataList(latestRecords);

        setTableDataCache((prev) => ({
          ...prev,
          1: latestRecords,
        }));

        if (currPage === 1) {
          setTableData(latestRecords);
        } else {
          setTableDataCache({});
        }
      }
    });

    return () => {
      socket.disconnect();
    };
  }, [backendUrl, currPage]);

  useEffect(() => {
    const loadPageData = async () => {
      if (tableDataCache[currPage]) {
        setTableData(tableDataCache[currPage]);
        return;
      }

      try {
        // fetchTablePage no longer needs the URL argument
        const response = await fetchTablePage(currPage, 20);

        setTableData(response.data);

        setTableDataCache((prev) => ({
          ...prev,
          [currPage]: response.data,
        }));

        if (response.metadata?.total_pages) {
          setTotalPages(response.metadata.total_pages);
        }
      } catch (err) {
        console.error("Error loading table page:", err);
      }
    };

    loadPageData();
  }, [currPage, backendUrl, tableDataCache]);

  return (
    <DashboardProviderContext.Provider
      value={{
        historyOption,
        setHistoryOption,
        sensorDataList,
        setSensorDataList,
        isLoading,
        currPage,
        setCurrPage,
        tableData,
        setTableData,
        tableDataCache,
        setTableDataCache,
        totalPages,
        setTotalPages,
      }}
    >
      {children}
    </DashboardProviderContext.Provider>
  );
};
