import { Users, UserCheck, Shield, ShieldAlert } from "lucide-react";

interface UserStatsCardsProps {
  stats: { total: number; active: number; admin: number; blocked: number };
}

export function UserStatsCards({ stats }: UserStatsCardsProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
      <div className="bg-white rounded-none border border-slate-200 p-4 shadow-none flex items-center justify-between">
        <div>
          <span className="text-[10px] font-mono font-bold text-slate-500 uppercase tracking-wider block">
            Tổng người dùng
          </span>
          <span className="text-2xl font-mono font-extrabold text-slate-900 mt-1 block">
            {stats.total.toLocaleString("vi-VN")}
          </span>
        </div>
        <div className="p-2.5 bg-slate-100 border border-slate-200 rounded-none text-slate-700">
          <Users className="w-5 h-5" />
        </div>
      </div>

      <div className="bg-white rounded-none border border-slate-200 p-4 shadow-none flex items-center justify-between">
        <div>
          <span className="text-[10px] font-mono font-bold text-slate-500 uppercase tracking-wider block">
            Tài khoản hoạt động
          </span>
          <span className="text-2xl font-mono font-extrabold text-emerald-700 mt-1 block">
            {stats.active.toLocaleString("vi-VN")}
          </span>
        </div>
        <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-none text-emerald-700">
          <UserCheck className="w-5 h-5" />
        </div>
      </div>

      <div className="bg-white rounded-none border border-slate-200 p-4 shadow-none flex items-center justify-between">
        <div>
          <span className="text-[10px] font-mono font-bold text-slate-500 uppercase tracking-wider block">
            Quản trị viên
          </span>
          <span className="text-2xl font-mono font-extrabold text-slate-900 mt-1 block">
            {stats.admin.toLocaleString("vi-VN")}
          </span>
        </div>
        <div className="p-2.5 bg-slate-100 border border-slate-200 rounded-none text-slate-700">
          <Shield className="w-5 h-5" />
        </div>
      </div>

      <div className="bg-white rounded-none border border-slate-200 p-4 shadow-none flex items-center justify-between">
        <div>
          <span className="text-[10px] font-mono font-bold text-slate-500 uppercase tracking-wider block">
            Bị khóa / Đình chỉ
          </span>
          <span className="text-2xl font-mono font-extrabold text-rose-700 mt-1 block">
            {stats.blocked.toLocaleString("vi-VN")}
          </span>
        </div>
        <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-none text-rose-700">
          <ShieldAlert className="w-5 h-5" />
        </div>
      </div>
    </div>
  );
}
