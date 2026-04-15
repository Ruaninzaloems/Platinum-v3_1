export interface ReportDefinition {
  id: string;
  name: string;
  description: string;
  category: 'procurement' | 'financial' | 'compliance' | 'inventory' | 'supplier' | 'audit' | 'management';
  subcategory?: string;
  parameters: ReportParameter[];
  outputFormats: ('pdf' | 'excel' | 'csv')[];
  schedulable: boolean;
  lastRunAt?: string;
  lastRunBy?: string;
}

export interface ReportParameter {
  name: string;
  label: string;
  type: 'date' | 'dateRange' | 'select' | 'multiSelect' | 'text' | 'number';
  required: boolean;
  options?: { value: string; label: string; }[];
  defaultValue?: any;
}

export interface AnalyticsDashboard {
  id: string;
  name: string;
  description: string;
  category: string;
  widgets: DashboardWidget[];
}

export interface DashboardWidget {
  id: string;
  title: string;
  type: 'kpi' | 'chart_bar' | 'chart_line' | 'chart_pie' | 'chart_donut' | 'table' | 'map' | 'gauge';
  dataSource: string;
  config: Record<string, any>;
  position: { row: number; col: number; width: number; height: number; };
}

export interface SpendAnalytics {
  totalSpend: { amount: number; currency: string; };
  spendByDepartment: { department: string; amount: number; percentage: number; }[];
  spendByCategory: { category: string; amount: number; percentage: number; }[];
  spendBySupplier: { supplier: string; amount: number; percentage: number; }[];
  spendByMonth: { month: string; amount: number; }[];
  localContentPercentage: number;
  bbbeeSpendPercentage: number;
  savingsAchieved: { amount: number; currency: string; };
}
