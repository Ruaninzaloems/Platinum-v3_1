import { useState } from "react";
import {
  useListScorecards, useListScorecardKpis,
  useListKpiActuals, useCreateKpiActual, useUpdateKpiActual,
  useListKpiEvidence, useUploadKpiEvidence, useVerifyEvidence,
  useTransitionKpiActual,
} from "@workspace/api-client-react";
import { useListCycles } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import {
  Send, AlertTriangle, CheckCircle2, Pencil, Upload,
  File, FileCheck, FileX, ArrowLeft, Loader2, Clock,
  ArrowRight, Eye,
} from "lucide-react";

const STATUS_COLORS: Record<string, string> = {
  Draft: "bg-gray-100 text-gray-700",
  Submitted: "bg-blue-100 text-blue-700",
  "In Review": "bg-amber-100 text-amber-700",
  Returned: "bg-red-100 text-red-700",
  Approved: "bg-green-100 text-green-700",
};

const REVIEW_LEVEL_LABELS: Record<string, string> = {
  line_manager: "Line Manager",
  director: "Director",
  pms_manager: "PMS Manager",
  pms_director: "PMS Director",
  internal_audit: "Internal Audit",
};

const VERIFICATION_COLORS: Record<string, string> = {
  Pending: "bg-amber-100 text-amber-700",
  Verified: "bg-green-100 text-green-700",
  Rejected: "bg-red-100 text-red-700",
};

export default function ActualsCapture() {
  const { toast } = useToast();
  const { data: cycles } = useListCycles();
  const [selectedCycleId, setSelectedCycleId] = useState<number | undefined>();
  const [selectedScorecardId, setSelectedScorecardId] = useState<number | undefined>();
  const [selectedKpiId, setSelectedKpiId] = useState<number | undefined>();
  const [showCapture, setShowCapture] = useState(false);
  const [editingActualId, setEditingActualId] = useState<number | null>(null);
  const [showUpload, setShowUpload] = useState<number | null>(null);
  const [captureForm, setCaptureForm] = useState({
    quarter: 1, actualValue: "", commentary: "", isAchieved: false, isOnHold: false,
    onHoldReason: "", challengeNarrative: "", correctiveAction: "",
    underperformanceReason: "", overperformanceReason: "",
    budgetImplication: "", analysisNotes: "", lateOverrideReason: "",
  });
  const [uploadForm, setUploadForm] = useState({ fileName: "", fileSize: 0, mimeType: "", documentType: "", description: "" });

  const effectiveCycleId = selectedCycleId || cycles?.[0]?.id;
  const { data: scorecards } = useListScorecards({ cycleId: effectiveCycleId });
  const kpisQuery = useListScorecardKpis(selectedScorecardId ?? 0);
  const allKpis = selectedScorecardId ? kpisQuery.data : undefined;
  const actualsQuery = useListKpiActuals(selectedKpiId ?? 0);
  const actuals = selectedKpiId ? actualsQuery.data : undefined;
  const refetchActuals = actualsQuery.refetch;

  const createActual = useCreateKpiActual();
  const updateActual = useUpdateKpiActual();
  const transitionActual = useTransitionKpiActual();
  const uploadEvidence = useUploadKpiEvidence();
  const verifyEvidence = useVerifyEvidence();

  const approvedScorecards = scorecards?.filter(s => s.status === "Approved") || [];
  const approvedKpis = allKpis?.filter(k => k.status === "Approved") || [];

  const defaultForm = { quarter: 1, actualValue: "", commentary: "", isAchieved: false, isOnHold: false, onHoldReason: "", challengeNarrative: "", correctiveAction: "", underperformanceReason: "", overperformanceReason: "", budgetImplication: "", analysisNotes: "", lateOverrideReason: "" };

  function openEditActual(actual: NonNullable<typeof actuals>[number]) {
    setCaptureForm({
      quarter: actual.quarter ?? 1,
      actualValue: actual.actualValue ?? "",
      commentary: actual.commentary ?? "",
      isAchieved: actual.isAchieved ?? false,
      isOnHold: actual.isOnHold ?? false,
      onHoldReason: actual.onHoldReason ?? "",
      challengeNarrative: actual.challengeNarrative ?? "",
      correctiveAction: actual.correctiveAction ?? "",
      underperformanceReason: actual.underperformanceReason ?? "",
      overperformanceReason: actual.overperformanceReason ?? "",
      budgetImplication: actual.budgetImplication ?? "",
      analysisNotes: actual.analysisNotes ?? "",
      lateOverrideReason: actual.lateOverrideReason ?? "",
    });
    setEditingActualId(actual.id);
    setShowCapture(true);
  }

  async function handleSubmit() {
    if (editingActualId) {
      try {
        await updateActual.mutateAsync({
          id: editingActualId,
          data: {
            actualValue: captureForm.actualValue,
            commentary: captureForm.commentary || undefined,
            isAchieved: captureForm.isAchieved,
            isOnHold: captureForm.isOnHold,
            onHoldReason: captureForm.onHoldReason || undefined,
            challengeNarrative: captureForm.challengeNarrative || undefined,
            correctiveAction: captureForm.correctiveAction || undefined,
            underperformanceReason: captureForm.underperformanceReason || undefined,
            overperformanceReason: captureForm.overperformanceReason || undefined,
            budgetImplication: captureForm.budgetImplication || undefined,
            analysisNotes: captureForm.analysisNotes || undefined,
          }
        });
        setShowCapture(false);
        setEditingActualId(null);
        setCaptureForm(defaultForm);
        refetchActuals();
        toast({ title: "Actual updated" });
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : "Error";
        toast({ title: msg, variant: "destructive" });
      }
      return;
    }
    if (!selectedKpiId) return;
    try {
      await createActual.mutateAsync({
        kpiId: selectedKpiId,
        data: {
          quarter: captureForm.quarter,
          actualValue: captureForm.actualValue,
          commentary: captureForm.commentary || undefined,
          isAchieved: captureForm.isAchieved,
          isOnHold: captureForm.isOnHold,
          onHoldReason: captureForm.onHoldReason || undefined,
          challengeNarrative: captureForm.challengeNarrative || undefined,
          correctiveAction: captureForm.correctiveAction || undefined,
          underperformanceReason: captureForm.underperformanceReason || undefined,
          overperformanceReason: captureForm.overperformanceReason || undefined,
          budgetImplication: captureForm.budgetImplication || undefined,
          analysisNotes: captureForm.analysisNotes || undefined,
          lateOverrideReason: captureForm.lateOverrideReason || undefined,
        }
      });
      setShowCapture(false);
      setCaptureForm(defaultForm);
      refetchActuals();
      toast({ title: "Actual saved as draft. Add evidence then submit for review." });
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Error";
      toast({ title: msg, variant: "destructive" });
    }
  }

  async function handleSubmitForReview(actualId: number) {
    try {
      await transitionActual.mutateAsync({ id: actualId, data: { action: "submit" } });
      refetchActuals();
      toast({ title: "Actual submitted for review" });
    } catch (e: any) {
      toast({ title: "Error", description: e?.response?.data?.error || "Failed to submit", variant: "destructive" });
    }
  }

  async function handleUpload(actualQuarter: number) {
    if (!selectedKpiId || !uploadForm.fileName) return;
    try {
      await uploadEvidence.mutateAsync({
        kpiId: selectedKpiId,
        data: {
          quarter: actualQuarter,
          fileName: uploadForm.fileName,
          fileSize: uploadForm.fileSize || 1024,
          mimeType: uploadForm.mimeType || "application/pdf",
          documentType: uploadForm.documentType || undefined,
          description: uploadForm.description || undefined,
        }
      });
      setShowUpload(null);
      setUploadForm({ fileName: "", fileSize: 0, mimeType: "", documentType: "", description: "" });
      refetchActuals();
      toast({ title: "Evidence uploaded" });
    } catch {
      toast({ title: "Error uploading", variant: "destructive" });
    }
  }

  async function handleVerify(id: number, status: "Verified" | "Rejected") {
    try {
      await verifyEvidence.mutateAsync({ id, data: { status } });
      toast({ title: `Evidence ${status.toLowerCase()}` });
    } catch {
      toast({ title: "Error", variant: "destructive" });
    }
  }

  return (
    <div className="space-y-6 animate-in fade-in-50 duration-300">
      <div>
        <h2 className="text-2xl font-bold text-slate-800">Submit Actuals & Evidence</h2>
        <p className="text-slate-500">Capture quarterly actuals, upload supporting evidence, and submit for review</p>
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
        {approvedScorecards.length > 0 && (
          <Select value={String(selectedScorecardId || "")} onValueChange={v => { setSelectedScorecardId(Number(v)); setSelectedKpiId(undefined); }}>
            <SelectTrigger className="w-64"><SelectValue placeholder="Select scorecard" /></SelectTrigger>
            <SelectContent>
              {approvedScorecards.map(s => <SelectItem key={s.id} value={String(s.id)}>{s.name}</SelectItem>)}
            </SelectContent>
          </Select>
        )}
      </div>

      {selectedScorecardId && approvedKpis.length > 0 && (
        <div className="space-y-3">
          {approvedKpis.map(kpi => (
            <Card key={kpi.id} className={`cursor-pointer transition-all ${selectedKpiId === kpi.id ? 'ring-2 ring-blue-500' : 'hover:shadow-md'}`} onClick={() => setSelectedKpiId(kpi.id)}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-mono text-sm text-slate-500">{kpi.kpiNumber}</span>
                      <Badge variant="outline">{kpi.weighting}%</Badge>
                    </div>
                    <p className="font-medium text-slate-800">{kpi.description}</p>
                    <p className="text-sm text-slate-500 mt-1">Target: {kpi.annualTarget}</p>
                  </div>
                  {selectedKpiId === kpi.id && (
                    <Button size="sm" onClick={(e) => { e.stopPropagation(); setCaptureForm(defaultForm); setEditingActualId(null); setShowCapture(true); }}>
                      <Send className="w-4 h-4 mr-1" /> Capture Actual
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {selectedKpiId && actuals && actuals.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-slate-700">Actuals & Evidence</h3>
          {actuals.map(actual => (
            <ActualWithEvidence
              key={actual.id}
              actual={actual}
              kpiId={selectedKpiId}
              onEdit={() => openEditActual(actual)}
              onSubmitForReview={() => handleSubmitForReview(actual.id)}
              onUploadEvidence={() => setShowUpload(actual.quarter)}
              onVerify={handleVerify}
            />
          ))}
        </div>
      )}

      {selectedKpiId && (!actuals || actuals.length === 0) && (
        <Card className="border-dashed">
          <CardContent className="p-8 text-center text-slate-500">
            <Send className="w-12 h-12 mx-auto mb-3 text-slate-300" />
            <p className="font-medium">No actuals captured yet for this KPI</p>
            <p className="text-sm mt-1">Click "Capture Actual" above to get started</p>
          </CardContent>
        </Card>
      )}

      <Dialog open={showCapture} onOpenChange={v => { setShowCapture(v); if (!v) setEditingActualId(null); }}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{editingActualId ? "Edit Actual" : "Capture Quarterly Actual"}</DialogTitle></DialogHeader>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Quarter *</Label>
              <Select value={String(captureForm.quarter)} onValueChange={v => setCaptureForm(p => ({ ...p, quarter: Number(v) }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {[1, 2, 3, 4].map(q => <SelectItem key={q} value={String(q)}>Q{q}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div><Label>Actual Value *</Label><Input value={captureForm.actualValue} onChange={e => setCaptureForm(p => ({ ...p, actualValue: e.target.value }))} /></div>
            <div className="col-span-2"><Label>Commentary</Label><Textarea value={captureForm.commentary} onChange={e => setCaptureForm(p => ({ ...p, commentary: e.target.value }))} /></div>
            <div className="flex items-center gap-2"><Checkbox checked={captureForm.isAchieved} onCheckedChange={v => setCaptureForm(p => ({ ...p, isAchieved: !!v }))} /><Label>Achieved</Label></div>
            <div className="flex items-center gap-2"><Checkbox checked={captureForm.isOnHold} onCheckedChange={v => setCaptureForm(p => ({ ...p, isOnHold: !!v }))} /><Label>On Hold</Label></div>
            {captureForm.isOnHold && <div className="col-span-2"><Label>On Hold Reason</Label><Textarea value={captureForm.onHoldReason} onChange={e => setCaptureForm(p => ({ ...p, onHoldReason: e.target.value }))} /></div>}
            {!captureForm.isAchieved && <div className="col-span-2"><Label>Underperformance Reason</Label><Textarea value={captureForm.underperformanceReason} onChange={e => setCaptureForm(p => ({ ...p, underperformanceReason: e.target.value }))} /></div>}
            {captureForm.isAchieved && <div className="col-span-2"><Label>Overperformance Reason</Label><Textarea value={captureForm.overperformanceReason} onChange={e => setCaptureForm(p => ({ ...p, overperformanceReason: e.target.value }))} /></div>}
            <div className="col-span-2"><Label>Challenge Narrative</Label><Textarea value={captureForm.challengeNarrative} onChange={e => setCaptureForm(p => ({ ...p, challengeNarrative: e.target.value }))} /></div>
            <div className="col-span-2"><Label>Corrective Action</Label><Textarea value={captureForm.correctiveAction} onChange={e => setCaptureForm(p => ({ ...p, correctiveAction: e.target.value }))} /></div>
            <div><Label>Budget Implication</Label><Input value={captureForm.budgetImplication} onChange={e => setCaptureForm(p => ({ ...p, budgetImplication: e.target.value }))} /></div>
            <div><Label>Analysis Notes</Label><Input value={captureForm.analysisNotes} onChange={e => setCaptureForm(p => ({ ...p, analysisNotes: e.target.value }))} /></div>
            <div className="col-span-2"><Label>Late Override Reason</Label><Input value={captureForm.lateOverrideReason} onChange={e => setCaptureForm(p => ({ ...p, lateOverrideReason: e.target.value }))} placeholder="Required if past deadline" /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setShowCapture(false); setEditingActualId(null); }}>Cancel</Button>
            <Button onClick={handleSubmit} disabled={!captureForm.actualValue}>{editingActualId ? "Save Changes" : "Save Actual"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showUpload !== null} onOpenChange={v => { if (!v) setShowUpload(null); }}>
        <DialogContent>
          <DialogHeader><DialogTitle>Upload Evidence for Q{showUpload}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div><Label>File Name *</Label><Input value={uploadForm.fileName} onChange={e => setUploadForm(p => ({ ...p, fileName: e.target.value }))} placeholder="report.pdf" /></div>
            <div><Label>Document Type</Label><Input value={uploadForm.documentType} onChange={e => setUploadForm(p => ({ ...p, documentType: e.target.value }))} placeholder="Report, Minutes, etc." /></div>
            <div><Label>Description</Label><Input value={uploadForm.description} onChange={e => setUploadForm(p => ({ ...p, description: e.target.value }))} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowUpload(null)}>Cancel</Button>
            <Button onClick={() => showUpload && handleUpload(showUpload)} disabled={!uploadForm.fileName}>Upload</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function ActualWithEvidence({
  actual, kpiId, onEdit, onSubmitForReview, onUploadEvidence, onVerify,
}: {
  actual: any; kpiId: number;
  onEdit: () => void;
  onSubmitForReview: () => void;
  onUploadEvidence: () => void;
  onVerify: (id: number, status: "Verified" | "Rejected") => void;
}) {
  const evidenceQuery = useListKpiEvidence(kpiId, { quarter: actual.quarter });
  const evidence = evidenceQuery.data;
  const canEdit = actual.status === "Draft" || actual.status === "Returned";
  const canSubmit = actual.status === "Draft" || actual.status === "Returned";

  return (
    <Card>
      <CardContent className="p-5">
        <div className="flex items-start justify-between mb-3">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <Badge variant="outline" className="text-sm font-semibold">Q{actual.quarter}</Badge>
              <Badge className={STATUS_COLORS[actual.status] || "bg-gray-100 text-gray-700"}>{actual.status}</Badge>
              {actual.isAchieved ? (
                <Badge className="bg-green-100 text-green-700"><CheckCircle2 className="w-3 h-3 mr-1" />Achieved</Badge>
              ) : (
                <Badge className="bg-red-100 text-red-700"><AlertTriangle className="w-3 h-3 mr-1" />Not Achieved</Badge>
              )}
              {actual.isLateSubmission && <Badge className="bg-amber-100 text-amber-700">Late</Badge>}
              {actual.isOnHold && <Badge className="bg-purple-100 text-purple-700">On Hold</Badge>}
              {actual.reviewLevel && actual.status === "In Review" && (
                <Badge className="bg-blue-50 text-blue-700 border border-blue-200">
                  <Clock className="w-3 h-3 mr-1" />{REVIEW_LEVEL_LABELS[actual.reviewLevel] || actual.reviewLevel}
                </Badge>
              )}
            </div>
            <p className="font-medium text-slate-800">Actual: {actual.actualValue}</p>
            {actual.commentary && <p className="text-sm text-slate-600 mt-1">{actual.commentary}</p>}
            {actual.status === "Returned" && actual.reviewComments && (
              <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded text-sm text-red-700">
                <span className="font-medium">Return reason:</span> {actual.reviewComments}
              </div>
            )}
          </div>
          <div className="flex gap-2 shrink-0">
            {canEdit && (
              <Button variant="ghost" size="sm" onClick={onEdit}>
                <Pencil className="w-4 h-4 mr-1" /> Edit
              </Button>
            )}
            {canSubmit && (
              <Button size="sm" className="bg-blue-600 hover:bg-blue-700" onClick={onSubmitForReview}>
                <Send className="w-4 h-4 mr-1" /> Submit for Review
              </Button>
            )}
          </div>
        </div>

        <div className="border-t pt-3 mt-3">
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-sm font-semibold text-slate-700 flex items-center gap-2">
              <File className="w-4 h-4" /> Evidence Documents
            </h4>
            {canEdit && (
              <Button size="sm" variant="outline" onClick={onUploadEvidence}>
                <Upload className="w-4 h-4 mr-1" /> Upload Evidence
              </Button>
            )}
          </div>

          {evidence && evidence.length > 0 ? (
            <div className="space-y-2">
              {evidence.map(doc => (
                <div key={doc.id} className="flex items-center justify-between p-2 bg-slate-50 rounded border">
                  <div className="flex items-center gap-2">
                    <File className="w-5 h-5 text-slate-400" />
                    <div>
                      <p className="text-sm font-medium text-slate-700">{doc.fileName}</p>
                      <p className="text-xs text-slate-500">
                        {doc.documentType && <span>{doc.documentType} · </span>}
                        {doc.description}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className={VERIFICATION_COLORS[doc.verificationStatus]}>{doc.verificationStatus}</Badge>
                    {doc.verificationStatus === "Pending" && (
                      <>
                        <Button variant="ghost" size="sm" className="text-green-600 h-7 px-2" onClick={() => onVerify(doc.id, "Verified")}>
                          <FileCheck className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="sm" className="text-red-600 h-7 px-2" onClick={() => onVerify(doc.id, "Rejected")}>
                          <FileX className="w-4 h-4" />
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-slate-400 italic">No evidence uploaded yet</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
