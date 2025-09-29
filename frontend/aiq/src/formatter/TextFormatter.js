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
