import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { Ganado } from '../interfaces/ganado.interface';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class GanadoService {
  private apiUrl = `${environment.apiUrl}/ganado`;

  constructor(private http: HttpClient) { }

  getGanadoById(id: string): Observable<Ganado> {
    return this.http.get<Ganado>(`${this.apiUrl}/${id}`);
  }

  getHistorialPeso(id: string): Observable<Ganado['historialPeso']> {
    return this.http.get<Ganado['historialPeso']>(`${this.apiUrl}/${id}/historial-peso`);
  }

  getHistorialMedidas(id: string): Observable<Ganado['historialMedidas']> {
    return this.http.get<Ganado['historialMedidas']>(`${this.apiUrl}/${id}/historial-medidas`);
  }

  getHistorialEstado(id: string): Observable<Ganado['historialEstado']> {
    return this.http.get<Ganado['historialEstado']>(`${this.apiUrl}/${id}/historial-estado`);
  }

  eliminarAnimal(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  getAllGanado(): Observable<Ganado[]> {
    return this.http.get<Ganado[]>(this.apiUrl);
  }

  getPesoTotalGanadoActivo(): Observable<number> {
    return this.getAllGanado().pipe(
      map(ganado => ganado
        .filter(animal => animal.estado === 'Activo')
        .reduce((total, animal) => total + animal.peso, 0)
      )
    );
  }
} 