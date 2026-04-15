import { useState } from "react";
import { useListReviewerAssignments, useCreateReviewerAssignment, useListCycles } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Plus, UserCheck, History } from "lucide-react";

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

export default function ReviewerConfig() {
  const { toast } = useToast();
  const { data: cycles } = useListCycles();
  const [selectedCycleId, setSelectedCycleId] = useState<number | undefined>();
  const [showAssign, setShowAssign] = useState(false);
  const [form, setForm] = useState({ employeeId: 0, primaryReviewerId: 0, secondaryReviewerId: 0, changeReason: "" });

  const { data: assignments, refetch } = useListReviewerAssignments({ cycleId: selectedCycleId });
  const createAssignment = useCreateReviewerAssignment();

  const handleAssign = async () => {
    if (!selectedCycleId || !form.employeeId || !form.primaryReviewerId) return;
    try {
      await createAssignment.mutateAsync({
        data: {
          cycleId: selectedCycleId,
          employeeId: form.employeeId,
          primaryReviewerId: form.primaryReviewerId,
          secondaryReviewerId: form.secondaryReviewerId || undefined,
          changeReason: form.changeReason || undefined,
        },
      });
      toast({ title: "Reviewer assigned" });
      setShowAssign(false);
      setForm({ employeeId: 0, primaryReviewerId: 0, secondaryReviewerId: 0, changeReason: "" });
      refetch();
    } catch (e: unknown) {
      toast({ title: "Error", description: getErrorMessage(e), variant: "destructive" });
    }
  };

  const activeAssignments = assignments?.filter(a => a.isActive) || [];
  const historicAssignments = assignments?.filter(a => !a.isActive) || [];

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Reviewer Assignments</h1>
          <p className="text-slate-500 mt-1">Assign primary and secondary reviewers to employees</p>
        </div>
        <div className="flex gap-3">
          <Select value={selectedCycleId ? String(selectedCycleId) : "all"} onValueChange={v => setSelectedCycleId(v === "all" ? undefined : Number(v))}>
            <SelectTrigger className="w-[220px]"><SelectValue placeholder="All cycles" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Cycles</SelectItem>
              {cycles?.map(c => <SelectItem key={c.id} value={String(c.id)}>{c.financialYearLabel}</SelectItem>)}
            </SelectContent>
          </Select>
          <Button onClick={() => setShowAssign(true)}><Plus className="w-4 h-4 mr-1" /> Assign Reviewer</Button>
        </div>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-lg flex items-center gap-2"><UserCheck className="w-5 h-5" /> Active Assignments</CardTitle></CardHeader>
        <CardContent>
          {!activeAssignments.length ? (
            <p className="text-sm text-slate-400 text-center py-4">No active assignments</p>
          ) : (
            <table className="w-full text-sm">
              <thead><tr className="border-b text-slate-500"><th className="text-left py-2 px-2">Employee</th><th className="text-left py-2 px-2">Primary Reviewer</th><th className="text-left py-2 px-2">Secondary Reviewer</th><th className="text-right py-2 px-2">Version</th></tr></thead>
              <tbody>
                {activeAssignments.map(a => (
                  <tr key={a.id} className="border-b last:border-0 hover:bg-slate-50">
                    <td className="py-2 px-2">Employee #{a.employeeId}</td>
                    <td className="py-2 px-2">User #{a.primaryReviewerId}</td>
                    <td className="py-2 px-2">{a.secondaryReviewerId ? `User #${a.secondaryReviewerId}` : "—"}</td>
                    <td className="py-2 px-2 text-right"><Badge variant="outline">v{a.version}</Badge></td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>

      {historicAssignments.length > 0 && (
        <Card>
          <CardHeader><CardTitle className="text-lg flex items-center gap-2"><History className="w-5 h-5" /> Historical Assignments</CardTitle></CardHeader>
          <CardContent>
            <table className="w-full text-sm">
              <thead><tr className="border-b text-slate-500"><th className="text-left py-2 px-2">Employee</th><th className="text-left py-2 px-2">Primary Reviewer</th><th className="text-left py-2 px-2">Reason</th><th className="text-right py-2 px-2">Version</th></tr></thead>
              <tbody>
                {historicAssignments.map(a => (
                  <tr key={a.id} className="border-b last:border-0 hover:bg-slate-50 text-slate-400">
                    <td className="py-2 px-2">Employee #{a.employeeId}</td>
                    <td className="py-2 px-2">User #{a.primaryReviewerId}</td>
                    <td className="py-2 px-2">{a.changeReason || "—"}</td>
                    <td className="py-2 px-2 text-right">v{a.version}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      )}

      <Dialog open={showAssign} onOpenChange={setShowAssign}>
        <DialogContent>
          <DialogHeader><DialogTitle>Assign Reviewer</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div><Label>Employee ID</Label><Input type="number" value={form.employeeId || ""} onChange={e => setForm(p => ({ ...p, employeeId: Number(e.target.value) }))} /></div>
            <div><Label>Primary Reviewer ID</Label><Input type="number" value={form.primaryReviewerId || ""} onChange={e => setForm(p => ({ ...p, primaryReviewerId: Number(e.target.value) }))} /></div>
            <div><Label>Secondary Reviewer ID (optional)</Label><Input type="number" value={form.secondaryReviewerId || ""} onChange={e => setForm(p => ({ ...p, secondaryReviewerId: Number(e.target.value) }))} /></div>
            <div><Label>Change Reason</Label><Input value={form.changeReason} onChange={e => setForm(p => ({ ...p, changeReason: e.target.value }))} /></div>
          </div>
          <DialogFooter><Button onClick={handleAssign}>Assign</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
