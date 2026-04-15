import { Activity } from "lucide-react";

export function PageLoader() {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-6">
        <div className="relative">
          <div className="w-16 h-16 rounded-2xl bg-[var(--color-platinum-primary)] flex items-center justify-center shadow-lg">
            <Activity className="w-8 h-8 text-white" />
          </div>
          <div className="absolute -inset-3 rounded-3xl border-2 border-[var(--color-platinum-primary)]/20 animate-ping" />
        </div>

        <div className="flex flex-col items-center gap-2">
          <h2 className="text-lg font-bold text-slate-800 tracking-tight">
            PLATINUM <span className="text-[var(--color-platinum-accent)]">PERFORMANCE</span>
          </h2>
          <div className="flex items-center gap-2">
            <div className="flex gap-1">
              <span className="w-2 h-2 rounded-full bg-[var(--color-platinum-primary)] animate-bounce [animation-delay:0ms]" />
              <span className="w-2 h-2 rounded-full bg-[var(--color-platinum-primary)] animate-bounce [animation-delay:150ms]" />
              <span className="w-2 h-2 rounded-full bg-[var(--color-platinum-primary)] animate-bounce [animation-delay:300ms]" />
            </div>
            <p className="text-sm text-slate-400 font-medium">Loading dashboard</p>
          </div>
        </div>

        <div className="w-48 h-1 bg-slate-100 rounded-full overflow-hidden">
          <div className="h-full bg-gradient-to-r from-[var(--color-platinum-primary)] to-[var(--color-platinum-accent)] rounded-full animate-[shimmer_1.5s_ease-in-out_infinite]" />
        </div>
      </div>
    </div>
  );
}
