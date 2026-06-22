import { Component, input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-dashboard-skeleton',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './dashboard-skeleton.html',
  styleUrl: './dashboard-skeleton.scss',
})
export class DashboardSkeletonComponent {
  readonly cardCount = input<number>(4);
  readonly chartCount = input<number>(2);

  get cardsArray(): number[] {
    return Array(this.cardCount()).fill(0);
  }

  get chartsArray(): number[] {
    return Array(this.chartCount()).fill(0);
  }
}
