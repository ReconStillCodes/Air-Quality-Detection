import React, { useContext, useState, useEffect } from "react";

import "../../index.css";
import "../../styling/table.css";
import { DashboardProviderContext } from "../../provider/DashboardProvider";

import { DashboardTableRow } from "./DashboardTableRow";
import { DashboardTableHeader } from "./DashboardTableHeader";
import { DashboardTablePagination } from "./DashboardTablePagination";

export const DashboardTable = () => {
  const { tableData } = useContext(DashboardProviderContext);

  return (
    <div className="table-container">
      <div className="table-body">
        <DashboardTableHeader />
        {tableData && tableData.length > 0 ? (
          tableData.map((row, idx) => <DashboardTableRow key={idx} {...row} />)
        ) : (
          <div className="table-empty">No data available</div>
        )}
      </div>

      <DashboardTablePagination />
    </div>
  );
};
