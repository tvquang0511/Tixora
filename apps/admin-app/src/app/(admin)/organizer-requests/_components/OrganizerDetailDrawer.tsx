"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Building2,
  AlertCircle,
  FileText,
  CreditCard,
  Phone,
  Mail,
  ExternalLink,
  ShieldAlert,
  RotateCw,
  Shield,
} from "lucide-react";
import {
  type OrganizerRequestItem,
  updateOrganizerRequestStatus,
  approveOrganizerRequest,
  rejectOrganizerRequest,
} from "@/services/organizer-request.service";
import {
  updateAdminUserStatus,
  getAdminUserDetail,
} from "@/services/admin-user.service";
import { useToast } from "@/context/ToastContext";
import { StatusBadge } from "../../_components/StatusBadge";

interface OrganizerDetailDrawerProps {
  request: OrganizerRequestItem | null;
  onClose: () => void;
  onSuccess: () => void;
}

export function OrganizerDetailDrawer({
  request,
  onClose,
  onSuccess,
}: OrganizerDetailDrawerProps) {
  const { success: toastSuccess, error: toastError } = useToast();

  // Draft states for editing
  const [draftRequestStatus, setDraftRequestStatus] = useState<
    "PENDING" | "APPROVED" | "REJECTED"
  >("PENDING");
  const [draftUserStatus, setDraftUserStatus] = useState<string>("ACTIVE");
  const [rejectionReason, setRejectionReason] = useState<string>("");

  const [initialUserStatus, setInitialUserStatus] = useState<string>("ACTIVE");
  const [isFetchingUser, setIsFetchingUser] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Sync state when request prop changes
  useEffect(() => {
    if (!request) return;

    const timer = setTimeout(() => {
      setDraftRequestStatus(request.status);
      setRejectionReason(request.rejection_reason || "");
      setErrorMessage(null);

      // Fetch latest user status if user_id is present
      if (request.user_id) {
        setIsFetchingUser(true);
        getAdminUserDetail(request.user_id)
          .then((u) => {
            const userSt = u.status || request.user?.status || "ACTIVE";
            setDraftUserStatus(userSt);
            setInitialUserStatus(userSt);
          })
          .catch(() => {
            const fallbackSt = request.user?.status || "ACTIVE";
            setDraftUserStatus(fallbackSt);
            setInitialUserStatus(fallbackSt);
          })
          .finally(() => {
            setIsFetchingUser(false);
          });
      } else {
        const fallbackSt = request.user?.status || "ACTIVE";
        setDraftUserStatus(fallbackSt);
        setInitialUserStatus(fallbackSt);
      }
    }, 0);

    return () => clearTimeout(timer);
  }, [request]);

  if (!request) return null;

  const hasRequestStatusChanged = draftRequestStatus !== request.status;
  const hasUserStatusChanged = draftUserStatus !== initialUserStatus;
  const hasReasonChanged =
    draftRequestStatus === "REJECTED" &&
    rejectionReason !== (request.rejection_reason || "");

  const hasChanges =
    hasRequestStatusChanged || hasUserStatusChanged || hasReasonChanged;

  const handleReset = () => {
    setDraftRequestStatus(request.status);
    setDraftUserStatus(initialUserStatus);
    setRejectionReason(request.rejection_reason || "");
    setErrorMessage(null);
  };

  const handleSaveChanges = async () => {
    if (!hasChanges) return;

    if (draftRequestStatus === "REJECTED" && !rejectionReason.trim()) {
      setErrorMessage("Vui lòng nhập lý do từ chối hồ sơ ban tổ chức.");
      return;
    }

    try {
      setIsSaving(true);
      setErrorMessage(null);

      // 1. Update Organizer Request Status if changed
      if (hasRequestStatusChanged || hasReasonChanged) {
        try {
          await updateOrganizerRequestStatus(
            request.id,
            draftRequestStatus,
            draftRequestStatus === "REJECTED"
              ? rejectionReason.trim()
              : undefined,
          );
        } catch {
          // Fallback to legacy endpoints if PATCH status not available
          if (draftRequestStatus === "APPROVED") {
            await approveOrganizerRequest(request.id);
          } else if (draftRequestStatus === "REJECTED") {
            await rejectOrganizerRequest(request.id, rejectionReason.trim());
          }
        }
      }

      // 2. Update User Account Status if changed (BANNED, ACTIVE, INACTIVE, etc.)
      if (hasUserStatusChanged && request.user_id) {
        await updateAdminUserStatus(request.user_id, draftUserStatus);
      }

      toastSuccess(
        `Đã lưu thay đổi trạng thái đối tác ${request.organization_name} thành công!`,
      );
      onSuccess();
      onClose();
    } catch (err: unknown) {
      const msg =
        err instanceof Error
          ? err.message
          : "Lưu thay đổi thất bại. Vui lòng kiểm tra lại.";
      setErrorMessage(msg);
      toastError(msg);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <AnimatePresence>
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
        <div className="p-4 border-b border-slate-200 flex justify-between items-center bg-slate-50/70">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-[#0052ff] border border-blue-200 flex items-center justify-center shrink-0">
              <Building2 className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="font-sans text-sm font-bold text-slate-900 truncate">
                  {request.organization_name}
                </h3>
                <StatusBadge
                  status={request.status}
                  variant="organizer"
                  size="xs"
                />
              </div>
              <p className="text-xs text-slate-500 truncate mt-0.5">
                Đại diện: {request.user?.full_name} ({request.user?.email})
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer shrink-0"
            title="Đóng ngăn chi tiết"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          {errorMessage && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{errorMessage}</span>
              </div>
              <button
                type="button"
                onClick={() => setErrorMessage(null)}
                className="text-rose-600 hover:text-rose-800 font-bold"
              >
                ✕
              </button>
            </div>
          )}

          {/* Quick Metrics */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <div className="bg-slate-50/80 border border-slate-200/80 rounded-xl p-3 text-center">
              <p className="over">Trạng thái hồ sơ</p>
              <div className="mt-1 flex justify-center">
                <StatusBadge
                  status={request.status}
                  variant="organizer"
                  size="xs"
                />
              </div>
            </div>

            <div className="bg-slate-50/80 border border-slate-200/80 rounded-xl p-3 text-center">
              <p className="over">Tài khoản đại diện</p>
              <div className="mt-1 flex justify-center">
                <span
                  className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold ${
                    initialUserStatus === "ACTIVE"
                      ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                      : initialUserStatus === "BANNED"
                        ? "bg-rose-50 text-rose-700 border border-rose-200"
                        : "bg-slate-100 text-slate-600 border border-slate-200"
                  }`}
                >
                  {initialUserStatus}
                </span>
              </div>
            </div>

            <div className="bg-slate-50/80 border border-slate-200/80 rounded-xl p-3 text-center col-span-2 sm:col-span-1">
              <p className="over">Ngày đăng ký</p>
              <p className="text-xs font-semibold text-slate-800 mt-1">
                {new Date(request.created_at).toLocaleDateString("vi-VN", {
                  day: "2-digit",
                  month: "2-digit",
                  year: "numeric",
                })}
              </p>
            </div>
          </div>

          {/* EDIT STATUS SECTION */}
          <div className="card p-4 space-y-4 border-2 border-blue-100 bg-blue-50/20">
            <div className="flex items-center justify-between border-b border-blue-100 pb-2.5">
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-[#0052ff]" />
                <h4 className="font-sans text-xs font-bold uppercase tracking-wider text-slate-900">
                  Cập nhật trạng thái đối tác
                </h4>
              </div>
              <span className="text-[11px] text-blue-600 font-medium">
                Quản trị viên
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Request Status Dropdown */}
              <div className="space-y-1.5">
                <label className="over block text-slate-700">
                  Trạng thái hồ sơ BTC
                </label>
                <select
                  disabled={isSaving}
                  value={draftRequestStatus}
                  onChange={(e) =>
                    setDraftRequestStatus(
                      e.target.value as "PENDING" | "APPROVED" | "REJECTED",
                    )
                  }
                  className="select-trigger w-full h-10 disabled:opacity-50 text-xs font-semibold"
                >
                  <option value="PENDING">PENDING - Chờ xét duyệt</option>
                  <option value="APPROVED">
                    APPROVED - Phê duyệt (Cấp quyền)
                  </option>
                  <option value="REJECTED">REJECTED - Từ chối hồ sơ</option>
                </select>
                <p className="text-[10px] text-slate-500">
                  {draftRequestStatus === "APPROVED"
                    ? "Tài khoản sẽ được cấp vai trò Organizer để tạo sự kiện bán vé."
                    : draftRequestStatus === "REJECTED"
                      ? "Hồ sơ đối tác bị từ chối và sẽ yêu cầu bổ sung thông tin."
                      : "Hồ sơ đang trong trạng thái chờ quản trị viên xem xét."}
                </p>
              </div>

              {/* User Account Status Dropdown (Active/Banned/Inactive) */}
              <div className="space-y-1.5">
                <label className="over block text-slate-700">
                  Trạng thái tài khoản người đại diện
                </label>
                <select
                  disabled={isSaving || isFetchingUser}
                  value={draftUserStatus}
                  onChange={(e) => setDraftUserStatus(e.target.value)}
                  className={`select-trigger w-full h-10 disabled:opacity-50 text-xs font-semibold ${
                    draftUserStatus === "BANNED"
                      ? "border-rose-400 bg-rose-50/50 text-rose-700"
                      : ""
                  }`}
                >
                  <option value="ACTIVE">ACTIVE - Hoạt động bình thường</option>
                  <option value="BANNED">
                    BANNED - Cấm tài khoản (Khóa truy cập)
                  </option>
                  <option value="INACTIVE">
                    INACTIVE - Tạm khóa tài khoản
                  </option>
                  <option value="PENDING">PENDING - Chờ kích hoạt</option>
                </select>
                <p className="text-[10px] text-slate-500">
                  Điều khiển quyền đăng nhập và thao tác hệ thống của người đại
                  diện.
                </p>
              </div>
            </div>

            {/* Warning when BANNED is selected */}
            {draftUserStatus === "BANNED" && (
              <div className="p-3 bg-rose-50 border border-rose-300 rounded-xl text-rose-900 text-xs flex items-start gap-2.5">
                <ShieldAlert className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                <div className="space-y-0.5">
                  <p className="font-bold text-rose-800">
                    Cảnh báo cấm tài khoản Ban tổ chức!
                  </p>
                  <p className="text-rose-700 leading-relaxed text-[11px]">
                    Tài khoản đại diện <strong>{request.user?.email}</strong> sẽ
                    bị <span className="font-bold underline">CẤM (BANNED)</span>{" "}
                    ngay sau khi nhấn nút <strong>Lưu thay đổi</strong>. Đối tác
                    sẽ bị đăng xuất khỏi tất cả phiên làm việc và không thể truy
                    cập hệ thống.
                  </p>
                </div>
              </div>
            )}

            {/* Rejection Reason Textarea when REJECTED is selected */}
            {draftRequestStatus === "REJECTED" && (
              <div className="space-y-1.5 pt-1">
                <label className="block text-xs font-semibold text-rose-700">
                  Lý do từ chối hồ sơ <span className="text-rose-500">*</span>
                </label>
                <textarea
                  rows={3}
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  placeholder="Ví dụ: Giấy phép kinh doanh chưa công chứng, thông tin thuế không trùng khớp..."
                  className="w-full p-2.5 text-xs border border-rose-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 bg-white"
                />
              </div>
            )}
          </div>

          {/* Legal and Business Information */}
          <div className="card p-4 space-y-3">
            <h4 className="font-sans text-xs font-bold uppercase tracking-wider text-slate-900">
              Thông tin pháp nhân & Liên hệ
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div>
                <span className="text-slate-400">Tên đơn vị:</span>
                <p className="font-bold text-slate-900 mt-0.5">
                  {request.organization_name}
                </p>
              </div>
              <div>
                <span className="text-slate-400">Mã số thuế / CCCD:</span>
                <p className="font-mono font-semibold text-slate-900 mt-0.5">
                  {request.tax_code_or_id}
                </p>
              </div>
              <div>
                <span className="text-slate-400">Số điện thoại liên hệ:</span>
                <p className="font-medium text-slate-800 mt-0.5 flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-slate-400" />
                  {request.phone_number}
                </p>
              </div>
              <div>
                <span className="text-slate-400">
                  Tài khoản người đại diện:
                </span>
                <p className="font-medium text-slate-800 mt-0.5 flex items-center gap-1.5 truncate">
                  <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span className="truncate">{request.user?.email}</span>
                </p>
              </div>
            </div>
          </div>

          {/* Escrow & Bank Account Details */}
          <div className="card p-4 space-y-2.5 bg-slate-50/60">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-700 uppercase tracking-wider">
              <CreditCard className="w-4 h-4 text-[#0052ff]" />
              Tài khoản nhận thanh toán đối soát (Escrow)
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs pt-1">
              <div>
                <span className="text-slate-400">Ngân hàng:</span>
                <p className="font-semibold text-slate-800 mt-0.5">
                  {request.bank_name || "Chưa cung cấp"}
                </p>
              </div>
              <div>
                <span className="text-slate-400">Số tài khoản:</span>
                <p className="font-mono font-semibold text-slate-800 mt-0.5">
                  {request.bank_account_number || "Chưa cung cấp"}
                </p>
              </div>
              <div>
                <span className="text-slate-400">Chủ tài khoản:</span>
                <p className="font-semibold text-slate-800 uppercase mt-0.5">
                  {request.bank_account_name || "Chưa cung cấp"}
                </p>
              </div>
            </div>
          </div>

          {/* Attachments & Documents */}
          <div className="card p-4 space-y-2.5">
            <span className="over block text-slate-700">
              Hồ sơ pháp lý & Liên kết
            </span>
            <div className="flex flex-wrap gap-2.5">
              {request.business_license_url ? (
                <a
                  href={request.business_license_url}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-2 bg-blue-50 border border-blue-200 rounded-lg text-xs font-medium text-[#0052ff] hover:bg-blue-100 transition-colors cursor-pointer"
                >
                  <FileText className="w-4 h-4" />
                  <span>Xem Giấy phép kinh doanh</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              ) : (
                <span className="text-xs text-slate-400 italic py-1">
                  Chưa đính kèm giấy phép kinh doanh
                </span>
              )}

              {request.portfolio_url ? (
                <a
                  href={request.portfolio_url}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  <ExternalLink className="w-4 h-4" />
                  <span>Xem Hồ sơ năng lực / Website</span>
                </a>
              ) : null}
            </div>
          </div>
        </div>

        {/* Sticky Action Footer */}
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
              onClick={handleReset}
              disabled={!hasChanges || isSaving}
              className="btn btn-secondary btn-sm disabled:opacity-50"
            >
              Hủy
            </button>
            <button
              type="button"
              onClick={handleSaveChanges}
              disabled={!hasChanges || isSaving}
              className={`btn btn-sm inline-flex items-center gap-2 ${
                draftUserStatus === "BANNED" ? "btn-danger" : "btn-primary"
              }`}
            >
              {isSaving ? (
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
      </motion.aside>
    </AnimatePresence>
  );
}
