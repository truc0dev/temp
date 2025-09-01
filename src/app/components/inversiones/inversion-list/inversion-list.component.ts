import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { InversionesService } from '../../../services/inversiones.service';
import { Inversion } from '../../../models/inversion.model';

@Component({
  selector: 'app-inversion-list',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './inversion-list.component.html',
  styleUrls: ['./inversion-list.component.scss']
})
export class InversionListComponent implements OnInit {
  inversiones: Inversion[] = [];
  sortKey: keyof Inversion = 'fechaInicio';
  sortAsc = true;

  constructor(private inversionesService: InversionesService) {}

  ngOnInit(): void {
    this.loadInversiones();
  }

  loadInversiones(): void {
    this.inversionesService.getInversiones().subscribe({
      next: (data) => {
        this.inversiones = data;
        this.sort(this.sortKey);
      },
      error: (error) => {
        console.error('Error cargando inversiones:', error);
      }
    });
  }

  sort(key: keyof Inversion): void {
    this.sortKey = key;
    this.sortAsc = !this.sortAsc;
    
    this.inversiones.sort((a, b) => {
      if (key === 'fechaInicio' || key === 'fechaFin') {
        const dateA = a[key] ? new Date(a[key]).getTime() : 0;
        const dateB = b[key] ? new Date(b[key]).getTime() : 0;
        return this.sortAsc ? dateA - dateB : dateB - dateA;
      }
      
      const valueA = a[key] ?? '';
      const valueB = b[key] ?? '';
      
      if (valueA < valueB) return this.sortAsc ? -1 : 1;
      if (valueA > valueB) return this.sortAsc ? 1 : -1;
      return 0;
    });
  }

  deleteInversion(id: number): void {
    if (confirm('¿Está seguro de eliminar esta inversión?')) {
      this.inversionesService.deleteInversion(id).subscribe({
        next: () => {
          this.loadInversiones();
        },
        error: (error) => {
          console.error('Error eliminando inversión:', error);
        }
      });
    }
  }
} 