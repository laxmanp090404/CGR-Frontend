import { Component, input, inject, signal } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { TokenStorageService } from '../../../services/auth.api.service';

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
  readonly title = input<string>('CGR Platform');

  private readonly tokenStorage = inject(TokenStorageService);
  private readonly router = inject(Router);

  readonly session = this.tokenStorage.session;
  readonly isMobileMenuOpen = signal(false);

  toggleMobileMenu(): void {
    this.isMobileMenuOpen.update((v) => !v);
  }

  logout(): void {
    this.tokenStorage.clear();
    this.router.navigate(['/login']);
  }
}
