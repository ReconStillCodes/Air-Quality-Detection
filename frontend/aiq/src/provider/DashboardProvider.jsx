import React, { useEffect, useState, useCallback, useMemo } from "react";
import io from "socket.io-client";
import {
  fetchChartData,
  fetchTablePage,
  fetchTrendData,
  postControlStatus,
} from "../utility/ApiConnection";
import { TrendData } from "../model/TrendData";
import { useTrendLoader } from "../utility/hooks";

export const DashboardProviderContext = React.createContext();

const getBackendUrl = () => {
  return import.meta.env.VITE_SOCKET_URL;
};

// ==========================================================
// STATE MANAGEMENT
// ==========================================================

export const DashboardProvider = ({ children }) => {
  const backendUrl = getBackendUrl();
  const [historyOption, setHistoryOption] = useState(0);

  const [sensorDataList, setSensorDataList] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const [currPage, setCurrPage] = useState(1);
  const [tableData, setTableData] = useState([]);
  const [tableDataCache, setTableDataCache] = useState({});
  const [totalPages, setTotalPages] = useState(0);

  const [isAutoMode, setIsAutoMode] = useState(true);
  const [isControlOn, setIsControlOn] = useState(true);

  const {
    trendData,
    setTrendData,
    trendOption,
    setTrendOption,
    loadTrendData,
  } = useTrendLoader();

  // ================================
  // DERIVED STATE
  // ================================
  const currentControlStatus = useMemo(() => {
    if (isAutoMode) return "auto";
    if (isControlOn) return "on";
    return "off";
  }, [isAutoMode, isControlOn]);

  // ================================
  // SOCKET + INITIAL DATA
  // ================================
  useEffect(() => {
    const socket = io(backendUrl);

    const initLoad = async () => {
      try {
        const chartData = await fetchChartData();
        setSensorDataList(chartData);

        const tablePage = await fetchTablePage(currPage, 20);
        setTableData(tablePage.data);
        setTableDataCache((prev) => ({ ...prev, [currPage]: tablePage.data }));
        setTotalPages(tablePage.metadata.total_pages);

        await loadTrendData(trendOption);

        setIsLoading(false);
      } catch (err) {
        console.error("Init load error:", err);
        setIsLoading(false);
      }
    };

    initLoad();

    socket.on("live_data_update", (payload) => {
      const { data: latestRecords, trend_data: trendUpdate } = payload;

      if (latestRecords?.length > 0) {
        setSensorDataList(latestRecords);

        if (trendUpdate) {
          loadTrendData(null, trendUpdate);
        }

        setTableDataCache((prev) => ({ ...prev, 1: latestRecords }));
        if (currPage === 1) setTableData(latestRecords);
        else setTableDataCache({});
      }
    });

    return () => socket.disconnect();
  }, [backendUrl, currPage, trendOption, loadTrendData]);

  // ================================
  // PAGINATION LOADER
  // ================================
  useEffect(() => {
    const loadPageData = async () => {
      if (tableDataCache[currPage]) {
        setTableData(tableDataCache[currPage]);
        return;
      }

      try {
        const response = await fetchTablePage(currPage, 20);
        setTableData(response.data);
        setTableDataCache((prev) => ({ ...prev, [currPage]: response.data }));

        if (response.metadata?.total_pages) {
          setTotalPages(response.metadata.total_pages);
        }
      } catch (err) {
        console.error("Error loading table page:", err);
      }
    };

    loadPageData();
  }, [currPage]);

  // ================================
  // CONTROL STATUS SYNC
  // ================================
  useEffect(() => {
    if (isLoading) return;

    const syncControlStatus = async () => {
      try {
        await postControlStatus(currentControlStatus);
        console.log("Control status synced:", currentControlStatus);
      } catch (err) {
        console.error("Failed to sync control status:", err);
      }
    };

    syncControlStatus();
  }, [currentControlStatus, isLoading]);

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
        isAutoMode,
        setIsAutoMode,
        isControlOn,
        setIsControlOn,
        trendData,
        setTrendData,
        trendOption,
        setTrendOption,
      }}
    >
      {children}
    </DashboardProviderContext.Provider>
  );
};
