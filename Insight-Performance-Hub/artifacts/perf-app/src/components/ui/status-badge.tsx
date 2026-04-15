import { cn } from "@/lib/utils";

type StatusBadgeProps = {
  status: string;
  className?: string;
};

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const normalized = status.toLowerCase();
  
  let colors = "bg-slate-100 text-slate-600"; // default Draft
  
  if (["approved", "completed", "open", "active"].includes(normalized)) {
    colors = "bg-green-50 text-green-700 border-green-200/50";
  } else if (["submitted", "in progress"].includes(normalized)) {
    colors = "bg-blue-50 text-blue-700 border-blue-200/50";
  } else if (["pending", "review"].includes(normalized)) {
    colors = "bg-orange-50 text-orange-700 border-orange-200/50";
  } else if (["rejected", "cancelled", "closed", "archived"].includes(normalized)) {
    colors = "bg-red-50 text-red-700 border-red-200/50";
  } else if (["returned"].includes(normalized)) {
    colors = "bg-amber-50 text-amber-700 border-amber-200/50";
  }

  return (
    <span className={cn(
      "inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wide border",
      colors,
      className
    )}>
      {status}
    </span>
  );
}
