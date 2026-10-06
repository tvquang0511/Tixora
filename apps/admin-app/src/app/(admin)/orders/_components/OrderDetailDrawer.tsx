"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  ExternalLink,
  User,
  Calendar,
  CreditCard,
  Ticket,
  AlertTriangle,
  RotateCw,
  Copy,
  Check,
  ChevronDown,
  ChevronUp,
  Receipt,
  Clock,
  AlertCircle,
} from "lucide-react";
import QRCode from "qrcode";
import { getOrderById, type OrderDetail } from "@/services/order.service";
import { formatConcertCurrency } from "@/services/concert.service";
import { resolveRefund } from "@/services/payment.service";
import { useToast } from "@/context/ToastContext";
import { getErrorMessage } from "@/utils/error.utils";
import { StatusBadge } from "../../_components/StatusBadge";

interface OrderDetailDrawerProps {
  orderId: string | null;
  onClose: () => void;
  onOrderUpdated?: () => void;
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

function DrawerQrCode({ hash }: { hash: string }) {
  const [qrUrl, setQrUrl] = useState<string>("");

  useEffect(() => {
    let active = true;
    QRCode.toDataURL(hash, { width: 120, margin: 1 })
      .then((url) => {
        if (active) setQrUrl(url);
      })
      .catch((err) => {
        console.error("Failed to generate ticket QR:", err);
      });
    return () => {
      active = false;
    };
  }, [hash]);

  if (!qrUrl) {
    return (
      <div className="flex h-20 w-20 items-center justify-center bg-slate-100 rounded-lg">
        <RotateCw className="h-4 w-4 animate-spin text-slate-400" />
      </div>
    );
  }

  return (
    /* eslint-disable-next-line @next/next/no-img-element */
    <img
      src={qrUrl}
      alt="Mã QR soát vé"
      className="w-20 h-20 object-contain rounded-md border border-slate-200 bg-white p-1"
    />
  );
}

function CopyPill({ text, label }: { text: string; label?: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  return (
    <button
      onClick={handleCopy}
      type="button"
      className="inline-flex items-center gap-1 text-[11px] font-mono font-medium text-slate-500 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 px-2 py-0.5 rounded cursor-pointer transition-colors"
      title="Sao chép"
    >
      <span>{label || text}</span>
      {copied ? (
        <Check className="w-3 h-3 text-emerald-600" />
      ) : (
        <Copy className="w-3 h-3 text-slate-400" />
      )}
    </button>
  );
}

export function OrderDetailDrawer({
  orderId,
  onClose,
  onOrderUpdated,
}: OrderDetailDrawerProps) {
  const { success: toastSuccess, error: toastError } = useToast();
  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [openJsonTx, setOpenJsonTx] = useState<Record<string, boolean>>({});

  // Refund states
  const [isRefundFormOpen, setIsRefundFormOpen] = useState(false);
  const [refundTxId, setRefundTxId] = useState("");
  const [refundNote, setRefundNote] = useState("");
  const [isSubmittingRefund, setIsSubmittingRefund] = useState(false);

  const fetchOrder = useCallback(async () => {
    if (!orderId) return;
    try {
      setIsLoading(true);
      setError(null);
      const data = await getOrderById(orderId, true);
      if (data) {
        setOrder(data);
      } else {
        setError("Không tìm thấy thông tin đơn hàng");
      }
    } catch (err: unknown) {
      console.error(err);
      setError("Không thể tải chi tiết đơn hàng");
    } finally {
      setIsLoading(false);
    }
  }, [orderId]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (!orderId) {
        setOrder(null);
        setError(null);
        setIsRefundFormOpen(false);
      } else {
        void fetchOrder();
      }
    }, 0);

    return () => clearTimeout(timer);
  }, [orderId, fetchOrder]);

  const toggleJson = (txId: string) => {
    setOpenJsonTx((prev) => ({ ...prev, [txId]: !prev[txId] }));
  };

  // Detect payment transactions paid after expiration/cancellation
  const expiredPaidTx = order?.payment_transactions.find((tx) => {
    const raw = tx.raw_response as unknown as RawResponseJson | null;
    return raw && raw.warning === "Paid after order expiration/cancellation";
  });

  const isRefunded = expiredPaidTx?.status === "REFUNDED";
  const refundInfo = (
    expiredPaidTx?.raw_response as unknown as RawResponseJson | null
  )?.refund_info;

  const handleResolveRefund = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!expiredPaidTx || !orderId) return;

    setIsSubmittingRefund(true);
    try {
      await resolveRefund(expiredPaidTx.id, {
        refund_tx_id: refundTxId.trim() || undefined,
        refund_note: refundNote.trim() || undefined,
      });
      toastSuccess("Ghi nhận thông tin hoàn tiền thành công!");
      setIsRefundFormOpen(false);
      setRefundTxId("");
      setRefundNote("");
      void fetchOrder();
      onOrderUpdated?.();
    } catch (err: unknown) {
      toastError(getErrorMessage(err));
    } finally {
      setIsSubmittingRefund(false);
    }
  };

  return (
    <AnimatePresence>
      {orderId && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.5 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-slate-900/60 z-40 backdrop-blur-xs"
          />

          {/* Drawer Panel */}
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
                  <Receipt className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="font-sans text-sm font-bold text-slate-900 truncate">
                      Đơn hàng #{orderId.slice(0, 8).toUpperCase()}
                    </h3>
                    {order && (
                      <StatusBadge
                        status={order.status}
                        variant="order"
                        size="xs"
                      />
                    )}
                  </div>
                  <div className="flex items-center gap-2 mt-0.5">
                    <CopyPill
                      text={orderId}
                      label={orderId.slice(0, 16) + "..."}
                    />
                    {order?.created_at && (
                      <span className="text-[11px] text-slate-400">
                        {new Date(order.created_at).toLocaleString("vi-VN", {
                          dateStyle: "short",
                          timeStyle: "short",
                        })}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-1.5 shrink-0">
                <Link
                  href={`/orders/${orderId}`}
                  target="_blank"
                  className="p-2 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                  title="Mở toàn màn hình trong tab mới"
                >
                  <ExternalLink className="w-4 h-4" />
                </Link>
                <button
                  onClick={onClose}
                  className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                  title="Đóng ngăn chi tiết"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Content Body */}
            <div className="flex-1 overflow-y-auto p-5 space-y-5">
              {isLoading ? (
                <div className="py-24 text-center text-slate-500 font-sans text-xs flex flex-col items-center justify-center gap-3">
                  <div className="h-6 w-6 animate-spin rounded-full border-2 border-[#0052ff] border-t-transparent" />
                  <span>
                    Đang tải thông tin chi tiết đơn hàng #{orderId.slice(0, 8)}
                    ...
                  </span>
                </div>
              ) : error || !order ? (
                <div className="py-16 text-center text-slate-500 font-sans text-xs space-y-3">
                  <AlertCircle className="w-8 h-8 text-rose-500 mx-auto" />
                  <p className="text-slate-700 font-medium">
                    {error || "Không tìm thấy dữ liệu đơn hàng"}
                  </p>
                  <button
                    onClick={() => void fetchOrder()}
                    className="btn btn-primary btn-sm inline-flex items-center gap-1.5"
                  >
                    <RotateCw className="w-3.5 h-3.5" />
                    Thử lại
                  </button>
                </div>
              ) : (
                <>
                  {/* Warning for Expired/Late Payment */}
                  {expiredPaidTx && (
                    <div
                      className={`p-4 rounded-xl border flex flex-col gap-3 ${
                        isRefunded
                          ? "bg-blue-50/60 border-blue-200 text-blue-950"
                          : "bg-amber-50/70 border-amber-200 text-amber-950"
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <AlertTriangle
                          className={`w-5 h-5 shrink-0 mt-0.5 ${
                            isRefunded ? "text-[#0052ff]" : "text-amber-600"
                          }`}
                        />
                        <div className="space-y-1 text-xs">
                          <p className="font-bold text-sm">
                            {isRefunded
                              ? "Giao dịch đã được ghi nhận hoàn tiền"
                              : "Cảnh báo: Khách thanh toán sau khi đơn bị hủy / hết hạn!"}
                          </p>
                          <p className="leading-relaxed opacity-90">
                            {isRefunded
                              ? `Đơn hàng đã được quản trị viên xử lý hoàn tiền (${refundInfo?.refund_tx_id || "Chưa có mã GD"}).`
                              : "Số tiền đã trừ tại cổng thanh toán nhưng đơn hàng đã đóng. Cần đối soát và xử lý hoàn tiền cho khách hàng."}
                          </p>
                        </div>
                      </div>

                      {!isRefunded && (
                        <div>
                          {!isRefundFormOpen ? (
                            <button
                              onClick={() => setIsRefundFormOpen(true)}
                              className="btn btn-sm bg-amber-600 hover:bg-amber-700 text-white border-none font-semibold cursor-pointer"
                            >
                              Ghi nhận xử lý hoàn tiền
                            </button>
                          ) : (
                            <form
                              onSubmit={handleResolveRefund}
                              className="bg-white/80 p-3.5 rounded-lg border border-amber-300 space-y-3 mt-1"
                            >
                              <div className="space-y-1">
                                <label className="block text-[11px] font-semibold text-slate-700">
                                  Mã giao dịch hoàn tiền (Refund TxID)
                                </label>
                                <input
                                  type="text"
                                  value={refundTxId}
                                  onChange={(e) =>
                                    setRefundTxId(e.target.value)
                                  }
                                  placeholder="VD: REF_VNPAY_12345678"
                                  className="w-full text-xs px-2.5 py-1.5 border border-slate-300 rounded-md focus:outline-none focus:border-[#0052ff]"
                                />
                              </div>
                              <div className="space-y-1">
                                <label className="block text-[11px] font-semibold text-slate-700">
                                  Ghi chú xử lý
                                </label>
                                <input
                                  type="text"
                                  value={refundNote}
                                  onChange={(e) =>
                                    setRefundNote(e.target.value)
                                  }
                                  placeholder="Đã chuyển khoản hoàn lại qua cổng thanh toán..."
                                  className="w-full text-xs px-2.5 py-1.5 border border-slate-300 rounded-md focus:outline-none focus:border-[#0052ff]"
                                />
                              </div>
                              <div className="flex items-center gap-2 pt-1">
                                <button
                                  type="submit"
                                  disabled={isSubmittingRefund}
                                  className="btn btn-primary btn-sm"
                                >
                                  {isSubmittingRefund
                                    ? "Đang lưu..."
                                    : "Xác nhận hoàn tiền"}
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setIsRefundFormOpen(false)}
                                  className="btn btn-secondary btn-sm"
                                >
                                  Hủy
                                </button>
                              </div>
                            </form>
                          )}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Summary Metric Cards */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="bg-slate-50/80 border border-slate-200/80 rounded-xl p-3 text-center">
                      <p className="over">Tổng thanh toán</p>
                      <p className="text-sm font-bold text-slate-900 font-mono mt-1">
                        {formatConcertCurrency(Number(order.total_amount))}
                      </p>
                    </div>

                    <div className="bg-slate-50/80 border border-slate-200/80 rounded-xl p-3 text-center">
                      <p className="over">Số lượng vé</p>
                      <p className="text-sm font-bold text-[#0052ff] font-mono mt-1">
                        {order.ticket_count || order.tickets?.length || 0} vé
                      </p>
                    </div>

                    <div className="bg-slate-50/80 border border-slate-200/80 rounded-xl p-3 text-center">
                      <p className="over">Cổng thanh toán</p>
                      <p className="text-xs font-bold text-slate-800 uppercase mt-1 truncate">
                        {order.payment_transactions?.[0]?.payment_method ||
                          "Tixora Pay"}
                      </p>
                    </div>

                    <div className="bg-slate-50/80 border border-slate-200/80 rounded-xl p-3 text-center">
                      <p className="over">Trạng thái đơn</p>
                      <div className="mt-1 flex justify-center">
                        <StatusBadge
                          status={order.status}
                          variant="order"
                          size="xs"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Customer & Event Details */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Customer Info */}
                    <div className="card p-4 space-y-2.5">
                      <div className="flex items-center gap-2 text-xs font-bold text-slate-700 uppercase tracking-wider">
                        <User className="w-4 h-4 text-[#0052ff]" />
                        Thông tin khách hàng
                      </div>
                      <div className="space-y-1.5 text-xs">
                        <div>
                          <span className="text-slate-400">Họ và tên:</span>
                          <p className="font-semibold text-slate-900">
                            {order.user_name || "Khách hàng ẩn danh"}
                          </p>
                        </div>
                        <div>
                          <span className="text-slate-400">Email liên hệ:</span>
                          <p className="font-mono text-slate-700 break-all">
                            {order.user_email || "N/A"}
                          </p>
                        </div>
                        <div className="pt-1">
                          <span className="text-slate-400 block text-[10px]">
                            Mã đơn hàng:
                          </span>
                          <CopyPill text={order.id} />
                        </div>
                      </div>
                    </div>

                    {/* Concert Info */}
                    <div className="card p-4 space-y-2.5">
                      <div className="flex items-center gap-2 text-xs font-bold text-slate-700 uppercase tracking-wider">
                        <Calendar className="w-4 h-4 text-[#0052ff]" />
                        Sự kiện & Buổi diễn
                      </div>
                      <div className="space-y-1.5 text-xs">
                        <div>
                          <span className="text-slate-400">Tên sự kiện:</span>
                          <p className="font-bold text-slate-900">
                            {order.concert_name || "Sự kiện âm nhạc"}
                          </p>
                        </div>
                        {order.expires_at && (
                          <div className="flex items-center gap-1 text-slate-600">
                            <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            <span>
                              Hạn xử lý:{" "}
                              {new Date(order.expires_at).toLocaleString(
                                "vi-VN",
                                {
                                  dateStyle: "short",
                                  timeStyle: "short",
                                },
                              )}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Tickets Breakdown & QR Codes */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 font-sans text-xs font-bold uppercase tracking-wider text-slate-900">
                        <Ticket className="w-4 h-4 text-[#0052ff]" />
                        Danh sách vé ({order.tickets?.length || 0} vé)
                      </div>
                    </div>

                    {order.tickets && order.tickets.length > 0 ? (
                      <div className="space-y-2.5">
                        {order.tickets.map((t, idx) => (
                          <div
                            key={t.id}
                            className="card p-3 flex flex-col sm:flex-row items-center justify-between gap-3 bg-white"
                          >
                            <div className="flex items-center gap-3 w-full sm:w-auto">
                              <DrawerQrCode hash={t.qr_code_hash} />
                              <div className="space-y-1 text-xs">
                                <div className="flex items-center gap-2">
                                  <span className="font-bold text-slate-900">
                                    Vé #{idx + 1}:{" "}
                                    {t.category_name || "Hạng vé tiêu chuẩn"}
                                  </span>
                                  <span
                                    className={`px-1.5 py-0.5 text-[10px] font-semibold rounded ${
                                      t.is_scanned
                                        ? "bg-slate-100 text-slate-600 border border-slate-200"
                                        : "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                    }`}
                                  >
                                    {t.is_scanned
                                      ? "Đã soát vé"
                                      : "Chưa soát vé"}
                                  </span>
                                </div>
                                {t.gate_number !== null &&
                                  t.gate_number !== undefined && (
                                    <p className="text-slate-600">
                                      Cửa soát:{" "}
                                      <strong className="text-slate-900 font-mono">
                                        Cửa {t.gate_number}
                                      </strong>
                                    </p>
                                  )}
                                {t.is_scanned && t.scanned_at && (
                                  <p className="text-[11px] text-slate-500">
                                    Soát lúc:{" "}
                                    {new Date(t.scanned_at).toLocaleString(
                                      "vi-VN",
                                    )}
                                  </p>
                                )}
                                <div className="pt-0.5">
                                  <CopyPill
                                    text={t.qr_code_hash}
                                    label="Mã hash soát vé"
                                  />
                                </div>
                              </div>
                            </div>

                            <div className="self-end sm:self-center text-right text-[11px] text-slate-400">
                              <span>
                                Mã vé: #{t.id.slice(0, 8).toUpperCase()}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="card p-6 text-center text-xs text-slate-400">
                        Chưa có thông tin danh sách vé chi tiết cho đơn hàng
                        này.
                      </div>
                    )}
                  </div>

                  {/* Payment Transactions History */}
                  <div className="space-y-3 pt-2">
                    <div className="flex items-center gap-2 font-sans text-xs font-bold uppercase tracking-wider text-slate-900">
                      <CreditCard className="w-4 h-4 text-[#0052ff]" />
                      Lịch sử giao dịch thanh toán (
                      {order.payment_transactions?.length || 0})
                    </div>

                    {order.payment_transactions &&
                    order.payment_transactions.length > 0 ? (
                      <div className="space-y-2">
                        {order.payment_transactions.map((tx) => (
                          <div
                            key={tx.id}
                            className="border border-slate-200 rounded-xl p-3 bg-white text-xs space-y-2 shadow-2xs"
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-slate-900 uppercase">
                                  {tx.payment_method || "VNPAY"}
                                </span>
                                <span className="font-mono text-[11px] text-slate-500">
                                  #
                                  {tx.transaction_id_3rd_party ||
                                    tx.id.slice(0, 8)}
                                </span>
                              </div>
                              <span
                                className={`px-2 py-0.5 rounded text-[11px] font-semibold ${
                                  tx.status === "SUCCESS"
                                    ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                    : tx.status === "PENDING"
                                      ? "bg-amber-50 text-amber-700 border border-amber-200"
                                      : tx.status === "REFUNDED"
                                        ? "bg-blue-50 text-[#0052ff] border border-blue-200"
                                        : "bg-rose-50 text-rose-700 border border-rose-200"
                                }`}
                              >
                                {tx.status || "UNKNOWN"}
                              </span>
                            </div>

                            <div className="flex items-center justify-between text-slate-500 text-[11px]">
                              <span>
                                Số tiền:{" "}
                                <strong className="font-mono text-slate-900">
                                  {formatConcertCurrency(Number(tx.amount))}
                                </strong>
                              </span>
                              <span>
                                {new Date(tx.created_at).toLocaleString(
                                  "vi-VN",
                                  {
                                    dateStyle: "short",
                                    timeStyle: "short",
                                  },
                                )}
                              </span>
                            </div>

                            {tx.raw_response && (
                              <div>
                                <button
                                  type="button"
                                  onClick={() => toggleJson(tx.id)}
                                  className="text-[11px] text-[#0052ff] hover:underline flex items-center gap-1 font-medium cursor-pointer"
                                >
                                  {openJsonTx[tx.id] ? (
                                    <>
                                      <ChevronUp className="w-3 h-3" /> Thu gọn
                                      dữ liệu cổng
                                    </>
                                  ) : (
                                    <>
                                      <ChevronDown className="w-3 h-3" /> Xem
                                      log phản hồi cổng
                                    </>
                                  )}
                                </button>
                                {openJsonTx[tx.id] && (
                                  <pre className="mt-2 p-2 bg-slate-900 text-slate-200 rounded-lg text-[10px] font-mono overflow-x-auto max-h-40">
                                    {JSON.stringify(tx.raw_response, null, 2)}
                                  </pre>
                                )}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="card p-4 text-center text-xs text-slate-400">
                        Chưa có bản ghi giao dịch nào cho đơn hàng này.
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-slate-200 bg-slate-50/70 flex justify-between items-center">
              <span className="text-xs text-slate-500 font-sans">
                Tixora Operations Management
              </span>
              <button
                type="button"
                onClick={onClose}
                className="btn btn-secondary btn-sm"
              >
                Đóng
              </button>
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
