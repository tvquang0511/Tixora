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
    <section className="card space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-blue-50 text-[#0052ff] border border-blue-200 flex items-center justify-center">
            <AlertCircle className="w-4 h-4" />
          </div>
          <div>
            <h2 className="over font-bold text-slate-900">
              Nhiệm vụ cần xử lý ngay
            </h2>
            <p className="sub">
              Các yêu cầu và nghiệp vụ cần phê duyệt từ quản trị viên
            </p>
          </div>
        </div>

        <div>
          {isLoading ? (
            <div className="h-6 w-24 bg-slate-100 rounded-full animate-pulse" />
          ) : totalActions > 0 ? (
            <span className="htcaa-badge-count-pill text-rose-700 bg-rose-50 border-rose-200">
              {totalActions} việc đang chờ
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              <span>Hệ thống bình thường</span>
            </span>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-0.5">
        {/* Item 1: Pending Organizers */}
        <Link
          href="/organizer-requests"
          className="group flex items-center justify-between p-3.5 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-white hover:border-[#0052ff] hover:shadow-xs transition-all duration-150"
        >
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white border border-slate-200 group-hover:border-[#0052ff] group-hover:text-[#0052ff] rounded-lg text-slate-600 shadow-2xs transition-colors">
              <Building2 className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-bold text-slate-900 group-hover:text-[#0052ff] transition-colors">
                Hồ sơ Ban tổ chức chờ duyệt
              </div>
              <div className="sub mt-0.5">
                {pendingOrgCount > 0 ? (
                  <span className="text-rose-700 font-semibold">
                    Có {pendingOrgCount} hồ sơ đối tác mới cần thẩm định
                  </span>
                ) : (
                  <span>Tất cả hồ sơ đã được xử lý xong</span>
                )}
              </div>
            </div>
          </div>
          <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-[#0052ff] group-hover:translate-x-0.5 transition-all" />
        </Link>

        {/* Item 2: Ready for Settlement */}
        <Link
          href="/revenue"
          className="group flex items-center justify-between p-3.5 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-white hover:border-[#0052ff] hover:shadow-xs transition-all duration-150"
        >
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white border border-slate-200 group-hover:border-[#0052ff] group-hover:text-[#0052ff] rounded-lg text-slate-600 shadow-2xs transition-colors">
              <CreditCard className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-bold text-slate-900 group-hover:text-[#0052ff] transition-colors">
                Sự kiện chờ quyết toán giải ngân
              </div>
              <div className="sub mt-0.5">
                {readySettlementCount > 0 ? (
                  <span className="text-amber-800 font-semibold">
                    Có {readySettlementCount} sự kiện đã kết thúc sẵn sàng chuyển tiền
                  </span>
                ) : (
                  <span>Không có sự kiện tồn đọng chuyển khoản</span>
                )}
              </div>
            </div>
          </div>
          <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-[#0052ff] group-hover:translate-x-0.5 transition-all" />
        </Link>
      </div>
    </section>
  );
}
