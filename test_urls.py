import requests

# Probar diferentes URLs del backend
urls_to_test = [
    "https://red-ciudadana-production.up.railway.app",
    "https://red-ciudadana-production.up.railway.app/api",
    "https://red-ciudadana-production.up.railway.app/health",
    "https://red-ciudadana-production.up.railway.app/docs"
]

print("🔍 Probando URLs del backend...")
print("=" * 50)

for url in urls_to_test:
    try:
        response = requests.get(url, timeout=10)
        print(f"✅ {url} - Status: {response.status_code}")
        if response.status_code == 200:
            print(f"   Content-Type: {response.headers.get('content-type', 'N/A')}")
            if 'json' in response.headers.get('content-type', ''):
                try:
                    data = response.json()
                    print(f"   Response: {str(data)[:100]}...")
                except:
                    print(f"   Response: {response.text[:100]}...")
    except Exception as e:
        print(f"❌ {url} - Error: {str(e)}")

print("\n🔍 Probando endpoints de autenticación...")
print("=" * 50)

auth_urls = [
    "https://red-ciudadana-production.up.railway.app/auth/login",
    "https://red-ciudadana-production.up.railway.app/api/auth/login",
    "https://red-ciudadana-production.up.railway.app/login"
]

for url in auth_urls:
    try:
        # Probar con POST
        response = requests.post(url, json={"username": "test", "password": "test"}, timeout=10)
        print(f"📤 {url} - Status: {response.status_code}")
        if response.status_code != 404:
            print(f"   Response: {response.text[:100]}...")
    except Exception as e:
        print(f"❌ {url} - Error: {str(e)}")
