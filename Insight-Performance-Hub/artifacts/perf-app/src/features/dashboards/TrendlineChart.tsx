import { useState, useEffect } from "react";
import { useGetTrendline, useListCycles } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, BarChart, Bar } from "recharts";
import { TrendingUp, TrendingDown } from "lucide-react";

export default function TrendlineChart() {
  const { data: cycles } = useListCycles();
  const [cycleId, setCycleId] = useState<number | undefined>();
  const [quarter, setQuarter] = useState<number | undefined>();

  useEffect(() => {
    if (cycles && cycles.length > 0 && !cycleId) {
      const open = cycles.find(c => c.status === "Open");
      setCycleId((open ?? cycles[0]).id);
    }
  }, [cycles]);

  const { data } = useGetTrendline({ cycleId: cycleId || 0, ...(quarter ? { quarter } : {}) }, { query: { enabled: !!cycleId } });
  const chartData = data?.quarters?.map(q => ({ ...q, label: `Q${q.quarter}` })) || [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Trendline</h1>
          <p className="text-sm text-slate-500 mt-1">Quarterly performance trends with period-over-period comparison</p>
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
        <p className="text-center text-slate-400 py-20">Select a performance cycle to view trends</p>
      ) : (
        <>
          <Card>
            <CardHeader><CardTitle className="text-base">Achievement Rate Trend</CardTitle></CardHeader>
            <CardContent>
              {chartData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="label" />
                    <YAxis domain={[0, 100]} tickFormatter={v => `${v}%`} />
                    <Tooltip formatter={(v: number) => `${v}%`} />
                    <Area type="monotone" dataKey="achievementRate" name="Achievement Rate" stroke="#0f2b46" fill="#0f2b46" fillOpacity={0.1} strokeWidth={2} dot={{ r: 4 }} />
                  </AreaChart>
                </ResponsiveContainer>
              ) : <p className="text-center text-slate-400 py-8">No trend data</p>}
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader><CardTitle className="text-base">Achieved vs Not Achieved by Quarter</CardTitle></CardHeader>
              <CardContent>
                {chartData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={250}>
                    <BarChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="label" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="achieved" name="Achieved" fill="#4caf50" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="notAchieved" name="Not Achieved" fill="#ef5350" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : <p className="text-center text-slate-400 py-8">No data</p>}
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle className="text-base">Period-over-Period Change</CardTitle></CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {chartData.map((q, i) => (
                    <div key={i} className="flex items-center justify-between p-3 rounded-lg border">
                      <div>
                        <p className="font-medium text-slate-900">{q.label}</p>
                        <p className="text-sm text-slate-500">{q.achieved} achieved / {q.total} total</p>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold text-slate-900">{q.achievementRate}%</p>
                        {i > 0 && (
                          <div className={`flex items-center gap-1 text-sm ${(q.periodChange || 0) >= 0 ? "text-green-600" : "text-red-600"}`}>
                            {(q.periodChange || 0) >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                            <span>{(q.periodChange || 0) > 0 ? "+" : ""}{q.periodChange}%</span>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}
