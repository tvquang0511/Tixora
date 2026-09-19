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
  Plus,
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
    <div className="flex min-h-screen bg-background text-foreground font-body">
      {/* Desktop Sidebar */}
      <nav className="hidden md:flex flex-col h-screen p-4 gap-4 w-64 bg-surface/90 backdrop-blur-md border-r border-outline-variant/60 shrink-0 sticky top-0 z-40">
        <div className="mb-8 px-2 mt-2">
          <Link href="/dashboard">
            <BrandMark compact />
          </Link>
        </div>
        <ul className="flex flex-col gap-1 mt-2 grow">
          {navItems.map((item) => {
            const isActive = pathname?.startsWith(item.href);
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl font-body text-sm font-semibold transition-all duration-200 ${
                    isActive
                      ? "bg-gradient-to-r from-primary to-indigo-600 text-white shadow-md shadow-primary/10 active:scale-[0.98]"
                      : "text-on-surface-variant/85 hover:bg-surface-low hover:text-primary"
                  }`}
                >
                  <item.icon className="w-5 h-5" />
                  {item.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-h-screen overflow-x-hidden">
        {/* Top Header */}
        <header className="h-16 flex items-center justify-between px-4 md:px-10 bg-surface/90 backdrop-blur-md sticky top-0 z-30 border-b border-outline-variant/60 shadow-sm">
          {/* Mobile Menu Toggle */}
          <button className="md:hidden text-muted-foreground p-2">
            <Menu className="w-6 h-6" />
          </button>

          <h2 className="font-display text-2xl font-bold text-foreground hidden md:block">
            {navItems.find((item) => pathname?.startsWith(item.href))?.label ||
              "Trang quản trị"}
          </h2>

          <div className="flex items-center gap-4 ml-auto">
            <a
              href={webAppUrl}
              target="_blank"
              rel="noreferrer"
              className="hidden sm:flex items-center gap-2 text-xs font-semibold px-3 py-1.5 rounded-lg border border-outline-variant/80 hover:bg-surface-high transition-colors text-on-surface-variant"
            >
              <span>Vào Web Khách Hàng</span>
              <ExternalLink size={14} />
            </a>

            <div className="relative group">
              <div className="h-8 w-8 rounded-full bg-primary-container text-primary-foreground flex items-center justify-center font-bold text-sm overflow-hidden ring-2 ring-transparent group-hover:ring-primary transition-all cursor-pointer">
                {user?.fullName?.charAt(0).toUpperCase() || "A"}
              </div>
              <div className="absolute right-0 mt-2 w-48 bg-surface-low rounded-xl shadow-xl border border-outline-variant/60 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50 overflow-hidden">
                <div className="p-2 flex flex-col gap-1 text-left">
                  <a
                    href={webAppUrl}
                    className="flex items-center gap-2 px-3 py-2 text-sm font-semibold text-foreground hover:bg-surface-high rounded-lg transition-colors"
                  >
                    <ExternalLink size={16} /> Trang khách hàng
                  </a>
                  <div className="h-px bg-outline-variant/60 my-1" />
                  <button
                    onClick={() => {
                      void logout().then(() => router.replace("/login"));
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-sm font-semibold text-red-400 hover:bg-red-500/10 rounded-lg transition-colors cursor-pointer"
                  >
                    <LogOut size={16} /> Đăng xuất
                  </button>
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <div className="p-4 md:p-10 grow max-w-[1600px] w-full mx-auto">
          {children}
        </div>
      </main>

      {/* Mobile Bottom Nav */}
      <nav className="md:hidden fixed bottom-0 left-0 w-full z-50 flex justify-around items-center h-16 pb-safe px-2 shadow-[0px_-4px_20px_rgba(15,23,42,0.08)] bg-surface border-t border-outline-variant/60">
        {navItems.map((item) => {
          const isActive = pathname?.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center justify-center font-body text-[10px] font-semibold transition-all duration-150 w-full h-full ${
                isActive
                  ? "text-primary scale-90"
                  : "text-muted-foreground hover:bg-surface-low"
              }`}
            >
              <item.icon className="w-5 h-5 mb-1" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* Floating Action Button (FAB) for Mobile */}
      <Link
        href="/create-event"
        className="md:hidden fixed bottom-24 right-6 w-14 h-14 bg-primary text-primary-foreground rounded-full shadow-2xl flex items-center justify-center active:scale-95 transition-transform z-40"
      >
        <Plus className="w-8 h-8" />
      </Link>
    </div>
  );
}
