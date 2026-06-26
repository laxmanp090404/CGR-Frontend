import { Component, input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-table-skeleton',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './table-skeleton.html',
  styleUrl: './table-skeleton.scss',
})
export class TableSkeletonComponent {
  readonly cols = input<number>(8);
  readonly rows = input<number>(5);
  readonly showHeader = input<boolean>(true);

  get colsArray(): number[] {
    return Array(this.cols()).fill(0);
  }

  get rowsArray(): number[] {
    return Array(this.rows()).fill(0);
  }

  getColumnClass(colIndex: number): string {
    if (colIndex === 0) return 'skeleton-col-id';
    if (colIndex === 1) return 'skeleton-col-title';
    if (colIndex === 4 || colIndex === 5) return 'skeleton-col-badge';
    return 'skeleton-col-text';
  }
}
