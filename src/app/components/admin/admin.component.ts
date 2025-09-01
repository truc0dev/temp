import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AdminService } from '../../services/admin.service';
import { ToastrService } from 'ngx-toastr';
import { User } from '../../models/user.model';
import { HttpErrorResponse } from '@angular/common/http';

@Component({
  selector: 'app-admin',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="container mx-auto px-4 py-8">
      <h1 class="text-3xl font-bold mb-6">Panel de Administración</h1>
      <div class="bg-white shadow-md rounded-lg overflow-hidden">
        <table class="min-w-full">
          <thead class="bg-gray-100">
            <tr>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nombre</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Apellido</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rol</th>
              <th class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
            </tr>
          </thead>
          <tbody class="bg-white divide-y divide-gray-200">
            <tr *ngFor="let user of users">
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{{user.email}}</td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{{user.name}}</td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{{user.lastName}}</td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{{user.is_admin ? 'Administrador' : 'Usuario'}}</td>
              <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                <button 
                  (click)="deleteUser(user.id)"
                  class="text-red-600 hover:text-red-900"
                  [disabled]="user.is_admin">
                  Eliminar
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  `,
  styles: []
})
export class AdminComponent implements OnInit {
  users: User[] = [];

  constructor(
    private adminService: AdminService,
    private toastr: ToastrService
  ) {}

  ngOnInit(): void {
    this.loadUsers();
  }

  loadUsers(): void {
    this.adminService.getUsers().subscribe({
      next: (users: User[]) => {
        this.users = users;
      },
      error: (error: HttpErrorResponse) => {
        this.toastr.error('Error al cargar usuarios', 'Error');
      }
    });
  }

  deleteUser(userId: number | undefined): void {
    if (!userId) {
      this.toastr.error('ID de usuario no válido', 'Error');
      return;
    }

    if (confirm('¿Estás seguro de que deseas eliminar este usuario?')) {
      this.adminService.deleteUser(userId).subscribe({
        next: () => {
          this.toastr.success('Usuario eliminado correctamente');
          this.loadUsers();
        },
        error: (error: HttpErrorResponse) => {
          this.toastr.error('Error al eliminar usuario', 'Error');
        }
      });
    }
  }
} 