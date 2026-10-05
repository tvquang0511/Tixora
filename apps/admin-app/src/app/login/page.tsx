"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { authService } from "@/services/auth.service";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/context/ToastContext";
import { BrandMark } from "@/components/BrandMark";
import { LogIn, Lock, Mail, Loader2 } from "lucide-react";
import { getErrorMessage } from "@/utils/error.utils";

function AdminLoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const returnUrl = searchParams?.get("returnUrl") || "/dashboard";
  const { login, logout } = useAuth();
  const { success: showSuccessToast, error: showErrorToast } = useToast();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await authService.login(email, password);
      const user = response.user;

      const userRoles = user.roles || [];
      const isAdminOrSuperAdmin =
        userRoles.includes("SuperAdmin") || userRoles.includes("Admin");

      if (!isAdminOrSuperAdmin) {
        await logout();
        if (userRoles.includes("Checker")) {
          showErrorToast(
            "Truy cập bị từ chối: Tài khoản Soát vé (Checker) chỉ được sử dụng trên ứng dụng di động Mobile App.",
          );
        } else if (userRoles.includes("Organizer")) {
          showErrorToast(
            "Truy cập bị từ chối: Tài khoản Ban tổ chức (Organizer) chỉ sử dụng Cổng Quản lý sự kiện trên Web Tixora, không được truy cập Cổng Quản trị sàn.",
          );
        } else {
          showErrorToast(
            "Truy cập bị từ chối: Tài khoản không có quyền Quản trị viên sàn (Admin/SuperAdmin).",
          );
        }
        setLoading(false);
        return;
      }

      login(user);
      showSuccessToast("Đăng nhập quyền Quản trị viên thành công!");
      router.replace(returnUrl);
    } catch (err: unknown) {
      showErrorToast(
        getErrorMessage(err) ||
          "Đăng nhập thất bại. Vui lòng kiểm tra lại thông tin.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-[#0a3a78] relative overflow-hidden">
      {/* Subtle background glow */}
      <div className="absolute -top-40 -right-40 w-96 h-96 bg-[#0052ff]/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-[#0e54a3]/40 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md card p-8 shadow-2xl relative z-10 border border-slate-200">
        <div className="flex flex-col items-center mb-8 text-center">
          <BrandMark showIcon={false} size="large" />
          <p className="text-xs text-slate-500 mt-2 font-medium">
            Cổng Quản trị Vận hành & Phát hành Vé
          </p>
        </div>

        <form onSubmit={onSubmit} className="space-y-4 font-sans">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Email Quản trị viên
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@tixora.local"
                className="w-full bg-white border border-slate-200 rounded-lg pl-10 pr-4 py-2.5 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-[#0052ff] focus:ring-2 focus:ring-[#0052ff]/20 transition-colors"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Mật khẩu
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-white border border-slate-200 rounded-lg pl-10 pr-4 py-2.5 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-[#0052ff] focus:ring-2 focus:ring-[#0052ff]/20 transition-colors"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn btn-primary w-full py-2.5 mt-2 flex items-center justify-center gap-2 cursor-pointer text-xs"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Đang xác thực...</span>
              </>
            ) : (
              <>
                <LogIn className="w-4 h-4" />
                <span>Đăng nhập Quản trị</span>
              </>
            )}
          </button>
        </form>

        <div className="mt-8 pt-6 border-t border-slate-100 text-center text-xs text-slate-400">
          Chỉ nhân sự được ủy quyền mới có thể truy cập hệ thống này.
        </div>
      </div>
    </div>
  );
}

export default function AdminLoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-[#0a3a78]">
          <Loader2 className="w-8 h-8 animate-spin text-[#0052ff]" />
        </div>
      }
    >
      <AdminLoginForm />
    </Suspense>
  );
}
