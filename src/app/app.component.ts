import { Component, OnInit, ViewChild, ElementRef, AfterViewChecked, ViewEncapsulation, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { RouterOutlet, Router, RouterModule, NavigationEnd } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { filter } from 'rxjs/operators';
import { AuthService } from './services/auth.service';
import { ListasPersonalizadasService } from './services/listas-personalizadas.service';
import { ListaPersonalizada } from './interfaces/lista-personalizada.interface';
import { ChatService, ChatMessage } from './services/chat.service';
import * as XLSX from 'xlsx';
import { ThemeService } from './services/theme.service';
import * as L from 'leaflet';
import 'leaflet-draw';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    RouterOutlet,
    RouterModule,
    CommonModule,
    FormsModule
  ],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
  encapsulation: ViewEncapsulation.None,
  host: {
    '[class.auth-page]': 'isAuthPage'
  }
})
export class AppComponent implements OnInit, AfterViewChecked {
  title = 'trazaNet';
  showSidebar = false;
  isAuthPage = false;
  showingLists = false;
  showingGuias = false;
  showNewListInput = false;
  newListName = '';
  listas: ListaPersonalizada[] = [];
  listaSeleccionada: ListaPersonalizada | null = null;
  showConfirmDialog = false;
  confirmDialogMessage = '';
  confirmDialogAction: () => void = () => {};
  confirmDialogPosition = { x: 0, y: 0 };
  currentRoute = '';
  isExpanded: boolean = false;
  isDarkTheme = false;
  isChatExpanded = false;
  fabActive = false;
  showChatButton = false;
  showLocationPanel = false;
  showDrawControls = true;
  showPanelImage = false;
  showFloatingControls = true;
  showLocationPanelAnimation = false;
  typingMessage: string = '';
  hasAnimatedChatPanel: boolean = false;
  hasAnimatedLocationPanel: boolean = false;

  @ViewChild('chatMessages') private chatMessages!: ElementRef;
  @ViewChild('map') mapContainer?: ElementRef;
  private leafletMap?: L.Map;
  
  showChat = false;
  messages: ChatMessage[] = [];
  currentMessage = '';
  isProcessing = false;

  constructor(
    private router: Router,
    private authService: AuthService,
    private listasService: ListasPersonalizadasService,
    private chatService: ChatService,
    private themeService: ThemeService
  ) {
    // Verificar estado de autenticación al iniciar
    if (this.authService.isLoggedIn()) {
      console.log('AppComponent: Usuario autenticado al iniciar');
      this.isAuthPage = false;
      const currentUrl = this.router.url;
      if (currentUrl === '/' || currentUrl === '/login' || currentUrl === '/register') {
        this.router.navigate(['/inicio']);
      }
    } else {
      console.log('AppComponent: Usuario no autenticado al iniciar');
      this.isAuthPage = true;
      if (this.router.url !== '/login' && this.router.url !== '/register') {
        this.router.navigate(['/login']);
      }
    }

    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe((event: any) => {
      console.log('AppComponent: Navegación detectada:', event.url);
      this.currentRoute = event.url.split('/')[1] || 'inicio';
      this.isAuthPage = ['login', 'register'].includes(this.currentRoute);
      console.log('AppComponent: Ruta actual:', this.currentRoute);
      console.log('AppComponent: Es página de auth:', this.isAuthPage);
    });

    // Suscribirse a las listas
    this.listasService.listas$.subscribe(listas => {
      this.listas = listas;
    });

    // Cargar preferencia de tema
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme) {
      this.isDarkTheme = savedTheme === 'dark';
      this.applyTheme();
    }
  }

  ngOnInit() {
    // No necesitamos inicialización especial para el menú
    this.applyTheme();
  }

  ngAfterViewChecked() {
    this.scrollToBottom();
    this.applyTheme();
    
    // Check if map container exists and map needs to be reinitialized
    if (this.mapContainer && this.showLocationPanel && !this.leafletMap) {
      this.initMap();
    }
  }

  private scrollToBottom(): void {
    try {
      if (this.chatMessages) {
        this.chatMessages.nativeElement.scrollTop = this.chatMessages.nativeElement.scrollHeight;
      }
    } catch (err) {}
  }

  toggleSidebar() {
    this.showSidebar = !this.showSidebar;
  }

  toggleListasSection() {
    this.showingLists = !this.showingLists;
    if (!this.showingLists) {
      this.showNewListInput = false;
    }
  }

  toggleGuiasSection() {
    this.showingGuias = !this.showingGuias;
    if (this.showingGuias) {
      this.showingLists = false;
    }
  }

  navigateTo(route: string) {
    console.log('AppComponent: Navigating to:', route);
    // Clear old route variables
    this.showSidebar = false;
    this.showingLists = false;
    
    // Navigate to the new route
    const routePath = `/${route}`;
    console.log('AppComponent: Full route path:', routePath);
    this.router.navigate([routePath])
      .then(success => {
        console.log('AppComponent: Navigation result:', success ? 'SUCCESS' : 'FAILED');
      })
      .catch(err => {
        console.error('AppComponent: Navigation error:', err);
      });
  }

  logout() {
    this.authService.logout();
    this.router.navigate(['/login']);
  }

  crearLista() {
    if (this.newListName.trim()) {
      this.listasService.crearLista(this.newListName, 'animales');
      this.newListName = '';
      this.showNewListInput = false;
    }
  }

  getListaCount(lista: ListaPersonalizada): number {
    return Object.keys(lista.propietarios).length;
  }

  showConfirmation(message: string, action: () => void) {
    this.confirmDialogMessage = message;
    this.confirmDialogAction = action;
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
    event.stopPropagation(); // Evitar que el evento se propague
    this.showConfirmation(
      '¿Estás seguro de que deseas eliminar esta lista?',
      () => {
        this.listasService.eliminarLista(lista.id);
        this.showSidebar = false; // Cerrar el sidebar después de eliminar
      }
    );
  }

  mostrarDetallesLista(lista: ListaPersonalizada) {
    this.listaSeleccionada = lista;
  }

  cerrarDetallesLista() {
    this.listaSeleccionada = null;
  }

  getPropietariosLista(lista: ListaPersonalizada) {
    return Object.entries(lista.propietarios).map(([numero, datos]) => ({
      numero,
      nombre: datos.nombre,
      animales: datos.animales
    }));
  }

  exportarListaExcel(lista: ListaPersonalizada) {
    // Crear el workbook y la worksheet
    const wb = XLSX.utils.book_new();
    
    // Obtener todos los propietarios y sus animales
    const data = this.getPropietariosLista(lista).flatMap(propietario => 
      propietario.animales.map(dispositivo => ({
        dispositivo,
        propietario: propietario.numero,
        nombre: propietario.nombre
      }))
    );

    // Crear la worksheet
    const ws = XLSX.utils.json_to_sheet(data);

    // Agregar la worksheet al workbook
    XLSX.utils.book_append_sheet(wb, ws, 'Animales');

    // Generar el archivo y descargarlo
    const nombreArchivo = `${lista.nombre}_${new Date().toISOString().split('T')[0]}.xlsx`;
    XLSX.writeFile(wb, nombreArchivo);
  }

  toggleChat() {
    this.showChat = !this.showChat;
    
    if (this.showChat) {
      if (!this.hasAnimatedChatPanel) {
        this.hasAnimatedChatPanel = true;
        // Ocultar los controles flotantes durante la animación
        this.showFloatingControls = false;
        // Al abrir el chat, iniciar animación con fondo y gradiente
        this.showPanelImage = true;
        // Esperar 1.5 segundos y luego iniciar desvanecimiento
        setTimeout(() => {
          const chatContainer = document.querySelector('.chat-container') as HTMLElement;
          const chatHeader = document.querySelector('.chat-header') as HTMLElement;
          const chatMessages = document.querySelector('.chat-messages') as HTMLElement;
          const chatInput = document.querySelector('.chat-input') as HTMLElement;
          const panelImage = document.querySelector('.panel-image-animation') as HTMLElement;
          // Agregar clases para el desvanecimiento suave
          if (chatMessages) chatMessages.classList.add('fade-panel-image');
          if (panelImage) panelImage.classList.add('fade-out');
          // Esperar a que termine la animación de desvanecimiento (0.8s)
          // y luego quitar todas las clases
          setTimeout(() => {
            this.showPanelImage = false;
            // Eliminar todas las clases de transición
            if (chatMessages) chatMessages.classList.remove('fade-panel-image');
            if (panelImage) panelImage.classList.remove('fade-out');
            // Mostrar los controles flotantes después de que termine la animación
            this.showFloatingControls = true;
          }, 800);
        }, 1500);
      } else {
        // Si ya se animó, mostrar el panel directamente
        this.showPanelImage = false;
        this.showFloatingControls = true;
      }
    } else {
      this.showChatButton = false;
      this.showFloatingControls = true; // Reset para la próxima apertura
    }
  }

  async sendMessage() {
    if (!this.currentMessage.trim() || this.isProcessing) return;

    // Agregar mensaje del usuario
    const userMessage: ChatMessage = {
      role: 'user',
      content: this.currentMessage,
      timestamp: new Date()
    };
    this.messages.push(userMessage);

    const messageToSend = this.currentMessage;
    this.currentMessage = '';
    this.isProcessing = true;

    try {
      // Preparar el historial de mensajes para enviar al backend
      const messageHistory = this.messages.map(({ role, content }) => ({ role, content }));
      // Enviar mensaje al backend
      const response = await this.chatService.sendMessage(messageHistory).toPromise();
      if (response) {
        // Efecto máquina de escribir
        this.typingMessage = '';
        const fullText = response.content;
        for (let i = 0; i < fullText.length; i++) {
          this.typingMessage += fullText[i];
          await new Promise(res => setTimeout(res, 20));
        }
        this.messages.push({
          ...response,
          content: this.typingMessage,
          timestamp: new Date()
        });
        this.typingMessage = '';
      }
    } catch (error) {
      console.error('Error al procesar el mensaje:', error);
      this.messages.push({
        role: 'assistant',
        content: 'Lo siento, ha ocurrido un error al procesar tu mensaje.',
        timestamp: new Date()
      });
    } finally {
      this.isProcessing = false;
    }
  }

  handleMenuToggle() {
    this.isExpanded = !this.isExpanded;
  }

  toggleTheme() {
    this.isDarkTheme = !this.isDarkTheme;
    localStorage.setItem('theme', this.isDarkTheme ? 'dark' : 'light');
    this.applyTheme();
  }

  applyTheme() {
    if (this.isDarkTheme) {
      document.body.classList.add('dark-theme');
    } else {
      document.body.classList.remove('dark-theme');
    }
  }

  isAdmin(): boolean {
    return this.authService.isAdmin();
  }

  toggleChatSize() {
    this.isChatExpanded = !this.isChatExpanded;
  }

  toggleFab(event: Event) {
    event.preventDefault();
    this.fabActive = !this.fabActive;
  }

  onFabChat(event: Event) {
    event.preventDefault();
    this.showChatButton = true;
    this.fabActive = false;
    setTimeout(() => {
      this.toggleChat();
    }, 100); // Abre el chat automáticamente
  }

  onFabPhone(event: Event) {
    event.preventDefault();
    this.fabActive = false;
    // Aquí puedes implementar la acción de llamada
    alert('Funcionalidad de llamada próximamente');
  }

  toggleLocationPanel() {
    this.showLocationPanel = !this.showLocationPanel;
    this.fabActive = false;
    if (this.showLocationPanel) {
      if (!this.hasAnimatedLocationPanel) {
        this.hasAnimatedLocationPanel = true;
        this.showLocationPanelAnimation = true;
        setTimeout(() => {
          const locationContent = document.querySelector('.location-panel .location-content') as HTMLElement;
          const panelImage = document.querySelector('.location-panel .panel-image-animation') as HTMLElement;
          if (locationContent) locationContent.classList.add('fade-panel-image');
          if (panelImage) panelImage.classList.add('fade-out');
          setTimeout(() => {
            this.showLocationPanelAnimation = false;
            if (locationContent) locationContent.classList.remove('fade-panel-image');
            if (panelImage) panelImage.classList.remove('fade-out');
            setTimeout(() => this.initMap(), 100);
          }, 800);
        }, 1500);
      } else {
        this.showLocationPanelAnimation = false;
        setTimeout(() => this.initMap(), 100);
      }
    } else {
      this.destroyMap();
    }
  }

  private initMap() {
    if (!this.mapContainer || !this.mapContainer.nativeElement) {
      console.error('Map container not available');
      return;
    }
    
    // Destroy existing map if it exists
    if (this.leafletMap) {
      this.leafletMap.remove();
      this.leafletMap = undefined;
    }

    try {
      console.log('Initializing map...');
      
      // Create new map with improved options
      this.leafletMap = L.map(this.mapContainer.nativeElement, {
        center: [-34.9011, -56.1645], // Montevideo, Uruguay
        zoom: 12,
        zoomControl: true,
        attributionControl: false,
        scrollWheelZoom: true,
        doubleClickZoom: true,
        fadeAnimation: true,
        zoomAnimation: true,
        markerZoomAnimation: true
      });

      // Verificar que el mapa se creó correctamente
      if (this.leafletMap) {
        const map = this.leafletMap;
        
        // Definimos los tile layers
        const mainTileLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '',
          maxZoom: 19
        });
        
        // Ahora el tile layer satelital es el predeterminado
        const satelliteTileLayer = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
          attribution: '',
          maxZoom: 19
        }).addTo(map);
        
        // Creamos un control de capas
        const baseMaps = {
          "Satélite": satelliteTileLayer,
          "Mapa": mainTileLayer
        };
        
        // Pasamos un objeto vacío para overlayMaps en lugar de null
        L.control.layers(baseMaps, {}, {
          position: 'topright',
          collapsed: true
        }).addTo(map);
        
        // --- Leaflet Draw ---
        const drawnItems = new L.FeatureGroup();
        map.addLayer(drawnItems);
        const drawControl = new (L.Control as any).Draw({
          edit: {
            featureGroup: drawnItems,
            edit: {
              selectedPathOptions: {
                maintainColor: true,
                opacity: 0.3
              }
            }
          },
          draw: {
            polygon: {
              allowIntersection: false,
              showArea: true,
              drawError: {
                color: '#e1e100',
                message: '<strong>Error:</strong> ¡Los bordes no pueden cruzarse!'
              },
              shapeOptions: {
                color: '#28a745',
                fillColor: '#28a745',
                fillOpacity: 0.2
              },
              showLength: true,
              metric: true,
              feet: false,
              nautic: false,
              showTooltip: false
            },
            polyline: false,
            rectangle: false,
            circle: false,
            marker: false,
            circlemarker: false
          }
        });
        map.addControl(drawControl);
        
        // Eventos para manejar los estados de dibujo
        map.on(L.Draw.Event.CREATED, (event: any) => {
          const layer = event.layer;
          drawnItems.addLayer(layer);
          // Aquí puedes manejar el polígono dibujado, por ejemplo:
          if (event.layerType === 'polygon') {
            const latlngs = layer.getLatLngs();
            console.log('Polígono dibujado:', latlngs);
          }
        });
        
        // Monitorear cambios en las herramientas de dibujo
        map.on('draw:drawstart', () => {
          this.makeActionsCollapsible();
        });
        
        map.on('draw:editstart', () => {
          this.makeActionsCollapsible();
        });
        
        map.on('draw:deletestart', () => {
          this.makeActionsCollapsible();
        });
        
        // --- END Leaflet Draw ---
        
        // Añadir marcador en Montevideo
        const montevideoCoords: L.LatLngExpression = [-34.9011, -56.1645]; // Especificar como LatLngExpression
        
        // Force multiple resize calculations to ensure proper rendering
        setTimeout(() => {
          map.invalidateSize();
          
          // Try again after a longer delay for reliability
          setTimeout(() => {
            map.invalidateSize();
          }, 500);
        }, 200);
      }
    } catch (error) {
      console.error('Error initializing map:', error);
    }
  }

  /**
   * Hace que el panel de acciones de dibujo sea colapsable y solo expande el de la herramienta activa
   */
  private makeActionsCollapsible() {
    setTimeout(() => {
      // 1. Detectar el botón de herramienta activo
      const toolbar = document.querySelector('.location-panel .leaflet-draw-toolbar');
      if (!toolbar) return;
      const activeButton = toolbar.querySelector('.leaflet-draw-toolbar-button-enabled');

      // 2. Obtener todos los paneles de acciones
      const actionPanels = document.querySelectorAll('.location-panel .leaflet-draw-actions');
      actionPanels.forEach((panel) => {
        const panelEl = panel as HTMLElement;
        // Solo agregar el botón si no existe ya
        let toggleButton = panelEl.querySelector('.actions-toggle') as HTMLElement | null;
        if (!toggleButton) {
          // Crear botón de colapsar/expandir
          toggleButton = document.createElement('button');
          toggleButton.className = 'actions-toggle';
          toggleButton.innerHTML = '<i class="fas fa-chevron-left"></i>';
          toggleButton.title = 'Colapsar panel';

          // Agregar comportamiento de click
          toggleButton.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            if (panelEl.classList.contains('expanded')) {
              panelEl.classList.remove('expanded');
              panelEl.classList.add('collapsed');
              toggleButton!.innerHTML = '<i class="fas fa-chevron-right"></i>';
              toggleButton!.title = 'Expandir panel';
            } else {
              panelEl.classList.remove('collapsed');
              panelEl.classList.add('expanded');
              toggleButton!.innerHTML = '<i class="fas fa-chevron-left"></i>';
              toggleButton!.title = 'Colapsar panel';
            }
          });
          // Insertar el botón al principio del panel
          panelEl.insertBefore(toggleButton, panelEl.firstChild);
        }
        // Asegurarse de que el panel sea colapsable
        panelEl.classList.add('expandable-actions');
      });

      // 3. Colapsar todos los paneles excepto el de la herramienta activa
      if (activeButton) {
        // Buscar el panel de acciones correspondiente al botón activo
        // El panel de acciones suele estar justo después del botón en el DOM
        actionPanels.forEach((panel) => {
          const panelEl = panel as HTMLElement;
          // Buscar el botón anterior a este panel
          let isForActive = false;
          let prev = panelEl.previousElementSibling;
          while (prev) {
            if (prev === activeButton) {
              isForActive = true;
              break;
            }
            // Si hay otro panel de acciones antes, paramos
            if (prev.classList.contains('leaflet-draw-actions')) break;
            prev = prev.previousElementSibling;
          }
          if (isForActive) {
            panelEl.classList.add('expanded');
            panelEl.classList.remove('collapsed');
            const btn = panelEl.querySelector('.actions-toggle');
            if (btn) {
              btn.innerHTML = '<i class="fas fa-chevron-left"></i>';
              btn.setAttribute('title', 'Colapsar panel');
            }
          } else {
            panelEl.classList.remove('expanded');
            panelEl.classList.add('collapsed');
            const btn = panelEl.querySelector('.actions-toggle');
            if (btn) {
              btn.innerHTML = '<i class="fas fa-chevron-right"></i>';
              btn.setAttribute('title', 'Expandir panel');
            }
          }
        });
      }
    }, 100);
  }

  private destroyMap() {
    if (this.leafletMap) {
      console.log('Destroying map...');
      this.leafletMap.remove();
      this.leafletMap = undefined;
    }
  }

  onFabLocation(event: Event) {
    event.preventDefault();
    this.fabActive = false;
    
    // Toggle del panel de ubicación (si está abierto, lo cierra; si está cerrado, lo abre)
    this.toggleLocationPanel();
  }

  toggleDrawControls() {
    this.showDrawControls = !this.showDrawControls;
    const drawControlsElement = document.querySelector('.location-panel .leaflet-draw');
    
    if (drawControlsElement) {
      if (this.showDrawControls) {
        drawControlsElement.classList.remove('hidden-draw-controls');
      } else {
        drawControlsElement.classList.add('hidden-draw-controls');
      }
    }
  }
}
