"use client";

import Link from "next/link";
import { ShieldAlert, ArrowLeft, LogOut, Smartphone } from "lucide-react";
import { useAuth } from "@/context/AuthContext";

export default function AccessDeniedPage() {
  const { user, logout } = useAuth();
  const isChecker =
    user?.roles?.includes("Checker") && !user?.roles?.includes("Admin");

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background relative overflow-hidden">
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 bg-error/10 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md bg-surface/90 border border-outline-variant/80 rounded-2xl p-8 shadow-2xl backdrop-blur-xl relative z-10 text-center">
        <div className="w-16 h-16 rounded-2xl bg-error/10 border border-error/20 text-error flex items-center justify-center mx-auto mb-6">
          <ShieldAlert className="w-8 h-8" />
        </div>

        <h1 className="text-xl font-bold text-foreground mb-2">
          Truy cập bị từ chối
        </h1>

        {isChecker ? (
          <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300 text-sm text-left mb-6 space-y-2">
            <div className="flex items-center gap-2 font-semibold text-amber-400">
              <Smartphone className="w-4 h-4" />
              <span>Tài khoản Soát vé (Checker)</span>
            </div>
            <p className="text-xs text-on-surface-variant leading-relaxed">
              Tài khoản này chỉ được cấp quyền quét mã QR soát vé trên{" "}
              <strong>ứng dụng di động (Mobile App)</strong> tại cổng sự kiện,
              không được phép truy cập Cổng Quản trị Admin.
            </p>
          </div>
        ) : (
          <p className="text-sm text-on-surface-variant mb-6">
            Tài khoản của bạn không có đủ quyền hạn để truy cập khu vực này.
          </p>
        )}

        <div className="flex flex-col gap-3">
          <button
            onClick={() => logout()}
            className="w-full py-2.5 px-4 rounded-xl bg-surface-low hover:bg-surface-high border border-outline-variant text-foreground text-sm font-semibold flex items-center justify-center gap-2 transition-colors cursor-pointer"
          >
            <LogOut className="w-4 h-4 text-muted-foreground" />
            <span>Đăng xuất tài khoản</span>
          </button>

          <Link
            href="/login"
            className="w-full py-2.5 px-4 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground text-sm font-semibold flex items-center justify-center gap-2 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Quay lại trang Đăng nhập</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
