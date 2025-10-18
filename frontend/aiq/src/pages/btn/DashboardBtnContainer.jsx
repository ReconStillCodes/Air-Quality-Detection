import React from "react";

import "../../index.css";
import "../../styling/btn.css";
import { ConstantText } from "../../constant/Constant";

import { DashboardBtn } from "./DashboardBtn";

export const DashboardBtnContainer = () => {
  return (
    <div className="btn-container">
      <DashboardBtn label={ConstantText.TemperatureTitle} option={0} />
      <DashboardBtn label={ConstantText.HumidityTitle} option={1} />
      <DashboardBtn label={ConstantText.COTitle} option={2} />
      <DashboardBtn label={ConstantText.Quality} option={3} />
    </div>
  );
};
