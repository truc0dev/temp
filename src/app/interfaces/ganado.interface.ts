export interface Ganado {
  id: string;
  identificacion: string;
  raza: string;
  sexo: string;
  edad: number;
  peso: number;
  estado: string;
  ubicacion: string;
  condicionCorporal: number;
  campo: string;
  ultimaActualizacion: Date;
  historialPeso: HistorialPeso[];
  historialMedidas: HistorialMedidas[];
  historialEstado: HistorialEstado[];
}

export interface HistorialPeso {
  fecha: Date;
  peso: number;
}

export interface HistorialMedidas {
  fecha: Date;
  altura: number;
  circunferencia: number;
}

export interface HistorialEstado {
  fecha: Date;
  estado: string;
} 