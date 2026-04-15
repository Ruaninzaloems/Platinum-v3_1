import { useState, useEffect } from "react";
import { useGetFinancialSnapshot, useListCycles } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { DollarSign, TrendingUp, TrendingDown } from "lucide-react";

export default function FinancialSnapshot() {
  const { data: cycles } = useListCycles();
  const [cycleId, setCycleId] = useState<number | undefined>();
  const [quarter, setQuarter] = useState<number | undefined>();

  useEffect(() => {
    if (cycles && cycles.length > 0 && !cycleId) {
      const open = cycles.find(c => c.status === "Open");
      setCycleId((open ?? cycles[0]).id);
    }
  }, [cycles]);

  const { data } = useGetFinancialSnapshot({ cycleId: cycleId || 0, ...(quarter ? { quarter } : {}) }, { query: { enabled: !!cycleId } });

  const fmt = (v: number) => {
    if (v >= 1_000_000) return `R${(v / 1_000_000).toFixed(1)}M`;
    if (v >= 1_000) return `R${(v / 1_000).toFixed(1)}K`;
    return `R${v.toFixed(0)}`;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Financial Snapshot</h1>
          <p className="text-sm text-slate-500 mt-1">Budget vs actual spend per KPI and department</p>
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
        <p className="text-center text-slate-400 py-20">Select a performance cycle to view financial data</p>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardContent className="p-5 flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-blue-50 text-blue-600"><DollarSign className="w-5 h-5" /></div>
                <div>
                  <p className="text-xs text-slate-500 uppercase tracking-wide font-medium">Total Budget</p>
                  <p className="text-2xl font-bold text-slate-900">{fmt(data?.totalBudget || 0)}</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-5 flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-green-50 text-green-600"><TrendingUp className="w-5 h-5" /></div>
                <div>
                  <p className="text-xs text-slate-500 uppercase tracking-wide font-medium">Total Spend</p>
                  <p className="text-2xl font-bold text-slate-900">{fmt(data?.totalSpend || 0)}</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-5 flex items-center gap-3">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${(data?.overallVariance || 0) > 0 ? "bg-red-50 text-red-600" : "bg-green-50 text-green-600"}`}>
                  {(data?.overallVariance || 0) > 0 ? <TrendingUp className="w-5 h-5" /> : <TrendingDown className="w-5 h-5" />}
                </div>
                <div>
                  <p className="text-xs text-slate-500 uppercase tracking-wide font-medium">Variance</p>
                  <p className={`text-2xl font-bold ${(data?.overallVariance || 0) > 0 ? "text-red-600" : "text-green-600"}`}>{data?.overallVariance || 0}%</p>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader><CardTitle className="text-base">Budget vs Actual by Department</CardTitle></CardHeader>
            <CardContent>
              {data?.byDepartment?.length ? (
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={data.byDepartment}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="departmentName" tick={{ fontSize: 11 }} />
                    <YAxis tickFormatter={(v: number) => fmt(v)} />
                    <Tooltip formatter={(v: number) => fmt(v)} />
                    <Legend />
                    <Bar dataKey="budgetAllocated" name="Budget" fill="#0f2b46" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="actualSpend" name="Actual" fill="#4caf50" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : <p className="text-center text-slate-400 py-8">No department data</p>}
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="text-base">KPI Budget Details</CardTitle></CardHeader>
            <CardContent>
              {data?.byKpi?.length ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead><tr className="border-b text-left text-xs text-slate-500 uppercase">
                      <th className="p-2">KPI</th><th className="p-2">Description</th>
                      <th className="p-2 text-right">Budget</th><th className="p-2 text-right">Actual</th><th className="p-2 text-right">Variance</th>
                    </tr></thead>
                    <tbody>
                      {data.byKpi.map((k, i) => (
                        <tr key={i} className="border-b">
                          <td className="p-2 font-medium">{k.kpiNumber}</td>
                          <td className="p-2 text-slate-600 max-w-[200px] truncate">{k.description}</td>
                          <td className="p-2 text-right">{fmt(k.budgetAllocated || 0)}</td>
                          <td className="p-2 text-right">{fmt(k.actualSpend || 0)}</td>
                          <td className={`p-2 text-right font-medium ${(k.variance || 0) > 0 ? "text-red-600" : "text-green-600"}`}>{k.variance}%</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : <p className="text-center text-slate-400 py-4">No KPI budget data</p>}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
