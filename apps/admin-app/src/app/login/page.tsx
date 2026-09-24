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
      if (
        userRoles.includes("Checker") &&
        !userRoles.includes("SuperAdmin") &&
        !userRoles.includes("Admin") &&
        !userRoles.includes("Organizer")
      ) {
        await logout();
        showErrorToast(
          "Truy cập bị từ chối: Tài khoản Soát vé (Checker) chỉ được sử dụng trên ứng dụng di động Mobile App.",
        );
        setLoading(false);
        return;
      }

      if (
        !userRoles.includes("SuperAdmin") &&
        !userRoles.includes("Admin") &&
        !userRoles.includes("Organizer")
      ) {
        await logout();
        showErrorToast(
          "Truy cập bị từ chối: Tài khoản không có quyền Quản trị viên (Admin).",
        );
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
    <div className="min-h-screen flex items-center justify-center p-4 bg-slate-50 relative">
      <div className="w-full max-w-md bg-white border border-slate-200 rounded-2xl p-8 shadow-sm relative z-10">
        <div className="flex flex-col items-center mb-8 text-center">
          <BrandMark showIcon={false} size="large" />
        </div>

        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1.5">
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
                className="w-full bg-white border border-slate-200 rounded-lg pl-10 pr-4 py-2.5 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 transition-colors"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1.5">
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
                className="w-full bg-white border border-slate-200 rounded-lg pl-10 pr-4 py-2.5 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 transition-colors"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-4 bg-teal-600 hover:bg-teal-700 text-white font-medium py-2.5 px-4 rounded-lg shadow-xs flex items-center justify-center gap-2 transition-colors disabled:opacity-50 cursor-pointer text-xs"
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

        <div className="mt-8 pt-6 border-t border-slate-200 text-center text-xs text-slate-500">
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
        <div className="min-h-screen flex items-center justify-center bg-slate-50">
          <Loader2 className="w-8 h-8 animate-spin text-teal-600" />
        </div>
      }
    >
      <AdminLoginForm />
    </Suspense>
  );
}
