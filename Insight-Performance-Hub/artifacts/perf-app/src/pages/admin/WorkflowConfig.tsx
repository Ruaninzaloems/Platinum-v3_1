import { useState } from "react";
import {
  useListWorkflowConfigs, useCreateWorkflowConfig,
  useUpdateWorkflowConfig, useDeleteWorkflowConfig,
} from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { Plus, Trash2, Edit, GitBranch } from "lucide-react";

function getErrorMessage(e: unknown): string {
  if (e && typeof e === "object") {
    const obj = e as Record<string, unknown>;
    if (obj.response && typeof obj.response === "object") {
      const resp = obj.response as Record<string, unknown>;
      if (resp.data && typeof resp.data === "object") {
        const data = resp.data as Record<string, unknown>;
        if (typeof data.error === "string") return data.error;
      }
    }
    if (obj.message && typeof obj.message === "string") return obj.message;
  }
  return "An error occurred";
}

export default function WorkflowConfig() {
  const { toast } = useToast();
  const [showCreate, setShowCreate] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [form, setForm] = useState({ stepName: "", stepOrder: 1, requiredRole: "", description: "", isActive: true });

  const { data: configs, refetch } = useListWorkflowConfigs();
  const createConfig = useCreateWorkflowConfig();
  const updateConfig = useUpdateWorkflowConfig();
  const deleteConfig = useDeleteWorkflowConfig();

  const handleSave = async () => {
    try {
      if (editId) {
        await updateConfig.mutateAsync({
          id: editId,
          data: {
            stepName: form.stepName,
            stepOrder: form.stepOrder,
            requiredRole: form.requiredRole,
            description: form.description || undefined,
            isActive: form.isActive,
          },
        });
        toast({ title: "Step updated" });
      } else {
        await createConfig.mutateAsync({
          data: {
            stepName: form.stepName,
            stepOrder: form.stepOrder,
            requiredRole: form.requiredRole,
            description: form.description || undefined,
            isActive: form.isActive,
          },
        });
        toast({ title: "Step created" });
      }
      setShowCreate(false);
      setEditId(null);
      setForm({ stepName: "", stepOrder: 1, requiredRole: "", description: "", isActive: true });
      refetch();
    } catch (e: unknown) {
      toast({ title: "Error", description: getErrorMessage(e), variant: "destructive" });
    }
  };

  const handleEdit = (config: NonNullable<typeof configs>[number]) => {
    setEditId(config.id);
    setForm({
      stepName: config.stepName,
      stepOrder: config.stepOrder,
      requiredRole: config.requiredRole,
      description: config.description || "",
      isActive: config.isActive,
    });
    setShowCreate(true);
  };

  const handleDelete = async (id: number) => {
    try {
      await deleteConfig.mutateAsync({ id });
      toast({ title: "Step deleted" });
      refetch();
    } catch (e: unknown) {
      toast({ title: "Error", description: getErrorMessage(e), variant: "destructive" });
    }
  };

  const sorted = [...(configs || [])].sort((a, b) => a.stepOrder - b.stepOrder);

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <GitBranch className="w-7 h-7 text-blue-600" /> Workflow Configuration
          </h1>
          <p className="text-slate-500 mt-1">Define approval workflow steps and role requirements</p>
        </div>
        <Button onClick={() => { setEditId(null); setForm({ stepName: "", stepOrder: (sorted.length + 1), requiredRole: "", description: "", isActive: true }); setShowCreate(true); }}>
          <Plus className="w-4 h-4 mr-1" /> Add Step
        </Button>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-lg">Workflow Steps</CardTitle></CardHeader>
        <CardContent>
          {!sorted.length ? (
            <p className="text-sm text-slate-400 text-center py-6">No workflow steps configured</p>
          ) : (
            <div className="space-y-3">
              {sorted.map((config, idx) => (
                <div key={config.id} className="flex items-center gap-4 p-4 border rounded-lg">
                  <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-sm">
                    {config.stepOrder}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className="font-semibold text-slate-800">{config.stepName}</p>
                      <Badge className={config.isActive ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-700"}>
                        {config.isActive ? "Active" : "Inactive"}
                      </Badge>
                    </div>
                    {config.description && <p className="text-sm text-slate-500">{config.description}</p>}
                    <p className="text-xs text-slate-400 mt-1">Required role: <span className="font-medium">{config.requiredRole}</span></p>
                  </div>
                  {idx < sorted.length - 1 && (
                    <div className="text-slate-300 text-lg">→</div>
                  )}
                  <div className="flex gap-2">
                    <Button variant="ghost" size="sm" onClick={() => handleEdit(config)}><Edit className="w-4 h-4" /></Button>
                    <Button variant="ghost" size="sm" onClick={() => handleDelete(config.id)}><Trash2 className="w-4 h-4 text-red-400" /></Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={showCreate} onOpenChange={v => { setShowCreate(v); if (!v) setEditId(null); }}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editId ? "Edit" : "New"} Workflow Step</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div><Label>Step Name</Label><Input value={form.stepName} onChange={e => setForm(p => ({ ...p, stepName: e.target.value }))} /></div>
            <div><Label>Step Order</Label><Input type="number" value={form.stepOrder} onChange={e => setForm(p => ({ ...p, stepOrder: Number(e.target.value) }))} /></div>
            <div><Label>Required Role</Label><Input value={form.requiredRole} onChange={e => setForm(p => ({ ...p, requiredRole: e.target.value }))} placeholder="e.g., department_head, city_manager" /></div>
            <div><Label>Description</Label><Input value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} /></div>
            <div className="flex items-center gap-2">
              <Switch checked={form.isActive} onCheckedChange={v => setForm(p => ({ ...p, isActive: v }))} />
              <Label>Active</Label>
            </div>
          </div>
          <DialogFooter><Button onClick={handleSave}>{editId ? "Update" : "Create"}</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
