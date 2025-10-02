import React from "react";

import "../../index.css";
import "../../styling/footer.css";

import { ConstantFooterText } from "../../constant/Constant";
import { DashboardFooterName } from "./DashboardFooterName";

export const DashboardFooter = () => {
  return (
    <footer className="footer-fixed">
      <p>{ConstantFooterText.title}</p>
      <div className="footer-container">
        <DashboardFooterName
          name={ConstantFooterText.axelName}
          nim={ConstantFooterText.axelNim}
        />
        <DashboardFooterName
          name={ConstantFooterText.matthewName}
          nim={ConstantFooterText.matthewNim}
        />
        <DashboardFooterName
          name={ConstantFooterText.michelleName}
          nim={ConstantFooterText.michelleNim}
        />
      </div>
    </footer>
  );
};
