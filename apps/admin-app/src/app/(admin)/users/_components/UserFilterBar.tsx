import { Search, X, RotateCcw } from "lucide-react";

interface UserFilterBarProps {
  search: string;
  status: string;
  role: string;
  limit?: number;
  totalItems?: number;
  displayedCount?: number;
  onSearchChange: (v: string) => void;
  onStatusChange: (v: string) => void;
  onRoleChange: (v: string) => void;
  onLimitChange?: (v: number) => void;
  onReset?: () => void;
}

export function UserFilterBar({
  search,
  status,
  role,
  limit,
  totalItems,
  displayedCount,
  onSearchChange,
  onStatusChange,
  onRoleChange,
  onLimitChange,
  onReset,
}: UserFilterBarProps) {
  const hasActiveFilters = Boolean(
    search || (status && status !== "All") || (role && role !== "All"),
  );
  const activeFilterCount =
    (search ? 1 : 0) +
    (status && status !== "All" ? 1 : 0) +
    (role && role !== "All" ? 1 : 0);

  const handleReset = () => {
    if (onReset) {
      onReset();
    } else {
      onSearchChange("");
      onStatusChange("All");
      onRoleChange("All");
    }
  };

  return (
    <div className="card p-3.5 space-y-3">
      {/* Top row: Search input + Rows per page selector + Reset */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        {/* Search Box */}
        <div className="search-box flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 shrink-0" />
          <input
            type="text"
            placeholder="Tìm theo tên người dùng, email..."
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
          />
          {search && (
            <button
              type="button"
              onClick={() => onSearchChange("")}
              className="text-slate-400 hover:text-slate-600 p-0.5 cursor-pointer"
              title="Xóa tìm kiếm"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Quick controls */}
        <div className="flex items-center gap-2 self-end sm:self-auto">
          {hasActiveFilters && (
            <button
              type="button"
              onClick={handleReset}
              className="btn btn-secondary btn-sm inline-flex items-center gap-1.5 text-slate-600 hover:text-rose-600 cursor-pointer"
              title="Khôi phục tất cả bộ lọc"
            >
              <RotateCcw className="w-3.5 h-3.5 text-slate-400" />
              <span>Đặt lại ({activeFilterCount})</span>
            </button>
          )}
          {onLimitChange && typeof limit === "number" && (
            <div className="flex items-center gap-1.5">
              <span className="over text-[11px] hidden md:inline">
                Hiển thị:
              </span>
              <select
                value={String(limit)}
                onChange={(e) => onLimitChange(Number(e.target.value))}
                className="select-trigger text-xs font-semibold"
                aria-label="Số dòng mỗi trang"
              >
                <option value="10">10 dòng/trang</option>
                <option value="20">20 dòng/trang</option>
                <option value="50">50 dòng/trang</option>
              </select>
            </div>
          )}
        </div>
      </div>

      {/* Bottom row: Filter Dropdowns & Stats */}
      <div className="pt-2.5 border-t border-slate-100 flex flex-wrap items-center gap-3">
        {/* Status filter */}
        <div className="flex items-center gap-2 flex-1 min-w-[200px] max-w-xs">
          <span className="over text-[11px] shrink-0">Trạng thái:</span>
          <select
            value={status}
            onChange={(e) => onStatusChange(e.target.value)}
            className="select-trigger w-full text-xs font-semibold"
          >
            <option value="All">Tất cả trạng thái</option>
            <option value="ACTIVE">ACTIVE</option>
            <option value="INACTIVE">INACTIVE</option>
            <option value="BANNED">BANNED</option>
            <option value="PENDING">PENDING</option>
          </select>
        </div>

        {/* Role filter */}
        <div className="flex items-center gap-2 flex-1 min-w-[200px] max-w-xs">
          <span className="over text-[11px] shrink-0">Vai trò:</span>
          <select
            value={role}
            onChange={(e) => onRoleChange(e.target.value)}
            className="select-trigger w-full text-xs font-semibold"
          >
            <option value="All">Tất cả vai trò</option>
            <option value="SuperAdmin">SuperAdmin</option>
            <option value="Audience">Audience</option>
            <option value="Admin">Admin</option>
            <option value="Checker">Checker</option>
            <option value="Organizer">Organizer</option>
          </select>
        </div>

        {/* Count info */}
        {typeof totalItems === "number" && (
          <div className="ml-auto text-xs text-slate-500 font-medium hidden lg:flex items-center gap-1.5">
            <span>Hiển thị</span>
            <strong className="text-slate-900 font-bold tabular-nums">
              {displayedCount ?? totalItems}
            </strong>
            <span>trên</span>
            <strong className="text-slate-900 font-bold tabular-nums">
              {totalItems}
            </strong>
            <span>tài khoản</span>
          </div>
        )}
      </div>
    </div>
  );
}
