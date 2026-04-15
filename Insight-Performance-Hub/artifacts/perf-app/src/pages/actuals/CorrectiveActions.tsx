import { useState } from "react";
import {
  useListRemedialActions, useCreateRemedialAction, useUpdateRemedialAction
} from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Plus, AlertTriangle, CheckCircle2, Clock, Pencil } from "lucide-react";

const STATUS_COLORS: Record<string, string> = {
  Open: "bg-red-100 text-red-700",
  "In Progress": "bg-amber-100 text-amber-700",
  Completed: "bg-green-100 text-green-700",
  Overdue: "bg-red-200 text-red-800",
};

export default function CorrectiveActions() {
  const { toast } = useToast();
  const [showNew, setShowNew] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [newForm, setNewForm] = useState({
    kpiId: 0, quarter: 1, actionDescription: "", dueDate: "", actionOwnerIds: "",
  });
  const [editForm, setEditForm] = useState({ actionDescription: "", dueDate: "", actionOwnerIds: "" });

  const { data: actions, refetch } = useListRemedialActions(
    statusFilter !== "all" ? { status: statusFilter } : {}
  );
  const createAction = useCreateRemedialAction();
  const updateAction = useUpdateRemedialAction();

  async function handleCreate() {
    if (!newForm.kpiId || !newForm.actionDescription || !newForm.dueDate) return;
    try {
      await createAction.mutateAsync({
        data: {
          kpiId: newForm.kpiId,
          quarter: newForm.quarter,
          actionDescription: newForm.actionDescription,
          dueDate: newForm.dueDate,
          actionOwnerIds: newForm.actionOwnerIds || undefined,
        }
      });
      setShowNew(false);
      setNewForm({ kpiId: 0, quarter: 1, actionDescription: "", dueDate: "", actionOwnerIds: "" });
      refetch();
      toast({ title: "Corrective action created" });
    } catch { toast({ title: "Error", variant: "destructive" }); }
  }

  async function handleUpdateStatus(id: number, status: string) {
    try {
      await updateAction.mutateAsync({ id, data: { status } });
      refetch();
      toast({ title: `Status updated to ${status}` });
    } catch { toast({ title: "Error", variant: "destructive" }); }
  }

  function openEdit(action: NonNullable<typeof actions>[number]) {
    setEditForm({
      actionDescription: action.actionDescription ?? "",
      dueDate: action.dueDate ?? "",
      actionOwnerIds: action.actionOwnerIds ?? "",
    });
    setEditingId(action.id);
    setShowEdit(true);
  }

  async function handleEdit() {
    if (!editingId || !editForm.actionDescription || !editForm.dueDate) return;
    try {
      await updateAction.mutateAsync({
        id: editingId,
        data: {
          actionDescription: editForm.actionDescription,
          dueDate: editForm.dueDate,
          actionOwnerIds: editForm.actionOwnerIds || undefined,
        }
      });
      setShowEdit(false);
      setEditingId(null);
      refetch();
      toast({ title: "Corrective action updated" });
    } catch { toast({ title: "Error", variant: "destructive" }); }
  }

  const overdueActions = actions?.filter(a => a.status !== "Completed" && new Date(a.dueDate) < new Date()) || [];

  return (
    <div className="space-y-6 animate-in fade-in-50 duration-300">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Corrective & Remedial Actions</h2>
          <p className="text-slate-500">Track corrective actions for underperforming KPIs</p>
        </div>
        <Button onClick={() => setShowNew(true)}><Plus className="w-4 h-4 mr-1" /> New Action</Button>
      </div>

      {overdueActions.length > 0 && (
        <Card className="bg-red-50 border-red-200">
          <CardContent className="p-4 flex items-center gap-3">
            <AlertTriangle className="w-6 h-6 text-red-600" />
            <div>
              <p className="font-semibold text-red-700">{overdueActions.length} Overdue Action{overdueActions.length > 1 ? 's' : ''}</p>
              <p className="text-sm text-red-600">Actions past their due date requiring attention</p>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="flex gap-3">
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-48"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="Open">Open</SelectItem>
            <SelectItem value="In Progress">In Progress</SelectItem>
            <SelectItem value="Completed">Completed</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-3">
        {actions?.map(action => {
          const isOverdue = action.status !== "Completed" && new Date(action.dueDate) < new Date();
          return (
            <Card key={action.id} className={isOverdue ? "border-red-300" : ""}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge className={isOverdue ? STATUS_COLORS.Overdue : STATUS_COLORS[action.status]}>
                        {isOverdue ? "Overdue" : action.status}
                      </Badge>
                      <Badge variant="outline">KPI #{action.kpiId}</Badge>
                      <Badge variant="outline">Q{action.quarter}</Badge>
                    </div>
                    <p className="font-medium text-slate-800">{action.actionDescription}</p>
                    <div className="flex gap-4 mt-2 text-xs text-slate-500">
                      <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> Due: {action.dueDate}</span>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    {action.status !== "Completed" && (
                      <Button variant="ghost" size="sm" onClick={() => openEdit(action)}>
                        <Pencil className="w-4 h-4 mr-1" /> Edit
                      </Button>
                    )}
                    {action.status === "Open" && (
                      <Button variant="ghost" size="sm" onClick={() => handleUpdateStatus(action.id, "In Progress")}>Start</Button>
                    )}
                    {action.status === "In Progress" && (
                      <Button variant="ghost" size="sm" className="text-green-600" onClick={() => handleUpdateStatus(action.id, "Completed")}>
                        <CheckCircle2 className="w-4 h-4 mr-1" /> Complete
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
        {(!actions || actions.length === 0) && (
          <Card className="border-dashed">
            <CardContent className="p-8 text-center text-slate-500">
              <CheckCircle2 className="w-12 h-12 mx-auto mb-3 text-slate-300" />
              <p className="font-medium">No corrective actions</p>
            </CardContent>
          </Card>
        )}
      </div>

      <Dialog open={showNew} onOpenChange={setShowNew}>
        <DialogContent>
          <DialogHeader><DialogTitle>New Corrective Action</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div><Label>KPI ID *</Label><Input type="number" value={newForm.kpiId || ""} onChange={e => setNewForm(p => ({ ...p, kpiId: Number(e.target.value) }))} /></div>
            <div>
              <Label>Quarter</Label>
              <Select value={String(newForm.quarter)} onValueChange={v => setNewForm(p => ({ ...p, quarter: Number(v) }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {[1, 2, 3, 4].map(q => <SelectItem key={q} value={String(q)}>Q{q}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div><Label>Action Description *</Label><Textarea value={newForm.actionDescription} onChange={e => setNewForm(p => ({ ...p, actionDescription: e.target.value }))} /></div>
            <div><Label>Due Date *</Label><Input type="date" value={newForm.dueDate} onChange={e => setNewForm(p => ({ ...p, dueDate: e.target.value }))} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNew(false)}>Cancel</Button>
            <Button onClick={handleCreate} disabled={!newForm.kpiId || !newForm.actionDescription || !newForm.dueDate}>Create</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showEdit} onOpenChange={v => { setShowEdit(v); if (!v) setEditingId(null); }}>
        <DialogContent>
          <DialogHeader><DialogTitle>Edit Corrective Action</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div><Label>Action Description *</Label><Textarea value={editForm.actionDescription} onChange={e => setEditForm(p => ({ ...p, actionDescription: e.target.value }))} /></div>
            <div><Label>Due Date *</Label><Input type="date" value={editForm.dueDate} onChange={e => setEditForm(p => ({ ...p, dueDate: e.target.value }))} /></div>
            <div><Label>Action Owner IDs</Label><Input value={editForm.actionOwnerIds} onChange={e => setEditForm(p => ({ ...p, actionOwnerIds: e.target.value }))} placeholder="Comma-separated IDs" /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setShowEdit(false); setEditingId(null); }}>Cancel</Button>
            <Button onClick={handleEdit} disabled={!editForm.actionDescription || !editForm.dueDate}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
