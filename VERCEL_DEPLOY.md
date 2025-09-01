# Deploy en Vercel - TrazaNet Frontend

## Configuración Actual

Este proyecto está configurado para deploy en Vercel con las siguientes características:

### Archivos de Configuración

1. **vercel.json**: Configuración principal de Vercel
   - Build command: `npm run build:prod`
   - Output directory: `dist/traza-net/browser`
   - Routes configuradas para SPA

2. **environment.prod.ts**: Configuración de producción
   - **IMPORTANTE**: Cambiar la URL de la API por tu backend real

### Pasos para Deploy

1. **Configurar la URL del Backend**:
   - Editar `src/environments/environment.prod.ts`
   - Cambiar `apiUrl` por la URL real de tu backend

2. **Conectar con Vercel**:
   ```bash
   # Instalar Vercel CLI
   npm i -g vercel
   
   # Login en Vercel
   vercel login
   
   # Deploy
   vercel
   ```

3. **Variables de Entorno** (opcional):
   - En el dashboard de Vercel, agregar variables de entorno si es necesario

### Problemas Comunes

1. **Página en blanco**:
   - Verificar que la URL del backend sea correcta
   - Revisar la consola del navegador para errores
   - Verificar que el build se complete exitosamente

2. **Errores de CORS**:
   - Configurar CORS en el backend para permitir el dominio de Vercel

3. **Errores de build**:
   - Verificar que todas las dependencias estén instaladas
   - Revisar los logs de build en Vercel

### Estructura del Build

```
dist/traza-net/browser/
├── index.html
├── assets/
├── favicon.ico
└── ...
```

### Notas Importantes

- El proyecto usa Angular 19 con standalone components
- Las rutas están configuradas para SPA (Single Page Application)
- Los estilos se importan desde `styles.scss`
- El favicon debe estar en la raíz del build
