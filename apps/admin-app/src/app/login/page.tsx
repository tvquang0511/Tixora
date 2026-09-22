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
      if (userRoles.includes("Checker") && !userRoles.includes("Admin") && !userRoles.includes("Organizer")) {
        await logout();
        showErrorToast(
          "Truy cập bị từ chối: Tài khoản Soát vé (Checker) chỉ được sử dụng trên ứng dụng di động Mobile App."
        );
        setLoading(false);
        return;
      }

      if (!userRoles.includes("Admin") && !userRoles.includes("Organizer")) {
        await logout();
        showErrorToast("Truy cập bị từ chối: Tài khoản không có quyền Quản trị viên (Admin).");
        setLoading(false);
        return;
      }

      login(user);
      showSuccessToast("Đăng nhập quyền Quản trị viên thành công!");
      router.replace(returnUrl);
    } catch (err: unknown) {
      showErrorToast(
        getErrorMessage(err) || "Đăng nhập thất bại. Vui lòng kiểm tra lại thông tin."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background relative overflow-hidden">
      {/* Background Glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 bg-primary/20 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md bg-surface/90 border border-outline-variant/80 rounded-2xl p-8 shadow-2xl backdrop-blur-xl relative z-10">
        <div className="flex flex-col items-center mb-8 text-center">
          <BrandMark />
          <div className="flex items-center gap-1.5 mt-4 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-xs font-semibold text-primary">
            <ShieldCheck size={14} />
            <span>Khu vực Quản trị Hệ thống</span>
          </div>
        </div>

        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-on-surface-variant mb-1.5 uppercase tracking-wider">
              Email Quản trị viên
            </label>
            <div className="relative">
              <Mail className="w-5 h-5 absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@ticketbox.vn"
                className="w-full bg-surface-low border border-outline-variant rounded-xl pl-11 pr-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-on-surface-variant mb-1.5 uppercase tracking-wider">
              Mật khẩu
            </label>
            <div className="relative">
              <Lock className="w-5 h-5 absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-surface-low border border-outline-variant rounded-xl pl-11 pr-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 bg-gradient-to-r from-primary to-indigo-600 hover:opacity-95 text-white font-semibold py-3 px-4 rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-primary/20 transition-all disabled:opacity-50 cursor-pointer"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>Đang xác thực...</span>
              </>
            ) : (
              <>
                <LogIn className="w-5 h-5" />
                <span>Đăng nhập Admin</span>
              </>
            )}
          </button>
        </form>

        <div className="mt-8 pt-6 border-t border-outline-variant/60 text-center text-xs text-muted-foreground">
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
        <div className="min-h-screen flex items-center justify-center bg-background">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      }
    >
      <AdminLoginForm />
    </Suspense>
  );
}
