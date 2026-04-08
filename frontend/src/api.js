// En desarrollo local, Vite proxea /api al Worker en localhost:8787
// En producción, cambiar a la URL del Worker deployed
const API_BASE = import.meta.env.VITE_API_URL || "";

let sessionCookie = null;

export function setSession(cookie) {
  sessionCookie = cookie;
}

export function getSession() {
  return sessionCookie;
}

export function clearSession() {
  sessionCookie = null;
}

async function apiFetch(path, opts = {}) {
  const headers = {
    "Content-Type": "application/json",
    ...(sessionCookie ? { Authorization: sessionCookie } : {}),
    ...opts.headers,
  };

  const res = await fetch(`${API_BASE}${path}`, {
    ...opts,
    headers,
  });

  if (res.status === 401) {
    clearSession();
    throw new Error("Sesión expirada");
  }

  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Error desconocido");
  return data;
}

export async function login(usuario, password) {
  const data = await apiFetch("/api/login", {
    method: "POST",
    body: JSON.stringify({ usuario, password }),
  });
  setSession(data.session);
  return data;
}

export async function getComisionesClases() {
  return apiFetch("/api/comisiones/clases");
}

export async function getComisionesParciales() {
  return apiFetch("/api/comisiones/parciales");
}

export async function getClases(hash) {
  return apiFetch(`/api/clases/${hash}`);
}

export async function getAsistencia(hash, claseId) {
  return apiFetch(`/api/asistencia/${hash}/${claseId}`);
}

export async function guardarAsistencia(hash, claseId, alumnos) {
  return apiFetch(`/api/asistencia/${hash}/${claseId}`, {
    method: "POST",
    body: JSON.stringify({ alumnos }),
  });
}

export async function guardarAsistenciaBatch(comisiones, alumnos) {
  return apiFetch("/api/asistencia-batch", {
    method: "POST",
    body: JSON.stringify({ comisiones, alumnos }),
  });
}

export async function getEvaluaciones(hash) {
  return apiFetch(`/api/evaluaciones/${hash}`);
}
