import { Component, OnInit, ChangeDetectorRef, ElementRef, ViewChild, AfterViewChecked } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../../core/services/api.service';
import { IconComponent } from '../../../shared/components/icon/icon.component';
import { StatusBadgeComponent } from '../../../shared/components/status-badge/status-badge.component';

interface OrgNode {
  id: number;
  position_code: string;
  title: string;
  status: string;
  parent_position_id: number | null;
  department_name: string;
  department_code: string;
  is_hod: boolean;
  funded: boolean;
  grade_code: string;
  grade_name: string;
  employee_id?: number;
  employee_name?: string;
  employee_number?: string;
  children?: OrgNode[];
  expanded?: boolean;
  depth?: number;
  _isAncestor?: boolean;
}

interface DeptStat {
  name: string;
  total: number;
  filled: number;
  vacant: number;
  frozen: number;
  fillRate: number;
}

@Component({
  selector: 'app-organogram',
  standalone: true,
  host: { 'data-accent': 'talent' },
  imports: [CommonModule, FormsModule, IconComponent, StatusBadgeComponent],
  templateUrl: './organogram.component.html',
  styleUrl: './organogram.component.css'
})
export class OrganogramComponent implements OnInit, AfterViewChecked {
  activeTab = 'chart';
  tree: OrgNode[] = [];
  flatList: OrgNode[] = [];
  loading = true;
  searchTerm = '';
  filterDept = '';
  filterStatus = '';
  departments: string[] = [];
  deptStats: DeptStat[] = [];
  stats = { total: 0, filled: 0, vacant: 0, funded: 0, frozen: 0, abolished: 0, fillRate: 0, fundedRate: 0 };
  chartDeptFilter = '';
  chartTreeNodes: OrgNode[] = [];
  maxVisibleDepth = 3;
  depthOptions = [1, 2, 3, 4, 5, 6, 7, 8, 9];
  private needsCanvasRedraw = false;

  @ViewChild('donutCanvas') donutCanvasRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('barCanvas') barCanvasRef!: ElementRef<HTMLCanvasElement>;

  constructor(private api: ApiService, private cdr: ChangeDetectorRef) {}

  ngOnInit(): void {
    this.load();
  }

  ngAfterViewChecked(): void {
    if (this.needsCanvasRedraw) {
      this.needsCanvasRedraw = false;
      this.drawDonut();
      this.drawBarChart();
    }
  }

  load(): void {
    this.loading = true;
    this.api.get<any[]>('/positions/organogram').subscribe({
      next: (data) => {
        this.flatList = (data || []).map((n: any) => ({
          ...n,
          employee_name: n.employee_name || (n.first_name ? `${n.first_name} ${n.surname}`.trim() : null)
        }));
        this.tree = this.buildTree(this.flatList);
        this.departments = [...new Set(this.flatList.map(n => n.department_name).filter(Boolean))].sort();
        const filled = this.flatList.filter(n => n.status === 'FILLED').length;
        const vacant = this.flatList.filter(n => n.status === 'VACANT').length;
        const frozen = this.flatList.filter(n => n.status === 'FROZEN').length;
        const abolished = this.flatList.filter(n => n.status === 'ABOLISHED').length;
        const funded = this.flatList.filter(n => n.funded).length;
        this.stats = {
          total: this.flatList.length,
          filled, vacant, frozen, abolished, funded,
          fillRate: this.flatList.length > 0 ? Math.round((filled / this.flatList.length) * 100) : 0,
          fundedRate: this.flatList.length > 0 ? Math.round((funded / this.flatList.length) * 100) : 0
        };
        this.buildDeptStats();
        this.loading = false;
        this.needsCanvasRedraw = true;
        this.cdr.detectChanges();
      },
      error: () => { this.loading = false; this.cdr.detectChanges(); }
    });
  }

  buildDeptStats(): void {
    const map = new Map<string, DeptStat>();
    this.flatList.forEach(n => {
      const dept = n.department_name || 'Unassigned';
      if (!map.has(dept)) map.set(dept, { name: dept, total: 0, filled: 0, vacant: 0, frozen: 0, fillRate: 0 });
      const s = map.get(dept)!;
      s.total++;
      if (n.status === 'FILLED') s.filled++;
      else if (n.status === 'VACANT') s.vacant++;
      else if (n.status === 'FROZEN') s.frozen++;
    });
    map.forEach(s => { s.fillRate = s.total > 0 ? Math.round((s.filled / s.total) * 100) : 0; });
    this.deptStats = [...map.values()].sort((a, b) => b.total - a.total);
  }

  buildTree(nodes: OrgNode[]): OrgNode[] {
    const map = new Map<number, OrgNode>();
    const roots: OrgNode[] = [];
    nodes.forEach(n => map.set(n.id, { ...n, children: [], expanded: true, depth: 0 }));
    map.forEach(node => {
      if (node.parent_position_id && map.has(node.parent_position_id)) {
        map.get(node.parent_position_id)!.children!.push(node);
      } else {
        roots.push(node);
      }
    });
    const setDepth = (list: OrgNode[], d: number) => {
      list.forEach(n => {
        n.depth = d;
        if (n.children && n.children.length > 0) setDepth(n.children, d + 1);
      });
    };
    setDepth(roots, 0);
    return roots;
  }

  buildChartTree(): void {
    if (!this.chartDeptFilter) {
      this.chartTreeNodes = [];
      this.cdr.detectChanges();
      return;
    }
    const dept = this.chartDeptFilter;
    const filterNodes = (nodes: OrgNode[]): OrgNode[] => {
      return nodes.reduce((acc: OrgNode[], n) => {
        const matches = n.department_name === dept;
        const filteredChildren = n.children ? filterNodes(n.children) : [];
        if (matches || filteredChildren.length > 0) {
          const childSet = matches ? this.deepCopyExpanded(n.children || [], dept) : filteredChildren;
          acc.push({ ...n, children: childSet, expanded: true, _isAncestor: !matches });
        }
        return acc;
      }, []);
    };
    this.chartTreeNodes = filterNodes(this.tree);
    this.applyDepthLimit(this.chartTreeNodes, 0);
    this.cdr.detectChanges();
  }

  onDepthChange(): void {
    this.applyDepthLimit(this.chartTreeNodes, 0);
    this.cdr.detectChanges();
  }

  private applyDepthLimit(nodes: OrgNode[], currentDepth: number): void {
    nodes.forEach(n => {
      n.expanded = currentDepth < this.maxVisibleDepth;
      if (n.children) this.applyDepthLimit(n.children, currentDepth + 1);
    });
  }

  private deepCopyExpanded(nodes: OrgNode[], dept: string, depth: number = 0): OrgNode[] {
    return nodes.map(n => ({
      ...n,
      expanded: depth < this.maxVisibleDepth,
      _isAncestor: n.department_name !== dept,
      children: n.children ? this.deepCopyExpanded(n.children, dept, depth + 1) : []
    }));
  }

  selectChartDept(dept: string): void {
    this.chartDeptFilter = dept;
    this.buildChartTree();
  }

  toggleNode(node: OrgNode): void {
    if (node.children && node.children.length > 0) {
      node.expanded = !node.expanded;
      this.cdr.detectChanges();
    }
  }

  expandAll(): void {
    this.setAllExpanded(this.chartTreeNodes, true);
    this.cdr.detectChanges();
  }

  collapseAll(): void {
    this.setAllExpanded(this.chartTreeNodes, false);
    this.cdr.detectChanges();
  }

  private setAllExpanded(nodes: OrgNode[], val: boolean): void {
    nodes.forEach(n => { n.expanded = val; if (n.children) this.setAllExpanded(n.children, val); });
  }

  get filteredList(): OrgNode[] {
    return this.flatList.filter(n => {
      if (this.searchTerm) {
        const s = this.searchTerm.toLowerCase();
        if (!n.title.toLowerCase().includes(s) && !n.position_code.toLowerCase().includes(s) && !(n.employee_name || '').toLowerCase().includes(s)) return false;
      }
      if (this.filterDept && n.department_name !== this.filterDept) return false;
      if (this.filterStatus && n.status !== this.filterStatus) return false;
      return true;
    });
  }

  getStatusColor(status: string): string {
    switch (status) {
      case 'FILLED': return '#16a34a';
      case 'VACANT': return '#d97706';
      case 'FROZEN': return '#dc2626';
      case 'ABOLISHED': return '#6b7280';
      default: return '#3b82f6';
    }
  }

  getStatusBg(status: string): string {
    switch (status) {
      case 'FILLED': return '#dcfce7';
      case 'VACANT': return '#fef3c7';
      case 'FROZEN': return '#fee2e2';
      case 'ABOLISHED': return '#f3f4f6';
      default: return '#dbeafe';
    }
  }

  drawDonut(): void {
    const canvas = this.donutCanvasRef?.nativeElement;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    canvas.width = 200 * dpr;
    canvas.height = 200 * dpr;
    ctx.scale(dpr, dpr);

    const cx = 100, cy = 100, r = 75, lineW = 22;
    const segments = [
      { value: this.stats.filled, color: '#16a34a', label: 'Filled' },
      { value: this.stats.vacant, color: '#f59e0b', label: 'Vacant' },
      { value: this.stats.frozen, color: '#ef4444', label: 'Frozen' },
      { value: this.stats.abolished, color: '#9ca3af', label: 'Abolished' },
    ].filter(s => s.value > 0);

    const total = segments.reduce((s, seg) => s + seg.value, 0);
    if (total === 0) return;

    let startAngle = -Math.PI / 2;
    segments.forEach(seg => {
      const sweep = (seg.value / total) * 2 * Math.PI;
      ctx.beginPath();
      ctx.arc(cx, cy, r, startAngle, startAngle + sweep);
      ctx.strokeStyle = seg.color;
      ctx.lineWidth = lineW;
      ctx.lineCap = 'round';
      ctx.stroke();
      startAngle += sweep + 0.04;
    });

    ctx.fillStyle = '#0f2b46';
    ctx.font = 'bold 28px Inter, system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(`${this.stats.fillRate}%`, cx, cy - 8);
    ctx.fillStyle = '#64748b';
    ctx.font = '500 11px Inter, system-ui, sans-serif';
    ctx.fillText('Fill Rate', cx, cy + 14);
  }

  drawBarChart(): void {
    const canvas = this.barCanvasRef?.nativeElement;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const topDepts = this.deptStats.slice(0, 8);
    const w = 460, h = 220;
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    ctx.scale(dpr, dpr);

    if (topDepts.length === 0) return;

    const maxVal = Math.max(...topDepts.map(d => d.total));
    const barW = Math.min(36, (w - 60) / topDepts.length - 8);
    const chartH = h - 50;
    const chartTop = 10;

    topDepts.forEach((dept, i) => {
      const x = 40 + i * ((w - 60) / topDepts.length);
      const filledH = maxVal > 0 ? (dept.filled / maxVal) * chartH : 0;
      const vacantH = maxVal > 0 ? (dept.vacant / maxVal) * chartH : 0;

      ctx.fillStyle = '#16a34a';
      ctx.beginPath();
      const fY = chartTop + chartH - filledH;
      this.roundedRect(ctx, x, fY, barW, filledH, 4);
      ctx.fill();

      ctx.fillStyle = '#f59e0b';
      ctx.beginPath();
      const vY = chartTop + chartH - filledH - vacantH;
      this.roundedRect(ctx, x, vY, barW, vacantH, 4);
      ctx.fill();

      ctx.save();
      ctx.translate(x + barW / 2, chartTop + chartH + 8);
      ctx.rotate(-0.5);
      ctx.fillStyle = '#64748b';
      ctx.font = '500 9px Inter, system-ui, sans-serif';
      ctx.textAlign = 'left';
      const label = dept.name.length > 14 ? dept.name.substring(0, 12) + '..' : dept.name;
      ctx.fillText(label, 0, 0);
      ctx.restore();
    });
  }

  private roundedRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number): void {
    if (h < r * 2) r = h / 2;
    if (w < r * 2) r = w / 2;
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h);
    ctx.lineTo(x, y + h);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
  }

  countDescendants(node: OrgNode): number {
    let count = 0;
    if (node.children) {
      count += node.children.length;
      node.children.forEach(c => { count += this.countDescendants(c); });
    }
    return count;
  }

  getInitials(name: string): string {
    if (!name) return '?';
    const parts = name.trim().split(/\s+/);
    return parts.length > 1 ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase() : parts[0][0].toUpperCase();
  }
}
