import { Component, input, inject, signal, HostListener, ElementRef, computed } from '@angular/core';
import { Router, RouterModule, NavigationEnd } from '@angular/router';
import { CommonModule } from '@angular/common';
import { filter } from 'rxjs/operators';
import { TokenStorageService } from '../../../services/auth.api.service';
import { AnalyticsService } from '../../../services/analytics.service';
import { NotificationService } from '../../../services/notification.service';

export interface NavItem {
  label: string;
  route: string;
  icon?: string;
  badge?: number | null;
}

@Component({
  selector: 'app-dashboard-shell',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './dashboard-shell.html',
  styleUrl: './dashboard-shell.scss',
})
export class DashboardShellComponent {
  readonly navItems = input.required<NavItem[]>();
  readonly title = input<string>('IssueBridge');

  private readonly tokenStorage = inject(TokenStorageService);
  private readonly router = inject(Router);
  private readonly elementRef = inject(ElementRef);
  private readonly analyticsService = inject(AnalyticsService);
  private readonly notificationService = inject(NotificationService);

  readonly unreadCount = this.notificationService.unreadCount;
  readonly currentUrl = signal(this.router.url);

  readonly isAdmin = computed(() => {
    return this.tokenStorage.getRole() === 'ADMIN';
  });

  readonly activeTab = computed(() => {
    const url = this.currentUrl();
    if (url.includes('/admin/departments') || 
        url.includes('/admin/categories') || 
        url.includes('/admin/employees') || 
        url.includes('/admin/role-requests')) {
      return 'system';
    }
    return 'home';
  });

  readonly dynamicNavItems = computed(() => {
    let items = this.navItems();
    const pcr = this.analyticsService.pendingComplaintRequests();
    const prr = this.analyticsService.pendingRoleRequests();
    
    // Map badges
    items = items.map((item) => {
      if (item.label === 'Complaint Requests' && pcr !== null) {
        return { ...item, badge: pcr };
      }
      if (item.label === 'Role Requests' && prr !== null) {
        return { ...item, badge: prr };
      }
      return item;
    });

    if (this.isAdmin()) {
      const active = this.activeTab();
      const systemRoutes = [
        '/admin/departments',
        '/admin/categories',
        '/admin/employees',
        '/admin/role-requests'
      ];
      if (active === 'system') {
        return items.filter(item => systemRoutes.includes(item.route));
      } else {
        return items.filter(item => !systemRoutes.includes(item.route));
      }
    }

    return items;
  });

  constructor() {
    // Listen for route changes
    this.router.events.pipe(
      filter((event): event is NavigationEnd => event instanceof NavigationEnd)
    ).subscribe((event) => {
      this.currentUrl.set(event.urlAfterRedirects || event.url);
    });

    const role = this.tokenStorage.getRole();
    if (role === 'ADMIN') {
      if (this.analyticsService.pendingComplaintRequests() === null) {
        this.analyticsService.getAdminDashboard().subscribe({
          next: (data) => {
            this.analyticsService.pendingComplaintRequests.set(data.pendingComplaintRequests);
            this.analyticsService.pendingRoleRequests.set(data.pendingRoleRequests);
          },
        });
      }
    }
  }

  setTab(tab: 'home' | 'system'): void {
    if (tab === 'home') {
      this.router.navigate(['/admin/dashboard']);
    } else {
      this.router.navigate(['/admin/employees']);
    }
  }

  readonly session = this.tokenStorage.session;
  readonly isMobileMenuOpen = signal(false);
  readonly isUserMenuOpen = signal(false);

  toggleMobileMenu(): void {
    this.isMobileMenuOpen.update((v) => !v);
  }

  toggleUserMenu(event: MouseEvent): void {
    event.stopPropagation();
    this.isUserMenuOpen.update((v) => !v);
  }

  logout(): void {
    this.tokenStorage.clear();
    this.router.navigate(['/login']);
  }

  goToNotifications(): void {
    const role = this.tokenStorage.getRole();
    if (!role) return;

    let path = '';
    switch (role) {
      case 'EMPLOYEE':
        path = '/employee/notifications';
        break;
      case 'GRO':
        path = '/gro/notifications';
        break;
      case 'ADMIN':
        path = '/admin/notifications';
        break;
      case 'DEPARTMENT_HEAD':
        path = '/dept-head/notifications';
        break;
      default:
        return;
    }
    this.router.navigate([path]);
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    const target = event.target as HTMLElement;
    const userContainer = this.elementRef.nativeElement.querySelector('.header__user-container');
    if (userContainer && !userContainer.contains(target)) {
      this.isUserMenuOpen.set(false);
    }
  }
}
