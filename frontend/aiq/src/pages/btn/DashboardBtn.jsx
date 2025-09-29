import React, { useContext, useEffect, useState } from "react";

import "../../index.css";
import "../../styling/btn.css";

import { DashboardProviderContext } from "../../provider/DashboardProvider";

export const DashboardBtn = ({ label, option }) => {
  const { historyOption, setHistoryOption } = useContext(
    DashboardProviderContext
  );

  const isActive = option === historyOption;

  return (
    <button
      className={`btn ${isActive ? "btn-active" : ""}`}
      disabled={isActive}
      onClick={() => setHistoryOption(option)}
    >
      {label}
    </button>
  );
};
