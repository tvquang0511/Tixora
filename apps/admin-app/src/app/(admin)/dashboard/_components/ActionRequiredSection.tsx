"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  AlertCircle,
  Building2,
  CreditCard,
  ArrowRight,
  CheckCircle2,
} from "lucide-react";
import { getOrganizerRequests } from "@/services/organizer-request.service";
import { getSettlements } from "@/services/revenue.service";

export function ActionRequiredSection() {
  const [pendingOrgCount, setPendingOrgCount] = useState<number>(0);
  const [readySettlementCount, setReadySettlementCount] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    let isMounted = true;
    const loadActions = async () => {
      try {
        setIsLoading(true);
        const [orgRes, settleRes] = await Promise.allSettled([
          getOrganizerRequests({ status: "PENDING", limit: 1 }),
          getSettlements(),
        ]);

        if (isMounted) {
          if (orgRes.status === "fulfilled") {
            setPendingOrgCount(orgRes.value?.meta?.totalItems ?? 0);
          }
          if (settleRes.status === "fulfilled") {
            const count =
              settleRes.value?.items?.filter(
                (item) => item.settlement_status === "READY_FOR_SETTLEMENT",
              ).length ?? 0;
            setReadySettlementCount(count);
          }
        }
      } catch (err) {
        console.error("Failed to load dashboard actions:", err);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    void loadActions();
    return () => {
      isMounted = false;
    };
  }, []);

  const totalActions = pendingOrgCount + readySettlementCount;

  return (
    <section className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-amber-50 text-amber-700 rounded-lg border border-amber-200">
            <AlertCircle className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
              Nhiệm vụ cần xử lý ngay
            </h2>
            <p className="text-xs text-slate-500">
              Các yêu cầu và nghiệp vụ cần phê duyệt từ quản trị viên
            </p>
          </div>
        </div>

        <div>
          {isLoading ? (
            <div className="h-5 w-20 bg-slate-100 rounded-full animate-pulse" />
          ) : totalActions > 0 ? (
            <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-rose-50 text-rose-700 border border-rose-200">
              {totalActions} việc đang chờ
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Hệ thống bình thường</span>
            </span>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
        {/* Item 1: Pending Organizers */}
        <Link
          href="/organizer-requests"
          className="group flex items-center justify-between p-4 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-slate-50 hover:border-teal-300 transition-all"
        >
          <div className="flex items-center gap-3.5">
            <div className="p-2.5 bg-white border border-slate-200 group-hover:border-teal-400 group-hover:text-teal-600 rounded-xl text-slate-600 shadow-2xs transition-colors">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <div className="text-sm font-bold text-slate-900 group-hover:text-teal-900 transition-colors">
                Hồ sơ Ban tổ chức chờ duyệt
              </div>
              <div className="text-xs text-slate-500 mt-0.5">
                {pendingOrgCount > 0 ? (
                  <span className="text-rose-600 font-semibold">
                    Có {pendingOrgCount} hồ sơ đối tác mới cần thẩm định
                  </span>
                ) : (
                  <span>Tất cả hồ sơ đã được xử lý xong</span>
                )}
              </div>
            </div>
          </div>
          <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-teal-600 group-hover:translate-x-1 transition-all" />
        </Link>

        {/* Item 2: Ready for Settlement */}
        <Link
          href="/revenue"
          className="group flex items-center justify-between p-4 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-slate-50 hover:border-teal-300 transition-all"
        >
          <div className="flex items-center gap-3.5">
            <div className="p-2.5 bg-white border border-slate-200 group-hover:border-teal-400 group-hover:text-teal-600 rounded-xl text-slate-600 shadow-2xs transition-colors">
              <CreditCard className="w-5 h-5" />
            </div>
            <div>
              <div className="text-sm font-bold text-slate-900 group-hover:text-teal-900 transition-colors">
                Sự kiện chờ quyết toán giải ngân
              </div>
              <div className="text-xs text-slate-500 mt-0.5">
                {readySettlementCount > 0 ? (
                  <span className="text-amber-700 font-semibold">
                    Có {readySettlementCount} sự kiện đã kết thúc sẵn sàng
                    chuyển tiền
                  </span>
                ) : (
                  <span>Không có sự kiện tồn đọng chuyển khoản</span>
                )}
              </div>
            </div>
          </div>
          <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-teal-600 group-hover:translate-x-1 transition-all" />
        </Link>
      </div>
    </section>
  );
}
