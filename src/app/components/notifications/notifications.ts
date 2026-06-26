import { Component, computed, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { NotificationService } from '../../services/notification.service';
import { TokenStorageService } from '../../services/auth.api.service';
import { ToastService } from '../../shared/services/toast.service';
import { NotificationDto } from '../../models/notification.model';
import { DashboardShellComponent, NavItem } from '../../shared/components/dashboard-shell/dashboard-shell';
import { TableSkeletonComponent } from '../../shared/components/table-skeleton/table-skeleton';
import { getNavItems } from '../../shared/components/dashboard-shell/nav-menu';

@Component({
  selector: 'app-notifications',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    DashboardShellComponent,
    TableSkeletonComponent
  ],
  templateUrl: './notifications.html',
  styleUrl: './notifications.scss'
})
export class NotificationsComponent implements OnInit {
  private readonly notificationService = inject(NotificationService);
  private readonly tokenStorage = inject(TokenStorageService);
  private readonly toast = inject(ToastService);
  private readonly router = inject(Router);

  readonly isLoading = signal<boolean>(true);
  readonly notifications = signal<NotificationDto[]>([]);
  readonly totalCount = signal<number>(0);
  readonly currentPage = signal<number>(1);
  readonly pageSize = signal<number>(10);

  readonly filterIsRead = signal<boolean | null>(null);

  readonly selectedIds = signal<Set<number>>(new Set());

  readonly isCustomPageSize = signal<boolean>(false);
  readonly pageSizeDropdownValue = signal<string>('10');

  readonly navItems = computed<NavItem[]>(() => {
    const role = this.tokenStorage.getRole();
    return role ? getNavItems(role) : [];
  });

  readonly totalPages = computed(() => {
    return Math.ceil(this.totalCount() / this.pageSize());
  });

  readonly pageNumbers = computed(() => {
    const total = this.totalPages();
    return Array.from({ length: total }, (_, i) => i + 1);
  });

  readonly isAllSelected = computed(() => {
    const items = this.notifications();
    const selected = this.selectedIds();
    if (items.length === 0) return false;
    return items.every(item => selected.has(item.notificationId));
  });

  readonly selectedCount = computed(() => {
    return this.selectedIds().size;
  });

  ngOnInit(): void {
    this.loadNotifications();
  }

  loadNotifications(): void {
    this.isLoading.set(true);
    this.notificationService.getPagedNotifications(
      this.filterIsRead(),
      this.currentPage(),
      this.pageSize()
    ).subscribe({
      next: (res) => {
        this.notifications.set(res.items);
        this.totalCount.set(res.totalCount);
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error('Failed to load notifications', err);
        this.toast.error('Failed to load notifications.');
        this.isLoading.set(false);
      }
    });
  }

  onFilterChange(isRead: boolean | null): void {
    this.filterIsRead.set(isRead);
    this.currentPage.set(1);
    this.selectedIds.set(new Set());
    this.loadNotifications();
  }

  onDropdownPageSizeChange(value: string): void {
    this.pageSizeDropdownValue.set(value);
    if (value === 'custom') {
      this.isCustomPageSize.set(true);
    } else {
      this.isCustomPageSize.set(false);
      const size = Number(value);
      this.pageSize.set(size);
      this.currentPage.set(1);
      this.selectedIds.set(new Set());
      this.loadNotifications();
    }
  }

  onCustomPageSizeChange(value: any): void {
    const size = Number(value);
    if (size > 0) {
      this.pageSize.set(size);
      this.currentPage.set(1);
      this.selectedIds.set(new Set());
      this.loadNotifications();
    }
  }

  goToPage(page: number): void {
    if (page < 1 || page > this.totalPages()) return;
    this.currentPage.set(page);
    this.selectedIds.set(new Set());
    this.loadNotifications();
  }

  toggleSelect(id: number, event: Event): void {
    event.stopPropagation();
    const current = new Set(this.selectedIds());
    if (current.has(id)) {
      current.delete(id);
    } else {
      current.add(id);
    }
    this.selectedIds.set(current);
  }

  toggleSelectAll(): void {
    const current = new Set(this.selectedIds());
    const items = this.notifications();
    const allSelected = this.isAllSelected();

    if (allSelected) {
      // Unselect all items on the current page
      items.forEach(item => current.delete(item.notificationId));
    } else {
      // Select all items on the current page
      items.forEach(item => current.add(item.notificationId));
    }
    this.selectedIds.set(current);
  }

  markSelectedAsRead(): void {
    const ids = Array.from(this.selectedIds());
    if (ids.length === 0) return;

    this.isLoading.set(true);
    this.notificationService.markMultipleAsRead(ids).subscribe({
      next: () => {
        this.toast.success(`Successfully marked ${ids.length} notifications as read.`);
        this.selectedIds.set(new Set());
        this.loadNotifications();
      },
      error: (err) => {
        console.error('Error marking selected notifications as read', err);
        this.toast.error('Failed to mark notifications as read.');
        this.isLoading.set(false);
      }
    });
  }

  markAllAsRead(): void {
    this.isLoading.set(true);
    this.notificationService.markAllRead().subscribe({
      next: () => {
        this.toast.success('All notifications marked as read.');
        this.selectedIds.set(new Set());
        this.loadNotifications();
      },
      error: (err) => {
        console.error('Error marking all notifications as read', err);
        this.toast.error('Failed to mark all notifications as read.');
        this.isLoading.set(false);
      }
    });
  }

  markSingleRead(id: number, event: MouseEvent): void {
    event.stopPropagation();
    this.notificationService.markAsRead(id).subscribe({
      next: () => {
        this.toast.success('Notification marked as read.');
        // Update local state isRead to true
        this.notifications.update(items =>
          items.map(item => item.notificationId === id ? { ...item, isRead: true } : item)
        );
      },
      error: (err) => {
        console.error('Error marking notification as read', err);
        this.toast.error('Failed to mark notification as read.');
      }
    });
  }

  onNotificationClick(notif: NotificationDto): void {
    if (!notif.isRead) {
      this.notificationService.markAsRead(notif.notificationId).subscribe({
        next: () => {
          this.notifications.update(items =>
            items.map(item => item.notificationId === notif.notificationId ? { ...item, isRead: true } : item)
          );
          this.navigateForNotification(notif);
        },
        error: () => this.navigateForNotification(notif)
      });
    } else {
      this.navigateForNotification(notif);
    }
  }

  private navigateForNotification(notif: NotificationDto): void {
    if (notif.referenceComplaintId) {
      const role = this.tokenStorage.getRole();
      if (role) {
        let rolePrefix = role.toLowerCase();
        if (role === 'DEPARTMENT_HEAD') {
          rolePrefix = 'dept-head';
        }
        const detailRoute = `/${rolePrefix}/complaints/${notif.referenceComplaintId}`;
        this.router.navigate([detailRoute]);
      }
    }
  }
}
