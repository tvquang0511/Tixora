"use client";

import { ReactNode } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import {
  LayoutDashboard,
  Calendar,
  ClipboardCheck,
  DollarSign,
  Users,
  LogOut,
  ExternalLink,
  Receipt,
  Cpu,
  Bell,
  Building2,
} from "lucide-react";
import { BrandMark } from "@/components/BrandMark";

const navGroups = [
  {
    title: "VẬN HÀNH",
    items: [{ href: "/dashboard", label: "Tổng quan", icon: LayoutDashboard }],
  },
  {
    title: "SỰ KIỆN & VÉ",
    items: [
      { href: "/events", label: "Quản lý sự kiện", icon: Calendar },
      {
        href: "/assignments",
        label: "Phân công soát vé",
        icon: ClipboardCheck,
      },
      { href: "/orders", label: "Đơn hàng", icon: Receipt },
    ],
  },

  {
    title: "TÀI CHÍNH & QUYẾT TOÁN",
    items: [
      { href: "/revenue", label: "Doanh thu & Đối soát", icon: DollarSign },
    ],
  },
  {
    title: "QUẢN TRỊ NỀN TẢNG",
    items: [
      {
        href: "/organizer-requests",
        label: "Duyệt Ban tổ chức",
        icon: Building2,
      },
      { href: "/users", label: "Người dùng & Phân quyền", icon: Users },
    ],
  },
];

const mobileNavItems = [
  { href: "/dashboard", label: "Tổng quan", icon: LayoutDashboard },
  { href: "/events", label: "Sự kiện", icon: Calendar },
  { href: "/assignments", label: "Phân công", icon: ClipboardCheck },
  { href: "/orders", label: "Đơn hàng", icon: Receipt },
  { href: "/revenue", label: "Doanh thu", icon: DollarSign },
  { href: "/organizer-requests", label: "Duyệt BTC", icon: Building2 },
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
        <div className="px-4 py-4 border-b border-slate-100 flex items-center justify-between">
          <Link href="/dashboard" className="block">
            <BrandMark compact />
          </Link>
          <span className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded bg-teal-50 text-teal-700 border border-teal-200">
            Admin
          </span>
        </div>

        {/* Grouped Navigation */}
        <div className="flex flex-col gap-4 p-3 grow overflow-y-auto">
          {navGroups.map((group) => (
            <div key={group.title} className="space-y-1">
              <div className="px-3 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                {group.title}
              </div>
              <ul className="space-y-1">
                {group.items.map((item) => {
                  const isActive = pathname?.startsWith(item.href);
                  return (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        className={`flex items-center gap-3 px-3 py-2.5 text-sm transition-colors duration-75 rounded-lg ${
                          isActive
                            ? "bg-teal-50 text-teal-900 font-semibold border-l-[3px] border-teal-600 pl-2.5 shadow-xs"
                            : "text-slate-600 hover:bg-slate-100 hover:text-slate-900 font-medium"
                        }`}
                      >
                        <item.icon
                          className={`w-5 h-5 shrink-0 ${
                            isActive ? "text-teal-600" : "text-slate-400"
                          }`}
                        />
                        <span className="truncate">{item.label}</span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}

          {/* Technical Monitoring Link */}
          <div className="pt-3 border-t border-slate-100 space-y-1.5">
            <div className="px-3 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              KỸ THUẬT & GIÁM SÁT
            </div>
            <div className="grid grid-cols-2 gap-2 px-1">
              <Link
                href="/jobs"
                className={`flex items-center justify-center gap-2 py-2 px-2.5 text-xs rounded-lg transition-colors duration-75 border ${
                  pathname?.startsWith("/jobs")
                    ? "bg-slate-100 text-slate-900 border-slate-300 font-semibold shadow-xs"
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-50 border-slate-200 font-medium"
                }`}
                title="Giám sát tiến trình nền BullMQ"
              >
                <Cpu className="w-4 h-4 text-slate-500" />
                <span>Jobs</span>
              </Link>
              <Link
                href="/notifications"
                className={`flex items-center justify-center gap-2 py-2 px-2.5 text-xs rounded-lg transition-colors duration-75 border ${
                  pathname?.startsWith("/notifications")
                    ? "bg-slate-100 text-slate-900 border-slate-300 font-semibold shadow-xs"
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-50 border-slate-200 font-medium"
                }`}
                title="Nhật ký gửi thông báo"
              >
                <Bell className="w-4 h-4 text-slate-500" />
                <span>Logs</span>
              </Link>
            </div>
          </div>
        </div>

        {/* User Info Bar at bottom of sidebar */}
        <div className="p-3.5 border-t border-slate-100 bg-slate-50/60 space-y-2.5">
          <div className="flex items-center gap-2.5">
            <div className="h-9 w-9 rounded-full bg-teal-600 text-white flex items-center justify-center font-semibold text-xs shrink-0 shadow-xs">
              {user?.fullName?.charAt(0).toUpperCase() || "A"}
            </div>
            <div className="min-w-0 flex-1">
              <div className="font-semibold text-slate-900 truncate text-sm leading-tight">
                {user?.fullName || "Quản trị viên"}
              </div>
              <div className="text-slate-500 truncate text-xs">
                {user?.email || ""}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2 pt-1 border-t border-slate-200/60">
            <a
              href={webAppUrl}
              target="_blank"
              rel="noreferrer"
              className="flex-1 flex items-center justify-center gap-1.5 text-xs font-medium py-1.5 px-2 bg-white hover:bg-slate-100 text-slate-700 rounded-md border border-slate-200 transition-colors duration-75"
            >
              <span>Xem Web</span>
              <ExternalLink size={12} className="text-slate-400" />
            </a>
            <button
              onClick={() => {
                void logout().then(() => router.replace("/login"));
              }}
              className="flex items-center justify-center gap-1.5 text-xs font-medium py-1.5 px-2.5 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-md border border-rose-200 transition-colors duration-75 cursor-pointer"
              title="Đăng xuất"
            >
              <LogOut size={12} />
              <span>Thoát</span>
            </button>
          </div>
        </div>
      </nav>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-h-screen overflow-x-hidden">
        {/* Page Content */}
        <div className="p-4 sm:p-5 grow max-w-[1600px] w-full mx-auto">
          {children}
        </div>
      </main>

      {/* Mobile Bottom Nav */}
      <nav className="md:hidden fixed bottom-0 left-0 w-full z-50 flex justify-around items-center h-16 bg-white border-t border-slate-200 shadow-md">
        {mobileNavItems.map((item) => {
          const isActive = pathname?.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center justify-center text-xs font-medium w-full h-full py-1 ${
                isActive
                  ? "text-teal-700 bg-teal-50/80 font-semibold"
                  : "text-slate-600 hover:bg-slate-50"
              }`}
            >
              <item.icon className="w-5 h-5 mb-1" />
              <span className="text-[11px]">{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
