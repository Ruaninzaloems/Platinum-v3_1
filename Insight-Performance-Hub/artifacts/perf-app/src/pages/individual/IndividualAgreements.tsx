import { useState } from "react";
import {
  useListAgreements, useCreateAgreement, useUpdateAgreement, useTransitionAgreement,
  useListEmployeeKpas, useCreateEmployeeKpa, useUpdateEmployeeKpa, useDeleteEmployeeKpa,
  useListEmployeeKpis, useCreateEmployeeKpi, useUpdateEmployeeKpi, useDeleteEmployeeKpi,
  useListCycles, useListUsers,
  type AgreementTransitionInputAction,
} from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Plus, Send, Check, Lock, ChevronRight, Trash2, Pencil } from "lucide-react";

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
  "Supervisor Review": "bg-cyan-100 text-cyan-700",
  Approved: "bg-green-100 text-green-700",
  "Quarterly Review": "bg-amber-100 text-amber-700",
  "Mid-Year Review": "bg-orange-100 text-orange-700",
  "Annual Assessment": "bg-indigo-100 text-indigo-700",
  Moderation: "bg-yellow-100 text-yellow-700",
  "Final Score": "bg-emerald-100 text-emerald-700",
  Locked: "bg-purple-100 text-purple-700",
};

export default function IndividualAgreements() {
  const { toast } = useToast();
  const { data: cycles } = useListCycles();
  const { data: users } = useListUsers();
  const [selectedCycleId, setSelectedCycleId] = useState<number | undefined>();
  const [selectedAgreementId, setSelectedAgreementId] = useState<number | undefined>();
  const [showCreate, setShowCreate] = useState(false);
  const [showAddKpa, setShowAddKpa] = useState(false);
  const [showAddKpi, setShowAddKpi] = useState(false);

  const [editingKpaId, setEditingKpaId] = useState<number | null>(null);
  const [editingKpiId, setEditingKpiId] = useState<number | null>(null);
  const [form, setForm] = useState({ employeeId: 0, employeeName: "", postTitle: "", departmentId: 0, departmentName: "" });
  const [kpaForm, setKpaForm] = useState({ title: "", description: "", weighting: 0 });
  const [kpiForm, setKpiForm] = useState({ kpaId: 0, kpiNumber: "", description: "", annualTarget: "", weighting: 0 });

  const { data: agreements, refetch } = useListAgreements({ cycleId: selectedCycleId });
  const { data: kpas, refetch: refetchKpas } = useListEmployeeKpas(selectedAgreementId || 0);
  const { data: kpis, refetch: refetchKpis } = useListEmployeeKpis(selectedAgreementId || 0);

  const createAg = useCreateAgreement();
  const transitionAg = useTransitionAgreement();
  const createKpa = useCreateEmployeeKpa();
  const updateKpa = useUpdateEmployeeKpa();
  const deleteKpa = useDeleteEmployeeKpa();
  const createKpi = useCreateEmployeeKpi();
  const updateKpi = useUpdateEmployeeKpi();
  const deleteKpi = useDeleteEmployeeKpi();

  const selectedAgreement = agreements?.find(a => a.id === selectedAgreementId);

  const handleCreate = async () => {
    if (!selectedCycleId || !form.employeeId) return;
    try {
      await createAg.mutateAsync({
        data: {
          cycleId: selectedCycleId,
          employeeId: form.employeeId,
          employeeName: form.employeeName,
          postTitle: form.postTitle,
          departmentId: form.departmentId,
          departmentName: form.departmentName,
        },
      });
      toast({ title: "Agreement created" });
      setShowCreate(false);
      setForm({ employeeId: 0, employeeName: "", postTitle: "", departmentId: 0, departmentName: "" });
      refetch();
    } catch (e: unknown) {
      toast({ title: "Error", description: getErrorMessage(e), variant: "destructive" });
    }
  };

  const handleTransition = async (action: string) => {
    if (!selectedAgreementId) return;
    try {
      await transitionAg.mutateAsync({ id: selectedAgreementId, data: { action: action as AgreementTransitionInputAction } });
      toast({ title: `Agreement ${action}ed` });
      refetch();
    } catch (e: unknown) {
      toast({ title: "Error", description: getErrorMessage(e), variant: "destructive" });
    }
  };

  const handleAddKpa = async () => {
    if (!selectedAgreementId) return;
    try {
      await createKpa.mutateAsync({ agreementId: selectedAgreementId, data: kpaForm });
      toast({ title: "KPA added" });
      setShowAddKpa(false);
      setKpaForm({ title: "", description: "", weighting: 0 });
      refetchKpas();
    } catch (e: unknown) {
      toast({ title: "Error", description: getErrorMessage(e), variant: "destructive" });
    }
  };

  const handleAddKpi = async () => {
    if (!selectedAgreementId || !kpiForm.kpaId) return;
    try {
      await createKpi.mutateAsync({ agreementId: selectedAgreementId, data: kpiForm });
      toast({ title: "KPI added" });
      setShowAddKpi(false);
      setEditingKpiId(null);
      setKpiForm({ kpaId: 0, kpiNumber: "", description: "", annualTarget: "", weighting: 0 });
      refetchKpis();
    } catch (e: unknown) {
      toast({ title: "Error", description: getErrorMessage(e), variant: "destructive" });
    }
  };

  const openEditKpa = (kpa: NonNullable<typeof kpas>[number]) => {
    setKpaForm({ title: kpa.title ?? "", description: kpa.description ?? "", weighting: kpa.weighting ?? 0 });
    setEditingKpaId(kpa.id);
    setShowAddKpa(true);
  };

  const handleUpdateKpa = async () => {
    if (!editingKpaId) return;
    try {
      await updateKpa.mutateAsync({ id: editingKpaId, data: kpaForm });
      toast({ title: "KPA updated" });
      setShowAddKpa(false);
      setEditingKpaId(null);
      setKpaForm({ title: "", description: "", weighting: 0 });
      refetchKpas();
    } catch (e: unknown) {
      toast({ title: "Error", description: getErrorMessage(e), variant: "destructive" });
    }
  };

  const openEditKpi = (kpi: NonNullable<typeof kpis>[number]) => {
    setKpiForm({ kpaId: kpi.kpaId ?? 0, kpiNumber: kpi.kpiNumber ?? "", description: kpi.description ?? "", annualTarget: kpi.annualTarget ?? "", weighting: kpi.weighting ?? 0 });
    setEditingKpiId(kpi.id);
    setShowAddKpi(true);
  };

  const handleUpdateKpi = async () => {
    if (!editingKpiId) return;
    try {
      await updateKpi.mutateAsync({ id: editingKpiId, data: kpiForm });
      toast({ title: "KPI updated" });
      setShowAddKpi(false);
      setEditingKpiId(null);
      setKpiForm({ kpaId: 0, kpiNumber: "", description: "", annualTarget: "", weighting: 0 });
      refetchKpis();
    } catch (e: unknown) {
      toast({ title: "Error", description: getErrorMessage(e), variant: "destructive" });
    }
  };

  if (selectedAgreementId && selectedAgreement) {
    return (
      <div className="space-y-6 animate-in fade-in duration-300">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => setSelectedAgreementId(undefined)}>
            <ChevronRight className="w-4 h-4 rotate-180 mr-1" /> Back
          </Button>
          <div>
            <h2 className="text-xl font-bold text-slate-800">{selectedAgreement.employeeName}</h2>
            <p className="text-sm text-slate-500">{selectedAgreement.postTitle} — {selectedAgreement.departmentName}</p>
          </div>
          <Badge className={STATUS_COLORS[selectedAgreement.status] || ""}>{selectedAgreement.status}</Badge>
          <div className="ml-auto flex gap-2">
            {selectedAgreement.status === "Draft" && (
              <Button size="sm" onClick={() => handleTransition("submit")}><Send className="w-4 h-4 mr-1" /> Submit</Button>
            )}
            {selectedAgreement.status === "Submitted" && (<>
              <Button size="sm" variant="outline" onClick={() => handleTransition("return_to_draft")}>Return to Draft</Button>
              <Button size="sm" onClick={() => handleTransition("approve")}><Check className="w-4 h-4 mr-1" /> Send to Supervisor</Button>
            </>)}
            {selectedAgreement.status === "Supervisor Review" && (<>
              <Button size="sm" variant="outline" onClick={() => handleTransition("reject")}>Return</Button>
              <Button size="sm" onClick={() => handleTransition("approve")}><Check className="w-4 h-4 mr-1" /> Approve</Button>
            </>)}
            {selectedAgreement.status === "Approved" && (
              <Button size="sm" onClick={() => handleTransition("start_quarterly")}>Start Quarterly Review</Button>
            )}
            {selectedAgreement.status === "Quarterly Review" && (<>
              <Button size="sm" variant="outline" onClick={() => handleTransition("reject")}>Return</Button>
              <Button size="sm" onClick={() => handleTransition("complete_quarterly")}>Complete Quarterly</Button>
            </>)}
            {selectedAgreement.status === "Mid-Year Review" && (<>
              <Button size="sm" variant="outline" onClick={() => handleTransition("reject")}>Return</Button>
              <Button size="sm" onClick={() => handleTransition("complete_midyear")}>Complete Mid-Year</Button>
            </>)}
            {selectedAgreement.status === "Annual Assessment" && (<>
              <Button size="sm" variant="outline" onClick={() => handleTransition("reject")}>Return</Button>
              <Button size="sm" onClick={() => handleTransition("complete_annual")}>Complete Annual</Button>
            </>)}
            {selectedAgreement.status === "Moderation" && (<>
              <Button size="sm" variant="outline" onClick={() => handleTransition("refer")}>Refer Back</Button>
              <Button size="sm" onClick={() => handleTransition("accept")}>Accept Score</Button>
            </>)}
            {selectedAgreement.status === "Final Score" && (
              <Button size="sm" onClick={() => handleTransition("lock")}><Lock className="w-4 h-4 mr-1" /> Lock</Button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <Card><CardContent className="pt-4"><p className="text-sm text-slate-500">KPI Weight</p><p className="text-2xl font-bold">{selectedAgreement.kpiWeightPct}%</p></CardContent></Card>
          <Card><CardContent className="pt-4"><p className="text-sm text-slate-500">Competency Weight</p><p className="text-2xl font-bold">{selectedAgreement.competencyWeightPct}%</p></CardContent></Card>
          <Card><CardContent className="pt-4"><p className="text-sm text-slate-500">Final Score</p><p className="text-2xl font-bold">{selectedAgreement.finalScore ?? "—"}</p></CardContent></Card>
        </div>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg">Key Performance Areas</CardTitle>
            {selectedAgreement.status === "Draft" && <Button size="sm" onClick={() => setShowAddKpa(true)}><Plus className="w-4 h-4 mr-1" /> Add KPA</Button>}
          </CardHeader>
          <CardContent>
            {!kpas?.length ? (
              <p className="text-sm text-slate-400 text-center py-4">No KPAs defined yet</p>
            ) : (
              <div className="space-y-3">
                {kpas.map(kpa => (
                  <div key={kpa.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                    <div>
                      <p className="font-medium text-slate-800">{kpa.title}</p>
                      {kpa.description && <p className="text-sm text-slate-500">{kpa.description}</p>}
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge variant="outline">{kpa.weighting}%</Badge>
                      {selectedAgreement.status === "Draft" && (
                        <>
                          <Button variant="ghost" size="sm" onClick={() => openEditKpa(kpa)}>
                            <Pencil className="w-4 h-4 text-blue-500" />
                          </Button>
                          <Button variant="ghost" size="sm" onClick={async () => { await deleteKpa.mutateAsync({ id: kpa.id }); refetchKpas(); }}>
                            <Trash2 className="w-4 h-4 text-red-400" />
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg">Key Performance Indicators</CardTitle>
            {selectedAgreement.status === "Draft" && kpas && kpas.length > 0 && (
              <Button size="sm" onClick={() => setShowAddKpi(true)}><Plus className="w-4 h-4 mr-1" /> Add KPI</Button>
            )}
          </CardHeader>
          <CardContent>
            {!kpis?.length ? (
              <p className="text-sm text-slate-400 text-center py-4">No KPIs defined yet</p>
            ) : (
              <table className="w-full text-sm">
                <thead><tr className="border-b text-slate-500"><th className="text-left py-2 px-2">KPI #</th><th className="text-left py-2 px-2">Description</th><th className="text-left py-2 px-2">Target</th><th className="text-right py-2 px-2">Weight</th><th className="text-right py-2 px-2"></th></tr></thead>
                <tbody>
                  {kpis.map(kpi => (
                    <tr key={kpi.id} className="border-b last:border-0 hover:bg-slate-50">
                      <td className="py-2 px-2 font-medium">{kpi.kpiNumber}</td>
                      <td className="py-2 px-2">{kpi.description}</td>
                      <td className="py-2 px-2">{kpi.annualTarget}</td>
                      <td className="py-2 px-2 text-right">{kpi.weighting}%</td>
                      <td className="py-2 px-2 text-right">
                        {selectedAgreement.status === "Draft" && (
                          <div className="flex gap-1 justify-end">
                            <Button variant="ghost" size="sm" onClick={() => openEditKpi(kpi)}>
                              <Pencil className="w-4 h-4 text-blue-500" />
                            </Button>
                            <Button variant="ghost" size="sm" onClick={async () => { await deleteKpi.mutateAsync({ id: kpi.id }); refetchKpis(); }}>
                              <Trash2 className="w-4 h-4 text-red-400" />
                            </Button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </CardContent>
        </Card>

        <Dialog open={showAddKpa} onOpenChange={v => { setShowAddKpa(v); if (!v) setEditingKpaId(null); }}>
          <DialogContent>
            <DialogHeader><DialogTitle>{editingKpaId ? "Edit KPA" : "Add Key Performance Area"}</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div><Label>Title</Label><Input value={kpaForm.title} onChange={e => setKpaForm(p => ({ ...p, title: e.target.value }))} /></div>
              <div><Label>Description</Label><Input value={kpaForm.description} onChange={e => setKpaForm(p => ({ ...p, description: e.target.value }))} /></div>
              <div><Label>Weighting (%)</Label><Input type="number" value={kpaForm.weighting} onChange={e => setKpaForm(p => ({ ...p, weighting: Number(e.target.value) }))} /></div>
            </div>
            <DialogFooter><Button onClick={editingKpaId ? handleUpdateKpa : handleAddKpa}>{editingKpaId ? "Save Changes" : "Add KPA"}</Button></DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog open={showAddKpi} onOpenChange={v => { setShowAddKpi(v); if (!v) setEditingKpiId(null); }}>
          <DialogContent>
            <DialogHeader><DialogTitle>{editingKpiId ? "Edit KPI" : "Add Key Performance Indicator"}</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>KPA</Label>
                <Select value={kpiForm.kpaId ? String(kpiForm.kpaId) : "none"} onValueChange={v => setKpiForm(p => ({ ...p, kpaId: Number(v) }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Select KPA</SelectItem>
                    {kpas?.map(k => <SelectItem key={k.id} value={String(k.id)}>{k.title}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div><Label>KPI Number</Label><Input value={kpiForm.kpiNumber} onChange={e => setKpiForm(p => ({ ...p, kpiNumber: e.target.value }))} /></div>
              <div><Label>Description</Label><Input value={kpiForm.description} onChange={e => setKpiForm(p => ({ ...p, description: e.target.value }))} /></div>
              <div><Label>Annual Target</Label><Input value={kpiForm.annualTarget} onChange={e => setKpiForm(p => ({ ...p, annualTarget: e.target.value }))} /></div>
              <div><Label>Weighting (%)</Label><Input type="number" value={kpiForm.weighting} onChange={e => setKpiForm(p => ({ ...p, weighting: Number(e.target.value) }))} /></div>
            </div>
            <DialogFooter><Button onClick={editingKpiId ? handleUpdateKpi : handleAddKpi}>{editingKpiId ? "Save Changes" : "Add KPI"}</Button></DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Individual Performance Agreements</h1>
          <p className="text-slate-500 mt-1">Manage employee performance agreements, KPAs, and KPIs</p>
        </div>
        <div className="flex gap-3">
          <Select value={selectedCycleId ? String(selectedCycleId) : "all"} onValueChange={v => setSelectedCycleId(v === "all" ? undefined : Number(v))}>
            <SelectTrigger className="w-[220px]"><SelectValue placeholder="All cycles" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Cycles</SelectItem>
              {cycles?.map(c => <SelectItem key={c.id} value={String(c.id)}>{c.financialYearLabel}</SelectItem>)}
            </SelectContent>
          </Select>
          <Button onClick={() => setShowCreate(true)}><Plus className="w-4 h-4 mr-1" /> New Agreement</Button>
        </div>
      </div>

      {!agreements?.length ? (
        <Card><CardContent className="py-12 text-center text-slate-400">No agreements found. Create one to get started.</CardContent></Card>
      ) : (
        <div className="grid gap-4">
          {agreements.map(ag => (
            <Card key={ag.id} className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setSelectedAgreementId(ag.id)}>
              <CardContent className="flex items-center justify-between py-4">
                <div>
                  <p className="font-semibold text-slate-800">{ag.employeeName}</p>
                  <p className="text-sm text-slate-500">{ag.postTitle} — {ag.departmentName}</p>
                </div>
                <div className="flex items-center gap-3">
                  {ag.finalScore !== null && ag.finalScore !== undefined && <span className="text-lg font-bold text-slate-700">{ag.finalScore.toFixed(1)}</span>}
                  <Badge className={STATUS_COLORS[ag.status] || ""}>{ag.status}</Badge>
                  <ChevronRight className="w-5 h-5 text-slate-400" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent>
          <DialogHeader><DialogTitle>New Performance Agreement</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Employee</Label>
              <Select value={form.employeeId ? String(form.employeeId) : "none"} onValueChange={v => {
                const u = users?.find(u => u.id === Number(v));
                if (u) setForm(p => ({ ...p, employeeId: u.id, employeeName: u.displayName, departmentId: u.departmentId ?? 0 }));
              }}>
                <SelectTrigger><SelectValue placeholder="Select employee" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Select employee</SelectItem>
                  {users?.filter(u => u.isActive).map(u => <SelectItem key={u.id} value={String(u.id)}>{u.displayName} ({u.role})</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div><Label>Post Title</Label><Input value={form.postTitle} onChange={e => setForm(p => ({ ...p, postTitle: e.target.value }))} /></div>
            <div><Label>Department Name</Label><Input value={form.departmentName} onChange={e => setForm(p => ({ ...p, departmentName: e.target.value }))} /></div>
          </div>
          <DialogFooter><Button onClick={handleCreate} disabled={!form.employeeId || !form.postTitle}>Create Agreement</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
