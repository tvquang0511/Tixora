"use client";

import { useState } from "react";
import {
  X,
  Building2,
  Copy,
  Check,
  CreditCard,
  QrCode,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import { type SettlementItem } from "@/services/revenue.service";

interface PayoutModalProps {
  item: SettlementItem | null;
  onClose: () => void;
  onConfirmPayout: (concertId: string, referenceCode: string) => void;
}

const formatVND = (value: number) =>
  new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(
    value,
  );

export function PayoutModal({
  item,
  onClose,
  onConfirmPayout,
}: PayoutModalProps) {
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [refCode, setRefCode] = useState("");
  const [isSuccess, setIsSuccess] = useState(false);

  if (!item) return null;

  const handleCopy = async (field: string, text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(field);
      setTimeout(() => setCopiedField(null), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  const transferContent = `TIXORA ${item.concert_name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9]/g, "")
    .slice(0, 12)
    .toUpperCase()} ${item.concert_id.slice(0, 6).toUpperCase()}`;

  const qrUrl =
    item.organizer.bank_name && item.organizer.bank_account_number
      ? `https://img.vietqr.io/image/${encodeURIComponent(
          item.organizer.bank_name.trim(),
        )}-${encodeURIComponent(
          item.organizer.bank_account_number.trim(),
        )}-compact2.png?amount=${item.net_payout}&addInfo=${encodeURIComponent(
          transferContent,
        )}&accountName=${encodeURIComponent(
          item.organizer.bank_account_name || "",
        )}`
      : null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!refCode.trim()) return;
    setIsSuccess(true);
    setTimeout(() => {
      onConfirmPayout(item.concert_id, refCode);
      onClose();
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-lg w-full overflow-hidden max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-blue-100/70 text-[#0e54a3] rounded-lg">
              <CreditCard className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-base">
                Lệnh quyết toán Ban tổ chức
              </h3>
              <p className="text-xs text-slate-500">
                Đối soát và chuyển khoản tiền vé sau sự kiện
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-200/50 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-5 grow">
          {/* Concert & Organizer Header */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/80 space-y-2">
            <div className="over">Sự kiện thanh toán</div>
            <div className="font-bold text-slate-900 text-base">
              {item.concert_name}
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-600">
              <Building2 className="w-3.5 h-3.5 text-slate-400" />
              <span>{item.organizer.organization_name}</span>
              {item.organizer.phone_number && (
                <span>• SĐT: {item.organizer.phone_number}</span>
              )}
            </div>
          </div>

          {/* Financial Breakdown */}
          <div className="rounded-xl border border-slate-200 p-4 space-y-2.5 bg-white">
            <div className="flex justify-between items-center text-sm text-slate-600">
              <span>Tổng doanh số bán vé (GMV):</span>
              <span className="font-medium text-slate-900 tabular-nums">
                {formatVND(item.gmv)}
              </span>
            </div>
            <div className="flex justify-between items-center text-sm text-slate-600">
              <span className="flex items-center gap-1.5">
                <span>Phí dịch vụ sàn Tixora (5%):</span>
              </span>
              <span className="font-medium text-rose-600 tabular-nums">
                - {formatVND(item.platform_fee)}
              </span>
            </div>
            <div className="pt-2 border-t border-slate-200 flex justify-between items-center">
              <span className="font-bold text-slate-900 text-sm">
                Số tiền thực chuyển (Net Payout):
              </span>
              <span className="font-extrabold text-[#0e54a3] text-lg tabular-nums">
                {formatVND(item.net_payout)}
              </span>
            </div>
          </div>

          {/* Bank Account Info & VietQR */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="over">Thông tin tài khoản nhận tiền</div>
              <span className="text-[11px] text-[#0e54a3] font-medium">
                Đã thẩm định hồ sơ
              </span>
            </div>

            {item.organizer.bank_account_number ? (
              <div className="space-y-2">
                <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">Ngân hàng:</span>
                    <span className="font-bold text-slate-800">
                      {item.organizer.bank_name || "Chưa rõ"}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">Số tài khoản:</span>
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-[#0e54a3] text-sm">
                        {item.organizer.bank_account_number}
                      </span>
                      <button
                        type="button"
                        onClick={() =>
                          handleCopy(
                            "account",
                            item.organizer.bank_account_number || "",
                          )
                        }
                        className="p-1 hover:bg-slate-200 rounded text-slate-500 cursor-pointer"
                        title="Sao chép số tài khoản"
                      >
                        {copiedField === "account" ? (
                          <Check className="w-3.5 h-3.5 text-emerald-600" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">Tên thụ hưởng:</span>
                    <span className="font-semibold text-slate-800 uppercase">
                      {item.organizer.bank_account_name ||
                        item.organizer.contact_name}
                    </span>
                  </div>
                  <div className="flex items-center justify-between pt-1 border-t border-slate-200">
                    <span className="text-slate-500">Nội dung CK:</span>
                    <div className="flex items-center gap-1.5">
                      <span className="font-mono text-slate-700">
                        {transferContent}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleCopy("content", transferContent)}
                        className="p-1 hover:bg-slate-200 rounded text-slate-500 cursor-pointer"
                        title="Sao chép nội dung"
                      >
                        {copiedField === "content" ? (
                          <Check className="w-3.5 h-3.5 text-emerald-600" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </div>
                  </div>
                </div>

                {qrUrl && (
                  <div className="flex flex-col items-center justify-center p-3 bg-blue-50/50 rounded-xl border border-blue-100 text-center">
                    <div className="flex items-center gap-1.5 text-xs font-semibold text-[#0e54a3] mb-2">
                      <QrCode className="w-4 h-4" />
                      <span>Quét mã VietQR chuyển khoản nhanh</span>
                    </div>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={qrUrl}
                      alt="VietQR Payout"
                      className="w-44 h-auto rounded-lg shadow-sm border border-slate-200 bg-white p-1"
                    />
                  </div>
                )}
              </div>
            ) : (
              <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-amber-600" />
                <span>
                  Ban tổ chức này chưa hoàn tất cập nhật tài khoản ngân hàng
                  trong hồ sơ. Vui lòng liên hệ BTC trước khi thực hiện quyết
                  toán.
                </span>
              </div>
            )}

            {/* Confirmation Form */}
            <form onSubmit={handleSubmit} className="space-y-3 pt-2">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Mã tham chiếu ủy nhiệm chi / Giao dịch ngân hàng{" "}
                  <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ví dụ: FT2609887192 hoặc MB991823"
                  value={refCode}
                  onChange={(e) => setRefCode(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-[#0e54a3]"
                />
                <p className="text-[11px] text-slate-400 mt-1">
                  Nhập mã biên lai hoặc mã giao dịch sau khi kế toán đã chuyển
                  khoản thành công.
                </p>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={onClose}
                  className="btn btn-secondary btn-sm"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={!refCode.trim() || isSuccess}
                  className="btn btn-primary btn-sm inline-flex items-center gap-1.5 disabled:opacity-50"
                >
                  {isSuccess ? (
                    <>
                      <CheckCircle2 className="w-4 h-4 text-emerald-300 animate-bounce" />
                      <span>Đã xác nhận giải ngân!</span>
                    </>
                  ) : (
                    <span>Xác nhận đã chuyển khoản</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
