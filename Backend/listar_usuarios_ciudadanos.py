#!/usr/bin/env python3
"""
Script para listar todos los usuarios con rol ciudadano
"""

import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.database import SessionLocal
from app.models import Usuario

def listar_usuarios_ciudadanos():
    print("🔍 Listando usuarios con rol 'ciudadano'...")
    
    db = SessionLocal()
    try:
        # Buscar todos los usuarios con rol ciudadano
        usuarios = db.query(Usuario).filter(Usuario.rol == 'ciudadano').all()
        
        if not usuarios:
            print("❌ No se encontraron usuarios con rol 'ciudadano'")
            return
        
        print(f"✅ Se encontraron {len(usuarios)} usuarios ciudadanos:")
        print()
        
        for i, usuario in enumerate(usuarios, 1):
            print(f"{i}. ID: {usuario.id}")
            print(f"   Nombre: {usuario.nombre}")
            print(f"   Email: {usuario.email}")
            print(f"   Rol: {usuario.rol}")
            print(f"   Activo: {usuario.activo}")
            print(f"   Fecha registro: {usuario.fecha_registro}")
            print()
        
        # Mostrar el primer usuario como ejemplo para el script de prueba
        if usuarios:
            primer_usuario = usuarios[0]
            print("📝 Para usar en el script de prueba, actualiza estas credenciales:")
            print(f"   CIUDADANO_EMAIL = '{primer_usuario.email}'")
            print(f"   CIUDADANO_PASSWORD = 'password123'  # O la contraseña real")
            print()
            print("⚠️  Nota: Si no conoces la contraseña, puedes resetearla en la base de datos")
            
    except Exception as e:
        print(f"❌ Error consultando la base de datos: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    listar_usuarios_ciudadanos() 