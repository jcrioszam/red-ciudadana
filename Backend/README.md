# Red Ciudadana - Backend API

Sistema de gestión integral para partido político con jerarquía de líderes, registro de afiliados/simpatizantes y movilización de eventos.

## Características

- ✅ Autenticación JWT con roles jerárquicos
- ✅ Gestión de usuarios (líderes y capturistas)
- ✅ Registro de personas (afiliados/simpatizantes)
- ✅ Gestión de eventos y asistencias
- ✅ Georreferenciación por sección electoral
- ✅ API RESTful con FastAPI
- ✅ Base de datos SQLite

## Instalación

1. **Instalar dependencias:**
```bash
pip install -r requirements.txt
```

2. **Ejecutar la aplicación:**
```bash
python run.py
```

3. **Acceder a la documentación:**
- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

## Estructura del Proyecto

```
Backend/
├── app/
│   ├── __init__.py
│   ├── main.py          # Aplicación principal
│   ├── database.py      # Configuración de BD
│   ├── models.py        # Modelos SQLAlchemy
│   ├── schemas.py       # Esquemas Pydantic
│   └── auth.py          # Autenticación JWT
├── schema.sql           # Esquema SQL
├── requirements.txt     # Dependencias
├── run.py              # Script de ejecución
└── README.md           # Documentación
```

## Roles del Sistema

- **admin**: Acceso completo al sistema
- **lider_estatal**: Coordinador estatal
- **lider_regional**: Coordinador regional/distrital
- **lider_municipal**: Coordinador municipal
- **lider_zona**: Líder de zona/colonia
- **capturista**: Solo puede registrar personas

## Endpoints Principales

### Autenticación
- `POST /token` - Login
- `GET /users/me/` - Información del usuario actual

### Usuarios
- `POST /users/` - Crear usuario
- `GET /users/` - Listar usuarios (según jerarquía)
- `PUT /users/{id}` - Actualizar usuario
- `DELETE /users/{id}` - Desactivar usuario

### Personas
- `POST /personas/` - Registrar persona
- `GET /personas/` - Listar personas
- `PUT /personas/{id}` - Actualizar persona
- `GET /personas/reportes` - Reportes de personas

### Eventos
- `POST /eventos/` - Crear evento
- `GET /eventos/` - Listar eventos
- `PUT /eventos/{id}` - Actualizar evento
- `POST /eventos/{id}/asistencias` - Registrar asistencias

## Base de Datos

El sistema utiliza SQLite con las siguientes tablas principales:

- **usuarios**: Líderes y capturistas
- **personas**: Afiliados y simpatizantes
- **eventos**: Eventos políticos
- **asistencias**: Seguimiento de participación
- **secciones_electorales**: Validación de secciones
- **colonias**: Validación de colonias

## Seguridad

- Contraseñas hasheadas con bcrypt
- Tokens JWT para autenticación
- Verificación de jerarquía de usuarios
- Validación de roles por endpoint

## Próximos Pasos

1. Implementar endpoints completos para CRUD
2. Agregar validación de datos de INE
3. Integrar con APIs de mapas
4. Implementar reportes y exportación
5. Agregar tests unitarios "# Force Railway redeploy $(Get-Date)" 
