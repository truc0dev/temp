export interface Animal {
    dispositivo: string;
    raza: string;
    cruza: string;
    sexo: string;
    edadMeses: number;
    edadDias: number;
    propietario: string;
    nombrePropietario: string;
    ubicacion: string;
    tenedor: string;
    statusVida: string;
    statusTrazabilidad: string;
    errores: string;
    fechaIdentificacion: string;
    fechaRegistro: string;
    largoPelvis?: number;
    anchoPelvis?: number;
    alturaAnca?: number;
    categoria?: string;
    condicionCorporal?: string;
    peso?: number;
    ultimaActualizacion?: string;
} 