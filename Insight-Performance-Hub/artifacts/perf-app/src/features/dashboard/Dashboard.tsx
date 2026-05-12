import { useState } from "react";
import { Card } from "@/components/ui/card";
import { useListCycles } from "@workspace/api-client-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, PieChart as RPieChart, Pie, Cell, Legend } from "recharts";
import {
  Target, CheckCircle2, AlertTriangle, Clock,
  TrendingUp, Activity, FileCheck, BarChart2,
  Building2, Brain, Layers, PieChart, DollarSign,
  LineChart, ThumbsDown, Trophy, ShieldCheck,
} from "lucide-react";
import { StatusBadge } from "@/components/ui/status-badge";
import ExecDashboard from "../dashboards/ExecDashboard";
import DeptDashboard from "../dashboards/DeptDashboard";
import OverviewDashboard from "../dashboards/OverviewDashboard";
import AiInsights from "../ai/AiInsights";
import NkpaPerformance from "../dashboards/NkpaPerformance";
import KpiStatusSummary from "../dashboards/KpiStatusSummary";
import FinancialSnapshot from "../dashboards/FinancialSnapshot";
import TrendlineChart from "../dashboards/TrendlineChart";
import TopUnderperforming from "../dashboards/TopUnderperforming";
import DeptRanking from "../dashboards/DeptRanking";
import EvidenceCompliance from "../dashboards/EvidenceCompliance";

const TREND_DATA = [
  { name: "Q1", achieved: 45, pending: 10, missed: 5 },
  { name: "Q2", achieved: 52, pending: 8, missed: 2 },
  { name: "Q3", achieved: 38, pending: 20, missed: 8 },
  { name: "Q4", achieved: 60, pending: 5, missed: 1 },
];

const PASTEL_GREEN = "#86efac";
const PASTEL_ORANGE = "#fdba74";
const PASTEL_RED = "#fca5a5";

const DONUT_DATA = [
  { name: "Achieved", value: 98, color: PASTEL_GREEN },
  { name: "At Risk", value: 24, color: PASTEL_ORANGE },
  { name: "Missed", value: 20, color: PASTEL_RED },
];

const TABS = [
  { id: "summary",          label: "Summary",          icon: BarChart2 },
  { id: "executive",        label: "Executive",        icon: TrendingUp },
  { id: "department",       label: "Department",       icon: Building2 },
  { id: "overview",         label: "Overview",         icon: Activity },
  { id: "ai",               label: "AI Analytics",     icon: Brain },
  { id: "nkpa",             label: "NKPA Performance", icon: Layers },
  { id: "kpi-status",       label: "KPI Status",       icon: PieChart },
  { id: "financial",        label: "Financial",        icon: DollarSign },
  { id: "trendline",        label: "Trendline",        icon: LineChart },
  { id: "underperforming",  label: "Underperforming",  icon: ThumbsDown },
  { id: "dept-ranking",     label: "Dept Ranking",     icon: Trophy },
  { id: "evidence",         label: "Evidence",         icon: ShieldCheck },
] as const;

type TabId = typeof TABS[number]["id"];

function SummaryTab() {
  const { data: cycles } = useListCycles();
  const activeCycle = cycles?.find(c => c.status === "Open") || cycles?.[0];

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {activeCycle && (
        <div className="flex items-center gap-3 bg-white px-4 py-2 rounded-xl shadow-sm border border-border w-fit">
          <span className="text-sm font-medium text-slate-600">Active Cycle:</span>
          <StatusBadge status={activeCycle.status} />
          <span className="text-sm text-slate-500">{activeCycle.financialYearLabel}</span>
        </div>
      )}

      {/* KPI Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { title: "Total KPIs",        value: "142", icon: Target,       color: "text-blue-600",   bg: "bg-blue-50",   border: "border-blue-200" },
          { title: "Achieved",          value: "98",  icon: CheckCircle2, color: "text-green-600",  bg: "bg-green-50",  border: "border-green-200" },
          { title: "At Risk",           value: "24",  icon: AlertTriangle,color: "text-orange-500", bg: "bg-orange-50", border: "border-orange-200" },
          { title: "Pending Evidence",  value: "20",  icon: Clock,        color: "text-slate-500",  bg: "bg-slate-100", border: "border-slate-200" },
        ].map((stat, i) => (
          <Card key={i} className="platinum-card p-5 border-l-4" style={{ borderLeftColor: `var(--${stat.color.split("-")[1]})` }}>
            <div className="flex justify-between items-start">
              <div>
                <p className="text-[13px] font-semibold text-slate-500 uppercase tracking-wide mb-1">{stat.title}</p>
                <h3 className="text-3xl font-bold text-slate-900">{stat.value}</h3>
              </div>
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${stat.bg} ${stat.border} border`}>
                <stat.icon className={`w-6 h-6 ${stat.color}`} />
              </div>
            </div>
            <div className="mt-4 flex items-center gap-2 text-sm">
              <TrendingUp className="w-4 h-4 text-green-500" />
              <span className="text-green-600 font-medium">+5%</span>
              <span className="text-slate-400">from last quarter</span>
            </div>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 platinum-card p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <BarChart2 className="w-5 h-5 text-platinum-primary" />
                Performance Trend
              </h3>
              <p className="text-sm text-slate-500">Quarter over quarter KPI achievement</p>
            </div>
          </div>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={TREND_DATA} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: "#64748b", fontSize: 12 }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: "#64748b", fontSize: 12 }} />
                <RechartsTooltip
                  cursor={{ fill: "#f1f5f9" }}
                  contentStyle={{ borderRadius: "8px", border: "none", boxShadow: "0 4px 12px rgba(0,0,0,0.1)" }}
                />
                <Bar dataKey="achieved" stackId="a" fill={PASTEL_GREEN} radius={[0, 0, 4, 4]} name="Achieved" />
                <Bar dataKey="pending"  stackId="a" fill={PASTEL_ORANGE} name="Pending" />
                <Bar dataKey="missed"   stackId="a" fill={PASTEL_RED} radius={[4, 4, 0, 0]} name="Missed" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="platinum-card p-6 flex flex-col">
          <div className="mb-4">
            <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <PieChart className="w-5 h-5 text-platinum-primary" />
              KPI Distribution
            </h3>
            <p className="text-sm text-slate-500">Overall status breakdown</p>
          </div>
          <div className="flex-1 min-h-[260px]">
            <ResponsiveContainer width="100%" height="100%">
              <RPieChart>
                <Pie
                  data={DONUT_DATA}
                  cx="50%"
                  cy="45%"
                  innerRadius={60}
                  outerRadius={90}
                  paddingAngle={4}
                  dataKey="value"
                  stroke="none"
                >
                  {DONUT_DATA.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <RechartsTooltip
                  contentStyle={{ borderRadius: "8px", border: "none", boxShadow: "0 4px 12px rgba(0,0,0,0.1)" }}
                  formatter={(value: number, name: string) => [`${value} KPIs`, name]}
                />
                <Legend
                  verticalAlign="bottom"
                  iconType="circle"
                  iconSize={10}
                  formatter={(value: string) => <span className="text-sm text-slate-600">{value}</span>}
                />
              </RPieChart>
            </ResponsiveContainer>
          </div>
          <div className="text-center mt-2">
            <p className="text-3xl font-bold text-slate-900">142</p>
            <p className="text-xs text-slate-500">Total KPIs</p>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-6">
        <Card className="platinum-card p-0 overflow-hidden">
          <div className="bg-orange-50 border-b border-orange-100 p-5">
            <h3 className="text-lg font-bold text-orange-800 flex items-center gap-2">
              <Activity className="w-5 h-5" />
              Action Required
            </h3>
            <p className="text-sm text-orange-600/80 mt-1">Pending tasks for your attention</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 p-2">
            {[
              { text: "Review Q2 submissions for Finance",    time: "2 hours ago" },
              { text: "Approve updated NKPA weightings",      time: "5 hours ago" },
              { text: "Missing evidence: KPI-042",            time: "1 day ago" },
              { text: "Submit departmental constraints",      time: "2 days ago" },
            ].map((task, i) => (
              <div key={i} className="flex gap-3 p-3 hover:bg-slate-50 rounded-lg transition-colors cursor-pointer border-b border-slate-100 last:border-0 sm:border-b-0 sm:border-r sm:last:border-r-0">
                <div className="mt-1">
                  <FileCheck className="w-4 h-4 text-platinum-accent" />
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-800 leading-tight">{task.text}</p>
                  <p className="text-xs text-slate-400 mt-1">{task.time}</p>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState<TabId>("summary");

  return (
    <div className="space-y-0 animate-in fade-in duration-300">
      <div className="flex items-center justify-between pb-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Dashboard</h1>
          <p className="text-slate-500 mt-1">Organisational performance at a glance</p>
        </div>
      </div>

      {/* Horizontal tab bar */}
      <div className="border-b border-slate-200 mb-6 overflow-x-auto">
        <nav className="-mb-px flex gap-0 min-w-max">
          {TABS.map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={[
                  "flex items-center gap-2 px-6 py-3 text-sm font-medium border-b-2 transition-colors",
                  isActive
                    ? "border-[var(--platinum-primary)] text-[var(--platinum-primary)] bg-blue-50/40"
                    : "border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300",
                ].join(" ")}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Tab content */}
      {activeTab === "summary"         && <SummaryTab />}
      {activeTab === "executive"       && <ExecDashboard />}
      {activeTab === "department"      && <DeptDashboard />}
      {activeTab === "overview"        && <OverviewDashboard />}
      {activeTab === "ai"              && <AiInsights />}
      {activeTab === "nkpa"            && <NkpaPerformance />}
      {activeTab === "kpi-status"      && <KpiStatusSummary />}
      {activeTab === "financial"       && <FinancialSnapshot />}
      {activeTab === "trendline"       && <TrendlineChart />}
      {activeTab === "underperforming" && <TopUnderperforming />}
      {activeTab === "dept-ranking"    && <DeptRanking />}
      {activeTab === "evidence"        && <EvidenceCompliance />}
    </div>
  );
}
