import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, tap, catchError } from 'rxjs';
import { Inversion } from '../models/inversion.model';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class InversionesService {
  private apiUrl = `${environment.apiUrl}/inversiones`;
  private inversiones$ = new BehaviorSubject<Inversion[]>([]);
  private selectedInversiones$ = new BehaviorSubject<Inversion[]>([]);

  constructor(private http: HttpClient) {
    this.loadInversiones();
  }

  private loadInversiones() {
    console.log('Cargando inversiones...');
    this.http.get<Inversion[]>(this.apiUrl).pipe(
      tap(inversiones => {
        console.log('Inversiones cargadas:', inversiones);
        // Initialize all inversions as selected by default
        const inversionesWithSelection = inversiones.map(inversion => ({
          ...inversion,
          selected: true
        }));
        this.inversiones$.next(inversionesWithSelection);
        this.selectedInversiones$.next(inversionesWithSelection);
      }),
      catchError(error => {
        console.error('Error al cargar inversiones:', error);
        return [];
      })
    ).subscribe();
  }

  getInversiones(): Observable<Inversion[]> {
    return this.inversiones$.asObservable();
  }

  getSelectedInversiones(): Observable<Inversion[]> {
    return this.selectedInversiones$.asObservable();
  }

  updateSelectedInversiones(inversiones: Inversion[]): void {
    // Update both the selected inversions and the main list
    const currentInversiones = this.inversiones$.getValue();
    const updatedInversiones = currentInversiones.map(inversion => ({
      ...inversion,
      selected: inversiones.some(selected => selected.id === inversion.id)
    }));
    
    this.inversiones$.next(updatedInversiones);
    this.selectedInversiones$.next(inversiones);
  }

  addInversion(inversion: Inversion): Observable<Inversion> {
    console.log('Agregando inversión:', inversion);
    return this.http.post<Inversion>(this.apiUrl, inversion).pipe(
      tap(newInversion => {
        console.log('Nueva inversión agregada:', newInversion);
        const currentInversiones = this.inversiones$.getValue();
        const newInversionWithSelection = {
          ...newInversion,
          selected: true
        };
        this.inversiones$.next([...currentInversiones, newInversionWithSelection]);
        
        // Add the new inversion to selected inversions
        const currentSelected = this.selectedInversiones$.getValue();
        this.selectedInversiones$.next([...currentSelected, newInversionWithSelection]);
      }),
      catchError(error => {
        console.error('Error al agregar inversión:', error);
        throw error;
      })
    );
  }

  updateInversion(id: number, inversion: Inversion): Observable<Inversion> {
    console.log('Actualizando inversión:', { id, inversion });
    return this.http.put<Inversion>(`${this.apiUrl}/${id}`, inversion).pipe(
      tap(updatedInversion => {
        console.log('Inversión actualizada:', updatedInversion);
        const currentInversiones = this.inversiones$.getValue();
        const index = currentInversiones.findIndex(i => i.id === id);
        if (index !== -1) {
          currentInversiones[index] = {
            ...updatedInversion,
            selected: currentInversiones[index].selected
          };
          this.inversiones$.next([...currentInversiones]);
          
          // Update selected inversions if needed
          const currentSelected = this.selectedInversiones$.getValue();
          const selectedIndex = currentSelected.findIndex(i => i.id === id);
          if (selectedIndex !== -1) {
            currentSelected[selectedIndex] = currentInversiones[index];
            this.selectedInversiones$.next([...currentSelected]);
          }
        }
      }),
      catchError(error => {
        console.error('Error al actualizar inversión:', error);
        throw error;
      })
    );
  }

  deleteInversion(id: number): Observable<void> {
    console.log('Eliminando inversión:', id);
    return this.http.delete<void>(`${this.apiUrl}/${id}`).pipe(
      tap(() => {
        console.log('Inversión eliminada:', id);
        const currentInversiones = this.inversiones$.getValue();
        this.inversiones$.next(currentInversiones.filter(i => i.id !== id));
        
        // Remove from selected inversions if present
        const currentSelected = this.selectedInversiones$.getValue();
        this.selectedInversiones$.next(currentSelected.filter(i => i.id !== id));
      }),
      catchError(error => {
        console.error('Error al eliminar inversión:', error);
        throw error;
      })
    );
  }
} 