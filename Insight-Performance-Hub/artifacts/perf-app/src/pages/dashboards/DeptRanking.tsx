import { useState, useEffect } from "react";
import { useGetDeptRanking, useListCycles } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { Trophy } from "lucide-react";

export default function DeptRanking() {
  const { data: cycles } = useListCycles();
  const [cycleId, setCycleId] = useState<number | undefined>();
  const [quarter, setQuarter] = useState<number | undefined>();
  const [sortField, setSortField] = useState<"weightedScore" | "achievementRate">("weightedScore");

  useEffect(() => {
    if (cycles && cycles.length > 0 && !cycleId) {
      const open = cycles.find(c => c.status === "Open");
      setCycleId((open ?? cycles[0]).id);
    }
  }, [cycles]);

  const { data } = useGetDeptRanking({ cycleId: cycleId || 0, ...(quarter ? { quarter } : {}) }, { query: { enabled: !!cycleId } });

  const sortedRankings = [...(data?.rankings || [])].sort((a, b) => (b[sortField] || 0) - (a[sortField] || 0));

  const medalColor = (rank: number) => {
    if (rank === 1) return "text-yellow-500";
    if (rank === 2) return "text-slate-400";
    if (rank === 3) return "text-amber-700";
    return "text-slate-300";
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Department Ranking</h1>
          <p className="text-sm text-slate-500 mt-1">All departments ranked by weighted performance score</p>
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
        <p className="text-center text-slate-400 py-20">Select a performance cycle to view department rankings</p>
      ) : (
        <>
          <Card>
            <CardHeader><CardTitle className="text-base">Weighted Performance Score by Department</CardTitle></CardHeader>
            <CardContent>
              {sortedRankings.length > 0 ? (
                <ResponsiveContainer width="100%" height={Math.max(250, sortedRankings.length * 40)}>
                  <BarChart data={sortedRankings} layout="vertical" margin={{ left: 120 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" domain={[0, 100]} tickFormatter={v => `${v}%`} />
                    <YAxis type="category" dataKey="departmentName" tick={{ fontSize: 11 }} width={110} />
                    <Tooltip formatter={(v: number) => `${v}%`} />
                    <Bar dataKey="weightedScore" name="Weighted Score" fill="#0f2b46" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : <p className="text-center text-slate-400 py-8">No ranking data</p>}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-base flex items-center gap-2"><Trophy className="w-4 h-4 text-yellow-500" /> League Table</CardTitle>
                <Select value={sortField} onValueChange={v => setSortField(v as "weightedScore" | "achievementRate")}>
                  <SelectTrigger className="w-[180px]"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="weightedScore">Weighted Score</SelectItem>
                    <SelectItem value="achievementRate">Achievement Rate</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
            <CardContent>
              {sortedRankings.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead><tr className="border-b text-left text-xs text-slate-500 uppercase">
                      <th className="p-2 text-center">Rank</th><th className="p-2">Department</th>
                      <th className="p-2 text-right">Weighted Score</th><th className="p-2 text-right">Achievement %</th>
                      <th className="p-2 text-right">Total KPIs</th><th className="p-2 text-right">Achieved</th>
                    </tr></thead>
                    <tbody>
                      {sortedRankings.map((r, i) => {
                        const displayRank = sortField === "weightedScore" ? (r.rank || i + 1) : i + 1;
                        return (
                        <tr key={i} className="border-b hover:bg-slate-50">
                          <td className="p-2 text-center">
                            {displayRank <= 3 ? <Trophy className={`w-4 h-4 mx-auto ${medalColor(displayRank)}`} /> : <span className="text-slate-400">{displayRank}</span>}
                          </td>
                          <td className="p-2 font-medium">{r.departmentName}</td>
                          <td className="p-2 text-right font-semibold" style={{ color: (r.weightedScore || 0) >= 70 ? "#4caf50" : (r.weightedScore || 0) >= 50 ? "#f59e0b" : "#ef5350" }}>{r.weightedScore}%</td>
                          <td className="p-2 text-right">{r.achievementRate}%</td>
                          <td className="p-2 text-right">{r.totalKpis}</td>
                          <td className="p-2 text-right">{r.achievedKpis}</td>
                        </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              ) : <p className="text-center text-slate-400 py-4">No data</p>}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
