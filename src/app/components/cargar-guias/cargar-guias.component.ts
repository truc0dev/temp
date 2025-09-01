import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { trigger, transition, style, animate } from '@angular/animations';
import { GuiasService } from '../../services/guias.service';
import { Guia } from '../../interfaces/guia.interface';
import { AnimalesService } from '../../services/animales.service';

@Component({
  selector: 'app-cargar-guias',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="page-container">
      <h1>Historial de Guías</h1>
      <table class="tabla-guias">
        <thead>
          <tr>
            <th>Fecha</th>
            <th>Nombre</th>
            <th>Cant. Animales</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          <tr *ngFor="let guia of guiasFiltradas">
            <td>{{ guia.fechaCreacion | date:'dd/MM/yyyy HH:mm' }}</td>
            <td>{{ guia.nombre }}</td>
            <td>{{ getAnimalesFromContenido(guia.contenido).length }}</td>
            <td>
              <button (click)="verDetalle(guia)"><i class="fas fa-eye"></i> Ver detalle</button>
              <button (click)="crearLista(guia)"><i class="fas fa-list"></i> Crear lista</button>
            </td>
          </tr>
        </tbody>
      </table>

      <!-- Modal Detalle -->
      <div *ngIf="guiaSeleccionada" class="modal-detalle">
        <div class="detalle-header">
          <h2>Detalle de Guía</h2>
          <button (click)="exportarExcel(guiaSeleccionada)">Exportar Excel</button>
          <button (click)="convertirEnLista(guiaSeleccionada)">Convertir en lista editable</button>
          <button (click)="cerrarDetalle()">Volver</button>
        </div>
        <div class="detalle-info">
          <p><b>Fecha:</b> {{ guiaSeleccionada.fechaCreacion | date:'dd/MM/yyyy HH:mm' }}</p>
          <p><b>Nombre:</b> {{ guiaSeleccionada.nombre }}</p>
          <p><b>Cantidad de animales:</b> {{ getAnimalesFromContenido(guiaSeleccionada.contenido).length }}</p>
        </div>
        <table class="tabla-animales">
          <thead>
            <tr>
              <th>Dispositivo</th>
              <th>Raza</th>
              <th>Sexo</th>
              <th>Edad</th>
              <th>Estado</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let animal of getAnimalesFromContenido(guiaSeleccionada.contenido)">
              <td>{{ animal.dispositivo }}</td>
              <td>{{ animal.raza }}</td>
              <td>{{ animal.sexo }}</td>
              <td>{{ animal.edadMeses }}m</td>
              <td>{{ animal.statusVida }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  `,
  styles: [`
    .page-container h1 {
      margin: 0 0 1.5rem 0;
      padding-left: 1.5rem;
      font-size: 2rem;
      font-weight: 700;
      color: #222;
      letter-spacing: -1px;
    }
    .tabla-guias {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 2rem;
    }
    .tabla-guias th, .tabla-guias td {
      border: 1px solid #e0e0e0;
      padding: 0.5rem 0.75rem;
      text-align: left;
    }
    .tabla-guias th {
      background: #f8f8f8;
      font-weight: 600;
    }
    .tabla-guias td button {
      margin-right: 0.5rem;
      background: var(--primary-green, #28a745);
      color: #fff;
      border: none;
      border-radius: 6px;
      padding: 0.4rem 1.1rem;
      font-size: 1rem;
      font-weight: 500;
      box-shadow: 0 2px 8px rgba(40,167,69,0.08);
      cursor: pointer;
      transition: background 0.2s, box-shadow 0.2s, transform 0.1s;
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      outline: none;
    }
    .tabla-guias td button:hover, .tabla-guias td button:focus {
      background: var(--secondary-green, #218838);
      box-shadow: 0 4px 16px rgba(40,167,69,0.15);
      transform: translateY(-2px) scale(1.03);
    }
    .tabla-guias td button i {
      font-size: 1.1em;
      margin-right: 0.3em;
    }
    .modal-detalle {
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      background: #fff;
      border-radius: 8px;
      box-shadow: 0 2px 16px rgba(0,0,0,0.15);
      padding: 2rem;
      z-index: 1000;
      min-width: 350px;
      max-width: 90vw;
      max-height: 90vh;
      overflow-y: auto;
    }
    .detalle-header {
      display: flex;
      gap: 1rem;
      align-items: center;
      margin-bottom: 1rem;
    }
    .detalle-header h2 {
      flex: 1;
      margin: 0;
    }
    .detalle-info {
      margin-bottom: 1rem;
      font-size: 0.98rem;
    }
    .tabla-animales {
      width: 100%;
      border-collapse: collapse;
    }
    .tabla-animales th, .tabla-animales td {
      border: 1px solid #e0e0e0;
      padding: 0.4rem 0.6rem;
      text-align: left;
      font-size: 0.95rem;
    }
    .tabla-animales th {
      background: #f0f0f0;
      font-weight: 500;
    }
    .detalle-header button {
      background: var(--primary-green, #28a745);
      color: #fff;
      border: none;
      border-radius: 6px;
      padding: 0.4rem 1.1rem;
      font-size: 1rem;
      font-weight: 500;
      margin-left: 0.5rem;
      box-shadow: 0 2px 8px rgba(40,167,69,0.08);
      cursor: pointer;
      transition: background 0.2s, box-shadow 0.2s, transform 0.1s;
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      outline: none;
    }
    .detalle-header button:hover, .detalle-header button:focus {
      background: var(--secondary-green, #218838);
      box-shadow: 0 4px 16px rgba(40,167,69,0.15);
      transform: translateY(-2px) scale(1.03);
    }
  `]
})
export class CargarGuiasComponent implements OnInit {
  isDragging = false;
  errorMessage = '';
  showPreview = false;
  showProcessDialog = false;
  selectedGuide: Guia | null = null;
  fileContent = '';
  currentFile: File | null = null;
  guiasFiltradas: Guia[] = [];
  terminoBusqueda = '';
  showConfirmDialog = false;
  confirmDialogMessage = '';
  confirmDialogAction: () => void = () => {};
  private errorTimeout: any;
  mostrarGuiasExportadas = false;
  processedGuides: { propietario: string, nombrePropietario: string, dispositivos: string[] }[] = [];
  guiaSeleccionada: Guia | null = null;

  constructor(
    private guiasService: GuiasService,
    private animalesService: AnimalesService
  ) {}

  ngOnInit() {
    this.actualizarListaGuias();
  }

  public actualizarListaGuias() {
    if (this.mostrarGuiasExportadas) {
      this.guiasService.guiasExportadas$.subscribe(guias => {
        this.guiasFiltradas = guias;
      });
    } else {
      this.guiasService.guias$.subscribe(guias => {
        this.guiasFiltradas = guias;
      });
    }
  }

  onDragEnter(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging = true;
  }

  onDragOver(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
  }

  onDragLeave(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    const target = event.target as HTMLElement;
    const relatedTarget = event.relatedTarget as HTMLElement;
    
    if (!target.contains(relatedTarget)) {
      this.isDragging = false;
    }
  }

  onDrop(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging = false;

    const files = event.dataTransfer?.files;
    if (files && files.length > 0) {
      this.handleFile(files[0]);
    }
  }

  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.handleFile(input.files[0]);
    }
  }

  private handleFile(file: File) {
    if (!file.name.toLowerCase().endsWith('.txt')) {
      this.showError('Solo se permiten archivos .txt');
      return;
    }

    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      this.showError('El archivo es demasiado grande. Máximo 5MB.');
      return;
    }

    this.currentFile = file;
    const reader = new FileReader();
    
    reader.onload = (e: ProgressEvent<FileReader>) => {
      this.fileContent = e.target?.result as string || '';
      this.showPreview = true;
    };

    reader.onerror = () => {
      this.showError('Error al leer el archivo');
    };

    reader.readAsText(file);
  }

  private showError(message: string) {
    this.errorMessage = message;
    
    if (this.errorTimeout) {
      clearTimeout(this.errorTimeout);
    }
    
    this.errorTimeout = setTimeout(() => {
      this.errorMessage = '';
    }, 3000);
  }

  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  confirmarGuia() {
    if (this.currentFile && this.fileContent) {
      this.guiasService.agregarGuia(
        this.currentFile.name,
        this.fileContent,
        this.currentFile.size
      );
      this.showPreview = false;
      this.currentFile = null;
      this.fileContent = '';
    }
  }

  cancelarGuia() {
    this.showPreview = false;
    this.currentFile = null;
    this.fileContent = '';
  }

  buscar() {
    this.guiasFiltradas = this.guiasService.buscarGuias(this.terminoBusqueda, this.mostrarGuiasExportadas);
  }

  verGuia(guia: Guia) {
    this.fileContent = guia.contenido;
    this.currentFile = {
      name: guia.nombre,
      size: guia.tamano
    } as File;
    this.showPreview = true;
  }

  eliminarGuia(guia: Guia, event: MouseEvent) {
    event.stopPropagation();
    this.confirmDialogMessage = '¿Estás seguro de que deseas eliminar esta guía?';
    this.confirmDialogAction = () => {
      this.guiasService.eliminarGuia(guia.id, this.mostrarGuiasExportadas);
      this.showConfirmDialog = false;
    };
    this.showConfirmDialog = true;
  }

  exportarGuia(guia: Guia, event: MouseEvent) {
    event.stopPropagation();
    this.selectedGuide = guia;
    this.processedGuides = this.procesarGuia(guia.contenido);
    this.showProcessDialog = true;
  }

  cancelConfirmation() {
    this.showConfirmDialog = false;
  }

  confirmAction() {
    this.confirmDialogAction();
  }

  private procesarGuia(contenido: string): { propietario: string, nombrePropietario: string, dispositivos: string[] }[] {
    const lineas = contenido.split('\n').filter(linea => linea.trim());
    const guiasPorPropietario: { [key: string]: { nombrePropietario: string, dispositivos: Set<string> } } = {};

    // Procesar cada línea
    for (const linea of lineas) {
      // Limpiar la línea de espacios y caracteres especiales
      const lineaLimpia = linea.trim().replace(/\[|\]/g, '');
      
      // Separar los campos por el delimitador |
      const campos = lineaLimpia.split('|');
      
      // El número de dispositivo está en el segundo campo (índice 1)
      if (campos.length > 1) {
        const numeroCompleto = campos[1]; // Ejemplo: A0000000858000035507089
        
        // Extraer los últimos 8 dígitos del número
        const numeroDispositivo = numeroCompleto.slice(-8);
        
        console.log('Procesando línea:', lineaLimpia);
        console.log('Número de dispositivo encontrado:', numeroDispositivo);
        
        // Buscar el dispositivo en la tabla de datos
        const animal = this.animalesService.buscarPorDispositivo(numeroDispositivo);
        
        if (animal) {
          console.log('Animal encontrado:', animal);
          console.log('Propietario:', animal.propietario);
          console.log('Nombre del propietario:', animal.nombrePropietario);
          
          // Si encontramos el animal, usamos su propietario
          const numeroPropietario = animal.propietario;
          const nombrePropietario = animal.nombrePropietario || 'Sin nombre';
          
          // Si el propietario no existe en nuestro registro, lo inicializamos
          if (!guiasPorPropietario[numeroPropietario]) {
            guiasPorPropietario[numeroPropietario] = {
              nombrePropietario,
              dispositivos: new Set()
            };
          }
          
          // Agregar la línea completa al conjunto de dispositivos del propietario
          guiasPorPropietario[numeroPropietario].dispositivos.add(lineaLimpia);
        } else {
          console.log('No se encontró animal para el dispositivo:', numeroDispositivo);
        }
      }
    }

    // Convertir el objeto a un array y mostrar el resultado final
    const resultado = Object.entries(guiasPorPropietario)
      .map(([propietario, datos]) => ({
        propietario,
        nombrePropietario: datos.nombrePropietario,
        dispositivos: Array.from(datos.dispositivos).sort()
      }))
      .sort((a, b) => a.propietario.localeCompare(b.propietario));
    
    console.log('Resultado final del procesamiento:', resultado);
    return resultado;
  }

  descargarGuiaProcesada(propietario: string, nombrePropietario: string, dispositivos: string[]) {
    // Crear el contenido del archivo
    const contenido = `Propietario: ${propietario} - ${nombrePropietario}\n` +
                     `Total de dispositivos: ${dispositivos.length}\n` +
                     `Fecha de procesamiento: ${new Date().toLocaleString()}\n` +
                     `\nDispositivos:\n${dispositivos.join('\n')}`;

    // Crear el blob y el link de descarga
    const blob = new Blob([contenido], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    
    // Limpiar el nombre del propietario para el nombre del archivo
    const nombreLimpio = nombrePropietario.replace(/[^a-zA-Z0-9]/g, '_');
    a.href = url;
    a.download = `guia_${propietario}_${nombreLimpio}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  }

  verDetalle(guia: Guia) {
    this.guiaSeleccionada = guia;
  }

  crearLista(guia: Guia) {
    // Implementa la lógica para crear una lista personalizada
  }

  exportarExcel(guia: Guia) {
    // Implementa la lógica para exportar la guía a Excel
  }

  convertirEnLista(guia: Guia) {
    // Implementa la lógica para convertir la guía en una lista editable
  }

  cerrarDetalle() {
    this.guiaSeleccionada = null;
  }

  getAnimalesFromContenido(contenido: string) {
    // Procesa el contenido de la guía y devuelve un array de animales
    // Suponemos que cada línea representa un animal y que se puede buscar por dispositivo
    const lineas = contenido.split('\n').filter(linea => linea.trim());
    const animales: any[] = [];
    for (const linea of lineas) {
      const campos = linea.trim().replace(/\[|\]/g, '').split('|');
      if (campos.length > 1) {
        const numeroCompleto = campos[1];
        const numeroDispositivo = numeroCompleto.slice(-8);
        const animal = this.animalesService.buscarPorDispositivo(numeroDispositivo);
        if (animal) {
          animales.push(animal);
        }
      }
    }
    return animales;
  }
} 