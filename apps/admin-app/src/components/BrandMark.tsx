import React from "react";

export function BrandMark({ compact = false }: { compact?: boolean }) {
  return (
    <div className="flex items-center gap-3">
      <svg
        className={compact ? "h-9 w-9" : "h-10 w-10"}
        viewBox="0 0 200 200"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        <defs>
          <linearGradient
            id="tixora-brand-gradient"
            x1="0%"
            y1="0%"
            x2="100%"
            y2="100%"
          >
            <stop offset="0%" stopColor="#4f46e5" />
            <stop offset="100%" stopColor="#7c3aed" />
          </linearGradient>
        </defs>
        <path
          d="M40 60Q40 50 50 50H150Q160 50 160 60V85Q150 100 160 115V140Q160 150 150 150H50Q40 150 40 140V115Q50 100 40 85Z"
          fill="url(#tixora-brand-gradient)"
        />
        <rect
          x="85"
          y="85"
          width="30"
          height="30"
          rx="4"
          fill="white"
          transform="rotate(45 100 100)"
        />
      </svg>
      <div>
        <div className="font-display text-xl font-black italic tracking-tight text-primary">
          Tixora Admin
        </div>
        {!compact ? (
          <div className="text-xs font-semibold uppercase tracking-[0.22em] text-on-surface-variant">
            Management Portal
          </div>
        ) : null}
      </div>
    </div>
  );
}
