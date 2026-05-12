import { useState } from "react";
import { useListKpiGroups, useCreateKpiGroup, useUpdateKpiGroup, useListCycles } from "@workspace/api-client-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { StatusBadge } from "@/components/ui/status-badge";
import { Plus, Pencil, Loader2, Layers } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { getListKpiGroupsQueryKey } from "@workspace/api-client-react";
import { useToast } from "@/core/hooks/use-toast";

export default function KpiGroups() {
  const { data: cycles } = useListCycles();
  const activeCycle = cycles?.find(c => c.status === 'Open') || cycles?.[0];
  const { data: groups, isLoading } = useListKpiGroups({ cycleId: activeCycle?.id });
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);

  if (isLoading) return <div className="flex p-8 justify-center"><Loader2 className="w-8 h-8 animate-spin" /></div>;

  return (
    <div className="space-y-6 animate-in fade-in">
      <div className="flex justify-between items-center bg-white p-6 rounded-2xl shadow-sm border border-border">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-3">
            <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg"><Layers className="w-6 h-6" /></div>
            KPI Groups
          </h1>
          <p className="text-slate-500 mt-1">Hierarchical grouping for performance indicators.</p>
        </div>
        {activeCycle && (
          <GroupDialog open={isDialogOpen} onOpenChange={setIsDialogOpen} editingId={editingId} setEditingId={setEditingId} groups={groups} cycleId={activeCycle.id} />
        )}
      </div>

      <Card className="platinum-card overflow-hidden">
        <table className="w-full text-sm text-left">
          <thead className="text-xs text-slate-500 uppercase bg-slate-50 border-b border-border font-semibold">
            <tr>
              <th className="px-6 py-4">Code</th>
              <th className="px-6 py-4">Group Name</th>
              <th className="px-6 py-4">Parent Group</th>
              <th className="px-6 py-4">Status</th>
              <th className="px-6 py-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {groups?.length === 0 && (
              <tr><td colSpan={5} className="px-6 py-8 text-center text-slate-500">No groups defined.</td></tr>
            )}
            {groups?.map((group) => (
              <tr key={group.id} className="hover:bg-slate-50/50">
                <td className="px-6 py-4 font-mono font-semibold text-slate-700">{group.code}</td>
                <td className="px-6 py-4 font-medium text-slate-900">{group.name}</td>
                <td className="px-6 py-4 text-slate-500">
                  {groups.find(g => g.id === group.parentId)?.name || '-'}
                </td>
                <td className="px-6 py-4"><StatusBadge status={group.isActive ? "Active" : "Archived"} /></td>
                <td className="px-6 py-4 text-right">
                  <Button variant="ghost" size="sm" onClick={() => { setEditingId(group.id); setIsDialogOpen(true); }}>
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

interface GroupDialogProps {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  editingId: number | null;
  setEditingId: (id: number | null) => void;
  groups: { id: number; name: string; code: string; parentId?: number | null; isActive: boolean }[] | undefined;
  cycleId: number;
}

function GroupDialog({ open, onOpenChange, editingId, setEditingId, groups, cycleId }: GroupDialogProps) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const createMut = useCreateKpiGroup();
  const updateMut = useUpdateKpiGroup();
  
  const group = editingId ? groups?.find((g) => g.id === editingId) : null;
  const isPending = createMut.isPending || updateMut.isPending;

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const parentIdStr = fd.get("parentId") as string;
    const data = {
      name: fd.get("name") as string,
      code: fd.get("code") as string,
      parentId: parentIdStr && parentIdStr !== "none" ? parseInt(parentIdStr) : null,
      cycleId,
      isActive: fd.get("status") === "active"
    };

    const onSuccess = () => {
      queryClient.invalidateQueries({ queryKey: getListKpiGroupsQueryKey() });
      onOpenChange(false);
      setEditingId(null);
      toast({ title: "Saved successfully" });
    };

    if (editingId) updateMut.mutate({ id: editingId, data }, { onSuccess });
    else createMut.mutate({ data }, { onSuccess });
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { onOpenChange(v); if (!v) setEditingId(null); }}>
      <DialogTrigger asChild><Button className="bg-platinum-primary rounded-xl"><Plus className="w-4 h-4 mr-2" /> Add Group</Button></DialogTrigger>
      <DialogContent className="rounded-2xl">
        <DialogHeader><DialogTitle>{editingId ? 'Edit Group' : 'Create KPI Group'}</DialogTitle></DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-500 uppercase">Code</label>
              <Input name="code" required defaultValue={group?.code} placeholder="e.g. GRP-01" className="h-11 rounded-xl" />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-500 uppercase">Name</label>
              <Input name="name" required defaultValue={group?.name} placeholder="e.g. Service Delivery" className="h-11 rounded-xl" />
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-500 uppercase">Parent Group</label>
            <Select name="parentId" defaultValue={group?.parentId?.toString() || "none"}>
              <SelectTrigger className="h-11 rounded-xl"><SelectValue placeholder="Select parent (optional)" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">-- No Parent (Root Level) --</SelectItem>
                {groups?.filter((g) => g.id !== editingId).map((g) => (
                  <SelectItem key={g.id} value={g.id.toString()}>{g.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-500 uppercase">Status</label>
            <Select name="status" defaultValue={group ? (group.isActive ? "active" : "archived") : "active"}>
              <SelectTrigger className="h-11 rounded-xl"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="archived">Archived</SelectItem>
              </SelectContent>
            </Select>
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
