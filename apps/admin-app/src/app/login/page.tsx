"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { authService } from "@/services/auth.service";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/context/ToastContext";
import { BrandMark } from "@/components/BrandMark";
import { ShieldCheck, LogIn, Lock, Mail, Loader2 } from "lucide-react";
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
      <div className="w-full max-w-md bg-white border border-slate-300 rounded-none p-8 shadow-sm relative z-10">
        <div className="flex flex-col items-center mb-8 text-center">
          <BrandMark />
          <div className="flex items-center gap-1.5 mt-4 px-2.5 py-1 rounded-none bg-slate-100 border border-slate-300 text-xs font-semibold text-slate-800 uppercase tracking-wider">
            <ShieldCheck size={14} className="text-slate-700" />
            <span>Khu vực Quản trị Hệ thống</span>
          </div>
        </div>

        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5 uppercase tracking-wider">
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
                className="w-full bg-white border border-slate-300 rounded-none pl-10 pr-4 py-2.5 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-slate-900 transition-colors"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5 uppercase tracking-wider">
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
                className="w-full bg-white border border-slate-300 rounded-none pl-10 pr-4 py-2.5 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-slate-900 transition-colors"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-4 bg-slate-900 hover:bg-slate-800 text-white font-semibold py-2.5 px-4 rounded-none border border-slate-900 flex items-center justify-center gap-2 transition-colors disabled:opacity-50 cursor-pointer text-xs"
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
          <Loader2 className="w-8 h-8 animate-spin text-slate-900 rounded-none" />
        </div>
      }
    >
      <AdminLoginForm />
    </Suspense>
  );
}
