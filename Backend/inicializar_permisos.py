#!/usr/bin/env python3
"""
🆕 SCRIPT DE INICIALIZACIÓN DE PERMISOS
========================================

Este script crea las tablas de permisos y los permisos por defecto del sistema.
Incluye el permiso 'admin-database' que es necesario para que aparezca en el menú.

Uso:
    python inicializar_permisos.py
"""

import sys
import os
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker
from sqlalchemy.exc import SQLAlchemyError

# Agregar el directorio app al path
sys.path.append(os.path.join(os.path.dirname(__file__), 'app'))

from app.database import Base, engine
from app.models import Permiso, PerfilPermiso, ConfiguracionPerfil

# 🆕 PERMISOS POR DEFECTO DEL SISTEMA
PERMISOS_POR_DEFECTO = [
    {"codigo": "usuarios", "nombre": "Gestión de Usuarios", "categoria": "admin", "descripcion": "Crear, editar y eliminar usuarios del sistema"},
    {"codigo": "personas", "nombre": "Gestión de Personas", "categoria": "usuarios", "descripcion": "Registrar y gestionar personas en la base de datos"},
    {"codigo": "eventos", "nombre": "Gestión de Eventos", "categoria": "eventos", "descripcion": "Crear y organizar eventos"},
    {"codigo": "eventos-historicos", "nombre": "Eventos Históricos", "categoria": "eventos", "descripcion": "Ver y gestionar eventos pasados"},
    {"codigo": "movilizacion", "nombre": "Gestión de Movilización", "categoria": "movilizacion", "descripcion": "Gestionar vehículos y movilización"},
    {"codigo": "reportes", "nombre": "Generación de Reportes", "categoria": "reportes", "descripcion": "Crear y exportar reportes del sistema"},
    {"codigo": "estructura-red", "nombre": "Estructura de Red", "categoria": "estructura", "descripcion": "Gestionar la estructura jerárquica de la red"},
    {"codigo": "checkin", "nombre": "Sistema de Check-in", "categoria": "eventos", "descripcion": "Gestionar asistencia a eventos"},
    {"codigo": "seguimiento", "nombre": "Seguimiento en Tiempo Real", "categoria": "seguimiento", "descripcion": "Monitorear ubicaciones y movimientos"},
    {"codigo": "noticias", "nombre": "Gestión de Noticias", "categoria": "contenido", "descripcion": "Publicar y gestionar noticias"},
    {"codigo": "reportes-ciudadanos", "nombre": "Reportes Ciudadanos", "categoria": "reportes", "descripcion": "Gestionar reportes de ciudadanos"},
    {"codigo": "mapa-reportes", "nombre": "Mapa de Reportes", "categoria": "reportes", "descripcion": "Visualizar reportes en mapa"},
    {"codigo": "seguimiento-reportes", "nombre": "Seguimiento de Reportes", "categoria": "reportes", "descripcion": "Dar seguimiento a reportes ciudadanos"},
    {"codigo": "perfil", "nombre": "Gestión de Perfil", "categoria": "usuarios", "descripcion": "Editar perfil personal"},
    {"codigo": "admin-perfiles", "nombre": "Administración de Perfiles", "categoria": "admin", "descripcion": "Configurar permisos y roles de usuarios"},
    {"codigo": "admin-dashboard", "nombre": "Administración del Dashboard", "categoria": "admin", "descripcion": "Configurar widgets y layout del dashboard"},
    {"codigo": "admin-database", "nombre": "Administración de Base de Datos", "categoria": "admin", "descripcion": "Acceso completo a la administración de la base de datos"}
]

def crear_tablas():
    """Crear las tablas de permisos si no existen"""
    try:
        print("🗄️ Creando tablas de permisos...")
        Base.metadata.create_all(bind=engine, tables=[Permiso.__table__, PerfilPermiso.__table__])
        print("✅ Tablas creadas exitosamente")
        return True
    except SQLAlchemyError as e:
        print(f"❌ Error al crear tablas: {e}")
        return False

def insertar_permisos():
    """Insertar todos los permisos por defecto"""
    try:
        SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
        db = SessionLocal()
        
        print("📝 Insertando permisos por defecto...")
        
        for permiso_data in PERMISOS_POR_DEFECTO:
            # Verificar si el permiso ya existe
            permiso_existente = db.query(Permiso).filter(Permiso.codigo == permiso_data["codigo"]).first()
            
            if not permiso_existente:
                nuevo_permiso = Permiso(**permiso_data)
                db.add(nuevo_permiso)
                print(f"  ➕ Permiso '{permiso_data['codigo']}' agregado")
            else:
                print(f"  ✅ Permiso '{permiso_data['codigo']}' ya existe")
        
        db.commit()
        print("✅ Permisos insertados exitosamente")
        db.close()
        return True
        
    except SQLAlchemyError as e:
        print(f"❌ Error al insertar permisos: {e}")
        if 'db' in locals():
            db.rollback()
            db.close()
        return False

def configurar_perfil_admin():
    """Configurar el perfil del administrador con todos los permisos"""
    try:
        SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
        db = SessionLocal()
        
        print("👑 Configurando perfil del administrador...")
        
        # Buscar el perfil del administrador
        perfil_admin = db.query(ConfiguracionPerfil).filter(ConfiguracionPerfil.rol == "admin").first()
        
        if not perfil_admin:
            print("⚠️ Perfil 'admin' no encontrado, creando...")
            perfil_admin = ConfiguracionPerfil(
                rol="admin",
                opciones_web="[]",
                opciones_app="[]"
            )
            db.add(perfil_admin)
            db.commit()
            db.refresh(perfil_admin)
        
        # Obtener todos los permisos
        todos_permisos = db.query(Permiso).filter(Permiso.activo == True).all()
        
        # Configurar permisos para el admin
        for permiso in todos_permisos:
            # Verificar si ya existe la relación
            perfil_permiso = db.query(PerfilPermiso).filter(
                PerfilPermiso.id_perfil == perfil_admin.id,
                PerfilPermiso.id_permiso == permiso.id
            ).first()
            
            if not perfil_permiso:
                nuevo_perfil_permiso = PerfilPermiso(
                    id_perfil=perfil_admin.id,
                    id_permiso=permiso.id,
                    habilitado=True  # Admin tiene todos los permisos habilitados
                )
                db.add(nuevo_perfil_permiso)
                print(f"  🔓 Permiso '{permiso.codigo}' habilitado para admin")
        
        db.commit()
        print("✅ Perfil del administrador configurado exitosamente")
        db.close()
        return True
        
    except SQLAlchemyError as e:
        print(f"❌ Error al configurar perfil admin: {e}")
        if 'db' in locals():
            db.rollback()
            db.close()
        return False

def verificar_permisos():
    """Verificar que los permisos se crearon correctamente"""
    try:
        SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
        db = SessionLocal()
        
        print("🔍 Verificando permisos creados...")
        
        total_permisos = db.query(Permiso).count()
        print(f"  📊 Total de permisos: {total_permisos}")
        
        permisos_admin = db.query(Permiso).filter(Permiso.categoria == "admin").all()
        print(f"  👑 Permisos de admin: {len(permisos_admin)}")
        
        for permiso in permisos_admin:
            print(f"    • {permiso.codigo}: {permiso.nombre}")
        
        # Verificar específicamente admin-database
        admin_db = db.query(Permiso).filter(Permiso.codigo == "admin-database").first()
        if admin_db:
            print(f"  ✅ Permiso 'admin-database' encontrado: {admin_db.nombre}")
        else:
            print(f"  ❌ Permiso 'admin-database' NO encontrado")
        
        db.close()
        return True
        
    except SQLAlchemyError as e:
        print(f"❌ Error al verificar permisos: {e}")
        if 'db' in locals():
            db.close()
        return False

def main():
    """Función principal del script"""
    print("🚀 INICIALIZANDO SISTEMA DE PERMISOS")
    print("=" * 50)
    
    # Paso 1: Crear tablas
    if not crear_tablas():
        print("❌ Falló la creación de tablas")
        return False
    
    # Paso 2: Insertar permisos
    if not insertar_permisos():
        print("❌ Falló la inserción de permisos")
        return False
    
    # Paso 3: Configurar perfil admin
    if not configurar_perfil_admin():
        print("❌ Falló la configuración del perfil admin")
        return False
    
    # Paso 4: Verificar
    if not verificar_permisos():
        print("❌ Falló la verificación")
        return False
    
    print("=" * 50)
    print("🎉 SISTEMA DE PERMISOS INICIALIZADO EXITOSAMENTE")
    print("📱 Ahora ve a 'Administrar Perfiles' y busca 'Administración BD'")
    print("🔓 Habilítalo para el perfil 'Administrador'")
    
    return True

if __name__ == "__main__":
    main()
