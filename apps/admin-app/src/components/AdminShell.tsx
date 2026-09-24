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
      <nav className="hidden md:flex flex-col h-screen w-64 bg-white border-r border-slate-200 shrink-0 sticky top-0 z-40">
        <div className="px-5 py-4 border-b border-slate-100">
          <Link href="/dashboard" className="block">
            <BrandMark compact />
          </Link>
        </div>
        <ul className="flex flex-col gap-1.5 p-3 grow overflow-y-auto">
          {navItems.map((item) => {
            const isActive = pathname?.startsWith(item.href);
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={`flex items-center gap-3 px-3.5 py-2.5 text-sm transition-colors rounded-lg ${
                    isActive
                      ? "bg-teal-50 text-teal-800 font-semibold shadow-2xs"
                      : "text-slate-600 hover:bg-slate-50 hover:text-slate-900 font-medium"
                  }`}
                >
                  <item.icon
                    className={`w-5 h-5 shrink-0 ${
                      isActive ? "text-teal-600" : "text-slate-400"
                    }`}
                  />
                  <span>{item.label}</span>
                </Link>
              </li>
            );
          })}
        </ul>

        {/* User Info Bar at bottom of sidebar */}
        <div className="p-3.5 border-t border-slate-100 bg-slate-50/50">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-full bg-teal-600 text-white flex items-center justify-center font-semibold text-sm shrink-0 shadow-2xs">
              {user?.fullName?.charAt(0).toUpperCase() || "A"}
            </div>
            <div className="min-w-0 flex-1">
              <div className="font-semibold text-slate-900 truncate text-sm leading-tight">
                {user?.fullName || "Quản trị viên"}
              </div>
              <div className="text-slate-500 truncate text-xs mt-0.5">
                {user?.email || ""}
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-h-screen overflow-x-hidden">
        {/* Top Header */}
        <header className="h-14 flex items-center justify-between px-6 bg-white sticky top-0 z-30 border-b border-slate-200">
          {/* Mobile Menu Toggle */}
          <button className="md:hidden text-slate-600 p-1.5 rounded-lg hover:bg-slate-100">
            <Menu className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-2">
            <h2 className="text-base font-semibold text-slate-800 hidden md:block">
              {navItems.find((item) => pathname?.startsWith(item.href))
                ?.label || "Trang quản trị"}
            </h2>
          </div>

          <div className="flex items-center gap-3 ml-auto">
            <a
              href={webAppUrl}
              target="_blank"
              rel="noreferrer"
              className="hidden sm:flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 rounded-lg shadow-2xs transition-colors"
            >
              <span>Web Khách Hàng</span>
              <ExternalLink size={12} className="text-slate-400" />
            </a>

            <div className="relative group">
              <button
                type="button"
                className="h-8 w-8 bg-teal-600 hover:bg-teal-700 text-white flex items-center justify-center font-semibold text-xs rounded-full cursor-pointer transition-colors shadow-2xs"
              >
                {user?.fullName?.charAt(0).toUpperCase() || "A"}
              </button>
              <div className="absolute right-0 mt-1 w-48 bg-white border border-slate-200 rounded-xl shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-150 z-50">
                <div className="p-1 flex flex-col gap-0.5 text-left text-xs">
                  <a
                    href={webAppUrl}
                    className="flex items-center gap-2 px-3 py-2 text-slate-700 hover:bg-slate-50 rounded-lg"
                  >
                    <ExternalLink size={14} className="text-slate-400" /> Trang
                    khách hàng
                  </a>
                  <div className="h-px bg-slate-100 my-0.5" />
                  <button
                    onClick={() => {
                      void logout().then(() => router.replace("/login"));
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-rose-600 hover:bg-rose-50 rounded-lg cursor-pointer font-medium"
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
      <nav className="md:hidden fixed bottom-0 left-0 w-full z-50 flex justify-around items-center h-15 bg-white border-t border-slate-200">
        {navItems.map((item) => {
          const isActive = pathname?.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center justify-center text-xs font-medium w-full h-full ${
                isActive
                  ? "text-teal-700 bg-teal-50 font-semibold"
                  : "text-slate-600 hover:bg-slate-50"
              }`}
            >
              <item.icon className="w-4.5 h-4.5 mb-1" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
