import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { Guia } from '../interfaces/guia.interface';

@Injectable({
  providedIn: 'root'
})
export class GuiasService {
  private readonly STORAGE_KEY = 'guias';
  private readonly EXPORTED_KEY = 'guias_exportadas';
  private guiasSubject = new BehaviorSubject<Guia[]>([]);
  private guiasExportadasSubject = new BehaviorSubject<Guia[]>([]);
  guias$ = this.guiasSubject.asObservable();
  guiasExportadas$ = this.guiasExportadasSubject.asObservable();

  constructor() {
    this.cargarGuias();
    this.cargarGuiasExportadas();
  }

  private cargarGuias() {
    const guiasGuardadas = localStorage.getItem(this.STORAGE_KEY);
    let guias: Guia[] = [];
    if (guiasGuardadas) {
      guias = JSON.parse(guiasGuardadas);
      // Convertir las fechas de string a Date
      guias.forEach((guia: Guia) => {
        guia.fechaCreacion = new Date(guia.fechaCreacion);
      });
    }
    // Agregar guía de prueba ficticia siempre
    const guiaPrueba: Guia = {
      id: 'prueba-1',
      nombre: 'guia_ficticia.txt',
      fechaCreacion: new Date(),
      contenido: [
        '[1|A0000000123456789012345|Angus|M|24|Vivo]',
        '[2|A0000000987654321098765|Hereford|H|36|Vivo]',
        '[3|A0000000111122223333444|Braford|M|12|Muerto]',
        '[4|A0000000222233334444555|Brangus|H|18|Vivo]'
      ].join('\n'),
      tamano: 1234
    };
    // Evitar duplicados por id
    if (!guias.some(g => g.id === guiaPrueba.id)) {
      guias.unshift(guiaPrueba);
    }
    this.guiasSubject.next(guias);
  }

  private cargarGuiasExportadas() {
    const guiasExportadas = localStorage.getItem(this.EXPORTED_KEY);
    if (guiasExportadas) {
      const guias = JSON.parse(guiasExportadas);
      guias.forEach((guia: Guia) => {
        guia.fechaCreacion = new Date(guia.fechaCreacion);
      });
      this.guiasExportadasSubject.next(guias);
    }
  }

  private guardarGuias(guias: Guia[]) {
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(guias));
    this.guiasSubject.next(guias);
  }

  private guardarGuiasExportadas(guias: Guia[]) {
    localStorage.setItem(this.EXPORTED_KEY, JSON.stringify(guias));
    this.guiasExportadasSubject.next(guias);
  }

  agregarGuia(nombre: string, contenido: string, tamano: number): Guia {
    const nuevaGuia: Guia = {
      id: crypto.randomUUID(),
      nombre,
      contenido,
      fechaCreacion: new Date(),
      tamano
    };

    const guias = [...this.guiasSubject.value, nuevaGuia];
    this.guardarGuias(guias);
    return nuevaGuia;
  }

  exportarGuia(guia: Guia) {
    const guiasExportadas = [...this.guiasExportadasSubject.value];
    if (!guiasExportadas.some(g => g.id === guia.id)) {
      guiasExportadas.push({...guia, fechaCreacion: new Date()});
      this.guardarGuiasExportadas(guiasExportadas);
    }
  }

  eliminarGuia(id: string, esExportada: boolean = false) {
    if (esExportada) {
      const guias = this.guiasExportadasSubject.value.filter(g => g.id !== id);
      this.guardarGuiasExportadas(guias);
    } else {
      const guias = this.guiasSubject.value.filter(g => g.id !== id);
      this.guardarGuias(guias);
    }
  }

  obtenerGuia(id: string, esExportada: boolean = false): Guia | undefined {
    if (esExportada) {
      return this.guiasExportadasSubject.value.find(g => g.id === id);
    }
    return this.guiasSubject.value.find(g => g.id === id);
  }

  buscarGuias(termino: string, esExportada: boolean = false): Guia[] {
    const guias = esExportada ? this.guiasExportadasSubject.value : this.guiasSubject.value;
    if (!termino.trim()) return guias;
    
    termino = termino.toLowerCase();
    return guias.filter(guia => 
      guia.nombre.toLowerCase().includes(termino) ||
      guia.contenido.toLowerCase().includes(termino)
    );
  }
} 