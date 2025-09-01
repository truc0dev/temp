import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, BehaviorSubject, throwError, timer } from 'rxjs';
import { environment } from '../../environments/environment';
import { AuthService } from './auth.service';
import { Animal } from '../interfaces/animal.interface';
import { catchError, retryWhen, delayWhen, take } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class AnimalesService {
  private apiUrl = `${environment.apiUrl}/excel`;
  private animalesSubject = new BehaviorSubject<Animal[]>([]);
  animales$ = this.animalesSubject.asObservable();

  constructor(
    private http: HttpClient,
    private authService: AuthService
  ) { }

  private getHeaders(): HttpHeaders {
    const token = this.authService.getToken();
    if (!token) {
      console.error('No hay token disponible');
      this.authService.logout();
      return new HttpHeaders();
    }
    console.log('Token disponible:', token.substring(0, 20) + '...');
    
    // Crear los headers de manera explícita
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    });
    
    console.log('Headers construidos:', {
      'Authorization': headers.get('Authorization'),
      'Content-Type': headers.get('Content-Type'),
      'Accept': headers.get('Accept')
    });
    
    return headers;
  }

  cargarDatosIniciales(): Observable<Animal[]> {
    const headers = this.getHeaders();
    
    // Verificar que el token está presente en los headers
    const authHeader = headers.get('Authorization');
    if (!authHeader) {
      console.error('No se encontró el header de autorización');
      this.authService.logout();
      return throwError(() => new Error('No hay token de autorización'));
    }

    console.log('Realizando petición con headers:', {
      'Authorization': authHeader,
      'Content-Type': headers.get('Content-Type'),
      'Accept': headers.get('Accept')
    });

    return this.http.get<Animal[]>(`${this.apiUrl}/data`, { 
      headers,
      withCredentials: false // Cambiado a false ya que estamos usando token en el header
    }).pipe(
      retryWhen(errors =>
        errors.pipe(
          delayWhen(() => timer(1000)), // Esperar 1 segundo antes de reintentar
          take(1) // Reintentar solo una vez
        )
      ),
      catchError(error => {
        console.error('Error en cargarDatosIniciales:', error);
        if (error.status === 401) {
          console.error('Error de autenticación, cerrando sesión');
          this.authService.logout();
        }
        return throwError(() => error);
      })
    );
  }

  setAnimales(animales: Animal[]): void {
    this.animalesSubject.next(animales);
  }

  buscarAnimales(termino: string): Animal[] {
    if (!termino) return this.animalesSubject.value;
    
    termino = termino.toLowerCase();
    return this.animalesSubject.value.filter(animal => {
      return Object.values(animal).some(valor => 
        String(valor).toLowerCase().includes(termino)
      );
    });
  }

  buscarPorDispositivo(dispositivo: string): Animal | undefined {
    const animales = this.animalesSubject.value;
    console.log('Buscando dispositivo:', dispositivo, 'en', animales.length, 'animales');
    
    const animalEncontrado = animales.find(animal => {
      // Limpiar el número de dispositivo del animal de cualquier formato especial
      const numeroAnimal = animal.dispositivo.replace(/[^0-9]/g, '');
      // Comparar los últimos 8 dígitos
      return numeroAnimal.endsWith(dispositivo);
    });

    console.log('Resultado de búsqueda:', animalEncontrado);
    return animalEncontrado;
  }
} 