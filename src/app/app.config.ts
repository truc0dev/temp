import { ApplicationConfig } from '@angular/core';
import { provideRouter, Routes } from '@angular/router';
import { provideAnimations } from '@angular/platform-browser/animations';
import { provideHttpClient } from '@angular/common/http';
import { ListasPersonalizadasService } from './services/listas-personalizadas.service';
import { provideToastr } from 'ngx-toastr';
import { AuthGuard } from './guards/auth.guard';
import { adminGuard } from './guards/admin.guard';
import { InicioComponent } from './components/inicio/inicio.component';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'login',
    pathMatch: 'full'
  },
  {
    path: 'login',
    loadComponent: () => import('./components/login/login.component').then(m => m.LoginComponent)
  },
  {
    path: 'register',
    loadComponent: () => import('./components/register/register.component').then(m => m.RegisterComponent)
  },
  {
    path: 'inicio',
    component: InicioComponent,
    canActivate: [AuthGuard]
  },
  {
    path: 'admin',
    loadComponent: () => import('./components/admin/admin.component').then(m => m.AdminComponent),
    canActivate: [AuthGuard, adminGuard]
  },
  {
    path: 'mis-animales',
    loadComponent: () => import('./components/mis-animales/mis-animales.component').then(m => m.MisAnimalesComponent),
    canActivate: [AuthGuard]
  },
  {
    path: 'listas',
    loadComponent: () => import('./components/listas-personalizadas/listas-personalizadas.component').then(m => m.ListasPersonalizadasComponent),
    canActivate: [AuthGuard]
  },
  {
    path: 'guias',
    loadComponent: () => import('./components/cargar-guias/cargar-guias.component').then(m => m.CargarGuiasComponent),
    canActivate: [AuthGuard]
  },
  {
    path: 'inversiones',
    loadComponent: () => import('./components/inversiones/inversiones.component').then(m => m.InversionesComponent),
    canActivate: [AuthGuard]
  },
  {
    path: 'movimientos',
    loadComponent: () => import('./components/movimientos/movimientos.component').then(m => m.MovimientosComponent),
    canActivate: [AuthGuard]
  },
  {
    path: 'datos',
    component: InicioComponent, // Temporary placeholder until Datos component is created
    canActivate: [AuthGuard]
  },
  {
    path: '**',
    redirectTo: 'login'
  }
];

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes),
    provideAnimations(),
    provideHttpClient(),
    ListasPersonalizadasService,
    provideToastr({
      timeOut: 3000,
      positionClass: 'toast-top-right',
      preventDuplicates: true,
    })
  ]
};
