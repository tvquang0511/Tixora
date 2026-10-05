import { Search } from "lucide-react";

interface UserFilterBarProps {
  search: string;
  status: string;
  role: string;
  onSearchChange: (v: string) => void;
  onStatusChange: (v: string) => void;
  onRoleChange: (v: string) => void;
}

export function UserFilterBar({
  search,
  status,
  role,
  onSearchChange,
  onStatusChange,
  onRoleChange,
}: UserFilterBarProps) {
  return (
    <div className="filters">
      {/* Search */}
      <div className="search-box flex-1 min-w-[240px]">
        <Search className="w-4 h-4 text-slate-400 shrink-0" />
        <input
          type="text"
          placeholder="Nhập tên người dùng, email..."
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
        />
      </div>

      {/* Status filter */}
      <div className="flex items-center gap-2">
        <span className="over hidden sm:inline">Trạng thái:</span>
        <select
          value={status}
          onChange={(e) => onStatusChange(e.target.value)}
          className="select-trigger text-xs font-medium"
        >
          <option value="All">Tất cả trạng thái</option>
          <option value="ACTIVE">ACTIVE</option>
          <option value="INACTIVE">INACTIVE</option>
          <option value="BANNED">BANNED</option>
          <option value="PENDING">PENDING</option>
        </select>
      </div>

      {/* Role filter */}
      <div className="flex items-center gap-2">
        <span className="over hidden sm:inline">Vai trò:</span>
        <select
          value={role}
          onChange={(e) => onRoleChange(e.target.value)}
          className="select-trigger text-xs font-medium"
        >
          <option value="All">Tất cả vai trò</option>
          <option value="SuperAdmin">SuperAdmin</option>
          <option value="Audience">Audience</option>
          <option value="Admin">Admin</option>
          <option value="Checker">Checker</option>
          <option value="Organizer">Organizer</option>
        </select>
      </div>
    </div>
  );
}
