import "../../index.css";
import "../../styling/table.css";
import { DashboardProviderContext } from "../../provider/DashboardProvider";
import { ConstantTableText } from "../../constant/Constant";

export const DashboardTableHeader = ({}) => {
  return (
    <div className="table-header">
      <div className="table-header-cell">{ConstantTableText.timestamp}</div>
      <div className="table-header-cell">{ConstantTableText.temperature}</div>
      <div className="table-header-cell">{ConstantTableText.humidity}</div>
      <div className="table-header-cell">{ConstantTableText.co}</div>
      <div className="table-header-cell">{ConstantTableText.quality}</div>
    </div>
  );
};
