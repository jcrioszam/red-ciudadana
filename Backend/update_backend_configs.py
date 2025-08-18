#!/usr/bin/env python3
"""
Script para actualizar las configuraciones por defecto del backend
"""
import re

def update_backend_configs():
    file_path = "app/main.py"
    
    try:
        with open(file_path, 'r', encoding='utf-8') as file:
            content = file.read()
        
        # Actualizar la primera configuración por defecto (función obtener_configuracion_perfil)
        pattern1 = r'("capturista": \{[^}]*\})\s*\}\s*return'
        replacement1 = '''"capturista": {
            "opciones_web": ["dashboard", "personas", "eventos", "checkin", "perfil", "noticias"],
            "opciones_app": ["dashboard", "register", "pase-lista", "perfil", "noticias"]
        },
        "ciudadano": {
            "opciones_web": ["dashboard", "noticias", "reportes_ciudadanos", "perfil"],
            "opciones_app": ["dashboard", "noticias", "reportes_ciudadanos", "perfil"]
        }
    }
    
    return'''
        
        content = re.sub(pattern1, replacement1, content, flags=re.DOTALL)
        
        # Actualizar la segunda configuración por defecto (función obtener_mi_configuracion)
        pattern2 = r'("capturista": \{[^}]*\})\s*\}\s*return'
        replacement2 = '''"capturista": {
            "opciones_web": ["dashboard", "personas", "eventos", "checkin", "perfil", "noticias"],
            "opciones_app": ["dashboard", "register", "pase-lista", "perfil", "noticias"]
        },
        "ciudadano": {
            "opciones_web": ["dashboard", "noticias", "reportes_ciudadanos", "perfil"],
            "opciones_app": ["dashboard", "noticias", "reportes_ciudadanos", "perfil"]
        }
    }
    
    return'''
        
        content = re.sub(pattern2, replacement2, content, flags=re.DOTALL)
        
        with open(file_path, 'w', encoding='utf-8') as file:
            file.write(content)
        
        print("✅ Configuraciones por defecto actualizadas exitosamente")
        return True
        
    except Exception as e:
        print(f"❌ Error al actualizar configuraciones: {e}")
        return False

if __name__ == "__main__":
    print("🚀 Actualizando configuraciones por defecto del backend...")
    success = update_backend_configs()
    
    if success:
        print("\n🎉 Configuraciones actualizadas exitosamente!")
    else:
        print("\n💥 Error en la actualización!") 