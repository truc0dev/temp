import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { GuiasService } from '../../services/guias.service';
import { Guia } from '../../interfaces/guia.interface';

@Component({
  selector: 'app-movimientos',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './movimientos.component.html',
  styleUrls: ['./movimientos.component.scss']
})
export class MovimientosComponent {
  // Mock de movimientos
  movimientos = [
    {
      fecha: new Date(),
      caravana: 'UY123456',
      origen: 'Campo Norte',
      destino: 'Campo Sur',
      gps: '-34.9011, -56.1645',
      productor: 'Juan Pérez',
      transportista: 'Carlos López',
      estado: 'En tránsito',
      guia: 'G-001'
    }
  ];

  // Para formulario
  caravana = '';
  origen = '';
  destino = '';
  gps = '';
  productorFirma = '';
  transportistaFirma = '';

  guias: Guia[] = [];
  guiaSeleccionada: Guia | null = null;

  constructor(private guiasService: GuiasService) {
    this.guiasService.guias$.subscribe(guias => {
      this.guias = guias;
    });
  }

  registrarMovimiento() {
    this.movimientos.unshift({
      fecha: new Date(),
      caravana: this.guiaSeleccionada ? this.guiaSeleccionada.nombre : '',
      origen: this.origen,
      destino: this.destino,
      gps: this.gps,
      productor: this.productorFirma,
      transportista: this.transportistaFirma,
      estado: 'Registrado',
      guia: this.guiaSeleccionada ? this.guiaSeleccionada.nombre : ''
    });
    this.guiaSeleccionada = null;
    this.origen = '';
    this.destino = '';
    this.gps = '';
    this.productorFirma = '';
    this.transportistaFirma = '';
  }

  capturarGPS() {
    // Simulación de GPS
    this.gps = '-34.90, -56.16';
  }
} 