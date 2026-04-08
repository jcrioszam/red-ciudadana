import os

# Configuración de la aplicación
APP_TITLE = "Red Ciudadana API"
APP_DESCRIPTION = "Sistema de gestión para partido político"
APP_VERSION = "2.0.0"

# Rutas de archivos
LOGO_PATH = "static/logo.png"
UPLOAD_DIR = "uploads/images"

# Configuración de invitaciones
INVITATION_SECRET = os.getenv("INVITATION_SECRET", "invitation_secret_key_cambiar")
INVITATION_EXP_MINUTES = int(os.getenv("INVITATION_EXP_MINUTES", "60"))

# CORS
CORS_ORIGINS = [
 "https://red-ciudadana.vercel.app",
 "https://red-ciudadana-574v-iakbeuaab-juan-carlos-projects-ba06dd79.vercel.app",
 "http://localhost:3000",
 "http://localhost:3001",
 "*",
]
