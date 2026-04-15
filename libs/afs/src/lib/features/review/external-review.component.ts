import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { ExternalReviewData, ReviewComment } from '../../core/models/interfaces';

@Component({
  selector: 'app-external-review',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './external-review.component.html',
  styleUrl: './external-review.component.css',
})
export class ExternalReviewComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private http = inject(HttpClient);

  token = '';
  loading = true;
  error = '';
  reviewData: ExternalReviewData | null = null;
  comments: ReviewComment[] = [];
  newComment = '';
  commentTargetType = 'compilation';
  commentTargetId = '';
  submittingComment = false;
  commentSuccess = '';
  isGiScope = false;

  ngOnInit() {
    this.token = this.route.snapshot.paramMap.get('token') || '';
    if (!this.token) {
      this.error = 'No review token provided.';
      this.loading = false;
      return;
    }
    this.loadReviewData();
  }

  loadReviewData() {
    this.loading = true;
    this.http.get<ExternalReviewData>(`/api/review-requests/external/validate/${this.token}`).subscribe({
      next: (data) => {
        this.reviewData = data;
        this.isGiScope = data.scope === 'general_information' || data.content?.scope === 'general_information';
        this.commentTargetType = this.isGiScope ? 'general_information' : 'compilation';
        this.commentTargetId = data.requestId;
        this.loading = false;
        this.loadComments();
      },
      error: (err) => {
        this.error = err.error?.message || 'This review link is invalid, expired, or has been revoked.';
        this.loading = false;
      },
    });
  }

  loadComments() {
    this.http.get<ReviewComment[]>(`/api/review-requests/external/comments/${this.token}`).subscribe({
      next: (comments) => { this.comments = comments; },
      error: () => {},
    });
  }

  submitComment() {
    if (!this.newComment.trim()) return;
    this.submittingComment = true;
    this.commentSuccess = '';
    this.http.post<ReviewComment>(`/api/review-requests/external/comment/${this.token}`, {
      targetType: this.commentTargetType,
      targetId: this.commentTargetId,
      commentText: this.newComment.trim(),
    }).subscribe({
      next: () => {
        this.commentSuccess = 'Comment submitted successfully.';
        this.newComment = '';
        this.submittingComment = false;
        this.loadComments();
      },
      error: (err) => {
        this.error = err.error?.message || 'Failed to submit comment.';
        this.submittingComment = false;
      },
    });
  }

  setCommentTarget(targetType: string, targetId: string) {
    this.commentTargetType = targetType;
    this.commentTargetId = targetId;
  }

  formatCurrency(value: number): string {
    return new Intl.NumberFormat('en-ZA', { minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(value);
  }

  getRequestTypeLabel(type: string): string {
    const labels: Record<string, string> = {
      comment: 'Comment',
      input_requested: 'Input Requested',
      factual_verification: 'Factual Verification',
      review_only: 'Review Only',
    };
    return labels[type] || type;
  }

  getCommentsForTarget(targetType: string, targetId: string): ReviewComment[] {
    return this.comments.filter(c => c.targetType === targetType && c.targetId === targetId);
  }
}
