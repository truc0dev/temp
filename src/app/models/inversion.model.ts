export interface Inversion {
  id: number;
  tipo: string;
  descripcion: string;
  fechaInicio: Date;
  fechaFin: Date;
  costo: number;
  cantidad?: number;
  precioUnitario?: number;
  fecha?: Date;
  selected?: boolean;
  resultado?: number;
} 