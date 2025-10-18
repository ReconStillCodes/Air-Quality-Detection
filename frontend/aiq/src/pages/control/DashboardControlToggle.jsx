import "../../index.css";
import "../../styling/control.css";
import "../../styling/toggle.css";
import React, { useState } from "react";
export const DashboardControlToggle = ({
  label,
  isOn,
  isDisabled,
  setIsOn,
}) => {
  const handleToggle = () => {
    if (!isDisabled) {
      setIsOn(!isOn);
    }
  };

  return (
    <div className="toggle-row">
      <span
        className={`toggle-label ${isDisabled ? "toggle-label-disabled" : ""}`}
      >
        {label}
      </span>
      <label className="switch">
        <input
          type="checkbox"
          checked={isOn}
          disabled={isDisabled}
          onChange={handleToggle}
        />
        <span className="slider round"></span>
      </label>
    </div>
  );
};
