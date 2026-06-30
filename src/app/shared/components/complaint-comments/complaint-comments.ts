import {
  Component,
  OnInit,
  inject,
  input,
  signal,
  computed,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { ComplaintService } from '../../../services/complaint.service';
import { TokenStorageService } from '../../../services/auth.api.service';
import { ToastService } from '../../services/toast.service';
import {
  ComplaintCommentDto,
  CreateComplaintCommentDto,
} from '../../../models/complaint.model';

/** Status IDs where commenting is not allowed */
const LOCKED_STATUSES = new Set([6, 7, 9]); // Closed, Rejected, Externally Escalated

@Component({
  selector: 'app-complaint-comments',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './complaint-comments.html',
  styleUrl: './complaint-comments.scss',
})
export class ComplaintCommentsComponent implements OnInit {
  // ── Inputs ──────────────────────────────────────────────────────────────────
  readonly complaintId = input.required<number>();
  readonly complaintStatusId = input.required<number>();
  readonly raisedByEmployeeId = input.required<number>();

  // ── Services ─────────────────────────────────────────────────────────────────
  private readonly complaintService = inject(ComplaintService);
  private readonly tokenStorage = inject(TokenStorageService);
  private readonly toast = inject(ToastService);

  // ── State ────────────────────────────────────────────────────────────────────
  readonly isLoading = signal(true);
  readonly isSubmitting = signal(false);
  readonly comments = signal<ComplaintCommentDto[]>([]);
  readonly commentText = signal('');
  readonly isInternal = signal(false);

  // ── Computed ─────────────────────────────────────────────────────────────────

  /** Compose box is shown — server enforces the raiser/handler rule */
  readonly canComment = computed(
    () => !LOCKED_STATUSES.has(this.complaintStatusId())
  );

  /**
   * "Internal note" toggle is available for GRO, Dept Head, Admin —
   * but NOT when the user is the one who raised the complaint.
   */
  readonly canPostInternal = computed(() => {
    const role = this.tokenStorage.getRole();
    const empId = this.tokenStorage.getEmployeeId();
    const isElevated =
      role === 'GRO' || role === 'DEPARTMENT_HEAD' || role === 'ADMIN';
    const isRaiser = empId === this.raisedByEmployeeId();
    return isElevated && !isRaiser;
  });

  readonly lockedMessage = computed(() => {
    const s = this.complaintStatusId();
    if (s === 6) return 'This complaint is closed. Comments are disabled.';
    if (s === 7) return 'This complaint has been rejected. Comments are disabled.';
    if (s === 9) return 'This complaint has been externally escalated. Comments are disabled.';
    return null;
  });

  // ── Lifecycle ─────────────────────────────────────────────────────────────────
  ngOnInit(): void {
    this.loadComments();
  }

  loadComments(): void {
    this.isLoading.set(true);
    this.complaintService.getComments(this.complaintId()).subscribe({
      next: (list) => {
        this.comments.set(list);
        this.isLoading.set(false);
      },
      error: () => {
        this.isLoading.set(false);
      },
    });
  }

  submitComment(): void {
    const text = this.commentText().trim();
    if (!text) return;

    const dto: CreateComplaintCommentDto = {
      commentText: text,
      isInternal: this.canPostInternal() ? this.isInternal() : false,
    };

    this.isSubmitting.set(true);
    this.complaintService.addComment(this.complaintId(), dto).subscribe({
      next: (created) => {
        this.comments.update((list) => [...list, created]);
        this.commentText.set('');
        this.isInternal.set(false);
        this.isSubmitting.set(false);
      },
      error: (err) => {
        const msg =
          err?.error?.message ||
          err?.error?.detail ||
          'Failed to add comment. Please try again.';
        this.toast.error(msg);
        this.isSubmitting.set(false);
      },
    });
  }

  /** Returns initials (up to 2 chars) from a display name */
  initials(name: string): string {
    return name
      .split(' ')
      .slice(0, 2)
      .map((w) => w[0])
      .join('')
      .toUpperCase();
  }

  hasUnsavedChanges(): boolean {
    return this.commentText().trim().length > 0;
  }
}
