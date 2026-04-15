import { Switch, Route, Router as WouterRouter } from "wouter";
import { type ComponentType } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AppLayout } from "@/components/layout/AppLayout";
import { useAuth } from "@/hooks/useAuth";
import { PageLoader } from "@/components/ui/page-loader";
import NotFound from "@/pages/not-found";

import Dashboard from "@/pages/Dashboard";
import PerformanceCycles from "@/pages/config/PerformanceCycles";
import KpiGroups from "@/pages/config/KpiGroups";
import UnitsOfMeasure from "@/pages/config/UnitsOfMeasure";
import DataTypes from "@/pages/config/DataTypes";
import ProgressStatuses from "@/pages/config/ProgressStatuses";
import ScorecardTypes from "@/pages/config/ScorecardTypes";
import NkpaWeightings from "@/pages/weightings/NkpaWeightings";
import CompetencyRequirements from "@/pages/weightings/CompetencyRequirements";
import SubmissionDeadlines from "@/pages/deadlines/SubmissionDeadlines";
import ReportFields from "@/pages/deadlines/ReportFields";
import NotificationCentre from "@/pages/notifications/NotificationCentre";
import NotificationConfig from "@/pages/notifications/NotificationConfig";
import AuditTrail from "@/pages/audit/AuditTrail";
import OrgKpiPlanning from "@/pages/scorecards/OrgKpiPlanning";
import ReviewSdbip from "@/pages/scorecards/ReviewSdbip";
import ApproveSdbip from "@/pages/scorecards/ApproveSdbip";
import ReviseSdbipCapture from "@/pages/scorecards/ReviseSdbipCapture";
import ReviseSdbipReview from "@/pages/scorecards/ReviseSdbipReview";
import ReviseSdbipApprove from "@/pages/scorecards/ReviseSdbipApprove";
import SdbipOverview from "@/pages/sdbip/SdbipOverview";
import ActualsCapture from "@/pages/actuals/ActualsCapture";
import CorrectiveActions from "@/pages/actuals/CorrectiveActions";
import ReviewLineManager from "@/pages/actuals/ReviewLineManager";
import ReviewDirector from "@/pages/actuals/ReviewDirector";
import ReviewPmsManager from "@/pages/actuals/ReviewPmsManager";
import ReviewPmsDirector from "@/pages/actuals/ReviewPmsDirector";
import ReviewInternalAudit from "@/pages/actuals/ReviewInternalAudit";
import MonthlyActivities from "@/pages/scorecards/MonthlyActivities";
import DeptScorecards from "@/pages/departmental/DeptScorecards";
import ReviewQueue from "@/pages/moderation/ReviewQueue";
import ModerationPanel from "@/pages/moderation/ModerationPanel";
import ReportCentre from "@/pages/reports/ReportCentre";
import IndividualAgreements from "@/pages/individual/IndividualAgreements";
import ReviewerConfig from "@/pages/individual/ReviewerConfig";
import CompetencyTemplates from "@/pages/individual/CompetencyTemplates";
import IndividualAssessment from "@/pages/individual/IndividualAssessment";
import AiInsights from "@/pages/ai/AiInsights";
import IntegrationHub from "@/pages/integrations/IntegrationHub";
import WorkflowConfig from "@/pages/admin/WorkflowConfig";

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
  if (isLoading) return <PageLoader />;
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
  const { isLoading } = useAuth();

  if (isLoading) {
    return <PageLoader />;
  }

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
