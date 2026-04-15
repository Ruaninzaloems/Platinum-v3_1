import { useState } from "react";
import { useListNotificationConfigs, useCreateNotificationConfig, useUpdateNotificationConfig, useListCycles, getListNotificationConfigsQueryKey } from "@workspace/api-client-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { StatusBadge } from "@/components/ui/status-badge";
import { Plus, Pencil, Loader2, Settings, Mail, Bell } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";

export default function NotificationConfig() {
  const { data: cycles } = useListCycles();
  const activeCycle = cycles?.find(c => c.status === "Open") || cycles?.[0];
  const { data: configs, isLoading } = useListNotificationConfigs({ cycleId: activeCycle?.id });
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);

  if (isLoading) return <div className="flex p-8 justify-center"><Loader2 className="w-8 h-8 animate-spin text-platinum-primary" /></div>;

  return (
    <div className="space-y-6 animate-in fade-in">
      <div className="flex justify-between items-center bg-white p-6 rounded-2xl shadow-sm border border-border">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-3">
            <div className="p-2 bg-orange-50 text-orange-600 rounded-lg"><Settings className="w-6 h-6" /></div>
            Notification Settings
          </h1>
          <p className="text-slate-500 mt-1">Configure event-based notification rules and delivery channels.</p>
        </div>
        {activeCycle && <ConfigDialog open={isDialogOpen} onOpenChange={setIsDialogOpen} editingId={editingId} setEditingId={setEditingId} configs={configs} cycleId={activeCycle.id} />}
      </div>
      <Card className="platinum-card overflow-hidden">
        <table className="w-full text-sm text-left">
          <thead className="text-xs text-slate-500 uppercase bg-slate-50 border-b border-border font-semibold">
            <tr>
              <th className="px-6 py-4">Event Type</th>
              <th className="px-6 py-4">Days Before</th>
              <th className="px-6 py-4">Channels</th>
              <th className="px-6 py-4">Status</th>
              <th className="px-6 py-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {configs?.length === 0 && <tr><td colSpan={5} className="px-6 py-8 text-center text-slate-500">No notification rules configured.</td></tr>}
            {configs?.map((c) => (
              <tr key={c.id} className="hover:bg-slate-50/50 transition-colors">
                <td className="px-6 py-4 font-medium text-slate-900">{c.eventType.replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase())}</td>
                <td className="px-6 py-4 text-slate-600">{c.daysBefore} days</td>
                <td className="px-6 py-4 space-x-2">
                  {c.isEmail && <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-50 text-blue-700 rounded text-xs font-semibold"><Mail className="w-3 h-3" /> Email</span>}
                  {c.isInApp && <span className="inline-flex items-center gap-1 px-2 py-1 bg-purple-50 text-purple-700 rounded text-xs font-semibold"><Bell className="w-3 h-3" /> In-App</span>}
                </td>
                <td className="px-6 py-4"><StatusBadge status={c.isActive ? "Active" : "Inactive"} /></td>
                <td className="px-6 py-4 text-right">
                  <Button variant="ghost" size="sm" className="text-blue-600" onClick={() => { setEditingId(c.id); setIsDialogOpen(true); }}><Pencil className="w-4 h-4 mr-2" /> Edit</Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
}

interface ConfigDialogProps {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  editingId: number | null;
  setEditingId: (id: number | null) => void;
  configs: { id: number; eventType: string; daysBefore: number; isEmail: boolean; isInApp: boolean; isActive: boolean; cycleId: number }[] | undefined;
  cycleId: number;
}

function ConfigDialog({ open, onOpenChange, editingId, setEditingId, configs, cycleId }: ConfigDialogProps) {
  const qc = useQueryClient();
  const { toast } = useToast();
  const createMut = useCreateNotificationConfig();
  const updateMut = useUpdateNotificationConfig();
  const c = editingId ? configs?.find((x) => x.id === editingId) : null;
  const isPending = createMut.isPending || updateMut.isPending;

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const data = { cycleId, eventType: fd.get("eventType") as string, daysBefore: parseInt(fd.get("daysBefore") as string) || 7, isEmail: fd.get("isEmail") === "on", isInApp: fd.get("isInApp") === "on", isActive: fd.get("isActive") === "on" };
    const onSuccess = () => { qc.invalidateQueries({ queryKey: getListNotificationConfigsQueryKey() }); onOpenChange(false); setEditingId(null); toast({ title: "Saved" }); };
    if (editingId) updateMut.mutate({ id: editingId, data }, { onSuccess });
    else createMut.mutate({ data }, { onSuccess });
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { onOpenChange(v); if (!v) setEditingId(null); }}>
      <DialogTrigger asChild><Button className="bg-platinum-primary rounded-xl"><Plus className="w-4 h-4 mr-2" /> Add Rule</Button></DialogTrigger>
      <DialogContent className="rounded-2xl">
        <DialogHeader><DialogTitle>{editingId ? "Edit" : "Create"} Notification Rule</DialogTitle></DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-500 uppercase">Event Type</label>
            <Select name="eventType" defaultValue={c?.eventType || "deadline_approaching"}>
              <SelectTrigger className="h-11 rounded-xl"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="deadline_approaching">Deadline Approaching</SelectItem>
                <SelectItem value="submission_overdue">Submission Overdue</SelectItem>
                <SelectItem value="review_required">Review Required</SelectItem>
                <SelectItem value="approval_pending">Approval Pending</SelectItem>
                <SelectItem value="cycle_status_change">Cycle Status Change</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2"><label className="text-xs font-bold text-slate-500 uppercase">Days Before</label><Input type="number" name="daysBefore" defaultValue={c?.daysBefore || 7} className="h-11 rounded-xl" /></div>
          <div className="flex gap-6 pt-2">
            <div className="flex items-center gap-3"><Switch name="isEmail" defaultChecked={c?.isEmail ?? false} /><label className="text-sm font-medium text-slate-700">Email</label></div>
            <div className="flex items-center gap-3"><Switch name="isInApp" defaultChecked={c?.isInApp ?? true} /><label className="text-sm font-medium text-slate-700">In-App</label></div>
            <div className="flex items-center gap-3"><Switch name="isActive" defaultChecked={c?.isActive ?? true} /><label className="text-sm font-medium text-slate-700">Active</label></div>
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
