import React, { useContext } from "react";

import "../index.css";
import "../styling/dashboard.css";
import { DashboardProviderContext } from "../provider/DashboardProvider";

import { Loading } from "./Loading";
import { DashboardCardContainer } from "./card/DashboardCardContainer";
import { DashboardHeader } from "./DashboardHeader";
import { DashboardBtnContainer } from "./btn/DashboardBtnContainer";
import { DashboardHistoryContainer } from "./history/DashboardHistoryContainer";
import { DashboardFooter } from "./footer/DashboardFooter";
import { DashboardTable } from "./table/DashboardTable";
import { DashboardTrend } from "./trend/DashboardTrend";
import { DashboardControl } from "./control/DashboardControl";

export const Dashboard = () => {
  const { isLoading } = useContext(DashboardProviderContext);

  if (isLoading) {
    return <Loading />;
  }
  return (
    <div className="dashboard">
      <div className="dashboard-container">
        <DashboardHeader />
        <DashboardCardContainer />
        <DashboardBtnContainer />
        <DashboardHistoryContainer />

        <div className="dashboard-h-container">
          <DashboardControl />
          <DashboardTrend />
        </div>
        <DashboardTable />
      </div>
      <DashboardFooter />
    </div>
  );
};
