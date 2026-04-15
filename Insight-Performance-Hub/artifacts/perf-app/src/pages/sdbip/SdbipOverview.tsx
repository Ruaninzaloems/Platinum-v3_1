import { useState } from "react";
import {
  useListSdbipItems, useCreateSdbipItem, useUpdateSdbipItem,
  useTransitionSdbipItem, useReviseSdbipItem, useListSdbipRevisions,
  useGenerateSdbipFromKpis
} from "@workspace/api-client-react";
import { useListCycles, useListScorecards } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Plus, Zap, History, ArrowRight } from "lucide-react";

const STATUS_COLORS: Record<string, string> = {
  Draft: "bg-gray-100 text-gray-700",
  Submitted: "bg-blue-100 text-blue-700",
  "Internal Review": "bg-purple-100 text-purple-700",
  "Approved Baseline": "bg-green-100 text-green-700",
  "In-Year Monitoring": "bg-teal-100 text-teal-700",
  Adjustment: "bg-amber-100 text-amber-700",
  "Final Approved Revision": "bg-emerald-100 text-emerald-700",
};

export default function SdbipOverview() {
  const { toast } = useToast();
  const { data: cycles } = useListCycles();
  const [selectedCycleId, setSelectedCycleId] = useState<number | undefined>();
  const [showNew, setShowNew] = useState(false);
  const [showEdit, setShowEdit] = useState<number | null>(null);
  const [showRevise, setShowRevise] = useState<number | null>(null);
  const [showRevisions, setShowRevisions] = useState<number | null>(null);
  const [newDesc, setNewDesc] = useState("");
  const [editForm, setEditForm] = useState({ description: "", q1Target: "", q2Target: "", q3Target: "", q4Target: "" });
  const [reviseForm, setReviseForm] = useState({ reason: "", q1Target: "", q2Target: "", q3Target: "", q4Target: "" });

  const effectiveCycleId = selectedCycleId || cycles?.[0]?.id;
  const { data: items, refetch } = useListSdbipItems({ cycleId: effectiveCycleId });
  const { data: scorecards } = useListScorecards({ cycleId: effectiveCycleId });
  const revisionsQuery = useListSdbipRevisions(showRevisions ?? 0);
  const revisions = showRevisions ? revisionsQuery.data : undefined;

  const createItem = useCreateSdbipItem();
  const updateItem = useUpdateSdbipItem();
  const transitionItem = useTransitionSdbipItem();
  const reviseItem = useReviseSdbipItem();
  const generateFromKpis = useGenerateSdbipFromKpis();

  async function handleCreate() {
    if (!effectiveCycleId || !newDesc.trim()) return;
    try {
      await createItem.mutateAsync({ data: { cycleId: effectiveCycleId, description: newDesc } });
      setNewDesc("");
      setShowNew(false);
      refetch();
      toast({ title: "SDBIP item created" });
    } catch { toast({ title: "Error", variant: "destructive" }); }
  }

  function openEdit(item: { id: number; description: string; q1Target?: string | null; q2Target?: string | null; q3Target?: string | null; q4Target?: string | null }) {
    setEditForm({
      description: item.description,
      q1Target: item.q1Target || "",
      q2Target: item.q2Target || "",
      q3Target: item.q3Target || "",
      q4Target: item.q4Target || "",
    });
    setShowEdit(item.id);
  }

  async function handleUpdate() {
    if (!showEdit || !editForm.description.trim()) return;
    try {
      await updateItem.mutateAsync({
        id: showEdit,
        data: {
          description: editForm.description,
          q1Target: editForm.q1Target || undefined,
          q2Target: editForm.q2Target || undefined,
          q3Target: editForm.q3Target || undefined,
          q4Target: editForm.q4Target || undefined,
        }
      });
      setShowEdit(null);
      refetch();
      toast({ title: "SDBIP item updated" });
    } catch { toast({ title: "Error updating", variant: "destructive" }); }
  }

  async function handleTransition(id: number, action: string) {
    try {
      await transitionItem.mutateAsync({ id, data: { action } });
      refetch();
      toast({ title: `SDBIP ${action}` });
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Error";
      toast({ title: msg, variant: "destructive" });
    }
  }

  async function handleRevise() {
    if (!showRevise || !reviseForm.reason.trim()) return;
    try {
      await reviseItem.mutateAsync({
        id: showRevise,
        data: {
          reason: reviseForm.reason,
          q1Target: reviseForm.q1Target || undefined,
          q2Target: reviseForm.q2Target || undefined,
          q3Target: reviseForm.q3Target || undefined,
          q4Target: reviseForm.q4Target || undefined,
        }
      });
      setShowRevise(null);
      setReviseForm({ reason: "", q1Target: "", q2Target: "", q3Target: "", q4Target: "" });
      refetch();
      toast({ title: "SDBIP item revised" });
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Error";
      toast({ title: msg, variant: "destructive" });
    }
  }

  async function handleGenerate(scorecardId: number) {
    try {
      const result = await generateFromKpis.mutateAsync({ data: { scorecardId } });
      refetch();
      toast({ title: `${(result as unknown[]).length} SDBIP items generated` });
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Error";
      toast({ title: msg, variant: "destructive" });
    }
  }

  return (
    <div className="space-y-6 animate-in fade-in-50 duration-300">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">SDBIP Management</h2>
          <p className="text-slate-500">Service Delivery and Budget Implementation Plan</p>
        </div>
        <div className="flex gap-3 items-center">
          {cycles && cycles.length > 0 && (
            <Select value={String(effectiveCycleId)} onValueChange={v => setSelectedCycleId(Number(v))}>
              <SelectTrigger className="w-48"><SelectValue /></SelectTrigger>
              <SelectContent>
                {cycles.map(c => <SelectItem key={c.id} value={String(c.id)}>{c.financialYearLabel}</SelectItem>)}
              </SelectContent>
            </Select>
          )}
          <Button onClick={() => setShowNew(true)}><Plus className="w-4 h-4 mr-1" /> Add Item</Button>
        </div>
      </div>

      {scorecards && scorecards.length > 0 && (
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="p-4">
            <p className="text-sm font-medium text-blue-700 mb-2">Generate SDBIP from approved scorecards:</p>
            <div className="flex gap-2 flex-wrap">
              {scorecards.filter(s => s.status === "Approved").map(sc => (
                <Button key={sc.id} variant="outline" size="sm" onClick={() => handleGenerate(sc.id)}>
                  <Zap className="w-4 h-4 mr-1" /> {sc.name}
                </Button>
              ))}
              {scorecards.filter(s => s.status === "Approved").length === 0 && (
                <p className="text-xs text-blue-500">No approved scorecards yet</p>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-4 gap-3 text-center">
        {["Draft", "Approved Baseline", "In-Year Monitoring", "Final Approved Revision"].map(s => (
          <Card key={s} className="p-3">
            <p className="text-2xl font-bold text-slate-800">{items?.filter(i => i.status === s).length ?? 0}</p>
            <p className="text-xs text-slate-500">{s}</p>
          </Card>
        ))}
      </div>

      <div className="space-y-3">
        {items?.map(item => (
          <Card key={item.id} className="hover:shadow-md transition-shadow">
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <Badge className={STATUS_COLORS[item.status] || "bg-gray-100"}>{item.status}</Badge>
                    {item.kpiId && <Badge variant="outline">KPI #{item.kpiId}</Badge>}
                  </div>
                  <p className="font-semibold text-slate-800">{item.description}</p>
                  <div className="grid grid-cols-4 gap-2 mt-2 text-xs text-slate-500">
                    <span>Q1: {item.q1Target || "-"}</span>
                    <span>Q2: {item.q2Target || "-"}</span>
                    <span>Q3: {item.q3Target || "-"}</span>
                    <span>Q4: {item.q4Target || "-"}</span>
                  </div>
                </div>
                <div className="flex gap-1">
                  {item.status === "Draft" && (
                    <>
                      <Button variant="ghost" size="sm" onClick={() => openEdit(item)}>Edit</Button>
                      <Button variant="ghost" size="sm" onClick={() => handleTransition(item.id, "submit")}>Submit</Button>
                    </>
                  )}
                  {item.status === "Submitted" && (
                    <Button variant="ghost" size="sm" onClick={() => handleTransition(item.id, "review")}>Review</Button>
                  )}
                  {item.status === "Internal Review" && (
                    <Button variant="ghost" size="sm" onClick={() => handleTransition(item.id, "approve_baseline")}>Approve</Button>
                  )}
                  {item.status === "Approved Baseline" && (
                    <>
                      <Button variant="ghost" size="sm" onClick={() => handleTransition(item.id, "monitor")}>Monitor</Button>
                      <Button variant="ghost" size="sm" onClick={() => setShowRevise(item.id)}>Revise</Button>
                    </>
                  )}
                  {item.status === "In-Year Monitoring" && (
                    <Button variant="ghost" size="sm" onClick={() => setShowRevise(item.id)}>Revise</Button>
                  )}
                  {item.status === "Adjustment" && (
                    <Button variant="ghost" size="sm" onClick={() => handleTransition(item.id, "approve_revision")}>Approve Revision</Button>
                  )}
                  <Button variant="ghost" size="sm" onClick={() => setShowRevisions(item.id)}>
                    <History className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
        {(!items || items.length === 0) && (
          <Card className="border-dashed">
            <CardContent className="p-8 text-center text-slate-500">
              <p className="font-medium">No SDBIP items yet</p>
              <p className="text-sm">Create items manually or generate from approved scorecards</p>
            </CardContent>
          </Card>
        )}
      </div>

      <Dialog open={showNew} onOpenChange={setShowNew}>
        <DialogContent>
          <DialogHeader><DialogTitle>New SDBIP Item</DialogTitle></DialogHeader>
          <div><Label>Description</Label><Textarea value={newDesc} onChange={e => setNewDesc(e.target.value)} /></div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNew(false)}>Cancel</Button>
            <Button onClick={handleCreate} disabled={!newDesc.trim()}>Create</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!showRevise} onOpenChange={() => setShowRevise(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Revise SDBIP Item</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div><Label>Reason for revision *</Label><Textarea value={reviseForm.reason} onChange={e => setReviseForm(p => ({ ...p, reason: e.target.value }))} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Q1 Target</Label><Input value={reviseForm.q1Target} onChange={e => setReviseForm(p => ({ ...p, q1Target: e.target.value }))} /></div>
              <div><Label>Q2 Target</Label><Input value={reviseForm.q2Target} onChange={e => setReviseForm(p => ({ ...p, q2Target: e.target.value }))} /></div>
              <div><Label>Q3 Target</Label><Input value={reviseForm.q3Target} onChange={e => setReviseForm(p => ({ ...p, q3Target: e.target.value }))} /></div>
              <div><Label>Q4 Target</Label><Input value={reviseForm.q4Target} onChange={e => setReviseForm(p => ({ ...p, q4Target: e.target.value }))} /></div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRevise(null)}>Cancel</Button>
            <Button onClick={handleRevise} disabled={!reviseForm.reason.trim()}>Submit Revision</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!showRevisions} onOpenChange={() => setShowRevisions(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Revision History</DialogTitle></DialogHeader>
          {revisions && revisions.length > 0 ? (
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {revisions.map(rev => (
                <Card key={rev.id}>
                  <CardContent className="p-3 text-sm">
                    <div className="flex justify-between mb-1">
                      <Badge variant="outline">Revision #{rev.revisionNumber}</Badge>
                      <Badge className={STATUS_COLORS[rev.status] || "bg-gray-100"}>{rev.status}</Badge>
                    </div>
                    <p className="text-slate-700 mb-1">{rev.reason}</p>
                    <div className="grid grid-cols-4 gap-1 text-xs text-slate-500 mt-2">
                      <span>Q1: {rev.previousQ1Target} <ArrowRight className="w-3 h-3 inline" /> {rev.newQ1Target}</span>
                      <span>Q2: {rev.previousQ2Target} <ArrowRight className="w-3 h-3 inline" /> {rev.newQ2Target}</span>
                      <span>Q3: {rev.previousQ3Target} <ArrowRight className="w-3 h-3 inline" /> {rev.newQ3Target}</span>
                      <span>Q4: {rev.previousQ4Target} <ArrowRight className="w-3 h-3 inline" /> {rev.newQ4Target}</span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <p className="text-sm text-slate-500 text-center py-4">No revisions recorded</p>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={!!showEdit} onOpenChange={() => setShowEdit(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Edit SDBIP Item</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div><Label>Description *</Label><Textarea value={editForm.description} onChange={e => setEditForm(p => ({ ...p, description: e.target.value }))} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Q1 Target</Label><Input value={editForm.q1Target} onChange={e => setEditForm(p => ({ ...p, q1Target: e.target.value }))} /></div>
              <div><Label>Q2 Target</Label><Input value={editForm.q2Target} onChange={e => setEditForm(p => ({ ...p, q2Target: e.target.value }))} /></div>
              <div><Label>Q3 Target</Label><Input value={editForm.q3Target} onChange={e => setEditForm(p => ({ ...p, q3Target: e.target.value }))} /></div>
              <div><Label>Q4 Target</Label><Input value={editForm.q4Target} onChange={e => setEditForm(p => ({ ...p, q4Target: e.target.value }))} /></div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEdit(null)}>Cancel</Button>
            <Button onClick={handleUpdate} disabled={!editForm.description.trim()}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
