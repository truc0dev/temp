import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AnimalesService } from '../../services/animales.service';
import { AuthService } from '../../services/auth.service';
import { catchError, take } from 'rxjs/operators';
import { of } from 'rxjs';
import { DashboardComponent } from '../dashboard/dashboard.component';

@Component({
  selector: 'app-inicio',
  standalone: true,
  imports: [CommonModule, DashboardComponent],
  templateUrl: './inicio.component.html',
  styleUrls: ['./inicio.component.scss']
})
export class InicioComponent implements OnInit {
  constructor(
    private router: Router,
    private animalesService: AnimalesService,
    private authService: AuthService
  ) {}

  ngOnInit() {
    // Verificar autenticación antes de cargar datos
    if (!this.authService.isLoggedIn()) {
      console.log('Usuario no autenticado, redirigiendo a login');
      this.router.navigate(['/login']);
      return;
    }

    // Verificar que el token está disponible
    const token = this.authService.getToken();
    if (!token) {
      console.error('No hay token disponible, redirigiendo a login');
      this.authService.logout();
      return;
    }

    console.log('Usuario autenticado, cargando datos...');

    // Cargar datos de animales al inicializar el componente
    this.animalesService.cargarDatosIniciales().pipe(
      take(1), // Asegurarnos de que solo se ejecute una vez
      catchError(error => {
        console.error('Error al cargar datos iniciales:', error);
        if (error.status === 401) {
          console.error('Error de autenticación, cerrando sesión');
          this.authService.logout();
        }
        return of([]); // Retornamos un array vacío para evitar que el error se propague
      })
    ).subscribe(
      (animales: any[]) => {
        console.log('Datos cargados exitosamente:', animales.length, 'animales');
        this.animalesService.setAnimales(animales);
      }
    );
  }

  navigate(route: string) {
    this.router.navigate([route]);
  }
} 