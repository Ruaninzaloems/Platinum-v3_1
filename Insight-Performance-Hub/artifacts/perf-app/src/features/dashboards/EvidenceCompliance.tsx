import { useState, useEffect } from "react";
import { useGetEvidenceCompliance, useListCycles } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { FileCheck, FileWarning, FileX, Files } from "lucide-react";

export default function EvidenceCompliance() {
  const { data: cycles } = useListCycles();
  const [cycleId, setCycleId] = useState<number | undefined>();
  const [quarter, setQuarter] = useState<number | undefined>();

  useEffect(() => {
    if (cycles && cycles.length > 0 && !cycleId) {
      const open = cycles.find(c => c.status === "Open");
      setCycleId((open ?? cycles[0]).id);
    }
  }, [cycles]);

  const { data } = useGetEvidenceCompliance({ cycleId: cycleId || 0, ...(quarter ? { quarter } : {}) }, { query: { enabled: !!cycleId } });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Evidence Compliance</h1>
          <p className="text-sm text-slate-500 mt-1">Evidence submission and verification rates per department and KPI</p>
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
        <p className="text-center text-slate-400 py-20">Select a performance cycle to view evidence compliance</p>
      ) : (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-5 flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-blue-50 text-blue-600"><Files className="w-5 h-5" /></div>
                <div>
                  <p className="text-xs text-slate-500 uppercase tracking-wide font-medium">Total Documents</p>
                  <p className="text-2xl font-bold text-slate-900">{data?.summary?.totalDocuments || 0}</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-5 flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-green-50 text-green-600"><FileCheck className="w-5 h-5" /></div>
                <div>
                  <p className="text-xs text-slate-500 uppercase tracking-wide font-medium">Verified</p>
                  <p className="text-2xl font-bold text-green-600">{data?.summary?.verified || 0}</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-5 flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-amber-50 text-amber-600"><FileWarning className="w-5 h-5" /></div>
                <div>
                  <p className="text-xs text-slate-500 uppercase tracking-wide font-medium">Pending</p>
                  <p className="text-2xl font-bold text-amber-600">{data?.summary?.pending || 0}</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-5 flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-red-50 text-red-600"><FileX className="w-5 h-5" /></div>
                <div>
                  <p className="text-xs text-slate-500 uppercase tracking-wide font-medium">Rejected</p>
                  <p className="text-2xl font-bold text-red-600">{data?.summary?.rejected || 0}</p>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Verification Rate: {data?.summary?.verificationRate || 0}%</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="w-full bg-slate-100 rounded-full h-4 overflow-hidden">
                <div className="bg-green-500 h-full rounded-full transition-all" style={{ width: `${data?.summary?.verificationRate || 0}%` }} />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="text-base">Compliance by Department</CardTitle></CardHeader>
            <CardContent>
              {data?.byDepartment?.length ? (
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={data.byDepartment}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="departmentName" tick={{ fontSize: 11 }} />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="verified" name="Verified" stackId="a" fill="#4caf50" />
                    <Bar dataKey="pending" name="Pending" stackId="a" fill="#f59e0b" />
                    <Bar dataKey="rejected" name="Rejected" stackId="a" fill="#ef5350" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : <p className="text-center text-slate-400 py-8">No department data</p>}
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="text-base">KPI Evidence Details</CardTitle></CardHeader>
            <CardContent>
              {data?.byKpi?.length ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead><tr className="border-b text-left text-xs text-slate-500 uppercase">
                      <th className="p-2">KPI</th><th className="p-2">Description</th>
                      <th className="p-2 text-right">Documents</th><th className="p-2 text-right">Verified</th>
                      <th className="p-2 text-right">Completeness</th>
                    </tr></thead>
                    <tbody>
                      {data.byKpi.map((k, i) => (
                        <tr key={i} className="border-b">
                          <td className="p-2 font-medium">{k.kpiNumber}</td>
                          <td className="p-2 text-slate-600 max-w-[200px] truncate">{k.description}</td>
                          <td className="p-2 text-right">{k.totalDocuments}</td>
                          <td className="p-2 text-right">{k.verified}</td>
                          <td className="p-2 text-right">
                            <span className={`font-medium ${(k.completenessRate || 0) >= 80 ? "text-green-600" : (k.completenessRate || 0) >= 50 ? "text-amber-600" : "text-red-600"}`}>
                              {k.completenessRate}%
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : <p className="text-center text-slate-400 py-4">No KPI evidence data</p>}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
