from sqlalchemy.orm import Session
from sqlalchemy import desc, and_, or_
from typing import List, Optional
from datetime import datetime, timedelta
from .models_noticias import Noticia
from .schemas_noticias import NoticiaCreate, NoticiaUpdate

class CRUDNoticias:
    """Operaciones CRUD para gestión de noticias"""
    
    def get_noticia(self, db: Session, noticia_id: int) -> Optional[Noticia]:
        """Obtener una noticia por ID"""
        return db.query(Noticia).filter(Noticia.id == noticia_id).first()
    
    def get_noticias(
        self, 
        db: Session, 
        skip: int = 0, 
        limit: int = 100,
        activas_only: bool = True,
        categoria: Optional[str] = None,
        destacadas: Optional[bool] = None
    ) -> List[Noticia]:
        """Obtener lista de noticias con filtros"""
        query = db.query(Noticia)
        
        if activas_only:
            query = query.filter(Noticia.activa == True)
        
        if categoria:
            query = query.filter(Noticia.categoria == categoria)
        
        if destacadas is not None:
            query = query.filter(Noticia.destacada == destacadas)
        
        # Ordenar por prioridad y fecha de publicación
        query = query.order_by(
            desc(Noticia.prioridad),
            desc(Noticia.fecha_publicacion),
            desc(Noticia.fecha_creacion)
        )
        
        return query.offset(skip).limit(limit).all()
    
    def get_noticias_banner(
        self, 
        db: Session, 
        limit: int = 5
    ) -> List[Noticia]:
        """Obtener noticias para el banner principal"""
        now = datetime.utcnow()
        
        return db.query(Noticia).filter(
            and_(
                Noticia.activa == True,
                or_(
                    Noticia.fecha_publicacion.is_(None),
                    Noticia.fecha_publicacion <= now
                ),
                or_(
                    Noticia.fecha_expiracion.is_(None),
                    Noticia.fecha_expiracion > now
                )
            )
        ).order_by(
            desc(Noticia.destacada),
            desc(Noticia.prioridad),
            desc(Noticia.fecha_publicacion),
            desc(Noticia.fecha_creacion)
        ).limit(limit).all()
    
    def create_noticia(
        self, 
        db: Session, 
        noticia: NoticiaCreate,
        autor_id: Optional[int] = None
    ) -> Noticia:
        """Crear una nueva noticia"""
        db_noticia = Noticia(
            **noticia.dict(),
            autor_id=autor_id
        )
        db.add(db_noticia)
        db.commit()
        db.refresh(db_noticia)
        return db_noticia
    
    def update_noticia(
        self, 
        db: Session, 
        noticia_id: int, 
        noticia_update: NoticiaUpdate
    ) -> Optional[Noticia]:
        """Actualizar una noticia existente"""
        db_noticia = self.get_noticia(db, noticia_id)
        if not db_noticia:
            return None
        
        update_data = noticia_update.dict(exclude_unset=True)
        for field, value in update_data.items():
            setattr(db_noticia, field, value)
        
        db_noticia.fecha_modificacion = datetime.utcnow()
        db.commit()
        db.refresh(db_noticia)
        return db_noticia
    
    def delete_noticia(self, db: Session, noticia_id: int) -> bool:
        """Eliminar una noticia (soft delete)"""
        db_noticia = self.get_noticia(db, noticia_id)
        if not db_noticia:
            return False
        
        db_noticia.activa = False
        db_noticia.fecha_modificacion = datetime.utcnow()
        db.commit()
        return True
    
    def hard_delete_noticia(self, db: Session, noticia_id: int) -> bool:
        """Eliminación física de una noticia"""
        db_noticia = self.get_noticia(db, noticia_id)
        if not db_noticia:
            return False
        
        db.delete(db_noticia)
        db.commit()
        return True
    
    def toggle_noticia_activa(self, db: Session, noticia_id: int) -> Optional[Noticia]:
        """Activar/desactivar una noticia"""
        db_noticia = self.get_noticia(db, noticia_id)
        if not db_noticia:
            return None
        
        db_noticia.activa = not db_noticia.activa
        db_noticia.fecha_modificacion = datetime.utcnow()
        db.commit()
        db.refresh(db_noticia)
        return db_noticia
    
    def toggle_noticia_destacada(self, db: Session, noticia_id: int) -> Optional[Noticia]:
        """Marcar/desmarcar noticia como destacada"""
        db_noticia = self.get_noticia(db, noticia_id)
        if not db_noticia:
            return None
        
        db_noticia.destacada = not db_noticia.destacada
        db_noticia.fecha_modificacion = datetime.utcnow()
        db.commit()
        db.refresh(db_noticia)
        return db_noticia
    
    def incrementar_vistas(self, db: Session, noticia_id: int) -> bool:
        """Incrementar contador de vistas"""
        db_noticia = self.get_noticia(db, noticia_id)
        if not db_noticia:
            return False
        
        db_noticia.vistas += 1
        db.commit()
        return True
    
    def incrementar_clicks(self, db: Session, noticia_id: int) -> bool:
        """Incrementar contador de clicks"""
        db_noticia = self.get_noticia(db, noticia_id)
        if not db_noticia:
            return False
        
        db_noticia.clicks += 1
        db.commit()
        return True
    
    def get_estadisticas_noticias(self, db: Session) -> dict:
        """Obtener estadísticas generales de noticias"""
        total_noticias = db.query(Noticia).count()
        noticias_activas = db.query(Noticia).filter(Noticia.activa == True).count()
        noticias_destacadas = db.query(Noticia).filter(Noticia.destacada == True).count()
        
        # Noticias por categoría
        categorias = db.query(Noticia.categoria, db.func.count(Noticia.id)).group_by(Noticia.categoria).all()
        
        return {
            "total_noticias": total_noticias,
            "noticias_activas": noticias_activas,
            "noticias_destacadas": noticias_destacadas,
            "noticias_por_categoria": dict(categorias)
        }

# Instancia global para usar en otros módulos
crud_noticias = CRUDNoticias()
