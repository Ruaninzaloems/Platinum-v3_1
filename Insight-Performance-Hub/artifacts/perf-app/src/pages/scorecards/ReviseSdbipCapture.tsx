import { useState, useEffect } from "react";
import {
  useListScorecards, useTransitionScorecard,
  useListScorecardKpis, useCreateScorecardKpi, useUpdateScorecardKpi,
  useDeleteScorecardKpi, useTransitionScorecardKpi,
  useListQuarterTargets, useUpsertQuarterTargets,
  useListUnitsOfMeasure, useListUsers, useListCycles,
  useListRevisionLogs, useCreateRevisionLogs,
} from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import {
  ArrowLeft, Save, Send, Loader2, RefreshCw, Plus,
  AlertTriangle, ArrowRight, Eye, RotateCcw, Trash2,
  History, Clock,
} from "lucide-react";

const STATUS_COLORS: Record<string, string> = {
  Draft: "bg-gray-100 text-gray-700",
  Submitted: "bg-blue-100 text-blue-700",
  Reviewed: "bg-amber-100 text-amber-700",
  Approved: "bg-green-100 text-green-700",
};

const REVISION_TYPE_LABELS: Record<string, string> = {
  scorecard_reopened: "Scorecard Reopened",
  kpi_added: "New KPI Added",
  kpi_deleted: "KPI Deleted",
  target_revised: "Target Revised",
  annual_target_revised: "Annual Target Revised",
  kpi_updated: "KPI Updated",
  revision_submitted: "Revision Submitted",
  revision_reviewed: "Revision Reviewed",
  revision_approved: "Revision Approved",
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

export default function ReviseSdbipCapture() {
  const { toast } = useToast();
  const { data: cycles } = useListCycles();
  const { data: uoms } = useListUnitsOfMeasure();
  const { data: users } = useListUsers();
  const [selectedCycleId, setSelectedCycleId] = useState<number | undefined>();
  const [selectedScorecardId, setSelectedScorecardId] = useState<number | undefined>();
  const [selectedKpiId, setSelectedKpiId] = useState<number | undefined>();
  const [showReopenConfirm, setShowReopenConfirm] = useState<number | null>(null);
  const [showNewKpi, setShowNewKpi] = useState(false);
  const [activeTab, setActiveTab] = useState("kpis");

  const effectiveCycleId = selectedCycleId || cycles?.[0]?.id;
  const { data: allScorecards, refetch: refetchScorecards } = useListScorecards({ cycleId: effectiveCycleId });
  const kpisQuery = useListScorecardKpis(selectedScorecardId ?? 0);
  const kpis = selectedScorecardId ? kpisQuery.data : undefined;
  const { data: revisionLogs, refetch: refetchLogs } = useListRevisionLogs(selectedScorecardId ?? 0);

  const scorecards = allScorecards?.filter(s =>
    s.status === "Approved" || (s.approvedAt && (s.status === "Draft" || s.status === "Submitted"))
  ) ?? [];
  const selectedScorecard = allScorecards?.find(s => s.id === selectedScorecardId);

  const transitionScorecard = useTransitionScorecard();
  const transitionKpi = useTransitionScorecardKpi();
  const createRevisionLogs = useCreateRevisionLogs();

  const getUserName = (id: number | null) => {
    if (!id) return "—";
    const u = users?.find(u => u.id === id);
    return u ? u.displayName : `User #${id}`;
  };

  const logRevision = async (scorecardId: number, entries: Array<{
    kpiId?: number; revisionType: string; fieldName?: string;
    oldValue?: string; newValue?: string; revisionReason?: string; quarter?: number;
  }>) => {
    await createRevisionLogs.mutateAsync({ scorecardId, data: { entries } });
    refetchLogs();
  };

  const handleReopenScorecard = async (scorecardId: number) => {
    try {
      await transitionScorecard.mutateAsync({ id: scorecardId, data: { action: "reopen", comments: "Mid-year revision" } });
      const kpisResult = await fetch(`/api/scorecards/${scorecardId}/kpis`);
      if (!kpisResult.ok) throw new Error("Failed to fetch KPIs for reopen");
      const kpisList = await kpisResult.json();
      for (const kpi of kpisList) {
        if (kpi.status === "Approved") {
          await transitionKpi.mutateAsync({ id: kpi.id, data: { action: "reopen", comments: "" } });
        }
      }
      await logRevision(scorecardId, [{
        revisionType: "scorecard_reopened",
        revisionReason: "Mid-year revision initiated",
      }]);
      toast({ title: "Scorecard reopened for revision", description: "You can now revise targets and add new KPIs." });
      setShowReopenConfirm(null);
      setSelectedScorecardId(scorecardId);
      refetchScorecards();
    } catch (e: any) {
      toast({ title: "Error", description: e?.response?.data?.error || "Failed to reopen scorecard", variant: "destructive" });
    }
  };

  const handleSubmitForReview = async () => {
    if (!selectedScorecardId) return;
    try {
      if (kpis) {
        for (const kpi of kpis) {
          if (kpi.status === "Draft") {
            await transitionKpi.mutateAsync({ id: kpi.id, data: { action: "submit", comments: "" } });
          }
        }
      }
      await transitionScorecard.mutateAsync({ id: selectedScorecardId, data: { action: "submit", comments: "Revised SDBIP submitted for review" } });
      await logRevision(selectedScorecardId, [{
        revisionType: "revision_submitted",
        revisionReason: "Revised SDBIP submitted for review",
      }]);
      toast({ title: "Revised SDBIP submitted for review" });
      setSelectedScorecardId(undefined);
      setSelectedKpiId(undefined);
      refetchScorecards();
    } catch (e: any) {
      toast({ title: "Error", description: e?.response?.data?.error || "Failed to submit", variant: "destructive" });
    }
  };

  if (selectedScorecardId && selectedScorecard && selectedKpiId) {
    return (
      <KpiRevisionDetail
        scorecardId={selectedScorecardId}
        scorecardName={selectedScorecard.name}
        kpiId={selectedKpiId}
        kpis={kpis ?? []}
        users={users ?? []}
        uoms={uoms ?? []}
        onBack={() => setSelectedKpiId(undefined)}
        onSaved={() => { kpisQuery.refetch(); refetchLogs(); }}
      />
    );
  }

  if (selectedScorecardId && selectedScorecard && showNewKpi) {
    return (
      <NewKpiForm
        scorecardId={selectedScorecardId}
        scorecardName={selectedScorecard.name}
        users={users ?? []}
        uoms={uoms ?? []}
        onBack={() => setShowNewKpi(false)}
        onCreated={() => { kpisQuery.refetch(); refetchLogs(); setShowNewKpi(false); }}
      />
    );
  }

  if (selectedScorecardId && selectedScorecard) {
    const isDraft = selectedScorecard.status === "Draft";
    const totalWeighting = kpis?.reduce((sum, k) => sum + (k.weighting ?? 0), 0) ?? 0;

    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between pb-4 border-b">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={() => { setSelectedScorecardId(undefined); setSelectedKpiId(undefined); }}>
              <ArrowLeft className="w-4 h-4 mr-1" /> Back
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-slate-800">Revise: {selectedScorecard.name}</h1>
              <p className="text-sm text-slate-500">
                Mid-year SDBIP revision · Total Weighting: {totalWeighting.toFixed(1)}%
              </p>
            </div>
            <Badge className={STATUS_COLORS[selectedScorecard.status]}>{selectedScorecard.status}</Badge>
          </div>
          <div className="flex gap-2">
            {isDraft && (
              <>
                <Button variant="outline" onClick={() => setShowNewKpi(true)}>
                  <Plus className="w-4 h-4 mr-2" /> Add New KPI
                </Button>
                <Button onClick={handleSubmitForReview} className="bg-blue-600 hover:bg-blue-700">
                  <Send className="w-4 h-4 mr-2" /> Submit for Review
                </Button>
              </>
            )}
          </div>
        </div>

        {isDraft && (
          <Card className="border-amber-200 bg-amber-50/50">
            <CardContent className="py-3 flex items-center gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
              <p className="text-sm text-amber-800">
                This scorecard has been reopened for mid-year revision. You can edit existing KPI targets or add new KPIs. Revision reasons are required for changes to baselined targets.
              </p>
            </CardContent>
          </Card>
        )}

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="kpis">KPIs ({kpis?.length ?? 0})</TabsTrigger>
            <TabsTrigger value="audit">Revision Audit Trail ({revisionLogs?.length ?? 0})</TabsTrigger>
          </TabsList>

          <TabsContent value="kpis">
            <Card>
              <CardHeader>
                <CardTitle>KPIs — Click to Revise Targets</CardTitle>
                <CardDescription>Select a KPI to view its original baseline and revise quarterly targets, or add a new KPI.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {kpis?.map(kpi => (
                    <div
                      key={kpi.id}
                      onClick={() => isDraft ? setSelectedKpiId(kpi.id) : undefined}
                      className={`border rounded-lg p-4 transition-shadow ${isDraft ? "cursor-pointer hover:shadow-md hover:border-blue-200" : ""}`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-sm text-slate-500">{kpi.kpiNumber}</span>
                            <Badge className={STATUS_COLORS[kpi.status]}>{kpi.status}</Badge>
                            {kpi.createdAt && selectedScorecard.approvedAt &&
                              new Date(kpi.createdAt) > new Date(selectedScorecard.approvedAt) && (
                              <Badge className="bg-blue-100 text-blue-700 text-xs">New</Badge>
                            )}
                          </div>
                          <p className="font-medium text-slate-800 mt-1">{kpi.description}</p>
                          <div className="flex gap-6 mt-2 text-sm text-slate-500">
                            <span>Weight: {kpi.weighting}%</span>
                            <span>Annual Target: {kpi.annualTarget}</span>
                            {kpi.baseline && <span>Baseline: {kpi.baseline}</span>}
                            <span>Responsible: {getUserName(kpi.responsiblePostId)}</span>
                          </div>
                        </div>
                        {isDraft && (
                          <Button size="sm" variant="outline" className="ml-4">
                            <Eye className="w-4 h-4 mr-1" /> Revise
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                  {(!kpis || kpis.length === 0) && (
                    <p className="text-center text-slate-400 py-8">No KPIs found.</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="audit">
            <RevisionAuditTrail logs={revisionLogs ?? []} kpis={kpis ?? []} />
          </TabsContent>
        </Tabs>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Revise SDBIP</h1>
        <p className="text-slate-500 mt-1">
          Reopen approved scorecards for mid-year revision. Original targets are preserved as baselines.
        </p>
      </div>

      <div className="flex items-center gap-4">
        <div className="w-64">
          <Label>Performance Cycle</Label>
          <Select value={String(effectiveCycleId ?? "")} onValueChange={v => setSelectedCycleId(Number(v))}>
            <SelectTrigger><SelectValue placeholder="Select cycle" /></SelectTrigger>
            <SelectContent>
              {cycles?.map(c => <SelectItem key={c.id} value={String(c.id)}>{c.financialYearLabel}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </div>

      {scorecards.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center">
            <RefreshCw className="w-12 h-12 text-slate-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-slate-600">No Scorecards Available for Revision</h3>
            <p className="text-slate-400 mt-1">Approved scorecards will appear here for mid-year revision.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {scorecards.map(sc => {
            const isApproved = sc.status === "Approved";
            const isReopened = sc.status === "Draft" && sc.approvedAt;
            const isSubmitted = sc.status === "Submitted" && sc.approvedAt;
            return (
              <Card key={sc.id} className="hover:shadow-md transition-shadow">
                <CardContent className="py-4 flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold text-slate-800">{sc.name}</h3>
                    <p className="text-sm text-slate-500">
                      {sc.approvedAt && <>Originally approved on {new Date(sc.approvedAt).toLocaleDateString()} · </>}
                      Created by {getUserName(sc.createdById)}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge className={STATUS_COLORS[sc.status]}>{sc.status}</Badge>
                    {isApproved && (
                      <Button size="sm" onClick={() => setShowReopenConfirm(sc.id)} className="bg-amber-600 hover:bg-amber-700">
                        <RotateCcw className="w-4 h-4 mr-1" /> Reopen for Revision
                      </Button>
                    )}
                    {(isReopened || isSubmitted) && (
                      <Button size="sm" variant="outline" onClick={() => setSelectedScorecardId(sc.id)}>
                        <ArrowRight className="w-4 h-4 mr-1" /> Continue Revision
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <Dialog open={showReopenConfirm !== null} onOpenChange={() => setShowReopenConfirm(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Reopen Scorecard for Revision</DialogTitle></DialogHeader>
          <p className="text-sm text-slate-600">
            This will reopen the approved scorecard for mid-year revision. All KPIs will return to Draft status.
            Existing quarterly targets will be preserved as baselines, and revision reasons will be required for any changes.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowReopenConfirm(null)}>Cancel</Button>
            <Button onClick={() => showReopenConfirm && handleReopenScorecard(showReopenConfirm)} className="bg-amber-600 hover:bg-amber-700">
              <RotateCcw className="w-4 h-4 mr-2" /> Reopen for Revision
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function NewKpiForm({
  scorecardId, scorecardName, users, uoms, onBack, onCreated,
}: {
  scorecardId: number; scorecardName: string; users: any[]; uoms: any[];
  onBack: () => void; onCreated: () => void;
}) {
  const { toast } = useToast();
  const createKpi = useCreateScorecardKpi();
  const createRevisionLogs = useCreateRevisionLogs();
  const [isSaving, setIsSaving] = useState(false);
  const [kpiForm, setKpiForm] = useState<KpiForm>(EMPTY_KPI_FORM);

  const f = (k: keyof KpiForm) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setKpiForm(p => ({ ...p, [k]: e.target.value }));

  const handleCreate = async () => {
    if (!kpiForm.kpiNumber || !kpiForm.description || !kpiForm.annualTarget) return;
    setIsSaving(true);
    try {
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
      const created = await createKpi.mutateAsync({ scorecardId, data: payload });
      await createRevisionLogs.mutateAsync({
        scorecardId,
        data: {
          entries: [{
            kpiId: created.id,
            revisionType: "kpi_added",
            newValue: `${kpiForm.kpiNumber}: ${kpiForm.description}`,
            revisionReason: "New KPI added during mid-year revision",
          }],
        },
      });
      toast({ title: "New KPI added to revised SDBIP" });
      onCreated();
    } catch (e: any) {
      toast({ title: "Error", description: e?.response?.data?.error || "Failed to create KPI", variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in-50 duration-300">
      <div className="flex items-center justify-between pb-4 border-b">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={onBack}>
            <ArrowLeft className="w-4 h-4 mr-1" /> Back to KPI List
          </Button>
          <div>
            <h2 className="text-xl font-bold text-slate-800">Add New KPI (Mid-Year Revision)</h2>
            <p className="text-sm text-slate-500">{scorecardName}</p>
          </div>
          <Badge className="bg-blue-100 text-blue-700">New</Badge>
        </div>
        <Button onClick={handleCreate} disabled={isSaving || !kpiForm.kpiNumber || !kpiForm.description || !kpiForm.annualTarget}>
          {isSaving ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <Plus className="w-4 h-4 mr-1" />}
          Create KPI
        </Button>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base">KPI Details</CardTitle></CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <Label className="text-sm font-semibold text-slate-700">Indicator Name *</Label>
              <Textarea className="mt-1 min-h-[72px]" value={kpiForm.description} onChange={f("description")} placeholder="Full indicator / KPI description" />
            </div>
            <div>
              <Label className="text-sm font-semibold text-slate-700">KPI Number *</Label>
              <Input className="mt-1" value={kpiForm.kpiNumber} onChange={f("kpiNumber")} placeholder="e.g. KPI-NEW-001" />
            </div>
            <div>
              <Label className="text-sm font-semibold text-slate-700">Annual Target *</Label>
              <Input className="mt-1" value={kpiForm.annualTarget} onChange={f("annualTarget")} placeholder="Target for the financial year" />
            </div>
            <div>
              <Label className="text-sm font-semibold text-slate-700">Baseline</Label>
              <Input className="mt-1" value={kpiForm.baseline} onChange={f("baseline")} placeholder="e.g. 100%" />
            </div>
            <div>
              <Label className="text-sm font-semibold text-slate-700">Weight Percent (%)</Label>
              <Input className="mt-1" type="number" min={0} max={100} value={kpiForm.weighting}
                onChange={e => setKpiForm(p => ({ ...p, weighting: Number(e.target.value) }))} />
            </div>
            <div>
              <Label className="text-sm font-semibold text-slate-700">Responsible Post</Label>
              <Select value={kpiForm.responsiblePostId ? String(kpiForm.responsiblePostId) : "none"}
                onValueChange={v => setKpiForm(p => ({ ...p, responsiblePostId: v === "none" ? undefined : Number(v) }))}>
                <SelectTrigger className="mt-1"><SelectValue placeholder="Select post" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">— None —</SelectItem>
                  {users.map(u => <SelectItem key={u.id} value={String(u.id)}>{u.displayName}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-sm font-semibold text-slate-700">Custodian Post</Label>
              <Select value={kpiForm.custodianPostId ? String(kpiForm.custodianPostId) : "none"}
                onValueChange={v => setKpiForm(p => ({ ...p, custodianPostId: v === "none" ? undefined : Number(v) }))}>
                <SelectTrigger className="mt-1"><SelectValue placeholder="Select post" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">— None —</SelectItem>
                  {users.map(u => <SelectItem key={u.id} value={String(u.id)}>{u.displayName}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-sm font-semibold text-slate-700">Unit of Measure</Label>
              <Select value={kpiForm.unitOfMeasureId ? String(kpiForm.unitOfMeasureId) : "none"}
                onValueChange={v => setKpiForm(p => ({ ...p, unitOfMeasureId: v === "none" ? undefined : Number(v) }))}>
                <SelectTrigger className="mt-1"><SelectValue placeholder="Select UOM" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">— None —</SelectItem>
                  {uoms.map(u => <SelectItem key={u.id} value={String(u.id)}>{u.name} ({u.abbreviation})</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-sm font-semibold text-slate-700">Funding Source</Label>
              <Input className="mt-1" value={kpiForm.fundingSource} onChange={f("fundingSource")} placeholder="e.g. OPEX, MIG, USDG" />
            </div>
            <div>
              <Label className="text-sm font-semibold text-slate-700">Annual Budget Target (R)</Label>
              <Input className="mt-1" type="number" value={kpiForm.annualBudgetTarget}
                onChange={e => setKpiForm(p => ({ ...p, annualBudgetTarget: Number(e.target.value) }))} />
            </div>
            <div>
              <Label className="text-sm font-semibold text-slate-700">IDP Reference</Label>
              <Input className="mt-1" value={kpiForm.idpReference} onChange={f("idpReference")} placeholder="e.g. M_HS1" />
            </div>
            <div>
              <Label className="text-sm font-semibold text-slate-700">Programme</Label>
              <Input className="mt-1" value={kpiForm.programme} onChange={f("programme")} placeholder="e.g. HUMAN SETTLEMENTS" />
            </div>
            <div className="col-span-2">
              <Label className="text-sm font-semibold text-slate-700">Strategic Objective</Label>
              <Textarea className="mt-1" value={kpiForm.strategicObjective} onChange={f("strategicObjective")} placeholder="KPA / Strategic Objective / Programme hierarchy" />
            </div>
            <div>
              <Label className="text-sm font-semibold text-slate-700">Source of Evidence</Label>
              <Textarea className="mt-1" value={kpiForm.evidenceSource} onChange={f("evidenceSource")} placeholder="Source of evidence" />
            </div>
            <div>
              <Label className="text-sm font-semibold text-slate-700">Portfolio of Evidence</Label>
              <Textarea className="mt-1" value={kpiForm.evidencePortfolio} onChange={f("evidencePortfolio")} placeholder="Portfolio of evidence" />
            </div>
            <div className="col-span-2 flex items-center gap-2">
              <Checkbox id="isCumulative" checked={kpiForm.isCumulative} onCheckedChange={v => setKpiForm(p => ({ ...p, isCumulative: !!v }))} />
              <Label htmlFor="isCumulative" className="text-sm font-medium cursor-pointer">Cumulative KPI</Label>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function KpiRevisionDetail({
  scorecardId, scorecardName, kpiId, kpis, users, uoms, onBack, onSaved,
}: {
  scorecardId: number; scorecardName: string; kpiId: number; kpis: any[];
  users: any[]; uoms: any[]; onBack: () => void; onSaved: () => void;
}) {
  const { toast } = useToast();
  const kpi = kpis.find(k => k.id === kpiId);
  const { data: quarterTargets, refetch: refetchTargets } = useListQuarterTargets(kpiId);
  const upsertTargets = useUpsertQuarterTargets();
  const updateKpi = useUpdateScorecardKpi();
  const createRevisionLogs = useCreateRevisionLogs();
  const [isSaving, setIsSaving] = useState(false);

  const [targetForm, setTargetForm] = useState({ q1: "", q2: "", q3: "", q4: "" });
  const [revisionReasons, setRevisionReasons] = useState({ q1: "", q2: "", q3: "", q4: "" });
  const [annualTarget, setAnnualTarget] = useState(kpi?.annualTarget ?? "");

  useEffect(() => {
    if (quarterTargets && quarterTargets.length > 0) {
      const byQ: Record<number, any> = {};
      quarterTargets.forEach((t: any) => { byQ[t.quarter] = t; });
      setTargetForm({
        q1: byQ[1]?.targetValue ?? "", q2: byQ[2]?.targetValue ?? "",
        q3: byQ[3]?.targetValue ?? "", q4: byQ[4]?.targetValue ?? "",
      });
    }
  }, [quarterTargets]);

  const getBaseline = (quarter: number) => {
    const t = quarterTargets?.find((t: any) => t.quarter === quarter);
    return t?.isApprovedBaseline ? t.baselineTargetValue : null;
  };

  const isChanged = (quarter: number) => {
    const key = `q${quarter}` as keyof typeof targetForm;
    const baseline = getBaseline(quarter);
    return baseline !== null && targetForm[key] !== baseline;
  };

  const hasBaselineData = quarterTargets?.some((t: any) => t.isApprovedBaseline);

  const handleSaveRevision = async () => {
    setIsSaving(true);
    try {
      const auditEntries: any[] = [];

      if (annualTarget !== kpi?.annualTarget) {
        await updateKpi.mutateAsync({ id: kpiId, data: { annualTarget } });
        auditEntries.push({
          kpiId, revisionType: "annual_target_revised",
          fieldName: "annualTarget", oldValue: kpi?.annualTarget, newValue: annualTarget,
          revisionReason: "Annual target revised during mid-year revision",
        });
      }

      const targets = [1, 2, 3, 4]
        .filter(q => targetForm[`q${q}` as keyof typeof targetForm])
        .map(q => ({
          quarter: q,
          targetValue: targetForm[`q${q}` as keyof typeof targetForm],
          revisionReason: isChanged(q) ? revisionReasons[`q${q}` as keyof typeof revisionReasons] : undefined,
        }));

      const missingReasons = targets.filter(t => {
        const baseline = getBaseline(t.quarter);
        return baseline !== null && t.targetValue !== baseline && !t.revisionReason?.trim();
      });
      if (missingReasons.length > 0) {
        toast({
          title: "Revision reason required",
          description: `Please provide a reason for changes to Q${missingReasons.map(t => t.quarter).join(", Q")}`,
          variant: "destructive",
        });
        setIsSaving(false);
        return;
      }

      for (const t of targets) {
        const baseline = getBaseline(t.quarter);
        if (baseline !== null && t.targetValue !== baseline) {
          auditEntries.push({
            kpiId, revisionType: "target_revised", quarter: t.quarter,
            fieldName: `Q${t.quarter} Target`, oldValue: baseline, newValue: t.targetValue,
            revisionReason: t.revisionReason,
          });
        }
      }

      await upsertTargets.mutateAsync({ kpiId, data: { targets } });

      if (auditEntries.length > 0) {
        await createRevisionLogs.mutateAsync({ scorecardId, data: { entries: auditEntries } });
      }

      refetchTargets();
      onSaved();
      toast({ title: "Revised targets saved" });
    } catch (e: any) {
      toast({ title: "Error", description: e?.response?.data?.error || "Failed to save", variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };

  if (!kpi) return null;

  return (
    <div className="space-y-6 animate-in fade-in-50 duration-300">
      <div className="flex items-center justify-between pb-4 border-b">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={onBack}>
            <ArrowLeft className="w-4 h-4 mr-1" /> Back to KPI List
          </Button>
          <div>
            <h2 className="text-xl font-bold text-slate-800">Revise KPI {kpi.kpiNumber}</h2>
            <p className="text-sm text-slate-500">{scorecardName}</p>
          </div>
          <Badge className={STATUS_COLORS[kpi.status]}>{kpi.status}</Badge>
        </div>
        <Button onClick={handleSaveRevision} disabled={isSaving}>
          {isSaving ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <Save className="w-4 h-4 mr-1" />}
          Save Revised Targets
        </Button>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base">KPI Overview</CardTitle></CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div><span className="font-medium text-slate-600">Indicator:</span> <span className="text-slate-800">{kpi.description}</span></div>
            <div><span className="font-medium text-slate-600">Weighting:</span> <span className="text-slate-800">{kpi.weighting}%</span></div>
            <div><span className="font-medium text-slate-600">Baseline:</span> <span className="text-slate-800">{kpi.baseline || "—"}</span></div>
            <div>
              <Label className="text-sm font-medium text-slate-600">Annual Target (Revised)</Label>
              <Input className="mt-1" value={annualTarget} onChange={e => setAnnualTarget(e.target.value)} placeholder="Revised annual target" />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Quarterly Target Revision</CardTitle>
          <CardDescription>
            {hasBaselineData
              ? "Original approved baseline values are shown for comparison. Provide revision reasons for any changes."
              : "Set quarterly targets for this KPI."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-4 gap-4">
            {[1, 2, 3, 4].map(q => {
              const key = `q${q}` as keyof typeof targetForm;
              const baseline = getBaseline(q);
              const changed = isChanged(q);
              return (
                <div key={q} className={`space-y-3 p-4 rounded-lg border ${changed ? "border-amber-300 bg-amber-50/50" : "border-slate-200"}`}>
                  <div className="flex items-center justify-between">
                    <h4 className="font-semibold text-slate-700">Quarter {q}</h4>
                    {changed && <Badge className="bg-amber-100 text-amber-700 text-xs">Changed</Badge>}
                  </div>
                  {baseline !== null && (
                    <div className="text-xs">
                      <span className="text-slate-500">Original Baseline:</span>
                      <span className="ml-1 font-medium text-slate-700">{baseline}</span>
                    </div>
                  )}
                  <div>
                    <Label className="text-xs font-medium">Revised Target</Label>
                    <Input value={targetForm[key]} onChange={e => setTargetForm(p => ({ ...p, [key]: e.target.value }))} placeholder="Target value" className="mt-1" />
                  </div>
                  {changed && (
                    <div>
                      <Label className="text-xs font-medium text-amber-700">Revision Reason *</Label>
                      <Textarea value={revisionReasons[key]} onChange={e => setRevisionReasons(p => ({ ...p, [key]: e.target.value }))}
                        placeholder="Why is this target being revised?" rows={2} className="mt-1 text-sm border-amber-300" />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function RevisionAuditTrail({ logs, kpis }: { logs: any[]; kpis: any[] }) {
  const getKpiLabel = (kpiId: number | null) => {
    if (!kpiId) return "";
    const kpi = kpis.find(k => k.id === kpiId);
    return kpi ? `${kpi.kpiNumber}: ${kpi.description}` : `KPI #${kpiId}`;
  };

  if (logs.length === 0) {
    return (
      <Card>
        <CardContent className="py-16 text-center">
          <History className="w-12 h-12 text-slate-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-slate-600">No Revision History</h3>
          <p className="text-slate-400 mt-1">Changes made during this revision will be recorded here.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <History className="w-5 h-5" /> Revision Audit Trail
        </CardTitle>
        <CardDescription>{logs.length} revision event(s) recorded</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-0">
          {logs.map((log, idx) => (
            <div key={log.id} className="flex gap-4 pb-4 relative">
              {idx < logs.length - 1 && (
                <div className="absolute left-[15px] top-[32px] bottom-0 w-px bg-slate-200" />
              )}
              <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center shrink-0 z-10">
                <Clock className="w-4 h-4 text-slate-500" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-xs">
                    {REVISION_TYPE_LABELS[log.revisionType] || log.revisionType}
                  </Badge>
                  <span className="text-xs text-slate-400">
                    {new Date(log.createdAt).toLocaleString()}
                  </span>
                </div>
                <p className="text-sm text-slate-700 mt-1">
                  <span className="font-medium">{log.userName}</span>
                  {log.kpiId && (
                    <span className="text-slate-500"> · {getKpiLabel(log.kpiId)}</span>
                  )}
                </p>
                {log.fieldName && (
                  <p className="text-sm text-slate-600 mt-0.5">
                    <span className="font-medium">{log.fieldName}:</span>
                    {log.oldValue && <span className="line-through text-red-500 mx-1">{log.oldValue}</span>}
                    {log.oldValue && log.newValue && <span className="text-slate-400">→</span>}
                    {log.newValue && <span className="text-green-600 mx-1">{log.newValue}</span>}
                  </p>
                )}
                {!log.fieldName && log.newValue && (
                  <p className="text-sm text-slate-600 mt-0.5">{log.newValue}</p>
                )}
                {log.revisionReason && (
                  <p className="text-xs text-amber-700 mt-1 italic">Reason: {log.revisionReason}</p>
                )}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
