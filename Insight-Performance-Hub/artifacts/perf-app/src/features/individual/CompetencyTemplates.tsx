import { useState } from "react";
import {
  useListCompetencyTemplates, useCreateCompetencyTemplate, useUpdateCompetencyTemplate,
  useListCompetencyItems, useCreateCompetencyItem, useDeleteCompetencyItem,
} from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/core/hooks/use-toast";
import { Plus, Trash2, ChevronRight, BookOpen, Pencil } from "lucide-react";

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

export default function CompetencyTemplates() {
  const { toast } = useToast();
  const [selectedTemplateId, setSelectedTemplateId] = useState<number | undefined>();
  const [showCreate, setShowCreate] = useState(false);
  const [showEditTemplate, setShowEditTemplate] = useState(false);
  const [showAddItem, setShowAddItem] = useState(false);
  const [form, setForm] = useState({ name: "", description: "", postLevel: "" });
  const [editTemplateForm, setEditTemplateForm] = useState({ name: "", description: "", postLevel: "" });
  const [itemForm, setItemForm] = useState({ competencyName: "", description: "", weighting: 0 });

  const { data: templates, refetch } = useListCompetencyTemplates();
  const { data: items, refetch: refetchItems } = useListCompetencyItems(selectedTemplateId || 0);
  const createTemplate = useCreateCompetencyTemplate();
  const updateTemplate = useUpdateCompetencyTemplate();
  const createItem = useCreateCompetencyItem();
  const deleteItem = useDeleteCompetencyItem();

  const selectedTemplate = templates?.find(t => t.id === selectedTemplateId);

  const handleCreate = async () => {
    try {
      await createTemplate.mutateAsync({ data: { name: form.name, description: form.description || undefined, postLevel: form.postLevel || undefined } });
      toast({ title: "Template created" });
      setShowCreate(false);
      setForm({ name: "", description: "", postLevel: "" });
      refetch();
    } catch (e: unknown) {
      toast({ title: "Error", description: getErrorMessage(e), variant: "destructive" });
    }
  };

  const openEditTemplate = () => {
    if (!selectedTemplate) return;
    setEditTemplateForm({
      name: selectedTemplate.name ?? "",
      description: selectedTemplate.description ?? "",
      postLevel: selectedTemplate.postLevel ?? "",
    });
    setShowEditTemplate(true);
  };

  const handleUpdateTemplate = async () => {
    if (!selectedTemplateId) return;
    try {
      await updateTemplate.mutateAsync({
        id: selectedTemplateId,
        data: {
          name: editTemplateForm.name,
          description: editTemplateForm.description || undefined,
          postLevel: editTemplateForm.postLevel || undefined,
        }
      });
      toast({ title: "Template updated" });
      setShowEditTemplate(false);
      refetch();
    } catch (e: unknown) {
      toast({ title: "Error", description: getErrorMessage(e), variant: "destructive" });
    }
  };

  const handleAddItem = async () => {
    if (!selectedTemplateId) return;
    try {
      await createItem.mutateAsync({ templateId: selectedTemplateId, data: itemForm });
      toast({ title: "Competency added" });
      setShowAddItem(false);
      setItemForm({ competencyName: "", description: "", weighting: 0 });
      refetchItems();
    } catch (e: unknown) {
      toast({ title: "Error", description: getErrorMessage(e), variant: "destructive" });
    }
  };

  if (selectedTemplateId && selectedTemplate) {
    return (
      <div className="space-y-6 animate-in fade-in duration-300">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => setSelectedTemplateId(undefined)}>
            <ChevronRight className="w-4 h-4 rotate-180 mr-1" /> Back
          </Button>
          <div>
            <h2 className="text-xl font-bold text-slate-800">{selectedTemplate.name}</h2>
            {selectedTemplate.postLevel && <p className="text-sm text-slate-500">Post Level: {selectedTemplate.postLevel}</p>}
          </div>
          <Badge className={selectedTemplate.isActive ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-700"}>
            {selectedTemplate.isActive ? "Active" : "Inactive"}
          </Badge>
          <div className="ml-auto flex gap-2">
            <Button size="sm" variant="outline" onClick={openEditTemplate}><Pencil className="w-4 h-4 mr-1" /> Edit Template</Button>
            <Button size="sm" onClick={() => setShowAddItem(true)}><Plus className="w-4 h-4 mr-1" /> Add Competency</Button>
          </div>
        </div>

        <Card>
          <CardHeader><CardTitle className="text-lg">Competencies</CardTitle></CardHeader>
          <CardContent>
            {!items?.length ? (
              <p className="text-sm text-slate-400 text-center py-4">No competencies defined</p>
            ) : (
              <div className="space-y-3">
                {items.map(item => (
                  <div key={item.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                    <div>
                      <p className="font-medium text-slate-800">{item.competencyName}</p>
                      {item.description && <p className="text-sm text-slate-500">{item.description}</p>}
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge variant="outline">{item.weighting}%</Badge>
                      <Button variant="ghost" size="sm" onClick={async () => { await deleteItem.mutateAsync({ id: item.id }); refetchItems(); }}>
                        <Trash2 className="w-4 h-4 text-red-400" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Dialog open={showAddItem} onOpenChange={setShowAddItem}>
          <DialogContent>
            <DialogHeader><DialogTitle>Add Competency</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div><Label>Competency Name</Label><Input value={itemForm.competencyName} onChange={e => setItemForm(p => ({ ...p, competencyName: e.target.value }))} /></div>
              <div><Label>Description</Label><Input value={itemForm.description} onChange={e => setItemForm(p => ({ ...p, description: e.target.value }))} /></div>
              <div><Label>Weighting (%)</Label><Input type="number" value={itemForm.weighting} onChange={e => setItemForm(p => ({ ...p, weighting: Number(e.target.value) }))} /></div>
            </div>
            <DialogFooter><Button onClick={handleAddItem}>Add</Button></DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Competency Templates</h1>
          <p className="text-slate-500 mt-1">Define competency frameworks by post level</p>
        </div>
        <Button onClick={() => setShowCreate(true)}><Plus className="w-4 h-4 mr-1" /> New Template</Button>
      </div>

      {!templates?.length ? (
        <Card><CardContent className="py-12 text-center text-slate-400">No templates defined yet</CardContent></Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {templates.map(t => (
            <Card key={t.id} className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setSelectedTemplateId(t.id)}>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3 mb-2">
                  <BookOpen className="w-5 h-5 text-slate-400" />
                  <p className="font-semibold text-slate-800">{t.name}</p>
                </div>
                {t.description && <p className="text-sm text-slate-500 mb-2">{t.description}</p>}
                <div className="flex items-center gap-2">
                  {t.postLevel && <Badge variant="outline">{t.postLevel}</Badge>}
                  <Badge className={t.isActive ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-700"}>{t.isActive ? "Active" : "Inactive"}</Badge>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent>
          <DialogHeader><DialogTitle>New Competency Template</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div><Label>Name</Label><Input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} /></div>
            <div><Label>Description</Label><Input value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} /></div>
            <div><Label>Post Level</Label><Input value={form.postLevel} onChange={e => setForm(p => ({ ...p, postLevel: e.target.value }))} placeholder="e.g., Senior Manager" /></div>
          </div>
          <DialogFooter><Button onClick={handleCreate}>Create</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showEditTemplate} onOpenChange={setShowEditTemplate}>
        <DialogContent>
          <DialogHeader><DialogTitle>Edit Competency Template</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div><Label>Name</Label><Input value={editTemplateForm.name} onChange={e => setEditTemplateForm(p => ({ ...p, name: e.target.value }))} /></div>
            <div><Label>Description</Label><Input value={editTemplateForm.description} onChange={e => setEditTemplateForm(p => ({ ...p, description: e.target.value }))} /></div>
            <div><Label>Post Level</Label><Input value={editTemplateForm.postLevel} onChange={e => setEditTemplateForm(p => ({ ...p, postLevel: e.target.value }))} placeholder="e.g., Senior Manager" /></div>
          </div>
          <DialogFooter><Button onClick={handleUpdateTemplate}>Save Changes</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
