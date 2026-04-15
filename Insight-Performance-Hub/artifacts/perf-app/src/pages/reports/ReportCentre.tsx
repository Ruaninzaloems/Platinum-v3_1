import { useState } from "react";
import type { GenerateReportInputReportType } from "@workspace/api-client-react";
import { useListReportRuns, useGenerateReport } from "@workspace/api-client-react";
import { useListCycles } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { FileText, Plus, Download, Loader2, FileSpreadsheet, File } from "lucide-react";

function getErrorMessage(e: unknown): string {
  if (e && typeof e === "object") {
    const obj = e as Record<string, unknown>;
    if (obj.response && typeof obj.response === "object") {
      const resp = obj.response as Record<string, unknown>;
      if (resp.data && typeof resp.data === "object") {
        const data = resp.data as Record<string, unknown>;
        if (typeof data.error === "string") return data.error;
      }
    }
    if (obj.message && typeof obj.message === "string") return obj.message;
  }
  return "An error occurred";
}

const STATUS_COLORS: Record<string, string> = {
  Pending: "bg-gray-100 text-gray-700",
  Generated: "bg-green-100 text-green-700",
  Failed: "bg-red-100 text-red-700",
};

const REPORT_TYPES = [
  { value: "quarterly", label: "Quarterly Report" },
  { value: "mid-year", label: "Mid-Year Report" },
  { value: "annual", label: "Annual Report" },
  { value: "institutional-evaluation", label: "Institutional Evaluation" },
];

const FORMAT_OPTIONS = [
  { value: "xlsx", label: "Excel (.xlsx)", icon: FileSpreadsheet, color: "text-green-600 hover:bg-green-50 border-green-200" },
  { value: "pdf", label: "PDF (.pdf)", icon: File, color: "text-red-600 hover:bg-red-50 border-red-200" },
  { value: "csv", label: "CSV (.csv)", icon: FileText, color: "text-blue-600 hover:bg-blue-50 border-blue-200" },
];

export default function ReportCentre() {
  const { toast } = useToast();
  const { data: cycles } = useListCycles();
  const [cycleId, setCycleId] = useState<number | undefined>();
  const [showGenerate, setShowGenerate] = useState(false);
  const [form, setForm] = useState({ reportType: "quarterly", title: "", quarter: 1, departmentId: 0 });
  const [exportingId, setExportingId] = useState<number | null>(null);
  const [exportFormat, setExportFormat] = useState<string | null>(null);

  const { data: runs, refetch } = useListReportRuns({ cycleId });
  const generateReport = useGenerateReport();

  async function handleExport(reportId: number, title: string, format: string) {
    setExportingId(reportId);
    setExportFormat(format);
    try {
      const baseUrl = import.meta.env.VITE_API_URL || "/api";
      const response = await fetch(`${baseUrl}/reports/runs/${reportId}/export?format=${format}`);
      if (!response.ok) {
        const err = await response.json().catch(() => ({ error: "Download failed" }));
        throw new Error(err.error || "Download failed");
      }
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      const ext = format === "xlsx" ? "xlsx" : format === "pdf" ? "pdf" : "csv";
      a.download = `${title.replace(/[^a-zA-Z0-9_ -]/g, "_")}.${ext}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      toast({ title: `Report downloaded as ${ext.toUpperCase()}` });
    } catch (e) {
      toast({ title: getErrorMessage(e), variant: "destructive" });
    } finally {
      setExportingId(null);
      setExportFormat(null);
    }
  }

  async function handleGenerate() {
    if (!cycleId) return;
    try {
      await generateReport.mutateAsync({
        data: {
          cycleId,
          reportType: form.reportType as GenerateReportInputReportType,
          title: form.title,
          quarter: form.quarter || undefined,
          departmentId: form.departmentId || undefined,
        }
      });
      setShowGenerate(false);
      setForm({ reportType: "quarterly", title: "", quarter: 1, departmentId: 0 });
      refetch();
      toast({ title: "Report generated" });
    } catch (e) {
      toast({ title: getErrorMessage(e), variant: "destructive" });
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Report Centre</h1>
          <p className="text-sm text-slate-500 mt-1">Generate and retrieve performance reports</p>
        </div>
        <div className="flex gap-3">
          <Select value={cycleId?.toString() || ""} onValueChange={v => setCycleId(Number(v))}>
            <SelectTrigger className="w-[200px]"><SelectValue placeholder="Select Cycle" /></SelectTrigger>
            <SelectContent>{cycles?.map(c => <SelectItem key={c.id} value={c.id.toString()}>{c.financialYearLabel}</SelectItem>)}</SelectContent>
          </Select>
          {cycleId && <Button onClick={() => setShowGenerate(true)} className="bg-[#0f2b46]"><Plus className="w-4 h-4 mr-1" />Generate Report</Button>}
        </div>
      </div>

      <div className="mb-4 p-4 bg-slate-50 rounded-lg border border-slate-200">
        <h3 className="text-sm font-semibold text-slate-700 mb-2">Report colour coding</h3>
        <div className="flex gap-4 text-xs">
          <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm bg-[#c6efce] border border-green-300" /> Target Met</span>
          <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm bg-[#ffeb9c] border border-amber-300" /> Partially Met (70-99%)</span>
          <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm bg-[#ffc7ce] border border-red-300" /> Target Missed (&lt;70%)</span>
        </div>
      </div>

      <div className="space-y-3">
        {runs?.map(r => (
          <Card key={r.id}>
            <CardContent className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center">
                  <FileText className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="font-medium text-sm">{r.title}</p>
                  <div className="flex items-center gap-2 text-xs text-slate-500">
                    <span className="capitalize">{r.reportType}</span>
                    {r.quarter && <span>• Q{r.quarter}</span>}
                    <span>• {r.generatedAt ? new Date(r.generatedAt).toLocaleDateString() : "Pending"}</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge className={STATUS_COLORS[r.status] || "bg-gray-100"}>{r.status}</Badge>
                {r.status === "Generated" && (
                  <div className="flex gap-1.5">
                    {FORMAT_OPTIONS.map(fmt => {
                      const Icon = fmt.icon;
                      const isLoading = exportingId === r.id && exportFormat === fmt.value;
                      return (
                        <Button
                          key={fmt.value}
                          variant="outline"
                          size="sm"
                          className={`${fmt.color} gap-1.5`}
                          onClick={() => handleExport(r.id, r.title, fmt.value)}
                          disabled={exportingId === r.id}
                        >
                          {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Icon className="w-4 h-4" />}
                          {fmt.value.toUpperCase()}
                        </Button>
                      );
                    })}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
        {runs?.length === 0 && <p className="text-center text-slate-400 py-12">No reports generated yet. Select a cycle and generate your first report.</p>}
      </div>

      <Dialog open={showGenerate} onOpenChange={setShowGenerate}>
        <DialogContent>
          <DialogHeader><DialogTitle>Generate Report</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Report Type</Label>
              <Select value={form.reportType} onValueChange={v => setForm(p => ({ ...p, reportType: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{REPORT_TYPES.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div><Label>Title</Label><Input value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} placeholder="e.g. Q1 2025/26 Performance Report" /></div>
            {form.reportType === "quarterly" && (
              <div>
                <Label>Quarter</Label>
                <Select value={form.quarter.toString()} onValueChange={v => setForm(p => ({ ...p, quarter: Number(v) }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{[1,2,3,4].map(q => <SelectItem key={q} value={q.toString()}>Q{q}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            )}
          </div>
          <DialogFooter><Button onClick={handleGenerate} disabled={!form.title}>Generate</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
