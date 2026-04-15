import { useState, useEffect } from "react";
import { useGetTopUnderperforming, useListCycles } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { AlertTriangle } from "lucide-react";

export default function TopUnderperforming() {
  const { data: cycles } = useListCycles();
  const [cycleId, setCycleId] = useState<number | undefined>();
  const [quarter, setQuarter] = useState<number | undefined>();

  useEffect(() => {
    if (cycles && cycles.length > 0 && !cycleId) {
      const open = cycles.find(c => c.status === "Open");
      setCycleId((open ?? cycles[0]).id);
    }
  }, [cycles]);

  const { data } = useGetTopUnderperforming({ cycleId: cycleId || 0, ...(quarter ? { quarter } : {}) }, { query: { enabled: !!cycleId } });
  const items = data?.items || [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Top 5 Underperforming</h1>
          <p className="text-sm text-slate-500 mt-1">Worst-performing KPIs with target vs actual vs variance</p>
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
        <p className="text-center text-slate-400 py-20">Select a performance cycle to view underperforming KPIs</p>
      ) : items.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <AlertTriangle className="w-10 h-10 text-green-500 mx-auto mb-3" />
            <p className="text-lg font-medium text-slate-700">No underperforming KPIs</p>
            <p className="text-sm text-slate-400 mt-1">All KPIs are on track or achieved</p>
          </CardContent>
        </Card>
      ) : (
        <>
          <Card>
            <CardHeader><CardTitle className="text-base">Variance Chart (Negative = Underperformance)</CardTitle></CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={items} layout="vertical" margin={{ left: 80 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" tickFormatter={v => `${v}%`} />
                  <YAxis type="category" dataKey="kpiNumber" tick={{ fontSize: 11 }} width={70} />
                  <Tooltip formatter={(v: number) => `${v}%`} />
                  <Bar dataKey="variance" name="Variance %" radius={[0, 4, 4, 0]}>
                    {items.map((_, i) => <Cell key={i} fill="#ef5350" />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-red-500" /> Bottom 5 KPI Details
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead><tr className="border-b text-left text-xs text-slate-500 uppercase">
                    <th className="p-2">#</th><th className="p-2">KPI</th><th className="p-2">Description</th>
                    <th className="p-2 text-right">Target</th><th className="p-2 text-right">Actual</th>
                    <th className="p-2 text-right">Variance</th><th className="p-2 text-center">Quarter</th>
                  </tr></thead>
                  <tbody>
                    {items.map((k, i) => (
                      <tr key={i} className="border-b">
                        <td className="p-2 font-bold text-red-600">{i + 1}</td>
                        <td className="p-2 font-medium">{k.kpiNumber}</td>
                        <td className="p-2 text-slate-600 max-w-[200px] truncate">{k.description}</td>
                        <td className="p-2 text-right">{k.targetValue}</td>
                        <td className="p-2 text-right">{k.actualValue}</td>
                        <td className="p-2 text-right text-red-600 font-semibold">{k.variance}%</td>
                        <td className="p-2 text-center">Q{k.quarter}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
