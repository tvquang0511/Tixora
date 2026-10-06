"use client";

import { ReactNode, useState, useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import {
  User as UserIcon,
  Ticket,
  Building2,
  LayoutDashboard,
  Compass,
  LogOut,
  AlertTriangle,
  ArrowRight,
} from "lucide-react";
import { NotificationBell } from "@/components/notification-bell";

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
  const isAdmin =
    user?.roles?.some((role) =>
      ["admin", "superadmin", "super_admin"].includes(role.toLowerCase()),
    ) || false;

  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center text-slate-400">
        <div className="animate-spin w-8 h-8 border-2 border-teal-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!isAuthenticated || !isOrganizer) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
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
              className="w-full py-3 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 text-sm font-bold shadow-lg shadow-teal-500/25 inline-flex items-center justify-center gap-2"
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
    { href: "/organizer/dashboard", label: "Tổng quan" },
    { href: "/organizer/events", label: "Sự kiện" },
    { href: "/organizer/profile", label: "Hồ sơ đối tác" },
  ];

  return (
    <div className="min-h-screen bg-slate-900 text-on-surface flex flex-col">
      {/* Top Header - Aligned with Web App Style */}
      <header className="sticky top-0 z-40 border-b border-slate-900 bg-slate-950/80 backdrop-blur-md shadow-sm">
        <div className="mx-auto flex w-full max-w-7xl items-center justify-between px-4 py-3.5 sm:px-6 lg:px-8">
          {/* Brand & Left Navigation */}
          <div className="flex items-center gap-8">
            <Link
              href="/"
              className="shrink-0 transition-opacity hover:opacity-80"
            >
              <span className="font-display text-2xl font-black italic tracking-tight text-teal-400">
                Tixora
              </span>
            </Link>

            <nav className="hidden md:flex items-center gap-6 text-sm font-bold">
              {navLinks.map((item) => {
                const isActive =
                  item.href === "/organizer/dashboard"
                    ? pathname === "/organizer/dashboard"
                    : item.href === "/organizer/profile"
                      ? pathname.startsWith("/organizer/profile")
                      : pathname.startsWith("/organizer/events");
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`relative transition-colors hover:text-teal-400 ${
                      isActive
                        ? "text-teal-400 font-bold"
                        : "text-slate-400 hover:text-white"
                    }`}
                  >
                    {item.label}
                  </Link>
                );
              })}
            </nav>
          </div>

          {/* Right Action: Notification Bell & Avatar Dropdown */}
          <div className="flex items-center gap-3">
            <NotificationBell />

            <div className="relative group" ref={dropdownRef}>
              <button
                type="button"
                onClick={() => setIsDropdownOpen((prev) => !prev)}
                className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-tr from-teal-500 to-emerald-400 text-slate-950 font-bold shadow-md shadow-teal-500/10 ring-2 ring-transparent transition-all duration-200 hover:ring-teal-400/45 hover:shadow-lg active:scale-95 cursor-pointer"
                aria-expanded={isDropdownOpen}
                aria-label="Tài khoản Ban Tổ Chức"
              >
                {user?.fullName?.charAt(0).toUpperCase() || "O"}
              </button>

              {/* Dropdown Menu - Exactly matches Web App SiteShell */}
              <div
                className={`absolute right-0 mt-3 w-56 origin-top-right rounded-2xl border border-slate-800 bg-[#16222f]/95 backdrop-blur-md shadow-2xl ring-1 ring-black/5
                transition-all duration-200 ease-out z-50 overflow-hidden ${
                  isDropdownOpen
                    ? "opacity-100 visible translate-y-0 scale-100"
                    : "opacity-0 invisible translate-y-1 scale-95 group-hover:opacity-100 group-hover:visible group-hover:translate-y-0 group-hover:scale-100"
                }`}
              >
                <div className="p-1.5 flex flex-col gap-0.5 text-left">
                  <Link
                    href="/profile"
                    onClick={() => setIsDropdownOpen(false)}
                    className="flex items-center gap-2.5 px-3 py-2.5 text-sm font-semibold text-on-surface-variant/90 hover:bg-slate-900 hover:text-on-surface rounded-xl transition-colors"
                  >
                    <UserIcon
                      size={16}
                      className="text-on-surface-variant/70"
                    />{" "}
                    Hồ sơ cá nhân
                  </Link>
                  <Link
                    href="/my-tickets"
                    onClick={() => setIsDropdownOpen(false)}
                    className="flex items-center gap-2.5 px-3 py-2.5 text-sm font-semibold text-on-surface-variant/90 hover:bg-slate-900 hover:text-on-surface rounded-xl transition-colors"
                  >
                    <Ticket size={16} className="text-on-surface-variant/70" />{" "}
                    Thư viện vé
                  </Link>
                  <Link
                    href="/"
                    onClick={() => setIsDropdownOpen(false)}
                    className="flex items-center gap-2.5 px-3 py-2.5 text-sm font-semibold text-teal-400 hover:bg-slate-900 rounded-xl transition-colors"
                  >
                    <Compass size={16} className="text-teal-400" /> Website bán
                    vé
                  </Link>
                  <Link
                    href="/organizer/profile"
                    onClick={() => setIsDropdownOpen(false)}
                    className="flex items-center gap-2.5 px-3 py-2.5 text-sm font-semibold text-on-surface-variant/90 hover:bg-slate-900 hover:text-on-surface rounded-xl transition-colors"
                  >
                    <Building2
                      size={16}
                      className="text-on-surface-variant/70"
                    />{" "}
                    Hồ sơ đối tác
                  </Link>

                  {isAdmin && (
                    <a
                      href={
                        process.env.NEXT_PUBLIC_ADMIN_URL ||
                        "http://localhost:3002"
                      }
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center gap-2.5 px-3 py-2.5 text-sm font-semibold text-amber-400 hover:bg-slate-900 rounded-xl transition-colors"
                    >
                      <LayoutDashboard size={16} className="text-amber-400" />{" "}
                      Quản trị sàn (Admin)
                    </a>
                  )}

                  <div className="h-px bg-slate-850 my-1.5 mx-1" />

                  <button
                    onClick={() => {
                      setIsDropdownOpen(false);
                      void logout().then(() => router.replace("/login"));
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2.5 text-sm font-bold text-rose-500 hover:bg-rose-500/10 rounded-xl transition-colors cursor-pointer text-left"
                  >
                    <LogOut size={16} /> Đăng xuất
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Mobile Sub Navigation */}
        <div className="flex md:hidden items-center justify-around border-t border-slate-900 py-2.5 bg-slate-950/95 backdrop-blur-md">
          {navLinks.map((item) => {
            const isActive =
              item.href === "/organizer/dashboard"
                ? pathname === "/organizer/dashboard"
                : pathname.startsWith("/organizer/events");
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`px-4 py-1 text-xs font-semibold rounded-lg transition-colors ${
                  isActive
                    ? "text-teal-400 font-bold bg-teal-500/10"
                    : "text-slate-400"
                }`}
              >
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
