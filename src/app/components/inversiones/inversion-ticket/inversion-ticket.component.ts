import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { InversionesService } from '../../../services/inversiones.service';
import { GanadoService } from '../../../services/ganado.service';
import { Inversion } from '../../../models/inversion.model';
import { Subscription, combineLatest, catchError, of } from 'rxjs';

interface InversionAgrupada {
  tipo: string;
  cantidad: number;
  resultado: number;
  selected: boolean;
}

@Component({
  selector: 'app-inversion-ticket',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './inversion-ticket.component.html',
  styleUrls: ['./inversion-ticket.component.scss']
})
export class InversionTicketComponent implements OnInit, OnDestroy {
  inversiones: Inversion[] = [];
  inversionesAgrupadas: InversionAgrupada[] = [];
  precioKg = 0;
  pesoTotalGanado = 0;
  total = 0;
  costoTotal = 0;
  valorTotalGanado = 0;
  private subscriptions = new Subscription();

  constructor(
    private inversionesService: InversionesService,
    private ganadoService: GanadoService
  ) {}

  ngOnInit(): void {
    this.loadData();
    // Subscribe to selected inversions changes
    this.subscriptions.add(
      this.inversionesService.getSelectedInversiones().subscribe(selectedInversiones => {
        // Update the selected state of inversions
        this.inversiones = this.inversiones.map(inversion => ({
          ...inversion,
          selected: selectedInversiones.some(selected => selected.id === inversion.id)
        }));
        this.calcularCostoTotal();
        this.recalcularGanancia();
      })
    );
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }

  private loadData(): void {
    console.log('Iniciando carga de datos...');
    
    const inversionesSub = this.inversionesService.getInversiones().pipe(
      catchError(error => {
        console.error('Error cargando inversiones:', error);
        return of([]);
      })
    );

    const pesoTotalSub = this.ganadoService.getPesoTotalGanadoActivo().pipe(
      catchError(error => {
        console.error('Error cargando peso total:', error);
        return of(0);
      })
    );

    this.subscriptions.add(
      combineLatest([inversionesSub, pesoTotalSub]).subscribe({
        next: ([inversiones, pesoTotal]) => {
          console.log('Datos cargados exitosamente:', { inversiones, pesoTotal });
          this.inversiones = inversiones;
          this.pesoTotalGanado = Number(pesoTotal) || 0;
          console.log('Peso total actualizado:', this.pesoTotalGanado);
          this.calcularCostoTotal();
          this.recalcularGanancia();
        },
        error: (error) => {
          console.error('Error en combineLatest:', error);
          this.inversiones = [];
          this.pesoTotalGanado = 0;
          this.calcularCostoTotal();
          this.recalcularGanancia();
        }
      })
    );
  }

  private calcularCostoTotal(): void {
    const costoAnterior = this.costoTotal;
    this.costoTotal = this.inversiones
      .filter(inversion => inversion.selected)
      .reduce((sum, inversion) => {
        const costo = Number(inversion.costo) || 0;
        console.log(`Sumando costo de inversión: ${costo}`);
        return sum + costo;
      }, 0);
    console.log(`Costo total actualizado de ${costoAnterior} a ${this.costoTotal}`);
  }

  recalcularGanancia(): void {
    console.log('Recalculando ganancia con precio:', this.precioKg);
    console.log('Peso total:', this.pesoTotalGanado);
    
    // Asegurarnos que los valores son números
    const precioKg = Number(this.precioKg) || 0;
    const pesoTotal = Number(this.pesoTotalGanado) || 0;
    
    console.log('Valores convertidos:', { precioKg, pesoTotal });
    
    // Calcular el valor total del ganado basado en el precio por kg
    this.valorTotalGanado = pesoTotal * precioKg;
    console.log('Valor total del ganado calculado:', this.valorTotalGanado);

    // Primero calculamos el costo total para asegurarnos que está actualizado
    this.calcularCostoTotal();
    console.log('Costo total de inversiones actualizado:', this.costoTotal);

    // Actualizar los resultados de las inversiones
    this.inversiones = this.inversiones.map(inversion => {
      const newInversion = { ...inversion };
      
      if (inversion.selected) {
        // Para cada inversión seleccionada, su resultado es su costo negativo
        newInversion.resultado = -Number(inversion.costo);
      } else {
        newInversion.resultado = 0;
      }
      
      return newInversion;
    });

    // Actualizar grupos y total
    this.agruparInversiones();
    
    // El total es el valor del ganado menos el costo total de inversiones
    if (precioKg > 0) {
      this.total = this.valorTotalGanado - this.costoTotal;
    } else {
      this.total = -this.costoTotal; // Si no hay precio, solo mostramos las pérdidas
    }
    
    console.log('Resumen final:', {
      pesoTotal: this.pesoTotalGanado,
      precioKg: this.precioKg,
      valorTotalGanado: this.valorTotalGanado,
      costoTotal: this.costoTotal,
      total: this.total
    });
  }

  private agruparInversiones(): void {
    const grupos = new Map<string, InversionAgrupada>();
    
    this.inversiones.forEach(inversion => {
      if (!inversion.selected) return;
      
      const grupo = grupos.get(inversion.tipo) || {
        tipo: inversion.tipo,
        cantidad: 0,
        resultado: 0,
        selected: true
      };
      
      grupo.cantidad++;
      grupo.resultado += Number(inversion.resultado) || 0;
      grupos.set(inversion.tipo, grupo);
    });
    
    this.inversionesAgrupadas = Array.from(grupos.values());
  }

  onSelectionChange(grupo: InversionAgrupada): void {
    // Update inversions of this type
    this.inversiones = this.inversiones.map(inversion => ({
      ...inversion,
      selected: inversion.tipo === grupo.tipo ? !grupo.selected : inversion.selected
    }));

    // Update the service with the new selections
    const selectedInversiones = this.inversiones.filter(inversion => inversion.selected);
    this.inversionesService.updateSelectedInversiones(selectedInversiones);
    
    // Recalculate everything
    this.calcularCostoTotal();
    this.recalcularGanancia();
  }
} 