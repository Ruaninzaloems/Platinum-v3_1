import { Switch, Route, Router as WouterRouter } from "wouter";
import { type ComponentType } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AppLayout } from "@/layout/AppLayout";
import { useAuth } from "@/core/hooks/useAuth";
import NotFound from "@/features/not-found";

import Dashboard from "@/features/dashboard/Dashboard";
import PerformanceCycles from "@/features/config/PerformanceCycles";
import KpiGroups from "@/features/config/KpiGroups";
import UnitsOfMeasure from "@/features/config/UnitsOfMeasure";
import DataTypes from "@/features/config/DataTypes";
import ProgressStatuses from "@/features/config/ProgressStatuses";
import ScorecardTypes from "@/features/config/ScorecardTypes";
import NkpaWeightings from "@/features/weightings/NkpaWeightings";
import CompetencyRequirements from "@/features/weightings/CompetencyRequirements";
import SubmissionDeadlines from "@/features/deadlines/SubmissionDeadlines";
import ReportFields from "@/features/deadlines/ReportFields";
import NotificationCentre from "@/features/notifications/NotificationCentre";
import NotificationConfig from "@/features/notifications/NotificationConfig";
import AuditTrail from "@/features/audit/AuditTrail";
import OrgKpiPlanning from "@/features/scorecards/OrgKpiPlanning";
import ReviewSdbip from "@/features/scorecards/ReviewSdbip";
import ApproveSdbip from "@/features/scorecards/ApproveSdbip";
import ReviseSdbipCapture from "@/features/scorecards/ReviseSdbipCapture";
import ReviseSdbipReview from "@/features/scorecards/ReviseSdbipReview";
import ReviseSdbipApprove from "@/features/scorecards/ReviseSdbipApprove";
import SdbipOverview from "@/features/sdbip/SdbipOverview";
import ActualsCapture from "@/features/actuals/ActualsCapture";
import CorrectiveActions from "@/features/actuals/CorrectiveActions";
import ReviewLineManager from "@/features/actuals/ReviewLineManager";
import ReviewDirector from "@/features/actuals/ReviewDirector";
import ReviewPmsManager from "@/features/actuals/ReviewPmsManager";
import ReviewPmsDirector from "@/features/actuals/ReviewPmsDirector";
import ReviewInternalAudit from "@/features/actuals/ReviewInternalAudit";
import MonthlyActivities from "@/features/scorecards/MonthlyActivities";
import DeptScorecards from "@/features/departmental/DeptScorecards";
import ReviewQueue from "@/features/moderation/ReviewQueue";
import ModerationPanel from "@/features/moderation/ModerationPanel";
import ReportCentre from "@/features/reports/ReportCentre";
import IndividualAgreements from "@/features/individual/IndividualAgreements";
import ReviewerConfig from "@/features/individual/ReviewerConfig";
import CompetencyTemplates from "@/features/individual/CompetencyTemplates";
import IndividualAssessment from "@/features/individual/IndividualAssessment";
import AiInsights from "@/features/ai/AiInsights";
import IntegrationHub from "@/features/integrations/IntegrationHub";
import WorkflowConfig from "@/features/admin/WorkflowConfig";

const AccessDenied = () => (
  <div className="flex flex-col items-center justify-center h-[60vh] text-center animate-in zoom-in-95 duration-500">
    <div className="w-20 h-20 bg-red-50 rounded-3xl flex items-center justify-center mb-6 shadow-inner">
      <span className="text-3xl">🔒</span>
    </div>
    <h2 className="text-2xl font-bold text-slate-800">Access Denied</h2>
    <p className="text-slate-500 mt-2 max-w-md">You do not have permission to access this section. Contact your administrator for access.</p>
  </div>
);

function ProtectedRoute({ path, component: Component }: { path: string; component: ComponentType }) {
  const { canAccessPath, isLoading } = useAuth();
  if (isLoading) return null;
  if (!canAccessPath(path)) return <AccessDenied />;
  return <Component />;
}

const PlaceholderPage = ({ title }: { title: string }) => (
  <div className="flex flex-col items-center justify-center h-[60vh] text-center animate-in zoom-in-95 duration-500">
    <div className="w-20 h-20 bg-slate-100 rounded-3xl flex items-center justify-center mb-6 shadow-inner">
      <span className="text-3xl">🚀</span>
    </div>
    <h2 className="text-2xl font-bold text-slate-800">{title}</h2>
    <p className="text-slate-500 mt-2 max-w-md">This module is part of the next implementation phase. The foundation is ready.</p>
  </div>
);

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: false,
    },
  },
});

function Router() {
  return (
    <AppLayout>
      <Switch>
        <Route path="/" component={Dashboard} />

        <Route path="/config/cycles">{() => <ProtectedRoute path="/config/cycles" component={PerformanceCycles} />}</Route>
        <Route path="/config/kpi-groups">{() => <ProtectedRoute path="/config/kpi-groups" component={KpiGroups} />}</Route>
        <Route path="/config/units">{() => <ProtectedRoute path="/config/units" component={UnitsOfMeasure} />}</Route>
        <Route path="/config/data-types">{() => <ProtectedRoute path="/config/data-types" component={DataTypes} />}</Route>
        <Route path="/config/statuses">{() => <ProtectedRoute path="/config/statuses" component={ProgressStatuses} />}</Route>
        <Route path="/config/scorecard-types">{() => <ProtectedRoute path="/config/scorecard-types" component={ScorecardTypes} />}</Route>
        <Route path="/config/indicator-descriptions">{() => <PlaceholderPage title="Indicator Technical Descriptions" />}</Route>

        <Route path="/weightings/nkpa">{() => <ProtectedRoute path="/weightings/nkpa" component={NkpaWeightings} />}</Route>
        <Route path="/weightings/competencies">{() => <ProtectedRoute path="/weightings/competencies" component={CompetencyRequirements} />}</Route>

        <Route path="/deadlines/submissions">{() => <ProtectedRoute path="/deadlines/submissions" component={SubmissionDeadlines} />}</Route>
        <Route path="/deadlines/report-fields">{() => <ProtectedRoute path="/deadlines/report-fields" component={ReportFields} />}</Route>

        <Route path="/notifications">{() => <ProtectedRoute path="/notifications" component={NotificationCentre} />}</Route>
        <Route path="/notifications/config">{() => <ProtectedRoute path="/notifications/config" component={NotificationConfig} />}</Route>
        <Route path="/audit-trail">{() => <ProtectedRoute path="/audit-trail" component={AuditTrail} />}</Route>

        <Route path="/org-planning/scorecards">{() => <ProtectedRoute path="/org-planning/scorecards" component={OrgKpiPlanning} />}</Route>
        <Route path="/org-planning/review-sdbip">{() => <ProtectedRoute path="/org-planning/review-sdbip" component={ReviewSdbip} />}</Route>
        <Route path="/org-planning/approve-sdbip">{() => <ProtectedRoute path="/org-planning/approve-sdbip" component={ApproveSdbip} />}</Route>
        <Route path="/org-planning/quarterly-targets">{() => <ProtectedRoute path="/org-planning/quarterly-targets" component={MonthlyActivities} />}</Route>
        <Route path="/revised-sdbip/capture">{() => <ProtectedRoute path="/revised-sdbip/capture" component={ReviseSdbipCapture} />}</Route>
        <Route path="/revised-sdbip/review">{() => <ProtectedRoute path="/revised-sdbip/review" component={ReviseSdbipReview} />}</Route>
        <Route path="/revised-sdbip/approve">{() => <ProtectedRoute path="/revised-sdbip/approve" component={ReviseSdbipApprove} />}</Route>
        <Route path="/sdbip/overview">{() => <ProtectedRoute path="/sdbip/overview" component={SdbipOverview} />}</Route>
        <Route path="/departmental/scorecards">{() => <ProtectedRoute path="/departmental/scorecards" component={DeptScorecards} />}</Route>
        <Route path="/departmental/kpi-assignments">{() => <PlaceholderPage title="KPI Assignments" />}</Route>
        <Route path="/individual/my-performance">{() => <ProtectedRoute path="/individual/my-performance" component={IndividualAgreements} />}</Route>
        <Route path="/individual/agreements">{() => <ProtectedRoute path="/individual/agreements" component={IndividualAgreements} />}</Route>
        <Route path="/individual/reviewers">{() => <ProtectedRoute path="/individual/reviewers" component={ReviewerConfig} />}</Route>
        <Route path="/individual/competencies">{() => <ProtectedRoute path="/individual/competencies" component={CompetencyTemplates} />}</Route>
        <Route path="/individual/assessments">{() => <ProtectedRoute path="/individual/assessments" component={IndividualAssessment} />}</Route>
        <Route path="/actuals/submit">{() => <ProtectedRoute path="/actuals/submit" component={ActualsCapture} />}</Route>
        <Route path="/actuals/review-line-manager">{() => <ProtectedRoute path="/actuals/review-line-manager" component={ReviewLineManager} />}</Route>
        <Route path="/actuals/review-director">{() => <ProtectedRoute path="/actuals/review-director" component={ReviewDirector} />}</Route>
        <Route path="/actuals/review-pms-manager">{() => <ProtectedRoute path="/actuals/review-pms-manager" component={ReviewPmsManager} />}</Route>
        <Route path="/actuals/review-pms-director">{() => <ProtectedRoute path="/actuals/review-pms-director" component={ReviewPmsDirector} />}</Route>
        <Route path="/actuals/review-internal-audit">{() => <ProtectedRoute path="/actuals/review-internal-audit" component={ReviewInternalAudit} />}</Route>
        <Route path="/actuals/corrective-actions">{() => <ProtectedRoute path="/actuals/corrective-actions" component={CorrectiveActions} />}</Route>
        <Route path="/moderation/queue">{() => <ProtectedRoute path="/moderation/queue" component={ReviewQueue} />}</Route>
        <Route path="/moderation/panel">{() => <ProtectedRoute path="/moderation/panel" component={ModerationPanel} />}</Route>
        <Route path="/dashboards/executive" component={Dashboard} />
        <Route path="/dashboards/department" component={Dashboard} />
        <Route path="/dashboards/overview" component={Dashboard} />
        <Route path="/reports/centre">{() => <ProtectedRoute path="/reports/centre" component={ReportCentre} />}</Route>
        <Route path="/reports/standard">{() => <PlaceholderPage title="Standard Reports" />}</Route>
        <Route path="/reports/custom">{() => <PlaceholderPage title="Custom Reports" />}</Route>
        <Route path="/ai-insights">{() => <ProtectedRoute path="/ai-insights" component={AiInsights} />}</Route>
        <Route path="/integrations">{() => <ProtectedRoute path="/integrations" component={IntegrationHub} />}</Route>
        <Route path="/admin/users">{() => <PlaceholderPage title="User Management" />}</Route>
        <Route path="/admin/roles">{() => <PlaceholderPage title="Role Permissions" />}</Route>
        <Route path="/admin/workflows">{() => <ProtectedRoute path="/admin/workflows" component={WorkflowConfig} />}</Route>

        <Route component={NotFound} />
      </Switch>
    </AppLayout>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
          <Router />
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
