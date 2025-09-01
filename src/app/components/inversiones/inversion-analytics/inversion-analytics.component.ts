import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BaseChartDirective } from 'ng2-charts';
import { ChartConfiguration } from 'chart.js';
import { InversionesService } from '../../../services/inversiones.service';
import { Inversion } from '../../../models/inversion.model';

@Component({
  selector: 'app-inversion-analytics',
  standalone: true,
  imports: [CommonModule, BaseChartDirective],
  templateUrl: './inversion-analytics.component.html',
  styleUrls: ['./inversion-analytics.component.scss']
})
export class InversionAnalyticsComponent implements OnInit {
  pieChartData: ChartConfiguration<'pie'>['data'] = {
    labels: [],
    datasets: [{
      data: [],
      backgroundColor: [
        '#FF6384',
        '#36A2EB',
        '#FFCE56',
        '#4BC0C0',
        '#9966FF'
      ]
    }]
  };

  barChartData: ChartConfiguration<'bar'>['data'] = {
    labels: ['Ganancia', 'Pérdida'],
    datasets: [{
      data: [0, 0],
      backgroundColor: ['#28a745', '#dc3545']
    }]
  };

  lineChartData: ChartConfiguration<'line'>['data'] = {
    labels: [],
    datasets: [{
      data: [],
      label: 'Inversiones',
      borderColor: '#36A2EB',
      tension: 0.1
    }]
  };

  selectedChart = 0; // 0: Distribución, 1: Ganancia vs Pérdida, 2: Evolución
  charts = [
    { label: 'Distribución por Tipo' },
    { label: 'Ganancia vs Pérdida' },
    { label: 'Evolución en el Tiempo' }
  ];

  constructor(private inversionesService: InversionesService) {}

  ngOnInit(): void {
    this.loadChartData();
  }

  setChart(idx: number) {
    this.selectedChart = idx;
  }

  private loadChartData(): void {
    this.inversionesService.getInversiones().subscribe(inversiones => {
      this.updatePieChart(inversiones);
      this.updateBarChart(inversiones);
      this.updateLineChart(inversiones);
    });
  }

  private updatePieChart(inversiones: Inversion[]): void {
    const tipos = Array.from(new Set(inversiones.map(i => i.tipo)));
    this.pieChartData.labels = tipos;
    this.pieChartData.datasets[0].data = tipos.map(tipo => 
      inversiones
        .filter(i => i.tipo === tipo)
        .reduce((sum, i) => sum + i.costo, 0)
    );
  }

  private updateBarChart(inversiones: Inversion[]): void {
    const ganancia = inversiones
      .filter(i => (i.resultado ?? 0) > 0)
      .reduce((sum, i) => sum + (i.resultado ?? 0), 0);
    
    const perdida = inversiones
      .filter(i => (i.resultado ?? 0) < 0)
      .reduce((sum, i) => sum + Math.abs(i.resultado ?? 0), 0);

    this.barChartData.datasets[0].data = [ganancia, perdida];
  }

  private updateLineChart(inversiones: Inversion[]): void {
    const fechas = Array.from(new Set(inversiones.map(i => i.fechaInicio))).sort();
    this.lineChartData.labels = fechas;
    this.lineChartData.datasets[0].data = fechas.map(fecha =>
      inversiones
        .filter(i => i.fechaInicio === fecha)
        .reduce((sum, i) => sum + i.costo, 0)
    );
  }
} 