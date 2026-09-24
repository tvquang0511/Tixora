"use client";

import { use, useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { getOrderById, type OrderDetail } from "@/services/order.service";
import { formatConcertCurrency } from "@/services/concert.service";
import { resolveRefund } from "@/services/payment.service";
import { useToast } from "@/context/ToastContext";
import { getErrorMessage } from "@/utils/error.utils";
import {
  ChevronLeft,
  Calendar,
  FileText,
  User,
  CreditCard,
  ChevronDown,
  ChevronUp,
  Ticket,
  Loader2,
  AlertTriangle,
  CheckCircle,
  X,
  RotateCw,
} from "lucide-react";
import QRCode from "qrcode";

const ORDER_STATUS_CLASSES: Record<string, string> = {
  PAID: "bg-emerald-50 text-emerald-700 border-emerald-200/80",
  PENDING: "bg-amber-50 text-amber-700 border-amber-200/80",
  CANCELLED: "bg-rose-50 text-rose-700 border-rose-200/80",
};

const TX_STATUS_CLASSES: Record<string, string> = {
  SUCCESS: "bg-emerald-50 text-emerald-700 border-emerald-200/80",
  PENDING: "bg-amber-50 text-amber-700 border-amber-200/80",
  FAILED: "bg-rose-50 text-rose-700 border-rose-200/80",
  REFUNDED: "bg-teal-50 text-teal-700 border-teal-200/80",
};

interface TicketBreakdownItem {
  quantity?: number;
  unit_price?: number;
  category_id?: string;
  category_name?: string;
}

interface TicketMetadata {
  quantity?: number;
  unit_price?: number;
  category_id?: string;
  category_name?: string;
  ticket_breakdown?: TicketBreakdownItem[];
}

interface RefundInfoJson {
  refunded_by?: string;
  refunded_at?: string;
  refund_tx_id?: string;
  refund_note?: string;
}

interface RawResponseJson {
  warning?: string;
  refund_info?: RefundInfoJson;
}

interface PageProps {
  params: Promise<{ orderId: string }>;
}

function TicketQrCode({ hash, width = 96 }: { hash: string; width?: number }) {
  const [qrUrl, setQrUrl] = useState<string>("");

  useEffect(() => {
    let active = true;
    QRCode.toDataURL(hash, { width, margin: 1 })
      .then((url) => {
        if (active) setQrUrl(url);
      })
      .catch((err) => {
        console.error("Failed to generate ticket QR:", err);
      });
    return () => {
      active = false;
    };
  }, [hash, width]);

  if (!qrUrl) {
    return (
      <div className="flex h-16 w-16 items-center justify-center">
        <Loader2 className="h-4 w-4 animate-spin text-slate-900" />
      </div>
    );
  }

  return (
    /* eslint-disable-next-line @next/next/no-img-element */
    <img
      src={qrUrl}
      alt="Mã QR soát vé"
      className="w-full h-full object-contain"
    />
  );
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy text:", err);
    }
  };

  return (
    <button
      onClick={handleCopy}
      className="p-1 rounded-md hover:bg-slate-100 text-slate-400 hover:text-slate-800 transition-colors cursor-pointer shrink-0"
      title="Sao chép"
    >
      {copied ? (
        <span className="text-[10px] text-emerald-600 font-bold flex items-center gap-0.5 select-none font-mono">
          <svg
            className="w-3.5 h-3.5 shrink-0"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M4.5 12.75l6 6 9-13.5"
            />
          </svg>
          Đã chép
        </span>
      ) : (
        <svg
          className="w-3.5 h-3.5 shrink-0 select-none"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M15.75 17.25v3.375c0 .621-.504 1.125-1.125 1.125h-9.75a1.125 1.125 0 01-1.125-1.125V7.875c0-.621.504-1.125 1.125-1.125H6.75a9.06 9.06 0 011.5.124m7.5 10.376h3.375c.621 0 1.125-.504 1.125-1.125V11.25c0-4.46-3.243-8.161-7.5-8.876a9.06 9.06 0 00-1.5-.124H9.375c-.621 0-1.125.504-1.125 1.125v3.5m7.5 10.375H9.375a1.125 1.125 0 01-1.125-1.125v-9.25m12 6.625v-1.875a3.375 3.375 0 00-3.375-3.375h-1.5a1.125 1.125 0 01-1.125-1.125v-1.5a3.375 3.375 0 00-3.375-3.375H9.75"
          />
        </svg>
      )}
    </button>
  );
}

export default function AdminOrderDetailPage({ params }: PageProps) {
  const { orderId } = use(params);
  const { success: toastSuccess, error: toastError } = useToast();

  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [openJsonTx, setOpenJsonTx] = useState<Record<string, boolean>>({});

  // Refund resolution states
  const [isRefundModalOpen, setIsRefundModalOpen] = useState(false);
  const [refundTxId, setRefundTxId] = useState("");
  const [refundNote, setRefundNote] = useState("");
  const [isSubmittingRefund, setIsSubmittingRefund] = useState(false);

  const fetchOrder = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await getOrderById(orderId, true);
      if (data) {
        setOrder(data);
      } else {
        setError("Không tìm thấy đơn hàng.");
      }
    } catch (err) {
      console.error(err);
      setError("Lỗi tải thông tin chi tiết đơn hàng.");
    } finally {
      setIsLoading(false);
    }
  }, [orderId]);

  useEffect(() => {
    const timer = setTimeout(() => {
      void fetchOrder();
    }, 0);
    return () => clearTimeout(timer);
  }, [fetchOrder]);

  const toggleJson = (txId: string) => {
    setOpenJsonTx((prev) => ({ ...prev, [txId]: !prev[txId] }));
  };

  const handleResolveRefund = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!expiredPaidTx) return;

    setIsSubmittingRefund(true);
    try {
      await resolveRefund(expiredPaidTx.id, {
        refund_tx_id: refundTxId.trim() || undefined,
        refund_note: refundNote.trim() || undefined,
      });
      toastSuccess("Ghi nhận thông tin hoàn tiền thành công!");
      setIsRefundModalOpen(false);
      setRefundTxId("");
      setRefundNote("");

      // Reload order details
      const updatedOrder = await getOrderById(orderId, true);
      if (updatedOrder) {
        setOrder(updatedOrder);
      }
    } catch (err: unknown) {
      toastError(getErrorMessage(err));
    } finally {
      setIsSubmittingRefund(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-teal-600 border-t-transparent" />
          <span className="font-body text-xs text-slate-500">
            Đang tải chi tiết đơn hàng #{orderId}...
          </span>
        </div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 bg-white border border-slate-200 p-8 rounded-2xl shadow-2xs">
        <p className="font-body text-xs text-rose-600 font-semibold">
          {error || "Đã xảy ra lỗi"}
        </p>
        <div className="flex items-center gap-3">
          <button
            onClick={() => void fetchOrder()}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-xs font-semibold cursor-pointer shadow-2xs transition-colors"
          >
            <RotateCw size={13} /> Thử lại
          </button>
          <Link
            href="/orders"
            className="flex items-center gap-1.5 px-3.5 py-2 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 transition-colors shadow-2xs"
          >
            <ChevronLeft size={14} /> Quay lại danh sách
          </Link>
        </div>
      </div>
    );
  }

  // Detect payment transactions paid after expiration/cancellation
  const expiredPaidTx = order.payment_transactions.find((tx) => {
    const raw = tx.raw_response as unknown as RawResponseJson | null;
    return raw && raw.warning === "Paid after order expiration/cancellation";
  });

  const isRefunded = expiredPaidTx?.status === "REFUNDED";
  const refundInfo = (
    expiredPaidTx?.raw_response as unknown as RawResponseJson | null
  )?.refund_info;

  // Check if user has active name or email info
  const hasCustomerInfo = !!(order.user_name || order.user_email);

  return (
    <div className="space-y-6 max-w-7xl mx-auto font-body text-xs">
      {/* Top Bar: Navigation & Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div className="space-y-1 min-w-0">
          <div className="flex items-center gap-3">
            <Link
              href="/orders"
              className="inline-flex items-center gap-1 text-xs font-semibold text-slate-600 hover:text-slate-900 select-none"
            >
              <ChevronLeft size={14} /> Danh sách Đơn hàng
            </Link>
            <span className="text-slate-300">/</span>
            <span className="text-xs text-slate-400 font-mono">Chi tiết</span>
          </div>
          <div className="flex items-center gap-2 flex-wrap pt-1">
            <h1 className="font-display text-xl font-bold text-slate-900 break-all">
              Đơn hàng #{order.id.toUpperCase()}
            </h1>
            <CopyButton text={order.id} />
          </div>
          <div className="flex items-center gap-2 text-xs text-slate-500 font-mono">
            <span>Thời gian đặt:</span>
            <span className="font-semibold text-slate-700">
              {new Date(order.created_at).toLocaleString("vi-VN")}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={() => void fetchOrder()}
            disabled={isLoading}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-medium rounded-lg shadow-xs cursor-pointer transition-colors"
            title="Tải lại chi tiết"
          >
            <RotateCw size={13} className={isLoading ? "animate-spin" : ""} />
            <span>Làm mới</span>
          </button>
          <span
            className={`inline-flex items-center px-3 py-1 rounded-full font-medium text-xs border ${
              ORDER_STATUS_CLASSES[order.status] ??
              "bg-slate-100 text-slate-700 border-slate-200"
            }`}
          >
            {order.status === "PAID"
              ? "Đã thanh toán"
              : order.status === "PENDING"
                ? "Chờ thanh toán"
                : "Đã hủy"}
          </span>
        </div>
      </div>

      {/* Warning banner for late payment (Paid after expiration/cancellation) */}
      {expiredPaidTx && (
        <div
          className={`rounded-xl border p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 transition-colors ${
            isRefunded
              ? "bg-purple-50 border-purple-200 text-purple-900"
              : "bg-rose-50 border-rose-200 text-rose-900"
          }`}
        >
          <div className="flex items-start gap-3">
            {isRefunded ? (
              <CheckCircle className="w-5 h-5 text-purple-600 shrink-0 mt-0.5" />
            ) : (
              <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
            )}
            <div className="space-y-1">
              <h4 className="font-bold text-sm">
                {isRefunded
                  ? "Giao dịch thanh toán quá hạn - ĐÃ HOÀN TIỀN"
                  : "CẢNH BÁO: Phát hiện giao dịch thanh toán sau khi đơn hàng hết hạn/hủy"}
              </h4>
              <p className="text-slate-600 text-xs leading-relaxed">
                {isRefunded
                  ? "Đã ghi nhận giao dịch lỗi thanh toán quá hạn này được hoàn tiền hoàn tất."
                  : "Khách hàng đã chuyển tiền thành công nhưng đơn hàng đã bị hủy do quá thời gian chờ (10 phút). Vui lòng hoàn lại tiền."}
              </p>
              {isRefunded && refundInfo && (
                <div className="mt-2 p-3 bg-white border border-slate-200 rounded-lg space-y-1 text-[11px] text-slate-600">
                  <p>
                    <strong className="text-slate-900">Người thực hiện:</strong>{" "}
                    {refundInfo.refunded_by}
                  </p>
                  {refundInfo.refunded_at && (
                    <p>
                      <strong className="text-slate-900">Thời gian:</strong>{" "}
                      {new Date(refundInfo.refunded_at).toLocaleString("vi-VN")}
                    </p>
                  )}
                  {refundInfo.refund_tx_id && (
                    <p>
                      <strong className="text-slate-900">
                        Mã GD hoàn tiền:
                      </strong>{" "}
                      {refundInfo.refund_tx_id}
                    </p>
                  )}
                  {refundInfo.refund_note && (
                    <p>
                      <strong className="text-slate-900">Ghi chú:</strong>{" "}
                      {refundInfo.refund_note}
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>
          {!isRefunded && (
            <button
              onClick={() => setIsRefundModalOpen(true)}
              className="bg-rose-600 hover:bg-rose-700 text-white font-medium py-2 px-4 rounded-lg shadow-xs transition-colors cursor-pointer shrink-0 text-xs"
            >
              Đánh dấu đã hoàn tiền
            </button>
          )}
        </div>
      )}

      {/* Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column (2/3 if customer info exists, otherwise full width 3/3) */}
        <div
          className={
            hasCustomerInfo
              ? "lg:col-span-2 space-y-6"
              : "lg:col-span-3 space-y-6"
          }
        >
          {/* Concert Info */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-4 shadow-xs">
            <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
              <Calendar className="w-4 h-4 text-teal-600" />
              <h3 className="font-semibold text-sm text-slate-900">
                Thông tin Sự kiện & Hóa đơn
              </h3>
            </div>
            <div className="space-y-3">
              <div>
                <span className="text-[11px] font-medium text-slate-500 uppercase tracking-wider block">
                  Tên Sự kiện
                </span>
                <span className="text-sm font-semibold text-slate-900">
                  {order.concert_name}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-4 pt-1">
                <div>
                  <span className="text-[11px] font-medium text-slate-500 uppercase tracking-wider block">
                    Hạn thanh toán
                  </span>
                  <span className="text-xs text-slate-800 font-medium">
                    {new Date(order.expires_at).toLocaleString("vi-VN")}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block font-mono">
                    Tổng số lượng vé
                  </span>
                  <span className="font-body text-xs text-slate-900 font-bold font-mono">
                    {order.ticket_count} vé
                  </span>
                </div>
              </div>
              <div className="pt-3 flex justify-between items-center bg-slate-50/50 border border-slate-200 rounded-lg px-4 py-3">
                <span className="text-xs text-slate-600 font-semibold">
                  Tổng tiền thanh toán đơn hàng
                </span>
                <span className="font-bold text-slate-900 text-base font-mono">
                  {formatConcertCurrency(Number(order.total_amount))}
                </span>
              </div>
            </div>
          </div>

          {/* Ticket categories breakdown */}
          {order.ticket_metadata &&
            (() => {
              const metadata =
                order.ticket_metadata as unknown as TicketMetadata;
              return (
                <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-4 shadow-2xs">
                  <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
                    <div className="p-1 rounded-md bg-teal-50 text-teal-700 border border-teal-100">
                      <FileText className="w-3.5 h-3.5" />
                    </div>
                    <h3 className="text-sm font-bold text-slate-900">
                      Chi tiết Hạng vé Đặt
                    </h3>
                  </div>
                  <div className="space-y-3 font-body">
                    {Array.isArray(metadata.ticket_breakdown) ? (
                      <div className="space-y-2">
                        {metadata.ticket_breakdown.map(
                          (item: TicketBreakdownItem, idx: number) => (
                            <div
                              key={idx}
                              className="p-3 bg-slate-50/50 border border-slate-200 rounded-lg flex flex-col sm:flex-row justify-between sm:items-center gap-2 text-xs"
                            >
                              <div className="min-w-0">
                                <p className="font-bold text-slate-900">
                                  {item.category_name || "Hạng vé mặc định"}
                                </p>
                                <div className="text-[11px] text-slate-500 mt-0.5 flex items-center gap-1 flex-wrap font-mono">
                                  <span>Mã phân hạng:</span>
                                  <span className="font-bold text-slate-700 break-all">
                                    {item.category_id}
                                  </span>
                                  {item.category_id && (
                                    <CopyButton text={item.category_id} />
                                  )}
                                </div>
                              </div>
                              <div className="text-left sm:text-right shrink-0">
                                <p className="text-slate-500 font-mono text-[11px]">
                                  {item.quantity} vé ×{" "}
                                  {formatConcertCurrency(
                                    Number(item.unit_price || 0),
                                  )}
                                </p>
                                <p className="font-bold text-slate-900 font-mono mt-0.5">
                                  {formatConcertCurrency(
                                    Number(item.quantity || 0) *
                                      Number(item.unit_price || 0),
                                  )}
                                </p>
                              </div>
                            </div>
                          ),
                        )}
                      </div>
                    ) : (
                      <div className="p-3 bg-slate-50/50 border border-slate-200 rounded-lg flex flex-col sm:flex-row justify-between sm:items-center gap-2 text-xs">
                        <div className="min-w-0">
                          <p className="font-bold text-slate-900">
                            {String(
                              metadata.category_name || "Hạng vé mặc định",
                            )}
                          </p>
                          {metadata.category_id && (
                            <div className="text-[11px] text-slate-500 mt-0.5 flex items-center gap-1 flex-wrap font-mono">
                              <span>Mã phân hạng:</span>
                              <span className="font-bold text-slate-700 break-all">
                                {String(metadata.category_id)}
                              </span>
                              <CopyButton text={String(metadata.category_id)} />
                            </div>
                          )}
                        </div>
                        <div className="text-left sm:text-right shrink-0">
                          <p className="text-slate-500 font-mono text-[11px]">
                            {Number(metadata.quantity || 0)} vé ×{" "}
                            {formatConcertCurrency(
                              Number(metadata.unit_price || 0),
                            )}
                          </p>
                          <p className="font-bold text-slate-900 font-mono mt-0.5">
                            {formatConcertCurrency(Number(order.total_amount))}
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Collapsible raw json */}
                    <div className="pt-2">
                      <button
                        onClick={() =>
                          setOpenJsonTx((prev) => ({
                            ...prev,
                            metadata: !prev.metadata,
                          }))
                        }
                        className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-700 hover:text-slate-900 cursor-pointer select-none font-mono"
                      >
                        {openJsonTx.metadata ? (
                          <ChevronUp size={12} />
                        ) : (
                          <ChevronDown size={12} />
                        )}
                        {openJsonTx.metadata
                          ? "Ẩn cấu trúc JSON thô"
                          : "Xem cấu trúc JSON thô của vé"}
                      </button>
                      {openJsonTx.metadata && (
                        <div className="mt-2 bg-slate-900 text-slate-100 border border-slate-800 rounded-lg p-3 max-h-48 overflow-y-auto">
                          <pre className="font-mono text-[10px] whitespace-pre-wrap">
                            {JSON.stringify(metadata, null, 2)}
                          </pre>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })()}

          {/* Detailed tickets code list */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-4 shadow-2xs">
            <div className="flex items-center gap-2 pb-3 border-b border-slate-100 select-none">
              <div className="p-1 rounded-md bg-teal-50 text-teal-700 border border-teal-100">
                <Ticket className="w-3.5 h-3.5" />
              </div>
              <h3 className="text-sm font-bold text-slate-900">
                Danh sách Mã vé ({order.tickets.length})
              </h3>
            </div>
            {order.tickets.length === 0 ? (
              <p className="text-xs text-slate-500 font-body select-none">
                Không có thông tin vé lẻ.
              </p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {order.tickets.map((t) => (
                  <div
                    key={t.id}
                    className="p-3.5 bg-slate-50/50 border border-slate-200 rounded-xl flex gap-3 relative overflow-hidden shadow-2xs"
                  >
                    <div className="flex-1 min-w-0 flex flex-col justify-between gap-2">
                      <div>
                        <span className="text-[10px] font-semibold text-slate-500 block">
                          Mã vé ID
                        </span>
                        <div className="flex items-center gap-1 min-w-0">
                          <span className="font-mono text-xs font-bold text-slate-900 truncate">
                            #{t.id.toUpperCase()}
                          </span>
                          <CopyButton text={t.id} />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-xs pt-1">
                        <div>
                          <span className="text-[10px] font-semibold text-slate-500 block">
                            Hạng Vé
                          </span>
                          <span className="font-medium text-slate-800 truncate block">
                            {t.category_name || "Mặc định"}
                          </span>
                        </div>
                        <div>
                          <span className="text-[10px] font-semibold text-slate-500 block">
                            Cửa soát
                          </span>
                          <span className="font-medium text-slate-800 font-mono">
                            Cửa {t.gate_number ?? "N/A"}
                          </span>
                        </div>
                      </div>
                      <div className="pt-2 border-t border-slate-200/80 flex flex-col gap-1">
                        <div className="flex items-center gap-1.5">
                          <span className="text-[10px] font-medium text-slate-500">
                            Trạng thái:
                          </span>
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium border ${
                              t.is_scanned
                                ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                : "bg-slate-100 text-slate-600 border-slate-200"
                            }`}
                          >
                            {t.is_scanned ? "Đã Soát vé" : "Chưa Soát vé"}
                          </span>
                        </div>
                        {t.is_scanned && t.scanned_at && (
                          <span className="text-[10px] text-slate-500">
                            Lúc:{" "}
                            {new Date(t.scanned_at).toLocaleString("vi-VN")}
                          </span>
                        )}
                      </div>
                      <div className="mt-1">
                        <span className="text-[10px] font-medium text-slate-500 block">
                          Mã hash QR
                        </span>
                        <div className="flex items-center gap-1 min-w-0">
                          <span
                            className="font-mono text-[10px] text-slate-500 truncate"
                            title={t.qr_code_hash}
                          >
                            {t.qr_code_hash}
                          </span>
                          <CopyButton text={t.qr_code_hash} />
                        </div>
                      </div>
                    </div>

                    {/* QR Code display on the right */}
                    <div className="w-22 h-22 bg-white p-1 rounded-lg flex items-center justify-center shrink-0 border border-slate-200 self-center select-none shadow-2xs">
                      <TicketQrCode hash={t.qr_code_hash} width={88} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Payment Transactions Log */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-4 shadow-2xs">
            <div className="flex items-center gap-2 pb-3 border-b border-slate-100 select-none">
              <div className="p-1 rounded-md bg-teal-50 text-teal-700 border border-teal-100">
                <CreditCard className="w-3.5 h-3.5" />
              </div>
              <h3 className="text-sm font-bold text-slate-900">
                Lịch sử Giao dịch Cổng thanh toán
              </h3>
            </div>
            {order.payment_transactions.length === 0 ? (
              <p className="text-xs text-slate-500 font-body text-center py-4 select-none">
                Không ghi nhận lịch sử giao dịch.
              </p>
            ) : (
              <div className="space-y-3">
                {order.payment_transactions.map((tx) => (
                  <div
                    key={tx.id}
                    className="p-3.5 bg-slate-50/50 border border-slate-200 rounded-xl flex flex-col gap-2.5 shadow-2xs"
                  >
                    <div className="flex flex-col sm:flex-row justify-between sm:items-start gap-2 pb-2 border-b border-slate-200/80">
                      <div>
                        <span className="text-[10px] font-medium text-slate-500 block">
                          Mã giao dịch nội bộ
                        </span>
                        <div className="flex items-center gap-1">
                          <span className="font-mono text-xs font-bold text-slate-900 break-all">
                            {tx.id}
                          </span>
                          <CopyButton text={tx.id} />
                        </div>
                      </div>
                      <span
                        className={`self-start sm:self-center inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-medium border select-none ${
                          TX_STATUS_CLASSES[tx.status ?? ""] ??
                          "bg-slate-100 text-slate-700 border-slate-300"
                        }`}
                      >
                        {tx.status === "SUCCESS"
                          ? "THÀNH CÔNG"
                          : tx.status === "PENDING"
                            ? "CHỜ THANH TOÁN"
                            : tx.status === "REFUNDED"
                              ? "ĐÃ HOÀN TIỀN"
                              : "THẤT BẠI"}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs font-body">
                      <div>
                        <span className="text-[9px] text-slate-500 block font-bold uppercase font-mono">
                          Phương thức
                        </span>
                        <span className="font-semibold text-slate-900 uppercase font-mono">
                          {tx.payment_method}
                        </span>
                      </div>
                      <div>
                        <span className="text-[9px] text-slate-500 block font-bold uppercase font-mono">
                          Số tiền GD
                        </span>
                        <span className="font-bold text-slate-900 font-mono">
                          {formatConcertCurrency(Number(tx.amount))}
                        </span>
                      </div>
                      <div>
                        <span className="text-[9px] text-slate-500 block font-bold uppercase font-mono">
                          Mã GD đối tác (3rd Party)
                        </span>
                        <div className="flex items-center gap-1 min-w-0 font-mono">
                          <span className="text-xs text-slate-900 font-semibold break-all">
                            {tx.transaction_id_3rd_party || "Chưa ghi nhận"}
                          </span>
                          {tx.transaction_id_3rd_party && (
                            <CopyButton text={tx.transaction_id_3rd_party} />
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-[11px] pt-1 border-t border-slate-200">
                      <div>
                        <span className="text-[9px] text-slate-500 block font-bold uppercase font-mono">
                          Thời gian tạo
                        </span>
                        <span className="text-slate-600 font-mono">
                          {new Date(tx.created_at).toLocaleString("vi-VN")}
                        </span>
                      </div>
                      <div>
                        <span className="text-[9px] text-slate-500 block font-bold uppercase font-mono">
                          Cập nhật cuối
                        </span>
                        <span className="text-slate-600 font-mono">
                          {new Date(tx.updated_at).toLocaleString("vi-VN")}
                        </span>
                      </div>
                    </div>

                    {tx.idempotency_key && (
                      <div className="text-[10px] font-mono">
                        <span className="text-[9px] text-slate-500 block font-bold uppercase">
                          Idempotency Key
                        </span>
                        <div className="flex items-center gap-1">
                          <span className="text-slate-600 break-all">
                            {tx.idempotency_key}
                          </span>
                          <CopyButton text={tx.idempotency_key} />
                        </div>
                      </div>
                    )}

                    {/* Detailed raw JSON response view */}
                    {tx.raw_response && (
                      <div className="pt-1">
                        <button
                          onClick={() => toggleJson(tx.id)}
                          className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-700 hover:text-slate-900 cursor-pointer select-none font-mono"
                        >
                          {openJsonTx[tx.id] ? (
                            <ChevronUp size={12} />
                          ) : (
                            <ChevronDown size={12} />
                          )}
                          {openJsonTx[tx.id]
                            ? "Ẩn phản hồi RAW"
                            : "Xem phản hồi RAW từ Cổng thanh toán (PayOS)"}
                        </button>
                        {openJsonTx[tx.id] && (
                          <div className="mt-2 bg-slate-900 text-slate-100 border border-slate-800 rounded-lg p-3 max-h-60 overflow-y-auto">
                            <pre className="font-mono text-[10px] whitespace-pre-wrap">
                              {JSON.stringify(tx.raw_response, null, 2)}
                            </pre>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right column (1/3) - Customer details */}
        {hasCustomerInfo && (
          <div className="space-y-6">
            <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-4 shadow-sm">
              <div className="flex items-center gap-2 pb-3 border-b border-slate-100 select-none">
                <User className="w-4 h-4 text-teal-600" />
                <h3 className="font-sans text-xs font-semibold text-slate-900 uppercase tracking-wider">
                  Thông tin Khách hàng
                </h3>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-teal-50 text-teal-700 border border-teal-200 flex items-center justify-center font-bold text-sm shrink-0 select-none">
                  {order.user_name?.charAt(0).toUpperCase() || "U"}
                </div>
                <div className="space-y-0.5 min-w-0">
                  <h4 className="font-sans text-xs font-semibold text-slate-900 truncate">
                    {order.user_name}
                  </h4>
                  {order.user_email && (
                    <p className="text-slate-500 text-xs truncate">
                      {order.user_email}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* REFUND RESOLUTION MODAL */}
      {isRefundModalOpen && expiredPaidTx && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md bg-white border border-slate-200 rounded-2xl shadow-xl p-6 space-y-4 relative z-10 font-sans text-xs">
            <div className="flex justify-between items-center pb-2 border-b border-slate-100">
              <h3 className="font-sans text-sm font-semibold text-slate-900">
                Ghi nhận thông tin hoàn tiền
              </h3>
              <button
                onClick={() => {
                  setIsRefundModalOpen(false);
                  setRefundTxId("");
                  setRefundNote("");
                }}
                className="text-slate-400 hover:text-slate-700 cursor-pointer rounded-lg p-1"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleResolveRefund} className="space-y-4">
              <div className="p-3 bg-teal-50/50 rounded-lg border border-teal-100 space-y-1">
                <p className="text-[10px] text-teal-800 uppercase tracking-wider font-semibold">
                  Thông tin giao dịch lỗi:
                </p>
                <p className="font-bold text-teal-900 text-sm">
                  Số tiền: {formatConcertCurrency(Number(expiredPaidTx.amount))}
                </p>
                <p className="text-slate-600 text-[11px] font-mono">
                  Mã GD đối tác:{" "}
                  {expiredPaidTx.transaction_id_3rd_party || "N/A"}
                </p>
              </div>

              <label className="space-y-1 block">
                <span className="font-semibold text-slate-700 block text-[11px]">
                  Mã giao dịch hoàn tiền (Tùy chọn)
                </span>
                <input
                  type="text"
                  value={refundTxId}
                  onChange={(e) => setRefundTxId(e.target.value)}
                  placeholder="Nhập mã giao dịch ngân hàng (Ví dụ: FT123456)..."
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-mono text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 h-9 transition-colors"
                />
              </label>

              <label className="space-y-1 block">
                <span className="font-semibold text-slate-700 block text-[11px]">
                  Ghi chú hoàn tiền (Tùy chọn)
                </span>
                <textarea
                  value={refundNote}
                  onChange={(e) => setRefundNote(e.target.value)}
                  placeholder="Nhập thông tin tài khoản đã nhận hoàn tiền hoặc lý do..."
                  rows={3}
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-colors resize-none"
                />
              </label>

              <div className="flex gap-2.5 justify-end pt-3 border-t border-slate-100 mt-6">
                <button
                  type="button"
                  onClick={() => {
                    setIsRefundModalOpen(false);
                    setRefundTxId("");
                    setRefundNote("");
                  }}
                  className="bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 font-medium py-2 px-4 rounded-lg text-xs transition-colors cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingRefund}
                  className="bg-teal-600 hover:bg-teal-700 text-white font-medium py-2 px-5 rounded-lg text-xs transition-colors flex items-center gap-1.5 disabled:opacity-50 cursor-pointer shadow-sm"
                >
                  {isSubmittingRefund && (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  )}
                  Lưu thông tin
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
