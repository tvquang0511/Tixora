import { Users, UserCheck, Shield, ShieldAlert } from "lucide-react";

interface UserStatsCardsProps {
  stats: { total: number; active: number; admin: number; blocked: number };
}

export function UserStatsCards({ stats }: UserStatsCardsProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
      <div className="card p-4 flex items-center justify-between">
        <div>
          <span className="over block">
            Tổng người dùng
          </span>
          <span className="text-2xl font-bold text-slate-900 mt-1 block tabular-nums">
            {stats.total.toLocaleString("vi-VN")}
          </span>
        </div>
        <div className="p-2.5 bg-blue-50 border border-blue-100 rounded-lg text-[#0052ff]">
          <Users className="w-5 h-5" />
        </div>
      </div>

      <div className="card p-4 flex items-center justify-between">
        <div>
          <span className="over block">
            Tài khoản hoạt động
          </span>
          <span className="text-2xl font-bold text-emerald-700 mt-1 block tabular-nums">
            {stats.active.toLocaleString("vi-VN")}
          </span>
        </div>
        <div className="p-2.5 bg-emerald-50 border border-emerald-100 rounded-lg text-emerald-700">
          <UserCheck className="w-5 h-5" />
        </div>
      </div>

      <div className="card p-4 flex items-center justify-between">
        <div>
          <span className="over block">
            Quản trị viên
          </span>
          <span className="text-2xl font-bold text-slate-900 mt-1 block tabular-nums">
            {stats.admin.toLocaleString("vi-VN")}
          </span>
        </div>
        <div className="p-2.5 bg-blue-50 border border-blue-100 rounded-lg text-[#0052ff]">
          <Shield className="w-5 h-5" />
        </div>
      </div>

      <div className="card p-4 flex items-center justify-between">
        <div>
          <span className="over block">
            Bị khóa / Đình chỉ
          </span>
          <span className="text-2xl font-bold text-rose-700 mt-1 block tabular-nums">
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
