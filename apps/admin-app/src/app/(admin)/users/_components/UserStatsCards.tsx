import { Users, UserCheck, Shield, ShieldAlert } from "lucide-react";

interface UserStatsCardsProps {
  stats: { total: number; active: number; admin: number; blocked: number };
}

export function UserStatsCards({ stats }: UserStatsCardsProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm flex items-center justify-between">
        <div>
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block font-sans">
            Tổng người dùng
          </span>
          <span className="text-2xl font-sans font-bold text-slate-900 mt-1 block">
            {stats.total.toLocaleString("vi-VN")}
          </span>
        </div>
        <div className="p-2.5 bg-teal-50 border border-teal-100 rounded-lg text-teal-700">
          <Users className="w-5 h-5" />
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm flex items-center justify-between">
        <div>
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block font-sans">
            Tài khoản hoạt động
          </span>
          <span className="text-2xl font-sans font-bold text-emerald-700 mt-1 block">
            {stats.active.toLocaleString("vi-VN")}
          </span>
        </div>
        <div className="p-2.5 bg-emerald-50 border border-emerald-100 rounded-lg text-emerald-700">
          <UserCheck className="w-5 h-5" />
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm flex items-center justify-between">
        <div>
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block font-sans">
            Quản trị viên
          </span>
          <span className="text-2xl font-sans font-bold text-slate-900 mt-1 block">
            {stats.admin.toLocaleString("vi-VN")}
          </span>
        </div>
        <div className="p-2.5 bg-teal-50 border border-teal-100 rounded-lg text-teal-700">
          <Shield className="w-5 h-5" />
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm flex items-center justify-between">
        <div>
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block font-sans">
            Bị khóa / Đình chỉ
          </span>
          <span className="text-2xl font-sans font-bold text-rose-700 mt-1 block">
            {stats.blocked.toLocaleString("vi-VN")}
          </span>
        </div>
        <div className="p-2.5 bg-rose-50 border border-rose-100 rounded-lg text-rose-700">
          <ShieldAlert className="w-5 h-5" />
        </div>
      </div>
    </div>
  );
}
