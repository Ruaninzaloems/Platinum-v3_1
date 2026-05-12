import { useState } from "react";
import { useListSubmissionDeadlines, useCreateSubmissionDeadline, useUpdateSubmissionDeadline, useListCycles, getListSubmissionDeadlinesQueryKey } from "@workspace/api-client-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { StatusBadge } from "@/components/ui/status-badge";
import { Plus, Pencil, Loader2, Calendar } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/core/hooks/use-toast";
import { format } from "date-fns";

export default function SubmissionDeadlines() {
  const { data: cycles } = useListCycles();
  const activeCycle = cycles?.find(c => c.status === "Open") || cycles?.[0];
  const { data: deadlines, isLoading } = useListSubmissionDeadlines({ cycleId: activeCycle?.id });
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);

  if (isLoading) return <div className="flex p-8 justify-center"><Loader2 className="w-8 h-8 animate-spin text-platinum-primary" /></div>;

  return (
    <div className="space-y-6 animate-in fade-in">
      <div className="flex justify-between items-center bg-white p-6 rounded-2xl shadow-sm border border-border">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-3">
            <div className="p-2 bg-red-50 text-red-600 rounded-lg"><Calendar className="w-6 h-6" /></div>
            Submission Deadlines
          </h1>
          <p className="text-slate-500 mt-1">Quarterly submission deadlines and reminder settings.</p>
        </div>
        {activeCycle && <DeadlineDialog open={isDialogOpen} onOpenChange={setIsDialogOpen} editingId={editingId} setEditingId={setEditingId} deadlines={deadlines} cycleId={activeCycle.id} />}
      </div>
      <Card className="platinum-card overflow-hidden">
        <table className="w-full text-sm text-left">
          <thead className="text-xs text-slate-500 uppercase bg-slate-50 border-b border-border font-semibold">
            <tr>
              <th className="px-6 py-4">Quarter</th>
              <th className="px-6 py-4">Deadline Date</th>
              <th className="px-6 py-4">Reminder Days</th>
              <th className="px-6 py-4">Status</th>
              <th className="px-6 py-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {deadlines?.length === 0 && <tr><td colSpan={5} className="px-6 py-8 text-center text-slate-500">No deadlines configured.</td></tr>}
            {deadlines?.map((dl) => (
              <tr key={dl.id} className="hover:bg-slate-50/50 transition-colors">
                <td className="px-6 py-4"><span className="inline-flex items-center px-3 py-1 bg-blue-50 text-blue-700 font-bold rounded-full text-xs">Q{dl.quarter}</span></td>
                <td className="px-6 py-4 font-medium text-slate-900">{format(new Date(dl.deadlineDate), "dd MMM yyyy")}</td>
                <td className="px-6 py-4 text-slate-600">{dl.reminderDaysBefore} days before</td>
                <td className="px-6 py-4"><StatusBadge status={dl.isActive ? "Active" : "Inactive"} /></td>
                <td className="px-6 py-4 text-right">
                  <Button variant="ghost" size="sm" className="text-blue-600" onClick={() => { setEditingId(dl.id); setIsDialogOpen(true); }}><Pencil className="w-4 h-4 mr-2" /> Edit</Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
}

interface DeadlineDialogProps {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  editingId: number | null;
  setEditingId: (id: number | null) => void;
  deadlines: { id: number; quarter: number; deadlineDate: string; reminderDaysBefore: number; isActive: boolean; cycleId: number }[] | undefined;
  cycleId: number;
}

function DeadlineDialog({ open, onOpenChange, editingId, setEditingId, deadlines, cycleId }: DeadlineDialogProps) {
  const qc = useQueryClient();
  const { toast } = useToast();
  const createMut = useCreateSubmissionDeadline();
  const updateMut = useUpdateSubmissionDeadline();
  const dl = editingId ? deadlines?.find((x) => x.id === editingId) : null;
  const isPending = createMut.isPending || updateMut.isPending;

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const data = { cycleId, quarter: parseInt(fd.get("quarter") as string), deadlineDate: fd.get("deadlineDate") as string, reminderDaysBefore: parseInt(fd.get("reminderDays") as string) || 7, isActive: fd.get("status") === "active" };
    const onSuccess = () => { qc.invalidateQueries({ queryKey: getListSubmissionDeadlinesQueryKey() }); onOpenChange(false); setEditingId(null); toast({ title: "Saved" }); };
    if (editingId) updateMut.mutate({ id: editingId, data }, { onSuccess });
    else createMut.mutate({ data }, { onSuccess });
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { onOpenChange(v); if (!v) setEditingId(null); }}>
      <DialogTrigger asChild><Button className="bg-platinum-primary rounded-xl"><Plus className="w-4 h-4 mr-2" /> Add Deadline</Button></DialogTrigger>
      <DialogContent className="rounded-2xl">
        <DialogHeader><DialogTitle>{editingId ? "Edit" : "Create"} Submission Deadline</DialogTitle></DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-500 uppercase">Quarter</label>
              <Select name="quarter" defaultValue={dl?.quarter?.toString() || "1"}>
                <SelectTrigger className="h-11 rounded-xl"><SelectValue /></SelectTrigger>
                <SelectContent><SelectItem value="1">Q1</SelectItem><SelectItem value="2">Q2</SelectItem><SelectItem value="3">Q3</SelectItem><SelectItem value="4">Q4</SelectItem></SelectContent>
              </Select>
            </div>
            <div className="space-y-2"><label className="text-xs font-bold text-slate-500 uppercase">Deadline Date</label><Input type="date" name="deadlineDate" required defaultValue={dl?.deadlineDate?.split("T")[0]} className="h-11 rounded-xl" /></div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2"><label className="text-xs font-bold text-slate-500 uppercase">Reminder Days Before</label><Input type="number" name="reminderDays" defaultValue={dl?.reminderDaysBefore || 7} className="h-11 rounded-xl" /></div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-500 uppercase">Status</label>
              <Select name="status" defaultValue={dl ? (dl.isActive ? "active" : "inactive") : "active"}>
                <SelectTrigger className="h-11 rounded-xl"><SelectValue /></SelectTrigger>
                <SelectContent><SelectItem value="active">Active</SelectItem><SelectItem value="inactive">Inactive</SelectItem></SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} className="rounded-xl">Cancel</Button>
            <Button type="submit" disabled={isPending} className="rounded-xl bg-platinum-primary">{isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />} Save</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
