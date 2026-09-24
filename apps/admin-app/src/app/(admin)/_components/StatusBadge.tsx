type StatusBadgeVariant = "user" | "concert" | "order";

interface StatusBadgeProps {
  status: string;
  variant?: StatusBadgeVariant;
  size?: "xs" | "sm";
}

const userStatusClasses: Record<string, string> = {
  ACTIVE: "bg-emerald-50 text-emerald-700 border-emerald-300",
  INACTIVE: "bg-slate-100 text-slate-600 border-slate-300",
  BANNED: "bg-rose-50 text-rose-700 border-rose-300",
  PENDING: "bg-amber-50 text-amber-700 border-amber-300",
};

const concertStatusClasses: Record<string, string> = {
  PUBLISHED: "bg-emerald-50 text-emerald-700 border-emerald-300",
  COMPLETED: "bg-blue-50 text-blue-700 border-blue-300",
  COMING_SOON: "bg-amber-50 text-amber-700 border-amber-300",
  CANCELLED: "bg-rose-50 text-rose-700 border-rose-300",
  DRAFT: "bg-slate-100 text-slate-600 border-slate-300",
};

const orderStatusClasses: Record<string, string> = {
  PAID: "bg-emerald-50 text-emerald-700 border-emerald-300",
  PENDING: "bg-amber-50 text-amber-700 border-amber-300",
  CANCELLED: "bg-rose-50 text-rose-700 border-rose-300",
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
    map[status] ?? "bg-slate-100 text-slate-600 border-slate-300";
  const sizeClass =
    size === "xs" ? "text-[10px] px-2 py-0.5" : "text-[11px] px-2.5 py-0.5";

  return (
    <span
      className={`inline-flex items-center rounded-none font-mono font-semibold border uppercase tracking-wider ${sizeClass} ${colorClass}`}
    >
      {status.replace("_", " ")}
    </span>
  );
}
