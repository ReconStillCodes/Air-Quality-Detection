import React from "react";
import "../../index.css";
import "../../styling/footer.css";

export const DashboardFooterName = ({ name, nim }) => {
  return (
    <div className="footer-name">
      <h1 className="footer-name-h1">{name}</h1>
      <p>{nim}</p>
    </div>
  );
};
