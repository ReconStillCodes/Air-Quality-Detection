import "../../index.css";
import "../../styling/trend.css";
import "../../styling/dropdown.css";

import { ConstantTrendText } from "../../constant/Constant";
import { DashboardProviderContext } from "../../provider/DashboardProvider";
import { useContext } from "react";
import { textFormatterForTrend } from "../../formatter/TextFormatter";

export const DashboardTrendDD = () => {
  const { trendOption, setTrendOption } = useContext(DashboardProviderContext);

  const handleOptionChange = (option) => {
    setTrendOption(option);
  };

  return (
    <div className="dropdown">
      <button className="dropbtn">{textFormatterForTrend(trendOption)}</button>
      <div className="dropdown-content">
        <button
          className="dropdown-option"
          onClick={() => handleOptionChange(0)}
        >
          {ConstantTrendText.option.option1}
        </button>
        <button
          className="dropdown-option"
          onClick={() => handleOptionChange(1)}
        >
          {ConstantTrendText.option.option2}
        </button>
        <button
          className="dropdown-option"
          onClick={() => handleOptionChange(2)}
        >
          {ConstantTrendText.option.option3}
        </button>
        <button
          className="dropdown-option"
          onClick={() => handleOptionChange(3)}
        >
          {ConstantTrendText.option.option4}
        </button>
      </div>
    </div>
  );
};
