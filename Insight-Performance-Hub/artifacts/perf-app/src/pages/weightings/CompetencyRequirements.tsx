import { useState } from "react";
import { useListCompetencyRequirements, useCreateCompetencyRequirement, useUpdateCompetencyRequirement, useListCycles, getListCompetencyRequirementsQueryKey } from "@workspace/api-client-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { StatusBadge } from "@/components/ui/status-badge";
import { Plus, Pencil, Loader2, Users, AlertTriangle } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";

export default function CompetencyRequirements() {
  const { data: cycles } = useListCycles();
  const activeCycle = cycles?.find(c => c.status === "Open") || cycles?.[0];
  const { data: requirements, isLoading } = useListCompetencyRequirements({ cycleId: activeCycle?.id });
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);

  const totalWeight = requirements?.reduce((s, r) => s + r.weight, 0) || 0;

  if (isLoading) return <div className="flex p-8 justify-center"><Loader2 className="w-8 h-8 animate-spin text-platinum-primary" /></div>;

  return (
    <div className="space-y-6 animate-in fade-in">
      <div className="flex justify-between items-center bg-white p-6 rounded-2xl shadow-sm border border-border">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-3">
            <div className="p-2 bg-violet-50 text-violet-600 rounded-lg"><Users className="w-6 h-6" /></div>
            Competency Requirements
          </h1>
          <p className="text-slate-500 mt-1">Core competencies and their weighting for performance assessments.</p>
        </div>
        {activeCycle && <CompDialog open={isDialogOpen} onOpenChange={setIsDialogOpen} editingId={editingId} setEditingId={setEditingId} requirements={requirements} cycleId={activeCycle.id} />}
      </div>
      <div className="flex items-center gap-2 text-sm">
        <span className={`font-bold ${Math.abs(totalWeight - 100) < 0.01 ? "text-green-600" : "text-red-500"}`}>Total Weight: {totalWeight.toFixed(1)}%</span>
        {Math.abs(totalWeight - 100) >= 0.01 && <AlertTriangle className="w-4 h-4 text-red-500" />}
      </div>
      <Card className="platinum-card overflow-hidden">
        <table className="w-full text-sm text-left">
          <thead className="text-xs text-slate-500 uppercase bg-slate-50 border-b border-border font-semibold">
            <tr>
              <th className="px-6 py-4">Competency</th>
              <th className="px-6 py-4">Description</th>
              <th className="px-6 py-4">Weight</th>
              <th className="px-6 py-4">Status</th>
              <th className="px-6 py-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {requirements?.length === 0 && <tr><td colSpan={5} className="px-6 py-8 text-center text-slate-500">No competencies defined.</td></tr>}
            {requirements?.map((r) => (
              <tr key={r.id} className="hover:bg-slate-50/50 transition-colors">
                <td className="px-6 py-4 font-medium text-slate-900">{r.name}</td>
                <td className="px-6 py-4 text-slate-500 truncate max-w-xs">{r.description || "-"}</td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-20 bg-slate-200 rounded-full h-2"><div className="bg-violet-500 h-2 rounded-full" style={{ width: `${Math.min(r.weight, 100)}%` }} /></div>
                    <span className="font-semibold text-slate-700">{r.weight}%</span>
                  </div>
                </td>
                <td className="px-6 py-4"><StatusBadge status={r.isActive ? "Active" : "Inactive"} /></td>
                <td className="px-6 py-4 text-right">
                  <Button variant="ghost" size="sm" className="text-blue-600" onClick={() => { setEditingId(r.id); setIsDialogOpen(true); }}><Pencil className="w-4 h-4 mr-2" /> Edit</Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
}

interface CompDialogProps {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  editingId: number | null;
  setEditingId: (id: number | null) => void;
  requirements: { id: number; name: string; description: string; weight: number; isActive: boolean; sortOrder: number }[] | undefined;
  cycleId: number;
}

function CompDialog({ open, onOpenChange, editingId, setEditingId, requirements, cycleId }: CompDialogProps) {
  const qc = useQueryClient();
  const { toast } = useToast();
  const createMut = useCreateCompetencyRequirement();
  const updateMut = useUpdateCompetencyRequirement();
  const r = editingId ? requirements?.find((x) => x.id === editingId) : null;
  const isPending = createMut.isPending || updateMut.isPending;

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const data = { name: fd.get("name") as string, description: fd.get("description") as string || "", weight: parseFloat(fd.get("weight") as string), cycleId, isActive: fd.get("status") === "active", sortOrder: parseInt(fd.get("sortOrder") as string) || 0 };
    const onSuccess = () => { qc.invalidateQueries({ queryKey: getListCompetencyRequirementsQueryKey() }); onOpenChange(false); setEditingId(null); toast({ title: "Saved" }); };
    if (editingId) updateMut.mutate({ id: editingId, data }, { onSuccess });
    else createMut.mutate({ data }, { onSuccess });
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { onOpenChange(v); if (!v) setEditingId(null); }}>
      <DialogTrigger asChild><Button className="bg-platinum-primary rounded-xl"><Plus className="w-4 h-4 mr-2" /> Add Competency</Button></DialogTrigger>
      <DialogContent className="rounded-2xl">
        <DialogHeader><DialogTitle>{editingId ? "Edit" : "Create"} Competency</DialogTitle></DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2"><label className="text-xs font-bold text-slate-500 uppercase">Name</label><Input name="name" required defaultValue={r?.name} className="h-11 rounded-xl" /></div>
            <div className="space-y-2"><label className="text-xs font-bold text-slate-500 uppercase">Weight (%)</label><Input type="number" step="0.1" name="weight" required defaultValue={r?.weight} className="h-11 rounded-xl" /></div>
          </div>
          <div className="space-y-2"><label className="text-xs font-bold text-slate-500 uppercase">Description</label><Textarea name="description" defaultValue={r?.description} className="rounded-xl" /></div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-500 uppercase">Status</label>
              <Select name="status" defaultValue={r ? (r.isActive ? "active" : "inactive") : "active"}>
                <SelectTrigger className="h-11 rounded-xl"><SelectValue /></SelectTrigger>
                <SelectContent><SelectItem value="active">Active</SelectItem><SelectItem value="inactive">Inactive</SelectItem></SelectContent>
              </Select>
            </div>
            <div className="space-y-2"><label className="text-xs font-bold text-slate-500 uppercase">Sort Order</label><Input type="number" name="sortOrder" defaultValue={r?.sortOrder || 0} className="h-11 rounded-xl" /></div>
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
