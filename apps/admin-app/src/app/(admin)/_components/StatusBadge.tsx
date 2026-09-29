type StatusBadgeVariant = "user" | "concert" | "order";

interface StatusBadgeProps {
  status: string;
  variant?: StatusBadgeVariant;
  size?: "xs" | "sm";
}

const userStatusClasses: Record<string, string> = {
  ACTIVE: "bg-emerald-50 text-emerald-800 border-emerald-300",
  INACTIVE: "bg-slate-100 text-slate-700 border-slate-300",
  BANNED: "bg-rose-50 text-rose-800 border-rose-300",
  PENDING: "bg-amber-50 text-amber-800 border-amber-300",
};

const concertStatusClasses: Record<string, string> = {
  PUBLISHED: "bg-emerald-50 text-emerald-800 border-emerald-300",
  COMPLETED: "bg-teal-50 text-teal-800 border-teal-300",
  COMING_SOON: "bg-amber-50 text-amber-800 border-amber-300",
  CANCELLED: "bg-rose-50 text-rose-800 border-rose-300",
  DRAFT: "bg-slate-100 text-slate-700 border-slate-300",
  PENDING_REVIEW: "bg-amber-50 text-amber-800 border-amber-300",
  APPROVED: "bg-teal-50 text-teal-800 border-teal-300",
  REJECTED: "bg-rose-50 text-rose-800 border-rose-300",
};

const orderStatusClasses: Record<string, string> = {
  PAID: "bg-emerald-50 text-emerald-800 border-emerald-300",
  PENDING: "bg-amber-50 text-amber-800 border-amber-300",
  CANCELLED: "bg-rose-50 text-rose-800 border-rose-300",
};

const labelMap: Record<string, string> = {
  PAID: "Đã thanh toán",
  PENDING: "Chờ thanh toán",
  CANCELLED: "Đã hủy",
  PUBLISHED: "Đang mở bán",
  DRAFT: "Bản nháp",
  PENDING_REVIEW: "Chờ duyệt",
  APPROVED: "Đã phê duyệt",
  REJECTED: "Bị từ chối",
  COMPLETED: "Đã hoàn thành",
  COMING_SOON: "Sắp mở bán",
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
    size === "xs" ? "text-[10px] px-1.5 py-0.5" : "text-xs px-2 py-0.5";

  const label = labelMap[status] ?? status.replace("_", " ");

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded font-medium border ${sizeClass} ${colorClass} select-none whitespace-nowrap`}
    >
      <span className="w-1.5 h-1.5 rounded-full bg-current opacity-80 shrink-0" />
      <span>{label}</span>
    </span>
  );
}
