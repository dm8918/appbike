import os
import re
import uuid
from datetime import date, datetime, timedelta, timezone
from pathlib import Path

from fastapi import APIRouter, Depends, FastAPI, File, Form, HTTPException, UploadFile
from fastapi.responses import FileResponse, JSONResponse, Response
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel, EmailStr, Field
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from .db import DATA_DIR, Base, engine, get_db
from .gamification import compute_badges, compute_streak, level_for_points, points_for_km
from .models import Ride, User
from .security import (
    clear_session_cookie,
    get_current_user,
    hash_password,
    is_admin_email,
    require_admin,
    set_session_cookie,
    verify_password,
)

Base.metadata.create_all(bind=engine)

UPLOAD_DIR = Path(os.environ.get("UPLOAD_DIR", DATA_DIR / "uploads"))
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)

MAX_PHOTO_BYTES = 10 * 1024 * 1024
ALLOWED_PHOTO_TYPES = {
    "image/jpeg": ".jpg",
    "image/png": ".png",
    "image/webp": ".webp",
    "image/heic": ".heic",
    "image/heif": ".heif",
}

app = FastAPI(title="BiciOffice API", docs_url=None, redoc_url=None, openapi_url=None)

router = APIRouter()


# ---------- Schemas ----------
class RegisterInput(BaseModel):
    email: EmailStr
    password: str = Field(min_length=8, max_length=128)
    name: str = Field(min_length=1, max_length=120)


class LoginInput(BaseModel):
    email: EmailStr
    password: str


def user_out(user: User) -> dict:
    return {
        "id": user.id,
        "email": user.email,
        "name": user.name,
        "isAdmin": is_admin_email(user.email),
    }


def ride_out(ride: Ride, include_user: bool = False) -> dict:
    data = {
        "id": ride.id,
        "userId": ride.user_id,
        "date": ride.date.isoformat(),
        "km": ride.km,
        "photoFilename": ride.photo_filename,
        "createdAt": ride.created_at.isoformat(),
    }
    if include_user and ride.user is not None:
        data["userName"] = ride.user.name
        data["userEmail"] = ride.user.email
    return data


# ---------- Auth ----------
@router.post("/auth/register")
def register(body: RegisterInput, db: Session = Depends(get_db)):
    email = body.email.strip().lower()
    existing = db.scalar(select(User).where(User.email == email))
    if existing is not None:
        raise HTTPException(status_code=400, detail="Ya existe una cuenta con ese correo")
    user = User(email=email, name=body.name.strip(), password_hash=hash_password(body.password))
    db.add(user)
    db.commit()
    db.refresh(user)
    response = JSONResponse(user_out(user))
    set_session_cookie(response, user.id)
    return response


@router.post("/auth/login")
def login(body: LoginInput, db: Session = Depends(get_db)):
    email = body.email.strip().lower()
    user = db.scalar(select(User).where(User.email == email))
    if user is None or not verify_password(body.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Correo o contraseña incorrectos")
    response = JSONResponse(user_out(user))
    set_session_cookie(response, user.id)
    return response


@router.post("/auth/logout")
def logout():
    response = Response(status_code=204)
    clear_session_cookie(response)
    return response


@router.get("/auth/me")
def me(user: User = Depends(get_current_user)):
    return user_out(user)


# ---------- Rides ----------
@router.get("/rides")
def my_rides(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    rides = db.scalars(
        select(Ride).where(Ride.user_id == user.id).order_by(Ride.date.desc(), Ride.id.desc())
    ).all()
    return [ride_out(r) for r in rides]


@router.post("/rides", status_code=201)
async def create_ride(
    date_str: str = Form(alias="date"),
    km: float = Form(),
    photo: UploadFile | None = File(default=None),
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if not re.fullmatch(r"\d{4}-\d{2}-\d{2}", date_str):
        raise HTTPException(status_code=400, detail="Fecha inválida (usa AAAA-MM-DD)")
    try:
        ride_date = date.fromisoformat(date_str)
    except ValueError:
        raise HTTPException(status_code=400, detail="Fecha inválida")
    if ride_date > date.today() + timedelta(days=1):
        raise HTTPException(status_code=400, detail="La fecha no puede ser futura")
    if not (0 < km <= 300):
        raise HTTPException(status_code=400, detail="Los kilómetros deben estar entre 0 y 300")

    photo_filename: str | None = None
    if photo is not None and photo.filename:
        content_type = (photo.content_type or "").lower()
        if content_type not in ALLOWED_PHOTO_TYPES:
            raise HTTPException(
                status_code=400, detail="Formato de foto no soportado (usa JPG, PNG o WebP)"
            )
        contents = await photo.read()
        if len(contents) > MAX_PHOTO_BYTES:
            raise HTTPException(status_code=400, detail="La foto supera el máximo de 10 MB")
        photo_filename = f"{uuid.uuid4().hex}{ALLOWED_PHOTO_TYPES[content_type]}"
        (UPLOAD_DIR / photo_filename).write_bytes(contents)

    ride = Ride(
        user_id=user.id,
        date=ride_date,
        km=round(km, 2),
        photo_filename=photo_filename,
        created_at=datetime.now(timezone.utc),
    )
    db.add(ride)
    db.commit()
    db.refresh(ride)
    return ride_out(ride)


@router.delete("/rides/{ride_id}", status_code=204)
def delete_ride(ride_id: int, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    ride = db.get(Ride, ride_id)
    if ride is None or (ride.user_id != user.id and not is_admin_email(user.email)):
        raise HTTPException(status_code=404, detail="Sesión no encontrada")
    if ride.photo_filename:
        photo_path = UPLOAD_DIR / ride.photo_filename
        if photo_path.exists():
            photo_path.unlink()
    db.delete(ride)
    db.commit()
    return Response(status_code=204)


@router.get("/photos/{filename}")
def get_photo(filename: str, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    if not re.fullmatch(r"[a-f0-9]{32}\.(jpg|png|webp|heic|heif)", filename):
        raise HTTPException(status_code=404, detail="Foto no encontrada")
    ride = db.scalar(select(Ride).where(Ride.photo_filename == filename))
    if ride is None:
        raise HTTPException(status_code=404, detail="Foto no encontrada")
    if ride.user_id != user.id and not is_admin_email(user.email):
        raise HTTPException(status_code=403, detail="No tienes acceso a esta foto")
    path = UPLOAD_DIR / filename
    if not path.exists():
        raise HTTPException(status_code=404, detail="Foto no encontrada")
    return FileResponse(path)


# ---------- Gamification ----------
@router.get("/stats/me")
def my_stats(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    rides = db.scalars(
        select(Ride).where(Ride.user_id == user.id).order_by(Ride.date.asc(), Ride.id.asc())
    ).all()
    today = date.today()
    total_km = round(sum(r.km for r in rides), 2)
    points = points_for_km(total_km)
    level, level_name, points_in_level, points_for_next = level_for_points(points)
    week_start = today - timedelta(days=today.weekday())
    week_km = round(sum(r.km for r in rides if r.date >= week_start), 2)
    return {
        "totalKm": total_km,
        "totalRides": len(rides),
        "points": points,
        "level": level,
        "levelName": level_name,
        "pointsInLevel": points_in_level,
        "pointsForNextLevel": points_for_next,
        "streakDays": compute_streak({r.date for r in rides}, today),
        "weekKm": week_km,
        "badges": compute_badges(rides, today),
    }


@router.get("/leaderboard")
def leaderboard(
    period: str = "week", user: User = Depends(get_current_user), db: Session = Depends(get_db)
):
    today = date.today()
    if period == "week":
        since = today - timedelta(days=today.weekday())
    elif period == "month":
        since = today.replace(day=1)
    elif period == "all":
        since = None
    else:
        raise HTTPException(status_code=400, detail="Periodo inválido")

    query = (
        select(
            User.id,
            User.name,
            func.coalesce(func.sum(Ride.km), 0.0),
            func.count(Ride.id),
        )
        .join(Ride, Ride.user_id == User.id)
        .group_by(User.id, User.name)
    )
    if since is not None:
        query = query.where(Ride.date >= since)
    rows = db.execute(query).all()
    entries = sorted(rows, key=lambda r: r[2], reverse=True)
    return [
        {
            "rank": i + 1,
            "userId": row[0],
            "name": row[1],
            "totalKm": round(row[2], 2),
            "points": points_for_km(row[2]),
            "rides": row[3],
            "isMe": row[0] == user.id,
        }
        for i, row in enumerate(entries)
    ]


# ---------- Admin ----------
@router.get("/admin/users")
def admin_users(_: User = Depends(require_admin), db: Session = Depends(get_db)):
    rows = db.execute(
        select(
            User.id,
            User.name,
            User.email,
            func.coalesce(func.sum(Ride.km), 0.0),
            func.count(Ride.id),
            func.max(Ride.date),
        )
        .outerjoin(Ride, Ride.user_id == User.id)
        .group_by(User.id, User.name, User.email)
        .order_by(func.coalesce(func.sum(Ride.km), 0.0).desc())
    ).all()
    return [
        {
            "userId": row[0],
            "name": row[1],
            "email": row[2],
            "totalKm": round(row[3], 2),
            "points": points_for_km(row[3]),
            "rides": row[4],
            "lastRideDate": row[5].isoformat() if row[5] else None,
        }
        for row in rows
    ]


@router.get("/admin/rides")
def admin_rides(
    user_id: int | None = None,
    _: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    query = select(Ride).order_by(Ride.date.desc(), Ride.id.desc())
    if user_id is not None:
        query = query.where(Ride.user_id == user_id)
    rides = db.scalars(query.limit(500)).all()
    return [ride_out(r, include_user=True) for r in rides]


# Mount the API under both prefixes:
# - /api       → production path (Databricks Apps, single origin)
# - /bike-api  → Replit development proxy path
app.include_router(router, prefix="/api")
app.include_router(router, prefix="/bike-api", include_in_schema=False)

# In production (Databricks Apps) serve the built frontend as static files.
STATIC_DIR = Path(__file__).parent.parent / "dist" / "public"
if STATIC_DIR.exists():

    @app.exception_handler(404)
    async def spa_fallback(request, exc):
        path = request.url.path
        if path.startswith("/api/") or path.startswith("/bike-api/"):
            return JSONResponse({"detail": getattr(exc, "detail", "Not found")}, status_code=404)
        index = STATIC_DIR / "index.html"
        if index.exists():
            return FileResponse(index)
        return JSONResponse({"detail": "Not found"}, status_code=404)

    app.mount("/", StaticFiles(directory=STATIC_DIR, html=True), name="static")
