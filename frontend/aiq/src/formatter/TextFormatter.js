import { ConstantTrendText } from "../constant/Constant";

export const textFormatterForTooltip = ({ value, unit }) => {
  return `${value} ${unit}`;
};

export const textFormatterForQuality = (tick) => {
  switch (tick) {
    case 1:
      return "Good";
    case 2:
      return "Moderate";
    case 3:
      return "Poor";
    case 4:
      return "Hazardous";
    default:
      return "";
  }
};

export const textFormatterForTrend = (option) => {
  switch (option) {
    case 0:
      return ConstantTrendText.option.option1;
    case 1:
      return ConstantTrendText.option.option2;
    case 2:
      return ConstantTrendText.option.option3;
    case 3:
      return ConstantTrendText.option.option4;
    default:
      return "";
  }
};
