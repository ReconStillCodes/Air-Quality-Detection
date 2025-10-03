export const handlePageChange = (page, totalPages, setCurrPage) => {
  if (page >= 1 && page <= totalPages) {
    setCurrPage(page);
  }
};

export const goToFirstPage = (setCurrPage) => {
  setCurrPage(1);
};

export const goToLastPage = (totalPages, setCurrPage) => {
  setCurrPage(totalPages);
};
