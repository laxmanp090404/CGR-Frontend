import { Component, computed, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { forkJoin } from 'rxjs';

import { ComplaintService } from '../../../services/complaint.service';
import { ComplaintRequestService } from '../../../services/complaint-request.service';
import { ToastService } from '../../../shared/services/toast.service';
import { DashboardShellComponent, NavItem } from '../../../shared/components/dashboard-shell/dashboard-shell';
import { ComplaintCommentsComponent } from '../../../shared/components/complaint-comments/complaint-comments';
import { baseUrl } from '../../../../environment';
import { TokenStorageService } from '../../../services/auth.api.service';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { getNavItems } from '../../../shared/components/dashboard-shell/nav-menu';
import { ROLE_DASHBOARD_ROUTE } from '../../../models/auth.model';

export interface StatusConfig {
  label: string;
  textColor: string;
  bgColor: string;
}

// Status IDs — mirror the backend constants
const STATUS_ASSIGNED            = 2;
const STATUS_IN_PROGRESS         = 3;
const STATUS_ESCALATED           = 4;
const STATUS_RESOLVED            = 5;
const STATUS_EXTERNALLY_ESCALATED = 9;

// Role names — mirror session storage values
const ROLE_GRO            = 'GRO';
const ROLE_DEPARTMENT_HEAD = 'DEPARTMENT_HEAD';
const ROLE_ADMIN           = 'ADMIN';

// Modal key type
type ActiveModal = 'resolve' | 'escalate' | 'close' | 'reopen' | 'rejectRequest' | null;

@Component({
  selector: 'app-complaint-detail',
  standalone: true,
  imports: [CommonModule, RouterModule, DashboardShellComponent, ComplaintCommentsComponent],
  templateUrl: './complaint-detail.html',
  styleUrl: './complaint-detail.scss',
})
export class ComplaintDetailComponent implements OnInit {
  private readonly complaintService = inject(ComplaintService);
  private readonly requestService = inject(ComplaintRequestService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly toast = inject(ToastService);
  private readonly tokenStorage = inject(TokenStorageService);
  private readonly sanitizer = inject(DomSanitizer);

  // ── Complaint Data ─────────────────────────────────────────────────────────
  readonly isLoading = signal(true);
  readonly complaint = signal<any | null>(null);
  readonly history = signal<any[]>([]);
  readonly escalations = signal<any[]>([]);

  // ── Attachment Preview ─────────────────────────────────────────────────────
  readonly previewAttachment = signal<any | null>(null);
  readonly previewUrl = signal<string | null>(null);
  readonly previewUrlSafe = signal<SafeResourceUrl | null>(null);
  readonly isPreviewLoading = signal(false);
  readonly previewError = signal<string | null>(null);

  readonly apiBaseUrl = baseUrl;

  // ── Current User Context ───────────────────────────────────────────────────
  readonly currentEmployeeId = computed(() => this.tokenStorage.session()?.employeeId ?? null);
  readonly currentRole       = computed(() => this.tokenStorage.session()?.role ?? null);

  // ── Action Modal State ─────────────────────────────────────────────────────
  readonly activeModal    = signal<ActiveModal>(null);
  readonly actionRemarks  = signal('');
  readonly isActionLoading = signal(false);

  // ── Permission Computed Signals ────────────────────────────────────────────

  /** Can the current user start progress? Current handler + ASSIGNED or ESCALATED status */
  readonly canStartProgress = computed(() => {
    const c = this.complaint();
    const empId = this.currentEmployeeId();
    if (!c) return false;
    return (
      (c.statusId === STATUS_ASSIGNED || c.statusId === STATUS_ESCALATED) &&
      c.currentHandlerEmployeeId === empId
    );
  });

  /** Can the current user resolve the complaint? Current handler + IN_PROGRESS */
  readonly canResolve = computed(() => {
    const c = this.complaint();
    const empId = this.currentEmployeeId();
    if (!c) return false;
    return (
      c.statusId === STATUS_IN_PROGRESS &&
      c.currentHandlerEmployeeId === empId
    );
  });

  /** Can the current user escalate? Current handler is GRO or Dept Head + IN_PROGRESS */
  readonly canEscalate = computed(() => {
    const c = this.complaint();
    const empId = this.currentEmployeeId();
    const role = this.currentRole();
    if (!c) return false;
    return (
      c.statusId === STATUS_IN_PROGRESS &&
      c.currentHandlerEmployeeId === empId &&
      (role === ROLE_GRO || role === ROLE_DEPARTMENT_HEAD)
    );
  });

  /** Can the current user close? Complaint creator + RESOLVED */
  readonly canClose = computed(() => {
    const c = this.complaint();
    const empId = this.currentEmployeeId();
    if (!c) return false;
    return (
      c.statusId === STATUS_RESOLVED &&
      c.raisedByEmployeeId === empId
    );
  });

  /** Can the current user reopen? Complaint creator + RESOLVED or EXTERNALLY_ESCALATED + max 3 reopens */
  readonly canReopen = computed(() => {
    const c = this.complaint();
    const empId = this.currentEmployeeId();
    if (!c) return false;
    return (
      (c.statusId === STATUS_RESOLVED || c.statusId === STATUS_EXTERNALLY_ESCALATED) &&
      c.raisedByEmployeeId === empId &&
      (c.reopenedCount ?? 0) < 3
    );
  });

  /** Can the current user request rejection? GRO or Dept Head + current handler + status Assigned/InProgress/Escalated */
  readonly canRequestRejection = computed(() => {
    const c = this.complaint();
    const empId = this.currentEmployeeId();
    const role = this.currentRole();
    if (!c) return false;
    return (
      c.currentHandlerEmployeeId === empId &&
      (role === ROLE_GRO || role === ROLE_DEPARTMENT_HEAD) &&
      (c.statusId === STATUS_ASSIGNED || c.statusId === STATUS_IN_PROGRESS || c.statusId === 4)
    );
  });

  // ── Remarks required per modal ─────────────────────────────────────────────
  readonly isRemarksRequired = computed(() => {
    const m = this.activeModal();
    return m === 'resolve' || m === 'escalate' || m === 'reopen' || m === 'rejectRequest';
  });

  readonly canSubmitAction = computed(() => {
    if (this.isRemarksRequired()) {
      return this.actionRemarks().trim().length > 0;
    }
    return true; // 'close' remarks are optional
  });

  // ── Nav Items ──────────────────────────────────────────────────────────────
  readonly navItems = computed<NavItem[]>(() => {
    const role = this.tokenStorage.getRole();
    return role ? getNavItems(role) : [];
  });

  // ── Status Config ──────────────────────────────────────────────────────────
  readonly STATUS_CONFIG: Record<number, StatusConfig> = {
    1: { label: 'Submitted',            textColor: '#3B82F6', bgColor: '#DBEAFE' },
    2: { label: 'Assigned',             textColor: '#F59E0B', bgColor: '#FEF3C7' },
    3: { label: 'In Progress',          textColor: '#D97706', bgColor: '#FEF3C7' },
    4: { label: 'Escalated',            textColor: '#7C3AED', bgColor: '#EDE9FE' },
    5: { label: 'Resolved',             textColor: '#10B981', bgColor: '#D1FAE5' },
    6: { label: 'Closed',               textColor: '#6B7280', bgColor: '#F3F4F6' },
    7: { label: 'Rejected',             textColor: '#DC2626', bgColor: '#FEE2E2' },
    8: { label: 'Reopened',             textColor: '#F97316', bgColor: '#FFEDD5' },
    9: { label: 'Externally Escalated', textColor: '#7C3AED', bgColor: '#EDE9FE' },
  };

  // ── Lifecycle ──────────────────────────────────────────────────────────────
  ngOnInit(): void {
    const idParam = this.route.snapshot.paramMap.get('id');
    if (!idParam) {
      this.toast.error('Invalid Complaint ID.');
      this.router.navigate([this.getRedirectRoute()]);
      return;
    }
    this.loadComplaintData(Number(idParam));
  }

  loadComplaintData(id: number): void {
    this.isLoading.set(true);

    forkJoin({
      details:       this.complaintService.getComplaintById(id),
      historyList:   this.complaintService.getComplaintHistory(id),
      escalationList: this.complaintService.getComplaintEscalations(id),
    }).subscribe({
      next: (res) => {
        this.complaint.set(res.details);
        this.history.set(res.historyList);
        this.escalations.set(res.escalationList);
        this.isLoading.set(false);
      },
      error: () => {
        this.toast.error('Failed to load complaint details.');
        this.isLoading.set(false);
        this.router.navigate([this.getRedirectRoute()]);
      },
    });
  }

  // ── Modal Helpers ──────────────────────────────────────────────────────────
  openModal(modal: ActiveModal): void {
    this.actionRemarks.set('');
    this.activeModal.set(modal);
  }

  closeModal(): void {
    this.activeModal.set(null);
    this.actionRemarks.set('');
  }

  getModalTitle(): string {
    switch (this.activeModal()) {
      case 'resolve':  return 'Resolve Complaint';
      case 'escalate': return 'Escalate Complaint';
      case 'close':    return 'Close Complaint';
      case 'reopen':   return 'Reopen Complaint';
      case 'rejectRequest': return 'Request Complaint Rejection';
      default:         return '';
    }
  }

  getRemarksLabel(): string {
    switch (this.activeModal()) {
      case 'resolve':  return 'Resolution Remarks';
      case 'escalate': return 'Escalation Reason';
      case 'close':    return 'Closing Remarks (optional)';
      case 'reopen':   return 'Reason for Reopening';
      case 'rejectRequest': return 'Reason for Rejection Request';
      default:         return 'Remarks';
    }
  }

  // ── Status Transition Actions ──────────────────────────────────────────────

  onStartProgress(): void {
    const c = this.complaint();
    if (!c) return;
    this.isActionLoading.set(true);

    this.complaintService.startProgress(c.complaintId).subscribe({
      next: () => {
        this.toast.success('Complaint is now In Progress.');
        this.isActionLoading.set(false);
        this.loadComplaintData(c.complaintId);
      },
      error: (err) => {
        this.toast.error(err?.error?.message ?? 'Failed to start progress.');
        this.isActionLoading.set(false);
      },
    });
  }

  onSubmitAction(): void {
    const modal = this.activeModal();
    const c = this.complaint();
    if (!modal || !c) return;

    this.isActionLoading.set(true);

    let action$: any;
    if (modal === 'rejectRequest') {
      action$ = this.requestService.createRequest(c.complaintId, this.actionRemarks());
    } else {
      switch (modal) {
        case 'resolve':
          action$ = this.complaintService.resolveComplaint(c.complaintId, this.actionRemarks());
          break;
        case 'escalate':
          action$ = this.complaintService.escalateComplaint(c.complaintId, this.actionRemarks());
          break;
        case 'close':
          action$ = this.complaintService.closeComplaint(c.complaintId, this.actionRemarks());
          break;
        case 'reopen':
          action$ = this.complaintService.reopenComplaint(c.complaintId, this.actionRemarks());
          break;
        default:
          this.isActionLoading.set(false);
          return;
      }
    }

    action$.subscribe({
      next: () => {
        const successMsg: Record<string, string> = {
          resolve:  'Complaint resolved successfully.',
          escalate: 'Complaint escalated successfully.',
          close:    'Complaint closed successfully.',
          reopen:   'Complaint reopened and reassigned.',
          rejectRequest: 'Complaint rejection request submitted successfully.',
        };
        this.toast.success(successMsg[modal] ?? 'Action completed.');
        this.closeModal();
        this.isActionLoading.set(false);
        this.loadComplaintData(c.complaintId);
      },
      error: (err: any) => {
        this.toast.error(err?.error?.message ?? 'Action failed. Please try again.');
        this.isActionLoading.set(false);
      },
    });
  }

  // ── Attachment Preview ─────────────────────────────────────────────────────
  openAttachment(att: any): void {
    this.previewAttachment.set(att);
    this.isPreviewLoading.set(true);
    this.previewError.set(null);
    this.previewUrl.set(null);
    this.previewUrlSafe.set(null);

    this.complaintService.getAttachmentBlob(att.filePath).subscribe({
      next: (blob) => {
        const objectUrl = URL.createObjectURL(blob);
        this.previewUrl.set(objectUrl);
        this.previewUrlSafe.set(this.sanitizer.bypassSecurityTrustResourceUrl(objectUrl));
        this.isPreviewLoading.set(false);
      },
      error: (err) => {
        let errorMsg = 'Failed to load preview.';
        if (err.status === 403) errorMsg = 'You are not authorized to view this attachment.';
        else if (err.status === 404) errorMsg = 'Attachment file not found.';
        this.previewError.set(errorMsg);
        this.isPreviewLoading.set(false);
      }
    });
  }

  closePreview(): void {
    const url = this.previewUrl();
    if (url) URL.revokeObjectURL(url);
    this.previewAttachment.set(null);
    this.previewUrl.set(null);
    this.previewUrlSafe.set(null);
    this.previewError.set(null);
  }

  downloadPreview(): void {
    const url = this.previewUrl();
    const att = this.previewAttachment();
    if (url && att) {
      const a = document.createElement('a');
      a.href = url;
      a.download = att.originalFileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    }
  }

  // ── Utilities ──────────────────────────────────────────────────────────────
  isImage(mimeType?: string): boolean {
    if (!mimeType) return false;
    const t = mimeType.toLowerCase();
    return t === 'image/png' || t === 'image/jpg' || t === 'image/jpeg';
  }

  isPdf(mimeType?: string): boolean {
    if (!mimeType) return false;
    return mimeType.toLowerCase() === 'application/pdf';
  }

  getStatusClass(statusName: string): string {
    const s = statusName.toLowerCase();
    if (s.includes('open') || s.includes('submitted')) return 'badge--open';
    if (s.includes('progress')) return 'badge--progress';
    if (s.includes('resolved')) return 'badge--resolved';
    if (s.includes('closed')) return 'badge--closed';
    if (s.includes('rejected')) return 'badge--rejected';
    if (s.includes('escalated')) return 'badge--escalated';
    return 'badge--neutral';
  }

  getPriorityClass(priorityName: string): string {
    switch (priorityName.toLowerCase()) {
      case 'critical': return 'priority--critical';
      case 'high':     return 'priority--high';
      case 'medium':   return 'priority--medium';
      case 'low':      return 'priority--low';
      default:         return '';
    }
  }

  goBack(): void {
    window.history.back();
  }

  private getRedirectRoute(): string {
    const role = this.tokenStorage.getRole();
    return role ? ROLE_DASHBOARD_ROUTE[role] : '/login';
  }
}
