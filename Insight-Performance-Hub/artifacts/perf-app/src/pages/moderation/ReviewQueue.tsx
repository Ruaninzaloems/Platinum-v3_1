import { useState } from "react";
import type { CreateReviewInputAction } from "@workspace/api-client-react";
import { useListReviews, useCreateReview } from "@workspace/api-client-react";
import { useListCycles } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Check, RotateCcw, MessageSquare } from "lucide-react";

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

const ACTION_COLORS: Record<string, string> = {
  approve: "bg-green-100 text-green-700",
  return: "bg-red-100 text-red-700",
  comment: "bg-blue-100 text-blue-700",
};

export default function ReviewQueue() {
  const { toast } = useToast();
  const [quarter, setQuarter] = useState<number>(1);
  const [showReview, setShowReview] = useState(false);
  const [reviewForm, setReviewForm] = useState({ actualId: 0, kpiId: 0, quarter: 1, action: "approve" as string, comments: "", returnReason: "", assessmentRating: 0 });

  const { data: reviews, refetch } = useListReviews({ quarter });
  const createReview = useCreateReview();

  async function handleSubmitReview() {
    try {
      if (reviewForm.action === "return" && !reviewForm.returnReason) {
        toast({ title: "Return reason is mandatory", variant: "destructive" });
        return;
      }
      await createReview.mutateAsync({
        data: {
          actualId: reviewForm.actualId,
          kpiId: reviewForm.kpiId,
          quarter: reviewForm.quarter,
          action: reviewForm.action as CreateReviewInputAction,
          comments: reviewForm.comments || undefined,
          returnReason: reviewForm.returnReason || undefined,
          assessmentRating: reviewForm.assessmentRating || undefined,
        }
      });
      setShowReview(false);
      refetch();
      toast({ title: "Review submitted" });
    } catch (e) {
      toast({ title: getErrorMessage(e), variant: "destructive" });
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Review Queue</h1>
          <p className="text-sm text-slate-500 mt-1">Review and assess KPI submissions</p>
        </div>
        <div className="flex items-center gap-3">
          <Select value={quarter.toString()} onValueChange={v => setQuarter(Number(v))}>
            <SelectTrigger className="w-[120px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              {[1,2,3,4].map(q => <SelectItem key={q} value={q.toString()}>Q{q}</SelectItem>)}
            </SelectContent>
          </Select>
          <Button onClick={() => setShowReview(true)} className="bg-[#0f2b46]">New Review</Button>
        </div>
      </div>

      <div className="space-y-3">
        {reviews?.map(r => (
          <Card key={r.id}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    {r.action === "approve" && <Check className="w-4 h-4 text-green-600" />}
                    {r.action === "return" && <RotateCcw className="w-4 h-4 text-red-600" />}
                    {r.action === "comment" && <MessageSquare className="w-4 h-4 text-blue-600" />}
                    <span className="font-medium text-sm">KPI #{r.kpiId} — Actual #{r.actualId}</span>
                    <Badge className={ACTION_COLORS[r.action] || "bg-gray-100"}>{r.action}</Badge>
                  </div>
                  {r.comments && <p className="text-sm text-slate-500 mt-1">{r.comments}</p>}
                  {r.returnReason && <p className="text-sm text-red-500 mt-1">Return reason: {r.returnReason}</p>}
                  {r.assessmentRating != null && <p className="text-xs text-slate-400 mt-1">Rating: {r.assessmentRating}</p>}
                </div>
                <span className="text-xs text-slate-400">{r.createdAt ? new Date(r.createdAt).toLocaleDateString() : ""}</span>
              </div>
            </CardContent>
          </Card>
        ))}
        {reviews?.length === 0 && <p className="text-center text-slate-400 py-12">No reviews for this quarter yet.</p>}
      </div>

      <Dialog open={showReview} onOpenChange={setShowReview}>
        <DialogContent>
          <DialogHeader><DialogTitle>Submit Review</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Actual ID</Label><Input type="number" value={reviewForm.actualId} onChange={e => setReviewForm(p => ({ ...p, actualId: Number(e.target.value) }))} /></div>
              <div><Label>KPI ID</Label><Input type="number" value={reviewForm.kpiId} onChange={e => setReviewForm(p => ({ ...p, kpiId: Number(e.target.value) }))} /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Quarter</Label>
                <Select value={reviewForm.quarter.toString()} onValueChange={v => setReviewForm(p => ({ ...p, quarter: Number(v) }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{[1,2,3,4].map(q => <SelectItem key={q} value={q.toString()}>Q{q}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <Label>Action</Label>
                <Select value={reviewForm.action} onValueChange={v => setReviewForm(p => ({ ...p, action: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="approve">Approve</SelectItem>
                    <SelectItem value="return">Return</SelectItem>
                    <SelectItem value="comment">Comment</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div><Label>Comments</Label><Textarea value={reviewForm.comments} onChange={e => setReviewForm(p => ({ ...p, comments: e.target.value }))} /></div>
            {reviewForm.action === "return" && (
              <div><Label>Return Reason (Required)</Label><Textarea value={reviewForm.returnReason} onChange={e => setReviewForm(p => ({ ...p, returnReason: e.target.value }))} /></div>
            )}
            <div><Label>Assessment Rating</Label><Input type="number" step="0.1" value={reviewForm.assessmentRating} onChange={e => setReviewForm(p => ({ ...p, assessmentRating: Number(e.target.value) }))} /></div>
          </div>
          <DialogFooter><Button onClick={handleSubmitReview}>Submit Review</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
