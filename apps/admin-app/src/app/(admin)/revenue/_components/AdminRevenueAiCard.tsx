"use client";

import { useState } from "react";
import {
  getAdminRevenueAiInsights,
  AdminRevenueAiInsightResponse,
} from "@/services/revenue.service";

export function AdminRevenueAiCard() {
  const [insight, setInsight] = useState<AdminRevenueAiInsightResponse | null>(
    null,
  );
  const [loading, setLoading] = useState<boolean>(false);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [isExpanded, setIsExpanded] = useState<boolean>(false);

  const handleTriggerAnalysis = async (forceRefresh = false) => {
    try {
      if (forceRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      setError(null);
      const data = await getAdminRevenueAiInsights(forceRefresh);
      setInsight(data);
      setIsExpanded(true);
    } catch (err: unknown) {
      console.error("Failed to fetch Admin Revenue AI insights", err);
      setError("Không thể trích xuất báo cáo AI điều hành lúc này.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Trạng thái ban đầu: Chưa bấm kích hoạt phân tích
  if (!insight && !loading && !error) {
    return (
      <div className="card border-slate-200 py-3.5 px-4 bg-white shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[11px] font-bold text-[#0052ff] uppercase tracking-wider">
                EXECUTIVE INTELLIGENCE
              </span>
              <span className="text-[10px] text-slate-500 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                Theo yêu cầu
              </span>
            </div>
            <h3 className="text-sm font-bold text-slate-900 mt-0.5">
              Báo cáo AI Điều hành & Cảnh báo rủi ro toàn sàn
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Đánh giá chuyên sâu về sức khỏe tài chính toàn sàn, mức độ tập
              trung thị phần ban tổ chức và cảnh báo show có nguy cơ lỗ vé.
            </p>
          </div>

          <button
            onClick={() => void handleTriggerAnalysis(false)}
            className="btn btn-primary btn-sm self-start sm:self-auto shrink-0"
          >
            Kích hoạt phân tích AI
          </button>
        </div>
      </div>
    );
  }

  // Trạng thái đang tải
  if (loading) {
    return (
      <div className="card animate-pulse space-y-3.5 p-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="h-4 w-64 bg-slate-200 rounded" />
          <div className="h-7 w-28 bg-slate-200 rounded" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
          <div className="h-24 bg-slate-100 rounded-xl" />
          <div className="h-24 bg-slate-100 rounded-xl" />
        </div>
      </div>
    );
  }

  // Trạng thái lỗi
  if (error && !insight) {
    return (
      <div className="card flex items-center justify-between py-3 px-4 border-rose-200 bg-rose-50/30">
        <span className="text-xs text-rose-700 font-medium">{error}</span>
        <button
          onClick={() => void handleTriggerAnalysis(true)}
          className="btn btn-sm"
        >
          Thử lại
        </button>
      </div>
    );
  }

  // Trạng thái thu gọn
  if (!isExpanded && insight) {
    return (
      <div className="card border-slate-200 py-3 px-4 flex items-center justify-between bg-white">
        <div className="text-xs text-slate-700">
          <span className="font-bold text-slate-900">Báo cáo AI Điều hành</span>
          <span className="mx-2 text-slate-300">|</span>
          <span className="text-slate-500">
            Cập nhật lúc{" "}
            {new Date(insight.analyzed_at).toLocaleTimeString("vi-VN")}
          </span>
          {insight.is_cached && (
            <span className="ml-2 text-[10px] text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">
              Cache 1h
            </span>
          )}
        </div>
        <button
          onClick={() => setIsExpanded(true)}
          className="btn btn-sm text-[#0052ff]"
        >
          Xem chi tiết
        </button>
      </div>
    );
  }

  // Trạng thái mở rộng chi tiết (không icon)
  return (
    <div className="card border-slate-200 p-4 space-y-4 bg-white shadow-xs">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[11px] font-bold text-[#0052ff] uppercase tracking-wider">
              EXECUTIVE INTELLIGENCE
            </span>
            {insight?.is_cached && (
              <span className="text-[10px] text-slate-500 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                Cache 1h
              </span>
            )}
          </div>
          <h2 className="text-sm font-bold text-slate-900 mt-0.5">
            Phân tích số liệu điều hành & Cảnh báo rủi ro toàn sàn
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Dữ liệu tổng hợp thực tế từ toàn bộ giao dịch, các đơn vị tổ chức và
            sự kiện trên sàn Tixora
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            onClick={() => void handleTriggerAnalysis(true)}
            disabled={refreshing}
            className="btn btn-sm"
          >
            {refreshing ? "Đang phân tích..." : "Làm mới"}
          </button>

          <button
            onClick={() => setIsExpanded(false)}
            className="btn btn-sm text-slate-500"
          >
            Thu gọn
          </button>
        </div>
      </div>

      {/* 2 Cột kích thước trọng yếu */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
        {/* Sức khỏe tài chính */}
        <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/50">
          <div className="text-[11px] font-bold text-[#0052ff] uppercase tracking-wider mb-1.5">
            SỨC KHỎE TÀI CHÍNH TOÀN SÀN
          </div>
          <p className="text-xs text-slate-700 leading-relaxed font-normal">
            {insight?.platform_financial_health}
          </p>
        </div>

        {/* Thị phần ban tổ chức */}
        <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/50">
          <div className="text-[11px] font-bold text-indigo-700 uppercase tracking-wider mb-1.5">
            THỊ PHẦN & ĐỐI TÁC TỔ CHỨC
          </div>
          <p className="text-xs text-slate-700 leading-relaxed font-normal">
            {insight?.top_organizers_performance}
          </p>
        </div>
      </div>

      {/* 2 Cột Cảnh báo rủi ro & Chiến lược tăng trưởng */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 pt-1">
        {/* Cảnh báo rủi ro */}
        <div className="p-3.5 rounded-xl border border-rose-200 bg-rose-50/30">
          <div className="text-[11px] font-bold text-rose-700 uppercase tracking-wider mb-2">
            CẢNH BÁO RỦI RO VẬN HÀNH ({insight?.risk_alerts?.length || 0})
          </div>
          <ul className="space-y-1.5">
            {insight?.risk_alerts?.map((risk, idx) => (
              <li
                key={idx}
                className="text-xs text-rose-950 flex items-start gap-1.5 leading-relaxed"
              >
                <span className="font-bold text-rose-600">{idx + 1}.</span>
                <span>{risk}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Chiến lược phát triển */}
        <div className="p-3.5 rounded-xl border border-sky-200 bg-sky-50/30">
          <div className="text-[11px] font-bold text-sky-800 uppercase tracking-wider mb-2">
            CHIẾN LƯỢC TĂNG TRƯỞNG SÀN (
            {insight?.platform_growth_strategies?.length || 0})
          </div>
          <ul className="space-y-1.5">
            {insight?.platform_growth_strategies?.map((strat, idx) => (
              <li
                key={idx}
                className="text-xs text-slate-800 flex items-start gap-1.5 leading-relaxed"
              >
                <span className="font-bold text-[#0052ff]">{idx + 1}.</span>
                <span>{strat}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
