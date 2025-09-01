import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { ThemeSwitchComponent } from '../theme-switch/theme-switch.component';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ToastrModule, ToastrService } from 'ngx-toastr';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    RouterModule,
    ThemeSwitchComponent,
    ToastrModule
  ],
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.scss']
})
export class RegisterComponent implements OnInit {
  showPassword: boolean = false;
  registerForm: FormGroup;
  loading = false;
  submitted = false;

  constructor(
    private authService: AuthService,
    private router: Router,
    private formBuilder: FormBuilder,
    private toastr: ToastrService
  ) {
    // Si ya está autenticado, redirigir a inicio
    if (this.authService.isLoggedIn()) {
      this.router.navigate(['/inicio']);
    }

    this.registerForm = this.formBuilder.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', Validators.required],
      name: ['', Validators.required],
      lastName: ['', Validators.required]
    }, {
      validator: this.passwordMatchValidator
    });
  }

  ngOnInit(): void {}

  get f() { return this.registerForm.controls; }

  passwordMatchValidator(g: FormGroup) {
    return g.get('password')?.value === g.get('confirmPassword')?.value
      ? null : { 'mismatch': true };
  }

  togglePassword() {
    this.showPassword = !this.showPassword;
  }

  onSubmit() {
    this.submitted = true;

    if (this.registerForm.invalid) {
      if (this.f['name'].errors?.['required']) {
        this.toastr.warning('El nombre es requerido', 'Campo incompleto');
        return;
      }

      if (this.f['lastName'].errors?.['required']) {
        this.toastr.warning('El apellido es requerido', 'Campo incompleto');
        return;
      }

      if (this.f['email'].errors?.['required']) {
        this.toastr.warning('El email es requerido', 'Campo incompleto');
        return;
      } else if (this.f['email'].errors?.['email']) {
        this.toastr.warning('El formato del email no es válido', 'Email inválido');
        return;
      }
      
      if (this.f['password'].errors?.['required']) {
        this.toastr.warning('La contraseña es requerida', 'Campo incompleto');
        return;
      } else if (this.f['password'].errors?.['minlength']) {
        this.toastr.warning('La contraseña debe tener al menos 6 caracteres', 'Contraseña muy corta');
        return;
      }

      if (this.registerForm.errors?.['mismatch']) {
        this.toastr.warning('Las contraseñas no coinciden', 'Error de validación');
        return;
      }

      return;
    }

    this.loading = true;
    const { confirmPassword, ...userData } = this.registerForm.value;
    
    this.authService.register(userData).subscribe({
      next: () => {
        this.toastr.success('Registro exitoso', 'Bienvenido');
        // La navegación se maneja en el servicio de autenticación
      },
      error: (error) => {
        this.toastr.error(error.message, 'Error');
        this.loading = false;
      }
    });
  }

  registerWithGoogle() {
    this.authService.googleSignIn().subscribe({
      next: () => {
        this.toastr.success('Registro con Google exitoso', 'Bienvenido');
        // La navegación se maneja en el servicio de autenticación
      },
      error: (error) => {
        this.toastr.error(error.message, 'Error');
      }
    });
  }

  goToLogin() {
    this.router.navigate(['/login']);
  }
} 