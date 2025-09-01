import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ListasPersonalizadasService } from '../../services/listas-personalizadas.service';
import { ListaPersonalizada } from '../../interfaces/lista-personalizada.interface';
import { AnimalesService } from '../../services/animales.service';
import { Animal } from '../../interfaces/animal.interface';
import { first } from 'rxjs/operators';
import * as XLSX from 'xlsx';

@Component({
  selector: 'app-listas-personalizadas',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="listas-container">
      <header class="listas-header">
        <h1>Listas Personalizadas</h1>
        <p class="subtitle">Gestiona tus listas de animales y campos</p>
        <div class="header-actions">
          <div class="entity-toggle">
            <button 
              [class.active]="entityType === 'animales'" 
              (click)="setEntityType('animales')"
              class="toggle-btn">
              <i class="fas fa-cow"></i>
              Animales
            </button>
            <button 
              [class.active]="entityType === 'campos'" 
              (click)="setEntityType('campos')"
              class="toggle-btn">
              <i class="fas fa-map-marker-alt"></i>
              Campos
            </button>
          </div>
          <button class="create-btn" (click)="mostrarFormularioNuevaLista()">
            <i class="fas fa-plus"></i>
            Crear Nueva Lista
          </button>
        </div>
      </header>

      <!-- Formulario de nueva lista -->
      <div class="new-list-form" *ngIf="showNewListForm">
        <div class="form-content">
          <h2>Crear Nueva Lista</h2>
          <div class="form-group">
            <label for="listName">Nombre de la Lista</label>
            <input 
              type="text" 
              id="listName" 
              [(ngModel)]="newListName" 
              [placeholder]="entityType === 'animales' ? 'Ej: Novillos Angus del Campo Sur' : 'Ej: Campos de la Zona Norte'"
              class="form-control"
            >
          </div>
          
          <div class="form-group">
            <label>Tipo de Lista</label>
            <div class="entity-type-selector">
              <button 
                [class.active]="entityType === 'animales'" 
                (click)="setEntityType('animales')"
                class="type-btn"
                [class.error]="showEntityTypeError && entityType === null">
                <i class="fas fa-cow"></i>
                Animales
              </button>
              <button 
                [class.active]="entityType === 'campos'" 
                (click)="setEntityType('campos')"
                class="type-btn"
                [class.error]="showEntityTypeError && entityType === null">
                <i class="fas fa-map-marker-alt"></i>
                Campos
              </button>
            </div>
            <small class="error-message" *ngIf="showEntityTypeError">Debes seleccionar un tipo de lista</small>
          </div>
          
          <div class="form-group">
            <label>Filtros</label>
            <div class="filters-grid">
              <ng-container *ngIf="entityType === 'animales'">
                <div class="filter-item">
                  <label>Raza</label>
                  <input 
                    type="text" 
                    [(ngModel)]="filtros.raza" 
                    placeholder="Ej: Angus"
                    class="form-control"
                  >
                </div>
                <div class="filter-item">
                  <label>Ubicación</label>
                  <input 
                    type="text" 
                    [(ngModel)]="filtros.ubicacion" 
                    placeholder="Ej: Campo Sur"
                    class="form-control"
                  >
                </div>
                <div class="filter-item">
                  <label>Sexo</label>
                  <select [(ngModel)]="filtros.sexo" class="form-control">
                    <option value="">Todos</option>
                    <option value="Macho">Macho</option>
                    <option value="Hembra">Hembra</option>
                  </select>
                </div>
                <div class="filter-item">
                  <label>Status de Vida</label>
                  <select [(ngModel)]="filtros.statusVida" class="form-control">
                    <option value="">Todos</option>
                    <option value="Vivo">Vivo</option>
                    <option value="Muerto">Muerto</option>
                  </select>
                </div>
              </ng-container>

              <ng-container *ngIf="entityType === 'campos'">
                <div class="filter-item">
                  <label>Zona</label>
                  <input 
                    type="text" 
                    [(ngModel)]="filtros.zona" 
                    placeholder="Ej: Zona Norte"
                    class="form-control"
                  >
                </div>
                <div class="filter-item">
                  <label>Provincia</label>
                  <input 
                    type="text" 
                    [(ngModel)]="filtros.provincia" 
                    placeholder="Ej: Buenos Aires"
                    class="form-control"
                  >
                </div>
                <div class="filter-item">
                  <label>Superficie Mínima (ha)</label>
                  <input 
                    type="number" 
                    [(ngModel)]="filtros.superficieMin" 
                    placeholder="Ej: 100"
                    class="form-control"
                  >
                </div>
                <div class="filter-item">
                  <label>Estado</label>
                  <select [(ngModel)]="filtros.estado" class="form-control">
                    <option value="">Todos</option>
                    <option value="Activo">Activo</option>
                    <option value="Inactivo">Inactivo</option>
                  </select>
                </div>
              </ng-container>
            </div>
          </div>

          <div class="form-actions">
            <button class="cancel-btn" (click)="cancelarNuevaLista()">
              <i class="fas fa-times"></i>
              Cancelar
            </button>
            <button class="save-btn" (click)="crearLista()" [disabled]="!newListName.trim()">
              <i class="fas fa-save"></i>
              Guardar Lista
            </button>
          </div>
        </div>
      </div>

      <div class="listas-grid">
        <div *ngIf="listas.length === 0" class="empty-state">
          <i class="fas fa-list"></i>
          <h2>No hay listas personalizadas</h2>
          <p>Crea una nueva lista para organizar tus animales y campos.</p>
        </div>

        <div *ngFor="let lista of listas" class="lista-card">
          <div class="lista-header">
            <h3>{{ lista.nombre }}</h3>
            <div class="lista-stats">
              <span class="stat">
                <i class="fas fa-users"></i>
                {{ getPropietariosCount(lista) }} propietarios
              </span>
              <span class="stat">
                <i class="fas fa-calendar"></i>
                {{ lista.fechaCreacion | date:'dd/MM/yyyy' }}
              </span>
            </div>
          </div>
          
          <div class="lista-actions">
            <button class="action-btn view-btn" (click)="verDetalles(lista)">
              <i class="fas fa-eye"></i>
              Ver detalles
            </button>
            <button class="action-btn edit-btn" (click)="editarLista(lista)">
              <i class="fas fa-edit"></i>
              Editar
            </button>
            <button class="action-btn export-btn" (click)="exportarLista(lista)">
              <i class="fas fa-file-excel"></i>
              Exportar
            </button>
            <button class="action-btn delete-btn" (click)="eliminarLista(lista, $event)">
              <i class="fas fa-trash"></i>
              Eliminar
            </button>
          </div>
        </div>
      </div>

      <!-- Modal de detalles -->
      <div class="modal-overlay" *ngIf="listaSeleccionada" (click)="cerrarDetalles()">
        <div class="modal-content" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <h2>{{ listaSeleccionada.nombre }}</h2>
            <div class="modal-actions">
              <button class="export-btn" (click)="exportarLista(listaSeleccionada)">
                <i class="fas fa-file-excel"></i>
                Exportar Excel
              </button>
              <button class="close-btn" (click)="cerrarDetalles()">
                <i class="fas fa-times"></i>
              </button>
            </div>
          </div>
          <div class="modal-body">
            <div class="list-info">
              <p class="list-date">Creada: {{ listaSeleccionada.fechaCreacion | date:'dd/MM/yyyy HH:mm' }}</p>
              <p class="list-date">Última modificación: {{ listaSeleccionada.ultimaModificacion | date:'dd/MM/yyyy HH:mm' }}</p>
            </div>
            <div class="list-content">
              <div *ngFor="let propietario of getPropietariosLista()" class="propietario-item">
                <div class="propietario-header">
                  <h3>{{ propietario.nombre }}</h3>
                  <span class="propietario-numero">({{ propietario.numero }})</span>
                </div>
                <div class="animales-list">
                  <div *ngFor="let dispositivo of propietario.animales" class="animal-item">
                    {{ dispositivo }}
                  </div>
                </div>
              </div>
              <div *ngIf="!getPropietariosLista().length" class="empty-list">
                No hay propietarios en esta lista
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Diálogo de confirmación -->
      <div class="confirm-dialog" *ngIf="showConfirmDialog" [style.left.px]="confirmDialogPosition.x" [style.top.px]="confirmDialogPosition.y">
        <div class="confirm-content">
          <p>{{ confirmDialogMessage }}</p>
          <div class="confirm-actions">
            <button class="confirm-btn" (click)="confirmAction()">
              <i class="fas fa-check"></i>
              Confirmar
            </button>
            <button class="cancel-btn" (click)="cancelConfirmation()">
              <i class="fas fa-times"></i>
              Cancelar
            </button>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .listas-container {
      padding: 2rem;
      max-width: 1200px;
      margin: 0 auto;
    }

    .listas-header {
      text-align: center;
      margin-bottom: 2rem;
      padding: 1.5rem;
      background: linear-gradient(135deg, var(--primary-green) 0%, var(--secondary-green) 100%);
      color: white;
      border-radius: 12px;
      box-shadow: var(--shadow-lg);

      h1 {
        font-size: 2rem;
        margin-bottom: 0.5rem;
        color: white;
      }

      .subtitle {
        font-size: 1.1rem;
        opacity: 0.9;
        margin-bottom: 1.5rem;
      }

      .header-actions {
        display: flex;
        justify-content: center;
        align-items: center;
        gap: 1.5rem;
      }

      .entity-toggle {
        display: flex;
        background: rgba(255, 255, 255, 0.1);
        padding: 0.25rem;
        border-radius: 8px;
        gap: 0.25rem;

        .toggle-btn {
          background: none;
          border: none;
          color: white;
          padding: 0.5rem 1rem;
          border-radius: 6px;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 0.5rem;
          transition: all 0.3s ease;
          font-size: 0.9rem;

          i {
            font-size: 1rem;
          }

          &:hover {
            background: rgba(255, 255, 255, 0.1);
          }

          &.active {
            background: white;
            color: var(--primary-green);
          }
        }
      }

      .create-btn {
        background: white;
        color: var(--primary-green);
        border: none;
        padding: 0.75rem 1.5rem;
        border-radius: 6px;
        font-size: 1rem;
        cursor: pointer;
        display: inline-flex;
        align-items: center;
        gap: 0.5rem;
        transition: all 0.3s ease;

        &:hover {
          transform: translateY(-2px);
          box-shadow: var(--shadow-md);
        }

        i {
          font-size: 1rem;
        }
      }
    }

    .new-list-form {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.5);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1000;
    }

    .form-content {
      background: var(--background-light);
      border-radius: 16px;
      padding: 2rem;
      width: 90%;
      max-width: 600px;
      box-shadow: var(--shadow-lg);

      h2 {
        color: var(--text-primary);
        margin-bottom: 1.5rem;
        font-size: 1.8rem;
      }
    }

    .form-group {
      margin-bottom: 1.5rem;

      label {
        display: block;
        color: var(--text-primary);
        margin-bottom: 0.5rem;
        font-weight: 500;
      }

      .error-message {
        color: #dc3545;
        font-size: 0.875rem;
        margin-top: 0.25rem;
        display: block;
      }
    }

    .filters-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 1rem;
    }

    .filter-item {
      label {
        font-size: 0.9rem;
        color: var(--text-secondary);
      }
    }

    .form-control {
      width: 100%;
      padding: 0.75rem;
      border: 1px solid var(--border-color);
      border-radius: 8px;
      font-size: 1rem;
      transition: all 0.3s ease;

      &:focus {
        outline: none;
        border-color: var(--primary-green);
        box-shadow: 0 0 0 2px rgba(var(--primary-green-rgb), 0.1);
      }
    }

    .form-actions {
      display: flex;
      justify-content: flex-end;
      gap: 1rem;
      margin-top: 2rem;

      button {
        padding: 0.75rem 1.5rem;
        border-radius: 8px;
        font-size: 1rem;
        cursor: pointer;
        display: flex;
        align-items: center;
        gap: 0.5rem;
        transition: all 0.3s ease;

        &:disabled {
          opacity: 0.7;
          cursor: not-allowed;
        }

        &.cancel-btn {
          background: var(--background-grey);
          color: var(--text-primary);
          border: none;

          &:hover {
            background: var(--border-color);
          }
        }

        &.save-btn {
          background: var(--primary-green);
          color: white;
          border: none;

          &:hover:not(:disabled) {
            background: var(--secondary-green);
            transform: translateY(-1px);
          }
        }
      }
    }

    .listas-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
      gap: 2rem;
      padding: 1rem;
    }

    .empty-state {
      grid-column: 1 / -1;
      text-align: center;
      padding: 4rem;
      background: var(--background-light);
      border-radius: 16px;
      box-shadow: var(--shadow-sm);

      i {
        font-size: 4rem;
        color: var(--text-secondary);
        margin-bottom: 1rem;
      }

      h2 {
        color: var(--text-primary);
        margin-bottom: 1rem;
      }

      p {
        color: var(--text-secondary);
        max-width: 400px;
        margin: 0 auto;
      }
    }

    .lista-card {
      background: var(--background-light);
      border-radius: 16px;
      padding: 1.5rem;
      box-shadow: var(--shadow-sm);
      transition: all 0.3s ease;
      border: 2px solid transparent;

      &:hover {
        transform: translateY(-5px);
        box-shadow: var(--shadow-md);
        border-color: var(--light-green);
      }
    }

    .lista-header {
      margin-bottom: 1.5rem;

      h3 {
        color: var(--text-primary);
        font-size: 1.3rem;
        margin-bottom: 1rem;
      }
    }

    .lista-stats {
      display: flex;
      gap: 1rem;
      color: var(--text-secondary);
      font-size: 0.9rem;

      .stat {
        display: flex;
        align-items: center;
        gap: 0.5rem;

        i {
          color: var(--primary-green);
        }
      }
    }

    .lista-actions {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 0.5rem;

      .action-btn {
        padding: 0.5rem;
        border: none;
        border-radius: 8px;
        font-size: 0.9rem;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 0.5rem;
        transition: all 0.2s ease;

        &.view-btn {
          background: var(--background-grey);
          color: var(--text-primary);

          &:hover {
            background: var(--light-green);
            color: var(--primary-green);
          }
        }

        &.edit-btn {
          background: var(--background-grey);
          color: var(--text-primary);

          &:hover {
            background: var(--light-green);
            color: var(--primary-green);
          }
        }

        &.export-btn {
          background: var(--success-green);
          color: white;

          &:hover {
            background: var(--primary-green);
          }
        }

        &.delete-btn {
          background: #fff5f5;
          color: #dc3545;

          &:hover {
            background: #dc3545;
            color: white;
          }
        }
      }
    }

    // Estilos para el modal
    .modal-overlay {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background-color: rgba(0, 0, 0, 0.5);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 2000;
    }

    .modal-content {
      background: var(--background-light);
      border-radius: 8px;
      box-shadow: var(--shadow-lg);
      width: 90%;
      max-width: 600px;
      max-height: 80vh;
      display: flex;
      flex-direction: column;
    }

    .modal-header {
      padding: 20px;
      border-bottom: 1px solid var(--border-color);
      display: flex;
      justify-content: space-between;
      align-items: center;

      h2 {
        margin: 0;
        color: var(--text-primary);
        font-size: 1.5rem;
      }

      .modal-actions {
        display: flex;
        gap: 10px;
        align-items: center;

        .export-btn {
          background: var(--success-green);
          color: white;
          border: none;
          padding: 8px 16px;
          border-radius: 4px;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 14px;
          transition: background-color 0.2s;

          i {
            font-size: 16px;
          }

          &:hover {
            background-color: var(--primary-green);
          }
        }

        .close-btn {
          background: none;
          border: none;
          color: var(--text-secondary);
          cursor: pointer;
          font-size: 1.2rem;
          padding: 5px;
          border-radius: 4px;

          &:hover {
            background-color: var(--background-grey);
            color: var(--text-primary);
          }
        }
      }
    }

    .modal-body {
      padding: 20px;
      overflow-y: auto;
    }

    .list-info {
      margin-bottom: 20px;
      padding-bottom: 15px;
      border-bottom: 1px solid var(--border-color);

      .list-date {
        color: var(--text-secondary);
        margin: 5px 0;
        font-size: 0.9rem;
      }
    }

    .list-content {
      .propietario-item {
        background-color: var(--background-grey);
        border-radius: 6px;
        padding: 15px;
        margin-bottom: 15px;

        .propietario-header {
          display: flex;
          align-items: center;
          margin-bottom: 10px;

          h3 {
            margin: 0;
            color: var(--text-primary);
            font-size: 1.1rem;
          }

          .propietario-numero {
            margin-left: 10px;
            color: var(--text-secondary);
            font-size: 0.9rem;
          }
        }

        .animales-list {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
          gap: 10px;

          .animal-item {
            background-color: var(--background-light);
            border: 1px solid var(--border-color);
            border-radius: 4px;
            padding: 8px 12px;
            font-size: 0.9rem;
            color: var(--text-primary);
          }
        }
      }

      .empty-list {
        text-align: center;
        color: var(--text-secondary);
        font-style: italic;
        padding: 20px;
      }
    }

    // Estilos para el diálogo de confirmación
    .confirm-dialog {
      position: fixed;
      background: var(--background-light);
      border: 1px solid var(--border-color);
      border-radius: 12px;
      box-shadow: var(--shadow-lg);
      padding: 20px;
      z-index: 2000;
      width: 300px;
      animation: fadeIn 0.2s ease-out;
      left: 50%;
      top: 50%;
      transform: translate(-50%, -50%);

      &::before {
        content: 'Confirmar acción';
        display: block;
        position: absolute;
        top: -30px;
        left: 50%;
        transform: translateX(-50%);
        color: var(--text-primary);
        font-weight: 500;
        font-size: 0.9rem;
        background: var(--background-light);
        padding: 4px 12px;
        border-radius: 6px;
        box-shadow: var(--shadow-sm);
        white-space: nowrap;
      }

      .confirm-content {
        p {
          margin: 0 0 20px 0;
          color: var(--text-primary);
          font-size: 14px;
          text-align: center;
        }

        .confirm-actions {
          display: flex;
          gap: 10px;
          justify-content: center;

          button {
            padding: 8px 16px;
            border-radius: 6px;
            font-size: 14px;
            display: flex;
            align-items: center;
            gap: 6px;
            transition: all 0.2s ease;
            border: none;
            cursor: pointer;

            i {
              font-size: 14px;
            }

            &.confirm-btn {
              background-color: #dc3545;
              color: white;

              &:hover {
                background-color: #c82333;
                transform: translateY(-1px);
              }
            }

            &.cancel-btn {
              background-color: var(--background-grey);
              color: var(--text-primary);

              &:hover {
                background-color: var(--border-color);
                transform: translateY(-1px);
              }
            }
          }
        }
      }
    }

    .entity-type-selector {
      display: flex;
      gap: 1rem;
      margin-bottom: 0.5rem;

      .type-btn {
        flex: 1;
        padding: 1rem;
        border: 2px solid var(--border-color);
        border-radius: 8px;
        background: white;
        color: var(--text-primary);
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 0.5rem;
        transition: all 0.3s ease;
        font-size: 1rem;

        i {
          font-size: 1.2rem;
        }

        &:hover {
          border-color: var(--primary-green);
          background: var(--light-green);
        }

        &.active {
          background: var(--primary-green);
          color: white;
          border-color: var(--primary-green);
        }

        &.error {
          border-color: #dc3545;
          animation: shake 0.5s ease-in-out;
        }
      }
    }

    @keyframes shake {
      0%, 100% { transform: translateX(0); }
      25% { transform: translateX(-5px); }
      75% { transform: translateX(5px); }
    }
  `]
})
export class ListasPersonalizadasComponent implements OnInit {
  listas: ListaPersonalizada[] = [];
  listaSeleccionada: ListaPersonalizada | null = null;
  showConfirmDialog = false;
  confirmDialogMessage = '';
  confirmDialogAction: () => void = () => {};
  confirmDialogPosition = { x: 0, y: 0 };
  showNewListForm = false;
  newListName = '';
  entityType: 'animales' | 'campos' | null = null;
  showEntityTypeError = false;
  filtros = {
    raza: '',
    ubicacion: '',
    sexo: '',
    statusVida: '',
    zona: '',
    provincia: '',
    superficieMin: null as number | null,
    estado: ''
  };

  constructor(
    private listasService: ListasPersonalizadasService,
    private animalesService: AnimalesService
  ) {}

  ngOnInit() {
    this.listasService.listas$.subscribe(listas => {
      this.listas = listas;
    });
  }

  mostrarFormularioNuevaLista() {
    this.showNewListForm = true;
    this.newListName = '';
    this.entityType = null;
    this.showEntityTypeError = false;
    this.filtros = {
      raza: '',
      ubicacion: '',
      sexo: '',
      statusVida: '',
      zona: '',
      provincia: '',
      superficieMin: null,
      estado: ''
    };
  }

  cancelarNuevaLista() {
    this.showNewListForm = false;
  }

  crearLista() {
    if (!this.entityType) {
      this.showEntityTypeError = true;
      return;
    }

    if (this.newListName.trim()) {
      const nuevaLista = this.listasService.crearLista(this.newListName, this.entityType);
      
      if (this.entityType === 'animales') {
        // Aplicar filtros para animales
        if (Object.values(this.filtros).some(filtro => filtro)) {
          this.animalesService.animales$.pipe(first()).subscribe(animales => {
            const animalesFiltrados = animales.filter(animal => {
              return (
                (!this.filtros.raza || animal.raza.toLowerCase().includes(this.filtros.raza.toLowerCase())) &&
                (!this.filtros.ubicacion || animal.ubicacion.toLowerCase().includes(this.filtros.ubicacion.toLowerCase())) &&
                (!this.filtros.sexo || animal.sexo === this.filtros.sexo) &&
                (!this.filtros.statusVida || animal.statusVida === this.filtros.statusVida)
              );
            });

            animalesFiltrados.forEach(animal => {
              this.listasService.agregarAnimalALista(
                nuevaLista.id,
                animal.propietario,
                animal.nombrePropietario,
                animal.dispositivo
              );
            });
          });
        }
      } else {
        // Aplicar filtros para campos
        if (Object.values(this.filtros).some(filtro => filtro)) {
          // Aquí deberías implementar la lógica para filtrar campos
          // Similar a la de animales pero con los campos correspondientes
        }
      }

      this.showNewListForm = false;
    }
  }

  editarLista(lista: ListaPersonalizada) {
    this.listaSeleccionada = lista;
    this.showNewListForm = true;
    this.newListName = lista.nombre;
  }

  getPropietariosCount(lista: ListaPersonalizada): number {
    return Object.keys(lista.propietarios).length;
  }

  getPropietariosLista() {
    if (!this.listaSeleccionada) return [];
    
    return Object.entries(this.listaSeleccionada.propietarios).map(([numero, datos]) => ({
      numero,
      nombre: datos.nombre,
      animales: datos.animales
    }));
  }

  showConfirmation(message: string, action: () => void, event: MouseEvent) {
    this.confirmDialogMessage = message;
    this.confirmDialogAction = action;
    
    const dialogWidth = 300;
    const dialogHeight = 150;
    
    this.confirmDialogPosition = {
      x: Math.max(0, event.pageX - (dialogWidth / 2)),
      y: Math.max(0, event.pageY - (dialogHeight / 2))
    };
    
    this.showConfirmDialog = true;
  }

  confirmAction() {
    this.confirmDialogAction();
    this.showConfirmDialog = false;
  }

  cancelConfirmation() {
    this.showConfirmDialog = false;
  }

  eliminarLista(lista: ListaPersonalizada, event: MouseEvent) {
    this.showConfirmation(
      '¿Estás seguro de que deseas eliminar esta lista?',
      () => {
        this.listasService.eliminarLista(lista.id);
      },
      event
    );
  }

  exportarLista(lista: ListaPersonalizada) {
    this.animalesService.animales$.pipe(first()).subscribe(animales => {
      const animalesLista = animales.filter((animal: Animal) => {
        return lista.propietarios[animal.propietario] !== undefined;
      });

      const wb = XLSX.utils.book_new();
      
      const data = animalesLista.map((animal: Animal) => ({
        dispositivo: animal.dispositivo,
        raza: animal.raza,
        cruza: animal.cruza,
        sexo: animal.sexo,
        edadMeses: animal.edadMeses,
        edadDias: animal.edadDias,
        propietario: animal.propietario,
        nombrePropietario: animal.nombrePropietario,
        ubicacion: animal.ubicacion,
        tenedor: animal.tenedor,
        statusVida: animal.statusVida,
        statusTrazabilidad: animal.statusTrazabilidad,
        errores: animal.errores,
        fechaIdentificacion: animal.fechaIdentificacion,
        fechaRegistro: animal.fechaRegistro
      }));

      const ws = XLSX.utils.json_to_sheet(data);
      XLSX.utils.book_append_sheet(wb, ws, 'Animales');

      const nombreArchivo = `${lista.nombre}_${new Date().toISOString().split('T')[0]}.xlsx`;
      XLSX.writeFile(wb, nombreArchivo);
    });
  }

  verDetalles(lista: ListaPersonalizada) {
    this.listaSeleccionada = lista;
  }

  cerrarDetalles() {
    this.listaSeleccionada = null;
  }

  setEntityType(type: 'animales' | 'campos') {
    this.entityType = type;
    this.showEntityTypeError = false;
    // Reset filters when changing entity type
    this.filtros = {
      raza: '',
      ubicacion: '',
      sexo: '',
      statusVida: '',
      zona: '',
      provincia: '',
      superficieMin: null,
      estado: ''
    };
  }
} 