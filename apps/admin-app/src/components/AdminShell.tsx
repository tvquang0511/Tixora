"use client";

import { ReactNode } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import {
  LayoutDashboard,
  Calendar,
  DollarSign,
  Users,
  ClipboardCheck,
  Menu,
  LogOut,
  ExternalLink,
  Receipt,
  Cpu,
  Bell,
} from "lucide-react";
import { BrandMark } from "@/components/BrandMark";

const navItems = [
  { href: "/dashboard", label: "Tổng quan", icon: LayoutDashboard },
  { href: "/orders", label: "Đơn hàng", icon: Receipt },
  { href: "/events", label: "Sự kiện", icon: Calendar },
  { href: "/revenue", label: "Doanh thu", icon: DollarSign },
  { href: "/users", label: "Người dùng", icon: Users },
  { href: "/assignments", label: "Phân công", icon: ClipboardCheck },
  { href: "/notifications", label: "Thông báo", icon: Bell },
  { href: "/jobs", label: "Tác vụ nền", icon: Cpu },
];

export function AdminShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuth();
  const webAppUrl = process.env.NEXT_PUBLIC_WEB_URL || "http://localhost:3001";

  return (
    <div className="flex min-h-screen bg-slate-50 text-slate-900 font-body">
      {/* Desktop Sidebar */}
      <nav className="hidden md:flex flex-col h-screen w-60 bg-white border-r border-slate-200 shrink-0 sticky top-0 z-40 rounded-none">
        <div className="p-4 border-b border-slate-200">
          <Link href="/dashboard" className="block">
            <BrandMark compact />
          </Link>
        </div>
        <ul className="flex flex-col py-2 grow overflow-y-auto">
          {navItems.map((item) => {
            const isActive = pathname?.startsWith(item.href);
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={`flex items-center gap-3 px-4 py-2.5 text-sm font-medium transition-colors rounded-none border-l-4 ${
                    isActive
                      ? "bg-slate-100 text-blue-700 border-blue-600 font-semibold"
                      : "text-slate-600 hover:bg-slate-50 hover:text-slate-900 border-transparent"
                  }`}
                >
                  <item.icon className="w-4 h-4 shrink-0" />
                  <span>{item.label}</span>
                </Link>
              </li>
            );
          })}
        </ul>

        {/* User Info Bar at bottom of sidebar */}
        <div className="p-3 border-t border-slate-200 bg-slate-50 text-xs">
          <div className="font-semibold text-slate-900 truncate">
            {user?.fullName || "Quản trị viên"}
          </div>
          <div className="text-slate-500 truncate text-[11px]">
            {user?.email || ""}
          </div>
        </div>
      </nav>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-h-screen overflow-x-hidden">
        {/* Top Header */}
        <header className="h-14 flex items-center justify-between px-6 bg-white sticky top-0 z-30 border-b border-slate-200 rounded-none shadow-none">
          {/* Mobile Menu Toggle */}
          <button className="md:hidden text-slate-600 p-2 rounded-none">
            <Menu className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-2">
            <h2 className="text-base font-bold text-slate-900 hidden md:block">
              {navItems.find((item) => pathname?.startsWith(item.href))
                ?.label || "Trang quản trị"}
            </h2>
          </div>

          <div className="flex items-center gap-3 ml-auto">
            <a
              href={webAppUrl}
              target="_blank"
              rel="noreferrer"
              className="hidden sm:flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 rounded-none transition-colors"
            >
              <span>Web Khách Hàng</span>
              <ExternalLink size={12} />
            </a>

            <div className="relative group">
              <button
                type="button"
                className="h-8 w-8 bg-slate-900 text-white flex items-center justify-center font-bold text-xs rounded-none cursor-pointer border border-slate-900"
              >
                {user?.fullName?.charAt(0).toUpperCase() || "A"}
              </button>
              <div className="absolute right-0 mt-1 w-48 bg-white border border-slate-200 shadow-md opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-150 z-50 rounded-none">
                <div className="p-1 flex flex-col gap-0.5 text-left text-xs">
                  <a
                    href={webAppUrl}
                    className="flex items-center gap-2 px-3 py-2 text-slate-700 hover:bg-slate-100 rounded-none"
                  >
                    <ExternalLink size={14} /> Trang khách hàng
                  </a>
                  <div className="h-px bg-slate-200 my-0.5" />
                  <button
                    onClick={() => {
                      void logout().then(() => router.replace("/login"));
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-red-600 hover:bg-red-50 rounded-none cursor-pointer font-medium"
                  >
                    <LogOut size={14} /> Đăng xuất
                  </button>
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <div className="p-6 md:p-8 grow max-w-[1600px] w-full mx-auto">
          {children}
        </div>
      </main>

      {/* Mobile Bottom Nav */}
      <nav className="md:hidden fixed bottom-0 left-0 w-full z-50 flex justify-around items-center h-14 bg-white border-t border-slate-200 rounded-none">
        {navItems.map((item) => {
          const isActive = pathname?.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center justify-center text-[10px] font-semibold w-full h-full rounded-none ${
                isActive
                  ? "text-blue-700 bg-slate-100"
                  : "text-slate-600 hover:bg-slate-50"
              }`}
            >
              <item.icon className="w-4 h-4 mb-0.5" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
