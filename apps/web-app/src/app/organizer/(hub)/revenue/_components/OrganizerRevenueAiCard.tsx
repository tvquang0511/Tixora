"use client";

import { useEffect, useState } from "react";
import {
  organizerRevenueService,
  OrganizerRevenueAiInsightResponse,
} from "@/services/organizer-revenue.service";
import {
  Sparkles,
  Clock,
  Layers,
  TrendingUp,
  RotateCw,
  Zap,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";

export function OrganizerRevenueAiCard() {
  const [insight, setInsight] =
    useState<OrganizerRevenueAiInsightResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const fetchAiInsights = async (forceRefresh = false) => {
    try {
      if (forceRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      setError(null);
      const data = await organizerRevenueService.getAiInsights(forceRefresh);
      setInsight(data);
    } catch (err: unknown) {
      console.error("Failed to load AI revenue insights", err);
      setError("Chưa thể trích xuất phân tích AI lúc này.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    let isMounted = true;
    const timer = setTimeout(() => {
      void organizerRevenueService
        .getAiInsights(false)
        .then((data) => {
          if (isMounted) setInsight(data);
        })
        .catch((err: unknown) => {
          console.error("Failed to load AI revenue insights", err);
          if (isMounted) setError("Chưa thể trích xuất phân tích AI lúc này.");
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
      <div className="p-5 rounded-3xl bg-slate-900/60 border border-slate-800 animate-pulse">
        <div className="flex items-center justify-between mb-4">
          <div className="h-5 w-48 bg-slate-800 rounded-lg" />
          <div className="h-7 w-24 bg-slate-800 rounded-xl" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="h-24 bg-slate-800/60 rounded-2xl" />
          <div className="h-24 bg-slate-800/60 rounded-2xl" />
          <div className="h-24 bg-slate-800/60 rounded-2xl" />
        </div>
      </div>
    );
  }

  if (error || !insight) {
    return (
      <div className="p-4 rounded-2xl bg-slate-900/40 border border-slate-800/80 flex items-center justify-between">
        <div className="flex items-center gap-2.5 text-slate-400 text-xs">
          <AlertCircle className="w-4 h-4 text-amber-400" />
          <span>{error || "Chưa có nhận xét AI cho kỳ báo cáo này."}</span>
        </div>
        <button
          onClick={() => void fetchAiInsights(true)}
          className="text-xs text-teal-400 hover:text-teal-300 font-medium flex items-center gap-1 transition-colors"
        >
          <RotateCw className="w-3.5 h-3.5" />
          Thử lại
        </button>
      </div>
    );
  }

  return (
    <div className="relative overflow-hidden p-5 rounded-3xl bg-gradient-to-br from-slate-900 via-slate-950 to-slate-900 border border-teal-500/20 shadow-xl shadow-teal-950/20">
      {/* Decorative background glow */}
      <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-800/80">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-teal-500 to-emerald-600 flex items-center justify-center text-white shadow-md shadow-teal-500/20">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-white tracking-tight">
                AI Phân Tích & Chiến Lược Doanh Thu
              </h3>
              {insight.is_cached && (
                <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 border border-slate-700/50">
                  Cache 1h
                </span>
              )}
            </div>
            <p className="text-[11px] text-slate-400">
              Nhận xét tự động từ dữ liệu đặt vé, hành vi người mua và công suất
              khán phòng
            </p>
          </div>
        </div>

        <button
          onClick={() => void fetchAiInsights(true)}
          disabled={refreshing}
          className="self-start sm:self-auto px-3 py-1.5 rounded-xl bg-slate-800/80 hover:bg-slate-800 text-teal-400 border border-slate-700/60 text-xs font-semibold inline-flex items-center gap-1.5 transition-all disabled:opacity-50"
        >
          <RotateCw
            className={`w-3.5 h-3.5 ${refreshing ? "animate-spin" : ""}`}
          />
          <span>{refreshing ? "Đang phân tích..." : "Làm mới AI"}</span>
        </button>
      </div>

      {/* Core Insights Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
        {/* Peak Purchasing Hours */}
        <div className="p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800/80 flex flex-col justify-between">
          <div className="flex items-center gap-2 text-amber-400 text-xs font-semibold mb-2">
            <Clock className="w-3.5 h-3.5" />
            <span>Khung Giờ Mua Vé Vàng</span>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed font-normal">
            {insight.peak_purchasing_hours}
          </p>
        </div>

        {/* Tier Performance */}
        <div className="p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800/80 flex flex-col justify-between">
          <div className="flex items-center gap-2 text-sky-400 text-xs font-semibold mb-2">
            <Layers className="w-3.5 h-3.5" />
            <span>Hiệu Suất Hạng Vé</span>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed font-normal">
            {insight.tier_performance_analysis}
          </p>
        </div>

        {/* Occupancy & Fill Rate */}
        <div className="p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800/80 flex flex-col justify-between">
          <div className="flex items-center gap-2 text-emerald-400 text-xs font-semibold mb-2">
            <TrendingUp className="w-3.5 h-3.5" />
            <span>Tỷ Lệ Lấp Đầy Khán Phòng</span>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed font-normal">
            {insight.occupancy_summary}
          </p>
        </div>
      </div>

      {/* Actionable Tactical Recommendations */}
      {insight.tactical_recommendations?.length > 0 && (
        <div className="mt-4 pt-4 border-t border-slate-800/60">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-teal-400 mb-2.5">
            <Zap className="w-3.5 h-3.5" />
            <span>Đề xuất hành động kích cầu vé (AI Recommendations)</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {insight.tactical_recommendations.map((rec, idx) => (
              <div
                key={idx}
                className="flex items-start gap-2.5 p-3 rounded-xl bg-teal-950/20 border border-teal-500/20 text-xs text-slate-200"
              >
                <CheckCircle2 className="w-3.5 h-3.5 text-teal-400 shrink-0 mt-0.5" />
                <span className="leading-snug">{rec}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
