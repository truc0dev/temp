export interface Ticket {
  id: number;
  titulo: string;
  descripcion: string;
  estado: string;
  prioridad: string;
  fechaCreacion: Date;
  fechaActualizacion: Date;
  usuarioAsignadoId?: number;
  usuarioCreadorId: number;
} 