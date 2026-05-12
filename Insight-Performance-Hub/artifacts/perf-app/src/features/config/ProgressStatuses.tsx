import { useState } from "react";
import { useListProgressStatuses, useCreateProgressStatus, useUpdateProgressStatus, useListCycles, getListProgressStatusesQueryKey } from "@workspace/api-client-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Pencil, Loader2, Activity } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/core/hooks/use-toast";

export default function ProgressStatuses() {
  const { data: cycles } = useListCycles();
  const activeCycle = cycles?.find(c => c.status === "Open") || cycles?.[0];
  const { data: statuses, isLoading } = useListProgressStatuses({ cycleId: activeCycle?.id });
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);

  if (isLoading) return <div className="flex p-8 justify-center"><Loader2 className="w-8 h-8 animate-spin text-platinum-primary" /></div>;

  return (
    <div className="space-y-6 animate-in fade-in">
      <div className="flex justify-between items-center bg-white p-6 rounded-2xl shadow-sm border border-border">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-3">
            <div className="p-2 bg-green-50 text-green-600 rounded-lg"><Activity className="w-6 h-6" /></div>
            Progress Statuses
          </h1>
          <p className="text-slate-500 mt-1">Define statuses for tracking KPI progress.</p>
        </div>
        {activeCycle && <StatusDialog open={isDialogOpen} onOpenChange={setIsDialogOpen} editingId={editingId} setEditingId={setEditingId} statuses={statuses} cycleId={activeCycle.id} />}
      </div>
      <Card className="platinum-card overflow-hidden">
        <table className="w-full text-sm text-left">
          <thead className="text-xs text-slate-500 uppercase bg-slate-50 border-b border-border font-semibold">
            <tr>
              <th className="px-6 py-4">Color</th>
              <th className="px-6 py-4">Code</th>
              <th className="px-6 py-4">Name</th>
              <th className="px-6 py-4">Order</th>
              <th className="px-6 py-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {statuses?.length === 0 && <tr><td colSpan={5} className="px-6 py-8 text-center text-slate-500">No statuses defined.</td></tr>}
            {statuses?.map((s) => (
              <tr key={s.id} className="hover:bg-slate-50/50 transition-colors">
                <td className="px-6 py-4"><div className="w-6 h-6 rounded-full border-2 border-white shadow-sm" style={{ backgroundColor: s.color }} /></td>
                <td className="px-6 py-4 font-mono font-semibold text-slate-700">{s.code}</td>
                <td className="px-6 py-4 font-medium text-slate-900">{s.name}</td>
                <td className="px-6 py-4 text-slate-500">{s.sortOrder}</td>
                <td className="px-6 py-4 text-right">
                  <Button variant="ghost" size="sm" className="text-blue-600" onClick={() => { setEditingId(s.id); setIsDialogOpen(true); }}>
                    <Pencil className="w-4 h-4 mr-2" /> Edit
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
}

interface StatusDialogProps {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  editingId: number | null;
  setEditingId: (id: number | null) => void;
  statuses: { id: number; name: string; code: string; color: string; sortOrder: number }[] | undefined;
  cycleId: number;
}

function StatusDialog({ open, onOpenChange, editingId, setEditingId, statuses, cycleId }: StatusDialogProps) {
  const qc = useQueryClient();
  const { toast } = useToast();
  const createMut = useCreateProgressStatus();
  const updateMut = useUpdateProgressStatus();
  const s = editingId ? statuses?.find((x) => x.id === editingId) : null;
  const isPending = createMut.isPending || updateMut.isPending;

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const data = { name: fd.get("name") as string, code: fd.get("code") as string, color: fd.get("color") as string, cycleId, isActive: true, sortOrder: parseInt(fd.get("sortOrder") as string) || 0 };
    const onSuccess = () => { qc.invalidateQueries({ queryKey: getListProgressStatusesQueryKey() }); onOpenChange(false); setEditingId(null); toast({ title: "Saved" }); };
    if (editingId) updateMut.mutate({ id: editingId, data }, { onSuccess });
    else createMut.mutate({ data }, { onSuccess });
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { onOpenChange(v); if (!v) setEditingId(null); }}>
      <DialogTrigger asChild><Button className="bg-platinum-primary rounded-xl"><Plus className="w-4 h-4 mr-2" /> Add Status</Button></DialogTrigger>
      <DialogContent className="rounded-2xl">
        <DialogHeader><DialogTitle>{editingId ? "Edit" : "Create"} Progress Status</DialogTitle></DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2"><label className="text-xs font-bold text-slate-500 uppercase">Code</label><Input name="code" required defaultValue={s?.code} placeholder="e.g. on_track" className="h-11 rounded-xl" /></div>
            <div className="space-y-2"><label className="text-xs font-bold text-slate-500 uppercase">Name</label><Input name="name" required defaultValue={s?.name} placeholder="e.g. On Track" className="h-11 rounded-xl" /></div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2"><label className="text-xs font-bold text-slate-500 uppercase">Color</label><Input type="color" name="color" required defaultValue={s?.color || "#3b82f6"} className="h-11 rounded-xl" /></div>
            <div className="space-y-2"><label className="text-xs font-bold text-slate-500 uppercase">Sort Order</label><Input type="number" name="sortOrder" defaultValue={s?.sortOrder || 0} className="h-11 rounded-xl" /></div>
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
