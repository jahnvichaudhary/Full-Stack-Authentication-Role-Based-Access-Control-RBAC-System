import { jwtDecode } from "jwt-decode";

const KEY = "token";

export type Role = "USER" | "ADMIN";

type JwtPayload = {
  sub?: string;
  email?: string;
  name?: string;
  role?: Role | string;
  roles?: Array<Role | string>;
  authorities?: Array<string>;
  exp?: number;
};

export function getToken(): string | null {
  try {
    return localStorage.getItem(KEY);
  } catch {
    return null;
  }
}

export function setToken(token: string) {
  localStorage.setItem(KEY, token);
  window.dispatchEvent(new Event("auth:login"));
}

export function clearToken() {
  localStorage.removeItem(KEY);
}

function normalizeRole(raw: string | undefined): Role | null {
  if (!raw) return null;
  const up = raw.toUpperCase().replace(/^ROLE_/, "");
  if (up === "ADMIN" || up === "USER") return up;
  return null;
}

export function decode(token: string | null): JwtPayload | null {
  if (!token) return null;
  try {
    const p = jwtDecode<JwtPayload>(token);
    if (p.exp && p.exp * 1000 < Date.now()) return null;
    return p;
  } catch {
    return null;
  }
}

export function getCurrentUser() {
  const payload = decode(getToken());
  if (!payload) return null;

  let role: Role | null = null;
  if (typeof payload.role === "string") role = normalizeRole(payload.role);
  if (!role && Array.isArray(payload.roles)) {
    for (const r of payload.roles) {
      role = normalizeRole(String(r));
      if (role) break;
    }
  }
  if (!role && Array.isArray(payload.authorities)) {
    for (const r of payload.authorities) {
      role = normalizeRole(String(r));
      if (role) break;
    }
  }

  return {
    email: payload.email ?? payload.sub ?? null,
    name: payload.name ?? null,
    role,
  };
}
