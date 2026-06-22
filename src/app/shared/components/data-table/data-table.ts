import { Component, input, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';

export interface DataTableColumn {
  key: string;
  label: string;
  sortable?: boolean;
  type?: 'text' | 'number' | 'percent' | 'duration' | 'custom';
}

@Component({
  selector: 'app-data-table',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './data-table.html',
  styleUrl: './data-table.scss',
})
export class DataTableComponent {
  readonly columns = input.required<DataTableColumn[]>();
  readonly rows = input.required<any[]>();

  readonly sortBy = signal<string | null>(null);
  readonly sortDesc = signal<boolean>(false);

  readonly sortedRows = computed(() => {
    const list = [...(this.rows() || [])];
    const key = this.sortBy();
    if (!key) return list;

    const desc = this.sortDesc();
    return list.sort((a, b) => {
      let valA = a[key];
      let valB = b[key];

      if (valA === undefined || valA === null) valA = '';
      if (valB === undefined || valB === null) valB = '';

      if (typeof valA === 'string' && typeof valB === 'string') {
        return desc ? valB.localeCompare(valA) : valA.localeCompare(valB);
      }

      return desc ? (Number(valB) - Number(valA)) : (Number(valA) - Number(valB));
    });
  });

  toggleSort(col: DataTableColumn): void {
    if (col.sortable === false) return;
    const key = col.key;
    if (this.sortBy() === key) {
      this.sortDesc.update((v) => !v);
    } else {
      this.sortBy.set(key);
      this.sortDesc.set(false);
    }
  }

  getSlaClass(percent: number | null | undefined): string {
    if (percent === null || percent === undefined) return 'badge--neutral';
    if (percent >= 90) return 'badge--success';
    if (percent >= 70) return 'badge--warning';
    return 'badge--danger';
  }
}
