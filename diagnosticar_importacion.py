import requests
import json

# Configuración
API_BASE = "https://red-ciudadana-production.up.railway.app"
USERNAME = "admin@redciudadana.com"
PASSWORD = "admin123"

def login():
    """Iniciar sesión y obtener token"""
    print("🔐 Iniciando sesión...")
    
    login_data = {
        "identificador": USERNAME,
        "password": PASSWORD
    }
    
    response = requests.post(f"{API_BASE}/login", json=login_data)
    
    if response.status_code == 200:
        data = response.json()
        token = data.get("access_token")
        print("✅ Login exitoso")
        return token
    else:
        print(f"❌ Error en login: {response.status_code} - {response.text}")
        return None

def test_confirmar_importacion():
    """Probar el endpoint de confirmar importación con datos de prueba"""
    print("\n🧪 Probando endpoint de confirmar importación...")
    
    token = login()
    if not token:
        return
    
    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json"
    }
    
    # Datos de prueba con nombres correctos de campos
    datos_prueba = [
        {
            "consecutivo": 1,
            "cedula": "12345678",
            "nombre": "Juan",
            "apellido_paterno": "Pérez",
            "apellido_materno": "García",
            "fecha_nacimiento": "1990-01-01",
            "sexo": "M",
            "estado": "Sonora",
            "municipio": "Hermosillo",
            "seccion": "001",
            "localidad": "Centro",
            "casilla": "A",
            "tipo_casilla": "Básica",
            "domicilio": "Calle Principal 123",
            "colonia": "Centro",
            "codigo_postal": "83000",
            "telefono": "6621234567",
            "email": "juan@email.com"
        }
    ]
    
    print(f"📤 Enviando {len(datos_prueba)} registros de prueba...")
    
    try:
        response = requests.post(
            f"{API_BASE}/api/padron/confirmar-importacion",
            headers=headers,
            json=datos_prueba,
            timeout=30
        )
        
        print(f"📊 Status Code: {response.status_code}")
        print(f"📝 Response: {response.text}")
        
        if response.status_code == 200:
            data = response.json()
            print(f"✅ Respuesta exitosa: {data}")
        else:
            print(f"❌ Error: {response.status_code} - {response.text}")
            
    except Exception as e:
        print(f"❌ Error en la petición: {str(e)}")

def verificar_tabla_padron():
    """Verificar si la tabla PadronElectoral existe y tiene datos"""
    print("\n🔍 Verificando tabla PadronElectoral...")
    
    token = login()
    if not token:
        return
    
    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json"
    }
    
    try:
        # Intentar obtener estadísticas del padrón
        response = requests.get(
            f"{API_BASE}/api/padron/estadisticas",
            headers=headers,
            timeout=30
        )
        
        print(f"📊 Status Code: {response.status_code}")
        print(f"📝 Response: {response.text}")
        
        if response.status_code == 200:
            data = response.json()
            print(f"✅ Estadísticas: {data}")
        else:
            print(f"❌ Error obteniendo estadísticas: {response.status_code} - {response.text}")
            
    except Exception as e:
        print(f"❌ Error verificando tabla: {str(e)}")

if __name__ == "__main__":
    print("🔍 DIAGNÓSTICO DE IMPORTACIÓN")
    print("=" * 50)
    
    # Probar endpoint de confirmar importación
    test_confirmar_importacion()
    
    # Verificar tabla
    verificar_tabla_padron()
    
    print("\n✅ Diagnóstico completado")
