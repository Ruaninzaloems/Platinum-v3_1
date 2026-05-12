import { useState } from "react";
import {
  useListScorecards, useListScorecardKpis,
  useListQuarterTargets, useUpsertQuarterTargets,
  useListMonthActivities, useCreateMonthActivity,
  useUpdateMonthActivity, useDeleteMonthActivity
} from "@workspace/api-client-react";
import { useListCycles } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/core/hooks/use-toast";
import { Plus, Trash2, Save, Calendar, Target } from "lucide-react";

export default function MonthlyActivities() {
  const { toast } = useToast();
  const { data: cycles } = useListCycles();
  const [selectedCycleId, setSelectedCycleId] = useState<number | undefined>();
  const [selectedScorecardId, setSelectedScorecardId] = useState<number | undefined>();
  const [selectedKpiId, setSelectedKpiId] = useState<number | undefined>();
  const [selectedQuarter, setSelectedQuarter] = useState(1);
  const [showNewActivity, setShowNewActivity] = useState(false);
  const [showTargets, setShowTargets] = useState(false);
  const [activityForm, setActivityForm] = useState({ month: 7, description: "", dueDate: "" });
  const [targetForm, setTargetForm] = useState({ q1Target: "", q2Target: "", q3Target: "", q4Target: "" });

  const effectiveCycleId = selectedCycleId || cycles?.[0]?.id;
  const { data: scorecards } = useListScorecards({ cycleId: effectiveCycleId });
  const kpisQuery = useListScorecardKpis(selectedScorecardId ?? 0);
  const kpis = selectedScorecardId ? kpisQuery.data : undefined;
  const { data: targets, refetch: refetchTargets } = useListQuarterTargets(selectedKpiId ?? 0);
  const { data: activities, refetch: refetchActivities } = useListMonthActivities(selectedKpiId ?? 0, { quarter: selectedQuarter });

  const upsertTargets = useUpsertQuarterTargets();
  const createActivity = useCreateMonthActivity();
  const updateActivity = useUpdateMonthActivity();
  const deleteActivity = useDeleteMonthActivity();

  const selectedKpi = kpis?.find(k => k.id === selectedKpiId);

  function openTargetDialog() {
    if (targets && targets.length > 0) {
      const byQ: Record<number, string> = {};
      targets.forEach(t => { byQ[t.quarter] = t.targetValue; });
      setTargetForm({
        q1Target: byQ[1] || "", q2Target: byQ[2] || "",
        q3Target: byQ[3] || "", q4Target: byQ[4] || "",
      });
    } else {
      setTargetForm({ q1Target: "", q2Target: "", q3Target: "", q4Target: "" });
    }
    setShowTargets(true);
  }

  async function handleSaveTargets() {
    if (!selectedKpiId) return;
    try {
      const quarterTargets = [
        { quarter: 1, targetValue: targetForm.q1Target },
        { quarter: 2, targetValue: targetForm.q2Target },
        { quarter: 3, targetValue: targetForm.q3Target },
        { quarter: 4, targetValue: targetForm.q4Target },
      ].filter(t => t.targetValue);
      await upsertTargets.mutateAsync({ kpiId: selectedKpiId, data: { targets: quarterTargets } });
      setShowTargets(false);
      refetchTargets();
      toast({ title: "Quarterly targets saved" });
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Error";
      toast({ title: msg, variant: "destructive" });
    }
  }

  async function handleCreateActivity() {
    if (!selectedKpiId || !activityForm.description) return;
    try {
      await createActivity.mutateAsync({
        kpiId: selectedKpiId,
        data: {
          quarter: selectedQuarter,
          month: activityForm.month,
          description: activityForm.description,
          dueDate: activityForm.dueDate || new Date().toISOString().split("T")[0],
        }
      });
      setShowNewActivity(false);
      setActivityForm({ month: quarterMonths[selectedQuarter]?.[0] ?? 1, description: "", dueDate: "" });
      refetchActivities();
      toast({ title: "Activity created" });
    } catch { toast({ title: "Error creating activity", variant: "destructive" }); }
  }

  async function handleDeleteActivity(id: number) {
    try {
      await deleteActivity.mutateAsync({ id });
      refetchActivities();
      toast({ title: "Activity deleted" });
    } catch { toast({ title: "Error", variant: "destructive" }); }
  }

  async function handleToggleComplete(id: number, currentStatus: string) {
    try {
      const newStatus = currentStatus === "Completed" ? "Pending" : "Completed";
      await updateActivity.mutateAsync({ id, data: { status: newStatus } });
      refetchActivities();
    } catch { toast({ title: "Error", variant: "destructive" }); }
  }

  const monthNames: Record<number, string> = { 1: "Jan", 2: "Feb", 3: "Mar", 4: "Apr", 5: "May", 6: "Jun", 7: "Jul", 8: "Aug", 9: "Sep", 10: "Oct", 11: "Nov", 12: "Dec" };
  const quarterMonths: Record<number, number[]> = { 1: [7, 8, 9], 2: [10, 11, 12], 3: [1, 2, 3], 4: [4, 5, 6] };

  return (
    <div className="space-y-6 animate-in fade-in-50 duration-300">
      <div>
        <h2 className="text-2xl font-bold text-slate-800">Quarterly Targets & Monthly Activities</h2>
        <p className="text-slate-500">Set quarterly targets and plan monthly activities for each KPI</p>
      </div>

      <div className="flex gap-3 flex-wrap">
        {cycles && (
          <Select value={String(effectiveCycleId)} onValueChange={v => setSelectedCycleId(Number(v))}>
            <SelectTrigger className="w-48"><SelectValue placeholder="Cycle" /></SelectTrigger>
            <SelectContent>
              {cycles.map(c => <SelectItem key={c.id} value={String(c.id)}>{c.financialYearLabel}</SelectItem>)}
            </SelectContent>
          </Select>
        )}
        {scorecards && scorecards.length > 0 && (
          <Select value={String(selectedScorecardId || "")} onValueChange={v => { setSelectedScorecardId(Number(v)); setSelectedKpiId(undefined); }}>
            <SelectTrigger className="w-64"><SelectValue placeholder="Select scorecard" /></SelectTrigger>
            <SelectContent>
              {scorecards.map(s => <SelectItem key={s.id} value={String(s.id)}>{s.name}</SelectItem>)}
            </SelectContent>
          </Select>
        )}
        {kpis && kpis.length > 0 && (
          <Select value={String(selectedKpiId || "")} onValueChange={v => setSelectedKpiId(Number(v))}>
            <SelectTrigger className="w-64"><SelectValue placeholder="Select KPI" /></SelectTrigger>
            <SelectContent>
              {kpis.map(k => <SelectItem key={k.id} value={String(k.id)}>{k.kpiNumber} - {k.description.substring(0, 40)}</SelectItem>)}
            </SelectContent>
          </Select>
        )}
      </div>

      {selectedKpi && (
        <Card className="bg-slate-50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-mono text-sm">{selectedKpi.kpiNumber}</span>
                  <Badge variant="outline">{selectedKpi.status}</Badge>
                </div>
                <p className="font-medium">{selectedKpi.description}</p>
                <p className="text-sm text-slate-500 mt-1">Annual Target: {selectedKpi.annualTarget}</p>
              </div>
              <Button variant="outline" onClick={openTargetDialog}>
                <Target className="w-4 h-4 mr-1" /> Set Quarterly Targets
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {selectedKpiId && targets && targets.length > 0 && (
        <div className="grid grid-cols-4 gap-3">
          {[1, 2, 3, 4].map(q => {
            const t = targets.find(t => t.quarter === q);
            return (
              <Card key={q} className={`cursor-pointer transition-all ${selectedQuarter === q ? "ring-2 ring-blue-500" : "hover:shadow-md"}`} onClick={() => setSelectedQuarter(q)}>
                <CardContent className="p-4 text-center">
                  <p className="text-sm font-medium text-slate-500">Q{q}</p>
                  <p className="text-xl font-bold text-slate-800">{t?.targetValue || "-"}</p>
                  {t?.isApprovedBaseline && <Badge className="bg-green-100 text-green-700 text-xs mt-1">Baseline Locked</Badge>}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {selectedKpiId && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-lg font-semibold text-slate-700">
              <Calendar className="w-5 h-5 inline mr-2" />
              Q{selectedQuarter} Monthly Activities
            </h3>
            <Button size="sm" onClick={() => { setActivityForm(p => ({ ...p, month: quarterMonths[selectedQuarter]?.[0] ?? 1 })); setShowNewActivity(true); }}>
              <Plus className="w-4 h-4 mr-1" /> Add Activity
            </Button>
          </div>

          <div className="space-y-2">
            {activities?.map(act => (
              <Card key={act.id}>
                <CardContent className="p-3 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={act.status === "Completed"}
                      onChange={() => handleToggleComplete(act.id, act.status)}
                      className="w-4 h-4 rounded border-slate-300"
                    />
                    <div>
                      <p className={`text-sm font-medium ${act.status === "Completed" ? "line-through text-slate-400" : "text-slate-800"}`}>
                        {act.description}
                      </p>
                      <div className="flex gap-3 text-xs text-slate-500">
                        <span>{monthNames[act.month] || `Month ${act.month}`}</span>
                        {act.dueDate && <span>Due: {act.dueDate}</span>}
                      </div>
                    </div>
                  </div>
                  <Button variant="ghost" size="sm" className="text-red-500" onClick={() => handleDeleteActivity(act.id)}>
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </CardContent>
              </Card>
            ))}
            {(!activities || activities.length === 0) && (
              <Card className="border-dashed">
                <CardContent className="p-6 text-center text-slate-500">
                  <p className="text-sm">No activities planned for Q{selectedQuarter}</p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      )}

      <Dialog open={showTargets} onOpenChange={setShowTargets}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Quarterly Targets</DialogTitle></DialogHeader>
          <div className="space-y-4">
            {[1, 2, 3, 4].map(q => {
              const key = `q${q}Target` as keyof typeof targetForm;
              return (
                <div key={q}>
                  <Label>Q{q} Target</Label>
                  <Input value={targetForm[key]} onChange={e => setTargetForm(p => ({ ...p, [key]: e.target.value }))} placeholder="Target value" />
                </div>
              );
            })}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowTargets(false)}>Cancel</Button>
            <Button onClick={handleSaveTargets}><Save className="w-4 h-4 mr-1" /> Save Targets</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showNewActivity} onOpenChange={setShowNewActivity}>
        <DialogContent>
          <DialogHeader><DialogTitle>Add Monthly Activity</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Month</Label>
              <Select value={String(activityForm.month)} onValueChange={v => setActivityForm(p => ({ ...p, month: Number(v) }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {(quarterMonths[selectedQuarter] || []).map(m => (
                    <SelectItem key={m} value={String(m)}>{monthNames[m]} (Month {m})</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div><Label>Activity Description *</Label><Textarea value={activityForm.description} onChange={e => setActivityForm(p => ({ ...p, description: e.target.value }))} /></div>
            <div><Label>Due Date</Label><Input type="date" value={activityForm.dueDate} onChange={e => setActivityForm(p => ({ ...p, dueDate: e.target.value }))} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNewActivity(false)}>Cancel</Button>
            <Button onClick={handleCreateActivity} disabled={!activityForm.description}>Create</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
