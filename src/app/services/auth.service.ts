import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { BehaviorSubject, Observable, from, throwError, of } from 'rxjs';
import { tap, catchError, map } from 'rxjs/operators';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { User } from '../models/user.model';
// Import jwtDecode directly or comment it out if not used
// import { jwtDecode } from 'jwt-decode';

interface AuthResponse {
  user: User;
  token: string;
}

interface LoginCredentials {
  email: string;
  password: string;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = environment.apiUrl;
  private tokenKey = 'token';
  private userKey = 'user';
  private isAuthenticatedSubject = new BehaviorSubject<boolean>(false);
  private userSubject = new BehaviorSubject<any>(null);
  user$ = this.userSubject.asObservable();

  constructor(
    private router: Router,
    private http: HttpClient
  ) {
    this.checkAuthStatus();
    console.log('API URL:', this.apiUrl); // Para debugging
  }

  private hasToken(): boolean {
    return !!localStorage.getItem(this.tokenKey);
  }

  isAuthenticated(): Observable<boolean> {
    return this.isAuthenticatedSubject.asObservable();
  }

  getCurrentUser(): User | null {
    const userData = localStorage.getItem(this.userKey);
    return userData ? JSON.parse(userData) : null;
  }

  getToken(): string | null {
    const token = localStorage.getItem(this.tokenKey);
    // Si el token existe, lo retornamos (no validamos JWT)
    return token ? token : null;
  }

  register(userData: Omit<User, 'id' | 'role'>): Observable<AuthResponse> {
    console.log('Intentando registrar usuario:', userData);
    
    // Usar el endpoint de users para registro
    return this.http.post<User>(`${this.apiUrl}/users/`, userData)
      .pipe(
        map(user => {
          // Generar un token temporal
          const tempToken = btoa(user.email + ':' + Date.now());
          return {
            user,
            token: tempToken
          };
        }),
        tap((response: AuthResponse) => {
          console.log('Respuesta del registro:', response);
          if (response.token) {
            this.setAuthData(response);
            this.router.navigate(['/login']);
          }
        }),
        catchError((error: HttpErrorResponse) => {
          let errorMessage = 'Error en el registro';
          if (error.status === 409) {
            errorMessage = 'El email ya está registrado';
          } else if (error.status === 400) {
            errorMessage = error.error?.message || 'Datos de registro inválidos';
          } else if (error.status === 500) {
            errorMessage = 'Error interno del servidor';
          }
          return throwError(() => new Error(errorMessage));
        })
      );
  }

  login(credentials: LoginCredentials): Observable<AuthResponse> {
    console.log('Intentando iniciar sesión:', credentials);
    
    // Primero intentar con el backend
    return this.http.post<AuthResponse>(`${this.apiUrl}/auth/login`, credentials).pipe(
      tap(response => {
        console.log('Respuesta del login:', response);
        if (response && response.token) {
          this.setAuthData(response);
        }
      }),
      catchError((error: HttpErrorResponse) => {
        console.error('Error completo:', error);
        
        // Si el backend no está disponible (error de conexión), usar mockLogin
        if (error.status === 0 || error.status === 500) {
          console.log('Backend no disponible, usando autenticación mock');
          return this.mockLogin(credentials);
        }
        
        let errorMessage = 'Error interno del servidor';
        
        if (error.error instanceof ErrorEvent) {
          // Error del cliente
          errorMessage = `Error: ${error.error.message}`;
        } else {
          // Error del servidor
          errorMessage = error.error?.message || error.error?.detail || errorMessage;
        }

        return throwError(() => new Error(errorMessage));
      })
    );
  }

  // Método de simulación para desarrollo
  mockLogin(credentials: { email: string; password: string }): Observable<AuthResponse> {
    // Usuario administrador hardcodeado
    if (credentials.email === 'admin@mail.com' && credentials.password === 'admin123') {
      const mockUser = {
        id: 1,
        email: 'admin@mail.com',
        dicose: 'ADMIN001',
        phone: '099123456',
        is_active: true,
        is_admin: true
      };
      
      const mockResponse = {
        user: mockUser,
        token: 'mock-admin-token-' + Date.now()
      };
      
      return of(mockResponse).pipe(
        tap(response => {
          this.setAuthData(response);
          this.router.navigate(['/inicio']);
        })
      );
    }
    
    // Usuario de prueba regular
    if (credentials.email === 'test@example.com' && credentials.password === 'password') {
      const mockUser = {
        id: 2,
        email: 'test@example.com',
        dicose: '12345',
        phone: '099123456',
        is_active: true,
        is_admin: false
      };
      
      const mockResponse = {
        user: mockUser,
        token: 'mock-token-' + Date.now()
      };
      
      return of(mockResponse).pipe(
        tap(response => {
          this.setAuthData(response);
          this.router.navigate(['/inicio']);
        })
      );
    }
    
    return throwError(() => new Error('Usuario o contraseña incorrectos'));
  }

  logout() {
    localStorage.removeItem(this.tokenKey);
    localStorage.removeItem(this.userKey);
    localStorage.removeItem('isAuthenticated');
    this.isAuthenticatedSubject.next(false);
    this.userSubject.next(null);
    this.router.navigate(['/login']);
  }

  isLoggedIn(): boolean {
    // Solo depende de la validez del token
    return !!this.getToken();
  }

  isAdmin(): boolean {
    const user = this.getCurrentUser();
    return user?.is_admin === true;
  }

  googleSignIn(): Observable<AuthResponse> {
    // Por ahora, devolvemos un Observable que emite un error
    return throwError(() => new Error('La autenticación con Google estará disponible próximamente'));
  }

  private checkAuthStatus() {
    const token = this.getToken();
    this.isAuthenticatedSubject.next(!!token);
  }

  private setAuthData(response: AuthResponse): void {
    try {
      // Guardar el token y usuario sin decodificar
      localStorage.setItem(this.tokenKey, response.token);
      localStorage.setItem(this.userKey, JSON.stringify(response.user));
      localStorage.setItem('isAuthenticated', 'true');
      this.isAuthenticatedSubject.next(true);
      this.userSubject.next(response.user);
    } catch (error) {
      console.error('Error al guardar datos de autenticación:', error);
      this.logout();
    }
  }

  private handleError(error: HttpErrorResponse) {
    let errorMessage = 'Ha ocurrido un error desconocido';
    if (error.error instanceof ErrorEvent) {
      // Error del lado del cliente
      errorMessage = error.error.message;
    } else {
      // Error del lado del servidor
      errorMessage = error.error?.message || `Error ${error.status}: ${error.statusText}`;
    }
    return throwError(() => new Error(errorMessage));
  }

  private checkToken() {
    const token = localStorage.getItem(this.tokenKey);
    if (token) {
      try {
        // Since we're not using jwtDecode, just do a simple check
        // This is a temporary solution for development
        const user = this.getCurrentUser();
        if (user) {
          this.userSubject.next(user);
        } else {
          this.logout();
        }
      } catch (error) {
        console.error("Error checking token:", error);
        this.logout();
      }
    }
  }
} 