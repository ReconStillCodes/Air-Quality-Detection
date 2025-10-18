// src/hooks/useTrendLoader.js
import { useState, useCallback } from "react";
import { fetchTrendData } from "./ApiConnection";
import { TrendData } from "../model/TrendData";

export const useTrendLoader = () => {
  const [trendData, setTrendData] = useState(new TrendData());
  const [trendOption, setTrendOption] = useState(0);

  const loadTrendData = useCallback(
    async (option = trendOption, directData = null) => {
      try {
        if (directData) {
          // Used by socket update
          const trendObj = new TrendData(
            directData.good,
            directData.moderate,
            directData.poor,
            directData.hazardous
          );
          setTrendData(trendObj);
          return;
        }

        const response = await fetchTrendData(option);
        const trendObj = new TrendData(
          response.data.good,
          response.data.moderate,
          response.data.poor,
          response.data.hazardous
        );
        setTrendData(trendObj);
      } catch (err) {
        console.error("Error loading trend data:", err);
        setTrendData(new TrendData());
      }
    },
    [trendOption]
  );

  return { trendData, trendOption, setTrendOption, loadTrendData };
};
