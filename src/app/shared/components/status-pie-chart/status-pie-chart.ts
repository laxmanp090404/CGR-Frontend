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
import { StatusDistributionDto } from '../../../models/analytics.model';

Chart.register(...registerables);

@Component({
  selector: 'app-status-pie-chart',
  standalone: true,
  templateUrl: './status-pie-chart.html',
  styleUrl: './status-pie-chart.scss',
})
export class StatusPieChartComponent implements OnDestroy {
  readonly data = input.required<StatusDistributionDto[]>();

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

  private updateChart(list: StatusDistributionDto[]): void {
    if (!this.chart) return;
    const { labels, dataPoints, colors } = this.processData(list);
    this.chart.data.labels = labels;
    this.chart.data.datasets[0].data = dataPoints;
    this.chart.data.datasets[0].backgroundColor = colors;
    this.chart.data.datasets[0].hoverBackgroundColor = colors;
    this.chart.update();
  }

  private processData(list: StatusDistributionDto[]) {
    const filtered = (list || []).filter((item) => item.count > 0);
    const labels = filtered.map((item) => item.statusName);
    const dataPoints = filtered.map((item) => item.count);
    const colors = filtered.map((item) => this.getColorForStatus(item.statusName));

    return { labels, dataPoints, colors };
  }

 private getColorForStatus(status: string): string {
  const statusUpper = status.toUpperCase();
  if (statusUpper.includes('SUBMITTED')) return '#3B82F6';   
  if (statusUpper.includes('ASSIGNED')) return '#F59E0B';    
  if (statusUpper.includes('PROGRESS')) return '#D97706';    
  if (statusUpper.includes('RESOLVED') || statusUpper.includes('CLOSED')) {
    return statusUpper.includes('CLOSED') ? '#6B7280' : '#10B981'; 
  }
  if (statusUpper.includes('REJECTED')) return '#DC2626';   
  if (statusUpper.includes('REOPENED')) return '#F97316';    
  if (statusUpper.includes('EXTERNALLY')) return '#260068ff';  
  if (statusUpper.includes('ESCALATED')) return '#7C3AED';   
  return '#6B7280'; 
}

  private getChartConfig(): ChartConfiguration<'doughnut'> {
    const { labels, dataPoints, colors } = this.processData(this.data());

    return {
      type: 'doughnut',
      data: {
        labels,
        datasets: [
          {
            data: dataPoints,
            backgroundColor: colors,
            hoverBackgroundColor: colors,
            borderWidth: 2,
            borderColor: '#ffffff',
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'bottom',
            labels: {
              boxWidth: 12,
              padding: 16,
              font: {
                family: 'Inter',
                size: 11,
              },
            },
          },
          tooltip: {
            callbacks: {
              label: (context) => {
                const val = context.raw;
                return ` ${context.label}: ${val}`;
              },
            },
          },
        },
        cutout: '65%',
      },
    };
  }
}
