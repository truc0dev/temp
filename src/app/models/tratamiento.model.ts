export interface Tratamiento {
  nombre: string;
  tipo: string;
  costo_total: number;
  fecha_inicio: Date;
  fecha_fin?: Date;
  notas?: string;
} 