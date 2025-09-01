import { Component, OnInit, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Chart, registerables } from 'chart.js';

Chart.register(...registerables);

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent implements OnInit, AfterViewInit {
  @ViewChild('weightChart') weightChartCanvas!: ElementRef;
  @ViewChild('investmentChart') investmentChartCanvas!: ElementRef;

  private weightChart: Chart | null = null;
  private investmentChart: Chart | null = null;

  // KPI Cards Data
  kpiData = {
    totalAnimals: 150,
    averageWeight: 450,
    totalInvestment: 250000,
    estimatedProfitability: 15.5
  };

  // Weight Evolution Chart Data
  weightChartData = {
    labels: ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun'],
    datasets: [{
      label: 'Peso Promedio (kg)',
      data: [420, 430, 435, 440, 445, 450],
      borderColor: '#4CAF50',
      backgroundColor: 'rgba(76, 175, 80, 0.1)',
      tension: 0.4,
      fill: true
    }]
  };

  // Investment Chart Data
  investmentChartData = {
    labels: ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun'],
    datasets: [{
      label: 'Inversión Total ($)',
      data: [200000, 210000, 220000, 230000, 240000, 250000],
      backgroundColor: 'rgba(33, 150, 243, 0.5)',
      borderColor: '#2196F3',
      borderWidth: 1
    }]
  };

  chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
        labels: {
          font: {
            family: 'Poppins',
            size: 12
          }
        }
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        grid: {
          color: 'rgba(0, 0, 0, 0.1)'
        },
        ticks: {
          font: {
            family: 'Poppins',
            size: 12
          }
        }
      },
      x: {
        grid: {
          color: 'rgba(0, 0, 0, 0.1)'
        },
        ticks: {
          font: {
            family: 'Poppins',
            size: 12
          }
        }
      }
    }
  };

  constructor() { }

  ngOnInit(): void {
  }

  ngAfterViewInit(): void {
    this.initializeCharts();
  }

  private initializeCharts(): void {
    // Initialize Weight Chart
    const weightCtx = this.weightChartCanvas.nativeElement.getContext('2d');
    this.weightChart = new Chart(weightCtx, {
      type: 'line',
      data: this.weightChartData,
      options: this.chartOptions
    });

    // Initialize Investment Chart
    const investmentCtx = this.investmentChartCanvas.nativeElement.getContext('2d');
    this.investmentChart = new Chart(investmentCtx, {
      type: 'bar',
      data: this.investmentChartData,
      options: this.chartOptions
    });
  }
} 