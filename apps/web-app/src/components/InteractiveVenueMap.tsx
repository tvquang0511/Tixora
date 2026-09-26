"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
import { createPortal } from "react-dom";
import { ZoomIn, ZoomOut, RotateCcw, Maximize2, X, Info } from "lucide-react";
import { ConcertTicketTier } from "@/services/concert.service";

export interface InteractiveVenueMapProps {
  mapUrl?: string;
  ticketTiers?: ConcertTicketTier[];
  selectedTierId?: string | null;
  hoveredTierId?: string | null;
  onSelectTier?: (tierId: string) => void;
  onHoverTier?: (tierId: string | null) => void;
}

export function normalizeName(str: string): string {
  return str
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]/g, "");
}

export function InteractiveVenueMap({
  mapUrl,
  ticketTiers = [],
  selectedTierId,
  hoveredTierId,
  onSelectTier,
  onHoverTier,
}: InteractiveVenueMapProps) {
  const [svgContent, setSvgContent] = useState<string | null>(null);
  const [scale, setScale] = useState(1);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [modalScale, setModalScale] = useState(1);
  const [modalPos, setModalPos] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const dragStart = useRef({ x: 0, y: 0 });

  // Floating tooltip state
  const [tooltip, setTooltip] = useState<{
    visible: boolean;
    x: number;
    y: number;
    tierName: string;
    price?: number;
    isSoldOut?: boolean;
    remaining?: number;
  }>({ visible: false, x: 0, y: 0, tierName: "" });

  const containerRef = useRef<HTMLDivElement>(null);
  const modalContainerRef = useRef<HTMLDivElement>(null);

  // Normalize map URL: if it points to cdn.tixora.local/maps/..., rewrite to /maps/...
  const resolvedUrl = useMemo(() => {
    if (!mapUrl || mapUrl === "https://cdn.tixora.local/maps/default.svg") {
      return "/maps/default.svg";
    }
    if (mapUrl.startsWith("https://cdn.tixora.local/")) {
      return mapUrl.replace("https://cdn.tixora.local/", "/");
    }
    return mapUrl;
  }, [mapUrl]);

  const isSvg = useMemo(
    () =>
      resolvedUrl.endsWith(".svg") ||
      resolvedUrl.includes(".svg?") ||
      resolvedUrl.startsWith("/maps/"),
    [resolvedUrl],
  );

  const [loadedUrl, setLoadedUrl] = useState<string | null>(null);
  const isLoading = isSvg && loadedUrl !== resolvedUrl;

  // Fetch SVG content for inline manipulation
  useEffect(() => {
    let isCancelled = false;

    if (
      !resolvedUrl.endsWith(".svg") &&
      !resolvedUrl.includes(".svg?") &&
      !resolvedUrl.startsWith("/maps/")
    ) {
      return;
    }

    fetch(resolvedUrl)
      .then((res) => {
        if (!res.ok) throw new Error("Failed to load SVG");
        return res.text();
      })
      .then((text) => {
        if (!isCancelled) {
          setSvgContent(text);
          setLoadedUrl(resolvedUrl);
        }
      })
      .catch(() => {
        if (!isCancelled) {
          setSvgContent(null);
          setLoadedUrl(resolvedUrl);
        }
      });

    return () => {
      isCancelled = true;
    };
  }, [resolvedUrl]);

  // Helper to match a zone element with a ticket tier
  const findMatchingTier = React.useCallback(
    (el: Element): ConcertTicketTier | undefined => {
      const zoneId = el.getAttribute("id") || "";
      const zoneCode = el.getAttribute("data-zone-code") || "";
      const cleanId = normalizeName(zoneId);
      const cleanCode = normalizeName(zoneCode);

      return ticketTiers.find((tier) => {
        const tierClean = normalizeName(tier.name);
        const tierId = normalizeName(tier.id || "");
        if (tierId && (tierId === cleanId || tierId === cleanCode)) return true;
        if (
          cleanCode &&
          (tierClean.includes(cleanCode) || cleanCode.includes(tierClean))
        )
          return true;
        if (
          cleanId &&
          (tierClean.includes(cleanId) || cleanId.includes(tierClean))
        )
          return true;
        return false;
      });
    },
    [ticketTiers],
  );

  // Attach interactive hover and click listeners to SVG elements
  const attachZoneListeners = React.useCallback(
    (rootEl: HTMLElement | null) => {
      if (!rootEl) return;

      const shapes = rootEl.querySelectorAll<SVGElement>(
        ".zone-shape, .zone, [data-zone-code], [id^='zone-'], [id^='ZONE_'], [id^='STAND_'], [id^='VIP'], [id^='SVIP'], [id^='GA_'], [id^='FLOOR_'], [id^='DIAMOND_'], [id^='ORCHESTRA_'], [id^='MEZZANINE']",
      );

      shapes.forEach((shape) => {
        const matchedTier = findMatchingTier(shape);

        shape.style.cursor = "pointer";

        // Hover In
        const handleMouseEnter = (e: MouseEvent) => {
          if (matchedTier) {
            onHoverTier?.(matchedTier.id);
            const rect = rootEl.getBoundingClientRect();
            setTooltip({
              visible: true,
              x: e.clientX - rect.left,
              y: e.clientY - rect.top - 10,
              tierName: matchedTier.name,
              price: matchedTier.price,
              isSoldOut:
                matchedTier.remaining_quantity === 0 ||
                matchedTier.status === "sold_out",
              remaining: matchedTier.remaining_quantity,
            });
          }
        };

        // Hover Out
        const handleMouseLeave = () => {
          onHoverTier?.(null);
          setTooltip((prev) => ({ ...prev, visible: false }));
        };

        // Click
        const handleClick = (e: MouseEvent) => {
          e.stopPropagation();
          if (matchedTier) {
            onSelectTier?.(matchedTier.id);
          }
        };

        shape.addEventListener("mouseenter", handleMouseEnter);
        shape.addEventListener("mouseleave", handleMouseLeave);
        shape.addEventListener("click", handleClick);
      });
    },
    [findMatchingTier, onHoverTier, onSelectTier],
  );

  useEffect(() => {
    if (svgContent && containerRef.current) {
      attachZoneListeners(containerRef.current);
    }
  }, [svgContent, attachZoneListeners]);

  useEffect(() => {
    if (isFullscreen && modalContainerRef.current) {
      attachZoneListeners(modalContainerRef.current);
    }
  }, [isFullscreen, svgContent, attachZoneListeners]);

  // Highlight elements when selectedTierId or hoveredTierId changes
  useEffect(() => {
    const updateHighlights = (rootEl: HTMLElement | null) => {
      if (!rootEl) return;
      const shapes = rootEl.querySelectorAll<SVGElement>(
        ".zone-shape, .zone, [data-zone-code], [id]",
      );

      shapes.forEach((shape) => {
        const matchedTier = findMatchingTier(shape);
        if (!matchedTier) return;

        const isSelected = selectedTierId === matchedTier.id;
        const isHovered = hoveredTierId === matchedTier.id;

        if (isSelected || isHovered) {
          shape.classList.add("zone-active");
          shape.style.filter =
            "brightness(1.35) drop-shadow(0 0 10px rgba(255, 255, 255, 0.8))";
          shape.style.stroke = "#ffffff";
          shape.style.strokeWidth = "3.5px";
        } else {
          shape.classList.remove("zone-active");
          shape.style.filter = "";
          shape.style.stroke = "";
          shape.style.strokeWidth = "";
        }
      });
    };

    updateHighlights(containerRef.current);
    if (isFullscreen) updateHighlights(modalContainerRef.current);
  }, [selectedTierId, hoveredTierId, isFullscreen, findMatchingTier]);

  // Fullscreen escape key
  useEffect(() => {
    if (!isFullscreen) return;
    document.body.style.overflow = "hidden";
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIsFullscreen(false);
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isFullscreen]);

  return (
    <div className="relative w-full rounded-2xl bg-slate-950/70 border border-outline-variant/40 overflow-hidden shadow-xl p-4 sm:p-6 transition-all duration-300">
      {/* Header controls bar */}
      <div className="flex items-center justify-between mb-4 pb-3 border-b border-white/10">
        <div className="flex items-center gap-2">
          <span className="inline-block w-2.5 h-2.5 rounded-full bg-primary animate-pulse" />
          <span className="text-xs font-bold uppercase tracking-wider text-on-surface">
            Sơ đồ phân khu thực tế
          </span>
        </div>
        <div className="flex items-center gap-1.5 bg-slate-900/80 p-1 rounded-xl border border-white/10 shadow-sm">
          <button
            type="button"
            onClick={() => setScale((s) => Math.max(s - 0.2, 0.6))}
            title="Thu nhỏ sơ đồ"
            className="p-1.5 text-white/70 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
          >
            <ZoomOut size={16} />
          </button>
          <button
            type="button"
            onClick={() => setScale(1)}
            title="Khôi phục kích thước ban đầu"
            className="p-1.5 text-white/70 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
          >
            <RotateCcw size={15} />
          </button>
          <button
            type="button"
            onClick={() => setScale((s) => Math.min(s + 0.2, 2.5))}
            title="Phóng to sơ đồ"
            className="p-1.5 text-white/70 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
          >
            <ZoomIn size={16} />
          </button>
          <div className="w-px h-4 bg-white/10 mx-1" />
          <button
            type="button"
            onClick={() => {
              setModalScale(1);
              setModalPos({ x: 0, y: 0 });
              setIsFullscreen(true);
            }}
            title="Mở toàn màn hình"
            className="p-1.5 text-primary hover:text-primary-hover hover:bg-primary/10 rounded-lg transition-colors"
          >
            <Maximize2 size={16} />
          </button>
        </div>
      </div>

      {/* SVG Canvas Container */}
      <div
        className="relative w-full h-[340px] sm:h-[440px] flex items-center justify-center overflow-hidden rounded-xl bg-slate-900/40 border border-slate-800/80"
        onMouseMove={(e) => {
          if (tooltip.visible && containerRef.current) {
            const rect = containerRef.current.getBoundingClientRect();
            setTooltip((prev) => ({
              ...prev,
              x: e.clientX - rect.left,
              y: e.clientY - rect.top - 10,
            }));
          }
        }}
      >
        {isLoading ? (
          <div className="flex flex-col items-center justify-center space-y-3">
            <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
            <p className="text-xs text-on-surface-variant font-medium">
              Đang tải sơ đồ khán đài...
            </p>
          </div>
        ) : svgContent ? (
          <div
            ref={containerRef}
            style={{
              transform: `scale(${scale})`,
              transition: "transform 0.2s cubic-bezier(0.2, 0, 0, 1)",
            }}
            className="w-full h-full flex items-center justify-center p-2 select-none [&>svg]:w-full [&>svg]:h-full [&>svg]:max-h-[420px]"
            dangerouslySetInnerHTML={{ __html: svgContent }}
          />
        ) : (
          /* Fallback image rendering */
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={resolvedUrl}
            alt="Venue Map"
            style={{
              transform: `scale(${scale})`,
              transition: "transform 0.2s cubic-bezier(0.2, 0, 0, 1)",
            }}
            className="w-full h-full object-contain p-2 select-none drop-shadow-md"
          />
        )}

        {/* Hover Tooltip */}
        {tooltip.visible && (
          <div
            style={{
              left: `${tooltip.x}px`,
              top: `${tooltip.y}px`,
              transform: "translate(-50%, -100%)",
            }}
            className="pointer-events-none absolute z-40 bg-slate-950/90 backdrop-blur-md border border-white/20 px-3.5 py-2 rounded-xl shadow-2xl space-y-1 text-center min-w-[140px] animate-in fade-in zoom-in-95 duration-150"
          >
            <p className="text-xs font-bold text-white uppercase tracking-wider">
              {tooltip.tierName}
            </p>
            {tooltip.price !== undefined && (
              <p className="text-[13px] font-black text-amber-400">
                {new Intl.NumberFormat("vi-VN").format(tooltip.price)}đ
              </p>
            )}
            <div className="flex items-center justify-center gap-1.5 pt-0.5">
              {tooltip.isSoldOut ? (
                <span className="text-[10px] font-semibold text-rose-400 bg-rose-500/10 px-1.5 py-0.5 rounded">
                  Hết vé
                </span>
              ) : (
                <span className="text-[10px] font-semibold text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded">
                  {tooltip.remaining !== undefined
                    ? `Còn ${tooltip.remaining} vé`
                    : "Đang mở bán"}
                </span>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Interactive Legend Bar */}
      {ticketTiers.length > 0 && (
        <div className="mt-4 pt-3 border-t border-white/10 flex flex-wrap items-center gap-2">
          <span className="text-[11px] font-semibold text-on-surface-variant flex items-center gap-1 mr-1">
            <Info size={13} className="text-primary" /> Phân khu:
          </span>
          {ticketTiers.map((tier) => {
            const isSelected = selectedTierId === tier.id;
            const isHovered = hoveredTierId === tier.id;
            const isSoldOut =
              tier.remaining_quantity === 0 || tier.status === "sold_out";

            return (
              <button
                key={tier.id || tier.name}
                type="button"
                onClick={() => onSelectTier?.(tier.id)}
                onMouseEnter={() => onHoverTier?.(tier.id)}
                onMouseLeave={() => onHoverTier?.(null)}
                className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-medium transition-all duration-200 cursor-pointer border ${
                  isSelected
                    ? "bg-primary text-white border-primary shadow-md scale-105"
                    : isHovered
                      ? "bg-white/15 text-white border-white/40"
                      : isSoldOut
                        ? "bg-white/5 text-white/40 border-white/5 line-through opacity-70"
                        : "bg-white/5 text-white/80 border-white/10 hover:bg-white/10 hover:text-white"
                }`}
              >
                <span className="w-2.5 h-2.5 rounded-full bg-amber-400 shadow-xs" />
                <span>{tier.name}</span>
                <span className="font-bold opacity-90">
                  {new Intl.NumberFormat("vi-VN").format(tier.price)}đ
                </span>
              </button>
            );
          })}
        </div>
      )}

      {/* Fullscreen Interactive Modal */}
      {isFullscreen &&
        typeof document !== "undefined" &&
        createPortal(
          <div
            className="fixed inset-0 z-[150] flex items-center justify-center bg-[#090d16]/98 backdrop-blur-md select-none"
            onClick={() => setIsFullscreen(false)}
            style={{
              backgroundImage: `
                linear-gradient(to right, rgba(255, 255, 255, 0.03) 1px, transparent 1px),
                linear-gradient(to bottom, rgba(255, 255, 255, 0.03) 1px, transparent 1px)
              `,
              backgroundSize: "24px 24px",
            }}
          >
            {/* Close Button */}
            <button
              onClick={() => setIsFullscreen(false)}
              className="absolute top-6 right-6 text-white/70 hover:text-white p-3 bg-white/5 hover:bg-white/10 rounded-full transition-colors z-50 border border-white/10 cursor-pointer"
            >
              <X size={24} />
            </button>

            {/* Modal Controls */}
            <div
              className="absolute bottom-10 flex items-center gap-2 bg-slate-900/80 backdrop-blur-xl p-2 rounded-2xl z-50 border border-white/10 shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={() => setModalScale((s) => Math.max(s - 0.4, 0.5))}
                className="p-3 text-white hover:bg-white/10 rounded-xl transition-colors active:scale-95 cursor-pointer"
                title="Thu nhỏ"
              >
                <ZoomOut size={22} />
              </button>
              <button
                onClick={() => {
                  setModalScale(1);
                  setModalPos({ x: 0, y: 0 });
                }}
                className="p-3 text-white hover:bg-white/10 rounded-xl transition-colors active:scale-95 cursor-pointer"
                title="Khôi phục"
              >
                <RotateCcw size={20} />
              </button>
              <button
                onClick={() => setModalScale((s) => Math.min(s + 0.4, 4))}
                className="p-3 text-white hover:bg-white/10 rounded-xl transition-colors active:scale-95 cursor-pointer"
                title="Phóng to"
              >
                <ZoomIn size={22} />
              </button>
            </div>

            {/* Draggable Fullscreen Canvas */}
            <div
              className={`w-full h-full overflow-hidden flex items-center justify-center ${
                isDragging ? "cursor-grabbing" : "cursor-grab"
              }`}
              onMouseDown={(e) => {
                setIsDragging(true);
                dragStart.current = {
                  x: e.clientX - modalPos.x,
                  y: e.clientY - modalPos.y,
                };
              }}
              onMouseMove={(e) => {
                if (isDragging) {
                  setModalPos({
                    x: e.clientX - dragStart.current.x,
                    y: e.clientY - dragStart.current.y,
                  });
                }
              }}
              onMouseUp={() => setIsDragging(false)}
              onMouseLeave={() => setIsDragging(false)}
              onWheel={(e) => {
                const zoomFactor = 0.1;
                if (e.deltaY < 0) {
                  setModalScale((s) => Math.min(s + zoomFactor, 4));
                } else {
                  setModalScale((s) => Math.max(s - zoomFactor, 0.5));
                }
              }}
              onClick={(e) => e.stopPropagation()}
            >
              {svgContent ? (
                <div
                  ref={modalContainerRef}
                  style={{
                    transform: `translate(${modalPos.x}px, ${modalPos.y}px) scale(${modalScale})`,
                    transition: isDragging
                      ? "none"
                      : "transform 0.2s cubic-bezier(0.2, 0, 0, 1)",
                  }}
                  className="w-full h-full max-w-[1200px] max-h-[85vh] flex items-center justify-center p-6 drop-shadow-2xl [&>svg]:w-full [&>svg]:h-full"
                  dangerouslySetInnerHTML={{ __html: svgContent }}
                />
              ) : (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={resolvedUrl}
                  alt="Fullscreen Seat Map"
                  style={{
                    transform: `translate(${modalPos.x}px, ${modalPos.y}px) scale(${modalScale})`,
                    transition: isDragging
                      ? "none"
                      : "transform 0.2s cubic-bezier(0.2, 0, 0, 1)",
                  }}
                  className="w-full h-full max-w-[1200px] max-h-[85vh] object-contain drop-shadow-2xl"
                />
              )}
            </div>
          </div>,
          document.body,
        )}
    </div>
  );
}
