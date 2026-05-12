import { useState, useEffect } from "react";
import {
  useListScorecards, useCreateScorecard, useTransitionScorecard,
  useListScorecardKpis, useCreateScorecardKpi, useUpdateScorecardKpi,
  useDeleteScorecardKpi, useTransitionScorecardKpi,
  useListQuarterTargets, useUpsertQuarterTargets,
  useListMonthActivities, useCreateMonthActivity,
  useUpdateMonthActivity, useDeleteMonthActivity,
  useListUnitsOfMeasure, useListUsers,
} from "@workspace/api-client-react";
import { useListCycles } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/core/hooks/use-toast";
import {
  Plus, Send, Check, ArrowLeft, Target, FileText, BarChart2,
  Save, Calendar, Trash2, Pencil, Loader2,
} from "lucide-react";

const STATUS_COLORS: Record<string, string> = {
  Draft: "bg-gray-100 text-gray-700",
  Submitted: "bg-blue-100 text-blue-700",
  Reviewed: "bg-amber-100 text-amber-700",
  Approved: "bg-green-100 text-green-700",
};

const MONTH_NAMES: Record<number, string> = {
  1: "January", 2: "February", 3: "March", 4: "April",
  5: "May", 6: "June", 7: "July", 8: "August",
  9: "September", 10: "October", 11: "November", 12: "December",
};

const QUARTER_MONTHS: Record<number, number[]> = {
  1: [7, 8, 9], 2: [10, 11, 12], 3: [1, 2, 3], 4: [4, 5, 6],
};

const EMPTY_KPI_FORM = {
  kpiNumber: "", description: "", idpReference: "", strategicObjective: "",
  programme: "", baseline: "", annualTarget: "", weighting: 0,
  evidenceSource: "", evidencePortfolio: "", fundingSource: "",
  budgetDescription: "", annualBudgetTarget: 0, isCumulative: false,
  unitOfMeasureId: undefined as number | undefined,
  responsiblePostId: undefined as number | undefined,
  custodianPostId: undefined as number | undefined,
};

type KpiForm = typeof EMPTY_KPI_FORM;

export default function OrgKpiPlanning() {
  const { toast } = useToast();
  const { data: cycles } = useListCycles();
  const { data: uoms } = useListUnitsOfMeasure();
  const { data: users } = useListUsers();
  const [selectedCycleId, setSelectedCycleId] = useState<number | undefined>();
  const [selectedScorecardId, setSelectedScorecardId] = useState<number | undefined>();
  const [selectedKpiId, setSelectedKpiId] = useState<number | undefined>();
  const [isNewKpi, setIsNewKpi] = useState(false);
  const [showNewScorecard, setShowNewScorecard] = useState(false);
  const [scorecardName, setScorecardName] = useState("");
  const [kpiForm, setKpiForm] = useState<KpiForm>(EMPTY_KPI_FORM);
  const [isSaving, setIsSaving] = useState(false);
  const [activeTab, setActiveTab] = useState("basic");

  const effectiveCycleId = selectedCycleId || cycles?.[0]?.id;
  const { data: scorecards, refetch: refetchScorecards } = useListScorecards({ cycleId: effectiveCycleId });
  const kpisQuery = useListScorecardKpis(selectedScorecardId ?? 0);
  const kpis = selectedScorecardId ? kpisQuery.data : undefined;

  const selectedScorecard = scorecards?.find(s => s.id === selectedScorecardId);
  const selectedKpi = kpis?.find(k => k.id === selectedKpiId);

  const createScorecard = useCreateScorecard();
  const transitionScorecard = useTransitionScorecard();
  const createKpi = useCreateScorecardKpi();
  const updateKpi = useUpdateScorecardKpi();
  const deleteKpi = useDeleteScorecardKpi();
  const transitionKpi = useTransitionScorecardKpi();

  const { data: quarterTargets, refetch: refetchTargets } = useListQuarterTargets(selectedKpiId ?? 0);
  const upsertTargets = useUpsertQuarterTargets();
  const [targetForm, setTargetForm] = useState({ q1: "", q2: "", q3: "", q4: "" });
  const [targetBudgetForm, setTargetBudgetForm] = useState({ q1: "", q2: "", q3: "", q4: "" });
  const [targetEvidenceForm, setTargetEvidenceForm] = useState({ q1: "", q2: "", q3: "", q4: "" });

  const [selectedQuarter, setSelectedQuarter] = useState(1);
  const { data: activities, refetch: refetchActivities } = useListMonthActivities(
    selectedKpiId ?? 0, { quarter: selectedQuarter }
  );
  const { data: tasks, refetch: refetchTasks } = useListMonthActivities(
    selectedKpiId ?? 0, { quarter: 5 }
  );
  const createActivity = useCreateMonthActivity();
  const updateActivity = useUpdateMonthActivity();
  const deleteActivity = useDeleteMonthActivity();
  const [activityForm, setActivityForm] = useState({ month: 7, description: "", dueDate: "" });
  const [showNewActivity, setShowNewActivity] = useState(false);
  const [taskForm, setTaskForm] = useState({
    taskName: "", ownerId: undefined as number | undefined,
    quarter: 1, financialTarget: "", portfolioOfEvidence: "",
  });
  const [showNewTask, setShowNewTask] = useState(false);

  useEffect(() => {
    if (quarterTargets && quarterTargets.length > 0) {
      const byQ: Record<number, typeof quarterTargets[number]> = {};
      quarterTargets.forEach(t => { byQ[t.quarter] = t; });
      setTargetForm({
        q1: byQ[1]?.targetValue ?? "", q2: byQ[2]?.targetValue ?? "",
        q3: byQ[3]?.targetValue ?? "", q4: byQ[4]?.targetValue ?? "",
      });
      setTargetBudgetForm({
        q1: byQ[1]?.budgetValue != null ? String(byQ[1].budgetValue) : "",
        q2: byQ[2]?.budgetValue != null ? String(byQ[2].budgetValue) : "",
        q3: byQ[3]?.budgetValue != null ? String(byQ[3].budgetValue) : "",
        q4: byQ[4]?.budgetValue != null ? String(byQ[4].budgetValue) : "",
      });
      setTargetEvidenceForm({
        q1: byQ[1]?.evidenceExpected ?? "",
        q2: byQ[2]?.evidenceExpected ?? "",
        q3: byQ[3]?.evidenceExpected ?? "",
        q4: byQ[4]?.evidenceExpected ?? "",
      });
    }
  }, [quarterTargets]);

  function openKpiDetail(kpi: NonNullable<typeof kpis>[number]) {
    setKpiForm({
      kpiNumber: kpi.kpiNumber ?? "",
      description: kpi.description ?? "",
      idpReference: kpi.idpReference ?? "",
      strategicObjective: kpi.strategicObjective ?? "",
      programme: kpi.programme ?? "",
      baseline: kpi.baseline ?? "",
      annualTarget: kpi.annualTarget ?? "",
      weighting: kpi.weighting ?? 0,
      evidenceSource: kpi.evidenceSource ?? "",
      evidencePortfolio: kpi.evidencePortfolio ?? "",
      fundingSource: kpi.fundingSource ?? "",
      budgetDescription: kpi.budgetDescription ?? "",
      annualBudgetTarget: kpi.annualBudgetTarget ?? 0,
      isCumulative: kpi.isCumulative ?? false,
      unitOfMeasureId: kpi.unitOfMeasureId ?? undefined,
      responsiblePostId: kpi.responsiblePostId ?? undefined,
      custodianPostId: kpi.custodianPostId ?? undefined,
    });
    setSelectedKpiId(kpi.id);
    setIsNewKpi(false);
    setActiveTab("basic");
  }

  function openNewKpi() {
    setKpiForm(EMPTY_KPI_FORM);
    setSelectedKpiId(undefined);
    setIsNewKpi(true);
    setActiveTab("basic");
  }

  async function handleCreateScorecard() {
    if (!effectiveCycleId || !scorecardName.trim()) return;
    try {
      await createScorecard.mutateAsync({ data: { name: scorecardName, cycleId: effectiveCycleId } });
      setScorecardName("");
      setShowNewScorecard(false);
      refetchScorecards();
      toast({ title: "Scorecard created" });
    } catch { toast({ title: "Error creating scorecard", variant: "destructive" }); }
  }

  async function handleTransitionScorecard(action: string) {
    if (!selectedScorecardId) return;
    try {
      await transitionScorecard.mutateAsync({ id: selectedScorecardId, data: { action } });
      refetchScorecards();
      toast({ title: `Scorecard ${action}ed` });
    } catch (e: unknown) {
      toast({ title: e instanceof Error ? e.message : "Error", variant: "destructive" });
    }
  }

  async function handleTransitionKpi(kpiId: number, action: string) {
    try {
      await transitionKpi.mutateAsync({ id: kpiId, data: { action } });
      kpisQuery.refetch();
      toast({ title: `KPI ${action}ed` });
    } catch (e: unknown) {
      toast({ title: e instanceof Error ? e.message : "Error", variant: "destructive" });
    }
  }

  async function handleDeleteKpi(kpiId: number) {
    try {
      await deleteKpi.mutateAsync({ id: kpiId });
      kpisQuery.refetch();
      toast({ title: "KPI deleted" });
    } catch { toast({ title: "Error deleting KPI", variant: "destructive" }); }
  }

  async function handleSaveKpi() {
    if (!kpiForm.kpiNumber || !kpiForm.description || !kpiForm.annualTarget) return;
    setIsSaving(true);
    const payload = {
      kpiNumber: kpiForm.kpiNumber,
      description: kpiForm.description,
      annualTarget: kpiForm.annualTarget,
      idpReference: kpiForm.idpReference || undefined,
      strategicObjective: kpiForm.strategicObjective || undefined,
      programme: kpiForm.programme || undefined,
      baseline: kpiForm.baseline || undefined,
      weighting: kpiForm.weighting,
      evidenceSource: kpiForm.evidenceSource || undefined,
      evidencePortfolio: kpiForm.evidencePortfolio || undefined,
      fundingSource: kpiForm.fundingSource || undefined,
      budgetDescription: kpiForm.budgetDescription || undefined,
      annualBudgetTarget: kpiForm.annualBudgetTarget || undefined,
      isCumulative: kpiForm.isCumulative,
      unitOfMeasureId: kpiForm.unitOfMeasureId || undefined,
      responsiblePostId: kpiForm.responsiblePostId || undefined,
      custodianPostId: kpiForm.custodianPostId || undefined,
    };
    try {
      if (isNewKpi) {
        if (!selectedScorecardId) return;
        const created = await createKpi.mutateAsync({ scorecardId: selectedScorecardId, data: payload });
        setSelectedKpiId(created.id);
        setIsNewKpi(false);
        kpisQuery.refetch();
        toast({ title: "KPI created — fill in remaining tabs" });
        setActiveTab("idp");
      } else {
        if (!selectedKpiId) return;
        await updateKpi.mutateAsync({ id: selectedKpiId, data: payload });
        kpisQuery.refetch();
        toast({ title: "KPI saved" });
      }
    } catch (e: unknown) {
      toast({ title: e instanceof Error ? e.message : "Error saving KPI", variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  }

  async function handleSaveTargets() {
    if (!selectedKpiId) return;
    try {
      const targets = [
        { quarter: 1, targetValue: targetForm.q1, budgetValue: targetBudgetForm.q1 ? Number(targetBudgetForm.q1) : undefined, evidenceExpected: targetEvidenceForm.q1 || undefined },
        { quarter: 2, targetValue: targetForm.q2, budgetValue: targetBudgetForm.q2 ? Number(targetBudgetForm.q2) : undefined, evidenceExpected: targetEvidenceForm.q2 || undefined },
        { quarter: 3, targetValue: targetForm.q3, budgetValue: targetBudgetForm.q3 ? Number(targetBudgetForm.q3) : undefined, evidenceExpected: targetEvidenceForm.q3 || undefined },
        { quarter: 4, targetValue: targetForm.q4, budgetValue: targetBudgetForm.q4 ? Number(targetBudgetForm.q4) : undefined, evidenceExpected: targetEvidenceForm.q4 || undefined },
      ].filter(t => t.targetValue);
      await upsertTargets.mutateAsync({ kpiId: selectedKpiId, data: { targets } });
      refetchTargets();
      toast({ title: "Quarterly targets saved" });
    } catch (e: unknown) {
      toast({ title: e instanceof Error ? e.message : "Error", variant: "destructive" });
    }
  }

  function parseTask(act: NonNullable<typeof tasks>[number]) {
    try {
      const parsed = JSON.parse(act.description);
      return {
        taskName: parsed.taskName ?? act.description,
        financialTarget: parsed.financialTarget ?? "",
        portfolioOfEvidence: parsed.portfolioOfEvidence ?? "",
        quarter: act.month,
      };
    } catch {
      return { taskName: act.description, financialTarget: "", portfolioOfEvidence: "", quarter: act.month };
    }
  }

  async function handleAddTask() {
    if (!selectedKpiId || !taskForm.taskName) return;
    try {
      await createActivity.mutateAsync({
        kpiId: selectedKpiId,
        data: {
          quarter: 5,
          month: taskForm.quarter,
          description: JSON.stringify({
            taskName: taskForm.taskName,
            financialTarget: taskForm.financialTarget,
            portfolioOfEvidence: taskForm.portfolioOfEvidence,
          }),
          ownerId: taskForm.ownerId,
          dueDate: "task",
        }
      });
      setShowNewTask(false);
      setTaskForm({ taskName: "", ownerId: undefined, quarter: 1, financialTarget: "", portfolioOfEvidence: "" });
      refetchTasks();
      toast({ title: "Task added" });
    } catch (e: unknown) {
      toast({ title: e instanceof Error ? e.message : "Error adding task", variant: "destructive" });
    }
  }

  async function handleDeleteTask(id: number) {
    try {
      await deleteActivity.mutateAsync({ id });
      refetchTasks();
      toast({ title: "Task deleted" });
    } catch (e: unknown) {
      toast({ title: e instanceof Error ? e.message : "Error", variant: "destructive" });
    }
  }

  async function handleAddActivity() {
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
      setActivityForm({ month: QUARTER_MONTHS[selectedQuarter]?.[0] ?? 7, description: "", dueDate: "" });
      refetchActivities();
      toast({ title: "Activity added" });
    } catch { toast({ title: "Error adding activity", variant: "destructive" }); }
  }

  async function handleDeleteActivity(id: number) {
    try {
      await deleteActivity.mutateAsync({ id });
      refetchActivities();
      toast({ title: "Activity removed" });
    } catch { toast({ title: "Error", variant: "destructive" }); }
  }

  async function handleToggleActivity(id: number, currentStatus: string) {
    try {
      await updateActivity.mutateAsync({ id, data: { status: currentStatus === "Completed" ? "Pending" : "Completed" } });
      refetchActivities();
    } catch { toast({ title: "Error", variant: "destructive" }); }
  }

  const f = (k: keyof KpiForm) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setKpiForm(p => ({ ...p, [k]: e.target.value }));

  // Level 2: KPI Detail page with tabs
  if ((selectedKpiId || isNewKpi) && selectedScorecardId) {
    const isReadOnly = selectedKpi?.status !== "Draft" && !isNewKpi;

    return (
      <div className="space-y-0 animate-in fade-in-50 duration-300">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b mb-5">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={() => { setSelectedKpiId(undefined); setIsNewKpi(false); }}>
              <ArrowLeft className="w-4 h-4 mr-1" /> Back to KPI List
            </Button>
            <div>
              <h2 className="text-xl font-bold text-slate-800">
                {isNewKpi ? "New KPI" : (kpiForm.kpiNumber ? `KPI ${kpiForm.kpiNumber}` : "KPI Detail")}
              </h2>
              <p className="text-sm text-slate-500">{selectedScorecard?.name}</p>
            </div>
            {selectedKpi && <Badge className={STATUS_COLORS[selectedKpi.status]}>{selectedKpi.status}</Badge>}
          </div>
          <div className="flex gap-2 items-center">
            {!isReadOnly && (
              <Button onClick={handleSaveKpi} disabled={isSaving || !kpiForm.kpiNumber || !kpiForm.description || !kpiForm.annualTarget}>
                {isSaving ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <Save className="w-4 h-4 mr-1" />}
                {isNewKpi ? "Create KPI" : "Save Changes"}
              </Button>
            )}
            {!isNewKpi && selectedKpi?.status === "Draft" && (
              <Button size="sm" variant="outline" onClick={() => handleTransitionKpi(selectedKpi.id, "submit")}>
                <Send className="w-4 h-4 mr-1" /> Submit
              </Button>
            )}
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-5 h-10">
            <TabsTrigger value="basic">Basic Details</TabsTrigger>
            <TabsTrigger value="idp" disabled={isNewKpi}>IDP / Strategic</TabsTrigger>
            <TabsTrigger value="budget" disabled={isNewKpi}>Budget</TabsTrigger>
            <TabsTrigger value="targets" disabled={isNewKpi}>Targets</TabsTrigger>
            <TabsTrigger value="activities" disabled={isNewKpi}>Monthly Activities</TabsTrigger>
          </TabsList>

          {/* ── Tab 1: Basic Details ── */}
          <TabsContent value="basic">
            <Card>
              <CardContent className="pt-6">
                <div className="grid grid-cols-3 gap-6">
                  {/* Left + centre columns */}
                  <div className="col-span-2 grid grid-cols-2 gap-4">
                    <div className="col-span-2">
                      <Label className="text-sm font-semibold text-slate-700">Indicator Name *</Label>
                      <Textarea className="mt-1 min-h-[72px]" value={kpiForm.description} onChange={f("description")}
                        placeholder="Full indicator / KPI description" disabled={isReadOnly} />
                    </div>
                    <div>
                      <Label className="text-sm font-semibold text-slate-700">KPI Number *</Label>
                      <Input className="mt-1" value={kpiForm.kpiNumber} onChange={f("kpiNumber")} placeholder="e.g. KPI-001" disabled={isReadOnly} />
                    </div>
                    <div>
                      <Label className="text-sm font-semibold text-slate-700">IDP Reference Number</Label>
                      <Input className="mt-1" value={kpiForm.idpReference} onChange={f("idpReference")} placeholder="e.g. N/A or M_HS1" disabled={isReadOnly} />
                    </div>
                    <div>
                      <Label className="text-sm font-semibold text-slate-700">Responsible Post</Label>
                      <Select
                        value={kpiForm.responsiblePostId ? String(kpiForm.responsiblePostId) : "none"}
                        onValueChange={v => setKpiForm(p => ({ ...p, responsiblePostId: v === "none" ? undefined : Number(v) }))}
                        disabled={isReadOnly}
                      >
                        <SelectTrigger className="mt-1"><SelectValue placeholder="Select post" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">— None —</SelectItem>
                          {users?.map(u => <SelectItem key={u.id} value={String(u.id)}>{u.displayName}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label className="text-sm font-semibold text-slate-700">Custodian Post</Label>
                      <Select
                        value={kpiForm.custodianPostId ? String(kpiForm.custodianPostId) : "none"}
                        onValueChange={v => setKpiForm(p => ({ ...p, custodianPostId: v === "none" ? undefined : Number(v) }))}
                        disabled={isReadOnly}
                      >
                        <SelectTrigger className="mt-1"><SelectValue placeholder="Select post" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">— None —</SelectItem>
                          {users?.map(u => <SelectItem key={u.id} value={String(u.id)}>{u.displayName}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label className="text-sm font-semibold text-slate-700">Baseline</Label>
                      <Input className="mt-1" value={kpiForm.baseline} onChange={f("baseline")} placeholder="e.g. 100%" disabled={isReadOnly} />
                    </div>
                    <div>
                      <Label className="text-sm font-semibold text-slate-700">Annual Target *</Label>
                      <Input className="mt-1" value={kpiForm.annualTarget} onChange={f("annualTarget")} placeholder="Target for the financial year" disabled={isReadOnly} />
                    </div>
                    <div>
                      <Label className="text-sm font-semibold text-slate-700">Financial Baseline (R)</Label>
                      <Input className="mt-1" type="number" value={kpiForm.annualBudgetTarget}
                        onChange={e => setKpiForm(p => ({ ...p, annualBudgetTarget: Number(e.target.value) }))} disabled={isReadOnly} />
                    </div>
                    <div>
                      <Label className="text-sm font-semibold text-slate-700">Weight Percent (%)</Label>
                      <Input className="mt-1" type="number" min={0} max={100} value={kpiForm.weighting}
                        onChange={e => setKpiForm(p => ({ ...p, weighting: Number(e.target.value) }))} disabled={isReadOnly} />
                    </div>
                    <div>
                      <Label className="text-sm font-semibold text-slate-700">Funding Source</Label>
                      <Input className="mt-1" value={kpiForm.fundingSource} onChange={f("fundingSource")} placeholder="e.g. OPEX, MIG, USDG" disabled={isReadOnly} />
                    </div>
                    <div>
                      <Label className="text-sm font-semibold text-slate-700">Unit of Measure (UOM)</Label>
                      <Select
                        value={kpiForm.unitOfMeasureId ? String(kpiForm.unitOfMeasureId) : "none"}
                        onValueChange={v => setKpiForm(p => ({ ...p, unitOfMeasureId: v === "none" ? undefined : Number(v) }))}
                        disabled={isReadOnly}
                      >
                        <SelectTrigger className="mt-1"><SelectValue placeholder="Select UOM" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">— None —</SelectItem>
                          {uoms?.map(u => <SelectItem key={u.id} value={String(u.id)}>{u.name} ({u.abbreviation})</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="col-span-2">
                      <Label className="text-sm font-semibold text-slate-700">Budget Description</Label>
                      <Textarea className="mt-1 min-h-[64px]" value={kpiForm.budgetDescription} onChange={f("budgetDescription")}
                        placeholder="Describe the budget item (None if not applicable)" disabled={isReadOnly} />
                    </div>
                    <div className="col-span-2 flex items-center gap-2 pt-1">
                      <Checkbox
                        id="isCumulative"
                        checked={kpiForm.isCumulative}
                        onCheckedChange={v => setKpiForm(p => ({ ...p, isCumulative: !!v }))}
                        disabled={isReadOnly}
                      />
                      <Label htmlFor="isCumulative" className="text-sm font-medium cursor-pointer">Cumulative KPI</Label>
                    </div>
                  </div>

                  {/* Right column — Evidence */}
                  <div className="flex flex-col gap-4">
                    <div className="flex-1">
                      <Label className="text-sm font-semibold text-slate-700">Source of Evidence *</Label>
                      <Textarea
                        className="mt-1"
                        style={{ minHeight: "140px" }}
                        value={kpiForm.evidenceSource}
                        onChange={f("evidenceSource")}
                        placeholder="e.g. Planning and Development Department reports"
                        disabled={isReadOnly}
                      />
                    </div>
                    <div className="flex-1">
                      <Label className="text-sm font-semibold text-slate-700">Portfolio of Evidence *</Label>
                      <Textarea
                        className="mt-1"
                        style={{ minHeight: "140px" }}
                        value={kpiForm.evidencePortfolio}
                        onChange={f("evidencePortfolio")}
                        placeholder="e.g. Beneficiary list, signed registers, photos"
                        disabled={isReadOnly}
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ── Tab 2: IDP / Strategic ── */}
          <TabsContent value="idp">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">IDP / Strategic Objective Link</CardTitle>
                <CardDescription>Link this KPI to a pre-captured Strategic Objective from the IDP</CardDescription>
              </CardHeader>
              <CardContent className="grid grid-cols-2 gap-5">
                <div>
                  <Label className="text-sm font-semibold text-slate-700">IDP-ID #</Label>
                  <Input className="mt-1" value={kpiForm.idpReference} onChange={f("idpReference")} placeholder="e.g. M_HS1" disabled={isReadOnly} />
                </div>
                <div>
                  <Label className="text-sm font-semibold text-slate-700">Programme</Label>
                  <Input className="mt-1" value={kpiForm.programme} onChange={f("programme")} placeholder="e.g. HUMAN SETTLEMENTS" disabled={isReadOnly} />
                </div>
                <div className="col-span-2">
                  <Label className="text-sm font-semibold text-slate-700">Hierarchy — KPA / Strategic Objective / Programme</Label>
                  <Textarea className="mt-1 min-h-[80px]" value={kpiForm.strategicObjective} onChange={f("strategicObjective")}
                    placeholder="e.g. KPA 1: Spatial Rationale: Rational planning to bridge first and second economies..." disabled={isReadOnly} />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ── Tab 3: Budget ── */}
          <TabsContent value="budget">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Budget Link</CardTitle>
                <CardDescription>Link this KPI to budget items and funding sources (mSCOA aligned)</CardDescription>
              </CardHeader>
              <CardContent className="grid grid-cols-2 gap-5">
                <div>
                  <Label className="text-sm font-semibold text-slate-700">Funding Source</Label>
                  <Input className="mt-1" value={kpiForm.fundingSource} onChange={f("fundingSource")} placeholder="e.g. OPEX, MIG, USDG" disabled={isReadOnly} />
                </div>
                <div>
                  <Label className="text-sm font-semibold text-slate-700">Annual Budget Target (R)</Label>
                  <Input className="mt-1" type="number" value={kpiForm.annualBudgetTarget}
                    onChange={e => setKpiForm(p => ({ ...p, annualBudgetTarget: Number(e.target.value) }))} disabled={isReadOnly} />
                </div>
                <div className="col-span-2">
                  <Label className="text-sm font-semibold text-slate-700">Budget Item Description</Label>
                  <Textarea className="mt-1 min-h-[80px]" value={kpiForm.budgetDescription} onChange={f("budgetDescription")}
                    placeholder="Describe the linked mSCOA budget item(s) — e.g. Assets:Non-current Assets:Property, Plant and Equipment:Cost Model:Other Assets:Cost:Acquisitions" disabled={isReadOnly} />
                </div>

                {/* Budget item summary table */}
                {(kpiForm.fundingSource || kpiForm.annualBudgetTarget > 0 || kpiForm.budgetDescription) && (
                  <div className="col-span-2 mt-2">
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Linked Budget Summary</p>
                    <div className="border rounded-lg overflow-hidden">
                      <table className="w-full text-sm">
                        <thead className="bg-slate-50 border-b">
                          <tr>
                            <th className="text-left px-4 py-2 font-medium text-slate-600">Item Description</th>
                            <th className="text-left px-4 py-2 font-medium text-slate-600">Funding Source</th>
                            <th className="text-right px-4 py-2 font-medium text-slate-600">Budget Amount (R)</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr className="border-t">
                            <td className="px-4 py-3 text-slate-700">{kpiForm.budgetDescription || "—"}</td>
                            <td className="px-4 py-3 text-slate-700">{kpiForm.fundingSource || "—"}</td>
                            <td className="px-4 py-3 text-right font-mono text-slate-800">
                              {kpiForm.annualBudgetTarget > 0 ? `R ${kpiForm.annualBudgetTarget.toLocaleString()}` : "—"}
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* ── Tab 4: Targets ── */}
          <TabsContent value="targets">
            <div className="space-y-5">
              {/* ── Measurable Output ── */}
              <Card>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-base">Measurable Output</CardTitle>
                      <CardDescription>Annual target: <strong>{kpiForm.annualTarget || "—"}</strong></CardDescription>
                    </div>
                    <Button onClick={handleSaveTargets} disabled={upsertTargets.isPending || isReadOnly}>
                      {upsertTargets.isPending ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <Save className="w-4 h-4 mr-1" />}
                      Save Targets
                    </Button>
                  </div>
                  <div className="flex gap-6 pt-1">
                    <div className="flex items-center gap-2">
                      <Checkbox
                        id="cumTarget"
                        checked={kpiForm.isCumulative}
                        onCheckedChange={v => setKpiForm(p => ({ ...p, isCumulative: !!v }))}
                        disabled={isReadOnly}
                      />
                      <Label htmlFor="cumTarget" className="text-sm cursor-pointer">Cumulative Target</Label>
                    </div>
                    <div className="flex items-center gap-2">
                      <Checkbox id="timeDriven" disabled={isReadOnly} />
                      <Label htmlFor="timeDriven" className="text-sm cursor-pointer">Time Driven Measure</Label>
                    </div>
                    <div className="flex items-center gap-2">
                      <Checkbox id="cumFinancial" disabled={isReadOnly} />
                      <Label htmlFor="cumFinancial" className="text-sm cursor-pointer">Cumulative Financial Target</Label>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-0">
                  {[1, 2, 3, 4].map(q => {
                    const key = `q${q}` as keyof typeof targetForm;
                    const budgetKey = `q${q}` as keyof typeof targetBudgetForm;
                    const evidKey = `q${q}` as keyof typeof targetEvidenceForm;
                    const months = QUARTER_MONTHS[q].map(m => MONTH_NAMES[m]).join(", ");
                    return (
                      <div key={q} className="py-4 border-b last:border-0">
                        <p className="text-xs font-semibold text-[var(--platinum-primary)] uppercase tracking-wide mb-3">
                          Q{q} — {months}
                        </p>
                        <div className="grid grid-cols-2 gap-4 mb-3">
                          <div>
                            <Label className="text-xs font-semibold text-slate-600">Q{q} Target *</Label>
                            <Input className="mt-1" value={targetForm[key]}
                              onChange={e => setTargetForm(p => ({ ...p, [key]: e.target.value }))}
                              placeholder="e.g. 100% or 5" disabled={isReadOnly} />
                          </div>
                          <div>
                            <Label className="text-xs font-semibold text-slate-600">Q{q} Financial Target (R)</Label>
                            <Input className="mt-1" type="number" value={targetBudgetForm[budgetKey]}
                              onChange={e => setTargetBudgetForm(p => ({ ...p, [budgetKey]: e.target.value }))}
                              placeholder="0.00" disabled={isReadOnly} />
                          </div>
                        </div>
                        <div>
                          <Label className="text-xs font-semibold text-slate-600">Q{q} Portfolio of Evidence *</Label>
                          <Input className="mt-1" value={targetEvidenceForm[evidKey]}
                            onChange={e => setTargetEvidenceForm(p => ({ ...p, [evidKey]: e.target.value }))}
                            placeholder="e.g. Beneficiary list, signed registers, photos"
                            disabled={isReadOnly} />
                        </div>
                      </div>
                    );
                  })}
                </CardContent>
              </Card>

              {/* ── Tasks ── */}
              <Card>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base">Tasks</CardTitle>
                    {!isReadOnly && (
                      <Button size="sm" onClick={() => setShowNewTask(true)}>
                        <Plus className="w-4 h-4 mr-1" /> Add Task
                      </Button>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="p-0">
                  {showNewTask && !isReadOnly && (
                    <div className="border-b bg-blue-50 px-5 py-4 space-y-3">
                      <p className="text-sm font-semibold text-slate-700">New Task</p>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="col-span-2">
                          <Label className="text-xs font-semibold text-slate-600">Task Name *</Label>
                          <Input className="mt-1" value={taskForm.taskName}
                            onChange={e => setTaskForm(p => ({ ...p, taskName: e.target.value }))}
                            placeholder="Describe the task" />
                        </div>
                        <div>
                          <Label className="text-xs font-semibold text-slate-600">Responsible Post</Label>
                          <Select
                            value={taskForm.ownerId ? String(taskForm.ownerId) : "none"}
                            onValueChange={v => setTaskForm(p => ({ ...p, ownerId: v === "none" ? undefined : Number(v) }))}
                          >
                            <SelectTrigger className="mt-1"><SelectValue placeholder="— Select —" /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="none">— Select —</SelectItem>
                              {users?.map(u => <SelectItem key={u.id} value={String(u.id)}>{u.displayName}</SelectItem>)}
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label className="text-xs font-semibold text-slate-600">Quarter Due *</Label>
                          <Select
                            value={String(taskForm.quarter)}
                            onValueChange={v => setTaskForm(p => ({ ...p, quarter: Number(v) }))}
                          >
                            <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                            <SelectContent>
                              {[1, 2, 3, 4].map(q => (
                                <SelectItem key={q} value={String(q)}>Q{q} — {QUARTER_MONTHS[q].map(m => MONTH_NAMES[m].slice(0, 3)).join(", ")}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label className="text-xs font-semibold text-slate-600">Financial Target (R)</Label>
                          <Input className="mt-1" value={taskForm.financialTarget}
                            onChange={e => setTaskForm(p => ({ ...p, financialTarget: e.target.value }))}
                            placeholder="0.00" />
                        </div>
                        <div>
                          <Label className="text-xs font-semibold text-slate-600">Portfolio of Evidence</Label>
                          <Input className="mt-1" value={taskForm.portfolioOfEvidence}
                            onChange={e => setTaskForm(p => ({ ...p, portfolioOfEvidence: e.target.value }))}
                            placeholder="e.g. Beneficiary list" />
                        </div>
                      </div>
                      <div className="flex gap-2 pt-1">
                        <Button size="sm" onClick={handleAddTask} disabled={!taskForm.taskName}>Add Task</Button>
                        <Button size="sm" variant="outline" onClick={() => setShowNewTask(false)}>Cancel</Button>
                      </div>
                    </div>
                  )}
                  <div className="overflow-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-slate-50 border-b">
                        <tr>
                          <th className="text-left px-4 py-2 font-medium text-slate-600 w-16">Quarter</th>
                          <th className="text-left px-4 py-2 font-medium text-slate-600">Task</th>
                          <th className="text-left px-4 py-2 font-medium text-slate-600">Responsible Post</th>
                          <th className="text-left px-4 py-2 font-medium text-slate-600">Portfolio of Evidence</th>
                          <th className="text-right px-4 py-2 font-medium text-slate-600">Financial Target</th>
                          {!isReadOnly && <th className="px-4 py-2 w-10" />}
                        </tr>
                      </thead>
                      <tbody>
                        {tasks && tasks.length > 0 ? tasks.map(task => {
                          const t = parseTask(task);
                          const owner = users?.find(u => u.id === task.ownerId);
                          return (
                            <tr key={task.id} className="border-t hover:bg-slate-50">
                              <td className="px-4 py-2 font-medium text-slate-700">Q{t.quarter}</td>
                              <td className="px-4 py-2 text-slate-700">{t.taskName}</td>
                              <td className="px-4 py-2 text-slate-600">{owner?.displayName ?? <span className="text-slate-400">—</span>}</td>
                              <td className="px-4 py-2 text-slate-600">{t.portfolioOfEvidence || <span className="text-slate-400">—</span>}</td>
                              <td className="px-4 py-2 text-right font-mono text-slate-700">
                                {t.financialTarget ? `R ${Number(t.financialTarget).toLocaleString()}` : <span className="text-slate-400">—</span>}
                              </td>
                              {!isReadOnly && (
                                <td className="px-4 py-2 text-center">
                                  <Button variant="ghost" size="sm" className="text-red-500 h-7 w-7 p-0"
                                    onClick={() => handleDeleteTask(task.id)}>
                                    <Trash2 className="w-4 h-4" />
                                  </Button>
                                </td>
                              )}
                            </tr>
                          );
                        }) : (
                          <tr>
                            <td colSpan={isReadOnly ? 5 : 6} className="px-4 py-6 text-center text-slate-400 text-sm">
                              No tasks added yet
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* ── Tab 5: Monthly Activities ── */}
          <TabsContent value="activities">
            <div className="space-y-4">
              <div className="flex gap-2">
                {[1, 2, 3, 4].map(q => (
                  <button
                    key={q}
                    onClick={() => { setSelectedQuarter(q); setShowNewActivity(false); }}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                      selectedQuarter === q
                        ? "bg-[var(--platinum-primary)] text-white shadow"
                        : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                    }`}
                  >
                    Q{q} — {QUARTER_MONTHS[q].map(m => MONTH_NAMES[m].slice(0, 3)).join(", ")}
                  </button>
                ))}
              </div>

              {quarterTargets?.find(t => t.quarter === selectedQuarter) && (
                <Card className="bg-blue-50 border-blue-200">
                  <CardContent className="py-3 px-4 text-sm text-blue-800">
                    <span className="font-semibold">Q{selectedQuarter} Target:</span>{" "}
                    {quarterTargets.find(t => t.quarter === selectedQuarter)?.targetValue}
                  </CardContent>
                </Card>
              )}

              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-slate-700">
                  <Calendar className="w-4 h-4 inline mr-1" />
                  Activities for Quarter {selectedQuarter}
                </h3>
                {!isReadOnly && (
                  <Button size="sm" onClick={() => {
                    setActivityForm({ month: QUARTER_MONTHS[selectedQuarter]?.[0] ?? 7, description: "", dueDate: "" });
                    setShowNewActivity(true);
                  }}>
                    <Plus className="w-4 h-4 mr-1" /> Add Activity
                  </Button>
                )}
              </div>

              <div className="space-y-2">
                {activities?.map(act => (
                  <Card key={act.id} className="border-slate-200">
                    <CardContent className="py-3 px-4 flex items-center gap-3">
                      <input
                        type="checkbox"
                        checked={act.status === "Completed"}
                        onChange={() => handleToggleActivity(act.id, act.status)}
                        className="w-4 h-4 rounded border-slate-300 shrink-0"
                      />
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm font-medium ${act.status === "Completed" ? "line-through text-slate-400" : "text-slate-800"}`}>
                          {act.description}
                        </p>
                        <div className="flex gap-4 text-xs text-slate-500 mt-0.5">
                          <span>{MONTH_NAMES[act.month] ?? `Month ${act.month}`}</span>
                          {act.dueDate && <span>Due: {act.dueDate}</span>}
                          <Badge variant="outline" className="text-xs py-0 h-4">{act.status}</Badge>
                        </div>
                      </div>
                      {!isReadOnly && (
                        <Button variant="ghost" size="sm" className="text-red-500 shrink-0" onClick={() => handleDeleteActivity(act.id)}>
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      )}
                    </CardContent>
                  </Card>
                ))}
                {(!activities || activities.length === 0) && (
                  <Card className="border-dashed">
                    <CardContent className="py-8 text-center text-slate-500">
                      <Calendar className="w-10 h-10 mx-auto mb-2 text-slate-300" />
                      <p className="text-sm">No activities planned for Q{selectedQuarter}</p>
                    </CardContent>
                  </Card>
                )}
              </div>

              <Dialog open={showNewActivity} onOpenChange={setShowNewActivity}>
                <DialogContent className="max-w-md">
                  <DialogHeader><DialogTitle>Add Monthly Activity</DialogTitle></DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label>Month</Label>
                      <Select value={String(activityForm.month)} onValueChange={v => setActivityForm(p => ({ ...p, month: Number(v) }))}>
                        <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {(QUARTER_MONTHS[selectedQuarter] || []).map(m => (
                            <SelectItem key={m} value={String(m)}>{MONTH_NAMES[m]}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Activity Description *</Label>
                      <Textarea className="mt-1" value={activityForm.description}
                        onChange={e => setActivityForm(p => ({ ...p, description: e.target.value }))}
                        placeholder="What needs to be done this month?" />
                    </div>
                    <div>
                      <Label>Due Date</Label>
                      <Input className="mt-1" type="date" value={activityForm.dueDate}
                        onChange={e => setActivityForm(p => ({ ...p, dueDate: e.target.value }))} />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setShowNewActivity(false)}>Cancel</Button>
                    <Button onClick={handleAddActivity} disabled={!activityForm.description}>Add Activity</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    );
  }

  // Level 1: KPI list within a scorecard
  if (selectedScorecardId && selectedScorecard) {
    return (
      <div className="space-y-6 animate-in fade-in-50 duration-300">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={() => setSelectedScorecardId(undefined)}>
              <ArrowLeft className="w-4 h-4 mr-1" /> Back
            </Button>
            <div>
              <h2 className="text-2xl font-bold text-slate-800">{selectedScorecard.name}</h2>
              <p className="text-sm text-slate-500">Organisational KPI Planning</p>
            </div>
            <Badge className={STATUS_COLORS[selectedScorecard.status]}>{selectedScorecard.status}</Badge>
          </div>
          <div className="flex gap-2">
            {selectedScorecard.status === "Draft" && (
              <>
                <Button size="sm" onClick={openNewKpi}><Plus className="w-4 h-4 mr-1" /> Add KPI</Button>
                <Button size="sm" variant="outline" onClick={() => handleTransitionScorecard("submit")}>
                  <Send className="w-4 h-4 mr-1" /> Submit
                </Button>
              </>
            )}
            {selectedScorecard.status === "Submitted" && (
              <Button size="sm" variant="outline" onClick={() => handleTransitionScorecard("review")}>
                <Check className="w-4 h-4 mr-1" /> Mark Reviewed
              </Button>
            )}
            {selectedScorecard.status === "Reviewed" && (
              <Button size="sm" className="bg-green-600 hover:bg-green-700" onClick={() => handleTransitionScorecard("approve")}>
                <Check className="w-4 h-4 mr-1" /> Approve
              </Button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <Card className="bg-blue-50 border-blue-200">
            <CardContent className="p-4 flex items-center gap-3">
              <Target className="w-8 h-8 text-blue-600" />
              <div>
                <p className="text-2xl font-bold text-blue-700">{kpis?.length ?? 0}</p>
                <p className="text-xs text-blue-600">Total KPIs</p>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-green-50 border-green-200">
            <CardContent className="p-4 flex items-center gap-3">
              <Check className="w-8 h-8 text-green-600" />
              <div>
                <p className="text-2xl font-bold text-green-700">{kpis?.filter(k => k.status === "Approved").length ?? 0}</p>
                <p className="text-xs text-green-600">Approved</p>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-amber-50 border-amber-200">
            <CardContent className="p-4 flex items-center gap-3">
              <BarChart2 className="w-8 h-8 text-amber-600" />
              <div>
                <p className="text-2xl font-bold text-amber-700">
                  {kpis?.reduce((s, k) => s + (k.weighting ?? 0), 0).toFixed(0)}%
                </p>
                <p className="text-xs text-amber-600">Total Weighting</p>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-2">
          {kpis?.map(kpi => (
            <Card key={kpi.id} className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => openKpiDetail(kpi)}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-mono text-sm text-slate-500">{kpi.kpiNumber}</span>
                      <Badge className={STATUS_COLORS[kpi.status]}>{kpi.status}</Badge>
                      <Badge variant="outline">{kpi.weighting}%</Badge>
                      {kpi.unitOfMeasureId && <Badge variant="outline" className="text-xs">{uoms?.find(u => u.id === kpi.unitOfMeasureId)?.abbreviation}</Badge>}
                    </div>
                    <p className="font-semibold text-slate-800 truncate">{kpi.description}</p>
                    <div className="flex gap-4 mt-1 text-xs text-slate-500 flex-wrap">
                      {kpi.annualTarget && <span>Target: {kpi.annualTarget}</span>}
                      {kpi.idpReference && <span>IDP: {kpi.idpReference}</span>}
                      {kpi.programme && <span>{kpi.programme}</span>}
                    </div>
                  </div>
                  <div className="flex gap-1 shrink-0 ml-3" onClick={e => e.stopPropagation()}>
                    <Button variant="ghost" size="sm" onClick={() => openKpiDetail(kpi)}>
                      <Pencil className="w-4 h-4 mr-1" /> Open
                    </Button>
                    {kpi.status === "Draft" && (
                      <>
                        <Button variant="ghost" size="sm" onClick={() => handleTransitionKpi(kpi.id, "submit")}>Submit</Button>
                        <Button variant="ghost" size="sm" className="text-red-500" onClick={() => handleDeleteKpi(kpi.id)}>Delete</Button>
                      </>
                    )}
                    {kpi.status === "Submitted" && (
                      <Button variant="ghost" size="sm" onClick={() => handleTransitionKpi(kpi.id, "review")}>Review</Button>
                    )}
                    {kpi.status === "Reviewed" && (
                      <Button variant="ghost" size="sm" onClick={() => handleTransitionKpi(kpi.id, "approve")}>Approve</Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
          {(!kpis || kpis.length === 0) && (
            <Card className="border-dashed">
              <CardContent className="p-8 text-center text-slate-500">
                <Target className="w-12 h-12 mx-auto mb-3 text-slate-300" />
                <p className="font-medium">No KPIs yet</p>
                <p className="text-sm">Click "Add KPI" to start building the scorecard</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    );
  }

  // Level 0: Scorecard list
  return (
    <div className="space-y-6 animate-in fade-in-50 duration-300">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Organisational KPI Planning</h2>
          <p className="text-slate-500">Create and manage organisational scorecards and KPIs</p>
        </div>
        <div className="flex gap-3 items-center">
          {cycles && cycles.length > 0 && (
            <Select value={String(effectiveCycleId)} onValueChange={v => setSelectedCycleId(Number(v))}>
              <SelectTrigger className="w-48"><SelectValue placeholder="Select cycle" /></SelectTrigger>
              <SelectContent>
                {cycles.map(c => <SelectItem key={c.id} value={String(c.id)}>{c.financialYearLabel}</SelectItem>)}
              </SelectContent>
            </Select>
          )}
          <Button onClick={() => setShowNewScorecard(true)}><Plus className="w-4 h-4 mr-1" /> New Scorecard</Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {scorecards?.map(sc => (
          <Card key={sc.id} className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setSelectedScorecardId(sc.id)}>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">{sc.name}</CardTitle>
                <Badge className={STATUS_COLORS[sc.status]}>{sc.status}</Badge>
              </div>
              <CardDescription>{sc.scorecardType}</CardDescription>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="flex items-center gap-2 text-sm text-slate-500">
                <FileText className="w-4 h-4" />
                <span>Click to manage KPIs</span>
              </div>
            </CardContent>
          </Card>
        ))}
        {(!scorecards || scorecards.length === 0) && (
          <Card className="border-dashed col-span-3">
            <CardContent className="p-10 text-center text-slate-500">
              <FileText className="w-12 h-12 mx-auto mb-3 text-slate-300" />
              <p className="font-medium">No scorecards yet</p>
              <p className="text-sm">Click "New Scorecard" to create one for this cycle</p>
            </CardContent>
          </Card>
        )}
      </div>

      <Dialog open={showNewScorecard} onOpenChange={setShowNewScorecard}>
        <DialogContent>
          <DialogHeader><DialogTitle>New Scorecard</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Name</Label>
              <Input className="mt-1" value={scorecardName} onChange={e => setScorecardName(e.target.value)} placeholder="FY 2024/25 Organisational Scorecard" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNewScorecard(false)}>Cancel</Button>
            <Button onClick={handleCreateScorecard} disabled={!scorecardName.trim()}>Create</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
