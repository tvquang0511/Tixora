"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import {
  getRevenueSummary,
  getRevenueByOrganizer,
  getRevenueTrend,
  getRevenueByConcert,
  getConcertRevenueDetail,
  type RevenueSummaryResponse,
  type RevenueByOrganizerItem,
  type RevenueTrendItem,
  type RevenueByConcertItem,
  type ConcertRevenueDetailResponse,
} from "@/services/revenue.service";

export type PresetRange = "7d" | "30d" | "90d" | "year" | "all";

export function useAdminRevenue() {
  const getTodayDate = () => new Date().toISOString().slice(0, 10);
  const getDateDaysAgo = (days: number) => {
    const d = new Date();
    d.setDate(d.getDate() - days);
    return d.toISOString().slice(0, 10);
  };

  // Default to 30 days
  const [preset, setPreset] = useState<PresetRange>("30d");
  const [fromDate, setFromDate] = useState<string>(() => getDateDaysAgo(30));
  const [toDate, setToDate] = useState<string>(getTodayDate);
  const [groupBy, setGroupBy] = useState<"day" | "week" | "month">("day");
  const [selectedOrganizerId, setSelectedOrganizerId] = useState<string>("ALL");

  // Temp filter state (for custom inputs)
  const [tempFromDate, setTempFromDate] = useState<string>(() =>
    getDateDaysAgo(30),
  );
  const [tempToDate, setTempToDate] = useState<string>(getTodayDate);
  const [tempOrganizerId, setTempOrganizerId] = useState<string>("ALL");

  const fromDateRef = useRef<HTMLInputElement>(null);
  const toDateRef = useRef<HTMLInputElement>(null);

  // View sub-tab: "organizers" | "concerts"
  const [activeTableTab, setActiveTableTab] = useState<
    "organizers" | "concerts"
  >("organizers");

  // Data states
  const [summary, setSummary] = useState<RevenueSummaryResponse | null>(null);
  const [isSummaryLoading, setIsSummaryLoading] = useState<boolean>(true);

  const [organizers, setOrganizers] = useState<RevenueByOrganizerItem[]>([]);
  const [isOrganizersLoading, setIsOrganizersLoading] = useState<boolean>(true);

  const [trendItems, setTrendItems] = useState<RevenueTrendItem[]>([]);
  const [isTrendLoading, setIsTrendLoading] = useState<boolean>(true);

  const [concertItems, setConcertItems] = useState<RevenueByConcertItem[]>([]);
  const [isConcertsLoading, setIsConcertsLoading] = useState<boolean>(true);

  // Table search and pagination
  const [tableSearch, setTableSearch] = useState<string>("");
  const [currentPage, setCurrentPage] = useState<number>(1);
  const itemsPerPage = 8;

  // Drawer for concert details
  const [selectedConcertId, setSelectedConcertId] = useState<string | null>(
    null,
  );
  const [detailData, setDetailData] =
    useState<ConcertRevenueDetailResponse | null>(null);
  const [isDetailLoading, setIsDetailLoading] = useState<boolean>(false);

  // Chart hover
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  const normalizeDateRange = (from?: string, to?: string) => ({
    from: from || undefined,
    to: to ? `${to}T23:59:59.999Z` : undefined,
  });

  // Fetch summary
  const fetchSummary = useCallback(
    async (fromVal?: string, toVal?: string, orgId?: string) => {
      try {
        setIsSummaryLoading(true);
        const range = normalizeDateRange(fromVal, toVal);
        const res = await getRevenueSummary({
          from: range.from,
          to: range.to,
          organizer_id: orgId && orgId !== "ALL" ? orgId : undefined,
        });
        setSummary(res);
      } catch (err) {
        console.error("Failed to fetch revenue summary:", err);
      } finally {
        setIsSummaryLoading(false);
      }
    },
    [],
  );

  // Fetch organizers
  const fetchOrganizers = useCallback(
    async (fromVal?: string, toVal?: string) => {
      try {
        setIsOrganizersLoading(true);
        const range = normalizeDateRange(fromVal, toVal);
        const res = await getRevenueByOrganizer({
          from: range.from,
          to: range.to,
        });
        setOrganizers(res.items || []);
      } catch (err) {
        console.error("Failed to fetch revenue by organizer:", err);
      } finally {
        setIsOrganizersLoading(false);
      }
    },
    [],
  );

  // Fetch trend
  const fetchTrend = useCallback(
    async (
      fromVal?: string,
      toVal?: string,
      groupVal?: "day" | "week" | "month",
      orgId?: string,
    ) => {
      try {
        setIsTrendLoading(true);
        const range = normalizeDateRange(fromVal, toVal);
        const res = await getRevenueTrend({
          from: range.from,
          to: range.to,
          group_by: groupVal,
          organizer_id: orgId && orgId !== "ALL" ? orgId : undefined,
        });
        setTrendItems(res.items || []);
      } catch (err) {
        console.error("Failed to fetch revenue trend:", err);
      } finally {
        setIsTrendLoading(false);
      }
    },
    [],
  );

  // Fetch concerts
  const fetchConcerts = useCallback(
    async (fromVal?: string, toVal?: string, orgId?: string) => {
      try {
        setIsConcertsLoading(true);
        const range = normalizeDateRange(fromVal, toVal);
        const res = await getRevenueByConcert({
          from: range.from,
          to: range.to,
          limit: 100,
          organizer_id: orgId && orgId !== "ALL" ? orgId : undefined,
        });
        setConcertItems(res.items || []);
      } catch (err) {
        console.error("Failed to fetch revenue by concert:", err);
      } finally {
        setIsConcertsLoading(false);
      }
    },
    [],
  );

  // Load all
  const reloadAll = useCallback(() => {
    fetchSummary(fromDate, toDate, selectedOrganizerId);
    fetchOrganizers(fromDate, toDate);
    fetchTrend(fromDate, toDate, groupBy, selectedOrganizerId);
    fetchConcerts(fromDate, toDate, selectedOrganizerId);
  }, [
    fromDate,
    toDate,
    groupBy,
    selectedOrganizerId,
    fetchSummary,
    fetchOrganizers,
    fetchTrend,
    fetchConcerts,
  ]);

  useEffect(() => {
    const timer = setTimeout(() => {
      reloadAll();
    }, 0);
    return () => clearTimeout(timer);
  }, [reloadAll]);

  // Apply preset
  const handleSelectPreset = (p: PresetRange) => {
    setPreset(p);
    let newFrom = fromDate;
    const newTo = getTodayDate();

    if (p === "7d") newFrom = getDateDaysAgo(7);
    else if (p === "30d") newFrom = getDateDaysAgo(30);
    else if (p === "90d") newFrom = getDateDaysAgo(90);
    else if (p === "year") newFrom = getDateDaysAgo(365);
    else if (p === "all") newFrom = "2025-01-01";

    setFromDate(newFrom);
    setToDate(newTo);
    setTempFromDate(newFrom);
    setTempToDate(newTo);
    setCurrentPage(1);
  };

  // Apply custom dates & organizer
  const handleApplyFilters = () => {
    setFromDate(tempFromDate);
    setToDate(tempToDate);
    setSelectedOrganizerId(tempOrganizerId);
    setCurrentPage(1);
  };

  // Filter directly by an organizer (e.g. from the table)
  const handleFilterByOrganizer = (orgId: string) => {
    setSelectedOrganizerId(orgId);
    setTempOrganizerId(orgId);
    setActiveTableTab("concerts");
    setCurrentPage(1);
  };

  // Reset
  const handleResetFilters = () => {
    const dFrom = getDateDaysAgo(30);
    const dTo = getTodayDate();
    setPreset("30d");
    setFromDate(dFrom);
    setToDate(dTo);
    setTempFromDate(dFrom);
    setTempToDate(dTo);
    setSelectedOrganizerId("ALL");
    setTempOrganizerId("ALL");
    setGroupBy("day");
    setTableSearch("");
    setCurrentPage(1);
  };

  // Fetch concert detail
  const handleOpenConcertDetail = async (concertId: string) => {
    try {
      setSelectedConcertId(concertId);
      setIsDetailLoading(true);
      // Fetch full lifecycle without date restrictions so the entire sales timeline is shown
      const detail = await getConcertRevenueDetail(concertId);
      setDetailData(detail);
    } catch (err) {
      console.error("Failed to load concert detail:", err);
    } finally {
      setIsDetailLoading(false);
    }
  };

  const handleCloseDetail = () => {
    setSelectedConcertId(null);
    setDetailData(null);
  };

  // Filtered & Paginated Organizers
  const filteredOrganizers = organizers.filter((org) => {
    if (!tableSearch) return true;
    const q = tableSearch.toLowerCase();
    return (
      org.organization_name.toLowerCase().includes(q) ||
      org.contact_name.toLowerCase().includes(q) ||
      org.email.toLowerCase().includes(q)
    );
  });

  // Filtered & Paginated Concerts
  const filteredConcerts = concertItems.filter((c) => {
    if (!tableSearch) return true;
    const q = tableSearch.toLowerCase();
    return (
      c.concert_name.toLowerCase().includes(q) ||
      (c.organizer_name && c.organizer_name.toLowerCase().includes(q)) ||
      (c.location && c.location.toLowerCase().includes(q))
    );
  });

  const totalPages = Math.ceil(
    (activeTableTab === "organizers"
      ? filteredOrganizers.length
      : filteredConcerts.length) / itemsPerPage,
  );

  const paginatedOrganizers = filteredOrganizers.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage,
  );

  const paginatedConcerts = filteredConcerts.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage,
  );

  return {
    preset,
    fromDate,
    toDate,
    groupBy,
    setGroupBy,
    selectedOrganizerId,
    tempFromDate,
    setTempFromDate,
    tempToDate,
    setTempToDate,
    tempOrganizerId,
    setTempOrganizerId,
    fromDateRef,
    toDateRef,
    activeTableTab,
    setActiveTableTab,
    summary,
    isSummaryLoading,
    organizers,
    isOrganizersLoading,
    trendItems,
    isTrendLoading,
    concertItems,
    isConcertsLoading,
    filteredOrganizers,
    paginatedOrganizers,
    filteredConcerts,
    paginatedConcerts,
    tableSearch,
    setTableSearch,
    currentPage,
    setCurrentPage,
    totalPages,
    itemsPerPage,
    selectedConcertId,
    detailData,
    isDetailLoading,
    hoveredIndex,
    setHoveredIndex,
    handleSelectPreset,
    handleApplyFilters,
    handleFilterByOrganizer,
    handleResetFilters,
    handleOpenConcertDetail,
    handleCloseDetail,
    reloadAll,
  };
}
