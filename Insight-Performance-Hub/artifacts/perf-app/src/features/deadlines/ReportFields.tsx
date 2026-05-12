import { useState } from "react";
import { useListReportFields, useCreateReportField, useUpdateReportField, useDeleteReportField, useListCycles, getListReportFieldsQueryKey, type CreateReportFieldInput } from "@workspace/api-client-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Plus, Pencil, Trash2, Loader2, FileText } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/core/hooks/use-toast";

export default function ReportFields() {
  const { data: cycles } = useListCycles();
  const activeCycle = cycles?.find(c => c.status === "Open") || cycles?.[0];
  const { data: fields, isLoading } = useListReportFields({ cycleId: activeCycle?.id });
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const deleteMut = useDeleteReportField();
  const qc = useQueryClient();
  const { toast } = useToast();

  if (isLoading) return <div className="flex p-8 justify-center"><Loader2 className="w-8 h-8 animate-spin text-platinum-primary" /></div>;

  const handleDelete = (id: number) => {
    deleteMut.mutate({ id }, { onSuccess: () => { qc.invalidateQueries({ queryKey: getListReportFieldsQueryKey() }); toast({ title: "Deleted" }); } });
  };

  const groupedFields = {
    quarterly: fields?.filter(f => f.reportType === "quarterly") || [],
    midYear: fields?.filter(f => f.reportType === "midYear") || [],
    annual: fields?.filter(f => f.reportType === "annual") || [],
  };

  return (
    <div className="space-y-6 animate-in fade-in">
      <div className="flex justify-between items-center bg-white p-6 rounded-2xl shadow-sm border border-border">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-3">
            <div className="p-2 bg-cyan-50 text-cyan-600 rounded-lg"><FileText className="w-6 h-6" /></div>
            Report Fields
          </h1>
          <p className="text-slate-500 mt-1">Configure custom fields for quarterly, mid-year, and annual reports.</p>
        </div>
        {activeCycle && <FieldDialog open={isDialogOpen} onOpenChange={setIsDialogOpen} editingId={editingId} setEditingId={setEditingId} fields={fields} cycleId={activeCycle.id} />}
      </div>
      {Object.entries(groupedFields).map(([type, items]) => (
        <Card key={type} className="platinum-card overflow-hidden">
          <div className="bg-slate-50 border-b border-border p-4">
            <h3 className="font-bold text-slate-800 capitalize">{type === "midYear" ? "Mid-Year" : type} Report Fields</h3>
          </div>
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-slate-500 uppercase font-semibold">
              <tr>
                <th className="px-6 py-3">Field Name</th>
                <th className="px-6 py-3">Label</th>
                <th className="px-6 py-3">Type</th>
                <th className="px-6 py-3">Required</th>
                <th className="px-6 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {items.length === 0 && <tr><td colSpan={5} className="px-6 py-6 text-center text-slate-400">No fields configured.</td></tr>}
              {items.map((f) => (
                <tr key={f.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-6 py-4 font-mono text-slate-700">{f.fieldName}</td>
                  <td className="px-6 py-4 font-medium text-slate-900">{f.fieldLabel}</td>
                  <td className="px-6 py-4 text-slate-500">{f.fieldType}</td>
                  <td className="px-6 py-4"><span className={`text-xs font-bold ${f.isRequired ? "text-green-600" : "text-slate-400"}`}>{f.isRequired ? "Yes" : "No"}</span></td>
                  <td className="px-6 py-4 text-right space-x-2">
                    <Button variant="ghost" size="sm" className="text-blue-600" onClick={() => { setEditingId(f.id); setIsDialogOpen(true); }}><Pencil className="w-4 h-4" /></Button>
                    <Button variant="ghost" size="sm" className="text-red-500" onClick={() => handleDelete(f.id)}><Trash2 className="w-4 h-4" /></Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      ))}
    </div>
  );
}

interface FieldDialogProps {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  editingId: number | null;
  setEditingId: (id: number | null) => void;
  fields: { id: number; reportType: string; fieldName: string; fieldLabel: string; fieldType: string; isRequired: boolean; sortOrder: number; cycleId: number }[] | undefined;
  cycleId: number;
}

function FieldDialog({ open, onOpenChange, editingId, setEditingId, fields, cycleId }: FieldDialogProps) {
  const qc = useQueryClient();
  const { toast } = useToast();
  const createMut = useCreateReportField();
  const updateMut = useUpdateReportField();
  const f = editingId ? fields?.find((x) => x.id === editingId) : null;
  const isPending = createMut.isPending || updateMut.isPending;

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const data = { cycleId, reportType: fd.get("reportType") as string as CreateReportFieldInput["reportType"], fieldName: fd.get("fieldName") as string, fieldLabel: fd.get("fieldLabel") as string, fieldType: fd.get("fieldType") as string as CreateReportFieldInput["fieldType"], isRequired: fd.get("isRequired") === "on", sortOrder: parseInt(fd.get("sortOrder") as string) || 0 };
    const onSuccess = () => { qc.invalidateQueries({ queryKey: getListReportFieldsQueryKey() }); onOpenChange(false); setEditingId(null); toast({ title: "Saved" }); };
    if (editingId) updateMut.mutate({ id: editingId, data }, { onSuccess });
    else createMut.mutate({ data }, { onSuccess });
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { onOpenChange(v); if (!v) setEditingId(null); }}>
      <DialogTrigger asChild><Button className="bg-platinum-primary rounded-xl"><Plus className="w-4 h-4 mr-2" /> Add Field</Button></DialogTrigger>
      <DialogContent className="rounded-2xl">
        <DialogHeader><DialogTitle>{editingId ? "Edit" : "Create"} Report Field</DialogTitle></DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-500 uppercase">Report Type</label>
              <Select name="reportType" defaultValue={f?.reportType || "quarterly"}>
                <SelectTrigger className="h-11 rounded-xl"><SelectValue /></SelectTrigger>
                <SelectContent><SelectItem value="quarterly">Quarterly</SelectItem><SelectItem value="midYear">Mid-Year</SelectItem><SelectItem value="annual">Annual</SelectItem></SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-500 uppercase">Field Type</label>
              <Select name="fieldType" defaultValue={f?.fieldType || "text"}>
                <SelectTrigger className="h-11 rounded-xl"><SelectValue /></SelectTrigger>
                <SelectContent><SelectItem value="text">Text</SelectItem><SelectItem value="textarea">Textarea</SelectItem><SelectItem value="number">Number</SelectItem><SelectItem value="date">Date</SelectItem><SelectItem value="select">Select</SelectItem></SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2"><label className="text-xs font-bold text-slate-500 uppercase">Field Name</label><Input name="fieldName" required defaultValue={f?.fieldName} placeholder="e.g. challenges" className="h-11 rounded-xl" /></div>
            <div className="space-y-2"><label className="text-xs font-bold text-slate-500 uppercase">Field Label</label><Input name="fieldLabel" required defaultValue={f?.fieldLabel} placeholder="e.g. Challenges" className="h-11 rounded-xl" /></div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center gap-3 pt-4"><Switch name="isRequired" defaultChecked={f?.isRequired} /><label className="text-sm font-medium text-slate-700">Required</label></div>
            <div className="space-y-2"><label className="text-xs font-bold text-slate-500 uppercase">Sort Order</label><Input type="number" name="sortOrder" defaultValue={f?.sortOrder || 0} className="h-11 rounded-xl" /></div>
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
