import { useState } from "react";
import { useListDataTypes, useCreateDataType, useUpdateDataType, getListDataTypesQueryKey, type CreateDataTypeInput } from "@workspace/api-client-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { StatusBadge } from "@/components/ui/status-badge";
import { Plus, Pencil, Loader2, FileText } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/core/hooks/use-toast";

export default function DataTypes() {
  const { data: types, isLoading } = useListDataTypes();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);

  if (isLoading) return <div className="flex p-8 justify-center"><Loader2 className="w-8 h-8 animate-spin text-platinum-primary" /></div>;

  return (
    <div className="space-y-6 animate-in fade-in">
      <div className="flex justify-between items-center bg-white p-6 rounded-2xl shadow-sm border border-border">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-3">
            <div className="p-2 bg-purple-50 text-purple-600 rounded-lg"><FileText className="w-6 h-6" /></div>
            Data Types
          </h1>
          <p className="text-slate-500 mt-1">Define the measurement data types for KPIs.</p>
        </div>
        <DataTypeDialog open={isDialogOpen} onOpenChange={setIsDialogOpen} editingId={editingId} setEditingId={setEditingId} types={types} />
      </div>
      <Card className="platinum-card overflow-hidden">
        <table className="w-full text-sm text-left">
          <thead className="text-xs text-slate-500 uppercase bg-slate-50 border-b border-border font-semibold">
            <tr>
              <th className="px-6 py-4">Code</th>
              <th className="px-6 py-4">Name</th>
              <th className="px-6 py-4">Status</th>
              <th className="px-6 py-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {types?.length === 0 && <tr><td colSpan={4} className="px-6 py-8 text-center text-slate-500">No data types defined.</td></tr>}
            {types?.map((dt) => (
              <tr key={dt.id} className="hover:bg-slate-50/50 transition-colors">
                <td className="px-6 py-4 font-mono font-semibold text-slate-700">{dt.code}</td>
                <td className="px-6 py-4 font-medium text-slate-900">{dt.name}</td>
                <td className="px-6 py-4"><StatusBadge status={dt.isActive ? "Active" : "Inactive"} /></td>
                <td className="px-6 py-4 text-right">
                  <Button variant="ghost" size="sm" className="text-blue-600" onClick={() => { setEditingId(dt.id); setIsDialogOpen(true); }}>
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

interface DataTypeDialogProps {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  editingId: number | null;
  setEditingId: (id: number | null) => void;
  types: { id: number; name: string; code: string; isActive: boolean }[] | undefined;
}

function DataTypeDialog({ open, onOpenChange, editingId, setEditingId, types }: DataTypeDialogProps) {
  const qc = useQueryClient();
  const { toast } = useToast();
  const createMut = useCreateDataType();
  const updateMut = useUpdateDataType();
  const dt = editingId ? types?.find((t) => t.id === editingId) : null;
  const isPending = createMut.isPending || updateMut.isPending;

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const data = { name: fd.get("name") as string, code: fd.get("code") as string as CreateDataTypeInput["code"], isActive: fd.get("status") === "active" };
    const onSuccess = () => { qc.invalidateQueries({ queryKey: getListDataTypesQueryKey() }); onOpenChange(false); setEditingId(null); toast({ title: "Saved" }); };
    if (editingId) updateMut.mutate({ id: editingId, data }, { onSuccess });
    else createMut.mutate({ data }, { onSuccess });
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { onOpenChange(v); if (!v) setEditingId(null); }}>
      <DialogTrigger asChild><Button className="bg-platinum-primary rounded-xl"><Plus className="w-4 h-4 mr-2" /> Add Data Type</Button></DialogTrigger>
      <DialogContent className="rounded-2xl">
        <DialogHeader><DialogTitle>{editingId ? "Edit" : "Create"} Data Type</DialogTitle></DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2"><label className="text-xs font-bold text-slate-500 uppercase">Code</label><Input name="code" required defaultValue={dt?.code} placeholder="e.g. percentage" className="h-11 rounded-xl" /></div>
            <div className="space-y-2"><label className="text-xs font-bold text-slate-500 uppercase">Name</label><Input name="name" required defaultValue={dt?.name} placeholder="e.g. Percentage" className="h-11 rounded-xl" /></div>
          </div>
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-500 uppercase">Status</label>
            <Select name="status" defaultValue={dt ? (dt.isActive ? "active" : "inactive") : "active"}>
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
