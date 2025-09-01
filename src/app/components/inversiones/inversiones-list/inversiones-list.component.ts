import { Component, OnInit } from '@angular/core';
import { CommonModule, DatePipe, CurrencyPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Inversion } from '../../../models/inversion.model';
import { InversionesService } from '../../../services/inversiones.service';
import { ToastrService } from 'ngx-toastr';
import { InversionFormComponent } from '../inversion-form/inversion-form.component';

@Component({
  selector: 'app-inversiones-list',
  standalone: true,
  imports: [CommonModule, FormsModule, DatePipe, CurrencyPipe, InversionFormComponent],
  templateUrl: './inversiones-list.component.html',
  styleUrls: ['./inversiones-list.component.scss']
})
export class InversionesListComponent implements OnInit {
  inversiones: Inversion[] = [];
  selectedInversiones: Inversion[] = [];
  editingInversion: Inversion | null = null;

  constructor(
    private inversionesService: InversionesService,
    private toastr: ToastrService
  ) { }

  ngOnInit(): void {
    this.loadInversiones();
  }

  loadInversiones(): void {
    this.inversionesService.getInversiones().subscribe({
      next: (inversiones) => {
        this.inversiones = inversiones;
      },
      error: (error) => {
        console.error('Error al cargar inversiones:', error);
        this.toastr.error('Error al cargar las inversiones');
      }
    });
  }

  toggleSelection(inversion: Inversion): void {
    const index = this.selectedInversiones.findIndex(i => i.id === inversion.id);
    if (index === -1) {
      this.selectedInversiones.push(inversion);
    } else {
      this.selectedInversiones.splice(index, 1);
    }
  }

  toggleAll(): void {
    if (this.selectedInversiones.length === this.inversiones.length) {
      this.selectedInversiones = [];
    } else {
      this.selectedInversiones = [...this.inversiones];
    }
  }

  editInversion(inversion: Inversion): void {
    this.editingInversion = { ...inversion };
  }

  onInversionUpdated(inversion: Inversion): void {
    if (inversion.id) {
      this.inversionesService.updateInversion(inversion).subscribe({
        next: () => {
          this.loadInversiones();
          this.editingInversion = null;
          this.toastr.success('Inversión actualizada exitosamente');
        },
        error: (error) => {
          console.error('Error al actualizar inversión:', error);
          this.toastr.error('Error al actualizar la inversión');
        }
      });
    } else {
      this.inversionesService.addInversion(inversion).subscribe({
        next: () => {
          this.loadInversiones();
          this.editingInversion = null;
          this.toastr.success('Inversión creada exitosamente');
        },
        error: (error) => {
          console.error('Error al crear inversión:', error);
          this.toastr.error('Error al crear la inversión');
        }
      });
    }
  }

  onCancelEdit(): void {
    this.editingInversion = null;
  }

  deleteInversion(inversion: Inversion): void {
    if (confirm('¿Está seguro de que desea eliminar esta inversión?')) {
      this.inversionesService.deleteInversion(inversion.id!).subscribe({
        next: () => {
          this.loadInversiones();
          this.toastr.success('Inversión eliminada exitosamente');
        },
        error: (error) => {
          console.error('Error al eliminar inversión:', error);
          this.toastr.error('Error al eliminar la inversión');
        }
      });
    }
  }
} 