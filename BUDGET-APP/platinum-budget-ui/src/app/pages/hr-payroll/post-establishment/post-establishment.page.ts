import { Component, OnInit, ChangeDetectorRef, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule } from '@angular/material/dialog';
import { ApiService } from '../../../services/api.service';
import {
  PostEstablishment, SalaryStructure, PostEstablishmentSummary
} from '../../../models/budget.models';

@Component({
  selector: 'app-post-establishment-page',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, FormsModule, MatIconModule, MatButtonModule, MatDialogModule],
  templateUrl: './post-establishment.page.html',
  styleUrls: ['./post-establishment.page.scss']
})
export class PostEstablishmentPage implements OnInit {
  posts: PostEstablishment[] = [];
  vacantPosts: PostEstablishment[] = [];
  unprioritisedPosts: PostEstablishment[] = [];
  salaryStructures: SalaryStructure[] = [];
  summary: PostEstablishmentSummary | null = null;
  kpiCards: any[] = [];

  filterDepartment = '';
  filterStatus = '';
  departments: string[] = [];

  activePanel: 'posts' | 'salary' | 'vacant' = 'posts';

  showPostDialog = false;
  showRankDialog = false;
  showStartDateDialog = false;
  editingPost: PostEstablishment | null = null;
  saving = false;
  flagging = false;

  postForm: any = {};
  rankForm: any = { postId: 0, rankingScore: 0, priorityStatus: 'Low', recruitmentStrategy: '' };
  startDateForm: any = { postId: 0, plannedStartDate: '' };

  constructor(private api: ApiService, private cdr: ChangeDetectorRef) {}

  ngOnInit() {
    this.loadData();
  }

  loadData() {
    this.api.getPostEstablishments(undefined, this.filterDepartment || undefined, this.filterStatus || undefined).subscribe(data => {
      this.posts = data;
      this.departments = [...new Set(data.map(p => p.department).filter(Boolean))] as string[];
      this.cdr.markForCheck();
    });
    this.api.getSalaryStructures().subscribe(data => {
      this.salaryStructures = data;
      this.cdr.markForCheck();
    });
    this.api.getOrganogramSummary().subscribe(data => {
      this.summary = data;
      this.buildKpis();
      this.cdr.markForCheck();
    });
    this.api.getVacantPosts().subscribe(data => {
      this.vacantPosts = data;
      this.cdr.markForCheck();
    });
    this.api.getUnprioritisedPosts().subscribe(data => {
      this.unprioritisedPosts = data;
      this.cdr.markForCheck();
    });
  }

  buildKpis() {
    if (!this.summary) return;
    const s = this.summary;
    this.kpiCards = [
      { icon: 'badge', label: 'Total Posts', value: s.totalPosts.toString(), subtitle: 'Establishment register', colorClass: 'icon-blue' },
      { icon: 'person', label: 'Filled Posts', value: s.filledPosts.toString(), subtitle: `${s.totalPosts ? ((s.filledPosts / s.totalPosts) * 100).toFixed(0) : 0}% fill rate`, colorClass: 'icon-green' },
      { icon: 'person_off', label: 'Vacant Posts', value: s.vacantPosts.toString(), subtitle: `${s.fundedVacancies} funded`, colorClass: 'icon-amber' },
      { icon: 'account_balance_wallet', label: 'Funded Vacancies', value: s.fundedVacancies.toString(), subtitle: `${s.unfundedVacancies} unfunded`, colorClass: 'icon-teal' },
      { icon: 'payments', label: 'Total Post Budget', value: 'R ' + (s.totalPostBudget / 1000000).toFixed(1) + 'M', subtitle: 'Annual cost', colorClass: 'icon-purple' },
    ];
  }

  formatCurrency(v: number | null | undefined): string {
    if (!v && v !== 0) return 'R 0';
    return 'R ' + v.toLocaleString('en-ZA', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
  }

  get filteredPosts(): PostEstablishment[] {
    return this.posts;
  }

  flagActivePosts() {
    this.flagging = true;
    this.api.flagActivePosts(1).subscribe({
      next: () => { this.flagging = false; this.loadData(); },
      error: () => { this.flagging = false; this.cdr.markForCheck(); }
    });
  }

  resetPostForm() {
    this.editingPost = null;
    this.postForm = {
      postCode: '', title: '', department: '', jobLevel: '', salaryGrade: null, salaryNotch: null,
      employmentType: 'Permanent', status: 'Vacant', isFunded: false, isActive: true,
      fundingSource: '', plannedStartDate: '', rankingScore: 0, priorityStatus: 'Low',
      recruitmentStrategy: '', jobDescription: '', bargainingUnit: '', employeeCategory: '',
      scoaItemCode: '', scoaFundCode: '', scoaFunctionCode: '', scoaRegionCode: '', scoaCostingCode: '',
      financialYearId: 1
    };
  }

  openCreatePost() {
    this.resetPostForm();
    this.showPostDialog = true;
  }

  editPost(p: PostEstablishment) {
    this.editingPost = p;
    this.postForm = {
      postCode: p.postCode, title: p.title, department: p.department || '',
      jobLevel: p.jobLevel || '', salaryGrade: p.salaryGrade, salaryNotch: p.salaryNotch,
      employmentType: p.employmentType, status: p.status, isFunded: p.isFunded, isActive: p.isActive,
      fundingSource: p.fundingSource || '', plannedStartDate: p.plannedStartDate?.split('T')[0] || '',
      rankingScore: p.rankingScore, priorityStatus: p.priorityStatus,
      recruitmentStrategy: p.recruitmentStrategy || '', jobDescription: p.jobDescription || '',
      bargainingUnit: p.bargainingUnit || '', employeeCategory: p.employeeCategory || '',
      scoaItemCode: p.scoaItemCode || '', scoaFundCode: p.scoaFundCode || '',
      scoaFunctionCode: p.scoaFunctionCode || '', scoaRegionCode: p.scoaRegionCode || '',
      scoaCostingCode: p.scoaCostingCode || '', financialYearId: p.financialYearId
    };
    this.showPostDialog = true;
  }

  savePost() {
    this.saving = true;
    if (this.editingPost) {
      this.api.updatePostEstablishment(this.editingPost.id, this.postForm).subscribe({
        next: () => { this.saving = false; this.showPostDialog = false; this.loadData(); },
        error: () => { this.saving = false; this.cdr.markForCheck(); }
      });
    } else {
      this.api.createPostEstablishment(this.postForm).subscribe({
        next: () => { this.saving = false; this.showPostDialog = false; this.loadData(); },
        error: () => { this.saving = false; this.cdr.markForCheck(); }
      });
    }
  }

  openRankDialog(p: PostEstablishment) {
    this.rankForm = {
      postId: p.id,
      rankingScore: p.rankingScore,
      priorityStatus: p.priorityStatus || 'Low',
      recruitmentStrategy: p.recruitmentStrategy || ''
    };
    this.showRankDialog = true;
  }

  saveRanking() {
    this.saving = true;
    const data = {
      rankingScore: this.rankForm.rankingScore,
      priorityStatus: this.rankForm.priorityStatus,
      recruitmentStrategy: this.rankForm.recruitmentStrategy
    };
    this.api.updatePostEstablishment(this.rankForm.postId, data).subscribe({
      next: () => { this.saving = false; this.showRankDialog = false; this.loadData(); },
      error: () => { this.saving = false; this.cdr.markForCheck(); }
    });
  }

  openStartDateDialog(p: PostEstablishment) {
    this.startDateForm = {
      postId: p.id,
      plannedStartDate: p.plannedStartDate?.split('T')[0] || ''
    };
    this.showStartDateDialog = true;
  }

  saveStartDate() {
    this.saving = true;
    this.api.updatePostEstablishment(this.startDateForm.postId, { plannedStartDate: this.startDateForm.plannedStartDate }).subscribe({
      next: () => { this.saving = false; this.showStartDateDialog = false; this.loadData(); },
      error: () => { this.saving = false; this.cdr.markForCheck(); }
    });
  }

  applyFilter() {
    this.api.getPostEstablishments(undefined, this.filterDepartment || undefined, this.filterStatus || undefined).subscribe(data => {
      this.posts = data;
      this.cdr.markForCheck();
    });
  }
}
