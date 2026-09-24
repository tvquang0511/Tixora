import { Activity } from "lucide-react";
import { type AdminUserListItem } from "@/services/admin-user.service";
import { StatusBadge } from "../../_components/StatusBadge";
import { Pagination } from "../../_components/Pagination";

const ROLE_CLASSES: Record<string, string> = {
  SuperAdmin: "bg-fuchsia-50 text-fuchsia-700 border-fuchsia-300",
  Admin: "bg-purple-50 text-purple-700 border-purple-300",
  Checker: "bg-amber-50 text-amber-800 border-amber-300",
  Organizer: "bg-emerald-50 text-emerald-800 border-emerald-300",
  Audience: "bg-blue-50 text-blue-700 border-blue-300",
};

interface UserTableProps {
  users: AdminUserListItem[];
  isLoading: boolean;
  page: number;
  totalPages: number;
  totalItems: number;
  limit: number;
  onPageChange: (p: number) => void;
  onLimitChange: (l: number) => void;
  onViewDetail: (id: string) => void;
}

export function UserTable({
  users,
  isLoading,
  page,
  totalPages,
  totalItems,
  limit,
  onPageChange,
  onLimitChange,
  onViewDetail,
}: UserTableProps) {
  return (
    <section className="bg-white rounded-none border border-slate-200 p-5 shadow-none space-y-4">
      <div className="flex justify-between items-center pb-2">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-slate-100 rounded-none border border-slate-200 text-slate-800">
            <Activity className="w-4 h-4" />
          </div>
          <h3 className="font-mono text-sm font-bold uppercase tracking-wider text-slate-900">
            Danh sách tài khoản hệ thống
          </h3>
        </div>
      </div>

      <div className="overflow-x-auto w-full">
        {isLoading ? (
          <div className="py-16 text-center text-slate-500 font-mono text-xs flex flex-col items-center justify-center gap-2">
            <div className="h-4 w-4 animate-spin border-2 border-slate-900 border-t-transparent" />
            <span>Đang tải danh sách người dùng...</span>
          </div>
        ) : users.length === 0 ? (
          <div className="py-16 text-center text-slate-500 font-mono text-xs border border-slate-200 bg-slate-50">
            Không tìm thấy người dùng nào khớp bộ lọc.
          </div>
        ) : (
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-y border-slate-200 bg-slate-100 font-mono text-[10px] font-bold text-slate-600 uppercase tracking-wider">
                <th className="p-3">Người dùng</th>
                <th className="p-3 text-center">Trạng thái</th>
                <th className="p-3">Vai trò</th>
                <th className="p-3 text-center">Đơn hàng</th>
                <th className="p-3 text-center">Vé đã mua</th>
                <th className="p-3">Ngày tham gia</th>
                <th className="p-3 text-center">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 font-sans">
              {users.map((item) => (
                <tr
                  key={item.id}
                  className="hover:bg-slate-50 transition-colors"
                >
                  <td className="p-3 font-semibold text-slate-900">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-none bg-slate-900 text-white flex items-center justify-center font-bold font-mono text-xs shrink-0">
                        {item.full_name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div className="text-xs font-bold text-slate-900 leading-tight">
                          {item.full_name}
                        </div>
                        <div className="text-[11px] text-slate-500 font-mono mt-0.5">
                          {item.email}
                        </div>
                      </div>
                    </div>
                  </td>

                  <td className="p-3 text-center">
                    <StatusBadge status={item.status} variant="user" />
                  </td>

                  <td className="p-3">
                    <div className="flex flex-wrap gap-1">
                      {item.roles.map((r) => (
                        <span
                          key={r}
                          className={`px-1.5 py-0.5 rounded-none text-[10px] font-mono font-bold border ${ROLE_CLASSES[r] ?? "bg-slate-50 text-slate-700 border-slate-300"}`}
                        >
                          {r}
                        </span>
                      ))}
                    </div>
                  </td>

                  <td className="p-3 text-center font-bold text-slate-900 font-mono">
                    {item.order_count.toLocaleString("vi-VN")}
                  </td>

                  <td className="p-3 text-center font-bold text-slate-900 font-mono">
                    {item.ticket_count.toLocaleString("vi-VN")}
                  </td>

                  <td className="p-3 text-slate-600 font-mono text-[11px]">
                    {new Date(item.created_at).toLocaleDateString("vi-VN", {
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                    })}
                  </td>

                  <td className="p-3 text-center">
                    <button
                      onClick={() => onViewDetail(item.id)}
                      className="inline-flex items-center gap-1 px-2.5 py-1.5 border border-slate-300 rounded-none bg-white hover:bg-slate-100 text-slate-700 font-mono text-xs font-bold transition-colors cursor-pointer"
                    >
                      Chi tiết
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {!isLoading && (
        <Pagination
          page={page}
          totalPages={totalPages}
          totalItems={totalItems}
          itemsPerPage={limit}
          onPageChange={onPageChange}
          onLimitChange={onLimitChange}
          itemLabel="tài khoản"
        />
      )}
    </section>
  );
}
