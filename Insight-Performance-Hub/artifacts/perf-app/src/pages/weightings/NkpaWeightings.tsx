import { useState } from "react";
import { useListNkpaWeightings, useCreateNkpaWeighting, useUpdateNkpaWeighting, useDeleteNkpaWeighting, useListCycles, getListNkpaWeightingsQueryKey, type CreateNkpaWeightingInput } from "@workspace/api-client-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Pencil, Trash2, Loader2, BarChart2, AlertTriangle } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";

export default function NkpaWeightings() {
  const { data: cycles } = useListCycles();
  const activeCycle = cycles?.find(c => c.status === "Open") || cycles?.[0];
  const { data: weightings, isLoading } = useListNkpaWeightings({ cycleId: activeCycle?.id });
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const deleteMut = useDeleteNkpaWeighting();
  const qc = useQueryClient();
  const { toast } = useToast();

  const orgWeightings = weightings?.filter(w => w.scope === "organisational") || [];
  const deptWeightings = weightings?.filter(w => w.scope === "departmental") || [];
  const orgTotal = orgWeightings.reduce((s, w) => s + w.weight, 0);
  const deptTotal = deptWeightings.reduce((s, w) => s + w.weight, 0);

  if (isLoading) return <div className="flex p-8 justify-center"><Loader2 className="w-8 h-8 animate-spin text-platinum-primary" /></div>;

  const handleDelete = (id: number) => {
    deleteMut.mutate({ id }, { onSuccess: () => { qc.invalidateQueries({ queryKey: getListNkpaWeightingsQueryKey() }); toast({ title: "Deleted" }); } });
  };

  const renderTable = (title: string, items: { id: number; nkpaName: string; weight: number; scope: string }[], total: number) => (
    <Card className="platinum-card overflow-hidden">
      <div className="bg-slate-50 border-b border-border p-4 flex justify-between items-center">
        <h3 className="font-bold text-slate-800">{title}</h3>
        <div className="flex items-center gap-2">
          <span className={`text-sm font-bold ${Math.abs(total - 100) < 0.01 ? "text-green-600" : "text-red-500"}`}>
            Total: {total.toFixed(1)}%
          </span>
          {Math.abs(total - 100) >= 0.01 && <AlertTriangle className="w-4 h-4 text-red-500" />}
        </div>
      </div>
      <table className="w-full text-sm text-left">
        <thead className="text-xs text-slate-500 uppercase bg-slate-50/50 font-semibold">
          <tr>
            <th className="px-6 py-3">NKPA Name</th>
            <th className="px-6 py-3">Weight (%)</th>
            <th className="px-6 py-3 text-right">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {items.length === 0 && <tr><td colSpan={3} className="px-6 py-6 text-center text-slate-500">No weightings defined.</td></tr>}
          {items.map((w) => (
            <tr key={w.id} className="hover:bg-slate-50/50 transition-colors">
              <td className="px-6 py-4 font-medium text-slate-900">{w.nkpaName}</td>
              <td className="px-6 py-4">
                <div className="flex items-center gap-3">
                  <div className="w-24 bg-slate-200 rounded-full h-2"><div className="bg-platinum-primary h-2 rounded-full" style={{ width: `${Math.min(w.weight, 100)}%` }} /></div>
                  <span className="font-semibold text-slate-700">{w.weight}%</span>
                </div>
              </td>
              <td className="px-6 py-4 text-right space-x-2">
                <Button variant="ghost" size="sm" className="text-blue-600" onClick={() => { setEditingId(w.id); setIsDialogOpen(true); }}><Pencil className="w-4 h-4" /></Button>
                <Button variant="ghost" size="sm" className="text-red-500" onClick={() => handleDelete(w.id)}><Trash2 className="w-4 h-4" /></Button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </Card>
  );

  return (
    <div className="space-y-6 animate-in fade-in">
      <div className="flex justify-between items-center bg-white p-6 rounded-2xl shadow-sm border border-border">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-3">
            <div className="p-2 bg-teal-50 text-teal-600 rounded-lg"><BarChart2 className="w-6 h-6" /></div>
            NKPA Weightings
          </h1>
          <p className="text-slate-500 mt-1">National Key Performance Area weightings must total 100%.</p>
        </div>
        {activeCycle && <WeightingDialog open={isDialogOpen} onOpenChange={setIsDialogOpen} editingId={editingId} setEditingId={setEditingId} weightings={weightings} cycleId={activeCycle.id} />}
      </div>
      {renderTable("Organisational Scope", orgWeightings, orgTotal)}
      {renderTable("Departmental Scope", deptWeightings, deptTotal)}
    </div>
  );
}

interface WeightingDialogProps {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  editingId: number | null;
  setEditingId: (id: number | null) => void;
  weightings: { id: number; nkpaName: string; weight: number; scope: string }[] | undefined;
  cycleId: number;
}

function WeightingDialog({ open, onOpenChange, editingId, setEditingId, weightings, cycleId }: WeightingDialogProps) {
  const qc = useQueryClient();
  const { toast } = useToast();
  const createMut = useCreateNkpaWeighting();
  const updateMut = useUpdateNkpaWeighting();
  const w = editingId ? weightings?.find((x) => x.id === editingId) : null;
  const isPending = createMut.isPending || updateMut.isPending;

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const data = { nkpaName: fd.get("nkpaName") as string, weight: parseFloat(fd.get("weight") as string), scope: fd.get("scope") as string as CreateNkpaWeightingInput["scope"], cycleId, departmentId: null };
    const onSuccess = () => { qc.invalidateQueries({ queryKey: getListNkpaWeightingsQueryKey() }); onOpenChange(false); setEditingId(null); toast({ title: "Saved" }); };
    if (editingId) updateMut.mutate({ id: editingId, data }, { onSuccess });
    else createMut.mutate({ data }, { onSuccess });
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { onOpenChange(v); if (!v) setEditingId(null); }}>
      <DialogTrigger asChild><Button className="bg-platinum-primary rounded-xl"><Plus className="w-4 h-4 mr-2" /> Add Weighting</Button></DialogTrigger>
      <DialogContent className="rounded-2xl">
        <DialogHeader><DialogTitle>{editingId ? "Edit" : "Create"} NKPA Weighting</DialogTitle></DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2"><label className="text-xs font-bold text-slate-500 uppercase">NKPA Name</label><Input name="nkpaName" required defaultValue={w?.nkpaName} placeholder="e.g. Service Delivery" className="h-11 rounded-xl" /></div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2"><label className="text-xs font-bold text-slate-500 uppercase">Weight (%)</label><Input type="number" step="0.1" name="weight" required defaultValue={w?.weight} placeholder="e.g. 25" className="h-11 rounded-xl" /></div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-500 uppercase">Scope</label>
              <Select name="scope" defaultValue={w?.scope || "organisational"}>
                <SelectTrigger className="h-11 rounded-xl"><SelectValue /></SelectTrigger>
                <SelectContent><SelectItem value="organisational">Organisational</SelectItem><SelectItem value="departmental">Departmental</SelectItem></SelectContent>
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
