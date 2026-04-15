import { useState } from "react";
import { useListCycles, useCreateCycle, useUpdateCycle, useDeleteCycle, type CreateCycleInput } from "@workspace/api-client-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { StatusBadge } from "@/components/ui/status-badge";
import { Plus, Pencil, Trash2, Loader2, Calendar as CalendarIcon } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { getListCyclesQueryKey } from "@workspace/api-client-react";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";

export default function PerformanceCycles() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { data: cycles, isLoading } = useListCycles();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [deletingCycle, setDeletingCycle] = useState<{ id: number; label: string } | null>(null);

  const deleteMut = useDeleteCycle({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListCyclesQueryKey() });
        toast({ title: "Cycle deleted successfully" });
        setDeletingCycle(null);
      },
      onError: (err: Error) => {
        toast({ title: "Error", description: err.message, variant: "destructive" });
      },
    },
  });

  if (isLoading) return <div className="flex p-8 justify-center"><Loader2 className="w-8 h-8 animate-spin text-platinum-primary" /></div>;

  return (
    <div className="space-y-6 animate-in fade-in">
      <div className="flex justify-between items-center bg-white p-6 rounded-2xl shadow-sm border border-border">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-3">
            <div className="p-2 bg-blue-50 text-blue-600 rounded-lg"><CalendarIcon className="w-6 h-6" /></div>
            Performance Cycles
          </h1>
          <p className="text-slate-500 mt-1">Manage financial years and performance periods.</p>
        </div>
        <CycleDialog open={isDialogOpen} onOpenChange={setIsDialogOpen} editingId={editingId} setEditingId={setEditingId} cycles={cycles} />
      </div>

      <Card className="platinum-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-slate-500 uppercase bg-slate-50 border-b border-border font-semibold">
              <tr>
                <th className="px-6 py-4">Financial Year</th>
                <th className="px-6 py-4">Start Date</th>
                <th className="px-6 py-4">End Date</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {cycles?.length === 0 && (
                <tr><td colSpan={5} className="px-6 py-8 text-center text-slate-500">No cycles configured yet.</td></tr>
              )}
              {cycles?.map((cycle) => (
                <tr key={cycle.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-6 py-4 font-semibold text-slate-900">{cycle.financialYearLabel}</td>
                  <td className="px-6 py-4 text-slate-600">{format(new Date(cycle.startDate), 'dd MMM yyyy')}</td>
                  <td className="px-6 py-4 text-slate-600">{format(new Date(cycle.endDate), 'dd MMM yyyy')}</td>
                  <td className="px-6 py-4"><StatusBadge status={cycle.status} /></td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button 
                        variant="ghost" 
                        size="sm"
                        className="text-blue-600 hover:text-blue-800 hover:bg-blue-50"
                        onClick={() => {
                          setEditingId(cycle.id);
                          setIsDialogOpen(true);
                        }}
                      >
                        <Pencil className="w-4 h-4 mr-2" /> Edit
                      </Button>
                      {cycle.status === "Draft" && (
                        <Button 
                          variant="ghost" 
                          size="sm"
                          className="text-red-500 hover:text-red-700 hover:bg-red-50"
                          onClick={() => setDeletingCycle({ id: cycle.id, label: cycle.financialYearLabel })}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <AlertDialog open={!!deletingCycle} onOpenChange={(v) => { if (!v) setDeletingCycle(null); }}>
        <AlertDialogContent className="rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Performance Cycle</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete the cycle <strong>{deletingCycle?.label}</strong>? All linked scorecards, KPIs, actuals, and related records will also be permanently removed. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-xl">Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="rounded-xl bg-red-600 hover:bg-red-700 text-white"
              onClick={() => deletingCycle && deleteMut.mutate({ id: deletingCycle.id })}
              disabled={deleteMut.isPending}
            >
              {deleteMut.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

interface CycleDialogProps {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  editingId: number | null;
  setEditingId: (id: number | null) => void;
  cycles: { id: number; financialYearLabel: string; startDate: string; endDate: string; status: string }[] | undefined;
}

function CycleDialog({ open, onOpenChange, editingId, setEditingId, cycles }: CycleDialogProps) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const createMut = useCreateCycle();
  const updateMut = useUpdateCycle();
  
  const cycle = editingId ? cycles?.find((c) => c.id === editingId) : null;
  const isPending = createMut.isPending || updateMut.isPending;

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const data = {
      financialYearLabel: fd.get("label") as string,
      startDate: fd.get("start") as string,
      endDate: fd.get("end") as string,
      status: fd.get("status") as string as CreateCycleInput["status"]
    };

    const onSuccess = () => {
      queryClient.invalidateQueries({ queryKey: getListCyclesQueryKey() });
      onOpenChange(false);
      setEditingId(null);
      toast({ title: `Cycle ${editingId ? 'updated' : 'created'} successfully` });
    };

    if (editingId) {
      updateMut.mutate({ id: editingId, data }, { onSuccess });
    } else {
      createMut.mutate({ data }, { onSuccess });
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { onOpenChange(v); if (!v) setEditingId(null); }}>
      <DialogTrigger asChild>
        <Button className="bg-platinum-primary hover:bg-platinum-primary-light shadow-md shadow-platinum-primary/20 transition-all rounded-xl px-6">
          <Plus className="w-4 h-4 mr-2" /> Add Cycle
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px] rounded-2xl">
        <DialogHeader>
          <DialogTitle className="text-xl text-platinum-primary">{editingId ? 'Edit Cycle' : 'Create Performance Cycle'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Financial Year Label</label>
            <Input name="label" required defaultValue={cycle?.financialYearLabel} placeholder="e.g. 2024/2025" className="h-11 rounded-xl" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Start Date</label>
              <Input type="date" name="start" required defaultValue={cycle?.startDate?.split('T')[0]} className="h-11 rounded-xl" />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">End Date</label>
              <Input type="date" name="end" required defaultValue={cycle?.endDate?.split('T')[0]} className="h-11 rounded-xl" />
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Status</label>
            <Select name="status" defaultValue={cycle?.status || "Draft"}>
              <SelectTrigger className="h-11 rounded-xl">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Draft">Draft</SelectItem>
                <SelectItem value="Open">Open</SelectItem>
                <SelectItem value="Closed">Closed</SelectItem>
                <SelectItem value="Archived">Archived</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <DialogFooter className="pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} className="rounded-xl">Cancel</Button>
            <Button type="submit" disabled={isPending} className="rounded-xl bg-platinum-primary hover:bg-platinum-primary-light">
              {isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />} Save Changes
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
