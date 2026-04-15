import { useState, useEffect } from "react";
import {
  useGetAiDashboard, useGetAtRiskKpis, useGetNarrativeSummary,
  useGetEvidenceGaps, useGetAlignmentCheck, useListAiInsightLog,
  useListCycles,
} from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AlertTriangle, TrendingUp, FileSearch, Link2, Brain, Activity } from "lucide-react";

const RISK_COLORS: Record<string, string> = {
  high: "bg-red-100 text-red-700",
  medium: "bg-yellow-100 text-yellow-700",
  low: "bg-green-100 text-green-700",
};

export default function AiInsights() {
  const { data: cycles } = useListCycles();
  const [selectedCycleId, setSelectedCycleId] = useState<number | undefined>();

  useEffect(() => {
    if (cycles && cycles.length > 0 && !selectedCycleId) {
      const open = cycles.find(c => c.status === "Open");
      setSelectedCycleId((open ?? cycles[0]).id);
    }
  }, [cycles]);

  const cycleId = selectedCycleId || 0;

  const { data: dashboard } = useGetAiDashboard({ cycleId: cycleId || 0 });
  const { data: atRisk } = useGetAtRiskKpis({ cycleId: cycleId || 0 });
  const { data: narrative } = useGetNarrativeSummary({ cycleId: cycleId || 0 });
  const { data: gaps } = useGetEvidenceGaps({ cycleId: cycleId || 0 });
  const { data: alignment } = useGetAlignmentCheck({ cycleId: cycleId || 0 });
  const { data: logs } = useListAiInsightLog({ cycleId: selectedCycleId });

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <Brain className="w-7 h-7 text-purple-600" /> AI Advisory Dashboard
          </h1>
          <p className="text-slate-500 mt-1">AI-powered performance analytics and advisory insights</p>
        </div>
        <Select value={selectedCycleId ? String(selectedCycleId) : "none"} onValueChange={v => setSelectedCycleId(v === "none" ? undefined : Number(v))}>
          <SelectTrigger className="w-[220px]"><SelectValue placeholder="Select cycle" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="none">Select Cycle</SelectItem>
            {cycles?.map(c => <SelectItem key={c.id} value={String(c.id)}>{c.financialYearLabel}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {!selectedCycleId ? (
        <Card><CardContent className="py-16 text-center text-slate-400">
          <Brain className="w-12 h-12 mx-auto mb-4 text-slate-300" />
          <p className="text-lg font-medium">Select a performance cycle to generate AI insights</p>
        </CardContent></Card>
      ) : (
        <>
          <div className="grid grid-cols-4 gap-4">
            <Card className="border-l-4 border-l-red-500">
              <CardContent className="pt-4">
                <p className="text-sm text-slate-500">High Risk KPIs</p>
                <p className="text-3xl font-bold text-red-600">{dashboard?.riskSummary?.high ?? 0}</p>
              </CardContent>
            </Card>
            <Card className="border-l-4 border-l-yellow-500">
              <CardContent className="pt-4">
                <p className="text-sm text-slate-500">Medium Risk KPIs</p>
                <p className="text-3xl font-bold text-yellow-600">{dashboard?.riskSummary?.medium ?? 0}</p>
              </CardContent>
            </Card>
            <Card className="border-l-4 border-l-green-500">
              <CardContent className="pt-4">
                <p className="text-sm text-slate-500">On Track</p>
                <p className="text-3xl font-bold text-green-600">{dashboard?.riskSummary?.low ?? 0}</p>
              </CardContent>
            </Card>
            <Card className="border-l-4 border-l-purple-500">
              <CardContent className="pt-4">
                <p className="text-sm text-slate-500">Alignment Score</p>
                <p className="text-3xl font-bold text-purple-600">{alignment?.overallScore ?? "—"}%</p>
              </CardContent>
            </Card>
          </div>

          {dashboard?.topRecommendations && dashboard.topRecommendations.length > 0 && (
            <Card className="bg-purple-50 border-purple-200">
              <CardContent className="pt-4">
                <p className="text-sm font-semibold text-purple-700 mb-2">Top Recommendations</p>
                <ul className="space-y-1">
                  {dashboard.topRecommendations.map((r, i) => (
                    <li key={i} className="text-sm text-purple-800 flex items-start gap-2">
                      <span className="text-purple-400 mt-0.5">•</span> {r}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}

          <Tabs defaultValue="risk">
            <TabsList>
              <TabsTrigger value="risk"><AlertTriangle className="w-4 h-4 mr-1" /> At-Risk KPIs</TabsTrigger>
              <TabsTrigger value="narrative"><TrendingUp className="w-4 h-4 mr-1" /> Narrative</TabsTrigger>
              <TabsTrigger value="evidence"><FileSearch className="w-4 h-4 mr-1" /> Evidence Gaps</TabsTrigger>
              <TabsTrigger value="alignment"><Link2 className="w-4 h-4 mr-1" /> Alignment</TabsTrigger>
              <TabsTrigger value="log"><Activity className="w-4 h-4 mr-1" /> Insight Log</TabsTrigger>
            </TabsList>

            <TabsContent value="risk" className="mt-4">
              <Card>
                <CardHeader><CardTitle>At-Risk KPI Analysis</CardTitle></CardHeader>
                <CardContent>
                  {atRisk?.summary && <p className="text-sm text-slate-600 mb-4 bg-slate-50 p-3 rounded">{atRisk.summary}</p>}
                  {!atRisk?.atRiskKpis?.length ? (
                    <p className="text-slate-400 text-center py-4">No at-risk KPIs detected</p>
                  ) : (
                    <div className="space-y-3">
                      {atRisk.atRiskKpis.map((k, i) => (
                        <div key={i} className="p-4 border rounded-lg">
                          <div className="flex items-center justify-between mb-2">
                            <p className="font-medium text-slate-800">{k.kpiDescription}</p>
                            <Badge className={RISK_COLORS[k.riskLevel || "low"]}>{k.riskLevel}</Badge>
                          </div>
                          <p className="text-sm text-slate-500">{k.department} — Score: {k.currentScore ?? "N/A"}</p>
                          <p className="text-sm text-slate-600 mt-1">{k.reason}</p>
                          <p className="text-sm text-blue-600 mt-1 font-medium">{k.recommendation}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="narrative" className="mt-4">
              <Card>
                <CardHeader><CardTitle>Executive Narrative Summary</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                  {narrative?.narrative && <p className="text-slate-700 bg-slate-50 p-4 rounded-lg leading-relaxed">{narrative.narrative}</p>}
                  {narrative?.highlights && narrative.highlights.length > 0 && (
                    <div>
                      <p className="text-sm font-semibold text-green-700 mb-1">Highlights</p>
                      {narrative.highlights.map((h, i) => <p key={i} className="text-sm text-slate-600">✓ {h}</p>)}
                    </div>
                  )}
                  {narrative?.concerns && narrative.concerns.length > 0 && (
                    <div>
                      <p className="text-sm font-semibold text-red-700 mb-1">Concerns</p>
                      {narrative.concerns.map((c, i) => <p key={i} className="text-sm text-slate-600">⚠ {c}</p>)}
                    </div>
                  )}
                  {narrative?.recommendations && narrative.recommendations.length > 0 && (
                    <div>
                      <p className="text-sm font-semibold text-blue-700 mb-1">Recommendations</p>
                      {narrative.recommendations.map((r, i) => <p key={i} className="text-sm text-slate-600">→ {r}</p>)}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="evidence" className="mt-4">
              <Card>
                <CardHeader><CardTitle>Evidence Gap Analysis</CardTitle></CardHeader>
                <CardContent>
                  {gaps?.summary && <p className="text-sm text-slate-600 mb-4 bg-slate-50 p-3 rounded">{gaps.summary}</p>}
                  {!gaps?.gaps?.length ? (
                    <p className="text-slate-400 text-center py-4">No evidence gaps detected</p>
                  ) : (
                    <table className="w-full text-sm">
                      <thead><tr className="border-b text-slate-500"><th className="text-left py-2 px-2">KPI</th><th className="text-left py-2 px-2">Department</th><th className="text-left py-2 px-2">Quarter</th><th className="text-left py-2 px-2">Gap</th><th className="text-left py-2 px-2">Severity</th><th className="text-left py-2 px-2">Suggestion</th></tr></thead>
                      <tbody>
                        {gaps.gaps.map((g, i) => (
                          <tr key={i} className="border-b last:border-0 hover:bg-slate-50">
                            <td className="py-2 px-2">{g.kpiDescription}</td>
                            <td className="py-2 px-2">{g.department}</td>
                            <td className="py-2 px-2">Q{g.quarter}</td>
                            <td className="py-2 px-2"><Badge variant="outline">{g.gapType}</Badge></td>
                            <td className="py-2 px-2"><Badge className={RISK_COLORS[g.severity || "low"]}>{g.severity}</Badge></td>
                            <td className="py-2 px-2 text-xs text-slate-500">{g.suggestion}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="alignment" className="mt-4">
              <Card>
                <CardHeader><CardTitle>Cross-Module Alignment Check</CardTitle></CardHeader>
                <CardContent>
                  {alignment?.summary && <p className="text-sm text-slate-600 mb-4 bg-slate-50 p-3 rounded">{alignment.summary}</p>}
                  {!alignment?.alignmentIssues?.length ? (
                    <p className="text-slate-400 text-center py-4">No alignment issues detected</p>
                  ) : (
                    <div className="space-y-3">
                      {alignment.alignmentIssues.map((issue, i) => (
                        <div key={i} className="p-4 border rounded-lg">
                          <div className="flex items-center justify-between mb-2">
                            <p className="font-medium text-slate-800">{issue.sourceModule} → {issue.targetModule}</p>
                            <Badge className={RISK_COLORS[issue.severity || "low"]}>{issue.severity}</Badge>
                          </div>
                          <p className="text-sm text-slate-600">{issue.issue}</p>
                          <p className="text-sm text-blue-600 mt-1">{issue.recommendation}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="log" className="mt-4">
              <Card>
                <CardHeader><CardTitle>AI Insight Log</CardTitle></CardHeader>
                <CardContent>
                  {!logs?.length ? (
                    <p className="text-slate-400 text-center py-4">No insights generated yet</p>
                  ) : (
                    <table className="w-full text-sm">
                      <thead><tr className="border-b text-slate-500"><th className="text-left py-2 px-2">Type</th><th className="text-left py-2 px-2">Summary</th><th className="text-left py-2 px-2">Risk</th><th className="text-left py-2 px-2">Generated</th></tr></thead>
                      <tbody>
                        {logs.map(l => (
                          <tr key={l.id} className="border-b last:border-0 hover:bg-slate-50">
                            <td className="py-2 px-2"><Badge variant="outline">{l.insightType}</Badge></td>
                            <td className="py-2 px-2 text-slate-600">{l.summary || "—"}</td>
                            <td className="py-2 px-2">{l.riskLevel ? <Badge className={RISK_COLORS[l.riskLevel]}>{l.riskLevel}</Badge> : "—"}</td>
                            <td className="py-2 px-2 text-xs text-slate-400">{l.createdAt}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </>
      )}
    </div>
  );
}
