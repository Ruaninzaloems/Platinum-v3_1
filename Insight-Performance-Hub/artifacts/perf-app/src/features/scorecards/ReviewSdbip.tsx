import { useState } from "react";
import {
  useListScorecards, useTransitionScorecard,
  useListScorecardKpis, useTransitionScorecardKpi,
  useListQuarterTargets, useListCycles, useListUsers,
} from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { useToast } from "@/core/hooks/use-toast";
import {
  CheckCircle2, XCircle, ArrowLeft, FileSearch, Eye,
  Loader2, AlertTriangle, ClipboardCheck,
} from "lucide-react";

const STATUS_COLORS: Record<string, string> = {
  Draft: "bg-gray-100 text-gray-700",
  Submitted: "bg-blue-100 text-blue-700",
  Reviewed: "bg-amber-100 text-amber-700",
  Approved: "bg-green-100 text-green-700",
};

export default function ReviewSdbip() {
  const { toast } = useToast();
  const { data: cycles } = useListCycles();
  const { data: users } = useListUsers();
  const [selectedCycleId, setSelectedCycleId] = useState<number | undefined>();
  const [selectedScorecardId, setSelectedScorecardId] = useState<number | undefined>();
  const [reviewComments, setReviewComments] = useState("");
  const [kpiComments, setKpiComments] = useState<Record<number, string>>({});
  const [showReturnDialog, setShowReturnDialog] = useState(false);
  const [returnReason, setReturnReason] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

  const effectiveCycleId = selectedCycleId || cycles?.[0]?.id;
  const { data: allScorecards, refetch: refetchScorecards } = useListScorecards({ cycleId: effectiveCycleId });
  const kpisQuery = useListScorecardKpis(selectedScorecardId ?? 0);
  const kpis = selectedScorecardId ? kpisQuery.data : undefined;

  const scorecards = allScorecards?.filter(s => s.status === "Submitted" || s.status === "Reviewed") ?? [];
  const selectedScorecard = allScorecards?.find(s => s.id === selectedScorecardId);

  const transitionScorecard = useTransitionScorecard();
  const transitionKpi = useTransitionScorecardKpi();

  const getUserName = (id: number | null) => {
    if (!id) return "—";
    const u = users?.find(u => u.id === id);
    return u ? u.displayName : `User #${id}`;
  };

  const handleReviewKpi = async (kpiId: number, action: "review" | "return") => {
    setIsProcessing(true);
    try {
      await transitionKpi.mutateAsync({
        id: kpiId,
        data: { action, comments: kpiComments[kpiId] || "" },
      });
      toast({ title: action === "review" ? "KPI marked as Reviewed" : "KPI returned to Draft" });
      kpisQuery.refetch();
    } catch (e: any) {
      toast({ title: "Error", description: e?.response?.data?.error || "Failed to transition KPI", variant: "destructive" });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReviewScorecard = async () => {
    if (!selectedScorecardId) return;
    setIsProcessing(true);
    try {
      await transitionScorecard.mutateAsync({
        id: selectedScorecardId,
        data: { action: "review", comments: reviewComments },
      });
      toast({ title: "SDBIP marked as Reviewed", description: "The scorecard is now ready for PMS Director approval." });
      setSelectedScorecardId(undefined);
      setReviewComments("");
      refetchScorecards();
    } catch (e: any) {
      toast({ title: "Error", description: e?.response?.data?.error || "Failed to review scorecard", variant: "destructive" });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReturnScorecard = async () => {
    if (!selectedScorecardId) return;
    setIsProcessing(true);
    try {
      await transitionScorecard.mutateAsync({
        id: selectedScorecardId,
        data: { action: "return", comments: returnReason },
      });
      toast({ title: "SDBIP returned", description: "The scorecard has been returned to Draft for corrections." });
      setSelectedScorecardId(undefined);
      setReturnReason("");
      setShowReturnDialog(false);
      refetchScorecards();
    } catch (e: any) {
      toast({ title: "Error", description: e?.response?.data?.error || "Failed to return scorecard", variant: "destructive" });
    } finally {
      setIsProcessing(false);
    }
  };

  const submittedKpis = kpis?.filter(k => k.status === "Submitted") ?? [];
  const reviewedKpis = kpis?.filter(k => k.status === "Reviewed") ?? [];
  const allKpisReviewed = kpis && kpis.length > 0 && kpis.every(k => k.status === "Reviewed");

  if (selectedScorecardId && selectedScorecard) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => { setSelectedScorecardId(undefined); setReviewComments(""); }}>
            <ArrowLeft className="w-4 h-4 mr-2" /> Back to Queue
          </Button>
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-slate-800">Review: {selectedScorecard.name}</h1>
            <p className="text-slate-500">
              Status: <Badge className={STATUS_COLORS[selectedScorecard.status]}>{selectedScorecard.status}</Badge>
              {" · "}Created by {getUserName(selectedScorecard.createdById)}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <Card>
            <CardContent className="pt-4">
              <div className="text-sm text-slate-500">Total KPIs</div>
              <div className="text-2xl font-bold">{kpis?.length ?? 0}</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="text-sm text-slate-500">Reviewed</div>
              <div className="text-2xl font-bold text-amber-600">{reviewedKpis.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="text-sm text-slate-500">Pending Review</div>
              <div className="text-2xl font-bold text-blue-600">{submittedKpis.length}</div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>KPI Review</CardTitle>
            <CardDescription>Review each KPI individually, then mark the entire scorecard as reviewed.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {kpis?.map(kpi => (
                <KpiReviewCard
                  key={kpi.id}
                  kpi={kpi}
                  comment={kpiComments[kpi.id] || ""}
                  onCommentChange={(val) => setKpiComments(prev => ({ ...prev, [kpi.id]: val }))}
                  onReview={() => handleReviewKpi(kpi.id, "review")}
                  onReturn={() => handleReviewKpi(kpi.id, "return")}
                  isProcessing={isProcessing}
                  getUserName={getUserName}
                />
              ))}
              {(!kpis || kpis.length === 0) && (
                <p className="text-center text-slate-400 py-8">No KPIs found for this scorecard.</p>
              )}
            </div>
          </CardContent>
        </Card>

        {selectedScorecard.status === "Submitted" && (
          <Card className="border-amber-200 bg-amber-50/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ClipboardCheck className="w-5 h-5 text-amber-600" />
                Scorecard Review Decision
              </CardTitle>
              <CardDescription>
                {allKpisReviewed
                  ? "All KPIs have been reviewed. You may now mark the scorecard as Reviewed."
                  : `${submittedKpis.length} KPI(s) still pending review. Review all KPIs before marking the scorecard.`}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Review Comments (Optional)</Label>
                <Textarea
                  value={reviewComments}
                  onChange={e => setReviewComments(e.target.value)}
                  placeholder="Add any overall review comments..."
                  rows={3}
                />
              </div>
              <div className="flex gap-3">
                <Button
                  onClick={handleReviewScorecard}
                  disabled={!allKpisReviewed || isProcessing}
                  className="bg-amber-600 hover:bg-amber-700"
                >
                  {isProcessing ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <CheckCircle2 className="w-4 h-4 mr-2" />}
                  Mark as Reviewed
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setShowReturnDialog(true)}
                  disabled={isProcessing}
                  className="border-red-300 text-red-600 hover:bg-red-50"
                >
                  <XCircle className="w-4 h-4 mr-2" /> Return to Draft
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        <Dialog open={showReturnDialog} onOpenChange={setShowReturnDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Return Scorecard to Draft</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Reason for Return *</Label>
                <Textarea
                  value={returnReason}
                  onChange={e => setReturnReason(e.target.value)}
                  placeholder="Explain what needs to be corrected..."
                  rows={4}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowReturnDialog(false)}>Cancel</Button>
              <Button
                onClick={handleReturnScorecard}
                disabled={!returnReason.trim() || isProcessing}
                className="bg-red-600 hover:bg-red-700"
              >
                {isProcessing ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <XCircle className="w-4 h-4 mr-2" />}
                Return to Draft
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Review SDBIP — PMS Manager</h1>
        <p className="text-slate-500 mt-1">Review submitted scorecards and their KPIs before forwarding for Director approval.</p>
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
            <FileSearch className="w-12 h-12 text-slate-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-slate-600">No Scorecards Pending Review</h3>
            <p className="text-slate-400 mt-1">All submitted scorecards have been reviewed for this cycle.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {scorecards.map(sc => (
            <Card key={sc.id} className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => setSelectedScorecardId(sc.id)}>
              <CardContent className="py-4 flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-slate-800">{sc.name}</h3>
                  <p className="text-sm text-slate-500">
                    Created by {getUserName(sc.createdById)} · {new Date(sc.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <Badge className={STATUS_COLORS[sc.status]}>{sc.status}</Badge>
                  <Button size="sm" variant="outline">
                    <Eye className="w-4 h-4 mr-1" /> Review
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

function KpiReviewCard({
  kpi,
  comment,
  onCommentChange,
  onReview,
  onReturn,
  isProcessing,
  getUserName,
}: {
  kpi: any;
  comment: string;
  onCommentChange: (v: string) => void;
  onReview: () => void;
  onReturn: () => void;
  isProcessing: boolean;
  getUserName: (id: number | null) => string;
}) {
  const [expanded, setExpanded] = useState(false);
  const targetsQuery = useListQuarterTargets(expanded ? kpi.id : 0);
  const targets = expanded ? targetsQuery.data : undefined;

  return (
    <div className="border rounded-lg p-4 space-y-3">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <span className="font-mono text-sm text-slate-500">{kpi.kpiNumber}</span>
            <Badge className={STATUS_COLORS[kpi.status]}>{kpi.status}</Badge>
          </div>
          <p className="font-medium text-slate-800 mt-1">{kpi.description}</p>
          <div className="flex gap-6 mt-2 text-sm text-slate-500">
            <span>Weight: {kpi.weighting}%</span>
            <span>Annual Target: {kpi.annualTarget}</span>
            {kpi.baseline && <span>Baseline: {kpi.baseline}</span>}
            <span>Responsible: {getUserName(kpi.responsiblePostId)}</span>
          </div>
          {kpi.strategicObjective && (
            <p className="text-xs text-slate-400 mt-1">Strategic Objective: {kpi.strategicObjective}</p>
          )}
        </div>
        <Button variant="ghost" size="sm" onClick={() => setExpanded(!expanded)}>
          {expanded ? "Collapse" : "Expand"}
        </Button>
      </div>

      {expanded && (
        <div className="space-y-3 pt-2 border-t">
          {targets && targets.length > 0 && (
            <div className="grid grid-cols-4 gap-2">
              {[1, 2, 3, 4].map(q => {
                const t = targets.find((t: any) => t.quarter === q);
                return (
                  <div key={q} className="bg-slate-50 rounded p-2 text-sm">
                    <div className="font-medium text-slate-600">Q{q}</div>
                    <div className="text-slate-800">{t?.targetValue ?? "—"}</div>
                    {t?.budgetValue != null && <div className="text-xs text-slate-400">Budget: R{t.budgetValue.toLocaleString()}</div>}
                  </div>
                );
              })}
            </div>
          )}

          {kpi.status === "Submitted" && (
            <div className="space-y-2">
              <Textarea
                value={comment}
                onChange={e => onCommentChange(e.target.value)}
                placeholder="Review comments for this KPI..."
                rows={2}
                className="text-sm"
              />
              <div className="flex gap-2">
                <Button size="sm" onClick={onReview} disabled={isProcessing} className="bg-amber-600 hover:bg-amber-700">
                  <CheckCircle2 className="w-3 h-3 mr-1" /> Mark Reviewed
                </Button>
                <Button size="sm" variant="outline" onClick={onReturn} disabled={isProcessing} className="border-red-300 text-red-600 hover:bg-red-50">
                  <XCircle className="w-3 h-3 mr-1" /> Return
                </Button>
              </div>
            </div>
          )}

          {kpi.status === "Reviewed" && (
            <div className="flex items-center gap-2 text-sm text-amber-600">
              <CheckCircle2 className="w-4 h-4" /> Reviewed
            </div>
          )}

          {kpi.status === "Approved" && (
            <div className="flex items-center gap-2 text-sm text-green-600">
              <CheckCircle2 className="w-4 h-4" /> Approved
            </div>
          )}
        </div>
      )}
    </div>
  );
}
