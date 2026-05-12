import { ReactNode } from "react";
import { Sidebar } from "./Sidebar";
import { Toolbar } from "./Toolbar";
import { useLocation } from "wouter";

function isEmbedded(): boolean {
  if (typeof window === "undefined") return false;
  try {
    const params = new URLSearchParams(window.location.search);
    if (params.get("embedded") === "1") return true;
  } catch {}
  try {
    if (window.self !== window.top) return true;
  } catch {
    return true;
  }
  return false;
}

export function AppLayout({ children }: { children: ReactNode }) {
  const [location] = useLocation();
  const embedded = isEmbedded();

  // Create breadcrumbs from location
  const pathParts = location.split('/').filter(Boolean);

  if (embedded) {
    return (
      <div className="min-h-screen bg-background text-foreground">
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-[1600px] w-full mx-auto">
          {children}
        </main>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-background text-foreground">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <Toolbar />

        {/* Breadcrumb Bar */}
        <div className="bg-slate-50 border-b border-border px-6 py-2.5 hidden sm:block">
          <div className="flex items-center gap-2 text-sm">
            <span className="text-slate-500 font-medium hover:text-blue-600 cursor-pointer transition-colors">Home</span>
            {pathParts.length > 0 && <span className="text-slate-300">/</span>}
            {pathParts.map((part, index) => {
              const isLast = index === pathParts.length - 1;
              const formatted = part.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
              return (
                <div key={part} className="flex items-center gap-2">
                  <span className={isLast ? "text-slate-800 font-semibold" : "text-slate-500 font-medium"}>
                    {formatted}
                  </span>
                  {!isLast && <span className="text-slate-300">/</span>}
                </div>
              );
            })}
          </div>
        </div>

        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-[1600px] w-full mx-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
