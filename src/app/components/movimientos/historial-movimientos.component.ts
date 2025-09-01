import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { animate, style, transition, trigger } from '@angular/animations';

@Component({
  selector: 'app-historial-movimientos',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="historial-movimientos-container" @fadeIn>
      <h3>Historial de Movimientos</h3>
      <table class="mov-table">
        <thead>
          <tr>
            <th>Fecha</th>
            <th>Caravana</th>
            <th>Origen</th>
            <th>Destino</th>
            <th>GPS</th>
            <th>Productor</th>
            <th>Transportista</th>
            <th>Guía</th>
            <th>Estado</th>
          </tr>
        </thead>
        <tbody>
          <tr *ngFor="let mov of movimientos">
            <td>{{ mov.fecha | date:'dd/MM/yyyy HH:mm' }}</td>
            <td>{{ mov.caravana }}</td>
            <td>{{ mov.origen }}</td>
            <td>{{ mov.destino }}</td>
            <td>{{ mov.gps }}</td>
            <td>{{ mov.productor }}</td>
            <td>{{ mov.transportista }}</td>
            <td>{{ mov.guia }}</td>
            <td>{{ mov.estado }}</td>
          </tr>
          <tr *ngIf="movimientos.length === 0">
            <td colspan="9" class="empty-message">No hay movimientos registrados</td>
          </tr>
        </tbody>
      </table>
    </div>
  `,
  styleUrls: ['./movimientos.component.scss'],
  animations: [
    trigger('fadeIn', [
      transition(':enter', [
        style({ opacity: 0 }),
        animate('400ms ease', style({ opacity: 1 }))
      ]),
      transition(':leave', [
        animate('400ms ease', style({ opacity: 0 }))
      ])
    ])
  ]
})
export class HistorialMovimientosComponent {
  @Input() movimientos: any[] = [];
} 