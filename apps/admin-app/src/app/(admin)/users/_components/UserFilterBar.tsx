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
    <section className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
      <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end">
        {/* Search */}
        <div className="flex flex-col gap-1.5 md:col-span-6">
          <span className="text-xs font-semibold text-slate-600 uppercase tracking-wider font-sans">
            Tìm kiếm tài khoản
          </span>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Nhập tên người dùng, email..."
              value={search}
              onChange={(e) => onSearchChange(e.target.value)}
              className="pl-9 pr-3 py-2 border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 font-sans text-xs w-full h-10 transition-colors text-slate-900 placeholder:text-slate-400"
            />
          </div>
        </div>

        {/* Status filter */}
        <div className="flex flex-col gap-1.5 md:col-span-3">
          <span className="text-xs font-semibold text-slate-600 uppercase tracking-wider font-sans">
            Trạng thái tài khoản
          </span>
          <select
            value={status}
            onChange={(e) => onStatusChange(e.target.value)}
            className="bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs font-sans font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 w-full h-10 transition-colors cursor-pointer"
          >
            <option value="All">Tất cả trạng thái</option>
            <option value="ACTIVE">ACTIVE</option>
            <option value="INACTIVE">INACTIVE</option>
            <option value="BANNED">BANNED</option>
            <option value="PENDING">PENDING</option>
          </select>
        </div>

        {/* Role filter */}
        <div className="flex flex-col gap-1.5 md:col-span-3">
          <span className="text-xs font-semibold text-slate-600 uppercase tracking-wider font-sans">
            Phân quyền vai trò
          </span>
          <select
            value={role}
            onChange={(e) => onRoleChange(e.target.value)}
            className="bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs font-sans font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 w-full h-10 transition-colors cursor-pointer"
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
    </section>
  );
}
