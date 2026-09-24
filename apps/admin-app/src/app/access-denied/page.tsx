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
      <div className="w-full max-w-md bg-white border border-slate-200 rounded-2xl p-8 shadow-sm relative z-10 text-center">
        <div className="w-14 h-14 rounded-2xl bg-rose-50 border border-rose-100 text-rose-600 flex items-center justify-center mx-auto mb-6">
          <ShieldAlert className="w-7 h-7" />
        </div>

        <h1 className="text-xl font-bold text-slate-900 mb-2">
          Truy cập bị từ chối
        </h1>

        {isChecker ? (
          <div className="p-4 rounded-xl bg-amber-50 border border-amber-200/80 text-amber-800 text-xs text-left mb-6 space-y-2">
            <div className="flex items-center gap-2 font-semibold text-amber-950">
              <Smartphone className="w-4 h-4 text-amber-700" />
              <span>Tài khoản Soát vé (Checker)</span>
            </div>
            <p className="leading-relaxed">
              Tài khoản này chỉ được cấp quyền quét mã QR soát vé trên{" "}
              <strong>ứng dụng di động (Mobile App)</strong> tại cổng sự kiện,
              không được phép truy cập Cổng Quản trị Admin.
            </p>
          </div>
        ) : (
          <p className="text-xs text-slate-600 mb-6 leading-relaxed">
            Tài khoản của bạn không có đủ quyền hạn để truy cập khu vực quản trị
            này.
          </p>
        )}

        <div className="flex flex-col gap-2.5">
          <Link
            href="/login"
            className="w-full py-2.5 px-4 rounded-lg bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold flex items-center justify-center gap-2 transition-colors shadow-2xs"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Quay lại trang Đăng nhập</span>
          </Link>

          <button
            onClick={() => logout()}
            className="w-full py-2.5 px-4 rounded-lg bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-xs font-semibold flex items-center justify-center gap-2 transition-colors cursor-pointer"
          >
            <LogOut className="w-4 h-4 text-slate-400" />
            <span>Đăng xuất tài khoản</span>
          </button>
        </div>
      </div>
    </div>
  );
}
