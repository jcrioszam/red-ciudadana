"""
Script para crear usuario administrador inicial en PostgreSQL
"""
import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.models import Usuario as UsuarioModel
from app.auth import get_password_hash

def create_admin_user():
    """Crear usuario administrador inicial"""
    
    # Conexión a PostgreSQL
    postgres_url = os.getenv("DATABASE_URL")
    if postgres_url and postgres_url.startswith("postgres://"):
        postgres_url = postgres_url.replace("postgres://", "postgresql://", 1)
    elif not postgres_url:
        # Fallback para desarrollo local
        postgres_url = "sqlite:///./red_ciudadana.db"
    
    engine = create_engine(postgres_url)
    SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    
    db = SessionLocal()
    
    try:
        # Verificar si ya existe un admin
        existing_admin = db.query(UsuarioModel).filter(UsuarioModel.rol == "admin").first()
        if existing_admin:
            print(f"Ya existe usuario admin: {existing_admin.email}")
            return existing_admin
        
        # Crear usuario administrador
        admin_password = "admin123"  # Cambiar en producción
        hashed_password = get_password_hash(admin_password)
        
        admin_user = UsuarioModel(
            nombre="Administrador",
            telefono="1234567890",
            direccion="Oficina Central",
            edad=35,
            sexo="M",
            email="admin@redciudadana.com",
            hashed_password=hashed_password,
            rol="admin",
            activo=True,
            id_lider_superior=None
        )
        
        db.add(admin_user)
        db.commit()
        db.refresh(admin_user)
        
        print("✅ Usuario administrador creado:")
        print(f"📧 Email: admin@redciudadana.com")
        print(f"🔑 Password: admin123")
        print(f"👤 Rol: admin")
        print(f"🆔 ID: {admin_user.id}")
        
        # Crear usuario líder de prueba
        lider_password = "lider123"
        hashed_lider_password = get_password_hash(lider_password)
        
        lider_user = UsuarioModel(
            nombre="Juan Pérez",
            telefono="0987654321",
            direccion="Zona Centro",
            edad=45,
            sexo="M",
            email="lider@redciudadana.com",
            hashed_password=hashed_lider_password,
            rol="lider",
            activo=True,
            id_lider_superior=admin_user.id
        )
        
        db.add(lider_user)
        db.commit()
        db.refresh(lider_user)
        
        print("\n✅ Usuario líder creado:")
        print(f"📧 Email: lider@redciudadana.com")
        print(f"🔑 Password: lider123")
        print(f"👤 Rol: lider")
        print(f"🆔 ID: {lider_user.id}")
        
        return admin_user
        
    except Exception as e:
        print(f"❌ Error creando usuario admin: {e}")
        db.rollback()
        return None
    finally:
        db.close()

if __name__ == "__main__":
    create_admin_user()
