import { ChevronLeft, ChevronRight } from "lucide-react";

const getPageNumbers = (
  currentPage: number,
  totalPages: number,
): (number | string)[] => {
  const pages: (number | string)[] = [];
  const neighborCount = 1;

  if (totalPages <= 5) {
    for (let i = 1; i <= totalPages; i++) pages.push(i);
  } else {
    pages.push(1);
    const start = Math.max(2, currentPage - neighborCount);
    const end = Math.min(totalPages - 1, currentPage + neighborCount);
    if (start > 2) pages.push("...");
    for (let i = start; i <= end; i++) pages.push(i);
    if (end < totalPages - 1) pages.push("...");
    pages.push(totalPages);
  }
  return pages;
};

interface PaginationProps {
  page: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
  onPageChange: (page: number) => void;
  itemLabel?: string;
  onLimitChange?: (limit: number) => void;
}

export function Pagination({
  page,
  totalPages,
  totalItems,
  itemsPerPage,
  onPageChange,
  itemLabel = "dòng",
  onLimitChange,
}: PaginationProps) {
  return (
    <div className="w-full flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-slate-200 text-xs select-none">
      <div className="flex items-center gap-4 flex-wrap">
        <span className="text-xs text-slate-600 font-mono">
          Trang <span className="font-bold text-slate-900">{page}</span> /{" "}
          <span className="font-bold text-slate-900">{totalPages}</span>
          {" · "}
          Tổng cộng:{" "}
          <span className="font-bold text-slate-900">
            {totalItems.toLocaleString("vi-VN")}
          </span>{" "}
          {itemLabel}
        </span>

        {onLimitChange && (
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider font-mono">
              Hiển thị:
            </span>
            <div className="relative">
              <select
                value={itemsPerPage}
                onChange={(e) => {
                  onLimitChange(Number(e.target.value));
                  onPageChange(1);
                }}
                className="appearance-none pl-2.5 pr-7 py-1 border border-slate-300 rounded-none bg-white font-mono text-xs focus:outline-none focus:border-slate-800 text-slate-900 font-semibold cursor-pointer"
              >
                <option value={10}>10 {itemLabel}</option>
                <option value={20}>20 {itemLabel}</option>
                <option value={50}>50 {itemLabel}</option>
                <option value={100}>100 {itemLabel}</option>
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-1.5 text-slate-500">
                <svg
                  className="w-3.5 h-3.5"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M19.5 8.25l-7.5 7.5-7.5-7.5"
                  />
                </svg>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="flex items-center gap-1">
        <button
          disabled={page <= 1}
          onClick={() => onPageChange(Math.max(page - 1, 1))}
          className="p-1.5 border border-slate-300 rounded-none bg-white hover:bg-slate-100 text-slate-700 transition-colors disabled:opacity-30 disabled:hover:bg-white cursor-pointer"
          title="Trang trước"
        >
          <ChevronLeft size={16} />
        </button>

        <div className="flex items-center gap-1">
          {getPageNumbers(page, totalPages).map((pageNumber, idx) => {
            if (pageNumber === "...") {
              return (
                <span
                  key={`ellipsis-${idx}`}
                  className="px-2 text-slate-400 text-xs font-semibold select-none font-mono"
                >
                  ...
                </span>
              );
            }
            const isSelected = pageNumber === page;
            return (
              <button
                key={pageNumber}
                onClick={() => onPageChange(pageNumber as number)}
                className={`min-w-7 px-2.5 py-1 text-xs font-mono font-bold rounded-none border transition-colors cursor-pointer ${
                  isSelected
                    ? "bg-slate-900 border-slate-900 text-white"
                    : "border-slate-300 bg-white hover:bg-slate-100 text-slate-800"
                }`}
              >
                {pageNumber}
              </button>
            );
          })}
        </div>

        <button
          disabled={page >= totalPages}
          onClick={() => onPageChange(Math.min(page + 1, totalPages))}
          className="p-1.5 border border-slate-300 rounded-none bg-white hover:bg-slate-100 text-slate-700 transition-colors disabled:opacity-30 disabled:hover:bg-white cursor-pointer"
          title="Trang sau"
        >
          <ChevronRight size={16} />
        </button>
      </div>
    </div>
  );
}
