import { useState } from "react";
import {
  useListIndividualAssessments, useCreateIndividualAssessment,
  useListIndividualModerations, useCreateIndividualModeration,
  useListAgreements, useListCycles,
} from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/core/hooks/use-toast";
import { Plus, ClipboardCheck, Scale } from "lucide-react";

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

const TYPE_LABELS: Record<string, string> = {
  quarterly: "Quarterly Review",
  "mid-year": "Mid-Year Assessment",
  annual: "Annual Assessment",
};

export default function IndividualAssessment() {
  const { toast } = useToast();
  const { data: cycles } = useListCycles();
  const [selectedCycleId, setSelectedCycleId] = useState<number | undefined>();
  const [selectedAgreementId, setSelectedAgreementId] = useState<number | undefined>();
  const [showCreate, setShowCreate] = useState(false);
  const [showModerate, setShowModerate] = useState(false);

  const [form, setForm] = useState({ assessmentType: "quarterly" as "quarterly" | "mid-year" | "annual", quarter: 1, kpiScore: 0, competencyScore: 0, comments: "", developmentNeeds: "" });
  const [modForm, setModForm] = useState({ assessmentId: 0, outcome: "accepted" as "accepted" | "adjusted" | "referred", originalScore: 0, adjustedScore: 0, adjustmentReason: "", notes: "" });

  const { data: agreements } = useListAgreements({ cycleId: selectedCycleId });
  const { data: assessments, refetch } = useListIndividualAssessments({ agreementId: selectedAgreementId });
  const { data: moderations, refetch: refetchMods } = useListIndividualModerations({ agreementId: selectedAgreementId });
  const createAssessment = useCreateIndividualAssessment();
  const createModeration = useCreateIndividualModeration();

  const handleCreate = async () => {
    if (!selectedAgreementId) return;
    try {
      await createAssessment.mutateAsync({
        data: {
          agreementId: selectedAgreementId,
          assessmentType: form.assessmentType,
          quarter: form.assessmentType === "quarterly" ? form.quarter : undefined,
          kpiScore: form.kpiScore,
          competencyScore: form.competencyScore,
          comments: form.comments || undefined,
          developmentNeeds: form.developmentNeeds || undefined,
        },
      });
      toast({ title: "Assessment created" });
      setShowCreate(false);
      refetch();
    } catch (e: unknown) {
      toast({ title: "Error", description: getErrorMessage(e), variant: "destructive" });
    }
  };

  const handleModerate = async () => {
    if (!selectedAgreementId || !modForm.assessmentId) return;
    try {
      await createModeration.mutateAsync({
        data: {
          assessmentId: modForm.assessmentId,
          agreementId: selectedAgreementId,
          outcome: modForm.outcome,
          originalScore: modForm.originalScore,
          adjustedScore: modForm.outcome === "adjusted" ? modForm.adjustedScore : undefined,
          adjustmentReason: modForm.adjustmentReason || undefined,
          notes: modForm.notes || undefined,
        },
      });
      toast({ title: "Moderation recorded" });
      setShowModerate(false);
      refetchMods();
    } catch (e: unknown) {
      toast({ title: "Error", description: getErrorMessage(e), variant: "destructive" });
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Individual Assessments</h1>
          <p className="text-slate-500 mt-1">Quarterly, mid-year, and annual performance assessments</p>
        </div>
        <div className="flex gap-3">
          <Select value={selectedCycleId ? String(selectedCycleId) : "all"} onValueChange={v => setSelectedCycleId(v === "all" ? undefined : Number(v))}>
            <SelectTrigger className="w-[200px]"><SelectValue placeholder="All cycles" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Cycles</SelectItem>
              {cycles?.map(c => <SelectItem key={c.id} value={String(c.id)}>{c.financialYearLabel}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={selectedAgreementId ? String(selectedAgreementId) : "all"} onValueChange={v => setSelectedAgreementId(v === "all" ? undefined : Number(v))}>
            <SelectTrigger className="w-[250px]"><SelectValue placeholder="Select agreement" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Agreements</SelectItem>
              {agreements?.map(a => <SelectItem key={a.id} value={String(a.id)}>{a.employeeName} — {a.postTitle}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="flex gap-3">
        {selectedAgreementId && (
          <>
            <Button onClick={() => setShowCreate(true)}><Plus className="w-4 h-4 mr-1" /> New Assessment</Button>
            <Button variant="outline" onClick={() => setShowModerate(true)}><Scale className="w-4 h-4 mr-1" /> Moderate</Button>
          </>
        )}
      </div>

      <Card>
        <CardHeader><CardTitle className="text-lg flex items-center gap-2"><ClipboardCheck className="w-5 h-5" /> Assessment Records</CardTitle></CardHeader>
        <CardContent>
          {!assessments?.length ? (
            <p className="text-sm text-slate-400 text-center py-6">
              {selectedAgreementId ? "No assessments for this agreement" : "Select an agreement to view assessments"}
            </p>
          ) : (
            <table className="w-full text-sm">
              <thead><tr className="border-b text-slate-500"><th className="text-left py-2 px-2">Type</th><th className="text-left py-2 px-2">Quarter</th><th className="text-right py-2 px-2">KPI Score</th><th className="text-right py-2 px-2">Competency</th><th className="text-right py-2 px-2">Overall</th><th className="text-left py-2 px-2">Status</th></tr></thead>
              <tbody>
                {assessments.map(a => (
                  <tr key={a.id} className="border-b last:border-0 hover:bg-slate-50">
                    <td className="py-2 px-2">{TYPE_LABELS[a.assessmentType] || a.assessmentType}</td>
                    <td className="py-2 px-2">{a.quarter ? `Q${a.quarter}` : "—"}</td>
                    <td className="py-2 px-2 text-right font-medium">{a.kpiScore?.toFixed(1) ?? "—"}</td>
                    <td className="py-2 px-2 text-right font-medium">{a.competencyScore?.toFixed(1) ?? "—"}</td>
                    <td className="py-2 px-2 text-right font-bold">{a.overallScore?.toFixed(1) ?? "—"}</td>
                    <td className="py-2 px-2"><Badge variant="outline">{a.status}</Badge></td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>

      {selectedAgreementId && moderations && moderations.length > 0 && (
        <Card>
          <CardHeader><CardTitle className="text-lg flex items-center gap-2"><Scale className="w-5 h-5" /> Moderation Records</CardTitle></CardHeader>
          <CardContent>
            <table className="w-full text-sm">
              <thead><tr className="border-b text-slate-500"><th className="text-left py-2 px-2">Assessment</th><th className="text-left py-2 px-2">Outcome</th><th className="text-right py-2 px-2">Original</th><th className="text-right py-2 px-2">Adjusted</th><th className="text-left py-2 px-2">Reason</th></tr></thead>
              <tbody>
                {moderations.map(m => (
                  <tr key={m.id} className="border-b last:border-0 hover:bg-slate-50">
                    <td className="py-2 px-2">Assessment #{m.assessmentId}</td>
                    <td className="py-2 px-2"><Badge className={m.outcome === "accepted" ? "bg-green-100 text-green-700" : m.outcome === "adjusted" ? "bg-yellow-100 text-yellow-700" : "bg-red-100 text-red-700"}>{m.outcome}</Badge></td>
                    <td className="py-2 px-2 text-right">{m.originalScore?.toFixed(1) ?? "—"}</td>
                    <td className="py-2 px-2 text-right font-medium">{m.adjustedScore?.toFixed(1) ?? "—"}</td>
                    <td className="py-2 px-2 text-sm text-slate-500">{m.adjustmentReason || "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      )}

      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent>
          <DialogHeader><DialogTitle>New Assessment</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Type</Label>
              <Select value={form.assessmentType} onValueChange={v => setForm(p => ({ ...p, assessmentType: v as "quarterly" | "mid-year" | "annual" }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="quarterly">Quarterly Review</SelectItem>
                  <SelectItem value="mid-year">Mid-Year Assessment</SelectItem>
                  <SelectItem value="annual">Annual Assessment</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {form.assessmentType === "quarterly" && (
              <div><Label>Quarter</Label><Select value={String(form.quarter)} onValueChange={v => setForm(p => ({ ...p, quarter: Number(v) }))}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{[1,2,3,4].map(q => <SelectItem key={q} value={String(q)}>Q{q}</SelectItem>)}</SelectContent></Select></div>
            )}
            <div><Label>KPI Score (0-5)</Label><Input type="number" step="0.1" min="0" max="5" value={form.kpiScore} onChange={e => setForm(p => ({ ...p, kpiScore: Number(e.target.value) }))} /></div>
            <div><Label>Competency Score (0-5)</Label><Input type="number" step="0.1" min="0" max="5" value={form.competencyScore} onChange={e => setForm(p => ({ ...p, competencyScore: Number(e.target.value) }))} /></div>
            <div><Label>Comments</Label><Textarea value={form.comments} onChange={e => setForm(p => ({ ...p, comments: e.target.value }))} /></div>
            <div><Label>Development Needs</Label><Textarea value={form.developmentNeeds} onChange={e => setForm(p => ({ ...p, developmentNeeds: e.target.value }))} /></div>
          </div>
          <DialogFooter><Button onClick={handleCreate}>Create Assessment</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showModerate} onOpenChange={setShowModerate}>
        <DialogContent>
          <DialogHeader><DialogTitle>Moderate Assessment</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Assessment</Label>
              <Select value={modForm.assessmentId ? String(modForm.assessmentId) : "none"} onValueChange={v => setModForm(p => ({ ...p, assessmentId: Number(v) }))}>
                <SelectTrigger><SelectValue placeholder="Select assessment" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Select</SelectItem>
                  {assessments?.map(a => <SelectItem key={a.id} value={String(a.id)}>{TYPE_LABELS[a.assessmentType] || a.assessmentType} — Score: {a.overallScore?.toFixed(1)}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Outcome</Label>
              <Select value={modForm.outcome} onValueChange={v => setModForm(p => ({ ...p, outcome: v as "accepted" | "adjusted" | "referred" }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="accepted">Accepted</SelectItem>
                  <SelectItem value="adjusted">Adjusted</SelectItem>
                  <SelectItem value="referred">Referred</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div><Label>Original Score</Label><Input type="number" step="0.1" value={modForm.originalScore} onChange={e => setModForm(p => ({ ...p, originalScore: Number(e.target.value) }))} /></div>
            {modForm.outcome === "adjusted" && (
              <div><Label>Adjusted Score</Label><Input type="number" step="0.1" value={modForm.adjustedScore} onChange={e => setModForm(p => ({ ...p, adjustedScore: Number(e.target.value) }))} /></div>
            )}
            <div><Label>Reason</Label><Textarea value={modForm.adjustmentReason} onChange={e => setModForm(p => ({ ...p, adjustmentReason: e.target.value }))} /></div>
          </div>
          <DialogFooter><Button onClick={handleModerate}>Submit</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
