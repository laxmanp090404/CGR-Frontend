import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { forkJoin } from 'rxjs';

import { ComplaintService } from '../../../../services/complaint.service';
import { ToastService } from '../../../../shared/services/toast.service';
import { DashboardShellComponent, NavItem } from '../../../../shared/components/dashboard-shell/dashboard-shell';
import { baseUrl } from '../../../../../environment';

export interface StatusConfig {
  label: string;
  textColor: string;
  bgColor: string;
}

@Component({
  selector: 'app-complaint-detail',
  standalone: true,
  imports: [CommonModule, RouterModule, DashboardShellComponent],
  templateUrl: './complaint-detail.html',
  styleUrl: './complaint-detail.scss',
})
export class ComplaintDetailComponent implements OnInit {
  private readonly complaintService = inject(ComplaintService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly toast = inject(ToastService);

  readonly isLoading = signal(true);
  readonly complaint = signal<any | null>(null);
  readonly history = signal<any[]>([]);
  readonly escalations = signal<any[]>([]);
  
  readonly apiBaseUrl = baseUrl;

  readonly STATUS_CONFIG: Record<number, StatusConfig> = {
    1: { label: 'Submitted', textColor: '#3B82F6', bgColor: '#DBEAFE' },
    2: { label: 'Assigned', textColor: '#F59E0B', bgColor: '#FEF3C7' },
    3: { label: 'In Progress', textColor: '#D97706', bgColor: '#FEF3C7' },
    4: { label: 'Escalated', textColor: '#7C3AED', bgColor: '#EDE9FE' },
    5: { label: 'Resolved', textColor: '#10B981', bgColor: '#D1FAE5' },
    6: { label: 'Closed', textColor: '#6B7280', bgColor: '#F3F4F6' },
    7: { label: 'Rejected', textColor: '#DC2626', bgColor: '#FEE2E2' },
    8: { label: 'Reopened', textColor: '#F97316', bgColor: '#FFEDD5' },
    9: { label: 'Externally Escalated', textColor: '#7C3AED', bgColor: '#EDE9FE' },
  };

  readonly navItems = signal<NavItem[]>([
    { label: 'Dashboard', route: '/dept-head/dashboard', icon: 'dashboard' },
    { label: 'Raise a Complaint', route: '/dept-head/raise-complaint', icon: 'raise' },
    { label: 'My Filed Complaints', route: '/dept-head/my-filed-complaints', icon: 'requests' },
    { label: 'Department Complaints', route: '/dept-head/department-complaints', icon: 'departments' },
    { label: 'My Work Queue', route: '/dept-head/my-work-queue', icon: 'work-queue' },
  ]);

  ngOnInit(): void {
    const idParam = this.route.snapshot.paramMap.get('id');
    if (!idParam) {
      this.toast.error('Invalid Complaint ID.');
      this.router.navigate(['/dept-head/dashboard']);
      return;
    }

    const complaintId = Number(idParam);
    this.loadComplaintData(complaintId);
  }

  loadComplaintData(id: number): void {
    this.isLoading.set(true);

    forkJoin({
      details: this.complaintService.getComplaintById(id),
      historyList: this.complaintService.getComplaintHistory(id),
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
        this.router.navigate(['/dept-head/dashboard']);
      },
    });
  }

  getAttachmentUrl(filePath: string): string {
    const cleanedPath = filePath.replace(/\\/g, '/');
    return `${this.apiBaseUrl}/${cleanedPath}`;
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
      case 'high': return 'priority--high';
      case 'medium': return 'priority--medium';
      case 'low': return 'priority--low';
      default: return '';
    }
  }

  goBack(): void {
    window.history.back();
  }
}
