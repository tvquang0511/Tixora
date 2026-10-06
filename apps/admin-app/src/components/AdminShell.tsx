"use client";

import { useState, type ReactNode } from "react";
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
  Receipt,
  Cpu,
  Bell,
  Building2,
  ChevronDown,
  ChevronsLeft,
  ChevronsRight,
  Zap,
  TrendingUp,
  CreditCard,
  Settings,
} from "lucide-react";
import { BrandMark } from "@/components/BrandMark";

const topNavItem = {
  href: "/dashboard",
  label: "Hôm nay",
  icon: LayoutDashboard,
};

const navGroups = [
  {
    title: "HOẠT ĐỘNG",
    icon: Zap,
    items: [
      {
        href: "/events",
        label: "Sự kiện",
        icon: Calendar,
        badge: "10",
      },
      {
        href: "/assignments",
        label: "Phân công soát vé",
        icon: ClipboardCheck,
      },
      {
        href: "/orders",
        label: "Đơn hàng",
        icon: Receipt,
      },
    ],
  },
  {
    title: "TÀI CHÍNH",
    icon: TrendingUp,
    items: [
      {
        href: "/revenue",
        label: "Báo cáo Doanh thu",
        icon: TrendingUp,
      },
      {
        href: "/settlements",
        label: "Đối soát & Quyết toán",
        icon: CreditCard,
      },
    ],
  },
  {
    title: "QUẢN TRỊ",
    icon: Users,
    items: [
      {
        href: "/organizer-requests",
        label: "Duyệt Ban tổ chức",
        icon: Building2,
      },
      {
        href: "/users",
        label: "Người dùng & Phân quyền",
        icon: Users,
      },
    ],
  },
  {
    title: "KỸ THUẬT",
    icon: Settings,
    items: [
      {
        href: "/jobs",
        label: "BullMQ Jobs",
        icon: Cpu,
      },
      {
        href: "/notifications",
        label: "Nhật ký Logs",
        icon: Bell,
      },
    ],
  },
];

const mobileNavItems = [
  { href: "/dashboard", label: "Hôm nay", icon: LayoutDashboard },
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
  const [collapsed, setCollapsed] = useState(false);
  const isTopActive = pathname === "/dashboard" || pathname === "/";

  return (
    <div className="flex min-h-screen bg-slate-50 text-slate-900 font-body">
      {/* Desktop Sidebar - HTCAA Style */}
      <nav
        className={`hidden md:flex flex-col h-screen ${
          collapsed ? "w-16 p-2" : "w-[250px] p-[14px_12px_12px]"
        } bg-[#0e54a3] text-white shrink-0 sticky top-0 z-40 border-r border-[#0e54a3] shadow-[4px_0_24px_-8px_rgba(14,84,163,0.35)] transition-all duration-200 overflow-hidden`}
      >
        {/* Brand Header with Collapse Button on Top */}
        <div
          className={`flex items-center shrink-0 border-b border-white/10 pb-2.5 mb-2 ${
            collapsed
              ? "flex-col gap-2 justify-center pt-0.5"
              : "justify-between px-1 pt-0.5"
          }`}
        >
          <Link href="/dashboard" className="block">
            <BrandMark compact={collapsed} theme="dark" />
          </Link>
          <button
            type="button"
            onClick={() => setCollapsed(!collapsed)}
            className="p-1 text-white/70 hover:text-white hover:bg-white/10 rounded-md transition-colors cursor-pointer"
            title={collapsed ? "Mở rộng thanh điều hướng" : "Thu gọn"}
            aria-label={collapsed ? "Mở rộng thanh điều hướng" : "Thu gọn"}
          >
            {collapsed ? (
              <ChevronsRight size={16} />
            ) : (
              <ChevronsLeft size={16} />
            )}
          </button>
        </div>

        {/* Grouped Navigation */}
        <div className="flex-1 overflow-y-auto flex flex-col gap-0.5 no-scrollbar [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
          {/* Top Single Item: Hôm nay */}
          <div>
            <Link
              href={topNavItem.href}
              className={`relative flex items-center ${
                collapsed ? "justify-center p-2" : "gap-2.5 px-3 py-2"
              } my-0.5 rounded-lg text-[13px] font-bold transition-all ${
                isTopActive
                  ? "bg-white/90 text-[#0e54a3] shadow-[0_4px_10px_-4px_rgba(14,84,163,0.35)] before:content-[''] before:absolute before:left-0 before:top-1/2 before:-translate-y-1/2 before:w-[3px] before:h-5 before:rounded-full before:bg-[#e62e2e]"
                  : "text-white/75 hover:bg-white/10 hover:text-white"
              }`}
              title={collapsed ? topNavItem.label : undefined}
            >
              <div
                className={`w-7 h-7 rounded-md flex items-center justify-center shrink-0 ${
                  isTopActive
                    ? "bg-[#0e54a3]/10 text-[#0e54a3]"
                    : "bg-white/10 text-white/85"
                }`}
              >
                <topNavItem.icon className="w-4 h-4" />
              </div>
              {!collapsed && (
                <span className="truncate">{topNavItem.label}</span>
              )}
            </Link>
          </div>

          {/* Nav Groups */}
          {navGroups.map((group) => (
            <div key={group.title} className="mt-1">
              {!collapsed ? (
                <div className="text-[#7dd3fc] text-[10.5px] font-bold tracking-[0.09em] uppercase flex items-center justify-between px-3 py-1.5 select-none">
                  <div className="flex items-center gap-1.5">
                    <group.icon className="w-3.5 h-3.5 opacity-80" />
                    <span className="truncate">{group.title}</span>
                  </div>
                  <ChevronDown className="w-3.5 h-3.5 text-[#7dd3fc]/70" />
                </div>
              ) : (
                <div className="h-px bg-white/10 my-1 mx-2" />
              )}
              <div className="flex flex-col gap-0.5">
                {group.items.map((item) => {
                  const isActive = pathname?.startsWith(item.href);
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`relative flex items-center ${
                        collapsed ? "justify-center p-2" : "gap-2.5 px-3 py-2"
                      } my-0.5 rounded-lg text-[13px] font-bold transition-all ${
                        isActive
                          ? "bg-white/90 text-[#0e54a3] shadow-[0_4px_10px_-4px_rgba(14,84,163,0.35)] before:content-[''] before:absolute before:left-0 before:top-1/2 before:-translate-y-1/2 before:w-[3px] before:h-5 before:rounded-full before:bg-[#e62e2e]"
                          : "text-white/75 hover:bg-white/10 hover:text-white"
                      }`}
                      title={collapsed ? item.label : undefined}
                    >
                      <div
                        className={`w-7 h-7 rounded-md flex items-center justify-center shrink-0 ${
                          isActive
                            ? "bg-[#0e54a3]/10 text-[#0e54a3]"
                            : "bg-white/10 text-white/85"
                        }`}
                      >
                        <item.icon className="w-4 h-4" />
                      </div>
                      {!collapsed && (
                        <span className="truncate flex-1">{item.label}</span>
                      )}
                      {!collapsed && item.badge && (
                        <span
                          className={`ml-auto min-w-[22px] h-5 px-1.5 rounded-full text-[11px] font-bold flex items-center justify-center ${
                            isActive
                              ? "bg-[#0e54a3]/15 text-[#0e54a3]"
                              : "bg-white/20 text-white"
                          }`}
                        >
                          {item.badge}
                        </span>
                      )}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Sidebar Footer - Slim Account Box */}
        <div className="pt-2 mt-auto border-t border-white/10 shrink-0">
          {!collapsed ? (
            <div className="p-1.5 bg-white/5 border border-white/10 rounded-lg flex items-center gap-2">
              <div className="h-6 w-6 rounded-md bg-white text-[#0e54a3] flex items-center justify-center font-bold text-[11px] shrink-0 shadow-xs">
                {user?.fullName?.charAt(0).toUpperCase() || "A"}
              </div>
              <div className="min-w-0 flex-1 leading-tight">
                <div className="font-semibold text-white truncate text-[11px]">
                  {user?.fullName || "Quản trị viên"}
                </div>
                <div className="text-white/60 truncate text-[9.5px]">
                  {user?.email || ""}
                </div>
              </div>
              <button
                onClick={() => {
                  void logout().then(() => router.replace("/login"));
                }}
                className="px-2 py-1 bg-white/10 hover:bg-rose-600 text-white rounded text-[11px] font-medium flex items-center gap-1 transition-colors shrink-0 cursor-pointer"
                title="Đăng xuất"
              >
                <LogOut size={11} />
                <span>Thoát</span>
              </button>
            </div>
          ) : (
            <div className="flex justify-center">
              <button
                onClick={() => {
                  void logout().then(() => router.replace("/login"));
                }}
                className="p-1.5 text-white/70 hover:text-white hover:bg-rose-600 rounded-md transition-colors cursor-pointer"
                title="Đăng xuất"
              >
                <LogOut size={16} />
              </button>
            </div>
          )}
        </div>
      </nav>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-h-screen overflow-x-hidden">
        {/* Mobile Top Header */}
        <div className="md:hidden sticky top-0 z-30 flex items-center justify-between px-4 py-3 bg-[#0e54a3] border-b border-blue-700 shadow-md text-white">
          <Link href="/dashboard" className="block">
            <BrandMark compact theme="dark" />
          </Link>
          <div className="flex items-center gap-2.5">
            <button
              onClick={() => {
                void logout().then(() => router.replace("/login"));
              }}
              className="p-1.5 rounded-lg text-white/90 hover:text-white hover:bg-white/10 transition-colors"
              title="Đăng xuất"
            >
              <LogOut size={16} />
            </button>
          </div>
        </div>

        {/* Page Content */}
        <div className="p-4 sm:p-5 grow max-w-[1600px] w-full mx-auto pb-20 md:pb-5">
          {children}
        </div>
      </main>

      {/* Mobile Bottom Nav */}
      <nav className="md:hidden fixed bottom-0 left-0 w-full z-50 flex justify-around items-center h-16 bg-[#0e54a3] border-t border-blue-700 shadow-2xl text-white">
        {mobileNavItems.map((item) => {
          const isActive = pathname?.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center justify-center text-xs font-medium w-full h-full py-1 transition-colors ${
                isActive
                  ? "bg-white text-[#0e54a3] font-bold rounded-lg mx-1 my-1 shadow-xs"
                  : "text-white/80 hover:text-white"
              }`}
            >
              <item.icon
                className={`w-5 h-5 mb-1 ${isActive ? "text-[#0e54a3]" : "text-white/90"}`}
              />
              <span className="text-[11px]">{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
