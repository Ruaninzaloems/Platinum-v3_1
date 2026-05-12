import { useState } from "react";
import type { DeptScorecardTransitionInputAction } from "@workspace/api-client-react";
import {
  useListDeptScorecards, useCreateDeptScorecard, useUpdateDeptScorecard,
  useTransitionDeptScorecard, useListDeptScorecardKpis, useCreateDeptScorecardKpi,
  useUpdateDeptKpi, useDeleteDeptKpi, useInheritKpisFromOrg,
} from "@workspace/api-client-react";
import { useListCycles } from "@workspace/api-client-react";
import { useListScorecards } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/core/hooks/use-toast";
import { Plus, Send, Check, ArrowLeft, Target, Trash2, Download } from "lucide-react";

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
  Draft: "bg-gray-100 text-gray-700",
  Submitted: "bg-blue-100 text-blue-700",
  Approved: "bg-green-100 text-green-700",
  Locked: "bg-purple-100 text-purple-700",
};

export default function DeptScorecards() {
  const { toast } = useToast();
  const { data: cycles } = useListCycles();
  const [selectedCycleId, setSelectedCycleId] = useState<number | undefined>();
  const [selectedScId, setSelectedScId] = useState<number | undefined>();
  const [showCreate, setShowCreate] = useState(false);
  const [showAddKpi, setShowAddKpi] = useState(false);
  const [createForm, setCreateForm] = useState({ name: "", departmentId: 1, departmentName: "", parentScorecardId: 0 });
  const [kpiForm, setKpiForm] = useState({ kpiNumber: "", description: "", annualTarget: "", weighting: 0 });

  const { data: deptScorecards, refetch: refetchScorecards } = useListDeptScorecards({ cycleId: selectedCycleId });
  const { data: orgScorecards } = useListScorecards({ cycleId: selectedCycleId });
  const { data: kpis, refetch: refetchKpis } = useListDeptScorecardKpis(selectedScId || 0);
  const createSc = useCreateDeptScorecard();
  const transitionSc = useTransitionDeptScorecard();
  const createKpi = useCreateDeptScorecardKpi();
  const updateKpi = useUpdateDeptKpi();
  const deleteKpi = useDeleteDeptKpi();
  const inheritKpis = useInheritKpisFromOrg();

  const selectedSc = deptScorecards?.find(s => s.id === selectedScId);
  const totalWeight = kpis?.reduce((s, k) => s + (k.weighting || 0), 0) || 0;

  async function handleCreateSc() {
    try {
      await createSc.mutateAsync({ data: { ...createForm, cycleId: selectedCycleId! } });
      setShowCreate(false);
      setCreateForm({ name: "", departmentId: 1, departmentName: "", parentScorecardId: 0 });
      refetchScorecards();
      toast({ title: "Departmental scorecard created" });
    } catch { toast({ title: "Error", variant: "destructive" }); }
  }

  async function handleTransition(action: string) {
    if (!selectedScId) return;
    try {
      await transitionSc.mutateAsync({ id: selectedScId, data: { action: action as DeptScorecardTransitionInputAction } });
      refetchScorecards();
      toast({ title: `Scorecard ${action}ed` });
    } catch (e) {
      toast({ title: getErrorMessage(e), variant: "destructive" });
    }
  }

  async function handleInheritKpis() {
    if (!selectedScId) return;
    try {
      await inheritKpis.mutateAsync({ id: selectedScId });
      refetchKpis();
      toast({ title: "KPIs inherited from organisational scorecard" });
    } catch (e) {
      toast({ title: getErrorMessage(e), variant: "destructive" });
    }
  }

  async function handleAddKpi() {
    if (!selectedScId) return;
    try {
      await createKpi.mutateAsync({ deptScorecardId: selectedScId, data: { kpiNumber: kpiForm.kpiNumber, description: kpiForm.description, annualTarget: kpiForm.annualTarget, weighting: kpiForm.weighting } });
      setShowAddKpi(false);
      setKpiForm({ kpiNumber: "", description: "", annualTarget: "", weighting: 0 });
      refetchKpis();
      toast({ title: "KPI added" });
    } catch { toast({ title: "Error", variant: "destructive" }); }
  }

  async function handleDeleteKpi(id: number) {
    try {
      await deleteKpi.mutateAsync({ id });
      refetchKpis();
      toast({ title: "KPI deleted" });
    } catch (e) {
      toast({ title: getErrorMessage(e), variant: "destructive" });
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Departmental Scorecards</h1>
          <p className="text-sm text-slate-500 mt-1">Create and manage departmental performance scorecards</p>
        </div>
        <div className="flex items-center gap-3">
          <Select value={selectedCycleId?.toString() || ""} onValueChange={v => { setSelectedCycleId(Number(v)); setSelectedScId(undefined); }}>
            <SelectTrigger className="w-[200px]"><SelectValue placeholder="Select Cycle" /></SelectTrigger>
            <SelectContent>{cycles?.map(c => <SelectItem key={c.id} value={c.id.toString()}>{c.financialYearLabel}</SelectItem>)}</SelectContent>
          </Select>
          {selectedCycleId && !selectedScId && (
            <Button onClick={() => setShowCreate(true)} className="bg-[#0f2b46]"><Plus className="w-4 h-4 mr-1" />New Scorecard</Button>
          )}
        </div>
      </div>

      {!selectedScId ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {deptScorecards?.map(sc => (
            <Card key={sc.id} className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setSelectedScId(sc.id)}>
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start">
                  <CardTitle className="text-base">{sc.name}</CardTitle>
                  <Badge className={STATUS_COLORS[sc.status] || "bg-gray-100"}>{sc.status}</Badge>
                </div>
                <p className="text-sm text-slate-500">{sc.departmentName}</p>
              </CardHeader>
            </Card>
          ))}
          {deptScorecards?.length === 0 && selectedCycleId && (
            <p className="text-slate-400 col-span-3 text-center py-12">No departmental scorecards yet. Create one to get started.</p>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={() => setSelectedScId(undefined)}><ArrowLeft className="w-4 h-4 mr-1" />Back</Button>
            <h2 className="text-lg font-semibold">{selectedSc?.name}</h2>
            <Badge className={STATUS_COLORS[selectedSc?.status || ""] || "bg-gray-100"}>{selectedSc?.status}</Badge>
            <span className="text-sm text-slate-500 ml-auto">Total Weighting: <strong className={Math.abs(totalWeight - 100) < 0.01 ? "text-green-600" : "text-red-600"}>{totalWeight.toFixed(1)}%</strong></span>
          </div>

          <div className="flex gap-2 flex-wrap">
            {selectedSc?.status === "Draft" && (
              <>
                <Button size="sm" onClick={handleInheritKpis} variant="outline"><Download className="w-4 h-4 mr-1" />Inherit Org KPIs</Button>
                <Button size="sm" onClick={() => setShowAddKpi(true)}><Plus className="w-4 h-4 mr-1" />Add KPI</Button>
                <Button size="sm" onClick={() => handleTransition("submit")} className="bg-blue-600 hover:bg-blue-700"><Send className="w-4 h-4 mr-1" />Submit</Button>
              </>
            )}
            {selectedSc?.status === "Submitted" && (
              <>
                <Button size="sm" onClick={() => handleTransition("approve")} className="bg-green-600 hover:bg-green-700"><Check className="w-4 h-4 mr-1" />Approve</Button>
                <Button size="sm" onClick={() => handleTransition("return")} variant="outline"><ArrowLeft className="w-4 h-4 mr-1" />Return</Button>
              </>
            )}
            {selectedSc?.status === "Approved" && (
              <Button size="sm" onClick={() => handleTransition("lock")} className="bg-purple-600 hover:bg-purple-700">Lock</Button>
            )}
          </div>

          <div className="space-y-2">
            {kpis?.map(kpi => (
              <Card key={kpi.id}>
                <CardContent className="p-4 flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <Target className="w-4 h-4 text-slate-400" />
                      <span className="font-medium text-sm">{kpi.kpiNumber}</span>
                      {kpi.isInherited && <Badge variant="outline" className="text-xs">Inherited</Badge>}
                    </div>
                    <p className="text-sm text-slate-600 mt-1">{kpi.description}</p>
                    <div className="flex gap-4 mt-1 text-xs text-slate-400">
                      <span>Target: {kpi.annualTarget}</span>
                      <span>Weight: {kpi.weighting}%</span>
                    </div>
                  </div>
                  {selectedSc?.status === "Draft" && !kpi.isInherited && (
                    <Button variant="ghost" size="icon" onClick={() => handleDeleteKpi(kpi.id)}><Trash2 className="w-4 h-4 text-red-500" /></Button>
                  )}
                </CardContent>
              </Card>
            ))}
            {kpis?.length === 0 && <p className="text-center text-slate-400 py-8">No KPIs yet. Inherit from organisational scorecard or add manually.</p>}
          </div>
        </div>
      )}

      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent>
          <DialogHeader><DialogTitle>New Departmental Scorecard</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div><Label>Name</Label><Input value={createForm.name} onChange={e => setCreateForm(p => ({ ...p, name: e.target.value }))} /></div>
            <div><Label>Department Name</Label><Input value={createForm.departmentName} onChange={e => setCreateForm(p => ({ ...p, departmentName: e.target.value }))} /></div>
            <div><Label>Department ID</Label><Input type="number" value={createForm.departmentId} onChange={e => setCreateForm(p => ({ ...p, departmentId: Number(e.target.value) }))} /></div>
            <div>
              <Label>Parent Org Scorecard</Label>
              <Select value={createForm.parentScorecardId?.toString() || "0"} onValueChange={v => setCreateForm(p => ({ ...p, parentScorecardId: Number(v) }))}>
                <SelectTrigger><SelectValue placeholder="Select parent" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="0">None</SelectItem>
                  {orgScorecards?.map(s => <SelectItem key={s.id} value={s.id.toString()}>{s.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter><Button onClick={handleCreateSc} disabled={!createForm.name || !createForm.departmentName}>Create</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showAddKpi} onOpenChange={setShowAddKpi}>
        <DialogContent>
          <DialogHeader><DialogTitle>Add Departmental KPI</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div><Label>KPI Number</Label><Input value={kpiForm.kpiNumber} onChange={e => setKpiForm(p => ({ ...p, kpiNumber: e.target.value }))} /></div>
            <div><Label>Description</Label><Input value={kpiForm.description} onChange={e => setKpiForm(p => ({ ...p, description: e.target.value }))} /></div>
            <div><Label>Annual Target</Label><Input value={kpiForm.annualTarget} onChange={e => setKpiForm(p => ({ ...p, annualTarget: e.target.value }))} /></div>
            <div><Label>Weighting (%)</Label><Input type="number" value={kpiForm.weighting} onChange={e => setKpiForm(p => ({ ...p, weighting: Number(e.target.value) }))} /></div>
          </div>
          <DialogFooter><Button onClick={handleAddKpi} disabled={!kpiForm.kpiNumber || !kpiForm.description}>Add</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
