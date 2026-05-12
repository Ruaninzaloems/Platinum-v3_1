import { useState } from "react";
import {
  useListIntegrationSyncLog, useTriggerHrSync, useTriggerBudgetPull,
  useTriggerProjectSync, useListIdpObjectives, useListCycles,
} from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/core/hooks/use-toast";
import { RefreshCw, Database, Users, Link2, Search } from "lucide-react";

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
  Completed: "bg-green-100 text-green-700",
  Pending: "bg-yellow-100 text-yellow-700",
  Failed: "bg-red-100 text-red-700",
};

export default function IntegrationHub() {
  const { toast } = useToast();
  const { data: cycles } = useListCycles();
  const [syncFilter, setSyncFilter] = useState<string | undefined>();
  const [idpSearch, setIdpSearch] = useState("");
  const [budgetCycleId, setBudgetCycleId] = useState<number | undefined>();

  const { data: syncLog, refetch: refetchLog } = useListIntegrationSyncLog({ integrationType: syncFilter });
  const { data: idpObjectives } = useListIdpObjectives({ search: idpSearch });
  const hrSync = useTriggerHrSync();
  const budgetPull = useTriggerBudgetPull();
  const projectSync = useTriggerProjectSync();

  const handleHrSync = async () => {
    try {
      const result = await hrSync.mutateAsync();
      toast({ title: "HR Sync", description: (result as Record<string, string>).message || "Sync completed" });
      refetchLog();
    } catch (e: unknown) {
      toast({ title: "Error", description: getErrorMessage(e), variant: "destructive" });
    }
  };

  const handleProjectSync = async () => {
    try {
      const result = await projectSync.mutateAsync();
      toast({ title: "Project Sync", description: (result as Record<string, string>).message || "Sync completed" });
      refetchLog();
    } catch (e: unknown) {
      toast({ title: "Error", description: getErrorMessage(e), variant: "destructive" });
    }
  };

  const handleBudgetPull = async () => {
    if (!budgetCycleId) return;
    try {
      const result = await budgetPull.mutateAsync({ data: { cycleId: budgetCycleId } });
      toast({ title: "Budget Pull", description: (result as Record<string, string>).message || "Pull completed" });
      refetchLog();
    } catch (e: unknown) {
      toast({ title: "Error", description: getErrorMessage(e), variant: "destructive" });
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <Link2 className="w-7 h-7 text-blue-600" /> Integration Hub
          </h1>
          <p className="text-slate-500 mt-1">Manage external system integrations and data synchronisation</p>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader><CardTitle className="text-lg flex items-center gap-2"><Users className="w-5 h-5" /> HR System</CardTitle></CardHeader>
          <CardContent>
            <p className="text-sm text-slate-500 mb-4">Sync employee data, post details, and organisational structure from your HR system.</p>
            <Button onClick={handleHrSync} disabled={hrSync.isPending}>
              <RefreshCw className={`w-4 h-4 mr-1 ${hrSync.isPending ? "animate-spin" : ""}`} /> Sync Now
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-lg flex items-center gap-2"><Database className="w-5 h-5" /> mSCOA Budget</CardTitle></CardHeader>
          <CardContent>
            <p className="text-sm text-slate-500 mb-3">Pull budget values for budget-linked KPIs from the mSCOA system.</p>
            <div className="flex gap-2">
              <Select value={budgetCycleId ? String(budgetCycleId) : "none"} onValueChange={v => setBudgetCycleId(v === "none" ? undefined : Number(v))}>
                <SelectTrigger className="w-[160px]"><SelectValue placeholder="Cycle" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Select</SelectItem>
                  {cycles?.map(c => <SelectItem key={c.id} value={String(c.id)}>{c.financialYearLabel}</SelectItem>)}
                </SelectContent>
              </Select>
              <Button onClick={handleBudgetPull} disabled={!budgetCycleId || budgetPull.isPending}>
                <RefreshCw className={`w-4 h-4 mr-1 ${budgetPull.isPending ? "animate-spin" : ""}`} /> Pull
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-lg flex items-center gap-2"><Link2 className="w-5 h-5" /> Project Module</CardTitle></CardHeader>
          <CardContent>
            <p className="text-sm text-slate-500 mb-4">Sync project KPIs and link project milestones to performance agreements.</p>
            <Button onClick={handleProjectSync} disabled={projectSync.isPending}>
              <RefreshCw className={`w-4 h-4 mr-1 ${projectSync.isPending ? "animate-spin" : ""}`} /> Sync Projects
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-lg flex items-center gap-2"><Search className="w-5 h-5" /> IDP Objectives</CardTitle></CardHeader>
          <CardContent>
            <p className="text-sm text-slate-500 mb-3">Search IDP objectives for KPI alignment and linkage.</p>
            <Input placeholder="Search objectives..." value={idpSearch} onChange={e => setIdpSearch(e.target.value)} />
            {idpObjectives && idpObjectives.length > 0 && (
              <div className="mt-3 space-y-2 max-h-40 overflow-y-auto">
                {idpObjectives.map(o => (
                  <div key={o.id} className="text-sm p-2 bg-slate-50 rounded">
                    <span className="font-medium text-slate-700">{o.code}</span>
                    <span className="text-slate-500 ml-2">{o.description}</span>
                    {o.chapter && <Badge variant="outline" className="ml-2">{o.chapter}</Badge>}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg">Sync Log</CardTitle>
          <Select value={syncFilter || "all"} onValueChange={v => setSyncFilter(v === "all" ? undefined : v)}>
            <SelectTrigger className="w-[180px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="hr">HR</SelectItem>
              <SelectItem value="budget">Budget</SelectItem>
              <SelectItem value="project">Project</SelectItem>
            </SelectContent>
          </Select>
        </CardHeader>
        <CardContent>
          {!syncLog?.length ? (
            <p className="text-sm text-slate-400 text-center py-6">No sync history</p>
          ) : (
            <table className="w-full text-sm">
              <thead><tr className="border-b text-slate-500"><th className="text-left py-2 px-2">Type</th><th className="text-left py-2 px-2">Direction</th><th className="text-left py-2 px-2">Entity</th><th className="text-right py-2 px-2">Records</th><th className="text-left py-2 px-2">Status</th><th className="text-left py-2 px-2">Time</th></tr></thead>
              <tbody>
                {syncLog.map(l => (
                  <tr key={l.id} className="border-b last:border-0 hover:bg-slate-50">
                    <td className="py-2 px-2 font-medium">{l.integrationType}</td>
                    <td className="py-2 px-2">{l.direction}</td>
                    <td className="py-2 px-2">{l.entityType}</td>
                    <td className="py-2 px-2 text-right">{l.recordCount ?? "—"}</td>
                    <td className="py-2 px-2"><Badge className={STATUS_COLORS[l.status] || ""}>{l.status}</Badge></td>
                    <td className="py-2 px-2 text-xs text-slate-400">{l.syncedAt}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
