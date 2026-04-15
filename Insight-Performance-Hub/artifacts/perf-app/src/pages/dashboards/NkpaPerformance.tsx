import { useState, useEffect } from "react";
import { useGetNkpaPerformance, useListCycles } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";

export default function NkpaPerformance() {
  const { data: cycles } = useListCycles();
  const [cycleId, setCycleId] = useState<number | undefined>();
  const [quarter, setQuarter] = useState<number | undefined>();

  useEffect(() => {
    if (cycles && cycles.length > 0 && !cycleId) {
      const open = cycles.find(c => c.status === "Open");
      setCycleId((open ?? cycles[0]).id);
    }
  }, [cycles]);

  const { data } = useGetNkpaPerformance({ cycleId: cycleId || 0, ...(quarter ? { quarter } : {}) }, { query: { enabled: !!cycleId } });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">NKPA Performance</h1>
          <p className="text-sm text-slate-500 mt-1">Performance breakdown by NKPA category and department</p>
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
        <p className="text-center text-slate-400 py-20">Select a performance cycle to view NKPA performance</p>
      ) : (
        <>
          <Card>
            <CardHeader><CardTitle className="text-base">Performance by NKPA Category</CardTitle></CardHeader>
            <CardContent>
              {data?.byNkpa?.length ? (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={data.byNkpa} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="nkpaName" tick={{ fontSize: 11 }} />
                    <YAxis domain={[0, 100]} />
                    <Tooltip formatter={(v: number) => `${v}%`} />
                    <Legend />
                    <Bar dataKey="achievementRate" name="Achievement %" fill="#4caf50" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="weightedScore" name="Weighted Score %" fill="#0f2b46" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : <p className="text-center text-slate-400 py-8">No NKPA data available</p>}
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="text-base">NKPA Details</CardTitle></CardHeader>
            <CardContent>
              {data?.byNkpa?.length ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead><tr className="border-b text-left text-xs text-slate-500 uppercase">
                      <th className="p-2">NKPA</th><th className="p-2 text-right">Weight</th><th className="p-2 text-right">Total KPIs</th>
                      <th className="p-2 text-right">Achieved</th><th className="p-2 text-right">Achievement %</th><th className="p-2 text-right">Weighted Score</th>
                    </tr></thead>
                    <tbody>
                      {data.byNkpa.map((n, i) => (
                        <tr key={i} className="border-b">
                          <td className="p-2 font-medium">{n.nkpaName}</td>
                          <td className="p-2 text-right">{n.nkpaWeight}%</td>
                          <td className="p-2 text-right">{n.totalKpis}</td>
                          <td className="p-2 text-right">{n.achievedKpis}</td>
                          <td className="p-2 text-right text-green-600">{n.achievementRate}%</td>
                          <td className="p-2 text-right font-semibold">{n.weightedScore}%</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : <p className="text-center text-slate-400 py-4">No data</p>}
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="text-base">Department Breakdown</CardTitle></CardHeader>
            <CardContent>
              {data?.byDepartment?.length ? (
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={data.byDepartment}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="departmentName" tick={{ fontSize: 11 }} />
                    <YAxis domain={[0, 100]} />
                    <Tooltip formatter={(v: number) => `${v}%`} />
                    <Bar dataKey="achievementRate" name="Achievement %" fill="#0f2b46" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : <p className="text-center text-slate-400 py-4">No department data</p>}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
