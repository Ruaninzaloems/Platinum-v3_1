import { useState } from "react";
import { useListAuditLogs } from "@workspace/api-client-react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ShieldAlert, Search, Filter, Loader2, ArrowRight } from "lucide-react";
import { format } from "date-fns";

export default function AuditTrail() {
  const [searchTerm, setSearchTerm] = useState("");
  // Pass empty object since generated types expect ListAuditLogsParams
  const { data, isLoading } = useListAuditLogs({});

  const logs = data?.data || [];
  
  const filteredLogs = logs.filter(log => 
    log.userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    log.entityType.toLowerCase().includes(searchTerm.toLowerCase()) ||
    log.action.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-2xl shadow-sm border border-border">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-3">
            <div className="p-2 bg-slate-100 text-slate-700 rounded-lg"><ShieldAlert className="w-6 h-6" /></div>
            System Audit Trail
          </h1>
          <p className="text-slate-500 mt-1">Immutable log of all critical system actions.</p>
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-64">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <Input 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search logs..." 
              className="pl-9 h-11 rounded-xl"
            />
          </div>
          <button className="h-11 px-4 border border-border rounded-xl flex items-center gap-2 hover:bg-slate-50 text-slate-600 font-medium">
            <Filter className="w-4 h-4" /> Filter
          </button>
        </div>
      </div>

      <Card className="platinum-card overflow-hidden">
        {isLoading ? (
          <div className="flex justify-center p-12"><Loader2 className="w-8 h-8 animate-spin text-platinum-primary" /></div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-slate-500 uppercase bg-slate-50 border-b border-border font-semibold">
                <tr>
                  <th className="px-6 py-4">Timestamp</th>
                  <th className="px-6 py-4">User</th>
                  <th className="px-6 py-4">Action</th>
                  <th className="px-6 py-4">Entity</th>
                  <th className="px-6 py-4">Changes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredLogs.length === 0 && (
                  <tr><td colSpan={5} className="px-6 py-12 text-center text-slate-500">No audit logs found.</td></tr>
                )}
                {filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/50">
                    <td className="px-6 py-4 text-slate-500 font-mono text-xs">
                      {format(new Date(log.timestamp), 'dd MMM yyyy HH:mm:ss')}
                    </td>
                    <td className="px-6 py-4 font-medium text-slate-900">{log.userName}</td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider ${
                        log.action === 'CREATE' ? 'bg-green-100 text-green-800' :
                        log.action === 'UPDATE' ? 'bg-blue-100 text-blue-800' :
                        log.action === 'DELETE' ? 'bg-red-100 text-red-800' :
                        'bg-slate-100 text-slate-800'
                      }`}>
                        {log.action}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="font-semibold text-slate-700">{log.entityType}</span>
                      <span className="text-slate-400 ml-1">#{log.entityId}</span>
                    </td>
                    <td className="px-6 py-4">
                      {log.oldValue && log.newValue ? (
                        <div className="flex items-center gap-2 text-xs">
                          <span className="bg-red-50 text-red-700 px-2 py-1 rounded border border-red-100 truncate max-w-[150px]">{log.oldValue}</span>
                          <ArrowRight className="w-3 h-3 text-slate-400" />
                          <span className="bg-green-50 text-green-700 px-2 py-1 rounded border border-green-100 truncate max-w-[150px]">{log.newValue}</span>
                        </div>
                      ) : (
                        <span className="text-slate-400 text-xs italic">Raw data captured</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
