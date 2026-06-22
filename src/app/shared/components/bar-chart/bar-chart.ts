import {
  Component,
  ElementRef,
  ViewChild,
  input,
  afterNextRender,
  OnDestroy,
  effect,
} from '@angular/core';
import { Chart, ChartConfiguration, registerables } from 'chart.js';

Chart.register(...registerables);

export interface BarChartItem {
  label: string;
  value: number;
}

@Component({
  selector: 'app-bar-chart',
  standalone: true,
  templateUrl: './bar-chart.html',
  styleUrl: './bar-chart.scss',
})
export class BarChartComponent implements OnDestroy {
  readonly data = input.required<BarChartItem[]>();
  readonly title = input<string>('');
  readonly layout = input<'vertical' | 'horizontal'>('vertical');
  readonly colorVariant = input<'primary' | 'secondary' | 'success' | 'error'>('primary');

  @ViewChild('chartCanvas', { static: true }) chartCanvas!: ElementRef<HTMLCanvasElement>;

  private chart: Chart | null = null;
  private isBrowser = false;

  constructor() {
    afterNextRender(() => {
      this.isBrowser = true;
      this.createChart();
    });

    effect(() => {
      const currentData = this.data();
      if (this.isBrowser && this.chart) {
        this.updateChart(currentData);
      }
    });
  }

  ngOnDestroy(): void {
    if (this.chart) {
      this.chart.destroy();
    }
  }

  private createChart(): void {
    const ctx = this.chartCanvas.nativeElement.getContext('2d');
    if (!ctx) return;

    const config = this.getChartConfig();
    this.chart = new Chart(ctx, config);
  }

  private updateChart(list: BarChartItem[]): void {
    if (!this.chart) return;
    const labels = list.map((item) => item.label);
    const dataPoints = list.map((item) => item.value);

    this.chart.data.labels = labels;
    this.chart.data.datasets[0].data = dataPoints;
    this.chart.update();
  }

  private getThemeColor(): string {
    const variant = this.colorVariant();
    if (variant === 'secondary') return '#fea619'; // Amber
    if (variant === 'success') return '#26ac52'; // Green
    if (variant === 'error') return '#ba1a1a'; // Red
    return '#0f2d5e'; // Deep Navy / Primary
  }

  private getChartConfig(): ChartConfiguration {
    const list = this.data() || [];
    const labels = list.map((item) => item.label);
    const dataPoints = list.map((item) => item.value);
    const color = this.getThemeColor();
    const isHorizontal = this.layout() === 'horizontal';

    return {
      type: 'bar',
      data: {
        labels,
        datasets: [
          {
            label: this.title() || 'Complaints',
            data: dataPoints,
            backgroundColor: color,
            borderColor: color,
            borderWidth: 1,
            borderRadius: 4,
          },
        ],
      },
      options: {
        indexAxis: isHorizontal ? 'y' : 'x',
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: false,
          },
          tooltip: {
            callbacks: {
              label: (context) => ` ${context.formattedValue}`,
            },
          },
        },
        scales: {
          x: {
            grid: {
              display: !isHorizontal,
            },
            ticks: {
              font: {
                family: 'Inter',
                size: 11,
              },
            },
          },
          y: {
            beginAtZero: true,
            grid: {
              display: isHorizontal,
            },
            ticks: {
              font: {
                family: 'Inter',
                size: 11,
              },
            },
          },
        },
      },
    };
  }
}
