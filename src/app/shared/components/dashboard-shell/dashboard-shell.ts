import { Component, input, inject, signal, HostListener, ElementRef } from '@angular/core';
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
  readonly title = input<string>('IssueBridge');

  private readonly tokenStorage = inject(TokenStorageService);
  private readonly router = inject(Router);
  private readonly elementRef = inject(ElementRef);

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

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    const target = event.target as HTMLElement;
    const userContainer = this.elementRef.nativeElement.querySelector('.header__user-container');
    if (userContainer && !userContainer.contains(target)) {
      this.isUserMenuOpen.set(false);
    }
  }
}
