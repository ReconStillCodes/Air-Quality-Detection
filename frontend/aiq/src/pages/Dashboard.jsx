import React, { useEffect, useState } from "react";

import "../index.css";
import "../styling/dashboard.css";

import { DashboardCardContainer } from "./card/DashboardCardContainer";

import { DashboardHeader } from "./DashboardHeader";
import { DashboardBtnContainer } from "./btn/DashboardBtnContainer";
import { DashboardHistoryContainer } from "./history/DashboardHistoryContainer";
import { DashboardFooter } from "./footer/DashboardFooter";

export const Dashboard = () => {
  return (
    <div className="dashboard">
      <DashboardHeader />
      <DashboardCardContainer />
      <DashboardBtnContainer />
      <DashboardHistoryContainer />
      <DashboardFooter />
    </div>
  );
};
