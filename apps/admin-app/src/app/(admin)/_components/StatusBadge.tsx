type StatusBadgeVariant = "user" | "concert" | "order";

interface StatusBadgeProps {
  status: string;
  variant?: StatusBadgeVariant;
  size?: "xs" | "sm";
}

const userStatusClasses: Record<string, string> = {
  ACTIVE: "bg-emerald-50 text-emerald-700 border-emerald-200",
  INACTIVE: "bg-slate-100 text-slate-600 border-slate-200",
  BANNED: "bg-rose-50 text-rose-700 border-rose-200",
  PENDING: "bg-amber-50 text-amber-700 border-amber-200",
};

const concertStatusClasses: Record<string, string> = {
  PUBLISHED: "bg-blue-50 text-[#0b63e5] border-blue-200 font-semibold",
  PAUSED: "bg-amber-50 text-amber-700 border-amber-200",
  COMPLETED: "bg-blue-50 text-[#0b63e5] border-blue-200",
  COMING_SOON: "bg-amber-50 text-amber-700 border-amber-200",
  CANCELLED: "bg-rose-50 text-rose-700 border-rose-200",
  DRAFT: "bg-slate-100 text-slate-600 border-slate-200",
  PENDING_REVIEW: "bg-amber-50 text-amber-700 border-amber-200",
  APPROVED: "bg-blue-50 text-[#0b63e5] border-blue-200",
  REJECTED: "bg-rose-50 text-rose-700 border-rose-200",
};

const orderStatusClasses: Record<string, string> = {
  PAID: "bg-emerald-50 text-emerald-700 border-emerald-200",
  PENDING: "bg-amber-50 text-amber-700 border-amber-200",
  CANCELLED: "bg-rose-50 text-rose-700 border-rose-200",
};

const labelMap: Record<string, string> = {
  PAID: "Đã thanh toán",
  PENDING: "Chờ thanh toán",
  CANCELLED: "Đã hủy",
  PUBLISHED: "Đang mở",
  PAUSED: "Tạm ngưng",
  DRAFT: "Bản nháp",
  PENDING_REVIEW: "Chờ duyệt",
  APPROVED: "Đã duyệt",
  REJECTED: "Đã từ chối",
  COMPLETED: "Đã hoàn thành",
  COMING_SOON: "Sắp diễn ra",
  ACTIVE: "Đang hoạt động",
  INACTIVE: "Ngừng hoạt động",
  BANNED: "Bị khóa",
};

export function StatusBadge({
  status,
  variant = "user",
  size = "xs",
}: StatusBadgeProps) {
  const map =
    variant === "concert"
      ? concertStatusClasses
      : variant === "order"
        ? orderStatusClasses
        : userStatusClasses;

  const colorClass =
    map[status] ?? "bg-slate-100 text-slate-700 border-slate-300";
  const sizeClass =
    size === "xs" ? "text-[11px] px-2.5 py-0.5" : "text-xs px-3 py-1";

  const label = labelMap[status] ?? status.replace("_", " ");

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full font-medium border ${sizeClass} ${colorClass} select-none whitespace-nowrap shadow-2xs`}
    >
      <span className="w-1.5 h-1.5 rounded-full bg-current opacity-80 shrink-0" />
      <span>{label}</span>
    </span>
  );
}
