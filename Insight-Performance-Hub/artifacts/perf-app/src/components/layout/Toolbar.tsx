import { useGetCurrentUser } from "@workspace/api-client-react";
import { Bell, Search, Menu } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

export function Toolbar() {
  const { data: user } = useGetCurrentUser();

  return (
    <header className="h-14 bg-white border-b border-border sticky top-0 z-10 px-4 flex items-center justify-between shadow-sm">
      <div className="flex items-center gap-4">
        <button className="md:hidden p-2 text-slate-500 hover:bg-slate-100 rounded-md">
          <Menu className="w-5 h-5" />
        </button>
        <h1 className="text-sm font-semibold text-slate-800 hidden sm:block">Demo Municipality</h1>
        <span className="hidden sm:inline-flex items-center bg-green-50 text-green-700 text-xs font-semibold px-3 py-1 rounded-full border border-green-200">
          FY 2024/2025
        </span>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative hidden md:block">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input 
            type="text" 
            placeholder="Search..." 
            className="h-9 pl-9 pr-4 rounded-full bg-slate-100 border-none text-sm focus:ring-2 focus:ring-platinum-primary/20 outline-none w-64 transition-all"
          />
        </div>
        
        <button className="relative p-2 text-slate-500 hover:bg-slate-100 rounded-full transition-colors">
          <Bell className="w-5 h-5" />
          <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
        </button>
        
        <div className="flex items-center gap-3 pl-4 border-l border-border">
          <div className="hidden md:flex flex-col items-end">
            <span className="text-sm font-semibold text-slate-800 leading-none">{user?.displayName || 'Admin User'}</span>
            <span className="text-xs text-slate-500 mt-1">{user?.role || 'System Administrator'}</span>
          </div>
          <Avatar className="w-8 h-8 bg-platinum-primary text-white font-semibold shadow-sm border border-platinum-primary/20">
            <AvatarFallback className="bg-platinum-primary text-white">
              {user?.displayName?.substring(0, 2).toUpperCase() || 'AD'}
            </AvatarFallback>
          </Avatar>
        </div>
      </div>
    </header>
  );
}
