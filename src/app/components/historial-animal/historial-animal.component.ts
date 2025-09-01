import { Component, OnInit, OnDestroy, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Chart, ChartConfiguration } from 'chart.js/auto';
import { GanadoService } from '../../services/ganado.service';
import { Ganado, HistorialPeso, HistorialMedidas, HistorialEstado } from '../../interfaces/ganado.interface';
import { DatePipe } from '@angular/common';

@Component({
  selector: 'app-historial-animal',
  templateUrl: './historial-animal.component.html',
  styleUrls: ['./historial-animal.component.scss'],
  standalone: true,
  imports: [CommonModule],
  providers: [DatePipe]
})
export class HistorialAnimalComponent implements OnInit, OnDestroy {
  @Input() animal: Ganado | null = null;
  pesoChart: Chart | null = null;
  medidasChart: Chart | null = null;
  estadoChart: Chart | null = null;

  constructor(
    private ganadoService: GanadoService,
    private datePipe: DatePipe
  ) {}

  ngOnInit(): void {
    if (this.animal) {
      this.initializeCharts();
    }
  }

  private initializeCharts(): void {
    if (!this.animal) return;

    // Inicializar gráfico de peso
    const pesoCtx = document.getElementById('pesoChart') as HTMLCanvasElement;
    if (pesoCtx) {
      const pesoConfig: ChartConfiguration = {
        type: 'line',
        data: {
          labels: this.animal.historialPeso.map((h: HistorialPeso) => 
            this.datePipe.transform(h.fecha, 'dd/MM/yyyy') || ''
          ),
          datasets: [{
            label: 'Peso (kg)',
            data: this.animal.historialPeso.map((h: HistorialPeso) => h.peso),
            borderColor: '#4CAF50',
            tension: 0.1
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false
        }
      };
      this.pesoChart = new Chart(pesoCtx, pesoConfig);
    }

    // Inicializar gráfico de medidas
    const medidasCtx = document.getElementById('medidasChart') as HTMLCanvasElement;
    if (medidasCtx) {
      const medidasConfig: ChartConfiguration = {
        type: 'line',
        data: {
          labels: this.animal.historialMedidas.map((h: HistorialMedidas) => 
            this.datePipe.transform(h.fecha, 'dd/MM/yyyy') || ''
          ),
          datasets: [
            {
              label: 'Altura (cm)',
              data: this.animal.historialMedidas.map((h: HistorialMedidas) => h.altura),
              borderColor: '#2196F3',
              tension: 0.1
            },
            {
              label: 'Circunferencia (cm)',
              data: this.animal.historialMedidas.map((h: HistorialMedidas) => h.circunferencia),
              borderColor: '#FFC107',
              tension: 0.1
            }
          ]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false
        }
      };
      this.medidasChart = new Chart(medidasCtx, medidasConfig);
    }

    // Inicializar gráfico de estado
    const estadoCtx = document.getElementById('estadoChart') as HTMLCanvasElement;
    if (estadoCtx) {
      // Función para convertir estado a valor numérico
      const estadoToNumber = (estado: string): number => {
        switch (estado.toLowerCase()) {
          case 'activo':
            return 3;
          case 'inactivo':
            return 1;
          case 'en tratamiento':
            return 2;
          default:
            return 0;
        }
      };

      const estadoConfig: ChartConfiguration = {
        type: 'line',
        data: {
          labels: this.animal.historialEstado.map((h: HistorialEstado) => 
            this.datePipe.transform(h.fecha, 'dd/MM/yyyy') || ''
          ),
          datasets: [{
            label: 'Estado',
            data: this.animal.historialEstado.map((h: HistorialEstado) => estadoToNumber(h.estado)),
            borderColor: '#9C27B0',
            tension: 0.1
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          scales: {
            y: {
              ticks: {
                callback: function(value) {
                  switch (value) {
                    case 3:
                      return 'Activo';
                    case 2:
                      return 'En tratamiento';
                    case 1:
                      return 'Inactivo';
                    default:
                      return 'Desconocido';
                  }
                }
              }
            }
          }
        }
      };
      this.estadoChart = new Chart(estadoCtx, estadoConfig);
    }
  }

  ngOnDestroy(): void {
    if (this.pesoChart) this.pesoChart.destroy();
    if (this.medidasChart) this.medidasChart.destroy();
    if (this.estadoChart) this.estadoChart.destroy();
  }
} 