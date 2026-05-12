import { Link, useLocation } from "wouter";
import { useState } from "react";
import { 
  ChevronDown, LayoutDashboard, Settings, Layers, Calendar, 
  BarChart2, FileText, Bell, ShieldAlert, Activity, Users,
  ListTodo, Clock, Network, Building2, Target, UserCheck,
  ClipboardCheck, TrendingUp, Scale, BookOpen, Brain, Shield,
  FileSearch, ShieldCheck, RefreshCw
} from "lucide-react";
import { cn } from "@/core/lib/utils";
import { useAuth } from "@/core/hooks/useAuth";

type NavItem = {
  title: string;
  href: string;
  icon: React.ReactNode;
};

type NavGroup = {
  title: string;
  icon: React.ReactNode;
  items: NavItem[];
};

const navigation: (NavItem | NavGroup)[] = [
  {
    title: "Dashboard",
    href: "/",
    icon: <LayoutDashboard className="w-5 h-5" />
  },
  {
    title: "Original SDBIP",
    icon: <Building2 className="w-5 h-5" />,
    items: [
      { title: "Capture SDBIP", href: "/org-planning/scorecards", icon: <ClipboardCheck className="w-4 h-4" /> },
      { title: "Review SDBIP", href: "/org-planning/review-sdbip", icon: <FileSearch className="w-4 h-4" /> },
      { title: "Approve SDBIP", href: "/org-planning/approve-sdbip", icon: <ShieldCheck className="w-4 h-4" /> },
      { title: "Targets & Activities", href: "/org-planning/quarterly-targets", icon: <Calendar className="w-4 h-4" /> },
      { title: "SDBIP Overview", href: "/sdbip/overview", icon: <Target className="w-4 h-4" /> },
    ]
  },
  {
    title: "Revised SDBIP",
    icon: <RefreshCw className="w-5 h-5" />,
    items: [
      { title: "Revise SDBIP", href: "/revised-sdbip/capture", icon: <ClipboardCheck className="w-4 h-4" /> },
      { title: "Review Revised SDBIP", href: "/revised-sdbip/review", icon: <FileSearch className="w-4 h-4" /> },
      { title: "Approve Revised SDBIP", href: "/revised-sdbip/approve", icon: <ShieldCheck className="w-4 h-4" /> },
    ]
  },
  {
    title: "Departmental",
    icon: <Users className="w-5 h-5" />,
    items: [
      { title: "Dept Scorecards", href: "/departmental/scorecards", icon: <ClipboardCheck className="w-4 h-4" /> },
      { title: "KPI Assignments", href: "/departmental/kpi-assignments", icon: <Target className="w-4 h-4" /> },
    ]
  },
  {
    title: "Individual",
    icon: <UserCheck className="w-5 h-5" />,
    items: [
      { title: "My Performance", href: "/individual/my-performance", icon: <TrendingUp className="w-4 h-4" /> },
      { title: "Agreements", href: "/individual/agreements", icon: <FileText className="w-4 h-4" /> },
      { title: "Reviewer Config", href: "/individual/reviewers", icon: <UserCheck className="w-4 h-4" /> },
      { title: "Competencies", href: "/individual/competencies", icon: <BookOpen className="w-4 h-4" /> },
      { title: "Assessments", href: "/individual/assessments", icon: <ClipboardCheck className="w-4 h-4" /> },
    ]
  },
  {
    title: "Actuals & Evidence",
    icon: <ClipboardCheck className="w-5 h-5" />,
    items: [
      { title: "Submit Actuals", href: "/actuals/submit", icon: <FileText className="w-4 h-4" /> },
      { title: "Review - Line Manager", href: "/actuals/review-line-manager", icon: <UserCheck className="w-4 h-4" /> },
      { title: "Review - Director", href: "/actuals/review-director", icon: <UserCheck className="w-4 h-4" /> },
      { title: "Review - PMS Manager", href: "/actuals/review-pms-manager", icon: <UserCheck className="w-4 h-4" /> },
      { title: "Review - PMS Director", href: "/actuals/review-pms-director", icon: <UserCheck className="w-4 h-4" /> },
      { title: "Review - Internal Audit", href: "/actuals/review-internal-audit", icon: <ShieldCheck className="w-4 h-4" /> },
      { title: "Corrective Actions", href: "/actuals/corrective-actions", icon: <ShieldAlert className="w-4 h-4" /> },
    ]
  },
  {
    title: "Moderation",
    icon: <Scale className="w-5 h-5" />,
    items: [
      { title: "Review Queue", href: "/moderation/queue", icon: <ListTodo className="w-4 h-4" /> },
      { title: "Moderation Panel", href: "/moderation/panel", icon: <Scale className="w-4 h-4" /> },
    ]
  },
  {
    title: "Reports",
    icon: <BookOpen className="w-5 h-5" />,
    items: [
      { title: "Report Centre", href: "/reports/centre", icon: <FileText className="w-4 h-4" /> },
      { title: "Standard Reports", href: "/reports/standard", icon: <FileText className="w-4 h-4" /> },
      { title: "Custom Reports", href: "/reports/custom", icon: <BarChart2 className="w-4 h-4" /> },
    ]
  },
  {
    title: "AI Insights",
    href: "/ai-insights",
    icon: <Brain className="w-5 h-5" />
  },
  {
    title: "Integrations",
    href: "/integrations",
    icon: <Network className="w-5 h-5" />
  },
  {
    title: "Audit Trail",
    href: "/audit-trail",
    icon: <ShieldAlert className="w-5 h-5" />
  },
  {
    title: "Configuration",
    icon: <Settings className="w-5 h-5" />,
    items: [
      { title: "Performance Cycles", href: "/config/cycles", icon: <Calendar className="w-4 h-4" /> },
      { title: "KPI Groups", href: "/config/kpi-groups", icon: <Layers className="w-4 h-4" /> },
      { title: "Units of Measure", href: "/config/units", icon: <BarChart2 className="w-4 h-4" /> },
      { title: "Data Types", href: "/config/data-types", icon: <FileText className="w-4 h-4" /> },
      { title: "Progress Statuses", href: "/config/statuses", icon: <Activity className="w-4 h-4" /> },
      { title: "Scorecard Types", href: "/config/scorecard-types", icon: <ListTodo className="w-4 h-4" /> },
      { title: "NKPA Weightings", href: "/weightings/nkpa", icon: <BarChart2 className="w-4 h-4" /> },
      { title: "Competencies", href: "/weightings/competencies", icon: <Users className="w-4 h-4" /> },
      { title: "Submission Deadlines", href: "/deadlines/submissions", icon: <Calendar className="w-4 h-4" /> },
      { title: "Report Fields", href: "/deadlines/report-fields", icon: <FileText className="w-4 h-4" /> },
      { title: "Notification Centre", href: "/notifications", icon: <Bell className="w-4 h-4" /> },
      { title: "Notification Settings", href: "/notifications/config", icon: <Settings className="w-4 h-4" /> },
      { title: "Indicator Technical Descriptions", href: "/config/indicator-descriptions", icon: <FileSearch className="w-4 h-4" /> },
    ]
  },
  {
    title: "Admin",
    icon: <Shield className="w-5 h-5" />,
    items: [
      { title: "User Management", href: "/admin/users", icon: <Users className="w-4 h-4" /> },
      { title: "Role Permissions", href: "/admin/roles", icon: <Shield className="w-4 h-4" /> },
      { title: "Workflow Config", href: "/admin/workflows", icon: <Activity className="w-4 h-4" /> },
    ]
  }
];

const phase1Groups = ["Configuration", "Original SDBIP", "Revised SDBIP", "Actuals & Evidence", "Departmental", "Moderation", "Reports", "Individual", "Admin"];

function NavGroupComponent({ group, currentPath }: { group: NavGroup, currentPath: string }) {
  const isActive = group.items.some(item => currentPath === item.href);
  const [isOpen, setIsOpen] = useState(isActive || phase1Groups.includes(group.title));

  return (
    <div className="mb-2">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "w-full flex items-center justify-between px-4 py-2.5 rounded-lg text-sm font-medium transition-colors",
          "hover:bg-slate-100 hover:text-platinum-primary text-slate-600",
          isActive && !isOpen && "text-platinum-primary bg-slate-50"
        )}
      >
        <div className="flex items-center gap-3">
          {group.icon}
          <span>{group.title}</span>
        </div>
        <ChevronDown className={cn("w-4 h-4 transition-transform", isOpen && "rotate-180")} />
      </button>
      
      {isOpen && (
        <div className="mt-1 space-y-1 pl-11 pr-2">
          {group.items.map(item => (
            <Link 
              key={item.href} 
              href={item.href}
              className={cn(
                "block py-2 px-3 rounded-md text-sm font-medium transition-all duration-200 border-l-2 border-transparent",
                currentPath === item.href 
                  ? "bg-blue-50 text-blue-700 border-blue-600" 
                  : "text-slate-500 hover:bg-slate-100 hover:text-slate-900"
              )}
            >
              {item.title}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

export function Sidebar() {
  const [location] = useLocation();
  const { canAccessSection } = useAuth();

  const filteredNavigation = navigation.filter(item => {
    return canAccessSection(item.title);
  });

  return (
    <aside className="w-[240px] flex-shrink-0 bg-white border-r border-border h-screen sticky top-0 flex flex-col hidden md:flex z-20">
      <div className="h-14 flex items-center px-4 border-b border-border">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded bg-green-700 flex items-center justify-center shadow-inner">
            <Activity className="w-5 h-5 text-white" />
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-bold text-slate-900 tracking-wide leading-none">PLATINUM</span>
            <span className="text-[10px] font-medium text-slate-500 uppercase tracking-widest leading-none mt-0.5">Performance</span>
          </div>
        </div>
      </div>
      
      <div className="flex-1 overflow-y-auto py-4 px-3">
        {filteredNavigation.map((item, i) => {
          if ('items' in item) {
            return <NavGroupComponent key={i} group={item} currentPath={location} />;
          }
          return (
            <Link 
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 border-l-2 mb-2",
                location === item.href 
                  ? "bg-blue-50 text-blue-700 border-blue-600" 
                  : "text-slate-600 hover:bg-slate-100 hover:text-slate-900 border-transparent"
              )}
            >
              <div className={cn(location === item.href ? "text-blue-600" : "text-slate-400")}>
                {item.icon}
              </div>
              {item.title}
            </Link>
          );
        })}
      </div>
      
      <div className="p-4 border-t border-border bg-slate-50/50">
        <p className="text-xs text-slate-400 font-medium text-center">Version 1.0.0</p>
      </div>
    </aside>
  );
}
