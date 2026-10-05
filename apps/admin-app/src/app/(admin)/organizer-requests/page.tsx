"use client";

import { useEffect, useState } from "react";
import {
  Building2,
  CheckCircle,
  XCircle,
  Search,
  ExternalLink,
  RotateCw,
  AlertCircle,
  FileText,
  CreditCard,
  Phone,
  Mail,
} from "lucide-react";
import {
  getOrganizerRequests,
  approveOrganizerRequest,
  rejectOrganizerRequest,
  OrganizerRequestItem,
} from "@/services/organizer-request.service";

export default function OrganizerRequestsPage() {
  const [requests, setRequests] = useState<OrganizerRequestItem[]>([]);
  const [totalItems, setTotalItems] = useState(0);
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [search, setSearch] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  // Modals state
  const [selectedRequest, setSelectedRequest] =
    useState<OrganizerRequestItem | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isApproveOpen, setIsApproveOpen] = useState(false);
  const [isRejectOpen, setIsRejectOpen] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  const fetchRequests = async () => {
    try {
      setIsLoading(true);
      const res = await getOrganizerRequests({
        page,
        limit,
        status: statusFilter === "ALL" ? undefined : statusFilter,
        search: search.trim() || undefined,
      });
      setRequests(res.data || []);
      setTotalItems(res.meta?.totalItems || 0);
    } catch (err: unknown) {
      console.error("Failed to load organizer requests", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    let active = true;
    getOrganizerRequests({
      page,
      limit,
      status: statusFilter === "ALL" ? undefined : statusFilter,
      search: search.trim() || undefined,
    })
      .then((res) => {
        if (active) {
          setRequests(res.data || []);
          setTotalItems(res.meta?.totalItems || 0);
          setIsLoading(false);
        }
      })
      .catch((err: unknown) => {
        console.error("Failed to load organizer requests", err);
        if (active) setIsLoading(false);
      });

    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, statusFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchRequests();
  };

  const handleApprove = async () => {
    if (!selectedRequest) return;
    try {
      setIsSubmitting(true);
      setActionError(null);
      await approveOrganizerRequest(selectedRequest.id);
      setActionSuccess(
        `Đã phê duyệt đối tác ${selectedRequest.organization_name} thành công!`,
      );
      setIsApproveOpen(false);
      setSelectedRequest(null);
      fetchRequests();
    } catch (err: unknown) {
      const msg =
        err instanceof Error
          ? err.message
          : "Phê duyệt thất bại. Vui lòng thử lại.";
      setActionError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReject = async () => {
    if (!selectedRequest) return;
    if (!rejectionReason.trim()) {
      setActionError("Vui lòng nhập lý do từ chối hồ sơ.");
      return;
    }
    try {
      setIsSubmitting(true);
      setActionError(null);
      await rejectOrganizerRequest(selectedRequest.id, rejectionReason.trim());
      setActionSuccess(
        `Đã từ chối hồ sơ của ${selectedRequest.organization_name}.`,
      );
      setIsRejectOpen(false);
      setSelectedRequest(null);
      setRejectionReason("");
      fetchRequests();
    } catch (err: unknown) {
      const msg =
        err instanceof Error
          ? err.message
          : "Từ chối thất bại. Vui lòng thử lại.";
      setActionError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-4 max-w-7xl mx-auto pb-8">
      {/* Header */}
      <div className="head stickyhead">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="htcaa-h1">Hồ sơ đối tác BTC</h1>
            <span className="htcaa-badge-count-pill">{totalItems} hồ sơ</span>
          </div>
          <p className="sub">
            Kiểm tra thông tin pháp nhân, hồ sơ năng lực và cấp quyền Organizer
            cho đối tác
          </p>
        </div>
        <div className="head-actions">
          <button
            onClick={() => fetchRequests()}
            disabled={isLoading}
            className="btn btn-secondary btn-sm"
          >
            <RotateCw
              className={`w-3.5 h-3.5 ${isLoading ? "animate-spin text-[#0052ff]" : ""}`}
            />
            Làm mới
          </button>
        </div>
      </div>

      {/* Notifications */}
      {actionSuccess && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-800 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{actionSuccess}</span>
          </div>
          <button
            onClick={() => setActionSuccess(null)}
            className="text-emerald-600 hover:text-emerald-800 text-xs font-semibold cursor-pointer"
          >
            Đóng
          </button>
        </div>
      )}

      {actionError && (
        <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-rose-800 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{actionError}</span>
          </div>
          <button
            onClick={() => setActionError(null)}
            className="text-rose-600 hover:text-rose-800 text-xs font-semibold cursor-pointer"
          >
            Đóng
          </button>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="filters">
        {/* Status Tabs */}
        <div className="htcaa-segmented">
          {[
            { key: "ALL", label: "Tất cả" },
            { key: "PENDING", label: "Chờ duyệt" },
            { key: "APPROVED", label: "Đã duyệt" },
            { key: "REJECTED", label: "Từ chối" },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => {
                setStatusFilter(tab.key);
                setPage(1);
              }}
              className={statusFilter === tab.key ? "active" : ""}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Search Input */}
        <form
          onSubmit={handleSearchSubmit}
          className="search-box flex-1 max-w-md"
        >
          <Search className="w-4 h-4 text-slate-400 shrink-0" />
          <input
            type="text"
            placeholder="Tìm theo tên đơn vị, email, MST..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <button
            type="submit"
            className="btn btn-primary btn-sm !py-1 !px-2.5 ml-1"
          >
            Tìm kiếm
          </button>
        </form>
      </div>

      {/* Table */}
      {/* Table */}
      <div className="htcaa-table-wrap">
        <div className="overflow-x-auto min-h-[320px]">
          <table className="htcaa-table">
            <thead>
              <tr>
                <th>Tên đơn vị / Doanh nghiệp</th>
                <th>Đại diện / Liên hệ</th>
                <th>Mã số thuế / CCCD</th>
                <th>Tài khoản thanh toán</th>
                <th>Hồ sơ đính kèm</th>
                <th>Trạng thái</th>
                <th>Ngày nộp</th>
                <th style={{ textAlign: "right" }}>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    <RotateCw className="w-5 h-5 animate-spin mx-auto text-[#0052ff] mb-2" />
                    Đang tải dữ liệu hồ sơ...
                  </td>
                </tr>
              ) : requests.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-500">
                    <Building2 className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                    Không tìm thấy hồ sơ đối tác nào phù hợp.
                  </td>
                </tr>
              ) : (
                requests.map((item) => (
                  <tr key={item.id} className="row-click group">
                    {/* Organization Name */}
                    <td>
                      <div className="font-semibold text-slate-900 text-xs">
                        {item.organization_name}
                      </div>
                      <div className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5 font-mono tabular-nums">
                        <Phone className="w-3 h-3 text-slate-400" />
                        {item.phone_number}
                      </div>
                    </td>

                    {/* Contact User */}
                    <td>
                      <div className="font-medium text-slate-800 text-xs">
                        {item.user?.full_name || "N/A"}
                      </div>
                      <div className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5 font-mono">
                        <Mail className="w-3 h-3 text-slate-400" />
                        {item.user?.email}
                      </div>
                    </td>

                    {/* Tax Code */}
                    <td className="font-mono tabular-nums text-xs text-slate-700 font-semibold">
                      {item.tax_code_or_id}
                    </td>

                    {/* Bank Info */}
                    <td>
                      {item.bank_name ? (
                        <div className="text-xs">
                          <span className="font-semibold text-slate-800">
                            {item.bank_name}
                          </span>
                          <div className="font-mono tabular-nums text-slate-600 mt-0.5 text-[11px]">
                            {item.bank_account_number}
                          </div>
                          <div className="text-[10px] text-slate-400 uppercase truncate max-w-[150px]">
                            {item.bank_account_name}
                          </div>
                        </div>
                      ) : (
                        <span className="text-xs text-slate-400">
                          Chưa cung cấp
                        </span>
                      )}
                    </td>

                    {/* Documents */}
                    <td>
                      <div className="flex flex-col gap-1">
                        {item.business_license_url ? (
                          <a
                            href={item.business_license_url}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1 text-xs text-[#0052ff] hover:text-[#0e54a3] font-medium"
                          >
                            <FileText className="w-3 h-3" />
                            Giấy phép KD
                            <ExternalLink className="w-2.5 h-2.5" />
                          </a>
                        ) : null}
                        {item.portfolio_url ? (
                          <a
                            href={item.portfolio_url}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1 text-xs text-[#0052ff] hover:text-[#0e54a3] font-medium"
                          >
                            <ExternalLink className="w-3 h-3" />
                            Portfolio
                          </a>
                        ) : null}
                        {!item.business_license_url && !item.portfolio_url && (
                          <span className="text-xs text-slate-400">
                            Không có
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Status */}
                    <td>
                      {item.status === "PENDING" && (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                          Chờ duyệt
                        </span>
                      )}
                      {item.status === "APPROVED" && (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          <CheckCircle className="w-3.5 h-3.5 text-emerald-500" />
                          Đã phê duyệt
                        </span>
                      )}
                      {item.status === "REJECTED" && (
                        <div>
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200">
                            <XCircle className="w-3.5 h-3.5 text-rose-500" />
                            Bị từ chối
                          </span>
                          {item.rejection_reason && (
                            <div
                              className="text-[11px] text-rose-600 mt-1 max-w-[160px] truncate"
                              title={item.rejection_reason}
                            >
                              Lý do: {item.rejection_reason}
                            </div>
                          )}
                        </div>
                      )}
                    </td>

                    {/* Created Date */}
                    <td className="text-[11px] font-mono tabular-nums text-slate-500 whitespace-nowrap">
                      {new Date(item.created_at).toLocaleDateString("vi-VN", {
                        year: "numeric",
                        month: "2-digit",
                        day: "2-digit",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </td>

                    {/* Actions */}
                    <td className="text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => {
                            setSelectedRequest(item);
                            setIsDetailOpen(true);
                          }}
                          className="btn btn-secondary btn-sm"
                        >
                          Chi tiết
                        </button>

                        {item.status === "PENDING" && (
                          <>
                            <button
                              onClick={() => {
                                setSelectedRequest(item);
                                setActionError(null);
                                setIsApproveOpen(true);
                              }}
                              className="btn btn-primary btn-sm"
                            >
                              Duyệt
                            </button>
                            <button
                              onClick={() => {
                                setSelectedRequest(item);
                                setActionError(null);
                                setRejectionReason("");
                                setIsRejectOpen(true);
                              }}
                              className="btn btn-danger btn-sm"
                            >
                              Từ chối
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="px-3.5 py-2.5 bg-slate-50/50 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
          <div className="font-mono tabular-nums">
            Hiển thị{" "}
            <span className="font-semibold text-slate-800">
              {requests.length}
            </span>{" "}
            / <span className="font-semibold text-slate-800">{totalItems}</span>{" "}
            hồ sơ
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="btn btn-secondary btn-sm disabled:opacity-50"
            >
              Trang trước
            </button>
            <span className="px-2 py-1 font-mono font-semibold text-slate-700">
              Trang {page}
            </span>
            <button
              onClick={() => setPage((p) => p + 1)}
              disabled={requests.length < limit}
              className="btn btn-secondary btn-sm disabled:opacity-50"
            >
              Trang sau
            </button>
          </div>
        </div>
      </div>

      {/* Modal Detail */}
      {isDetailOpen && selectedRequest && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="card max-w-xl w-full p-6 shadow-xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-base text-slate-900 flex items-center gap-2">
                <Building2 className="w-5 h-5 text-[#0052ff]" />
                Thông Tin Đối Tác Chi Tiết
              </h3>
              <button
                onClick={() => setIsDetailOpen(false)}
                className="text-slate-400 hover:text-slate-600 text-lg leading-none cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-xs text-slate-400 font-medium">
                  Tên đơn vị
                </span>
                <p className="font-semibold text-slate-900 mt-0.5">
                  {selectedRequest.organization_name}
                </p>
              </div>
              <div>
                <span className="text-xs text-slate-400 font-medium">
                  Mã số thuế / CCCD
                </span>
                <p className="font-mono font-semibold text-slate-900 mt-0.5">
                  {selectedRequest.tax_code_or_id}
                </p>
              </div>
              <div>
                <span className="text-xs text-slate-400 font-medium">
                  Số điện thoại liên hệ
                </span>
                <p className="font-medium text-slate-800 mt-0.5">
                  {selectedRequest.phone_number}
                </p>
              </div>
              <div>
                <span className="text-xs text-slate-400 font-medium">
                  Tài khoản người đại diện
                </span>
                <p className="font-medium text-slate-800 mt-0.5">
                  {selectedRequest.user?.full_name} (
                  {selectedRequest.user?.email})
                </p>
              </div>
            </div>

            {/* Bank Card Box */}
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/80 space-y-2">
              <div className="flex items-center gap-2 text-xs font-semibold text-slate-600 uppercase tracking-wider">
                <CreditCard className="w-4 h-4 text-[#0052ff]" />
                Thông Tin Tài Khoản Nhận Thanh Toán (Escrow)
              </div>
              <div className="grid grid-cols-3 gap-2 text-xs pt-1">
                <div>
                  <span className="text-slate-400">Ngân hàng:</span>
                  <p className="font-semibold text-slate-800 mt-0.5">
                    {selectedRequest.bank_name || "N/A"}
                  </p>
                </div>
                <div>
                  <span className="text-slate-400">Số tài khoản:</span>
                  <p className="font-mono font-semibold text-slate-800 mt-0.5">
                    {selectedRequest.bank_account_number || "N/A"}
                  </p>
                </div>
                <div>
                  <span className="text-slate-400">Chủ tài khoản:</span>
                  <p className="font-semibold text-slate-800 uppercase mt-0.5">
                    {selectedRequest.bank_account_name || "N/A"}
                  </p>
                </div>
              </div>
            </div>

            {/* Documents */}
            <div className="space-y-2">
              <span className="text-xs text-slate-400 font-medium">
                Hồ sơ pháp lý đính kèm
              </span>
              <div className="flex flex-wrap gap-3">
                {selectedRequest.business_license_url ? (
                  <a
                    href={selectedRequest.business_license_url}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-2 bg-blue-50 border border-blue-200 rounded-lg text-xs font-medium text-[#0052ff] hover:bg-blue-100 transition-colors"
                  >
                    <FileText className="w-4 h-4" />
                    Xem Giấy phép kinh doanh
                    <ExternalLink className="w-3 h-3" />
                  </a>
                ) : (
                  <span className="text-xs text-slate-400 italic">
                    Chưa đính kèm giấy phép KD
                  </span>
                )}
                {selectedRequest.portfolio_url ? (
                  <a
                    href={selectedRequest.portfolio_url}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-700 hover:bg-slate-100 transition-colors"
                  >
                    <ExternalLink className="w-4 h-4" />
                    Xem Hồ sơ năng lực / Website
                  </a>
                ) : null}
              </div>
            </div>

            <div className="flex justify-end pt-3 border-t border-slate-100">
              <button
                onClick={() => setIsDetailOpen(false)}
                className="btn btn-secondary btn-sm"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Approve Confirmation */}
      {isApproveOpen && selectedRequest && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="card max-w-md w-full p-6 shadow-xl border border-slate-200 space-y-4">
            <div className="w-10 h-10 rounded-md bg-emerald-50 text-emerald-600 border border-emerald-100 flex items-center justify-center mx-auto">
              <CheckCircle className="w-5 h-5" />
            </div>
            <div className="text-center">
              <h3 className="font-bold text-lg text-slate-900">
                Xác Nhận Phê Duyệt Đối Tác
              </h3>
              <p className="text-sm text-slate-500 mt-1">
                Tài khoản{" "}
                <span className="font-semibold text-slate-800">
                  {selectedRequest.user?.email}
                </span>{" "}
                thuộc đơn vị{" "}
                <span className="font-semibold text-slate-800">
                  {selectedRequest.organization_name}
                </span>{" "}
                sẽ được cấp vai trò{" "}
                <span className="font-bold text-[#0052ff]">Organizer</span> và
                mở quyền tạo sự kiện bán vé.
              </p>
            </div>

            <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
              <button
                onClick={() => setIsApproveOpen(false)}
                disabled={isSubmitting}
                className="btn btn-plain btn-sm"
              >
                Hủy bỏ
              </button>
              <button
                onClick={handleApprove}
                disabled={isSubmitting}
                className="btn btn-primary btn-sm inline-flex items-center gap-2"
              >
                {isSubmitting && <RotateCw className="w-4 h-4 animate-spin" />}
                Xác nhận phê duyệt
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Reject Confirmation */}
      {isRejectOpen && selectedRequest && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="card max-w-md w-full p-6 shadow-xl border border-slate-200 space-y-4">
            <div className="w-10 h-10 rounded-md bg-rose-50 text-rose-600 border border-rose-100 flex items-center justify-center mx-auto">
              <XCircle className="w-5 h-5" />
            </div>
            <div className="text-center">
              <h3 className="font-bold text-lg text-slate-900">
                Từ Chối Hồ Sơ Đối Tác
              </h3>
              <p className="text-sm text-slate-500 mt-1">
                Nhập lý do từ chối để gửi thông báo hướng dẫn đối tác bổ sung
                giấy tờ.
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Lý do từ chối <span className="text-rose-500">*</span>
              </label>
              <textarea
                rows={3}
                placeholder="Ví dụ: Giấy phép kinh doanh bị mờ, Mã số thuế không khớp với tên doanh nghiệp..."
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                className="w-full p-3 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500"
              />
            </div>

            <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
              <button
                onClick={() => setIsRejectOpen(false)}
                disabled={isSubmitting}
                className="btn btn-plain btn-sm"
              >
                Hủy bỏ
              </button>
              <button
                onClick={handleReject}
                disabled={isSubmitting}
                className="btn btn-danger btn-sm inline-flex items-center gap-2"
              >
                {isSubmitting && <RotateCw className="w-4 h-4 animate-spin" />}
                Xác nhận từ chối
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
