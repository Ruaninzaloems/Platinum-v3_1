import { useState } from "react";
import { useListScorecardTypes, useCreateScorecardType, useUpdateScorecardType, getListScorecardTypesQueryKey } from "@workspace/api-client-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { StatusBadge } from "@/components/ui/status-badge";
import { Plus, Pencil, Loader2, ListTodo } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/core/hooks/use-toast";

export default function ScorecardTypes() {
  const { data: types, isLoading } = useListScorecardTypes();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);

  if (isLoading) return <div className="flex p-8 justify-center"><Loader2 className="w-8 h-8 animate-spin text-platinum-primary" /></div>;

  return (
    <div className="space-y-6 animate-in fade-in">
      <div className="flex justify-between items-center bg-white p-6 rounded-2xl shadow-sm border border-border">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-3">
            <div className="p-2 bg-amber-50 text-amber-600 rounded-lg"><ListTodo className="w-6 h-6" /></div>
            Scorecard Types
          </h1>
          <p className="text-slate-500 mt-1">Configure the types of performance scorecards used.</p>
        </div>
        <TypeDialog open={isDialogOpen} onOpenChange={setIsDialogOpen} editingId={editingId} setEditingId={setEditingId} types={types} />
      </div>
      <Card className="platinum-card overflow-hidden">
        <table className="w-full text-sm text-left">
          <thead className="text-xs text-slate-500 uppercase bg-slate-50 border-b border-border font-semibold">
            <tr>
              <th className="px-6 py-4">Code</th>
              <th className="px-6 py-4">Name</th>
              <th className="px-6 py-4">Description</th>
              <th className="px-6 py-4">Status</th>
              <th className="px-6 py-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {types?.length === 0 && <tr><td colSpan={5} className="px-6 py-8 text-center text-slate-500">No scorecard types defined.</td></tr>}
            {types?.map((t) => (
              <tr key={t.id} className="hover:bg-slate-50/50 transition-colors">
                <td className="px-6 py-4 font-mono font-semibold text-slate-700">{t.code}</td>
                <td className="px-6 py-4 font-medium text-slate-900">{t.name}</td>
                <td className="px-6 py-4 text-slate-500 truncate max-w-xs">{t.description || "-"}</td>
                <td className="px-6 py-4"><StatusBadge status={t.isActive ? "Active" : "Inactive"} /></td>
                <td className="px-6 py-4 text-right">
                  <Button variant="ghost" size="sm" className="text-blue-600" onClick={() => { setEditingId(t.id); setIsDialogOpen(true); }}>
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

interface TypeDialogProps {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  editingId: number | null;
  setEditingId: (id: number | null) => void;
  types: { id: number; name: string; code: string; description: string; isActive: boolean }[] | undefined;
}

function TypeDialog({ open, onOpenChange, editingId, setEditingId, types }: TypeDialogProps) {
  const qc = useQueryClient();
  const { toast } = useToast();
  const createMut = useCreateScorecardType();
  const updateMut = useUpdateScorecardType();
  const t = editingId ? types?.find((x) => x.id === editingId) : null;
  const isPending = createMut.isPending || updateMut.isPending;

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const data = { name: fd.get("name") as string, code: fd.get("code") as string, description: fd.get("description") as string || "", isActive: fd.get("status") === "active" };
    const onSuccess = () => { qc.invalidateQueries({ queryKey: getListScorecardTypesQueryKey() }); onOpenChange(false); setEditingId(null); toast({ title: "Saved" }); };
    if (editingId) updateMut.mutate({ id: editingId, data }, { onSuccess });
    else createMut.mutate({ data }, { onSuccess });
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { onOpenChange(v); if (!v) setEditingId(null); }}>
      <DialogTrigger asChild><Button className="bg-platinum-primary rounded-xl"><Plus className="w-4 h-4 mr-2" /> Add Scorecard Type</Button></DialogTrigger>
      <DialogContent className="rounded-2xl">
        <DialogHeader><DialogTitle>{editingId ? "Edit" : "Create"} Scorecard Type</DialogTitle></DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2"><label className="text-xs font-bold text-slate-500 uppercase">Code</label><Input name="code" required defaultValue={t?.code} placeholder="e.g. org" className="h-11 rounded-xl" /></div>
            <div className="space-y-2"><label className="text-xs font-bold text-slate-500 uppercase">Name</label><Input name="name" required defaultValue={t?.name} placeholder="e.g. Organisational" className="h-11 rounded-xl" /></div>
          </div>
          <div className="space-y-2"><label className="text-xs font-bold text-slate-500 uppercase">Description</label><Textarea name="description" defaultValue={t?.description} placeholder="Brief description" className="rounded-xl" /></div>
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-500 uppercase">Status</label>
            <Select name="status" defaultValue={t ? (t.isActive ? "active" : "inactive") : "active"}>
              <SelectTrigger className="h-11 rounded-xl"><SelectValue /></SelectTrigger>
              <SelectContent><SelectItem value="active">Active</SelectItem><SelectItem value="inactive">Inactive</SelectItem></SelectContent>
            </Select>
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
