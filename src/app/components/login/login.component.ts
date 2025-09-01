import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { ThemeSwitchComponent } from '../theme-switch/theme-switch.component';
import { ToastrModule, ToastrService } from 'ngx-toastr';
import { HttpErrorResponse } from '@angular/common/http';
import { User } from '../../models/user.model';

interface UserData {
  dicose: string;
  email: string;
  phone: string;
  password: string;
}

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, ThemeSwitchComponent, ToastrModule],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent {
  email: string = '';
  password: string = '';
  dicose: string = '';
  phone: string = '';
  isRegistering: boolean = false;
  errorMessage = '';
  showPassword: boolean = false;
  loading = false;

  constructor(
    private authService: AuthService,
    private router: Router,
    private toastr: ToastrService
  ) {
    // Si ya está autenticado, redirigir a inicio
    if (this.authService.isLoggedIn()) {
      this.router.navigate(['/inicio']);
    }
  }

  togglePanel(register: boolean) {
    this.isRegistering = register;
    // Limpiar campos y mensajes de error al cambiar de panel
    this.email = '';
    this.password = '';
    this.dicose = '';
    this.phone = '';
    this.errorMessage = '';
  }

  togglePassword() {
    this.showPassword = !this.showPassword;
  }

  onSubmit() {
    // Validación del email
    if (!this.email) {
      this.toastr.warning('El email es requerido', 'Campo incompleto');
      return;
    }
    if (!this.isValidEmail(this.email)) {
      this.toastr.warning('El formato del email no es válido', 'Email inválido');
      return;
    }

    // Validación de la contraseña
    if (!this.password) {
      this.toastr.warning('La contraseña es requerida', 'Campo incompleto');
      return;
    }
    if (this.password.length < 6) {
      this.toastr.warning('La contraseña debe tener al menos 6 caracteres', 'Contraseña inválida');
      return;
    }

    this.loading = true;

    if (this.isRegistering) {
      // Validaciones adicionales para registro
      if (!this.dicose) {
        this.toastr.warning('El DICOSE es requerido', 'Campo incompleto');
        this.loading = false;
        return;
      }
      if (!this.phone) {
        this.toastr.warning('El teléfono es requerido', 'Campo incompleto');
        this.loading = false;
        return;
      }

      // Registro
      console.log('Intentando registrar usuario:', { email: this.email, dicose: this.dicose, phone: this.phone });
      this.authService.register({
        email: this.email,
        password: this.password,
        dicose: this.dicose,
        phone: this.phone
      }).subscribe({
        next: (response) => {
          console.log('Respuesta del registro:', response);
          this.toastr.success('Registro exitoso', 'Bienvenido');
          this.togglePanel(false); // Cambiar al panel de login
        },
        error: (error) => {
          console.error('Error en el registro:', error);
          this.toastr.error(error.message, 'Error de registro');
          this.loading = false;
        },
        complete: () => {
          this.loading = false;
        }
      });
    } else {
      // Login
      console.log('Intentando iniciar sesión con:', { email: this.email });
      this.authService.login({
        email: this.email,
        password: this.password
      }).subscribe({
        next: (response) => {
          console.log('Respuesta del login:', response);
          this.toastr.success('Inicio de sesión exitoso', 'Bienvenido');
          this.router.navigate(['/inicio']);
        },
        error: (error) => {
          console.error('Error en el login:', error);
          let errorMessage = 'Error al iniciar sesión';
          
          if (error.status === 401) {
            errorMessage = 'Email o contraseña incorrectos';
          } else if (error.status === 404) {
            errorMessage = 'El email ingresado no está registrado';
          } else if (error.status === 0) {
            errorMessage = 'No se pudo conectar con el servidor. Por favor, intente más tarde.';
          } else if (error.error?.message) {
            errorMessage = error.error.message;
          } else if (error.message) {
            errorMessage = error.message;
          }

          this.toastr.error(errorMessage, 'Error de autenticación');
          this.loading = false;
        },
        complete: () => {
          this.loading = false;
        }
      });
    }
  }

  private isValidEmail(email: string): boolean {
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    return emailRegex.test(email);
  }
} 