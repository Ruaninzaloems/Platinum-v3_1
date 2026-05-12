import { useState } from "react";
import { useListModerations, useCreateModeration } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/core/hooks/use-toast";
import { Scale } from "lucide-react";

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

const OUTCOME_COLORS: Record<string, string> = {
  Confirmed: "bg-green-100 text-green-700",
  Adjusted: "bg-amber-100 text-amber-700",
  Rejected: "bg-red-100 text-red-700",
};

export default function ModerationPanel() {
  const { toast } = useToast();
  const [quarter, setQuarter] = useState<number>(1);
  const [showModerate, setShowModerate] = useState(false);
  const [form, setForm] = useState({ actualId: 0, kpiId: 0, quarter: 1, outcome: "Confirmed", scoreAdjustmentReason: "", adjustedScore: 0, notes: "" });

  const { data: moderations, refetch } = useListModerations({ quarter });
  const createModeration = useCreateModeration();

  async function handleSubmit() {
    try {
      await createModeration.mutateAsync({
        data: {
          actualId: form.actualId,
          kpiId: form.kpiId,
          quarter: form.quarter,
          outcome: form.outcome,
          scoreAdjustmentReason: form.scoreAdjustmentReason || undefined,
          adjustedScore: form.adjustedScore || undefined,
          notes: form.notes || undefined,
        }
      });
      setShowModerate(false);
      refetch();
      toast({ title: "Moderation recorded" });
    } catch (e) {
      toast({ title: getErrorMessage(e), variant: "destructive" });
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Moderation Panel</h1>
          <p className="text-sm text-slate-500 mt-1">Record moderation outcomes and score adjustments</p>
        </div>
        <div className="flex items-center gap-3">
          <Select value={quarter.toString()} onValueChange={v => setQuarter(Number(v))}>
            <SelectTrigger className="w-[120px]"><SelectValue /></SelectTrigger>
            <SelectContent>{[1,2,3,4].map(q => <SelectItem key={q} value={q.toString()}>Q{q}</SelectItem>)}</SelectContent>
          </Select>
          <Button onClick={() => setShowModerate(true)} className="bg-[#0f2b46]"><Scale className="w-4 h-4 mr-1" />New Moderation</Button>
        </div>
      </div>

      <div className="space-y-3">
        {moderations?.map(m => (
          <Card key={m.id}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <Scale className="w-4 h-4 text-slate-400" />
                    <span className="font-medium text-sm">KPI #{m.kpiId} — Actual #{m.actualId}</span>
                    <Badge className={OUTCOME_COLORS[m.outcome] || "bg-gray-100"}>{m.outcome}</Badge>
                  </div>
                  {m.scoreAdjustmentReason && <p className="text-sm text-amber-600 mt-1">Adjustment: {m.scoreAdjustmentReason}</p>}
                  {m.adjustedScore != null && <p className="text-xs text-slate-500 mt-1">Adjusted Score: {m.adjustedScore}</p>}
                  {m.notes && <p className="text-sm text-slate-500 mt-1">{m.notes}</p>}
                </div>
                <span className="text-xs text-slate-400">{m.createdAt ? new Date(m.createdAt).toLocaleDateString() : ""}</span>
              </div>
            </CardContent>
          </Card>
        ))}
        {moderations?.length === 0 && <p className="text-center text-slate-400 py-12">No moderation outcomes for this quarter.</p>}
      </div>

      <Dialog open={showModerate} onOpenChange={setShowModerate}>
        <DialogContent>
          <DialogHeader><DialogTitle>Record Moderation Outcome</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Actual ID</Label><Input type="number" value={form.actualId} onChange={e => setForm(p => ({ ...p, actualId: Number(e.target.value) }))} /></div>
              <div><Label>KPI ID</Label><Input type="number" value={form.kpiId} onChange={e => setForm(p => ({ ...p, kpiId: Number(e.target.value) }))} /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Quarter</Label>
                <Select value={form.quarter.toString()} onValueChange={v => setForm(p => ({ ...p, quarter: Number(v) }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{[1,2,3,4].map(q => <SelectItem key={q} value={q.toString()}>Q{q}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <Label>Outcome</Label>
                <Select value={form.outcome} onValueChange={v => setForm(p => ({ ...p, outcome: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Confirmed">Confirmed</SelectItem>
                    <SelectItem value="Adjusted">Adjusted</SelectItem>
                    <SelectItem value="Rejected">Rejected</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            {form.outcome === "Adjusted" && (
              <>
                <div><Label>Score Adjustment Reason</Label><Textarea value={form.scoreAdjustmentReason} onChange={e => setForm(p => ({ ...p, scoreAdjustmentReason: e.target.value }))} /></div>
                <div><Label>Adjusted Score</Label><Input type="number" step="0.1" value={form.adjustedScore} onChange={e => setForm(p => ({ ...p, adjustedScore: Number(e.target.value) }))} /></div>
              </>
            )}
            <div><Label>Notes</Label><Textarea value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))} /></div>
          </div>
          <DialogFooter><Button onClick={handleSubmit}>Submit</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
