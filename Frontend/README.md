# Red Ciudadana - Frontend

Interfaz de usuario moderna para el sistema de gestión de partido político, construida con React y Tailwind CSS.

## Características

- ✅ Interfaz moderna y responsive
- ✅ Autenticación JWT
- ✅ Dashboard con estadísticas
- ✅ Navegación por roles
- ✅ Diseño con Tailwind CSS
- ✅ Iconos con React Icons
- ✅ Notificaciones con React Hot Toast

## Instalación

1. **Instalar dependencias:**
```bash
npm install
```

2. **Ejecutar en desarrollo:**
```bash
npm start
```

3. **Construir para producción:**
```bash
npm run build
```

## Estructura del Proyecto

```
Frontend/
├── public/
│   └── index.html
├── src/
│   ├── components/
│   │   └── Layout.js
│   ├── contexts/
│   │   └── AuthContext.js
│   ├── pages/
│   │   ├── Login.js
│   │   ├── Dashboard.js
│   │   ├── Usuarios.js
│   │   ├── Personas.js
│   │   ├── Eventos.js
│   │   └── Reportes.js
│   ├── App.js
│   ├── index.js
│   └── index.css
├── package.json
├── tailwind.config.js
└── README.md
```

## Tecnologías Utilizadas

- **React 18**: Biblioteca de interfaz de usuario
- **React Router**: Navegación entre páginas
- **React Query**: Manejo de estado del servidor
- **Tailwind CSS**: Framework de estilos
- **React Icons**: Iconografía
- **React Hot Toast**: Notificaciones
- **Axios**: Cliente HTTP

## Páginas Principales

### Login
- Formulario de autenticación
- Validación de credenciales
- Manejo de errores

### Dashboard
- Estadísticas generales
- Actividad reciente
- Acciones rápidas
- Gráficos (pendiente)

### Usuarios
- Lista de líderes y capturistas
- Gestión de jerarquías
- Crear/editar usuarios

### Personas
- Registro de afiliados/simpatizantes
- Captura de datos de INE
- Georreferenciación
- Validación de datos

### Eventos
- Creación de eventos
- Gestión de asistencias
- Seguimiento de movilización

### Reportes
- Estadísticas por zona
- Mapas de calor
- Exportación de datos

## Roles y Permisos

- **Admin**: Acceso completo
- **Líder Estatal**: Gestión estatal
- **Líder Regional**: Gestión regional
- **Líder Municipal**: Gestión municipal
- **Líder de Zona**: Gestión de zona
- **Capturista**: Solo registro de personas

## Configuración

### Variables de Entorno
Crear archivo `.env`:
```
REACT_APP_API_URL=http://localhost:8000
```

### Proxy
El proyecto está configurado para hacer proxy a `http://localhost:8000` (backend).

## Próximos Pasos

1. Implementar páginas faltantes (Usuarios, Personas, Eventos, Reportes)
2. Integrar mapas con Leaflet
3. Agregar gráficos con Recharts
4. Implementar exportación de datos
5. Agregar validación de formularios
6. Implementar subida de archivos 