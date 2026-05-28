import React from 'react';

interface PaginationControlsProps {
  currentPage: number;
  pageSize: number;
  totalItems: number;
  pageSizeOptions?: number[];
  onPageChange: (page: number) => void;
  onPageSizeChange: (pageSize: number) => void;
}

export const PaginationControls: React.FC<PaginationControlsProps> = ({
  currentPage,
  pageSize,
  totalItems,
  pageSizeOptions = [10, 20, 50, 100],
  onPageChange,
  onPageSizeChange,
}) => {
  const totalPages = Math.max(Math.ceil(totalItems / pageSize), 1);
  const safePage = Math.min(currentPage, totalPages);
  const firstItem = totalItems === 0 ? 0 : (safePage - 1) * pageSize + 1;
  const lastItem = Math.min(safePage * pageSize, totalItems);
  const visiblePages = Array.from({ length: totalPages }, (_, index) => index + 1).filter(
    (pageNumber) =>
      pageNumber === 1 ||
      pageNumber === totalPages ||
      Math.abs(pageNumber - safePage) <= 1
  );

  return (
    <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 flex flex-col lg:flex-row items-center justify-between gap-4">
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 text-sm text-gray-500 dark:text-gray-400">
        <span>
          Trang {safePage}/{totalPages} · Bản ghi {firstItem}-{lastItem} trong {totalItems}
        </span>
        <label className="inline-flex items-center gap-2">
          <span>Hiển thị</span>
          <select
            value={pageSize}
            onChange={(event) => onPageSizeChange(Number(event.target.value))}
            className="px-2 py-1.5 rounded-lg border border-gray-300 bg-white text-gray-700 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200"
          >
            {pageSizeOptions.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
          <span>hàng/trang</span>
        </label>
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={() => onPageChange(Math.max(safePage - 1, 1))}
          disabled={safePage === 1}
          className="px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 text-sm font-medium text-gray-700 dark:text-gray-200 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
        >
          Trước
        </button>
        {visiblePages.map((pageNumber, index) => (
          <React.Fragment key={pageNumber}>
            {index > 0 && pageNumber - visiblePages[index - 1] > 1 && (
              <span className="px-1 text-gray-400">...</span>
            )}
            <button
              onClick={() => onPageChange(pageNumber)}
              className={`min-w-10 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                pageNumber === safePage
                  ? 'bg-blue-600 text-white'
                  : 'border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700'
              }`}
            >
              {pageNumber}
            </button>
          </React.Fragment>
        ))}
        <button
          onClick={() => onPageChange(Math.min(safePage + 1, totalPages))}
          disabled={safePage === totalPages}
          className="px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 text-sm font-medium text-gray-700 dark:text-gray-200 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
        >
          Sau
        </button>
      </div>
    </div>
  );
};
