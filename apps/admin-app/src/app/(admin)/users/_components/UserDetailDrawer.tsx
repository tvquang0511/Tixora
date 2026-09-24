"use client";

import { X, ShoppingBag, CheckCircle, Ticket, DollarSign } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/context/AuthContext";
import { type AdminUserDetail } from "@/services/admin-user.service";
import { StatusBadge } from "../../_components/StatusBadge";

const formatVND = (value: number) =>
  new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(
    value,
  );

interface UserDetailDrawerProps {
  selectedUserId: string | null;
  detailData: AdminUserDetail | null;
  isDetailLoading: boolean;
  draftStatus: string;
  draftRoles: string[];
  isSavingDraft: boolean;
  onClose: () => void;
  onDraftStatusChange: (v: string) => void;
  onDraftRolesChange: (roles: string[]) => void;
  onCancelDraft: () => void;
  onSaveChanges: () => void;
}

export function UserDetailDrawer({
  selectedUserId,
  detailData,
  isDetailLoading,
  draftStatus,
  draftRoles,
  isSavingDraft,
  onClose,
  onDraftStatusChange,
  onDraftRolesChange,
  onCancelDraft,
  onSaveChanges,
}: UserDetailDrawerProps) {
  const { user: currentUser } = useAuth();
  const isCurrentSuperAdmin = currentUser?.roles?.includes("SuperAdmin");
  const isTargetSuperAdmin = detailData?.roles?.includes("SuperAdmin");
  const canEditTarget = isCurrentSuperAdmin || !isTargetSuperAdmin;
  const statusChanged = detailData ? draftStatus !== detailData.status : false;
  const rolesChanged = detailData
    ? JSON.stringify([...draftRoles].sort()) !==
      JSON.stringify([...detailData.roles].sort())
    : false;
  const hasChanges = statusChanged || rolesChanged;

  return (
    <AnimatePresence>
      {selectedUserId && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.5 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-slate-900/60 z-40 backdrop-blur-xs"
          />

          <motion.aside
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "tween", duration: 0.25 }}
            className="fixed top-0 right-0 h-full w-full sm:max-w-2xl bg-white border-l border-slate-300 z-50 flex flex-col shadow-2xl overflow-hidden rounded-none text-slate-900"
          >
            {/* Header */}
            <div className="p-4 border-b border-slate-200 flex justify-between items-center bg-slate-50">
              <div className="flex gap-3 items-center">
                <div className="w-10 h-10 rounded-none bg-slate-900 text-white flex items-center justify-center font-bold font-mono text-base">
                  {detailData?.full_name?.charAt(0).toUpperCase() || "U"}
                </div>
                <div>
                  <h3 className="font-mono text-sm font-bold text-slate-900 uppercase">
                    {detailData?.full_name || "Hồ sơ người dùng"}
                  </h3>
                  <p className="text-xs text-slate-500 font-mono mt-0.5">
                    {detailData?.email}
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-200 rounded-none transition-colors cursor-pointer"
                title="Đóng ngăn chi tiết"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-5 space-y-5">
              {isDetailLoading ? (
                <div className="py-20 text-center text-slate-500 font-mono text-xs flex flex-col items-center justify-center gap-2">
                  <div className="h-5 w-5 animate-spin border-2 border-slate-900 border-t-transparent" />
                  <span>Đang tải thông tin chi tiết hồ sơ...</span>
                </div>
              ) : !detailData ? (
                <div className="py-20 text-center text-slate-500 font-mono text-xs">
                  Không thể tải hồ sơ người dùng.
                </div>
              ) : (
                <>
                  {/* Stat Metrics */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="bg-slate-50 border border-slate-200 rounded-none p-3 text-center">
                      <ShoppingBag className="w-4 h-4 text-slate-600 mx-auto mb-1" />
                      <p className="text-[10px] font-mono font-bold text-slate-500 uppercase tracking-wider">
                        Đơn hàng
                      </p>
                      <p className="text-base font-bold text-slate-900 font-mono mt-1">
                        {detailData.stats.order_count.toLocaleString("vi-VN")}
                      </p>
                    </div>

                    <div className="bg-slate-50 border border-slate-200 rounded-none p-3 text-center">
                      <CheckCircle className="w-4 h-4 text-emerald-600 mx-auto mb-1" />
                      <p className="text-[10px] font-mono font-bold text-slate-500 uppercase tracking-wider">
                        Hoàn tất
                      </p>
                      <p className="text-base font-bold text-emerald-700 font-mono mt-1">
                        {detailData.stats.paid_order_count.toLocaleString(
                          "vi-VN",
                        )}
                      </p>
                    </div>

                    <div className="bg-slate-50 border border-slate-200 rounded-none p-3 text-center">
                      <Ticket className="w-4 h-4 text-slate-600 mx-auto mb-1" />
                      <p className="text-[10px] font-mono font-bold text-slate-500 uppercase tracking-wider">
                        Số vé mua
                      </p>
                      <p className="text-base font-bold text-slate-900 font-mono mt-1">
                        {detailData.stats.ticket_count.toLocaleString("vi-VN")}
                      </p>
                    </div>

                    <div className="bg-slate-50 border border-slate-200 rounded-none p-3 text-center">
                      <DollarSign className="w-4 h-4 text-slate-600 mx-auto mb-1" />
                      <p className="text-[10px] font-mono font-bold text-slate-500 uppercase tracking-wider">
                        Tổng chi tiêu
                      </p>
                      <p className="text-xs font-bold text-slate-900 font-mono mt-1 truncate">
                        {formatVND(detailData.stats.total_spent)}
                      </p>
                    </div>
                  </div>

                  {/* Status & Roles Editor */}
                  <div className="space-y-4 bg-white rounded-none border border-slate-200 p-4">
                    {!canEditTarget && (
                      <div className="p-3 rounded-none bg-purple-50 border border-purple-200 text-purple-800 text-xs font-sans">
                        Tài khoản SuperAdmin được bảo vệ. Chỉ SuperAdmin khác
                        mới có quyền thay đổi trạng thái hoặc vai trò của tài
                        khoản này.
                      </div>
                    )}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {/* Status */}
                      <div className="space-y-1.5">
                        <label className="font-mono text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
                          Trạng thái hoạt động
                        </label>
                        <select
                          disabled={isSavingDraft || !canEditTarget}
                          value={draftStatus}
                          onChange={(e) => onDraftStatusChange(e.target.value)}
                          className="bg-white border border-slate-300 rounded-none px-3 py-1.5 text-xs font-mono font-semibold text-slate-900 focus:outline-none focus:border-slate-800 w-full h-10 transition-colors cursor-pointer disabled:opacity-50"
                        >
                          <option value="ACTIVE">ACTIVE</option>
                          <option value="INACTIVE">INACTIVE</option>
                          <option value="BANNED">BANNED</option>
                          <option value="PENDING">PENDING</option>
                        </select>
                      </div>

                      {/* Roles */}
                      <div className="space-y-1.5">
                        <label className="font-mono text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
                          Vai trò người dùng
                        </label>
                        <select
                          disabled={isSavingDraft || !canEditTarget}
                          value={draftRoles[0] || "Audience"}
                          onChange={(e) => onDraftRolesChange([e.target.value])}
                          className="bg-white border border-slate-300 rounded-none px-3 py-1.5 text-xs font-mono font-semibold text-slate-900 focus:outline-none focus:border-slate-800 w-full h-10 transition-colors cursor-pointer disabled:opacity-50"
                        >
                          <option value="Audience">Audience</option>
                          {isCurrentSuperAdmin && (
                            <option value="SuperAdmin">SuperAdmin</option>
                          )}
                          {isCurrentSuperAdmin && (
                            <option value="Admin">Admin</option>
                          )}
                          <option value="Checker">Checker</option>
                          <option value="Organizer">Organizer</option>
                        </select>
                      </div>
                    </div>

                    {hasChanges && (
                      <div className="pt-3 border-t border-slate-200 flex justify-end gap-2">
                        <button
                          type="button"
                          onClick={onCancelDraft}
                          disabled={isSavingDraft}
                          className="bg-white hover:bg-slate-100 border border-slate-300 text-slate-700 font-mono text-xs font-semibold py-2 px-3 rounded-none transition-colors cursor-pointer disabled:opacity-50"
                        >
                          Hủy
                        </button>
                        <button
                          type="button"
                          onClick={onSaveChanges}
                          disabled={isSavingDraft}
                          className="bg-slate-900 hover:bg-slate-800 text-white font-mono text-xs font-bold py-2 px-4 rounded-none transition-colors cursor-pointer disabled:opacity-50"
                        >
                          {isSavingDraft ? "Đang lưu..." : "Lưu thay đổi"}
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Recent Orders */}
                  <div className="space-y-2">
                    <h4 className="font-mono text-xs font-bold uppercase tracking-wider text-slate-900">
                      Đơn hàng gần đây của tài khoản
                    </h4>
                    {detailData.recent_orders.length === 0 ? (
                      <div className="text-center py-8 text-slate-500 font-mono text-xs border border-slate-200 bg-slate-50">
                        Người dùng này chưa có đơn hàng nào.
                      </div>
                    ) : (
                      <div className="border border-slate-200 rounded-none overflow-hidden bg-white">
                        <table className="w-full text-left border-collapse text-xs">
                          <thead>
                            <tr className="border-b border-slate-200 bg-slate-100 font-mono text-[10px] font-bold text-slate-600 uppercase tracking-wider">
                              <th className="p-2.5">Sự kiện</th>
                              <th className="p-2.5 text-center">Trạng thái</th>
                              <th className="p-2.5 text-right">Tổng tiền</th>
                              <th className="p-2.5 text-center">Số vé</th>
                              <th className="p-2.5">Ngày đặt</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-200 font-sans">
                            {detailData.recent_orders.map((o) => (
                              <tr
                                key={o.order_id}
                                className="hover:bg-slate-50 transition-colors"
                              >
                                <td className="p-2.5 font-bold text-slate-900 text-xs">
                                  {o.concert_name}
                                </td>
                                <td className="p-2.5 text-center">
                                  <StatusBadge
                                    status={o.status}
                                    variant="order"
                                  />
                                </td>
                                <td className="p-2.5 text-right font-bold text-slate-900 font-mono">
                                  {formatVND(o.total_amount)}
                                </td>
                                <td className="p-2.5 text-center font-bold text-slate-900 font-mono">
                                  {o.ticket_count}
                                </td>
                                <td className="p-2.5 text-slate-500 font-mono text-[11px]">
                                  {new Date(o.created_at).toLocaleDateString(
                                    "vi-VN",
                                    { month: "short", day: "numeric" },
                                  )}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
