const API_BASE = import.meta.env.VITE_API_URL || "";

let sessionCookie = localStorage.getItem("gu_session") || null;
let currentUsuario = localStorage.getItem("gu_usuario") || null;

export function setSession(cookie) {
  sessionCookie = cookie;
  if (cookie) localStorage.setItem("gu_session", cookie);
  else localStorage.removeItem("gu_session");
}

export function setUsuario(usuario) {
  currentUsuario = usuario;
  if (usuario) localStorage.setItem("gu_usuario", usuario);
  else localStorage.removeItem("gu_usuario");
}

export function getSession() { return sessionCookie; }
export function getNombre() { return localStorage.getItem("gu_nombre") || null; }
export function setNombre(n) { if (n) localStorage.setItem("gu_nombre", n); }

export function clearSession() {
  sessionCookie = null;
  currentUsuario = null;
  localStorage.removeItem("gu_session");
  localStorage.removeItem("gu_usuario");
  localStorage.removeItem("gu_nombre");
}

async function apiFetch(path, opts = {}) {
  const headers = {
    "Content-Type": "application/json",
    ...(sessionCookie ? { Authorization: sessionCookie } : {}),
    ...(currentUsuario ? { "X-Usuario": currentUsuario } : {}),
    ...opts.headers,
  };
  const res = await fetch(`${API_BASE}${path}`, { ...opts, headers });
  if (res.status === 401) { clearSession(); throw new Error("Sesión expirada"); }
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Error desconocido");
  return data;
}

export async function login(usuario, password) {
  const data = await apiFetch("/api/login", { method: "POST", body: JSON.stringify({ usuario, password }) });
  setSession(data.session);
  setUsuario(usuario);
  setNombre(data.nombre);
  return data;
}

export async function getComisionesClases() { return apiFetch("/api/comisiones/clases"); }
export async function getComisionesParciales() { return apiFetch("/api/comisiones/parciales"); }
export async function getClases(hash) { return apiFetch(`/api/clases/${hash}`); }
export async function getAsistencia(hash, claseId) { return apiFetch(`/api/asistencia/${hash}/${claseId}`); }

export async function getAsistenciaUnificada(comisionHashes, fecha) {
  return apiFetch("/api/asistencia-unificada", { method: "POST", body: JSON.stringify({ comisionHashes, fecha }) });
}

export async function guardarAsistencia(hash, claseId, alumnos) {
  return apiFetch(`/api/asistencia/${hash}/${claseId}`, { method: "POST", body: JSON.stringify({ alumnos }) });
}

export async function guardarAsistenciaBatch(comisiones, alumnos) {
  return apiFetch("/api/asistencia-batch", { method: "POST", body: JSON.stringify({ comisiones, alumnos }) });
}

export async function getEvaluaciones(hash) { return apiFetch(`/api/evaluaciones/${hash}`); }

export async function crearEvaluacion(hash, evalData) {
  return apiFetch(`/api/evaluaciones/${hash}`, { method: "POST", body: JSON.stringify(evalData) });
}

export async function crearEvaluacionBatch(hashes, evalData) {
  return apiFetch("/api/evaluaciones-batch", { method: "POST", body: JSON.stringify({ hashes, ...evalData }) });
}

export async function getGrupos() { return apiFetch("/api/grupos"); }

export async function guardarGrupo(nombre, comisionIds) {
  return apiFetch("/api/grupos", { method: "POST", body: JSON.stringify({ nombre, comisionIds }) });
}

export async function eliminarGrupo(nombre) {
  return apiFetch(`/api/grupos/${encodeURIComponent(nombre)}`, { method: "DELETE" });
}

// ── NOTAS ──
export async function getNotas(cargarHash) {
  return apiFetch(`/api/notas/${cargarHash}`);
}

export async function agregarComisionAEval(cargarHash) {
  return apiFetch(`/api/notas/${cargarHash}/agregar-comision`, { method: "POST" });
}

export async function guardarNotas(cargarHash, evaluacionHash, alumnos) {
  return apiFetch(`/api/notas/${cargarHash}/guardar`, {
    method: "POST",
    body: JSON.stringify({ evaluacionHash, alumnos }),
  });
}