import { useState } from "react";
import {
  useListAllActuals, useTransitionKpiActual,
  useListScorecardKpis, useListKpiEvidence,
  useListCycles, useListScorecards, useListUsers,
} from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { useToast } from "@/core/hooks/use-toast";
import {
  CheckCircle2, AlertTriangle, XCircle, Clock,
  File, ArrowLeft, Send, Eye, Loader2,
} from "lucide-react";

const STATUS_COLORS: Record<string, string> = {
  Draft: "bg-gray-100 text-gray-700",
  Submitted: "bg-blue-100 text-blue-700",
  "In Review": "bg-amber-100 text-amber-700",
  Returned: "bg-red-100 text-red-700",
  Approved: "bg-green-100 text-green-700",
};

const VERIFICATION_COLORS: Record<string, string> = {
  Pending: "bg-amber-100 text-amber-700",
  Verified: "bg-green-100 text-green-700",
  Rejected: "bg-red-100 text-red-700",
};

const REVIEW_LEVEL_LABELS: Record<string, string> = {
  line_manager: "Line Manager (Division)",
  director: "Director",
  pms_manager: "PMS Manager",
  pms_director: "PMS Director",
  internal_audit: "Internal Audit",
};

const REVIEW_LEVEL_NEXT: Record<string, string> = {
  line_manager: "Director",
  director: "PMS Manager",
  pms_manager: "PMS Director",
  pms_director: "Internal Audit",
  internal_audit: "Final Approval",
};

export default function ActualsReview({
  reviewLevel, title, description,
}: {
  reviewLevel: string; title: string; description: string;
}) {
  const { toast } = useToast();
  const { data: allActuals, refetch: refetchActuals } = useListAllActuals({ status: "In Review", reviewLevel });
  const { data: users } = useListUsers();
  const transitionActual = useTransitionKpiActual();
  const [selectedActualId, setSelectedActualId] = useState<number | null>(null);
  const [showReturn, setShowReturn] = useState<number | null>(null);
  const [returnComments, setReturnComments] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

  const getUserName = (id: number | null | undefined) => {
    if (!id) return "—";
    const u = users?.find(u => u.id === id);
    return u ? u.displayName : `User #${id}`;
  };

  const handleApprove = async (actualId: number) => {
    setIsProcessing(true);
    try {
      await transitionActual.mutateAsync({ id: actualId, data: { action: "approve", comments: `Approved at ${title} level` } });
      const nextLevel = REVIEW_LEVEL_NEXT[reviewLevel];
      toast({ title: "Actual approved", description: nextLevel === "Final Approval" ? "All review levels complete — actual is now approved." : `Forwarded to ${nextLevel} for review.` });
      refetchActuals();
    } catch (e: any) {
      toast({ title: "Error", description: e?.response?.data?.error || "Failed to approve", variant: "destructive" });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReturn = async () => {
    if (!showReturn || !returnComments.trim()) return;
    setIsProcessing(true);
    try {
      await transitionActual.mutateAsync({ id: showReturn, data: { action: "return", comments: returnComments } });
      toast({ title: "Actual returned to submitter" });
      setShowReturn(null);
      setReturnComments("");
      refetchActuals();
    } catch (e: any) {
      toast({ title: "Error", description: e?.response?.data?.error || "Failed to return", variant: "destructive" });
    } finally {
      setIsProcessing(false);
    }
  };

  const actuals = allActuals ?? [];

  if (selectedActualId) {
    const actual = actuals.find(a => a.id === selectedActualId);
    if (actual) {
      return (
        <ActualDetailView
          actual={actual}
          reviewLevel={reviewLevel}
          title={title}
          getUserName={getUserName}
          onBack={() => setSelectedActualId(null)}
          onApprove={() => handleApprove(actual.id)}
          onReturn={() => setShowReturn(actual.id)}
          isProcessing={isProcessing}
        />
      );
    }
  }

  return (
    <div className="space-y-6 animate-in fade-in-50 duration-300">
      <div>
        <h2 className="text-2xl font-bold text-slate-800">{title}</h2>
        <p className="text-slate-500">{description}</p>
      </div>

      {actuals.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center">
            <CheckCircle2 className="w-12 h-12 text-slate-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-slate-600">No Actuals Pending Review</h3>
            <p className="text-slate-400 mt-1">Items requiring your review will appear here.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          <div className="flex items-center gap-3 text-sm text-slate-500">
            <Badge className="bg-amber-100 text-amber-700">{actuals.length} pending</Badge>
            <span>at {REVIEW_LEVEL_LABELS[reviewLevel]} level</span>
          </div>
          {actuals.map(actual => (
            <Card key={actual.id} className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setSelectedActualId(actual.id)}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-3 mb-2">
                      <Badge variant="outline" className="text-sm font-semibold">Q{actual.quarter}</Badge>
                      <Badge className={STATUS_COLORS[actual.status]}>{actual.status}</Badge>
                      {actual.isAchieved ? (
                        <Badge className="bg-green-100 text-green-700"><CheckCircle2 className="w-3 h-3 mr-1" />Achieved</Badge>
                      ) : (
                        <Badge className="bg-red-100 text-red-700"><AlertTriangle className="w-3 h-3 mr-1" />Not Achieved</Badge>
                      )}
                      {actual.isLateSubmission && <Badge className="bg-amber-100 text-amber-700">Late</Badge>}
                    </div>
                    <p className="font-medium text-slate-800">Actual: {actual.actualValue}</p>
                    <p className="text-sm text-slate-500 mt-1">
                      KPI #{actual.kpiId} · Submitted by {getUserName(actual.submittedById)}
                    </p>
                    {actual.commentary && <p className="text-sm text-slate-600 mt-1 line-clamp-2">{actual.commentary}</p>}
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" onClick={(e) => { e.stopPropagation(); setSelectedActualId(actual.id); }}>
                      <Eye className="w-4 h-4 mr-1" /> Review
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={showReturn !== null} onOpenChange={v => { if (!v) { setShowReturn(null); setReturnComments(""); } }}>
        <DialogContent>
          <DialogHeader><DialogTitle>Return Actual</DialogTitle></DialogHeader>
          <div>
            <Label>Reason for Return *</Label>
            <Textarea value={returnComments} onChange={e => setReturnComments(e.target.value)} placeholder="Explain why this actual is being returned..." rows={3} className="mt-1" />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setShowReturn(null); setReturnComments(""); }}>Cancel</Button>
            <Button onClick={handleReturn} disabled={!returnComments.trim() || isProcessing} className="bg-red-600 hover:bg-red-700">
              {isProcessing ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <XCircle className="w-4 h-4 mr-1" />}
              Return
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function ActualDetailView({
  actual, reviewLevel, title, getUserName, onBack, onApprove, onReturn, isProcessing,
}: {
  actual: any; reviewLevel: string; title: string;
  getUserName: (id: number | null | undefined) => string;
  onBack: () => void; onApprove: () => void; onReturn: () => void;
  isProcessing: boolean;
}) {
  const evidenceQuery = useListKpiEvidence(actual.kpiId, { quarter: actual.quarter });
  const evidence = evidenceQuery.data;
  const nextLevel = REVIEW_LEVEL_NEXT[reviewLevel];

  return (
    <div className="space-y-6 animate-in fade-in-50 duration-300">
      <div className="flex items-center justify-between pb-4 border-b">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={onBack}>
            <ArrowLeft className="w-4 h-4 mr-1" /> Back to Queue
          </Button>
          <div>
            <h2 className="text-xl font-bold text-slate-800">{title} — Q{actual.quarter}</h2>
            <p className="text-sm text-slate-500">KPI #{actual.kpiId} · Submitted by {getUserName(actual.submittedById)}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={onReturn} disabled={isProcessing} className="text-red-600 border-red-300 hover:bg-red-50">
            <XCircle className="w-4 h-4 mr-1" /> Return
          </Button>
          <Button onClick={onApprove} disabled={isProcessing} className="bg-green-600 hover:bg-green-700">
            {isProcessing ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <CheckCircle2 className="w-4 h-4 mr-1" />}
            Approve {nextLevel !== "Final Approval" ? `→ ${nextLevel}` : "(Final)"}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-6">
        <Card>
          <CardHeader><CardTitle className="text-base">Actual Details</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between"><span className="text-slate-500">Actual Value</span><span className="font-medium text-slate-800">{actual.actualValue}</span></div>
              <div className="flex justify-between"><span className="text-slate-500">Status</span>
                <Badge className={actual.isAchieved ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}>
                  {actual.isAchieved ? "Achieved" : "Not Achieved"}
                </Badge>
              </div>
              {actual.isOnHold && <div className="flex justify-between"><span className="text-slate-500">On Hold</span><span className="font-medium text-purple-700">Yes</span></div>}
              {actual.isLateSubmission && <div className="flex justify-between"><span className="text-slate-500">Late Submission</span><span className="font-medium text-amber-700">Yes</span></div>}
              <div className="flex justify-between"><span className="text-slate-500">Submitted</span><span>{new Date(actual.submittedAt).toLocaleDateString()}</span></div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base">Review Progress</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-2">
              {["line_manager", "director", "pms_manager", "pms_director", "internal_audit"].map((level, idx) => {
                const isCurrent = actual.reviewLevel === level;
                const isPast = ["line_manager", "director", "pms_manager", "pms_director", "internal_audit"].indexOf(actual.reviewLevel) > idx;
                return (
                  <div key={level} className={`flex items-center gap-3 p-2 rounded text-sm ${isCurrent ? "bg-amber-50 border border-amber-200" : isPast ? "bg-green-50" : "bg-slate-50"}`}>
                    {isPast ? <CheckCircle2 className="w-4 h-4 text-green-600" /> : isCurrent ? <Clock className="w-4 h-4 text-amber-600" /> : <div className="w-4 h-4 rounded-full border-2 border-slate-300" />}
                    <span className={`${isCurrent ? "font-medium text-amber-800" : isPast ? "text-green-700" : "text-slate-400"}`}>
                      {REVIEW_LEVEL_LABELS[level]}
                    </span>
                    {isCurrent && <Badge className="bg-amber-100 text-amber-700 text-xs ml-auto">Current</Badge>}
                    {isPast && <Badge className="bg-green-100 text-green-700 text-xs ml-auto">Done</Badge>}
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>

      {actual.commentary && (
        <Card>
          <CardHeader><CardTitle className="text-base">Commentary</CardTitle></CardHeader>
          <CardContent><p className="text-sm text-slate-700">{actual.commentary}</p></CardContent>
        </Card>
      )}

      {(actual.challengeNarrative || actual.underperformanceReason || actual.overperformanceReason || actual.correctiveAction || actual.budgetImplication) && (
        <Card>
          <CardHeader><CardTitle className="text-base">Analysis & Narrative</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-3 text-sm">
              {actual.challengeNarrative && <div><Label className="text-slate-500">Challenge Narrative</Label><p className="text-slate-700 mt-1">{actual.challengeNarrative}</p></div>}
              {actual.underperformanceReason && <div><Label className="text-slate-500">Underperformance Reason</Label><p className="text-slate-700 mt-1">{actual.underperformanceReason}</p></div>}
              {actual.overperformanceReason && <div><Label className="text-slate-500">Overperformance Reason</Label><p className="text-slate-700 mt-1">{actual.overperformanceReason}</p></div>}
              {actual.correctiveAction && <div><Label className="text-slate-500">Corrective Action</Label><p className="text-slate-700 mt-1">{actual.correctiveAction}</p></div>}
              {actual.budgetImplication && <div><Label className="text-slate-500">Budget Implication</Label><p className="text-slate-700 mt-1">{actual.budgetImplication}</p></div>}
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2"><File className="w-4 h-4" /> Evidence Documents</CardTitle>
          <CardDescription>{evidence?.length ?? 0} document(s) attached for Q{actual.quarter}</CardDescription>
        </CardHeader>
        <CardContent>
          {evidence && evidence.length > 0 ? (
            <div className="space-y-2">
              {evidence.map(doc => (
                <div key={doc.id} className="flex items-center justify-between p-3 bg-slate-50 rounded border">
                  <div className="flex items-center gap-3">
                    <File className="w-5 h-5 text-slate-400" />
                    <div>
                      <p className="text-sm font-medium text-slate-700">{doc.fileName}</p>
                      <p className="text-xs text-slate-500">
                        {doc.documentType && <span>{doc.documentType} · </span>}
                        {doc.description}
                      </p>
                    </div>
                  </div>
                  <Badge className={VERIFICATION_COLORS[doc.verificationStatus]}>{doc.verificationStatus}</Badge>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-slate-400 italic text-center py-4">No evidence documents uploaded</p>
          )}
        </CardContent>
      </Card>

      {actual.onHoldReason && (
        <Card className="border-purple-200 bg-purple-50/50">
          <CardContent className="py-3">
            <p className="text-sm"><span className="font-medium text-purple-700">On Hold Reason:</span> {actual.onHoldReason}</p>
          </CardContent>
        </Card>
      )}

      {actual.lateOverrideReason && (
        <Card className="border-amber-200 bg-amber-50/50">
          <CardContent className="py-3">
            <p className="text-sm"><span className="font-medium text-amber-700">Late Override Reason:</span> {actual.lateOverrideReason}</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
