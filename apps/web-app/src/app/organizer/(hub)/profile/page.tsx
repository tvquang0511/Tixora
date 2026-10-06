"use client";

import { useEffect, useState, useCallback } from "react";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/context/ToastContext";
import {
  organizerService,
  OrganizerProfileResponse,
} from "@/services/organizer.service";
import { uploadImage } from "@/services/upload.service";
import {
  Building2,
  Mail,
  Phone,
  FileText,
  Globe,
  CreditCard,
  CheckCircle2,
  AlertTriangle,
  UploadCloud,
  ExternalLink,
  Lock,
  Save,
  RotateCcw,
  Loader2,
  ShieldCheck,
  User,
} from "lucide-react";

export default function OrganizerProfilePage() {
  const { user } = useAuth();
  const { success: showSuccessToast, error: showErrorToast } = useToast();

  const [profile, setProfile] = useState<OrganizerProfileResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploadingLicense, setIsUploadingLicense] = useState(false);

  // Form states
  const [organizationName, setOrganizationName] = useState("");
  const [fullName, setFullName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [portfolioUrl, setPortfolioUrl] = useState("");
  const [bankName, setBankName] = useState("");
  const [bankAccountNumber, setBankAccountNumber] = useState("");
  const [bankAccountName, setBankAccountName] = useState("");
  const [licenseUrl, setLicenseUrl] = useState("");

  const populateForm = useCallback(
    (data: OrganizerProfileResponse) => {
      setProfile(data);
      setOrganizationName(data.organization_name || "");
      setFullName(data.user?.full_name || user?.fullName || "");
      setPhoneNumber(data.phone_number || "");
      setPortfolioUrl(data.portfolio_url || "");
      setBankName(data.bank_name || "");
      setBankAccountNumber(data.bank_account_number || "");
      setBankAccountName(data.bank_account_name || "");
      setLicenseUrl(data.business_license_url || "");
    },
    [user?.fullName],
  );

  useEffect(() => {
    let active = true;

    const fetchProfile = async () => {
      try {
        const data = await organizerService.getMyApplication();
        if (active && data) {
          populateForm(data);
        }
      } catch (err: unknown) {
        console.error("Failed to load organizer profile", err);
        if (active) {
          showErrorToast("Không thể tải thông tin hồ sơ Ban Tổ Chức.");
        }
      } finally {
        if (active) {
          setIsLoading(false);
        }
      }
    };

    void fetchProfile();

    return () => {
      active = false;
    };
  }, [populateForm, showErrorToast]);

  const handleLicenseFileUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsUploadingLicense(true);
      const res = await uploadImage(file);
      setLicenseUrl(res.url);
      showSuccessToast("Tải ảnh giấy phép kinh doanh lên thành công!");
    } catch (err: unknown) {
      console.error("Upload license failed", err);
      showErrorToast(
        err instanceof Error ? err.message : "Tải ảnh giấy phép lên thất bại",
      );
    } finally {
      setIsUploadingLicense(false);
    }
  };

  const handleReset = () => {
    if (profile) {
      populateForm(profile);
      showSuccessToast("Đã khôi phục thông tin ban đầu.");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!organizationName.trim()) {
      showErrorToast("Vui lòng nhập tên đơn vị / tổ chức.");
      return;
    }

    if (!phoneNumber.trim()) {
      showErrorToast("Vui lòng nhập số điện thoại liên hệ.");
      return;
    }

    setIsSubmitting(true);
    try {
      const updated = await organizerService.updateProfile({
        organization_name: organizationName.trim(),
        phone_number: phoneNumber.trim(),
        portfolio_url: portfolioUrl.trim() || undefined,
        bank_name: bankName.trim() || undefined,
        bank_account_number: bankAccountNumber.trim() || undefined,
        bank_account_name: bankAccountName.trim().toUpperCase() || undefined,
        business_license_url: licenseUrl || undefined,
        full_name: fullName.trim() || undefined,
      });

      populateForm(updated);
      showSuccessToast("Cập nhật hồ sơ Ban Tổ Chức thành công!");
    } catch (err: unknown) {
      console.error("Update organizer profile failed", err);
      const errorMsg =
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message ||
        (err as Error)?.message ||
        "Cập nhật hồ sơ thất bại. Vui lòng thử lại.";
      showErrorToast(errorMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatDate = (dateString?: string | null) => {
    if (!dateString) return "-";
    const d = new Date(dateString);
    if (Number.isNaN(d.getTime())) return "-";
    return new Intl.DateTimeFormat("vi-VN", {
      dateStyle: "medium",
    }).format(d);
  };

  if (isLoading) {
    return (
      <div className="min-h-[400px] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3 text-slate-400">
          <Loader2 className="w-8 h-8 animate-spin text-teal-400" />
          <p className="text-sm">Đang tải hồ sơ Ban Tổ Chức...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-16">
      {/* Hero Banner Card */}
      <div className="relative overflow-hidden rounded-3xl border border-teal-500/20 bg-gradient-to-r from-teal-950/60 via-slate-900 to-slate-900 p-6 sm:p-8 shadow-xl">
        <div className="absolute top-0 right-0 h-48 w-48 bg-teal-500/10 blur-[90px] pointer-events-none" />

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 relative z-10">
          <div className="flex items-center gap-5">
            <div className="flex h-18 w-18 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-tr from-teal-500 to-emerald-400 text-3xl font-black text-slate-950 shadow-lg shadow-teal-500/20">
              {organizationName
                ? organizationName.charAt(0).toUpperCase()
                : "O"}
            </div>
            <div className="space-y-1.5">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="font-display text-2xl sm:text-3xl font-black text-white">
                  {organizationName || "Hồ sơ Ban Tổ Chức"}
                </h1>
                <span className="inline-flex items-center gap-1 rounded-full px-3 py-0.5 text-xs font-bold border bg-teal-500/15 border-teal-500/30 text-teal-400">
                  <ShieldCheck size={13} className="text-teal-400" />
                  Đối tác chính thức
                </span>
              </div>
              <p className="flex items-center gap-1.5 text-xs sm:text-sm text-slate-400">
                <Mail size={14} className="text-slate-500" />
                {profile?.user?.email || user?.email}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="rounded-2xl border border-slate-800 bg-slate-900/60 px-4 py-2.5 text-left text-xs">
              <span className="text-slate-500 block">Ngày phê duyệt</span>
              <span className="font-semibold text-slate-200 block mt-0.5">
                {formatDate(profile?.approved_at)}
              </span>
            </div>
            <div className="rounded-2xl border border-slate-800 bg-slate-900/60 px-4 py-2.5 text-left text-xs">
              <span className="text-slate-500 block">Mã định danh thuế</span>
              <span className="font-mono font-semibold text-teal-400 block mt-0.5">
                {profile?.tax_code_or_id || "Chưa cập nhật"}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Profile Form */}
      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Section 1: Thông tin Tổ chức & Đại diện */}
        <div className="rounded-3xl border border-slate-800 bg-[#16222f]/60 p-6 sm:p-8 shadow-md space-y-6">
          <div className="border-b border-slate-800 pb-4">
            <h2 className="font-display text-lg font-bold text-white flex items-center gap-2">
              <Building2 size={18} className="text-teal-400" />
              Thông tin Đơn vị & Người đại diện
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              Thông tin chính thức của đơn vị tổ chức sự kiện được hiển thị trên
              hệ thống Tixora.
            </p>
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-300 block">
                Tên đơn vị / Doanh nghiệp{" "}
                <span className="text-rose-400">*</span>
              </label>
              <input
                type="text"
                value={organizationName}
                onChange={(e) => setOrganizationName(e.target.value)}
                placeholder="Ví dụ: Công ty TNHH Sài Gòn Music"
                className="w-full h-11 px-3.5 rounded-xl border border-slate-800 bg-slate-900/70 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-teal-400 transition-colors"
                required
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-300 flex items-center justify-between">
                <span>Mã số thuế / Số ĐKKD</span>
                <span className="text-[11px] text-slate-500 flex items-center gap-1 font-normal">
                  <Lock size={11} /> Cố định
                </span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={profile?.tax_code_or_id || ""}
                  disabled
                  className="w-full h-11 px-3.5 rounded-xl border border-slate-800 bg-slate-900/30 text-sm text-slate-400 cursor-not-allowed font-mono"
                />
                <span className="absolute right-3 top-3 text-[11px] font-semibold text-teal-400/80 bg-teal-500/10 border border-teal-500/20 px-2 py-0.5 rounded">
                  Đã duyệt
                </span>
              </div>
              <p className="text-[11px] text-slate-500">
                Mã số thuế được cố định theo hồ sơ pháp lý. Để cập nhật, vui
                lòng liên hệ admin.
              </p>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-300 block">
                Người đại diện pháp lý / Phụ trách
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Họ và tên người đại diện"
                  className="w-full h-11 pl-10 pr-3.5 rounded-xl border border-slate-800 bg-slate-900/70 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-teal-400 transition-colors"
                />
                <User
                  size={16}
                  className="absolute left-3.5 top-3 text-slate-500 pointer-events-none"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-300 block">
                Số điện thoại liên hệ <span className="text-rose-400">*</span>
              </label>
              <div className="relative">
                <input
                  type="tel"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  placeholder="Ví dụ: 0912345678"
                  className="w-full h-11 pl-10 pr-3.5 rounded-xl border border-slate-800 bg-slate-900/70 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-teal-400 transition-colors font-mono"
                  required
                />
                <Phone
                  size={16}
                  className="absolute left-3.5 top-3 text-slate-500 pointer-events-none"
                />
              </div>
            </div>

            <div className="space-y-2 sm:col-span-2">
              <label className="text-xs font-semibold text-slate-300 flex items-center justify-between">
                <span>Website / Fanpage / Portfolio</span>
                {portfolioUrl && (
                  <a
                    href={
                      portfolioUrl.startsWith("http")
                        ? portfolioUrl
                        : `https://${portfolioUrl}`
                    }
                    target="_blank"
                    rel="noreferrer"
                    className="text-[11px] text-teal-400 hover:underline inline-flex items-center gap-1"
                  >
                    Xem liên kết <ExternalLink size={11} />
                  </a>
                )}
              </label>
              <div className="relative">
                <input
                  type="url"
                  value={portfolioUrl}
                  onChange={(e) => setPortfolioUrl(e.target.value)}
                  placeholder="https://facebook.com/saigonmusic hoặc https://saigonmusic.vn"
                  className="w-full h-11 pl-10 pr-3.5 rounded-xl border border-slate-800 bg-slate-900/70 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-teal-400 transition-colors"
                />
                <Globe
                  size={16}
                  className="absolute left-3.5 top-3 text-slate-500 pointer-events-none"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Section 2: Tài khoản Nhận tiền Quyết toán (Payout) */}
        <div className="rounded-3xl border border-slate-800 bg-[#16222f]/60 p-6 sm:p-8 shadow-md space-y-6">
          <div className="border-b border-slate-800 pb-4">
            <h2 className="font-display text-lg font-bold text-white flex items-center gap-2">
              <CreditCard size={18} className="text-teal-400" />
              Tài khoản Nhận tiền & Quyết toán (Payout)
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              Thông tin tài khoản ngân hàng chính thức dùng để nhận giải ngân
              doanh thu bán vé sau sự kiện.
            </p>
          </div>

          <div className="grid gap-5 sm:grid-cols-3">
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-300 block">
                Ngân hàng thụ hưởng
              </label>
              <input
                type="text"
                value={bankName}
                onChange={(e) => setBankName(e.target.value)}
                placeholder="Ví dụ: Techcombank, Vietcombank..."
                className="w-full h-11 px-3.5 rounded-xl border border-slate-800 bg-slate-900/70 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-teal-400 transition-colors"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-300 block">
                Số tài khoản ngân hàng
              </label>
              <input
                type="text"
                value={bankAccountNumber}
                onChange={(e) => setBankAccountNumber(e.target.value)}
                placeholder="Ví dụ: 190367890123"
                className="w-full h-11 px-3.5 rounded-xl border border-slate-800 bg-slate-900/70 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-teal-400 transition-colors font-mono"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-300 block">
                Tên chủ tài khoản
              </label>
              <input
                type="text"
                value={bankAccountName}
                onChange={(e) =>
                  setBankAccountName(e.target.value.toUpperCase())
                }
                placeholder="NGUYEN VAN A"
                className="w-full h-11 px-3.5 rounded-xl border border-slate-800 bg-slate-900/70 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-teal-400 transition-colors uppercase font-mono"
              />
            </div>
          </div>

          <div className="rounded-2xl border border-amber-500/20 bg-amber-500/5 p-4 flex items-start gap-3">
            <AlertTriangle
              size={18}
              className="text-amber-400 shrink-0 mt-0.5"
            />
            <div className="text-xs text-slate-300 leading-relaxed">
              <strong className="text-amber-300">Lưu ý quyết toán:</strong> Đảm
              bảo tên chủ tài khoản và số tài khoản chính xác để tránh gián đoạn
              các đợt đối soát và thanh quyết toán sau khi sự kiện kết thúc.
            </div>
          </div>
        </div>

        {/* Section 3: Giấy phép kinh doanh */}
        <div className="rounded-3xl border border-slate-800 bg-[#16222f]/60 p-6 sm:p-8 shadow-md space-y-6">
          <div className="border-b border-slate-800 pb-4">
            <h2 className="font-display text-lg font-bold text-white flex items-center gap-2">
              <FileText size={18} className="text-teal-400" />
              Giấy phép Kinh doanh & Pháp nhân
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              Bản quét hoặc hình ảnh giấy phép đăng ký kinh doanh hợp lệ.
            </p>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 items-center">
            <div className="space-y-3">
              <label className="text-xs font-semibold text-slate-300 block">
                Tải lên tệp giấy phép mới
              </label>
              <label className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-slate-800 hover:border-teal-500/40 rounded-2xl bg-slate-900/40 cursor-pointer transition-colors group">
                <UploadCloud
                  size={32}
                  className="text-slate-500 group-hover:text-teal-400 transition-colors mb-2"
                />
                <span className="text-xs font-semibold text-slate-300 group-hover:text-white">
                  {isUploadingLicense
                    ? "Đang tải tệp lên..."
                    : "Chọn ảnh hoặc tài liệu mới"}
                </span>
                <span className="text-[11px] text-slate-500 mt-1">
                  Định dạng PNG, JPG, PDF (tối đa 10MB)
                </span>
                <input
                  type="file"
                  accept="image/*,application/pdf"
                  onChange={handleLicenseFileUpload}
                  disabled={isUploadingLicense}
                  className="hidden"
                />
              </label>
            </div>

            <div className="space-y-3">
              <span className="text-xs font-semibold text-slate-300 block">
                Tệp giấy phép hiện tại
              </span>
              {licenseUrl ? (
                <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-teal-400 flex items-center gap-1.5">
                      <CheckCircle2 size={15} /> Đã đính kèm giấy phép
                    </span>
                    <a
                      href={licenseUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="text-xs font-bold text-white hover:text-teal-400 flex items-center gap-1 bg-slate-800 hover:bg-slate-700 px-3 py-1.5 rounded-lg transition-colors"
                    >
                      Xem tệp <ExternalLink size={12} />
                    </a>
                  </div>
                  <div className="h-32 w-full rounded-xl overflow-hidden border border-slate-800 bg-slate-950 flex items-center justify-center">
                    {licenseUrl.match(/\.(jpeg|jpg|png|gif|webp)$/i) ? (
                      /* eslint-disable-next-line @next/next/no-img-element */
                      <img
                        src={licenseUrl}
                        alt="Giấy phép kinh doanh"
                        className="h-full w-full object-contain"
                      />
                    ) : (
                      <div className="text-xs text-slate-400 flex flex-col items-center gap-1">
                        <FileText size={24} className="text-slate-500" />
                        <span>Tài liệu giấy phép (PDF/Doc)</span>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="rounded-2xl border border-slate-800 bg-slate-900/30 p-6 text-center text-xs text-slate-500">
                  Chưa có giấy phép nào được đính kèm.
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Form Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={handleReset}
            disabled={isSubmitting}
            className="w-full sm:w-auto px-6 py-3 rounded-xl border border-slate-800 hover:bg-slate-800 text-slate-300 text-sm font-semibold transition-colors flex items-center justify-center gap-2"
          >
            <RotateCcw size={16} />
            Hủy thay đổi
          </button>
          <button
            type="submit"
            disabled={isSubmitting || isUploadingLicense}
            className="w-full sm:w-auto px-8 py-3 rounded-xl bg-teal-500 hover:bg-teal-400 disabled:opacity-50 text-slate-950 text-sm font-bold shadow-lg shadow-teal-500/25 transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            {isSubmitting ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                Đang lưu...
              </>
            ) : (
              <>
                <Save size={16} />
                Lưu thay đổi hồ sơ
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
