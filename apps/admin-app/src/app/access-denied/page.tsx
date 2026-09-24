"use client";

import Link from "next/link";
import { ShieldAlert, ArrowLeft, LogOut, Smartphone } from "lucide-react";
import { useAuth } from "@/context/AuthContext";

export default function AccessDeniedPage() {
  const { user, logout } = useAuth();
  const isChecker =
    user?.roles?.includes("Checker") && !user?.roles?.includes("Admin");

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-slate-50 relative">
      <div className="w-full max-w-md bg-white border border-slate-300 rounded-none p-8 shadow-sm relative z-10 text-center">
        <div className="w-14 h-14 rounded-none bg-red-50 border border-red-200 text-red-600 flex items-center justify-center mx-auto mb-6">
          <ShieldAlert className="w-7 h-7" />
        </div>

        <h1 className="text-lg font-bold text-slate-900 mb-2">
          Truy cập bị từ chối
        </h1>

        {isChecker ? (
          <div className="p-4 rounded-none bg-amber-50 border border-amber-200 text-amber-800 text-xs text-left mb-6 space-y-2">
            <div className="flex items-center gap-2 font-semibold text-amber-900">
              <Smartphone className="w-4 h-4" />
              <span>Tài khoản Soát vé (Checker)</span>
            </div>
            <p className="leading-relaxed">
              Tài khoản này chỉ được cấp quyền quét mã QR soát vé trên{" "}
              <strong>ứng dụng di động (Mobile App)</strong> tại cổng sự kiện,
              không được phép truy cập Cổng Quản trị Admin.
            </p>
          </div>
        ) : (
          <p className="text-xs text-slate-600 mb-6">
            Tài khoản của bạn không có đủ quyền hạn để truy cập khu vực quản trị
            này.
          </p>
        )}

        <div className="flex flex-col gap-3">
          <button
            onClick={() => logout()}
            className="w-full py-2.5 px-4 rounded-none bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 text-xs font-semibold flex items-center justify-center gap-2 transition-colors cursor-pointer"
          >
            <LogOut className="w-4 h-4 text-slate-500" />
            <span>Đăng xuất tài khoản</span>
          </button>

          <Link
            href="/login"
            className="w-full py-2.5 px-4 rounded-none bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold flex items-center justify-center gap-2 transition-colors border border-slate-900"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Quay lại trang Đăng nhập</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
