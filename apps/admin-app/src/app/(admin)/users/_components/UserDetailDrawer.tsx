"use client";

import {
  X,
  ShoppingBag,
  CheckCircle,
  Ticket,
  DollarSign,
  ShieldAlert,
  RotateCw,
} from "lucide-react";
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
            className="fixed top-0 right-0 h-full w-full sm:max-w-2xl bg-white border-l border-slate-200 z-50 flex flex-col shadow-2xl overflow-hidden text-slate-900"
          >
            {/* Header */}
            <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <div className="flex gap-3 items-center">
                <div className="w-10 h-10 rounded-full bg-blue-50 text-[#0052ff] border border-blue-200 flex items-center justify-center font-bold text-base">
                  {detailData?.full_name?.charAt(0).toUpperCase() || "U"}
                </div>
                <div>
                  <h3 className="font-sans text-sm font-semibold text-slate-900">
                    {detailData?.full_name || "Hồ sơ người dùng"}
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {detailData?.email}
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                title="Đóng ngăn chi tiết"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-5 space-y-5">
              {isDetailLoading ? (
                <div className="py-20 text-center text-slate-500 font-sans text-xs flex flex-col items-center justify-center gap-2">
                  <div className="h-5 w-5 animate-spin rounded-full border-2 border-[#0052ff] border-t-transparent" />
                  <span>Đang tải thông tin chi tiết hồ sơ...</span>
                </div>
              ) : !detailData ? (
                <div className="py-20 text-center text-slate-500 font-sans text-xs">
                  Không thể tải hồ sơ người dùng.
                </div>
              ) : (
                <>
                  {/* Stat Metrics */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="bg-slate-50/70 border border-slate-100 rounded-xl p-3 text-center">
                      <ShoppingBag className="w-4 h-4 text-[#0052ff] mx-auto mb-1" />
                      <p className="over">Đơn hàng</p>
                      <p className="text-base font-bold text-slate-900 font-sans mt-1 tabular-nums">
                        {detailData.stats.order_count.toLocaleString("vi-VN")}
                      </p>
                    </div>

                    <div className="bg-slate-50/70 border border-slate-100 rounded-xl p-3 text-center">
                      <CheckCircle className="w-4 h-4 text-emerald-600 mx-auto mb-1" />
                      <p className="over">Hoàn tất</p>
                      <p className="text-base font-bold text-emerald-700 font-sans mt-1 tabular-nums">
                        {detailData.stats.paid_order_count.toLocaleString(
                          "vi-VN",
                        )}
                      </p>
                    </div>

                    <div className="bg-slate-50/70 border border-slate-100 rounded-xl p-3 text-center">
                      <Ticket className="w-4 h-4 text-[#0052ff] mx-auto mb-1" />
                      <p className="over">Số vé mua</p>
                      <p className="text-base font-bold text-slate-900 font-sans mt-1 tabular-nums">
                        {detailData.stats.ticket_count.toLocaleString("vi-VN")}
                      </p>
                    </div>

                    <div className="bg-slate-50/70 border border-slate-100 rounded-xl p-3 text-center">
                      <DollarSign className="w-4 h-4 text-emerald-600 mx-auto mb-1" />
                      <p className="text-[10px] font-sans font-semibold text-slate-500 uppercase tracking-wider">
                        Tổng chi tiêu
                      </p>
                      <p className="text-xs font-bold text-slate-900 font-sans mt-1 truncate">
                        {formatVND(detailData.stats.total_spent)}
                      </p>
                    </div>
                  </div>

                  {/* Status & Roles Editor */}
                  <div className="space-y-4 bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
                    {!canEditTarget && (
                      <div className="p-3 rounded-lg bg-purple-50 border border-purple-200 text-purple-800 text-xs font-sans">
                        Tài khoản SuperAdmin được bảo vệ. Chỉ SuperAdmin khác
                        mới có quyền thay đổi trạng thái hoặc vai trò của tài
                        khoản này.
                      </div>
                    )}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {/* Status */}
                      <div className="space-y-1.5">
                        <label className="over block">
                          Trạng thái hoạt động
                        </label>
                        <select
                          disabled={isSavingDraft || !canEditTarget}
                          value={draftStatus}
                          onChange={(e) => onDraftStatusChange(e.target.value)}
                          className={`select-trigger w-full h-10 disabled:opacity-50 text-xs font-semibold ${
                            draftStatus === "BANNED"
                              ? "border-rose-400 bg-rose-50/50 text-rose-700"
                              : ""
                          }`}
                        >
                          <option value="ACTIVE">
                            ACTIVE - Hoạt động bình thường
                          </option>
                          <option value="BANNED">
                            BANNED - Cấm tài khoản (Khóa)
                          </option>
                          <option value="INACTIVE">
                            INACTIVE - Tạm khóa tài khoản
                          </option>
                          <option value="PENDING">
                            PENDING - Chờ kích hoạt
                          </option>
                        </select>
                      </div>

                      {/* Roles */}
                      <div className="space-y-1.5">
                        <label className="over block">Vai trò người dùng</label>
                        <select
                          disabled={isSavingDraft || !canEditTarget}
                          value={draftRoles[0] || "Audience"}
                          onChange={(e) => onDraftRolesChange([e.target.value])}
                          className="select-trigger w-full h-10 disabled:opacity-50 text-xs font-semibold"
                        >
                          <option value="Audience">Audience (Khán giả)</option>
                          {isCurrentSuperAdmin && (
                            <option value="SuperAdmin">
                              SuperAdmin (Quản trị cấp cao)
                            </option>
                          )}
                          {isCurrentSuperAdmin && (
                            <option value="Admin">Admin (Quản trị viên)</option>
                          )}
                          <option value="Checker">Checker (Soát vé)</option>
                          <option value="Organizer">
                            Organizer (Ban tổ chức)
                          </option>
                        </select>
                      </div>
                    </div>

                    {/* Warning when BANNED is selected */}
                    {draftStatus === "BANNED" && (
                      <div className="p-3 bg-rose-50 border border-rose-300 rounded-xl text-rose-900 text-xs flex items-start gap-2.5">
                        <ShieldAlert className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                        <div className="space-y-0.5">
                          <p className="font-bold text-rose-800">
                            Cảnh báo cấm tài khoản người dùng!
                          </p>
                          <p className="text-rose-700 leading-relaxed text-[11px]">
                            Tài khoản <strong>{detailData.email}</strong> sẽ bị{" "}
                            <span className="font-bold underline">
                              CẤM (BANNED)
                            </span>{" "}
                            ngay sau khi nhấn nút <strong>Lưu thay đổi</strong>.
                            Người dùng sẽ bị đăng xuất khỏi tất cả phiên làm
                            việc và không thể truy cập hệ thống.
                          </p>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Recent Orders */}
                  <div className="space-y-2">
                    <h4 className="font-sans text-xs font-semibold uppercase tracking-wider text-slate-900">
                      Đơn hàng gần đây của tài khoản
                    </h4>
                    {detailData.recent_orders.length === 0 ? (
                      <div className="text-center py-8 text-slate-500 font-sans text-xs border border-slate-100 rounded-xl bg-slate-50">
                        Người dùng này chưa có đơn hàng nào.
                      </div>
                    ) : (
                      <div className="border border-slate-200 rounded-xl overflow-hidden bg-white shadow-xs">
                        <table className="w-full text-left border-collapse text-xs">
                          <thead>
                            <tr className="border-b border-slate-100 bg-slate-50/70 font-sans text-[11px] font-semibold text-slate-600 uppercase tracking-wider">
                              <th className="p-2.5">Sự kiện</th>
                              <th className="p-2.5 text-center">Trạng thái</th>
                              <th className="p-2.5 text-right">Tổng tiền</th>
                              <th className="p-2.5 text-center">Số vé</th>
                              <th className="p-2.5">Ngày đặt</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 font-sans">
                            {detailData.recent_orders.map((o) => (
                              <tr
                                key={o.order_id}
                                className="hover:bg-slate-50/80 transition-colors"
                              >
                                <td className="p-2.5 font-medium text-slate-900 text-xs">
                                  {o.concert_name}
                                </td>
                                <td className="p-2.5 text-center">
                                  <StatusBadge
                                    status={o.status}
                                    variant="order"
                                  />
                                </td>
                                <td className="p-2.5 text-right font-medium text-slate-900 font-mono">
                                  {formatVND(o.total_amount)}
                                </td>
                                <td className="p-2.5 text-center font-medium text-slate-900 font-mono">
                                  {o.ticket_count}
                                </td>
                                <td className="p-2.5 text-slate-500 text-[11px]">
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

            {/* Sticky Action Footer */}
            {detailData && (
              <div className="p-4 border-t border-slate-200 bg-slate-50/90 flex items-center justify-between gap-3">
                <div>
                  {hasChanges ? (
                    <span className="text-xs font-semibold text-amber-700 flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                      Có thay đổi chưa lưu
                    </span>
                  ) : (
                    <span className="text-xs text-slate-400">
                      Chưa có thay đổi nào
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={onCancelDraft}
                    disabled={!hasChanges || isSavingDraft}
                    className="btn btn-secondary btn-sm disabled:opacity-50"
                  >
                    Hủy
                  </button>
                  <button
                    type="button"
                    onClick={onSaveChanges}
                    disabled={!hasChanges || isSavingDraft}
                    className={`btn btn-sm inline-flex items-center gap-2 ${
                      draftStatus === "BANNED" ? "btn-danger" : "btn-primary"
                    }`}
                  >
                    {isSavingDraft ? (
                      <>
                        <RotateCw className="w-3.5 h-3.5 animate-spin" />
                        <span>Đang lưu...</span>
                      </>
                    ) : (
                      <span>Lưu thay đổi</span>
                    )}
                  </button>
                </div>
              </div>
            )}
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
