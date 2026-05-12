import { useState } from "react";
import { useListUnitsOfMeasure, useCreateUnitOfMeasure, useUpdateUnitOfMeasure, useListCycles } from "@workspace/api-client-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { StatusBadge } from "@/components/ui/status-badge";
import { Plus, Pencil, Loader2, Target } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { getListUnitsOfMeasureQueryKey } from "@workspace/api-client-react";
import { useToast } from "@/core/hooks/use-toast";

export default function UnitsOfMeasure() {
  const { data: cycles } = useListCycles();
  const activeCycle = cycles?.find(c => c.status === 'Open') || cycles?.[0];
  const { data: units, isLoading } = useListUnitsOfMeasure({ cycleId: activeCycle?.id });
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);

  if (isLoading) return <div className="flex p-8 justify-center"><Loader2 className="w-8 h-8 animate-spin" /></div>;

  return (
    <div className="space-y-6 animate-in fade-in">
      <div className="flex justify-between items-center bg-white p-6 rounded-2xl shadow-sm border border-border">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-3">
            <div className="p-2 bg-teal-50 text-teal-600 rounded-lg"><Target className="w-6 h-6" /></div>
            Units of Measure
          </h1>
          <p className="text-slate-500 mt-1">Configure measurement units for KPIs.</p>
        </div>
        {activeCycle && (
          <UnitDialog open={isDialogOpen} onOpenChange={setIsDialogOpen} editingId={editingId} setEditingId={setEditingId} units={units} cycleId={activeCycle.id} />
        )}
      </div>

      <Card className="platinum-card overflow-hidden">
        <table className="w-full text-sm text-left">
          <thead className="text-xs text-slate-500 uppercase bg-slate-50 border-b border-border font-semibold">
            <tr>
              <th className="px-6 py-4">Name</th>
              <th className="px-6 py-4">Abbreviation</th>
              <th className="px-6 py-4">Status</th>
              <th className="px-6 py-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {units?.length === 0 && (
              <tr><td colSpan={4} className="px-6 py-8 text-center text-slate-500">No units defined.</td></tr>
            )}
            {units?.map((unit) => (
              <tr key={unit.id} className="hover:bg-slate-50/50">
                <td className="px-6 py-4 font-medium text-slate-900">{unit.name}</td>
                <td className="px-6 py-4 font-mono text-slate-600 bg-slate-50 px-2 py-1 rounded inline-block mt-3">{unit.abbreviation}</td>
                <td className="px-6 py-4"><StatusBadge status={unit.isActive ? "Active" : "Archived"} /></td>
                <td className="px-6 py-4 text-right">
                  <Button variant="ghost" size="sm" onClick={() => { setEditingId(unit.id); setIsDialogOpen(true); }}>
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

interface UnitDialogProps {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  editingId: number | null;
  setEditingId: (id: number | null) => void;
  units: { id: number; name: string; abbreviation: string; isActive: boolean }[] | undefined;
  cycleId: number;
}

function UnitDialog({ open, onOpenChange, editingId, setEditingId, units, cycleId }: UnitDialogProps) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const createMut = useCreateUnitOfMeasure();
  const updateMut = useUpdateUnitOfMeasure();
  
  const unit = editingId ? units?.find((u) => u.id === editingId) : null;
  const isPending = createMut.isPending || updateMut.isPending;

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const data = {
      name: fd.get("name") as string,
      abbreviation: fd.get("abbreviation") as string,
      cycleId,
      isActive: true
    };

    const onSuccess = () => {
      queryClient.invalidateQueries({ queryKey: getListUnitsOfMeasureQueryKey() });
      onOpenChange(false);
      setEditingId(null);
      toast({ title: "Saved successfully" });
    };

    if (editingId) updateMut.mutate({ id: editingId, data }, { onSuccess });
    else createMut.mutate({ data }, { onSuccess });
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { onOpenChange(v); if (!v) setEditingId(null); }}>
      <DialogTrigger asChild><Button className="bg-platinum-primary rounded-xl"><Plus className="w-4 h-4 mr-2" /> Add Unit</Button></DialogTrigger>
      <DialogContent className="rounded-2xl">
        <DialogHeader><DialogTitle>{editingId ? 'Edit Unit' : 'Create Unit of Measure'}</DialogTitle></DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-500 uppercase">Unit Name</label>
            <Input name="name" required defaultValue={unit?.name} placeholder="e.g. Percentage" className="h-11 rounded-xl" />
          </div>
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-500 uppercase">Abbreviation</label>
            <Input name="abbreviation" required defaultValue={unit?.abbreviation} placeholder="e.g. %" className="h-11 rounded-xl" />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} className="rounded-xl">Cancel</Button>
            <Button type="submit" disabled={isPending} className="rounded-xl bg-platinum-primary">{isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin"/>} Save</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
