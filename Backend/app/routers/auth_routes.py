from fastapi import APIRouter, Depends, HTTPException, Request, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from datetime import timedelta
import logging

try:
    from slowapi import Limiter
    from slowapi.util import get_remote_address
    limiter = Limiter(key_func=get_remote_address)
    RATE_LIMITING = True
except ImportError:
    limiter = None
    RATE_LIMITING = False

from ..database import get_db
from ..auth import authenticate_user, create_access_token, ACCESS_TOKEN_EXPIRE_MINUTES
from ..schemas import Token, Login

logger = logging.getLogger(__name__)
router = APIRouter(tags=["auth"])


@router.post("/token", response_model=Token)
async def login_for_access_token(
    request: Request,
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db)
):
    try:
        user = authenticate_user(db, form_data.username, form_data.password)
    except Exception as e:
        logger.error(f"Error en authenticate_user: {type(e).__name__}: {e}")
        raise HTTPException(status_code=500, detail=f"Error interno: {str(e)}")
    if not user:
        logger.warning(f"Authentication failed for: {form_data.username}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.email}, expires_delta=access_token_expires
    )
    logger.info(f"Login successful for: {user.email}")
    return {"access_token": access_token, "token_type": "bearer"}


@router.options("/login")
async def login_options():
    return {"message": "OK"}


@router.post("/login", response_model=Token)
async def login_json(
    request: Request,
    login_data: Login,
    db: Session = Depends(get_db)
):
    user = authenticate_user(db, login_data.identificador, login_data.password)
    if not user:
        logger.warning(f"Login failed for: {login_data.identificador}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
        )
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.email}, expires_delta=access_token_expires
    )
    logger.info(f"Login successful for: {user.email}")
    return {"access_token": access_token, "token_type": "bearer"}
