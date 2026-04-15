import { useState, useEffect } from "react";
import { useGetOverviewDashboard } from "@workspace/api-client-react";
import { useListCycles } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { Target, TrendingUp, AlertTriangle } from "lucide-react";

export default function OverviewDashboard() {
  const { data: cycles } = useListCycles();
  const [cycleId, setCycleId] = useState<number | undefined>();

  useEffect(() => {
    if (cycles && cycles.length > 0 && !cycleId) {
      const open = cycles.find(c => c.status === "Open");
      setCycleId((open ?? cycles[0]).id);
    }
  }, [cycles]);

  const { data } = useGetOverviewDashboard({ cycleId: cycleId || 0 });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Overview Dashboard</h1>
          <p className="text-sm text-slate-500 mt-1">Organisational summary and quarterly comparison</p>
        </div>
        <Select value={cycleId?.toString() || ""} onValueChange={v => setCycleId(Number(v))}>
          <SelectTrigger className="w-[200px]"><SelectValue placeholder="Select Cycle" /></SelectTrigger>
          <SelectContent>{cycles?.map(c => <SelectItem key={c.id} value={c.id.toString()}>{c.financialYearLabel}</SelectItem>)}</SelectContent>
        </Select>
      </div>

      {!cycleId ? (
        <p className="text-center text-slate-400 py-20">Select a performance cycle to view overview</p>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardContent className="p-6 text-center">
                <Target className="w-8 h-8 mx-auto text-blue-500 mb-2" />
                <p className="text-xs text-slate-500 uppercase tracking-wide">Total KPIs</p>
                <p className="text-3xl font-bold text-slate-900">{data?.orgSummary?.totalKpis || 0}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6 text-center">
                <TrendingUp className="w-8 h-8 mx-auto text-green-500 mb-2" />
                <p className="text-xs text-slate-500 uppercase tracking-wide">Average Score</p>
                <p className="text-3xl font-bold text-slate-900">{(data?.orgSummary?.avgScore || 0).toFixed(1)}%</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6 text-center">
                <TrendingUp className="w-8 h-8 mx-auto text-[#c9a84c] mb-2" />
                <p className="text-xs text-slate-500 uppercase tracking-wide">Achievement Rate</p>
                <p className="text-3xl font-bold text-slate-900">{(data?.orgSummary?.achievedPct || 0).toFixed(1)}%</p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader><CardTitle className="text-base">Quarterly Comparison</CardTitle></CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={data?.quarterComparison || []}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="quarter" tickFormatter={v => `Q${v}`} />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="achieved" name="Achieved" fill="#4caf50" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="notAchieved" name="Not Achieved" fill="#ef5350" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-500" /> Exceptions Requiring Attention
              </CardTitle>
            </CardHeader>
            <CardContent>
              {data?.exceptions?.length ? (
                <div className="space-y-2">
                  {data.exceptions.map((e, i) => (
                    <div key={i} className="flex items-center justify-between p-3 bg-amber-50 rounded-lg border border-amber-100">
                      <div>
                        <span className="font-medium text-sm">{e.kpiNumber}</span>
                        <span className="text-sm text-slate-600 ml-2">{e.description}</span>
                      </div>
                      <Badge className="bg-red-100 text-red-700">{e.issue}</Badge>
                    </div>
                  ))}
                </div>
              ) : <p className="text-center text-slate-400 py-4">No exceptions</p>}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
