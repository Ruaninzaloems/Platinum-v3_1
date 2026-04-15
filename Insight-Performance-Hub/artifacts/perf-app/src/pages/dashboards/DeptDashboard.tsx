import { useState, useEffect } from "react";
import { useGetDepartmentDashboard } from "@workspace/api-client-react";
import { useListCycles, useListDeptScorecards } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { BarChart2, FileText, Clock, AlertTriangle } from "lucide-react";

const HEATMAP_COLORS: Record<string, string> = {
  Achieved: "bg-green-200 text-green-800",
  "Not Achieved": "bg-red-200 text-red-800",
  "At Risk": "bg-amber-200 text-amber-800",
  "N/A": "bg-gray-100 text-gray-500",
};

export default function DeptDashboard() {
  const { data: cycles } = useListCycles();
  const [cycleId, setCycleId] = useState<number | undefined>();
  const [deptId, setDeptId] = useState<number | undefined>();

  useEffect(() => {
    if (cycles && cycles.length > 0 && !cycleId) {
      const open = cycles.find(c => c.status === "Open");
      setCycleId((open ?? cycles[0]).id);
    }
  }, [cycles]);

  const { data: deptScorecards } = useListDeptScorecards({ cycleId });
  const departments = deptScorecards ? [...new Map(deptScorecards.map(d => [d.departmentId, d])).values()] : [];

  const { data } = useGetDepartmentDashboard(deptId || 0, { cycleId: cycleId || 0 });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Department Dashboard</h1>
          <p className="text-sm text-slate-500 mt-1">Departmental performance overview</p>
        </div>
        <div className="flex gap-3">
          <Select value={cycleId?.toString() || ""} onValueChange={v => setCycleId(Number(v))}>
            <SelectTrigger className="w-[200px]"><SelectValue placeholder="Select Cycle" /></SelectTrigger>
            <SelectContent>{cycles?.map(c => <SelectItem key={c.id} value={c.id.toString()}>{c.financialYearLabel}</SelectItem>)}</SelectContent>
          </Select>
          <Select value={deptId?.toString() || ""} onValueChange={v => setDeptId(Number(v))}>
            <SelectTrigger className="w-[200px]"><SelectValue placeholder="Select Department" /></SelectTrigger>
            <SelectContent>{departments.map(d => <SelectItem key={d.departmentId} value={d.departmentId.toString()}>{d.departmentName}</SelectItem>)}</SelectContent>
          </Select>
        </div>
      </div>

      {!cycleId || !deptId ? (
        <p className="text-center text-slate-400 py-20">Select a cycle and department to view dashboard</p>
      ) : (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-5 text-center">
                <p className="text-xs text-slate-500 uppercase tracking-wide font-medium">Overall Score</p>
                <p className="text-4xl font-bold mt-1" style={{ color: "#0f2b46" }}>{(data?.overallScore || 0).toFixed(1)}%</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-5 flex items-center gap-3">
                <FileText className="w-5 h-5 text-blue-500" />
                <div>
                  <p className="text-xs text-slate-500">Evidence</p>
                  <p className="text-xl font-bold">{(data?.evidenceCompleteness || 0).toFixed(0)}%</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-5 flex items-center gap-3">
                <Clock className="w-5 h-5 text-amber-500" />
                <div>
                  <p className="text-xs text-slate-500">Delayed Activities</p>
                  <p className="text-xl font-bold">{data?.delayedActivities || 0}</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-5 flex items-center gap-3">
                <AlertTriangle className="w-5 h-5 text-red-500" />
                <div>
                  <p className="text-xs text-slate-500">Constraints</p>
                  <p className="text-xl font-bold">{data?.unresolvedConstraints || 0}</p>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader><CardTitle className="text-base">KPI Heatmap by Quarter</CardTitle></CardHeader>
            <CardContent>
              {data?.kpiHeatmap?.length ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead><tr className="border-b text-left text-xs text-slate-500 uppercase">
                      <th className="p-2">KPI</th><th className="p-2">Description</th>
                      <th className="p-2 text-center">Q1</th><th className="p-2 text-center">Q2</th>
                      <th className="p-2 text-center">Q3</th><th className="p-2 text-center">Q4</th>
                    </tr></thead>
                    <tbody>
                      {data.kpiHeatmap.map((k, i) => {
                        const statuses = [k.q1Status, k.q2Status, k.q3Status, k.q4Status];
                        return (
                          <tr key={i} className="border-b">
                            <td className="p-2 font-medium">{k.kpiNumber}</td>
                            <td className="p-2 text-slate-600 max-w-[200px] truncate">{k.description}</td>
                            {statuses.map((status, qi) => (
                              <td key={qi} className="p-2 text-center">
                                <Badge className={HEATMAP_COLORS[status || "N/A"] || HEATMAP_COLORS["N/A"]}>{status || "N/A"}</Badge>
                              </td>
                            ))}
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              ) : <p className="text-center text-slate-400 py-4">No KPI data</p>}
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="text-base">Quarter-on-Quarter Trend</CardTitle></CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={250}>
                <LineChart data={data?.quarterTrend || []}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="quarter" tickFormatter={v => `Q${v}`} />
                  <YAxis domain={[0, 100]} />
                  <Tooltip formatter={(v: number) => `${v.toFixed(1)}%`} />
                  <Line type="monotone" dataKey="score" stroke="#0f2b46" strokeWidth={2} dot={{ r: 4 }} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
