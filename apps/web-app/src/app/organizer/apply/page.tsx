"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import {
  organizerService,
  OrganizerProfileResponse,
} from "@/services/organizer.service";
import {
  Building2,
  CheckCircle,
  Clock,
  XCircle,
  CreditCard,
  FileText,
  RotateCw,
  ArrowRight,
  HelpCircle,
} from "lucide-react";

export default function OrganizerApplyPage() {
  const { user, isAuthenticated, isLoading: isAuthLoading } = useAuth();
  const router = useRouter();

  const isOrganizer =
    user?.roles?.some((role) => role.toLowerCase() === "organizer") || false;

  const [existingProfile, setExistingProfile] =
    useState<OrganizerProfileResponse | null>(null);

  // Form states
  const [orgName, setOrgName] = useState("");
  const [taxCode, setTaxCode] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [portfolioUrl, setPortfolioUrl] = useState("");
  const [bankName, setBankName] = useState("");
  const [bankNumber, setBankNumber] = useState("");
  const [bankHolder, setBankHolder] = useState("");
  const [licenseUrl, setLicenseUrl] = useState("");

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Auto redirect if user is already an approved Organizer
  useEffect(() => {
    if (!isAuthLoading && isAuthenticated && isOrganizer) {
      router.replace("/organizer/dashboard");
    }
  }, [isAuthLoading, isAuthenticated, isOrganizer, router]);

  useEffect(() => {
    if (!isAuthenticated) return;
    let active = true;

    organizerService
      .getMyApplication()
      .then((profile) => {
        if (!active || !profile) return;
        setExistingProfile(profile);
        setOrgName(profile.organization_name || "");
        setTaxCode(profile.tax_code_or_id || "");
        setPhoneNumber(profile.phone_number || "");
        setPortfolioUrl(profile.portfolio_url || "");
        setBankName(profile.bank_name || "");
        setBankNumber(profile.bank_account_number || "");
        setBankHolder(profile.bank_account_name || "");
        setLicenseUrl(profile.business_license_url || "");

        // If approved profile, route directly to organizer dashboard
        if (profile.status === "APPROVED") {
          router.replace("/organizer/dashboard");
        }
      })
      .catch((err) => {
        console.error("Failed to load organizer application", err);
      });

    return () => {
      active = false;
    };
  }, [isAuthenticated, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAuthenticated) {
      router.push("/login?returnUrl=/organizer/apply");
      return;
    }

    if (!orgName.trim() || !taxCode.trim() || !phoneNumber.trim()) {
      setErrorMessage(
        "Vui lòng điền đầy đủ Tên tổ chức, Mã số thuế/CCCD và Số điện thoại hotline.",
      );
      return;
    }

    try {
      setIsSubmitting(true);
      setErrorMessage(null);
      setSuccessMessage(null);

      const res = await organizerService.apply({
        organization_name: orgName.trim(),
        tax_code_or_id: taxCode.trim(),
        phone_number: phoneNumber.trim(),
        portfolio_url: portfolioUrl.trim() || undefined,
        bank_name: bankName.trim() || undefined,
        bank_account_number: bankNumber.trim() || undefined,
        bank_account_name: bankHolder.trim() || undefined,
        business_license_url: licenseUrl.trim() || undefined,
      });

      setExistingProfile(res);
      setSuccessMessage(
        "Hồ sơ đã được gửi thành công! Ban Quản Trị Tixora sẽ xét duyệt và phản hồi trong thời gian sớm nhất.",
      );
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (err: unknown) {
      const msg =
        err instanceof Error
          ? err.message
          : "Gửi hồ sơ thất bại. Vui lòng thử lại.";
      setErrorMessage(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isAuthLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-slate-400">
        <div className="animate-spin w-8 h-8 border-2 border-teal-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  if (isAuthenticated && isOrganizer) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4">
        <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-3xl p-8 text-center space-y-4 shadow-2xl">
          <div className="w-14 h-14 rounded-2xl bg-teal-500/10 border border-teal-500/20 text-teal-400 flex items-center justify-center mx-auto">
            <CheckCircle className="w-7 h-7" />
          </div>
          <h2 className="text-xl font-bold text-white">
            Bạn đã là Ban Tổ Chức chính thức
          </h2>
          <p className="text-sm text-slate-400">
            Đang chuyển hướng đến Kênh Quản lý Sự kiện (Organizer Hub)...
          </p>
          <div className="pt-2">
            <Link
              href="/organizer/dashboard"
              className="w-full py-3 rounded-xl bg-primary hover:bg-primary-hover text-white text-sm font-bold shadow-lg shadow-primary/25 inline-flex items-center justify-center gap-2"
            >
              Vào Kênh Ban Tổ Chức ngay
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-on-surface py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto space-y-12">
        {/* Hero Banner */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-teal-900/40 via-slate-900 to-slate-900 border border-teal-500/20 p-8 sm:p-12 text-center space-y-4 shadow-2xl">
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-white font-display">
            Hợp Tác Tổ Chức & Phân Phối Vé Cùng{" "}
            <span className="text-primary">Tixora</span>
          </h1>
          <p className="text-base sm:text-lg text-slate-300 max-w-2xl mx-auto font-body">
            Nền tảng công nghệ bán vé tốc độ cao, hỗ trợ sơ đồ ghế trực quan,
            bảo vệ chống bán lố vé và đối soát doanh thu minh bạch.
          </p>
        </div>

        {/* Khách vãng lai (Chưa đăng nhập): Chỉ hiển thị banner mời hợp tác & 3 bước quy trình (KHÔNG hiển thị form) */}
        {!isAuthenticated && (
          <div className="space-y-8">
            <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-slate-900 via-slate-900 to-teal-950/40 border border-teal-500/30 flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-xl">
              <div className="space-y-1.5">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-500/15 border border-teal-500/30 text-teal-300 text-xs font-semibold">
                  Dành cho Đối Tác & Khán Giả
                </div>
                <h3 className="font-bold text-white text-lg sm:text-xl">
                  Bạn muốn trở thành Ban Tổ Chức trên Tixora?
                </h3>
                <p className="text-xs sm:text-sm text-slate-300 max-w-xl leading-relaxed">
                  Vui lòng đăng nhập tài khoản Tixora của bạn để bắt đầu gửi hồ
                  sơ xét duyệt. Nếu bạn là đối tác mới, hãy tạo tài khoản miễn
                  phí chỉ trong 1 phút!
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-3 shrink-0">
                <Link
                  href="/login?returnUrl=/organizer/apply"
                  className="px-5 py-2.5 rounded-xl bg-primary hover:bg-primary-hover text-white text-xs sm:text-sm font-bold shadow-lg shadow-primary/25 transition-transform active:scale-95 inline-flex items-center gap-1.5"
                >
                  Đăng nhập ngay
                  <ArrowRight className="w-4 h-4" />
                </Link>
                <Link
                  href="/register?returnUrl=/organizer/apply"
                  className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs sm:text-sm font-bold border border-slate-700 transition-colors"
                >
                  Tạo tài khoản mới
                </Link>
              </div>
            </div>

            {/* 3 Bước Hợp Tác Dành Cho Đối Tác */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800/80 space-y-3">
                <div className="w-10 h-10 rounded-xl bg-teal-500/10 border border-teal-500/20 flex items-center justify-center text-teal-400 font-black text-sm">
                  01
                </div>
                <h4 className="font-bold text-base text-white">
                  Đăng Ký Tài Khoản
                </h4>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Tạo tài khoản cá nhân hoặc doanh nghiệp trên Tixora để thiết
                  lập danh tính đại diện đối tác.
                </p>
              </div>

              <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800/80 space-y-3">
                <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary font-black text-sm">
                  02
                </div>
                <h4 className="font-bold text-base text-white">
                  Nộp Hồ Sơ Pháp Nhân
                </h4>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Cung cấp mã số thuế, CCCD, thông tin tài khoản ngân hàng nhận
                  tiền quyết toán và giấy phép kinh doanh.
                </p>
              </div>

              <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800/80 space-y-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 font-black text-sm">
                  03
                </div>
                <h4 className="font-bold text-base text-white">
                  Phê Duyệt & Mở Bán
                </h4>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Ban Quản Trị xét duyệt hồ sơ, cấp quyền Organizer Hub để bạn
                  bắt đầu tạo concert và phát hành vé.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Khán giả đã đăng nhập: Hiển thị trạng thái hồ sơ & Form nộp hồ sơ */}
        {isAuthenticated && (
          <div className="space-y-8">
            {existingProfile && (
              <div>
                {existingProfile.status === "PENDING" && (
                  <div className="p-6 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-start gap-3">
                      <Clock className="w-6 h-6 text-amber-400 shrink-0 mt-0.5" />
                      <div>
                        <h3 className="font-bold text-base text-amber-300">
                          Hồ sơ của bạn đang được Ban Quản Trị xem xét
                        </h3>
                        <p className="text-xs text-amber-200/80 mt-1">
                          Chúng tôi đã nhận được hồ sơ của đơn vị{" "}
                          <strong>{existingProfile.organization_name}</strong>{" "}
                          nộp ngày{" "}
                          {new Date(
                            existingProfile.created_at,
                          ).toLocaleDateString("vi-VN")}
                          . Bạn có thể cập nhật lại thông tin bên dưới nếu có
                          thay đổi.
                        </p>
                      </div>
                    </div>
                    <span className="px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 text-xs font-semibold self-start sm:self-center">
                      Đang xử lý
                    </span>
                  </div>
                )}

                {existingProfile.status === "APPROVED" && (
                  <div className="p-6 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-start gap-3">
                      <CheckCircle className="w-6 h-6 text-emerald-400 shrink-0 mt-0.5" />
                      <div>
                        <h3 className="font-bold text-base text-emerald-300">
                          Chúc mừng! Bạn đã là Ban Tổ Chức chính thức trên
                          Tixora
                        </h3>
                        <p className="text-xs text-emerald-200/80 mt-1">
                          Hồ sơ của đơn vị{" "}
                          <strong>{existingProfile.organization_name}</strong>{" "}
                          đã được phê duyệt. Bạn có toàn quyền tạo sự kiện và
                          quản lý vé.
                        </p>
                      </div>
                    </div>
                    <Link
                      href="/organizer/dashboard"
                      className="px-5 py-2.5 rounded-xl bg-primary hover:bg-primary-hover text-white text-xs font-bold shadow-lg shadow-primary/20 inline-flex items-center gap-2 self-start sm:self-center transition-transform active:scale-95"
                    >
                      Vào Kênh Ban Tổ Chức
                      <ArrowRight className="w-4 h-4" />
                    </Link>
                  </div>
                )}

                {existingProfile.status === "REJECTED" && (
                  <div className="p-6 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                    <div className="flex items-start gap-3">
                      <XCircle className="w-6 h-6 text-rose-400 shrink-0 mt-0.5" />
                      <div>
                        <h3 className="font-bold text-base text-rose-300">
                          Hồ sơ của bạn chưa được duyệt
                        </h3>
                        <p className="text-xs text-rose-200/90 mt-1">
                          Lý do:{" "}
                          <strong>
                            {existingProfile.rejection_reason ||
                              "Thông tin chưa đầy đủ hoặc không hợp lệ"}
                          </strong>
                          .
                        </p>
                        <p className="text-xs text-slate-400 mt-2">
                          Vui lòng cập nhật và hoàn thiện lại các thông tin bên
                          dưới để gửi yêu cầu xét duyệt lại.
                        </p>
                      </div>
                    </div>
                    <span className="px-3 py-1 rounded-full bg-rose-500/20 text-rose-300 text-xs font-semibold shrink-0">
                      Cần bổ sung
                    </span>
                  </div>
                )}
              </div>
            )}

            {/* Form Registration */}
            <div className="bg-slate-900/80 rounded-3xl border border-slate-800 p-6 sm:p-10 shadow-xl space-y-8">
              <div>
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                  <FileText className="w-5 h-5 text-teal-400" />
                  Thông Tin Đăng Ký Đối Tác
                </h2>
                <p className="text-xs text-slate-400 mt-1">
                  Điền các thông tin đại diện pháp nhân để đội ngũ kiểm duyệt
                  xác minh danh tính và thiết lập tài khoản thanh toán.
                </p>
              </div>

              {successMessage && (
                <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-sm flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 shrink-0" />
                  <span>{successMessage}</span>
                </div>
              )}

              {errorMessage && (
                <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-sm flex items-center gap-2">
                  <XCircle className="w-5 h-5 shrink-0" />
                  <span>{errorMessage}</span>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-8">
                {/* Section 1: Entity Info */}
                <div className="space-y-4">
                  <h3 className="text-sm font-semibold text-teal-400 uppercase tracking-wider flex items-center gap-1.5">
                    <Building2 className="w-4 h-4" /> 1. Thông Tin Ban Tổ Chức /
                    Doanh Nghiệp
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                        Tên đơn vị / Tên công ty / Nghệ danh{" "}
                        <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="Ví dụ: Công ty TNHH Sự Kiện Sài Gòn"
                        value={orgName}
                        onChange={(e) => setOrgName(e.target.value)}
                        className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-teal-500 transition-colors"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                        Mã số thuế / Số CCCD người đại diện{" "}
                        <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="Ví dụ: 0314889922 hoặc 079098001234"
                        value={taxCode}
                        onChange={(e) => setTaxCode(e.target.value)}
                        className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-teal-500 transition-colors"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                        Số điện thoại hotline hỗ trợ sự kiện{" "}
                        <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="tel"
                        required
                        placeholder="Ví dụ: 0987654321"
                        value={phoneNumber}
                        onChange={(e) => setPhoneNumber(e.target.value)}
                        className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-teal-500 transition-colors"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                        Link Fanpage / Website / Portfolio
                      </label>
                      <input
                        type="url"
                        placeholder="https://facebook.com/your-fanpage"
                        value={portfolioUrl}
                        onChange={(e) => setPortfolioUrl(e.target.value)}
                        className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-teal-500 transition-colors"
                      />
                    </div>
                  </div>
                </div>

                {/* Section 2: Bank Account Info */}
                <div className="space-y-4 pt-4 border-t border-slate-800">
                  <h3 className="text-sm font-semibold text-teal-400 uppercase tracking-wider flex items-center gap-1.5">
                    <CreditCard className="w-4 h-4" /> 2. Tài Khoản Ngân Hàng
                    Nhận Quyết Toán Doanh Thu
                  </h3>
                  <p className="text-xs text-slate-400">
                    Doanh thu bán vé sẽ được chuyển về tài khoản này sau khi
                    hoàn tất đối soát sự kiện.
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                        Tên ngân hàng
                      </label>
                      <input
                        type="text"
                        placeholder="Ví dụ: Vietcombank, Techcombank..."
                        value={bankName}
                        onChange={(e) => setBankName(e.target.value)}
                        className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-teal-500 transition-colors"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                        Số tài khoản
                      </label>
                      <input
                        type="text"
                        placeholder="Ví dụ: 190345678910"
                        value={bankNumber}
                        onChange={(e) => setBankNumber(e.target.value)}
                        className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-teal-500 transition-colors"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                        Tên chủ tài khoản (Viết in hoa)
                      </label>
                      <input
                        type="text"
                        placeholder="Ví dụ: CONG TY TNHH SU KIEN SAI GON"
                        value={bankHolder}
                        onChange={(e) => setBankHolder(e.target.value)}
                        className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white placeholder:text-slate-600 uppercase focus:outline-none focus:border-teal-500 transition-colors"
                      />
                    </div>
                  </div>
                </div>

                {/* Section 3: Business License Link */}
                <div className="space-y-4 pt-4 border-t border-slate-800">
                  <h3 className="text-sm font-semibold text-teal-400 uppercase tracking-wider flex items-center gap-1.5">
                    <FileText className="w-4 h-4" /> 3. Hồ Sơ Pháp Lý Đính Kèm
                  </h3>
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                      Link xem Giấy phép kinh doanh / Giấy phép biểu diễn
                      (Google Drive / Dropbox / PDF)
                    </label>
                    <input
                      type="url"
                      placeholder="https://drive.google.com/file/d/your-license-pdf"
                      value={licenseUrl}
                      onChange={(e) => setLicenseUrl(e.target.value)}
                      className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-teal-500 transition-colors"
                    />
                    <p className="text-[11px] text-slate-500 mt-1 flex items-center gap-1">
                      <HelpCircle className="w-3.5 h-3.5" />
                      Đảm bảo link tài liệu ở chế độ xem công khai để ban quản
                      trị có thể kiểm tra.
                    </p>
                  </div>
                </div>

                {/* Submit Button */}
                <div className="pt-4 flex justify-end">
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-8 py-3.5 rounded-xl bg-primary hover:bg-primary-hover text-white text-sm font-bold shadow-lg shadow-primary/25 cursor-pointer transition-all duration-200 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center gap-2"
                  >
                    {isSubmitting ? (
                      <>
                        <RotateCw className="w-4 h-4 animate-spin" />
                        Đang gửi hồ sơ...
                      </>
                    ) : (
                      <>
                        {existingProfile?.status === "PENDING"
                          ? "Cập nhật hồ sơ đăng ký"
                          : existingProfile?.status === "REJECTED"
                            ? "Gửi lại hồ sơ xét duyệt"
                            : "Gửi Hồ Sơ Đăng Ký"}
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
