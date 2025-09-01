import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Inversion } from '../models/inversion.model';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class InversionService {
  private apiUrl = `${environment.apiUrl}/inversiones`;

  constructor(private http: HttpClient) { }

  getInversiones(): Observable<Inversion[]> {
    return this.http.get<Inversion[]>(this.apiUrl);
  }

  deleteInversion(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  updateInversion(inversion: Inversion): Observable<Inversion> {
    return this.http.put<Inversion>(`${this.apiUrl}/${inversion.id}`, inversion);
  }
} 