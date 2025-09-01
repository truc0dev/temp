import { Component, OnInit, ViewChild, ElementRef, ViewEncapsulation, PLATFORM_ID, Inject, HostListener, AfterViewInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { trigger, style, animate, transition } from '@angular/animations';
import { isPlatformBrowser } from '@angular/common';
import { GanadoService } from '../../services/ganado.service';
import { Chart, ChartConfiguration, registerables } from 'chart.js';
import { HistorialAnimalComponent } from '../historial-animal/historial-animal.component';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import * as L from 'leaflet';

Chart.register(...registerables);

interface Ganado {
  id: string;
  identificacion: string;
  raza: string;
  sexo: string;
  edad: number;
  peso: number;
  estado: string;
  ubicacion: string;
  condicionCorporal: number;
  campo: string;
  ultimaActualizacion: Date;
  largoPelvis?: number;
  anchoPelvis?: number;
  alturaAnca?: number;
  categoria?: string;
  historialPeso: { fecha: Date; peso: number }[];
  historialMedidas: { fecha: Date; altura: number; circunferencia: number }[];
  historialEstado: { fecha: Date; estado: string }[];
}

@Component({
  selector: 'app-mi-ganado',
  standalone: true,
  imports: [CommonModule, FormsModule, HistorialAnimalComponent],
  templateUrl: './mi-ganado.component.html',
  styleUrls: ['./mi-ganado.component.css'],
  encapsulation: ViewEncapsulation.None,
  animations: [
    trigger('fadeIn', [
      transition(':enter', [
        style({ opacity: 0 }),
        animate('300ms ease-out', style({ opacity: 1 }))
      ])
    ]),
    trigger('slideIn', [
      transition(':enter', [
        style({ 
          opacity: 0,
          transform: 'translate(-50%, -40%) scale(0.95)'
        }),
        animate('400ms cubic-bezier(0.4, 0, 0.2, 1)', style({ 
          opacity: 1,
          transform: 'translate(-50%, -50%) scale(1)'
        }))
      ]),
      transition(':leave', [
        animate('300ms cubic-bezier(0.4, 0, 0.2, 1)', style({ 
          opacity: 0,
          transform: 'translate(-50%, -40%) scale(0.95)'
        }))
      ])
    ])
  ]
})
export class MiGanadoComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('searchInput') searchInput!: ElementRef;
  @ViewChild('tableContainer') tableContainer!: ElementRef;
  @ViewChild('table') table!: ElementRef;
  @ViewChild('weightChart') weightChart!: ElementRef<HTMLCanvasElement>;
  @ViewChild('performanceChart') performanceChart!: ElementRef<HTMLCanvasElement>;
  @ViewChild('medidas3DContainer') medidas3DContainer!: ElementRef<HTMLDivElement>;
  @ViewChild('estadoChart') estadoChart!: ElementRef<HTMLCanvasElement>;
  @ViewChild('campoChartCanvas') campoChartCanvas!: ElementRef<HTMLCanvasElement>;
  @ViewChild('animalMapContainer') animalMapContainer!: ElementRef<HTMLDivElement>;
  @ViewChild('profitChart') profitChart!: ElementRef<HTMLCanvasElement>;

  ganado: Ganado[] = [];
  filteredGanado: Ganado[] = [];
  searchTerm: string = '';
  sortField: keyof Ganado | null = null;
  sortDirection: 'asc' | 'desc' = 'asc';
  currentPage: number = 1;
  itemsPerPage: number = 10;
  showContextMenu: boolean = false;
  contextMenuX: number = 0;
  contextMenuY: number = 0;
  selectedGanado: Ganado | null = null;
  isBrowser: boolean = false;
  editingField: { id: string; field: keyof Ganado } | null = null;
  showChartPanel: boolean = false;
  chartType: 'weight' | 'performance' | 'individual' | 'detalles' = 'weight';
  selectedAnimal: Ganado | null = null;
  private charts: { [key: string]: Chart | null } = {
    weight: null,
    performance: null,
    medidas: null,
    estado: null
  };
  showHistorial: boolean = false;
  selectedAnimalForHistorial: Ganado | null = null;
  private campoChartInstance: Chart | null = null;
  showProfitChart: boolean = false;

  private scene!: THREE.Scene;
  private camera!: THREE.PerspectiveCamera;
  private renderer!: THREE.WebGLRenderer;
  private controls!: OrbitControls;
  private medidas3DObject!: THREE.Group;
  private animationFrameId: number | null = null;

  private animalMap?: L.Map;
  private profitChartInstance: Chart | null = null;

  contextMenuItems = [
    {
      label: 'Ver detalles',
      icon: 'fas fa-eye',
      action: (animal: any) => this.verDetalles(animal)
    },
    {
      label: 'Ver historial',
      icon: 'fas fa-history',
      action: (animal: any) => this.verHistorial(animal)
    },
    {
      label: 'Eliminar',
      icon: 'fas fa-trash-alt',
      class: 'danger',
      action: (animal: any) => this.eliminarAnimal(animal)
    }
  ];

  get chartTitle(): string {
    if (this.selectedAnimal) {
      return `Rendimiento de ${this.selectedAnimal.identificacion}`;
    }
    
    switch (this.chartType) {
      case 'weight':
        return 'Distribución de Pesos';
      case 'performance':
        return 'Rendimiento Histórico';
      default:
        return '';
    }
  }

  constructor(
    @Inject(PLATFORM_ID) private platformId: Object,
    private ganadoService: GanadoService
  ) {
    this.isBrowser = isPlatformBrowser(platformId);
  }

  ngOnInit(): void {
    this.loadGanado();
    if (this.isBrowser) {
      window.addEventListener('click', () => this.hideContextMenu());
    }
  }

  ngAfterViewInit(): void {
    if (this.showChartPanel) {
      this.initializeAllCharts();
    }
    this.initProfitChartIfNeeded();
  }

  ngOnChanges(): void {
    this.initProfitChartIfNeeded();
  }

  ngDoCheck(): void {
    this.initProfitChartIfNeeded();
  }

  ngOnDestroy(): void {
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
    }
    if (this.renderer) {
      this.renderer.dispose();
    }
    this.destroyAllCharts();
    if (this.animalMap) {
      this.animalMap.remove();
      this.animalMap = undefined;
    }
  }

  private generateHistoriales(peso: number, altura: number, circunferencia: number) {
    // Valores para ancho y largo de pelvis basados en promedios reales
    const anchoPelvisBase = altura * 0.33; // Aproximadamente 1/3 de la altura
    const largoPelvisBase = altura * 0.36; // Aproximadamente 36% de la altura

    return {
      historialPeso: [
        { fecha: new Date(2024, 0, 1), peso: peso - 30 },
        { fecha: new Date(2024, 1, 1), peso: peso - 15 },
        { fecha: new Date(2024, 2, 1), peso: peso }
      ],
      historialMedidas: [
        { 
          fecha: new Date(2024, 0, 1), 
          altura: altura - 5, 
          circunferencia: circunferencia - 10,
          anchoPelvis: anchoPelvisBase - 2,
          largoPelvis: largoPelvisBase - 2
        },
        { 
          fecha: new Date(2024, 1, 1), 
          altura: altura - 3, 
          circunferencia: circunferencia - 5,
          anchoPelvis: anchoPelvisBase - 1,
          largoPelvis: largoPelvisBase - 1
        },
        { 
          fecha: new Date(2024, 2, 1), 
          altura: altura, 
          circunferencia: circunferencia,
          anchoPelvis: anchoPelvisBase,
          largoPelvis: largoPelvisBase
        }
      ],
      historialEstado: [
        { fecha: new Date(2024, 0, 1), estado: 'Saludable' },
        { fecha: new Date(2024, 1, 1), estado: 'Saludable' },
        { fecha: new Date(2024, 2, 1), estado: 'Activo' }
      ]
    };
  }

  loadGanado(): void {
    // Aquí cargaremos los datos de ganado
    this.ganado = [
      {
        id: '1',
        identificacion: 'GAN001',
        raza: 'Holstein',
        sexo: 'H',
        edad: 3,
        peso: 450,
        estado: 'Activo',
        ubicacion: 'Pasto 1',
        condicionCorporal: 5,
        campo: 'Campo Norte',
        ultimaActualizacion: new Date(),
        largoPelvis: 52,
        anchoPelvis: 48,
        alturaAnca: 142,
        ...this.generateHistoriales(450, 142, 190)
      },
      {
        id: '2',
        identificacion: 'GAN002',
        raza: 'Angus',
        sexo: 'M',
        edad: 2,
        peso: 600,
        estado: 'Activo',
        ubicacion: 'Pasto 2',
        condicionCorporal: 4,
        campo: 'Campo Sur',
        ultimaActualizacion: new Date(),
        largoPelvis: 54,
        anchoPelvis: 50,
        alturaAnca: 145,
        ...this.generateHistoriales(600, 145, 200)
      },
      {
        id: '3',
        identificacion: 'GAN003',
        raza: 'Hereford',
        sexo: 'H',
        edad: 4,
        peso: 520,
        estado: 'Activo',
        ubicacion: 'Pasto 3',
        condicionCorporal: 3,
        campo: 'Campo Este',
        ultimaActualizacion: new Date(),
        largoPelvis: 51,
        anchoPelvis: 47,
        alturaAnca: 140,
        ...this.generateHistoriales(520, 140, 195)
      },
      {
        id: '4',
        identificacion: 'GAN004',
        raza: 'Brahman',
        sexo: 'M',
        edad: 1,
        peso: 380,
        estado: 'Activo',
        ubicacion: 'Pasto 1',
        condicionCorporal: 4,
        campo: 'Campo Norte',
        ultimaActualizacion: new Date(),
        largoPelvis: 49,
        anchoPelvis: 45,
        alturaAnca: 138,
        ...this.generateHistoriales(380, 138, 175)
      },
      {
        id: '5',
        identificacion: 'GAN005',
        raza: 'Jersey',
        sexo: 'H',
        edad: 5,
        peso: 420,
        estado: 'Inactivo',
        ubicacion: 'Pasto 4',
        condicionCorporal: 2,
        campo: 'Campo Oeste',
        ultimaActualizacion: new Date(),
        largoPelvis: 48,
        anchoPelvis: 44,
        alturaAnca: 135,
        ...this.generateHistoriales(420, 135, 185)
      },
      {
        id: '6',
        identificacion: 'GAN006',
        raza: 'Simmental',
        sexo: 'M',
        edad: 3,
        peso: 580,
        estado: 'Activo',
        ubicacion: 'Pasto 2',
        condicionCorporal: 5,
        campo: 'Campo Sur',
        ultimaActualizacion: new Date(),
        largoPelvis: 53,
        anchoPelvis: 49,
        alturaAnca: 144,
        ...this.generateHistoriales(580, 144, 205)
      },
      {
        id: '7',
        identificacion: 'GAN007',
        raza: 'Charolais',
        sexo: 'H',
        edad: 2,
        peso: 480,
        estado: 'Activo',
        ubicacion: 'Pasto 5',
        condicionCorporal: 3,
        campo: 'Campo Este',
        ultimaActualizacion: new Date(),
        ...this.generateHistoriales(480, 128, 192)
      },
      {
        id: '8',
        identificacion: 'GAN008',
        raza: 'Limousin',
        sexo: 'M',
        edad: 4,
        peso: 650,
        estado: 'Activo',
        ubicacion: 'Pasto 3',
        condicionCorporal: 6,
        campo: 'Campo Norte',
        ultimaActualizacion: new Date(),
        ...this.generateHistoriales(650, 145, 210)
      },
      {
        id: '9',
        identificacion: 'GAN009',
        raza: 'Normando',
        sexo: 'H',
        edad: 3,
        peso: 490,
        estado: 'Activo',
        ubicacion: 'Pasto 1',
        condicionCorporal: 4,
        campo: 'Campo Oeste',
        ultimaActualizacion: new Date(),
        ...this.generateHistoriales(490, 129, 193)
      },
      {
        id: '10',
        identificacion: 'GAN010',
        raza: 'Brangus',
        sexo: 'M',
        edad: 2,
        peso: 550,
        estado: 'Inactivo',
        ubicacion: 'Pasto 4',
        condicionCorporal: 3,
        campo: 'Campo Sur',
        ultimaActualizacion: new Date(),
        ...this.generateHistoriales(550, 138, 198)
      },
      {
        id: '11',
        identificacion: 'GAN011',
        raza: 'Gyr',
        sexo: 'H',
        edad: 4,
        peso: 510,
        estado: 'Activo',
        ubicacion: 'Pasto 6',
        condicionCorporal: 5,
        campo: 'Campo Norte',
        ultimaActualizacion: new Date(),
        ...this.generateHistoriales(510, 132, 197)
      },
      {
        id: '12',
        identificacion: 'GAN012',
        raza: 'Nelore',
        sexo: 'M',
        edad: 3,
        peso: 620,
        estado: 'Activo',
        ubicacion: 'Pasto 2',
        condicionCorporal: 4,
        campo: 'Campo Sur',
        ultimaActualizacion: new Date(),
        ...this.generateHistoriales(620, 142, 208)
      },
      {
        id: '13',
        identificacion: 'GAN013',
        raza: 'Pardo Suizo',
        sexo: 'H',
        edad: 5,
        peso: 530,
        estado: 'Activo',
        ubicacion: 'Pasto 3',
        condicionCorporal: 6,
        campo: 'Campo Este',
        ultimaActualizacion: new Date(),
        ...this.generateHistoriales(530, 131, 196)
      },
      {
        id: '14',
        identificacion: 'GAN014',
        raza: 'Shorthorn',
        sexo: 'M',
        edad: 2,
        peso: 580,
        estado: 'Inactivo',
        ubicacion: 'Pasto 5',
        condicionCorporal: 3,
        campo: 'Campo Oeste',
        ultimaActualizacion: new Date(),
        ...this.generateHistoriales(580, 140, 205)
      },
      {
        id: '15',
        identificacion: 'GAN015',
        raza: 'Santa Gertrudis',
        sexo: 'H',
        edad: 3,
        peso: 495,
        estado: 'Activo',
        ubicacion: 'Pasto 1',
        condicionCorporal: 5,
        campo: 'Campo Norte',
        ultimaActualizacion: new Date(),
        ...this.generateHistoriales(495, 127, 191)
      },
      {
        id: '16',
        identificacion: 'GAN016',
        raza: 'Guzerá',
        sexo: 'M',
        edad: 4,
        peso: 640,
        estado: 'Activo',
        ubicacion: 'Pasto 4',
        condicionCorporal: 4,
        campo: 'Campo Sur',
        ultimaActualizacion: new Date(),
        ...this.generateHistoriales(640, 144, 209)
      },
      {
        id: '17',
        identificacion: 'GAN017',
        raza: 'Red Angus',
        sexo: 'H',
        edad: 2,
        peso: 470,
        estado: 'Activo',
        ubicacion: 'Pasto 2',
        condicionCorporal: 5,
        campo: 'Campo Este',
        ultimaActualizacion: new Date(),
        ...this.generateHistoriales(470, 126, 189)
      },
      {
        id: '18',
        identificacion: 'GAN018',
        raza: 'Senepol',
        sexo: 'M',
        edad: 3,
        peso: 590,
        estado: 'Inactivo',
        ubicacion: 'Pasto 6',
        condicionCorporal: 3,
        campo: 'Campo Oeste',
        ultimaActualizacion: new Date(),
        ...this.generateHistoriales(590, 141, 206)
      },
      {
        id: '19',
        identificacion: 'GAN019',
        raza: 'Beefmaster',
        sexo: 'H',
        edad: 4,
        peso: 515,
        estado: 'Activo',
        ubicacion: 'Pasto 3',
        condicionCorporal: 4,
        campo: 'Campo Norte',
        ultimaActualizacion: new Date(),
        ...this.generateHistoriales(515, 130, 194)
      },
      {
        id: '20',
        identificacion: 'GAN020',
        raza: 'Wagyu',
        sexo: 'M',
        edad: 5,
        peso: 670,
        estado: 'Activo',
        ubicacion: 'Pasto 5',
        condicionCorporal: 6,
        campo: 'Campo Sur',
        ultimaActualizacion: new Date(),
        ...this.generateHistoriales(670, 146, 211)
      }
    ];
    this.filteredGanado = [...this.ganado];
  }

  agregarAnimal(): void {
    const nuevoAnimal: Ganado = {
      id: (this.ganado.length + 1).toString(),
      identificacion: '',
      raza: '',
      sexo: 'H',
      edad: 0,
      peso: 0,
      estado: 'Activo',
      ubicacion: '',
      condicionCorporal: 1,
      campo: '',
      ultimaActualizacion: new Date(),
      ...this.generateHistoriales(0, 0, 0)
    };
    this.ganado.unshift(nuevoAnimal);
    this.filteredGanado = [...this.ganado];
    this.startEditing(nuevoAnimal.id, 'identificacion');
  }

  startEditing(id: string, field: keyof Ganado): void {
    this.editingField = { id, field };
  }

  stopEditing(): void {
    this.editingField = null;
  }

  isEditing(id: string, field: keyof Ganado): boolean {
    return this.editingField?.id === id && this.editingField?.field === field;
  }

  filterGanado(): void {
    if (!this.searchTerm.trim()) {
      this.filteredGanado = [...this.ganado];
      return;
    }

    const searchLower = this.searchTerm.toLowerCase();
    this.filteredGanado = this.ganado.filter(animal => 
      animal.identificacion.toLowerCase().includes(searchLower) ||
      animal.raza.toLowerCase().includes(searchLower) ||
      animal.sexo.toLowerCase().includes(searchLower) ||
      animal.estado.toLowerCase().includes(searchLower) ||
      animal.ubicacion.toLowerCase().includes(searchLower) ||
      animal.campo.toLowerCase().includes(searchLower)
    );
  }

  sortGanado(field: keyof Ganado): void {
    if (this.sortField === field) {
      this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortField = field;
      this.sortDirection = 'asc';
    }

    this.filteredGanado.sort((a, b) => {
      const valueA = a[field] ?? '';  // Use empty string or 0 as fallback
      const valueB = b[field] ?? '';
      
      if (valueA < valueB) return this.sortDirection === 'asc' ? -1 : 1;
      if (valueA > valueB) return this.sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
  }

  getSortIcon(field: keyof Ganado): string {
    if (this.sortField !== field) return 'fas fa-sort';
    return this.sortDirection === 'asc' ? 'fas fa-sort-up' : 'fas fa-sort-down';
  }

  get totalPages(): number {
    return Math.ceil(this.filteredGanado.length / this.itemsPerPage);
  }

  get paginatedGanado(): Ganado[] {
    const start = (this.currentPage - 1) * this.itemsPerPage;
    return this.filteredGanado.slice(start, start + this.itemsPerPage);
  }

  changePage(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
      this.scrollToTop();
    }
  }

  scrollToTop(): void {
    if (this.isBrowser && this.tableContainer) {
      this.tableContainer.nativeElement.scrollTop = 0;
    }
  }

  showContextMenuForGanado(event: MouseEvent, ganado: Ganado): void {
    event.preventDefault();
    this.selectedGanado = ganado;
    this.contextMenuX = event.clientX;
    this.contextMenuY = event.clientY;
    this.showContextMenu = true;
  }

  hideContextMenu(): void {
    this.showContextMenu = false;
    this.selectedGanado = null;
  }

  @HostListener('document:keydown.escape')
  onEscapePress(): void {
    this.hideContextMenu();
  }

  getStatusClass(estado: string): string {
    switch (estado.toLowerCase()) {
      case 'activo':
        return 'status-active';
      case 'inactivo':
        return 'status-inactive';
      default:
        return 'status-unknown';
    }
  }

  verDetalles(animal: Ganado | null): void {
    if (!animal) return;
    this.selectedAnimal = animal;
    this.chartType = 'detalles';
    this.showChartPanel = true;
    this.hideContextMenu();
    setTimeout(() => {
      this.initializeAnimalMap();
    }, 400);
  }

  verHistorial(animal: Ganado | null): void {
    if (!animal) return;
    this.selectedAnimalForHistorial = animal;
    this.showHistorial = true;
    this.hideContextMenu();
  }

  cerrarHistorial(): void {
    this.showHistorial = false;
    this.selectedAnimalForHistorial = null;
  }

  async eliminarAnimal(animal: Ganado | null): Promise<void> {
    if (!animal) return;
    
    if (confirm(`¿Estás seguro de que deseas eliminar el animal ${animal.identificacion}?`)) {
      try {
        await this.ganadoService.eliminarAnimal(animal.id);
        this.ganado = this.ganado.filter(g => g.id !== animal.id);
        this.filteredGanado = this.filteredGanado.filter(g => g.id !== animal.id);
        this.showMessage('Animal eliminado correctamente');
      } catch (error) {
        console.error('Error al eliminar el animal:', error);
        this.showMessage('Error al eliminar el animal', 'error');
      }
    }
    
    this.hideContextMenu();
  }

  showMessage(message: string, type: 'success' | 'error' = 'success'): void {
    console.log(`${type}: ${message}`);
  }

  toggleChartPanel(): void {
    this.showChartPanel = !this.showChartPanel;
    if (this.showChartPanel) {
      setTimeout(() => {
        if (this.selectedAnimal) {
          this.updateWeightChart();
          this.initialize3DVisualization();
        } else {
          this.updateWeightChartGeneral();
          this.updateCampoChart();
        }
      }, 400);
    } else {
      this.destroyAllCharts();
      this.selectedAnimal = null;
    }
  }

  showAnimalPerformance(animal: Ganado | null): void {
    if (!animal) return;
    this.selectedAnimal = animal;
    this.chartType = 'performance';
    this.showChartPanel = true;
    this.hideContextMenu();
    setTimeout(() => {
      this.initializeAllCharts();
      this.initializeAnimalMap();
    }, 400);
  }

  private initializeAllCharts(): void {
    if (this.selectedAnimal) {
      this.updateWeightChart();
      this.updatePerformanceChart();
      this.initialize3DVisualization();
      this.updateEstadoChart();
    }
  }

  private destroyAllCharts(): void {
    Object.values(this.charts).forEach(chart => {
      if (chart) {
        chart.destroy();
      }
    });
    this.charts = {
      weight: null,
      performance: null,
      medidas: null,
      estado: null
    };
  }

  updateWeightChart(): void {
    if (!this.weightChart || !this.isBrowser) return;

    const ctx = this.weightChart.nativeElement.getContext('2d');
    if (!ctx) return;

    if (this.charts['weight']) {
      this.charts['weight'].destroy();
    }

    const historicalData = this.generateAnimalHistoricalData(this.selectedAnimal!);
    const { labels, data } = this.calculatePerformanceTrend(historicalData);

    this.charts['weight'] = new Chart(ctx, {
      type: 'line',
      data: {
        labels: labels,
        datasets: [{
          label: 'Peso (kg)',
          data: data,
          borderColor: 'rgb(75, 192, 192)',
          backgroundColor: 'rgba(75, 192, 192, 0.1)',
          fill: true,
          tension: 0.4,
          pointRadius: 4,
          pointBackgroundColor: 'rgb(75, 192, 192)',
          pointBorderColor: '#fff',
          pointBorderWidth: 2
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: false
          }
        },
        scales: {
          y: {
            beginAtZero: false,
            title: {
              display: true,
              text: 'Peso (kg)',
              font: {
                weight: 'bold'
              }
            }
          },
          x: {
            title: {
              display: true,
              text: 'Fecha',
              font: {
                weight: 'bold'
              }
            }
          }
        }
      }
    });
  }

  updatePerformanceChart(): void {
    if (!this.performanceChart || !this.isBrowser) return;

    const ctx = this.performanceChart.nativeElement.getContext('2d');
    if (!ctx) return;

    if (this.charts['performance']) {
      this.charts['performance'].destroy();
    }

    const historicalData = this.generateAnimalHistoricalData(this.selectedAnimal!);
    const { labels, data } = this.calculatePerformanceTrend(historicalData);

    this.charts['performance'] = new Chart(ctx, {
      type: 'line',
      data: {
        labels: labels,
        datasets: [{
          label: 'Rendimiento (%)',
          data: data,
          borderColor: 'rgb(75, 192, 192)',
          backgroundColor: 'rgba(75, 192, 192, 0.1)',
          fill: true,
          tension: 0.4,
          pointRadius: 4,
          pointBackgroundColor: 'rgb(75, 192, 192)',
          pointBorderColor: '#fff',
          pointBorderWidth: 2
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: false
          }
          },
        scales: {
          y: {
            beginAtZero: true,
            max: 100,
          title: {
            display: true,
              text: 'Rendimiento (%)',
            font: {
              weight: 'bold'
              }
            }
          },
          x: {
            title: {
              display: true,
              text: 'Fecha',
              font: {
                weight: 'bold'
              }
            }
          }
        }
      }
    });
  }

  updateEstadoChart(): void {
    if (!this.estadoChart || !this.isBrowser) return;

    const ctx = this.estadoChart.nativeElement.getContext('2d');
    if (!ctx) return;

    if (this.charts['estado']) {
      this.charts['estado'].destroy();
    }

    const historicalData = this.generateAnimalHistoricalData(this.selectedAnimal!);
    const { labels, data } = this.calculatePerformanceTrend(historicalData);

    this.charts['estado'] = new Chart(ctx, {
      type: 'line',
      data: {
        labels: labels,
        datasets: [{
          label: 'Estado de Salud',
          data: data,
          borderColor: 'rgb(153, 102, 255)',
          backgroundColor: 'rgba(153, 102, 255, 0.1)',
          fill: true,
          tension: 0.4,
          pointRadius: 4,
          pointBackgroundColor: 'rgb(153, 102, 255)',
          pointBorderColor: '#fff',
          pointBorderWidth: 2
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: false
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            max: 100,
            title: {
              display: true,
              text: 'Estado (%)',
              font: {
                weight: 'bold'
              }
            }
          },
          x: {
            title: {
              display: true,
              text: 'Fecha',
              font: {
                weight: 'bold'
              }
            }
          }
        }
      }
    });
  }

  private generateAnimalHistoricalData(animal: Ganado): { date: Date; performance: number }[] {
    // Simular datos históricos de los últimos 6 meses para un animal específico
    const data = [];
    const today = new Date();
    let baseWeight = animal.peso;

    for (let i = 5; i >= 0; i--) {
      const date = new Date(today);
      date.setMonth(date.getMonth() - i);
      
      // Simular variación aleatoria en el peso
      const variation = (Math.random() - 0.5) * 20;
      const weight = Math.max(0, baseWeight + variation);
      
      data.push({
        date,
        performance: weight
      });
      
      baseWeight = weight;
    }

    return data;
  }

  private calculatePerformanceTrend(data: { date: Date; performance: number }[]): { 
    labels: string[], 
    data: number[], 
    trend: 'positive' | 'negative' | 'neutral' 
  } {
    const labels = data.map(d => d.date.toLocaleDateString('es-ES', { month: 'short', year: '2-digit' }));
    const values = data.map(d => d.performance);
    
    // Calcular la tendencia comparando el primer y último valor
    const firstValue = values[0];
    const lastValue = values[values.length - 1];
    const difference = lastValue - firstValue;
    
    let trend: 'positive' | 'negative' | 'neutral';
    if (difference > 2) {
      trend = 'positive';
    } else if (difference < -2) {
      trend = 'negative';
    } else {
      trend = 'neutral';
    }

    return {
      labels,
      data: values,
      trend
    };
  }

  private initialize3DVisualization(): void {
    if (!this.medidas3DContainer || !this.selectedAnimal) return;

    // Limpiar visualización anterior si existe
    if (this.renderer) {
      this.renderer.dispose();
    }

    // Inicializar escena
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0xf8f9fa);

    // Configurar cámara
    const container = this.medidas3DContainer.nativeElement;
    const aspect = container.clientWidth / container.clientHeight;
    this.camera = new THREE.PerspectiveCamera(60, aspect, 0.1, 1000);
    this.camera.position.set(200, 200, 200);
    this.camera.lookAt(0, 0, 0);

    // Configurar renderer
    this.renderer = new THREE.WebGLRenderer({ 
      antialias: true,
      alpha: true 
    });
    this.renderer.setPixelRatio(window.devicePixelRatio);
    this.renderer.setSize(container.clientWidth, container.clientHeight);
    container.innerHTML = '';
    container.appendChild(this.renderer.domElement);

    // Agregar controles orbitales
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.05;
    this.controls.minDistance = 100;
    this.controls.maxDistance = 400;
    this.controls.enablePan = true;
    this.controls.autoRotate = true;
    this.controls.autoRotateSpeed = 1.0;

    // Crear ejes personalizados
    this.createCustomAxes();

    // Crear punto de medidas
    this.createMeasurementPoint();

    // Agregar leyenda
    this.addLegend();

    // Iniciar animación
    this.animate();
  }

  private createCustomAxes(): void {
    const length = 150;
    const axesGroup = new THREE.Group();

    if (!this.selectedAnimal) return;
    const { largoPelvis = 0, anchoPelvis = 0, alturaAnca = 0 } = this.selectedAnimal;

    // Crear ejes
    const axes = [
      { color: 0xff0000, direction: new THREE.Vector3(1, 0, 0), label: `${anchoPelvis}`, value: anchoPelvis },
      { color: 0x00ff00, direction: new THREE.Vector3(0, 1, 0), label: `${alturaAnca}`, value: alturaAnca },
      { color: 0x0000ff, direction: new THREE.Vector3(0, 0, 1), label: `${largoPelvis}`, value: largoPelvis }
    ];

    axes.forEach(({ color, direction, label }) => {
      // Línea del eje
      const geometry = new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(0, 0, 0),
        direction.multiplyScalar(length)
      ]);
      const material = new THREE.LineBasicMaterial({ color });
      const line = new THREE.Line(geometry, material);
      axesGroup.add(line);

      // Etiqueta del eje con el valor numérico
      const labelSprite = this.createTextSprite(label, color);
      labelSprite.position.copy(direction.normalize().multiplyScalar(length * 1.1));
      axesGroup.add(labelSprite);

      // Marcas de escala cada 10 unidades
      for (let i = 10; i <= length; i += 10) {
        const tickGeometry = new THREE.BufferGeometry().setFromPoints([
          direction.clone().normalize().multiplyScalar(i),
          direction.clone().normalize().multiplyScalar(i).add(new THREE.Vector3(1, 1, 1))
        ]);
        const tick = new THREE.Line(tickGeometry, material);
        axesGroup.add(tick);

        // Número de escala
        const scaleSprite = this.createTextSprite(`${i}`, color);
        scaleSprite.position.copy(direction.clone().normalize().multiplyScalar(i));
        axesGroup.add(scaleSprite);
      }
    });

    this.scene.add(axesGroup);
  }

  private createMeasurementPoint(): void {
    if (!this.selectedAnimal) return;

    const { largoPelvis = 0, anchoPelvis = 0, alturaAnca = 0 } = this.selectedAnimal;

    // Crear esfera para el punto
    const geometry = new THREE.SphereGeometry(3);
    const material = new THREE.MeshBasicMaterial({ color: 0xffa500 });
    const point = new THREE.Mesh(geometry, material);
    point.position.set(anchoPelvis, alturaAnca, largoPelvis);

    // Crear líneas guía
    const lineMaterial = new THREE.LineDashedMaterial({
      color: 0x999999,
      dashSize: 3,
      gapSize: 1,
    });

    const createGuideLine = (start: THREE.Vector3, end: THREE.Vector3) => {
      const geometry = new THREE.BufferGeometry().setFromPoints([start, end]);
      const line = new THREE.Line(geometry, lineMaterial);
      line.computeLineDistances();
      return line;
    };

    // Líneas guía desde los ejes hasta el punto
    const guideLines = [
      createGuideLine(new THREE.Vector3(anchoPelvis, 0, 0), point.position),
      createGuideLine(new THREE.Vector3(0, alturaAnca, 0), point.position),
      createGuideLine(new THREE.Vector3(0, 0, largoPelvis), point.position)
    ];

    const measurementGroup = new THREE.Group();
    measurementGroup.add(point, ...guideLines);

    // Agregar etiquetas con valores
    const labels = [
      { text: `${anchoPelvis}cm`, position: new THREE.Vector3(anchoPelvis, 0, 0), color: 0xff0000 },
      { text: `${alturaAnca}cm`, position: new THREE.Vector3(0, alturaAnca, 0), color: 0x00ff00 },
      { text: `${largoPelvis}cm`, position: new THREE.Vector3(0, 0, largoPelvis), color: 0x0000ff }
    ];

    labels.forEach(({ text, position, color }) => {
      const sprite = this.createTextSprite(text, color);
      sprite.position.copy(position);
      measurementGroup.add(sprite);
    });

    this.scene.add(measurementGroup);
  }

  private createTextSprite(text: string, color: number): THREE.Sprite {
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    if (!context) return new THREE.Sprite();

    canvas.width = 256;
    canvas.height = 64;
    context.fillStyle = '#ffffff';
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.font = 'bold 24px Arial';
    context.fillStyle = `#${color.toString(16).padStart(6, '0')}`;
    context.textAlign = 'center';
    context.textBaseline = 'middle';
    context.fillText(text, canvas.width / 2, canvas.height / 2);

    const texture = new THREE.CanvasTexture(canvas);
    const material = new THREE.SpriteMaterial({ map: texture });
    const sprite = new THREE.Sprite(material);
    sprite.scale.set(10, 2.5, 1);
    return sprite;
  }

  private addLegend(): void {
    if (!this.selectedAnimal) return;
    const { largoPelvis = 0, anchoPelvis = 0, alturaAnca = 0 } = this.selectedAnimal;

    const legendDiv = document.createElement('div');
    legendDiv.style.position = 'absolute';
    legendDiv.style.top = '10px';
    legendDiv.style.right = '10px';
    legendDiv.style.background = 'rgba(255, 255, 255, 0.9)';
    legendDiv.style.padding = '4px 8px';
    legendDiv.style.borderRadius = '4px';
    legendDiv.style.boxShadow = '0 1px 2px rgba(0,0,0,0.08)';
    legendDiv.style.fontSize = '13px';
    legendDiv.style.minWidth = 'unset';
    legendDiv.style.width = 'auto';

    const items = [
      { color: '#ff0000', label: 'Ancho Pelvis', value: anchoPelvis },
      { color: '#00ff00', label: 'Altura Anca', value: alturaAnca },
      { color: '#0000ff', label: 'Largo Pelvis', value: largoPelvis },
      { color: '#ffa500', label: 'Punto de Medición', value: null }
    ];

    items.forEach(item => {
      const itemDiv = document.createElement('div');
      itemDiv.style.display = 'flex';
      itemDiv.style.alignItems = 'center';
      itemDiv.style.marginBottom = '2px';

      const colorBox = document.createElement('div');
      colorBox.style.width = '14px';
      colorBox.style.height = '14px';
      colorBox.style.backgroundColor = item.color;
      colorBox.style.marginRight = '6px';
      colorBox.style.borderRadius = '2px';

      const label = document.createElement('span');
      label.textContent = item.value !== null ? `${item.label} (${item.value} cm)` : item.label;
      label.style.fontSize = '13px';

      itemDiv.appendChild(colorBox);
      itemDiv.appendChild(label);
      legendDiv.appendChild(itemDiv);
    });

    this.medidas3DContainer.nativeElement.appendChild(legendDiv);
  }

  private animate(): void {
    if (!this.renderer || !this.scene || !this.camera) return;
    
    this.animationFrameId = requestAnimationFrame(() => this.animate());
    
    if (this.controls) {
      this.controls.update();
    }
    
    this.renderer.render(this.scene, this.camera);
  }

  @HostListener('window:resize')
  onResize(): void {
    if (this.camera && this.renderer && this.medidas3DContainer) {
      const container = this.medidas3DContainer.nativeElement;
      const aspect = container.clientWidth / container.clientHeight;
      this.camera.aspect = aspect;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(container.clientWidth, container.clientHeight);
      this.renderer.setPixelRatio(window.devicePixelRatio);
    }
  }

  // Nuevo método para gráfico general
  updateWeightChartGeneral(): void {
    if (!this.weightChart || !this.isBrowser) return;
    const ctx = this.weightChart.nativeElement.getContext('2d');
    if (!ctx) return;
    if (this.charts['weight']) {
      this.charts['weight'].destroy();
    }
    // Histograma de pesos de todo el ganado
    const weights = this.ganado.map(animal => animal.peso);
    if (weights.length === 0) return;
    const min = Math.floor(Math.min(...weights) / 50) * 50;
    const max = Math.ceil(Math.max(...weights) / 50) * 50;
    const binSize = 50; // Rango de cada barra
    const bins: { label: string, count: number }[] = [];
    for (let start = min; start < max; start += binSize) {
      const end = start + binSize;
      const count = weights.filter(w => w >= start && w < end).length;
      bins.push({ label: `${start}-${end} kg`, count });
    }
    this.charts['weight'] = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: bins.map(b => b.label),
        datasets: [{
          label: 'Cantidad de Animales',
          data: bins.map(b => b.count),
          backgroundColor: 'rgba(54, 162, 235, 0.7)',
          borderColor: 'rgba(54, 162, 235, 1)',
          borderWidth: 1
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          title: {
            display: true,
            text: 'Distribución de Pesos del Ganado',
            font: { size: 18, weight: 'bold' },
            padding: { top: 10, bottom: 20 }
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            title: { display: true, text: 'Cantidad de Animales', font: { weight: 'bold' } }
          },
          x: {
            title: { display: true, text: 'Rango de Peso (kg)', font: { weight: 'bold' } }
          }
        }
      }
    });
  }

  updateCampoChart(): void {
    if (!this.campoChartCanvas || !this.isBrowser) return;
    const ctx = this.campoChartCanvas.nativeElement.getContext('2d');
    if (!ctx) return;
    if (this.campoChartInstance) {
      this.campoChartInstance.destroy();
    }
    // Agrupar por campo y calcular promedio de peso actual y mes anterior (ejemplo: alternar mayor/menor)
    const campoMap: { [campo: string]: number[] } = {};
    this.ganado.forEach(animal => {
      if (!campoMap[animal.campo]) campoMap[animal.campo] = [];
      campoMap[animal.campo].push(animal.peso);
    });
    const campos = Object.keys(campoMap);
    const promedios = campos.map(campo => {
      const pesos = campoMap[campo];
      return pesos.reduce((a, b) => a + b, 0) / pesos.length;
    });
    // Alternar: en la mitad de los campos, el mes anterior es menor, en la otra mitad es mayor
    const promediosPrev = promedios.map((actual, i) => {
      // Alternar: par = menor antes, impar = mayor antes
      if (i % 2 === 0) {
        return actual - 20 - Math.random() * 10; // menor antes
      } else {
        return actual + 20 + Math.random() * 10; // mayor antes
      }
    });
    this.campoChartInstance = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: campos,
        datasets: [
          {
            label: 'Mes anterior',
            data: promediosPrev,
            backgroundColor: 'rgba(40, 167, 69, 0.25)',
            borderColor: 'rgba(40, 167, 69, 0.25)',
            borderWidth: 1,
            barPercentage: 1.0,
            categoryPercentage: 0.8,
            order: 1
          },
          {
            label: 'Actual',
            data: promedios,
            backgroundColor: 'rgba(40, 167, 69, 0.7)',
            borderColor: 'rgba(40, 167, 69, 1)',
            borderWidth: 1,
            barPercentage: 0.7,
            categoryPercentage: 0.5,
            order: 2
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: true },
            title: {
              display: true,
            text: 'Rendimiento por Campo (Peso Promedio)',
            font: { size: 18, weight: 'bold' },
            padding: { top: 10, bottom: 20 }
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            title: { display: true, text: 'Peso Promedio (kg)', font: { weight: 'bold' } }
          },
          x: {
            title: { display: true, text: 'Campo', font: { weight: 'bold' } }
          }
        }
      }
    });
  }

  getCategoria(animal: Ganado): string {
    if (animal.categoria && animal.categoria.trim() !== '') return animal.categoria;
    if (!animal || animal.edad == null || !animal.sexo) return '-';
    const edad = animal.edad;
    const sexo = animal.sexo.toLowerCase();
    if (sexo === 'macho' || sexo === 'm') {
      if (edad < 2) return 'Ternero';
      if (edad < 3) return 'Novillo';
      return 'Toro';
    } else if (sexo === 'hembra' || sexo === 'h') {
      if (edad < 2) return 'Ternera';
      if (edad < 3) return 'Vaquillona';
      return 'Vaca';
    }
    return '-';
  }

  private initializeAnimalMap(): void {
    if (!this.isBrowser || !this.animalMapContainer) return;
    // Destruir mapa anterior si existe
    if (this.animalMap) {
      this.animalMap.remove();
      this.animalMap = undefined;
    }
    const container = this.animalMapContainer.nativeElement;
    // Asegurarse de que el contenedor esté vacío
    container.innerHTML = '';
    // Inicializar mapa con configuración similar al principal
    this.animalMap = L.map(container, {
      center: [-34.9011, -56.1645], // Puedes ajustar según la ubicación del animal
      zoom: 12,
      zoomControl: true,
      attributionControl: false,
      scrollWheelZoom: true,
      doubleClickZoom: true,
      fadeAnimation: true,
      zoomAnimation: true,
      markerZoomAnimation: true
    });
    const mainTileLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '',
      maxZoom: 19
    });
    const satelliteTileLayer = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
      attribution: '',
      maxZoom: 19
    }).addTo(this.animalMap);
    const baseMaps = {
      "Satélite": satelliteTileLayer,
      "Mapa": mainTileLayer
    };
    L.control.layers(baseMaps, {}, {
      position: 'topright',
      collapsed: true
    }).addTo(this.animalMap);
    // Si el animal tiene ubicación, centrar y marcar
    if (this.selectedAnimal && this.selectedAnimal.ubicacion) {
      // Suponiendo que ubicacion es 'lat,lng'
      const coords = this.selectedAnimal.ubicacion.split(',').map(Number);
      if (coords.length === 2 && !isNaN(coords[0]) && !isNaN(coords[1])) {
        this.animalMap.setView([coords[0], coords[1]], 15);
        L.marker([coords[0], coords[1]]).addTo(this.animalMap)
          .bindPopup(`${this.selectedAnimal.identificacion}`)
          .openPopup();
      }
    }
    setTimeout(() => {
      this.animalMap?.invalidateSize();
    }, 300);
  }

  private initProfitChartIfNeeded(): void {
    if (this.showProfitChart && this.profitChart && this.profitChart.nativeElement) {
      this.updateProfitChart();
    } else if (this.profitChartInstance) {
      this.profitChartInstance.destroy();
      this.profitChartInstance = null;
    }
  }

  updateProfitChart(): void {
    if (!this.profitChart || !this.isBrowser) return;
    const ctx = this.profitChart.nativeElement.getContext('2d');
    if (!ctx) return;
    if (this.profitChartInstance) {
      this.profitChartInstance.destroy();
    }
    // Ejemplo de datos de rentabilidad
    const labels = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun'];
    const data = [120, 150, 180, 130, 170, 200];
    this.profitChartInstance = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: labels,
        datasets: [{
          label: 'Rentabilidad ($)',
          data: data,
          backgroundColor: 'rgba(255, 193, 7, 0.7)',
          borderColor: 'rgba(255, 193, 7, 1)',
          borderWidth: 1
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          title: {
            display: false
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            title: { display: true, text: 'Rentabilidad ($)', font: { weight: 'bold' } }
          },
          x: {
            title: { display: false }
          }
        }
      }
    });
  }
} 