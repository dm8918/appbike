import os

import bcrypt
from fastapi import Depends, HTTPException, Request, Response
from itsdangerous import BadSignature, SignatureExpired, URLSafeTimedSerializer
from sqlalchemy.orm import Session

from .db import get_db
from .models import User

SESSION_SECRET = os.environ.get("SESSION_SECRET")
if not SESSION_SECRET:
    raise RuntimeError("SESSION_SECRET environment variable is required")

COOKIE_NAME = "bike_session"
SESSION_MAX_AGE = 60 * 60 * 24 * 30  # 30 days

ADMIN_EMAILS = {
    e.strip().lower()
    for e in os.environ.get("ADMIN_EMAILS", "nico.tagle1@gmail.com").split(",")
    if e.strip()
}

_serializer = URLSafeTimedSerializer(SESSION_SECRET, salt="bike-session")


def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")


def verify_password(password: str, password_hash: str) -> bool:
    try:
        return bcrypt.checkpw(password.encode("utf-8"), password_hash.encode("utf-8"))
    except ValueError:
        return False


def is_admin_email(email: str) -> bool:
    return email.strip().lower() in ADMIN_EMAILS


def set_session_cookie(response: Response, user_id: int) -> None:
    token = _serializer.dumps({"uid": user_id})
    response.set_cookie(
        COOKIE_NAME,
        token,
        max_age=SESSION_MAX_AGE,
        httponly=True,
        samesite="lax",
        secure=os.environ.get("COOKIE_SECURE", "").lower() == "true",
        path="/",
    )


def clear_session_cookie(response: Response) -> None:
    response.delete_cookie(COOKIE_NAME, path="/")


def get_current_user(request: Request, db: Session = Depends(get_db)) -> User:
    token = request.cookies.get(COOKIE_NAME)
    if not token:
        raise HTTPException(status_code=401, detail="No autenticado")
    try:
        data = _serializer.loads(token, max_age=SESSION_MAX_AGE)
    except (BadSignature, SignatureExpired):
        raise HTTPException(status_code=401, detail="Sesión inválida o expirada")
    user = db.get(User, data.get("uid"))
    if user is None:
        raise HTTPException(status_code=401, detail="Usuario no encontrado")
    return user


def require_admin(user: User = Depends(get_current_user)) -> User:
    if not is_admin_email(user.email):
        raise HTTPException(status_code=403, detail="Solo el administrador puede acceder")
    return user
