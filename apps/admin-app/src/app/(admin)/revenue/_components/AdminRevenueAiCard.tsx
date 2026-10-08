"use client";

import { useEffect, useState } from "react";
import {
  getAdminRevenueAiInsights,
  AdminRevenueAiInsightResponse,
} from "@/services/revenue.service";
import {
  Sparkles,
  TrendingUp,
  Building2,
  AlertTriangle,
  Lightbulb,
  RotateCw,
  ShieldAlert,
} from "lucide-react";

export function AdminRevenueAiCard() {
  const [insight, setInsight] = useState<AdminRevenueAiInsightResponse | null>(
    null,
  );
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const handleRefresh = async () => {
    try {
      setRefreshing(true);
      setError(null);
      const data = await getAdminRevenueAiInsights(true);
      setInsight(data);
    } catch (err: unknown) {
      console.error("Failed to refresh Admin Revenue AI insights", err);
      setError("Không thể cập nhật báo cáo AI điều hành.");
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    let isMounted = true;
    const timer = setTimeout(() => {
      void getAdminRevenueAiInsights(false)
        .then((data) => {
          if (isMounted) setInsight(data);
        })
        .catch((err: unknown) => {
          console.error("Failed to fetch Admin Revenue AI insights", err);
          if (isMounted) setError("Chưa thể trích xuất báo cáo AI lúc này.");
        })
        .finally(() => {
          if (isMounted) setLoading(false);
        });
    }, 0);

    return () => {
      isMounted = false;
      clearTimeout(timer);
    };
  }, []);

  if (loading) {
    return (
      <div className="card animate-pulse space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="h-6 w-64 bg-slate-200 rounded" />
          <div className="h-8 w-24 bg-slate-200 rounded" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="h-28 bg-slate-100 rounded-xl" />
          <div className="h-28 bg-slate-100 rounded-xl" />
        </div>
      </div>
    );
  }

  if (error || !insight) {
    return (
      <div className="card flex items-center justify-between py-3">
        <div className="flex items-center gap-2 text-slate-500 text-xs">
          <ShieldAlert className="w-4 h-4 text-amber-500" />
          <span>{error || "Chưa có nhận định điều hành toàn sàn."}</span>
        </div>
        <button onClick={handleRefresh} className="btn btn-sm" title="Thử lại">
          <RotateCw size={13} />
          <span>Thử lại</span>
        </button>
      </div>
    );
  }

  return (
    <div className="card border-blue-200/80 bg-gradient-to-b from-white to-slate-50/50 shadow-sm space-y-4">
      {/* Executive Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200/80">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-[#0052ff]/10 text-[#0052ff] flex items-center justify-center shrink-0">
            <Sparkles size={18} />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-base font-bold text-slate-900 tracking-tight m-0">
                AI Phân Tích & Báo Cáo Điều Hành Toàn Sàn
              </h2>
              <span className="htcaa-badge-count-pill text-xs">
                Executive Intelligence
              </span>
              {insight.is_cached && (
                <span className="text-[11px] font-medium text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full border border-slate-200">
                  Cache 1h
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Đánh giá tự động sức khỏe tài chính hệ thống, mức độ tập trung thị
              phần và rủi ro hoạt động
            </p>
          </div>
        </div>

        <button
          onClick={handleRefresh}
          disabled={refreshing}
          className="btn btn-sm self-start sm:self-auto"
          title="Tạo báo cáo AI mới"
        >
          <RotateCw size={13} className={refreshing ? "animate-spin" : ""} />
          <span>{refreshing ? "Đang phân tích..." : "Làm mới AI"}</span>
        </button>
      </div>

      {/* Top 2 Core Dimensions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Financial Health */}
        <div className="p-4 rounded-xl border border-slate-200 bg-white">
          <div className="flex items-center gap-2 text-[#0052ff] text-xs font-bold uppercase tracking-wider mb-2">
            <TrendingUp size={15} />
            <span>Sức Khỏe Tài Chính Nền Tảng</span>
          </div>
          <p className="text-xs text-slate-700 leading-relaxed font-normal">
            {insight.platform_financial_health}
          </p>
        </div>

        {/* Top Organizers Performance */}
        <div className="p-4 rounded-xl border border-slate-200 bg-white">
          <div className="flex items-center gap-2 text-indigo-700 text-xs font-bold uppercase tracking-wider mb-2">
            <Building2 size={15} />
            <span>Hiệu Suất & Thị Phần Ban Tổ Chức</span>
          </div>
          <p className="text-xs text-slate-700 leading-relaxed font-normal">
            {insight.top_organizers_performance}
          </p>
        </div>
      </div>

      {/* Bottom Insights: Risk Alerts & Growth Strategies */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
        {/* Risk Alerts */}
        <div className="p-4 rounded-xl border border-rose-200/80 bg-rose-50/50">
          <div className="flex items-center gap-2 text-rose-700 text-xs font-bold uppercase tracking-wider mb-2.5">
            <AlertTriangle size={15} />
            <span>
              Cảnh Báo Rủi Ro Vận Hành ({insight.risk_alerts?.length || 0})
            </span>
          </div>
          <ul className="space-y-2">
            {insight.risk_alerts?.map((risk, idx) => (
              <li
                key={idx}
                className="text-xs text-rose-950 flex items-start gap-2 leading-relaxed"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-rose-500 shrink-0 mt-1.5" />
                <span>{risk}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Growth Strategies */}
        <div className="p-4 rounded-xl border border-sky-200/80 bg-sky-50/40">
          <div className="flex items-center gap-2 text-sky-800 text-xs font-bold uppercase tracking-wider mb-2.5">
            <Lightbulb size={15} />
            <span>
              Chiến Lược Tối Ưu Tăng Trưởng (
              {insight.platform_growth_strategies?.length || 0})
            </span>
          </div>
          <ul className="space-y-2">
            {insight.platform_growth_strategies?.map((strat, idx) => (
              <li
                key={idx}
                className="text-xs text-slate-800 flex items-start gap-2 leading-relaxed"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-[#0052ff] shrink-0 mt-1.5" />
                <span>{strat}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
