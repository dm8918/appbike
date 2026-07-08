from datetime import date, timedelta

POINTS_PER_KM = 10

LEVELS = [
    (0, "Principiante"),
    (200, "Ciclista Urbano"),
    (500, "Rodador"),
    (1000, "Escalador"),
    (2000, "Contrarrelojista"),
    (3500, "Gran Fondista"),
    (5500, "Leyenda del Pelotón"),
]

BADGES = [
    ("primera_pedaleada", "Primera Pedaleada", "Registraste tu primera sesión"),
    ("constancia_5", "Constancia", "Completaste 5 sesiones"),
    ("maquina_20", "Máquina Imparable", "Completaste 20 sesiones"),
    ("ruta_50", "Ruta de 50", "Acumulaste 50 km en total"),
    ("centenario", "Centenario", "Acumulaste 100 km en total"),
    ("doscientos_cincuenta", "Ultra Fondo", "Acumulaste 250 km en total"),
    ("racha_3", "Racha de 3", "Pedaleaste 3 días seguidos"),
    ("racha_7", "Semana Perfecta", "Pedaleaste 7 días seguidos"),
]


def points_for_km(km: float) -> int:
    return round(km * POINTS_PER_KM)


def level_for_points(points: int) -> tuple[int, str, int, int]:
    """Return (level_number, level_name, points_in_level, points_for_next_level)."""
    level_idx = 0
    for i, (threshold, _name) in enumerate(LEVELS):
        if points >= threshold:
            level_idx = i
    threshold = LEVELS[level_idx][0]
    if level_idx + 1 < len(LEVELS):
        next_threshold = LEVELS[level_idx + 1][0]
    else:
        next_threshold = threshold  # max level
    points_in_level = points - threshold
    points_for_next = max(next_threshold - threshold, 0)
    return level_idx + 1, LEVELS[level_idx][1], points_in_level, points_for_next


def compute_streak(ride_dates: set[date], today: date) -> int:
    """Consecutive days with at least one ride, counting back from today or yesterday."""
    if not ride_dates:
        return 0
    start = today if today in ride_dates else today - timedelta(days=1)
    if start not in ride_dates:
        return 0
    streak = 0
    d = start
    while d in ride_dates:
        streak += 1
        d -= timedelta(days=1)
    return streak


def compute_badges(rides: list, today: date) -> list[dict]:
    """rides: list of Ride ordered by (date, id). Returns list of badge dicts."""
    earned: dict[str, str] = {}

    total_km = 0.0
    count = 0
    km_thresholds = {"ruta_50": 50.0, "centenario": 100.0, "doscientos_cincuenta": 250.0}
    count_thresholds = {"primera_pedaleada": 1, "constancia_5": 5, "maquina_20": 20}

    for ride in rides:
        total_km += ride.km
        count += 1
        for code, threshold in count_thresholds.items():
            if code not in earned and count >= threshold:
                earned[code] = ride.date.isoformat()
        for code, threshold in km_thresholds.items():
            if code not in earned and total_km >= threshold:
                earned[code] = ride.date.isoformat()

    # Streak badges: check best historical streak
    ride_dates = sorted({r.date for r in rides})
    best = 0
    run = 0
    prev = None
    run_end = None
    streak_earned_dates: dict[int, str] = {}
    for d in ride_dates:
        if prev is not None and d == prev + timedelta(days=1):
            run += 1
        else:
            run = 1
        prev = d
        run_end = d
        if run > best:
            best = run
        for target in (3, 7):
            if run >= target and target not in streak_earned_dates:
                streak_earned_dates[target] = run_end.isoformat()
    if 3 in streak_earned_dates:
        earned["racha_3"] = streak_earned_dates[3]
    if 7 in streak_earned_dates:
        earned["racha_7"] = streak_earned_dates[7]

    return [
        {
            "code": code,
            "name": name,
            "description": description,
            "earned": code in earned,
            "earnedAt": earned.get(code),
        }
        for code, name, description in BADGES
    ]
