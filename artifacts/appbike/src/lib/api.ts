export const API_BASE = import.meta.env.DEV ? "/bike-api" : "/api";

export interface User {
  id: number;
  email: string;
  name: string;
  isAdmin: boolean;
}

export interface Ride {
  id: number;
  userId: number;
  userName?: string;
  userEmail?: string;
  date: string; // YYYY-MM-DD
  km: number;
  photoFilename: string | null;
  createdAt: string;
}

export interface Badge {
  code: string;
  name: string;
  description: string;
  earned: boolean;
  earnedAt: string | null;
}

export interface MyStats {
  totalKm: number;
  totalRides: number;
  points: number;
  level: number;
  levelName: string;
  pointsInLevel: number;
  pointsForNextLevel: number;
  streakDays: number;
  weekKm: number;
  badges: Badge[];
}

export interface LeaderboardEntry {
  rank: number;
  userId: number;
  name: string;
  totalKm: number;
  points: number;
  rides: number;
  isMe: boolean;
}

export interface AdminUserSummary {
  userId: number;
  name: string;
  email: string;
  totalKm: number;
  points: number;
  rides: number;
  lastRideDate: string | null;
}

export class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    credentials: "include",
    ...options,
  });
  if (!res.ok) {
    let message = res.statusText;
    try {
      const body = await res.json();
      if (body && typeof body.detail === "string") message = body.detail;
    } catch {
      // ignore
    }
    throw new ApiError(res.status, message);
  }
  if (res.status === 204) return undefined as T;
  return (await res.json()) as T;
}

function jsonInit(method: string, body: unknown): RequestInit {
  return {
    method,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  };
}

// ---- Auth ----
export function register(input: { email: string; password: string; name: string }): Promise<User> {
  return request<User>("/auth/register", jsonInit("POST", input));
}

export function login(input: { email: string; password: string }): Promise<User> {
  return request<User>("/auth/login", jsonInit("POST", input));
}

export function logout(): Promise<void> {
  return request<void>("/auth/logout", { method: "POST" });
}

export function getMe(): Promise<User> {
  return request<User>("/auth/me");
}

// ---- Rides ----
export function getMyRides(): Promise<Ride[]> {
  return request<Ride[]>("/rides");
}

/** Create a ride. photo is optional evidence image. */
export function createRide(input: { date: string; km: number; photo?: File | null }): Promise<Ride> {
  const form = new FormData();
  form.append("date", input.date);
  form.append("km", String(input.km));
  if (input.photo) form.append("photo", input.photo);
  return request<Ride>("/rides", { method: "POST", body: form });
}

export function deleteRide(id: number): Promise<void> {
  return request<void>(`/rides/${id}`, { method: "DELETE" });
}

/** Build the URL for a ride evidence photo. */
export function photoUrl(filename: string): string {
  return `${API_BASE}/photos/${filename}`;
}

// ---- Gamification ----
export function getMyStats(): Promise<MyStats> {
  return request<MyStats>("/stats/me");
}

export type LeaderboardPeriod = "week" | "month" | "all";

export function getLeaderboard(period: LeaderboardPeriod = "week"): Promise<LeaderboardEntry[]> {
  return request<LeaderboardEntry[]>(`/leaderboard?period=${period}`);
}

// ---- Admin (only for admin user) ----
export function getAdminUsers(): Promise<AdminUserSummary[]> {
  return request<AdminUserSummary[]>("/admin/users");
}

export function getAdminRides(userId?: number): Promise<Ride[]> {
  const q = userId != null ? `?user_id=${userId}` : "";
  return request<Ride[]>(`/admin/rides${q}`);
}
