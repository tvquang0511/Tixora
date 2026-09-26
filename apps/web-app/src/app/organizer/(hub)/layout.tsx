"use client";

import { ReactNode } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { BrandMark } from "@/components/common";
import {
  LayoutDashboard,
  Calendar,
  PlusCircle,
  ExternalLink,
  LogOut,
  Building2,
  AlertTriangle,
  ArrowRight,
} from "lucide-react";

export default function OrganizerHubLayout({
  children,
}: {
  children: ReactNode;
}) {
  const { user, isAuthenticated, isLoading, logout } = useAuth();
  const pathname = usePathname();
  const router = useRouter();

  const isOrganizer =
    user?.roles?.some((role) => role.toLowerCase() === "organizer") || false;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-slate-400">
        <div className="animate-spin w-8 h-8 border-2 border-teal-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!isAuthenticated || !isOrganizer) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-3xl p-8 text-center space-y-5 shadow-2xl">
          <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center mx-auto">
            <AlertTriangle className="w-7 h-7" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">
              Yêu Cầu Quyền Ban Tổ Chức
            </h2>
            <p className="text-sm text-slate-400 mt-2">
              Khu vực này chỉ dành cho các đối tác đã được ban quản trị Tixora
              phê duyệt hồ sơ đối tác.
            </p>
          </div>
          <div className="pt-2 flex flex-col gap-2">
            <Link
              href="/organizer/apply"
              className="w-full py-3 rounded-xl bg-primary hover:bg-primary-hover text-white text-sm font-bold shadow-lg shadow-primary/25 inline-flex items-center justify-center gap-2"
            >
              Xem / Nộp Hồ Sơ Đối Tác
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/"
              className="w-full py-2.5 rounded-xl text-slate-400 hover:text-white text-xs font-semibold"
            >
              Quay về Trang Chủ
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const navLinks = [
    { href: "/organizer/dashboard", label: "Tổng quan", icon: LayoutDashboard },
    { href: "/organizer/events", label: "Sự kiện của tôi", icon: Calendar },
    { href: "/organizer/create-event", label: "Tạo sự kiện", icon: PlusCircle },
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-on-surface flex flex-col">
      {/* Top Header */}
      <header className="sticky top-0 z-40 border-b border-slate-800/80 bg-slate-950/90 backdrop-blur-md">
        <div className="mx-auto flex w-full max-w-7xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
          {/* Brand + Hub Tag */}
          <div className="flex items-center gap-3">
            <Link href="/" className="shrink-0">
              <BrandMark compact />
            </Link>
            <span className="hidden sm:inline-block text-slate-700">|</span>
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-teal-500/10 border border-teal-500/20 text-teal-400 text-xs font-bold uppercase tracking-wider">
              <Building2 className="w-3.5 h-3.5" />
              Organizer Hub
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="hidden md:flex items-center gap-1">
            {navLinks.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-xl transition-colors ${
                    isActive
                      ? "bg-slate-900 text-teal-400 border border-slate-800"
                      : "text-slate-400 hover:bg-slate-900/50 hover:text-white"
                  }`}
                >
                  <item.icon className="w-4 h-4" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>

          {/* User profile & back link */}
          <div className="flex items-center gap-4">
            <Link
              href="/"
              className="hidden lg:flex items-center gap-1 text-xs text-slate-400 hover:text-white transition-colors"
            >
              <span>Website vé</span>
              <ExternalLink className="w-3 h-3" />
            </Link>

            <div className="flex items-center gap-3 pl-2 border-l border-slate-800">
              <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-teal-600 to-primary text-white flex items-center justify-center font-bold text-xs shadow-xs">
                {user?.fullName?.charAt(0).toUpperCase() || "O"}
              </div>
              <div className="hidden sm:block text-left text-xs">
                <div className="font-semibold text-white leading-tight">
                  {user?.fullName}
                </div>
                <div className="text-[11px] text-teal-400">Ban Tổ Chức</div>
              </div>
              <button
                onClick={() => {
                  void logout().then(() => router.replace("/login"));
                }}
                className="p-1.5 text-slate-400 hover:text-rose-400 transition-colors"
                title="Đăng xuất"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Nav Bar */}
        <div className="flex md:hidden items-center justify-around border-t border-slate-900 py-2 bg-slate-950">
          {navLinks.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg ${
                  isActive
                    ? "bg-slate-900 text-teal-400 font-semibold"
                    : "text-slate-400"
                }`}
              >
                <item.icon className="w-3.5 h-3.5" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 py-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
        {children}
      </main>
    </div>
  );
}
