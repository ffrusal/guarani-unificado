import { useState, useEffect, createContext, useContext } from "react";
import * as api from "./api";

const ThemeCtx = createContext();
const useTheme = () => useContext(ThemeCtx);

const themes = {
  light: {
    bgGrad: "linear-gradient(180deg, #f5f7f4 0%, #edf0eb 100%)",
    surface: "rgba(0,0,0,0.03)", surfaceBorder: "rgba(0,0,0,0.07)", surfaceHover: "rgba(0,0,0,0.06)",
    headerBg: "rgba(245,247,244,0.88)", headerBorder: "rgba(0,0,0,0.08)",
    text: "#1a2e22", textSec: "#5a6b60", textMut: "#8a9b90", textFaint: "#b0bab4",
    greenText: "#15803d", greenBg: "rgba(22,163,74,0.08)", greenBorder: "rgba(22,163,74,0.18)",
    redText: "#dc2626", redBg: "rgba(220,38,38,0.06)", redBorder: "rgba(220,38,38,0.15)",
    yellowText: "#a16207", yellowBg: "rgba(202,138,4,0.08)", yellowBorder: "rgba(202,138,4,0.18)",
    inputBg: "#ffffff", inputBorder: "rgba(0,0,0,0.12)",
    checkBg: "rgba(0,0,0,0.08)", checkBorder: "rgba(0,0,0,0.2)",
    modalOv: "rgba(0,0,0,0.3)", modalBg: "#ffffff",
    loginBg: "linear-gradient(135deg, #e8f5e9 0%, #f1f8e9 40%, #e0f2f1 100%)",
    loginCard: "rgba(255,255,255,0.85)", loginCardBorder: "rgba(0,0,0,0.08)", loginInputBg: "rgba(0,0,0,0.04)",
    loginIcon: "#16a34a", loginIconBg: "rgba(22,163,74,0.1)",
    optBg: "#ffffff", avatarBg: "rgba(22,163,74,0.1)", avatarText: "#16a34a",
    rowHover: "rgba(0,0,0,0.02)", tblBorder: "rgba(0,0,0,0.05)",
    ghost: "rgba(0,0,0,0.04)", ghostHov: "rgba(0,0,0,0.08)", ghostText: "#5a6b60",
    errBg: "rgba(220,38,38,0.06)", errBorder: "rgba(220,38,38,0.15)", errText: "#dc2626",
    spinnerBorder: "rgba(0,0,0,0.15)", spinnerTop: "#16a34a",
  },
  dark: {
    bgGrad: "linear-gradient(180deg, #0f1a14 0%, #0a1410 100%)",
    surface: "rgba(255,255,255,0.04)", surfaceBorder: "rgba(255,255,255,0.08)", surfaceHover: "rgba(255,255,255,0.06)",
    headerBg: "rgba(15,26,20,0.85)", headerBorder: "rgba(255,255,255,0.06)",
    text: "#ffffff", textSec: "#c0ccc4", textMut: "#8a9b90", textFaint: "#4a5b50",
    greenText: "#4ade80", greenBg: "rgba(74,222,128,0.12)", greenBorder: "rgba(74,222,128,0.25)",
    redText: "#f87171", redBg: "rgba(239,68,68,0.1)", redBorder: "rgba(239,68,68,0.25)",
    yellowText: "#fbbf24", yellowBg: "rgba(251,191,36,0.1)", yellowBorder: "rgba(251,191,36,0.2)",
    inputBg: "rgba(0,0,0,0.3)", inputBorder: "rgba(255,255,255,0.1)",
    checkBg: "rgba(255,255,255,0.1)", checkBorder: "rgba(255,255,255,0.2)",
    modalOv: "rgba(0,0,0,0.7)", modalBg: "#1a2a20",
    loginBg: "linear-gradient(135deg, #0f2419 0%, #1a3a2a 40%, #0d1f15 100%)",
    loginCard: "rgba(255,255,255,0.06)", loginCardBorder: "rgba(255,255,255,0.1)", loginInputBg: "rgba(0,0,0,0.3)",
    loginIcon: "#4ade80", loginIconBg: "rgba(74,222,128,0.15)",
    optBg: "#1e2e24", avatarBg: "rgba(74,222,128,0.2)", avatarText: "#4ade80",
    rowHover: "rgba(255,255,255,0.03)", tblBorder: "rgba(255,255,255,0.03)",
    ghost: "rgba(255,255,255,0.05)", ghostHov: "rgba(255,255,255,0.1)", ghostText: "#8a9b90",
    errBg: "rgba(239,68,68,0.1)", errBorder: "rgba(239,68,68,0.2)", errText: "#f87171",
    spinnerBorder: "rgba(255,255,255,0.15)", spinnerTop: "#4ade80",
  },
};

// ── Icons ──
const capSvg = (color) => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5"><path strokeLinecap="round" strokeLinejoin="round" d="M4.26 10.147a60.436 60.436 0 00-.491 6.347A48.627 48.627 0 0112 20.904a48.627 48.627 0 018.232-4.41 60.46 60.46 0 00-.491-6.347m-15.482 0a50.57 50.57 0 00-2.658-.813A59.905 59.905 0 0112 3.493a59.902 59.902 0 0110.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.697 50.697 0 0112 13.489a50.702 50.702 0 017.74-3.342" /></svg>;
const ico = {
  login: <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" /></svg>,
  logout: <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>,
  chk: <svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="white" strokeWidth="3"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>,
  back: <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>,
  warn: <svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>,
  link: <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" /></svg>,
  sun: <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" /></svg>,
  moon: <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" /></svg>,
  clip: <svg width="17" height="17" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>,
  cal: <svg width="17" height="17" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>,
  list: <svg width="17" height="17" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 10h16M4 14h16M4 18h16" /></svg>,
};

// ── Spinner ──
function Spinner({ size = 20, className = "" }) {
  const t = useTheme();
  return <div className={className} style={{ width: size, height: size, border: `2px solid ${t.spinnerBorder}`, borderTopColor: t.spinnerTop, borderRadius: "50%", animation: "spin 0.6s linear infinite" }} />;
}

// ── Error banner ──
function ErrorBanner({ message, onDismiss }) {
  const t = useTheme();
  if (!message) return null;
  return (
    <div className="flex items-center justify-between gap-2 px-3 py-2 rounded-lg text-sm" style={{ background: t.errBg, border: `1px solid ${t.errBorder}`, color: t.errText }}>
      <span>{message}</span>
      {onDismiss && <button onClick={onDismiss} className="text-xs opacity-60 hover:opacity-100">✕</button>}
    </div>
  );
}

// ── Loading screen ──
function LoadingScreen({ message }) {
  const t = useTheme();
  return (
    <div className="flex flex-col items-center justify-center py-20 gap-3">
      <Spinner size={28} />
      <span className="text-sm" style={{ color: t.textMut }}>{message || "Cargando..."}</span>
    </div>
  );
}

// ── LOGIN ──
function Login({ onLogin, dark, setDark }) {
  const t = useTheme();
  const [user, setUser] = useState("");
  const [pass, setPass] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const go = async () => {
    if (!user || !pass) { setError("Completá usuario y contraseña"); return; }
    setLoading(true);
    setError("");
    try {
      const data = await api.login(user, pass);
      onLogin(data.nombre, data.session);
    } catch (e) {
      setError(e.message || "Error al conectar");
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => { if (e.key === "Enter") go(); };

  return (
    <div className="min-h-screen flex items-center justify-center relative" style={{ background: t.loginBg }}>
      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
      <div className="absolute top-4 right-4">
        <button onClick={() => setDark(!dark)} className="p-2 rounded-lg" style={{ background: t.ghost, color: t.ghostText }}>{dark ? ico.sun : ico.moon}</button>
      </div>
      <div className="w-full max-w-sm px-4">
        <div className="text-center mb-7">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl mb-3" style={{ background: t.loginIconBg, border: `1px solid ${t.greenBorder}` }}>
            <div style={{ color: t.loginIcon }}><svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path strokeLinecap="round" strokeLinejoin="round" d="M4.26 10.147a60.436 60.436 0 00-.491 6.347A48.627 48.627 0 0112 20.904a48.627 48.627 0 018.232-4.41 60.46 60.46 0 00-.491-6.347m-15.482 0a50.57 50.57 0 00-2.658-.813A59.905 59.905 0 0112 3.493a59.902 59.902 0 0110.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.697 50.697 0 0112 13.489a50.702 50.702 0 017.74-3.342M6.75 15a.75.75 0 100-1.5.75.75 0 000 1.5zm0 0v-3.675A55.378 55.378 0 0112 8.443m-7.007 11.55A5.981 5.981 0 006.75 15.75v-1.5" /></svg></div>
          </div>
          <h1 className="text-xl font-bold tracking-tight" style={{ color: t.text }}>Guaraní Unificado</h1>
          <p className="text-xs mt-1" style={{ color: t.textMut }}>Gestión multi-comisión · USAL</p>
        </div>
        <div className="rounded-2xl p-5 space-y-3" style={{ background: t.loginCard, border: `1px solid ${t.loginCardBorder}`, backdropFilter: "blur(12px)" }}>
          {error && <ErrorBanner message={error} onDismiss={() => setError("")} />}
          <div>
            <label className="block text-xs font-medium mb-1" style={{ color: t.textMut }}>Usuario</label>
            <input type="text" value={user} onChange={(e) => setUser(e.target.value)} onKeyDown={handleKeyDown} placeholder="ej: ffernandezruiz" autoComplete="username"
              className="w-full px-3 py-2 rounded-lg text-sm outline-none focus:ring-2 focus:ring-green-500/40"
              style={{ background: t.loginInputBg, border: `1px solid ${t.inputBorder}`, color: t.text }} />
          </div>
          <div>
            <label className="block text-xs font-medium mb-1" style={{ color: t.textMut }}>Contraseña</label>
            <input type="password" value={pass} onChange={(e) => setPass(e.target.value)} onKeyDown={handleKeyDown} placeholder="••••••••" autoComplete="current-password"
              className="w-full px-3 py-2 rounded-lg text-sm outline-none focus:ring-2 focus:ring-green-500/40"
              style={{ background: t.loginInputBg, border: `1px solid ${t.inputBorder}`, color: t.text }} />
          </div>
          <button onClick={go} disabled={loading}
            className="w-full py-2.5 rounded-lg text-sm font-semibold text-white flex items-center justify-center gap-2 transition-all hover:brightness-110 active:scale-[0.98] mt-2"
            style={{ background: "linear-gradient(135deg, #22c55e, #16a34a)" }}>
            {loading ? <Spinner size={16} /> : <>{ico.login} Conectar</>}
          </button>
        </div>
        <p className="text-center text-xs mt-3" style={{ color: t.textFaint }}>Conexión directa a autogestion.usal.edu.ar</p>
      </div>
    </div>
  );
}

// ── DASHBOARD ──
function Dash({ onGo }) {
  const t = useTheme();
  const [sel, setSel] = useState(new Set());
  const [comisiones, setComisiones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    loadComisiones();
  }, []);

  const loadComisiones = async () => {
    setLoading(true);
    setError("");
    try {
      const data = await api.getComisionesClases();
      setComisiones(data.comisiones || []);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const grouped = {};
  comisiones.forEach((c) => {
    const mat = c.materia || "Sin materia";
    if (!grouped[mat]) grouped[mat] = [];
    grouped[mat].push(c);
  });

  const toggle = (id) => setSel((p) => { const n = new Set(p); n.has(id) ? n.delete(id) : n.add(id); return n; });
  const selAll = (m) => { const ids = grouped[m].map((c) => c.id); setSel((p) => { const n = new Set(p); const a = ids.every((i) => n.has(i)); ids.forEach((i) => a ? n.delete(i) : n.add(i)); return n; }); };
  const tot = comisiones.filter((c) => sel.has(c.id)).reduce((a, c) => a + (c.inscriptos || 0), 0);

  if (loading) return <LoadingScreen message="Cargando comisiones desde Guaraní..." />;

  return (
    <div className="space-y-5">
      {error && <ErrorBanner message={error} onDismiss={() => setError("")} />}

      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-lg font-bold" style={{ color: t.text }}>Mis Comisiones</h2>
          <p className="text-xs mt-0.5" style={{ color: t.textMut }}>
            {comisiones.length > 0
              ? "Seleccioná las comisiones a unificar"
              : "No se encontraron comisiones"}
          </p>
        </div>
        {sel.size > 0 && (
          <div className="flex items-center gap-3">
            <span className="text-xs" style={{ color: t.textMut }}>{sel.size} com. · {tot} alumnos</span>
            <button onClick={() => onGo(comisiones.filter((c) => sel.has(c.id)))}
              className="px-4 py-2 rounded-lg text-sm font-semibold text-white flex items-center gap-2 hover:brightness-110 active:scale-[0.98]"
              style={{ background: "linear-gradient(135deg, #22c55e, #16a34a)" }}>{ico.link} Trabajar unificado</button>
          </div>
        )}
      </div>

      {comisiones.length === 0 && !error && (
        <div className="text-center py-12">
          <p className="text-sm" style={{ color: t.textMut }}>No se pudieron cargar las comisiones.</p>
          <button onClick={loadComisiones} className="mt-3 px-4 py-2 rounded-lg text-sm" style={{ background: t.greenBg, color: t.greenText }}>Reintentar</button>
        </div>
      )}

      {Object.entries(grouped).map(([mat, cs]) => {
        const allS = cs.every((c) => sel.has(c.id));
        return (
          <div key={mat} className="rounded-xl overflow-hidden" style={{ background: t.surface, border: `1px solid ${t.surfaceBorder}` }}>
            <div className="px-4 py-2.5 flex items-center justify-between" style={{ background: t.greenBg, borderBottom: `1px solid ${t.greenBorder}` }}>
              <span className="text-sm font-bold" style={{ color: t.greenText }}>{mat} <span className="font-normal text-xs" style={{ color: t.textMut }}>({cs.length})</span></span>
              <button onClick={() => selAll(mat)} className="text-xs px-2.5 py-1 rounded-md"
                style={allS ? { background: t.greenBg, color: t.greenText } : { background: t.ghost, color: t.ghostText }}>
                {allS ? "✓ Todas" : "Seleccionar todas"}
              </button>
            </div>
            <div className="p-3 space-y-1.5">
              {cs.map((c) => (
                <button key={c.id} onClick={() => toggle(c.id)}
                  className="w-full text-left px-3 py-2.5 rounded-lg flex items-center justify-between transition-all"
                  style={sel.has(c.id) ? { background: t.greenBg, boxShadow: `inset 0 0 0 1px ${t.greenBorder}` } : {}}>
                  <div className="flex items-center gap-3">
                    <div className="w-5 h-5 rounded flex items-center justify-center shrink-0"
                      style={sel.has(c.id) ? { background: "#22c55e" } : { background: t.checkBg, boxShadow: `inset 0 0 0 1px ${t.checkBorder}` }}>
                      {sel.has(c.id) && ico.chk}
                    </div>
                    <div>
                      <div className="text-sm font-medium" style={{ color: t.text }}>{c.id}</div>
                      <div className="text-xs" style={{ color: t.textMut }}>{c.ubicacion || ""}</div>
                    </div>
                  </div>
                  <div className="text-right shrink-0 ml-2">
                    <div className="text-sm" style={{ color: t.textSec }}>{c.inscriptos || "—"}</div>
                    <div className="text-xs" style={{ color: t.textMut }}>{c.turno || ""}</div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ── UNIFIED VIEW ──
function Unified({ coms, onBack }) {
  const t = useTheme();
  const [tab, setTab] = useState("asist");
  const [clases, setClases] = useState({ dictadas: [], sinDictar: [] });
  const [loadingClases, setLoadingClases] = useState(true);
  const [selectedClase, setSelectedClase] = useState(null);
  const [alumnos, setAlumnos] = useState([]);
  const [loadingAlumnos, setLoadingAlumnos] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [hrs, setHrs] = useState(3);
  const [evals, setEvals] = useState([]);
  const [loadingEvals, setLoadingEvals] = useState(false);
  const [error, setError] = useState("");
  const [saveResults, setSaveResults] = useState(null);

  const tot = coms.reduce((a, c) => a + (c.inscriptos || 0), 0);

  // Load clases for the first comision
  useEffect(() => {
    loadClases();
  }, []);

  const loadClases = async () => {
    setLoadingClases(true);
    setError("");
    try {
      const hash = coms[0]?.hash;
      if (!hash) throw new Error("No se encontró el hash de la comisión");
      const data = await api.getClases(hash);
      setClases(data);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoadingClases(false);
    }
  };

  const loadAsistencia = async (clase) => {
    setSelectedClase(clase);
    setLoadingAlumnos(true);
    setError("");
    setSaved(false);
    setSaveResults(null);
    try {
      const hash = coms[0]?.hash;
      const claseId = clase.claseId;
      if (!hash || !claseId) throw new Error("Datos de clase incompletos");
      const data = await api.getAsistencia(hash, claseId);
      setAlumnos((data.alumnos || []).map((a, i) => ({ ...a, nombre: a.nombre || `Alumno ${i + 1}`, legajo: a.legajo || "" })));
    } catch (e) {
      setError(e.message);
    } finally {
      setLoadingAlumnos(false);
    }
  };

  const loadEvaluaciones = async () => {
    setLoadingEvals(true);
    setError("");
    try {
      const hash = coms[0]?.hash;
      if (!hash) throw new Error("No se encontró el hash");
      const data = await api.getEvaluaciones(hash);
      setEvals(data.evaluaciones || []);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoadingEvals(false);
    }
  };

  useEffect(() => {
    if (tab === "parc") loadEvaluaciones();
  }, [tab]);

  const setE = (hash, v) => { setAlumnos((p) => p.map((a) => a.hash === hash ? { ...a, estado: v } : a)); setSaved(false); setSaveResults(null); };
  const allE = (v) => { setAlumnos((p) => p.map((a) => ({ ...a, estado: v }))); setSaved(false); setSaveResults(null); };

  const guardarAsistencia = async () => {
    setSaving(true);
    setError("");
    setSaveResults(null);
    try {
      // Build alumnos map {hash: estado}
      const alumnosMap = {};
      alumnos.forEach((a) => { alumnosMap[a.hash] = a.estado; });

      // Save to all selected comisiones
      const comisionesData = coms.map((c) => ({
        id: c.id,
        hash: c.hash,
        claseId: selectedClase.claseId,
      }));

      const result = await api.guardarAsistenciaBatch(comisionesData, alumnosMap);
      setSaveResults(result.results);
      setSaved(result.results.every((r) => r.ok));
    } catch (e) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  };

  const pres = alumnos.filter((a) => a.estado === 0).length;
  const aus = alumnos.filter((a) => a.estado > 0).length;

  const tabs = [{ id: "asist", l: "Asistencia", i: ico.clip }, { id: "parc", l: "Parciales", i: ico.cal }, { id: "cls", l: "Clases", i: ico.list }];

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 flex-wrap">
        <button onClick={onBack} className="p-2 rounded-lg" style={{ background: t.ghost, color: t.ghostText }}>{ico.back}</button>
        <div className="flex-1 min-w-0">
          <h2 className="text-lg font-bold truncate" style={{ color: t.text }}>{coms[0]?.materia || "Materia"}</h2>
          <p className="text-xs" style={{ color: t.textMut }}>{coms.length} comisiones · {tot} alumnos</p>
        </div>
      </div>

      <div className="flex flex-wrap gap-1.5">
        {coms.map((c) => <span key={c.id} className="px-2 py-0.5 rounded-full text-xs font-medium" style={{ background: t.greenBg, color: t.greenText, boxShadow: `inset 0 0 0 1px ${t.greenBorder}` }}>{c.id}</span>)}
      </div>

      {error && <ErrorBanner message={error} onDismiss={() => setError("")} />}

      <div className="flex gap-1 p-1 rounded-xl" style={{ background: t.surface }}>
        {tabs.map((tb) => (
          <button key={tb.id} onClick={() => { setTab(tb.id); setSelectedClase(null); }}
            className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-sm font-medium transition-all"
            style={tab === tb.id ? { background: t.greenBg, color: t.greenText } : { color: t.textMut }}>{tb.i} {tb.l}</button>
        ))}
      </div>

      {/* ── ASIST LIST ── */}
      {tab === "asist" && !selectedClase && (
        loadingClases ? <LoadingScreen message="Cargando clases..." /> : (
          <div className="space-y-2">
            {clases.dictadas.length > 0 && <h3 className="text-sm font-semibold" style={{ color: t.textSec }}>Clases dictadas</h3>}
            {clases.dictadas.map((cl, i) => (
              <button key={i} onClick={() => loadAsistencia(cl)} className="w-full text-left px-4 py-3 rounded-xl flex items-center justify-between transition-all"
                style={{ background: t.surface, border: `1px solid ${t.surfaceBorder}` }}>
                <div>
                  <div className="text-sm font-medium" style={{ color: t.text }}>{cl.fecha} — {cl.dia}</div>
                  <div className="text-xs" style={{ color: t.textMut }}>{cl.horario} · {cl.tipo}</div>
                </div>
                {cl.presentes != null && <div><span className="text-xs" style={{ color: t.greenText }}>{cl.presentes}P</span><span className="text-xs mx-0.5" style={{ color: t.textFaint }}>/</span><span className="text-xs" style={{ color: t.redText }}>{cl.ausentes}A</span></div>}
              </button>
            ))}
            {clases.sinDictar.length > 0 && <h3 className="text-sm font-semibold pt-3" style={{ color: t.textSec }}>Sin dictar</h3>}
            {clases.sinDictar.map((cl, i) => (
              <div key={i} className="px-4 py-2.5 rounded-xl flex items-center justify-between opacity-50"
                style={{ background: t.surface, border: `1px solid ${t.surfaceBorder}` }}>
                <div className="text-sm" style={{ color: t.textMut }}>{cl.fecha} — {cl.dia}</div>
                <span className="text-xs" style={{ color: t.textFaint }}>—</span>
              </div>
            ))}
            {clases.dictadas.length === 0 && clases.sinDictar.length === 0 && (
              <div className="text-center py-8">
                <p className="text-sm" style={{ color: t.textMut }}>No se encontraron clases para esta comisión.</p>
                <button onClick={loadClases} className="mt-3 px-4 py-2 rounded-lg text-sm" style={{ background: t.greenBg, color: t.greenText }}>Reintentar</button>
              </div>
            )}
          </div>
        )
      )}

      {/* ── ASIST DETAIL ── */}
      {tab === "asist" && selectedClase && (
        loadingAlumnos ? <LoadingScreen message="Cargando alumnos..." /> : (
          <div className="space-y-3">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <button onClick={() => { setSelectedClase(null); setSaveResults(null); }} className="text-xs flex items-center gap-1" style={{ color: t.greenText }}>{ico.back} Volver</button>
              <div className="text-sm" style={{ color: t.textMut }}>{selectedClase.fecha} · <span style={{ color: t.greenText }}>{pres}P</span> / <span style={{ color: t.redText }}>{aus}A</span></div>
            </div>

            <div className="flex items-start gap-2 px-3 py-2 rounded-lg text-xs" style={{ background: t.yellowBg, border: `1px solid ${t.yellowBorder}`, color: t.yellowText }}>
              <span className="shrink-0 mt-px">{ico.warn}</span> Se guardará en {coms.length} comisiones: {coms.map((c) => c.id).join(", ")}
            </div>

            {saveResults && (
              <div className="space-y-1">
                {saveResults.map((r, i) => (
                  <div key={i} className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs"
                    style={r.ok ? { background: t.greenBg, color: t.greenText } : { background: t.errBg, color: t.errText }}>
                    {r.ok ? "✓" : "✕"} {r.comision}: {r.ok ? "Guardado" : r.error || "Error"}
                  </div>
                ))}
              </div>
            )}

            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs" style={{ color: t.textMut }}>Todos:</span>
              <button onClick={() => allE(0)} className="px-2 py-1 rounded-md text-xs" style={{ background: t.greenBg, color: t.greenText }}>Presente</button>
              {Array.from({ length: hrs }, (_, i) => i + 1).map((h) => (
                <button key={h} onClick={() => allE(h)} className="px-2 py-1 rounded-md text-xs" style={{ background: t.redBg, color: t.redText }}>{h}h</button>
              ))}
              <div className="ml-auto flex items-center gap-1">
                <span className="text-xs" style={{ color: t.textFaint }}>Hs:</span>
                <select value={hrs} onChange={(e) => setHrs(+e.target.value)} className="px-1.5 py-0.5 rounded text-xs outline-none" style={{ background: t.inputBg, color: t.text, border: `1px solid ${t.inputBorder}` }}>
                  {[1, 2, 3, 4, 5, 6].map((h) => <option key={h} value={h} style={{ background: t.optBg }}>{h}</option>)}
                </select>
              </div>
            </div>

            {alumnos.length === 0 && (
              <div className="text-center py-8">
                <p className="text-sm" style={{ color: t.textMut }}>No se encontraron alumnos. Es posible que el parser necesite ajustes.</p>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
              {alumnos.map((a) => (
                <div key={a.hash} className="px-3 py-2 rounded-lg flex items-center justify-between"
                  style={a.estado > 0 ? { background: t.redBg, boxShadow: `inset 0 0 0 1px ${t.redBorder}` } : { background: t.surface, boxShadow: `inset 0 0 0 1px ${t.surfaceBorder}` }}>
                  <div className="min-w-0 mr-2">
                    <div className="text-sm font-medium truncate" style={{ color: a.estado > 0 ? t.redText : t.text }}>{a.nombre}</div>
                    {a.legajo && <div className="text-xs" style={{ color: t.textFaint }}>{a.legajo}</div>}
                  </div>
                  <select value={a.estado} onChange={(e) => setE(a.hash, +e.target.value)} className="px-2 py-1 rounded-md text-xs font-medium outline-none cursor-pointer shrink-0"
                    style={a.estado === 0 ? { background: t.greenBg, color: t.greenText, border: `1px solid ${t.greenBorder}` } : { background: t.redBg, color: t.redText, border: `1px solid ${t.redBorder}` }}>
                    <option value={0} style={{ background: t.optBg }}>Presente</option>
                    {Array.from({ length: hrs }, (_, i) => i + 1).map((h) => <option key={h} value={h} style={{ background: t.optBg }}>{h} {h === 1 ? "Hora" : "Horas"}</option>)}
                  </select>
                </div>
              ))}
            </div>

            {alumnos.length > 0 && (
              <div className="sticky bottom-4 pt-2">
                <button onClick={guardarAsistencia} disabled={saving}
                  className="w-full py-3 rounded-xl text-sm font-bold flex items-center justify-center gap-2 text-white shadow-lg hover:brightness-110 active:scale-[0.99] transition-all"
                  style={{ background: saved ? "#16a34a" : "linear-gradient(135deg, #22c55e, #16a34a)" }}>
                  {saving ? <><Spinner size={16} /> Guardando en {coms.length} comisiones...</>
                    : saved ? <>{ico.chk} ¡Guardado en {coms.length} comisiones!</>
                    : <>Guardar asistencia ({coms.length} comisiones)</>}
                </button>
              </div>
            )}
          </div>
        )
      )}

      {/* ── PARCIALES ── */}
      {tab === "parc" && (
        loadingEvals ? <LoadingScreen message="Cargando evaluaciones..." /> : (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold" style={{ color: t.textSec }}>Evaluaciones</h3>
            </div>
            <div className="flex items-start gap-2 px-3 py-2 rounded-lg text-xs" style={{ background: t.yellowBg, border: `1px solid ${t.yellowBorder}`, color: t.yellowText }}>
              <span className="shrink-0 mt-px">{ico.warn}</span> Las acciones se aplicarán a {coms.length} comisiones
            </div>
            {evals.length === 0 && (
              <div className="text-center py-8">
                <p className="text-sm" style={{ color: t.textMut }}>No se encontraron evaluaciones.</p>
              </div>
            )}
            {evals.map((ev, i) => (
              <div key={i} className="px-4 py-3 rounded-xl flex items-center justify-between" style={{ background: t.surface, border: `1px solid ${t.surfaceBorder}` }}>
                <div>
                  <div className="text-sm font-medium" style={{ color: t.text }}>{ev.nombre}</div>
                  <div className="text-xs" style={{ color: t.textMut }}>{ev.tipo} · {ev.fecha} · {ev.estado}</div>
                </div>
                <div className="flex items-center gap-2">
                  <button className="px-2.5 py-1 rounded-md text-xs" style={{ background: t.ghost, color: t.ghostText }}>Editar</button>
                  <button className="px-2.5 py-1 rounded-md text-xs" style={{ background: t.greenBg, color: t.greenText }}>Cargar</button>
                </div>
              </div>
            ))}
          </div>
        )
      )}

      {/* ── CLASES TABLE ── */}
      {tab === "cls" && (
        loadingClases ? <LoadingScreen message="Cargando clases..." /> : (
          <div className="space-y-3">
            <h3 className="text-sm font-semibold" style={{ color: t.textSec }}>Todas las clases</h3>
            <div className="overflow-x-auto rounded-xl" style={{ border: `1px solid ${t.surfaceBorder}` }}>
              <table className="w-full text-sm">
                <thead>
                  <tr style={{ borderBottom: `1px solid ${t.tblBorder}` }}>
                    {["Fecha", "Día", "Horario", "Tipo", "P/A"].map((h, i) => (
                      <th key={h} className={`${i > 3 ? "text-center" : "text-left"} py-2 px-3 text-xs font-medium`} style={{ color: t.textMut, background: t.surface }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {[...clases.dictadas, ...clases.sinDictar].map((cl, i) => (
                    <tr key={i} style={{ borderBottom: `1px solid ${t.tblBorder}` }}>
                      <td className="py-2 px-3" style={{ color: t.text }}>{cl.fecha}</td>
                      <td className="py-2 px-3" style={{ color: t.textMut }}>{cl.dia}</td>
                      <td className="py-2 px-3" style={{ color: t.textMut }}>{cl.horario}</td>
                      <td className="py-2 px-3" style={{ color: t.textMut }}>{cl.tipo}</td>
                      <td className="py-2 px-3 text-center">
                        {cl.presentes != null ? <><span style={{ color: t.greenText }}>{cl.presentes}</span><span style={{ color: t.textFaint }}>/</span><span style={{ color: t.redText }}>{cl.ausentes}</span></> : <span style={{ color: t.textFaint }}>—</span>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )
      )}
    </div>
  );
}

// ── MAIN ──
export default function App() {
  const [logged, setLogged] = useState(false);
  const [nombre, setNombre] = useState("");
  const [selComs, setSelComs] = useState(null);
  const [dark, setDark] = useState(false);
  const t = dark ? themes.dark : themes.light;

  const handleLogin = (name, session) => {
    setNombre(name);
    setLogged(true);
  };

  const logout = () => {
    api.clearSession();
    setLogged(false);
    setSelComs(null);
    setNombre("");
  };

  return (
    <ThemeCtx.Provider value={t}>
      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
      {!logged ? (
        <Login onLogin={handleLogin} dark={dark} setDark={setDark} />
      ) : (
        <div className="min-h-screen" style={{ background: t.bgGrad }}>
          <header className="sticky top-0 z-40 px-4 py-2.5 flex items-center justify-between" style={{ background: t.headerBg, borderBottom: `1px solid ${t.headerBorder}`, backdropFilter: "blur(16px)" }}>
            <div className="flex items-center gap-2.5 cursor-pointer" onClick={() => setSelComs(null)}>
              <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: t.greenBg }}>{capSvg(t.greenText)}</div>
              <span className="text-sm font-bold tracking-tight" style={{ color: t.text }}>Guaraní Unificado</span>
            </div>
            <div className="flex items-center gap-1.5">
              <button onClick={() => setDark(!dark)} className="p-2 rounded-lg" style={{ background: t.ghost, color: t.ghostText }} title={dark ? "Tema claro" : "Tema oscuro"}>
                {dark ? ico.sun : ico.moon}
              </button>
              <span className="text-xs hidden sm:inline mx-1" style={{ color: t.textMut }}>{nombre}</span>
              <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold" style={{ background: t.avatarBg, color: t.avatarText }}>
                {nombre ? nombre.split(" ").map((w) => w[0]).slice(0, 2).join("") : "?"}
              </div>
              <button onClick={logout} className="p-2 rounded-lg flex items-center gap-1 text-xs" style={{ background: t.ghost, color: t.ghostText }} title="Cerrar sesión">
                {ico.logout}
                <span className="hidden sm:inline">Salir</span>
              </button>
            </div>
          </header>
          <main className="max-w-4xl mx-auto px-4 py-6">
            {selComs ? <Unified coms={selComs} onBack={() => setSelComs(null)} /> : <Dash onGo={setSelComs} />}
          </main>
        </div>
      )}
    </ThemeCtx.Provider>
  );
}