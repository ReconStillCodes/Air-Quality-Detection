import React, { useContext } from "react";
import { DashboardProviderContext } from "../../provider/DashboardProvider";
import {
  handlePageChange,
  goToFirstPage,
  goToLastPage,
} from "../../utility/Pagination";

export const DashboardTablePagination = () => {
  const { currPage, setCurrPage, totalPages } = useContext(
    DashboardProviderContext
  );

  const getPageNumbers = () => {
    const delta = 1; // pages around current
    const range = [];

    const start = Math.max(1, currPage - delta);
    const end = Math.min(totalPages, currPage + delta);

    // Add "1" at the start if it's not in the window
    if (start > 1) {
      range.push(1);
      if (start > 2) {
        range.push("...");
      }
    }

    // Add the sliding window
    for (let i = start; i <= end; i++) {
      range.push(i);
    }

    // Add last page if it's not in the window
    if (end < totalPages) {
      if (end < totalPages - 1) {
        range.push("...");
      }
      range.push(totalPages);
    }

    return range;
  };
  const pageNumbers = getPageNumbers();

  return (
    <div className="table-pagination-container">
      <button
        className="page-btn"
        onClick={() => goToFirstPage(setCurrPage)}
        disabled={currPage === 1}
      >
        ◀◀
      </button>

      <button
        className="page-btn"
        onClick={() => handlePageChange(currPage - 1, totalPages, setCurrPage)}
        disabled={currPage === 1}
      >
        ◀
      </button>

      {pageNumbers.map((num, idx) =>
        num === "..." ? (
          <span key={idx} className="page-ellipsis">
            ...
          </span>
        ) : (
          <button
            key={idx}
            className={`page-btn ${currPage === num ? "active" : ""}`}
            onClick={() => handlePageChange(num, totalPages, setCurrPage)}
          >
            {num}
          </button>
        )
      )}

      <button
        className="page-btn"
        onClick={() => handlePageChange(currPage + 1, totalPages, setCurrPage)}
        disabled={currPage === totalPages}
      >
        ▶
      </button>

      <button
        className="page-btn"
        onClick={() => goToLastPage(totalPages, setCurrPage)}
        disabled={currPage === totalPages}
      >
        ▶▶
      </button>
    </div>
  );
};
