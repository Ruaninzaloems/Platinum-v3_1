import { useState, useEffect } from "react";
import { useGetExecutiveDashboard } from "@workspace/api-client-react";
import { useListCycles } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from "recharts";
import { Target, CheckCircle, XCircle, AlertTriangle, PauseCircle, ShieldAlert, FileText, DollarSign, Clock } from "lucide-react";

const COLORS = ["#4caf50", "#ef5350", "#f59e0b", "#94a3b8"];

export default function ExecDashboard() {
  const { data: cycles } = useListCycles();
  const [cycleId, setCycleId] = useState<number | undefined>();
  const [quarter, setQuarter] = useState<number | undefined>();

  useEffect(() => {
    if (cycles && cycles.length > 0 && !cycleId) {
      const open = cycles.find(c => c.status === "Open");
      setCycleId((open ?? cycles[0]).id);
    }
  }, [cycles]);

  const { data } = useGetExecutiveDashboard({ cycleId: cycleId || 0, ...(quarter ? { quarter } : {}) });

  const pieData = data ? [
    { name: "Achieved", value: data.achieved || 0 },
    { name: "Not Achieved", value: data.notAchieved || 0 },
    { name: "At Risk", value: data.atRisk || 0 },
    { name: "On Hold", value: data.onHold || 0 },
  ].filter(d => d.value > 0) : [];

  const deptData = data?.departmentScores || [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Executive Dashboard</h1>
          <p className="text-sm text-slate-500 mt-1">Performance overview for leadership and oversight</p>
        </div>
        <div className="flex gap-3">
          <Select value={cycleId?.toString() || ""} onValueChange={v => setCycleId(Number(v))}>
            <SelectTrigger className="w-[200px]"><SelectValue placeholder="Select Cycle" /></SelectTrigger>
            <SelectContent>{cycles?.map(c => <SelectItem key={c.id} value={c.id.toString()}>{c.financialYearLabel}</SelectItem>)}</SelectContent>
          </Select>
          <Select value={quarter?.toString() || "all"} onValueChange={v => setQuarter(v === "all" ? undefined : Number(v))}>
            <SelectTrigger className="w-[120px]"><SelectValue placeholder="All Qtrs" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Quarters</SelectItem>
              {[1,2,3,4].map(q => <SelectItem key={q} value={q.toString()}>Q{q}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </div>

      {!cycleId ? (
        <p className="text-center text-slate-400 py-20">Select a performance cycle to view dashboard</p>
      ) : (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
            <KpiCard icon={<Target className="w-5 h-5" />} label="Total KPIs" value={data?.totalKpis || 0} bg="bg-blue-50" color="text-blue-600" />
            <KpiCard icon={<CheckCircle className="w-5 h-5" />} label="Achieved" value={data?.achieved || 0} bg="bg-green-50" color="text-green-600" />
            <KpiCard icon={<XCircle className="w-5 h-5" />} label="Not Achieved" value={data?.notAchieved || 0} bg="bg-red-50" color="text-red-600" />
            <KpiCard icon={<AlertTriangle className="w-5 h-5" />} label="At Risk" value={data?.atRisk || 0} bg="bg-amber-50" color="text-amber-600" />
            <KpiCard icon={<PauseCircle className="w-5 h-5" />} label="On Hold" value={data?.onHold || 0} bg="bg-gray-50" color="text-gray-600" />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader><CardTitle className="text-base">Weighted Performance</CardTitle></CardHeader>
              <CardContent className="flex items-center justify-center">
                <div className="text-center">
                  <p className="text-5xl font-bold" style={{ color: (data?.weightedPerformance || 0) >= 70 ? "#4caf50" : (data?.weightedPerformance || 0) >= 50 ? "#f59e0b" : "#ef5350" }}>
                    {(data?.weightedPerformance || 0).toFixed(1)}%
                  </p>
                  <p className="text-sm text-slate-500 mt-2">Overall Achievement</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle className="text-base">KPI Status Distribution</CardTitle></CardHeader>
              <CardContent>
                {pieData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={200}>
                    <PieChart>
                      <Pie data={pieData} cx="50%" cy="50%" outerRadius={70} dataKey="value" label={({ name, value }) => `${name}: ${value}`}>
                        {pieData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                      </Pie>
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                ) : <p className="text-center text-slate-400 py-8">No data available</p>}
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <MetricCard icon={<Clock className="w-4 h-4" />} label="Overdue Submissions" value={data?.overdueSubmissions || 0} />
            <MetricCard icon={<ShieldAlert className="w-4 h-4" />} label="Unresolved Actions" value={data?.unresolvedCorrectiveActions || 0} />
            <MetricCard icon={<FileText className="w-4 h-4" />} label="Evidence Outstanding" value={data?.evidenceOutstanding || 0} />
            <MetricCard icon={<DollarSign className="w-4 h-4" />} label="Budget Risk KPIs" value={data?.budgetRiskKpis || 0} />
          </div>

          <Card>
            <CardHeader><CardTitle className="text-base">Top 10 Underperforming KPIs</CardTitle></CardHeader>
            <CardContent>
              {data?.topUnderperforming?.length ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead><tr className="border-b text-left text-xs text-slate-500 uppercase">
                      <th className="p-2">KPI</th><th className="p-2">Description</th><th className="p-2 text-right">Target</th><th className="p-2 text-right">Actual</th><th className="p-2 text-right">Variance</th>
                    </tr></thead>
                    <tbody>
                      {data.topUnderperforming.map((k, i) => (
                        <tr key={i} className="border-b">
                          <td className="p-2 font-medium">{k.kpiNumber}</td>
                          <td className="p-2 text-slate-600">{k.description}</td>
                          <td className="p-2 text-right">{k.targetValue}</td>
                          <td className="p-2 text-right">{k.actualValue}</td>
                          <td className="p-2 text-right text-red-600">{k.variance?.toFixed(1)}%</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : <p className="text-center text-slate-400 py-4">No underperforming KPIs</p>}
            </CardContent>
          </Card>

          {deptData.length > 0 && (
            <Card>
              <CardHeader><CardTitle className="text-base">Department League Table</CardTitle></CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={deptData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="departmentName" tick={{ fontSize: 11 }} />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="score" fill="#0f2b46" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
}

function KpiCard({ icon, label, value, bg, color }: { icon: React.ReactNode; label: string; value: number; bg: string; color: string }) {
  return (
    <Card>
      <CardContent className="p-5 flex items-start gap-3">
        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${bg} ${color}`}>{icon}</div>
        <div>
          <p className="text-xs text-slate-500 uppercase tracking-wide font-medium">{label}</p>
          <p className="text-2xl font-bold text-slate-900">{value}</p>
        </div>
      </CardContent>
    </Card>
  );
}

function MetricCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: number }) {
  return (
    <Card>
      <CardContent className="p-4 flex items-center gap-3">
        <div className="text-slate-400">{icon}</div>
        <div>
          <p className="text-xs text-slate-500">{label}</p>
          <p className="text-lg font-bold text-slate-900">{value}</p>
        </div>
      </CardContent>
    </Card>
  );
}
