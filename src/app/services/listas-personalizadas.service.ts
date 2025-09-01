import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { ListaPersonalizada } from '../interfaces/lista-personalizada.interface';

@Injectable({
  providedIn: 'root'
})
export class ListasPersonalizadasService {
  private readonly STORAGE_KEY = 'listas_personalizadas';
  private listasSubject = new BehaviorSubject<ListaPersonalizada[]>([]);
  listas$ = this.listasSubject.asObservable();

  constructor() {
    this.cargarListas();
  }

  private cargarListas() {
    const listasGuardadas = localStorage.getItem(this.STORAGE_KEY);
    if (listasGuardadas) {
      const listas = JSON.parse(listasGuardadas);
      // Convertir las fechas de string a Date
      listas.forEach((lista: ListaPersonalizada) => {
        lista.fechaCreacion = new Date(lista.fechaCreacion);
        lista.ultimaModificacion = new Date(lista.ultimaModificacion);
      });
      this.listasSubject.next(listas);
    }
  }

  private guardarListas(listas: ListaPersonalizada[]) {
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(listas));
    this.listasSubject.next(listas);
  }

  crearLista(nombre: string, tipo: 'animales' | 'campos'): ListaPersonalizada {
    const nuevaLista: ListaPersonalizada = {
      id: crypto.randomUUID(),
      nombre,
      tipo,
      fechaCreacion: new Date(),
      ultimaModificacion: new Date(),
      propietarios: {}
    };

    const listas = [...this.listasSubject.value, nuevaLista];
    this.guardarListas(listas);
    return nuevaLista;
  }

  actualizarLista(lista: ListaPersonalizada) {
    lista.ultimaModificacion = new Date();
    const listas = this.listasSubject.value.map(l => 
      l.id === lista.id ? lista : l
    );
    this.guardarListas(listas);
  }

  eliminarLista(id: string) {
    const listas = this.listasSubject.value.filter(l => l.id !== id);
    this.guardarListas(listas);
  }

  agregarAnimalALista(listaId: string, propietarioNumero: string, propietarioNombre: string, dispositivo: string) {
    const listas = [...this.listasSubject.value];
    const lista = listas.find(l => l.id === listaId);
    
    if (lista) {
      if (!lista.propietarios[propietarioNumero]) {
        lista.propietarios[propietarioNumero] = {
          nombre: propietarioNombre,
          animales: []
        };
      }
      
      if (!lista.propietarios[propietarioNumero].animales.includes(dispositivo)) {
        lista.propietarios[propietarioNumero].animales.push(dispositivo);
        lista.ultimaModificacion = new Date();
        this.guardarListas(listas);
      }
    }
  }

  eliminarAnimalDeLista(listaId: string, propietarioNumero: string, dispositivo: string) {
    const listas = [...this.listasSubject.value];
    const lista = listas.find(l => l.id === listaId);
    
    if (lista && lista.propietarios[propietarioNumero]) {
      lista.propietarios[propietarioNumero].animales = 
        lista.propietarios[propietarioNumero].animales.filter(d => d !== dispositivo);
      
      // Si el propietario ya no tiene animales, lo eliminamos de la lista
      if (lista.propietarios[propietarioNumero].animales.length === 0) {
        delete lista.propietarios[propietarioNumero];
      }
      
      lista.ultimaModificacion = new Date();
      this.guardarListas(listas);
    }
  }

  obtenerLista(id: string): ListaPersonalizada | undefined {
    return this.listasSubject.value.find(l => l.id === id);
  }
} 