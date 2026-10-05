import { Activity } from "lucide-react";
import { type AdminUserListItem } from "@/services/admin-user.service";
import { StatusBadge } from "../../_components/StatusBadge";
import { Pagination } from "../../_components/Pagination";

const ROLE_CLASSES: Record<string, string> = {
  SuperAdmin: "bg-rose-50 text-rose-800 border-rose-200",
  Admin: "bg-blue-50 text-[#0052ff] border-blue-200",
  Checker: "bg-amber-50 text-amber-800 border-amber-200",
  Organizer: "bg-emerald-50 text-emerald-800 border-emerald-200",
  Audience: "bg-slate-100 text-slate-700 border-slate-200",
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
    <div className="space-y-2">
      <div className="flex justify-between items-center px-1">
        <span className="sub">Danh sách tài khoản hệ thống ({totalItems})</span>
      </div>

      <div className="htcaa-table-wrap">
        <div className="overflow-x-auto min-h-[320px]">
          {isLoading ? (
            <div className="py-16 text-center text-slate-500 font-sans text-xs flex flex-col items-center justify-center gap-2">
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-[#0052ff] border-t-transparent" />
              <span>Đang tải danh sách người dùng...</span>
            </div>
          ) : users.length === 0 ? (
            <div className="py-16 text-center text-slate-500 font-sans text-xs">
              Không tìm thấy người dùng nào khớp bộ lọc.
            </div>
          ) : (
            <table className="htcaa-table">
              <thead>
                <tr>
                  <th>Người dùng</th>
                  <th style={{ textAlign: "center" }}>Trạng thái</th>
                  <th>Vai trò</th>
                  <th style={{ textAlign: "center" }}>Đơn hàng</th>
                  <th style={{ textAlign: "center" }}>Vé đã mua</th>
                  <th>Ngày tham gia</th>
                  <th style={{ textAlign: "center" }}>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {users.map((item) => (
                  <tr key={item.id} className="row-click group">
                    <td>
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-full bg-blue-50 text-[#0052ff] border border-blue-200 flex items-center justify-center font-bold text-xs shrink-0">
                          {item.full_name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div className="text-xs font-semibold text-slate-900 leading-tight">
                            {item.full_name}
                          </div>
                          <div className="text-[11px] text-slate-500 mt-0.5 font-mono">
                            {item.email}
                          </div>
                        </div>
                      </div>
                    </td>

                    <td style={{ textAlign: "center" }}>
                      <StatusBadge
                        status={item.status}
                        variant="user"
                        size="xs"
                      />
                    </td>

                    <td>
                      <div className="flex flex-wrap gap-1">
                        {item.roles.map((r) => (
                          <span
                            key={r}
                            className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${ROLE_CLASSES[r] ?? "bg-slate-50 text-slate-700 border-slate-200"}`}
                          >
                            {r}
                          </span>
                        ))}
                      </div>
                    </td>

                    <td
                      style={{ textAlign: "center" }}
                      className="font-bold text-slate-900 font-mono tabular-nums"
                    >
                      {item.order_count.toLocaleString("vi-VN")}
                    </td>

                    <td
                      style={{ textAlign: "center" }}
                      className="font-bold text-slate-900 font-mono tabular-nums"
                    >
                      {item.ticket_count.toLocaleString("vi-VN")}
                    </td>

                    <td className="text-slate-600 font-mono tabular-nums text-xs">
                      {new Date(item.created_at).toLocaleDateString("vi-VN", {
                        year: "numeric",
                        month: "2-digit",
                        day: "2-digit",
                      })}
                    </td>

                    <td style={{ textAlign: "center" }}>
                      <button
                        onClick={() => onViewDetail(item.id)}
                        className="btn btn-secondary btn-sm"
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
          <div className="px-3.5 py-2.5 bg-slate-50/50 border-t border-slate-200">
            <Pagination
              page={page}
              totalPages={totalPages}
              totalItems={totalItems}
              itemsPerPage={limit}
              onPageChange={onPageChange}
              onLimitChange={onLimitChange}
              itemLabel="tài khoản"
            />
          </div>
        )}
      </div>
    </div>
  );
}
