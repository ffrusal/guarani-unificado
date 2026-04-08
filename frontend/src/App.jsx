import { useState, createContext, useContext } from "react";

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
  },
};

// ── Mock Data ──
const COMISIONES = [
  { id: "3-B-501-15_20", materia: "Ética", codigo: "501-15-2240", periodo: "2026 - PS y PSP 1 C", ubicacion: "Campus Ntra. Sra. del Pilar", turno: "Mañana", inscriptos: 70 },
  { id: "4-2-NO-19-04-06", materia: "Ética Profesional", codigo: "4707", periodo: "2026 - ING 1C", ubicacion: "Campus Ntra. Sra. del Pilar", turno: "Mañana", inscriptos: 35 },
  { id: "3-2-NO-15-02-06", materia: "Ética Profesional", codigo: "3992", periodo: "2026 - MEDI 1C", ubicacion: "Facultad de Medicina", turno: "Mañana", inscriptos: 40 },
  { id: "3-2-NOCH-06P21A_0", materia: "Ética Profesional", codigo: "5738", periodo: "2026 - PS y PSP 1C", ubicacion: "Campus Pilar", turno: "Noche", inscriptos: 25 },
  { id: "3-2-NO-19-11-06", materia: "Ética Profesional", codigo: "6564", periodo: "2026 - ING 1C", ubicacion: "Campus Pilar", turno: "Mañana", inscriptos: 30 },
  { id: "1-436-13", materia: "Sem. Filosófico-Teológico", codigo: "436-13-229", periodo: "2026 - MEDI 1C", ubicacion: "Facultad de Medicina", turno: "Sin definir", inscriptos: 50 },
];

const CLASES = [
  { id: 804060, fecha: "12/03/2026", dia: "Jueves", horario: "09:00 a 12:00", tipo: "Teórico-Práctica", p: 58, a: 7 },
  { id: 686377, fecha: "19/03/2026", dia: "Jueves", horario: "09:00 a 12:00", tipo: "Teórico-Práctica", p: 59, a: 9 },
  { id: 686378, fecha: "26/03/2026", dia: "Jueves", horario: "09:00 a 12:00", tipo: "Teórico-Práctica", p: null, a: null },
];

const FUTURAS = [
  { fecha: "09/04/2026", dia: "Jueves", horario: "09:00 a 12:00", tipo: "Teórico-Práctica" },
  { fecha: "16/04/2026", dia: "Jueves", horario: "09:00 a 12:00", tipo: "Teórico-Práctica" },
  { fecha: "23/04/2026", dia: "Jueves", horario: "09:00 a 12:00", tipo: "Teórico-Práctica" },
  { fecha: "30/04/2026", dia: "Jueves", horario: "09:00 a 12:00", tipo: "Teórico-Práctica" },
];

const ALUMNOS_INIT = [
  { h: "a1", nombre: "RODRIGUEZ, Lucas", leg: "204878", e: 0 },
  { h: "a2", nombre: "ROLDAN, MILENA", leg: "201355", e: 0 },
  { h: "a3", nombre: "SAAVEDRA GARAY, Irene", leg: "204878", e: 0 },
  { h: "a4", nombre: "SAIDEL, Uma", leg: "201355", e: 0 },
  { h: "a5", nombre: "SANCHEZ, Santiago Luis", leg: "", e: 0 },
  { h: "a6", nombre: "SCANNONE, Sol", leg: "", e: 0 },
  { h: "a7", nombre: "SCHUVIK, ROCIO", leg: "", e: 0 },
  { h: "a8", nombre: "TAQUINI, FELIX", leg: "", e: 0 },
  { h: "a9", nombre: "TRO, Marcos", leg: "", e: 4 },
  { h: "a10", nombre: "TURKIENIEZ, Malena Belén", leg: "205200", e: 0 },
  { h: "a11", nombre: "VELAZQUEZ, Martina Sol", leg: "196295", e: 0 },
  { h: "a12", nombre: "ZUNINO, MORENA", leg: "", e: 0 },
];

const EVALS = [
  { nombre: "1º Parcial", tipo: "Parcial", fecha: "23/04/2026", estado: "Abierta" },
  { nombre: "2º Parcial", tipo: "Parcial", fecha: "04/06/2026", estado: "Abierta" },
];

// ── SVG Icons ──
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

// ── Btn helper ──
const Btn = ({ children, style: s, ...p }) => <button {...p} style={s} className="transition-all active:scale-[0.97]">{children}</button>;

// ── LOGIN ──
function Login({ onLogin, dark, setDark }) {
  const t = useTheme();
  const [user, setUser] = useState(""); const [pass, setPass] = useState(""); const [loading, setLoading] = useState(false);
  const go = () => { setLoading(true); setTimeout(() => { setLoading(false); onLogin(); }, 1200); };

  return (
    <div className="min-h-screen flex items-center justify-center relative" style={{ background: t.loginBg }}>
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
        <div className="rounded-2xl p-5" style={{ background: t.loginCard, border: `1px solid ${t.loginCardBorder}`, backdropFilter: "blur(12px)" }}>
          <div className="mb-3">
            <label className="block text-xs font-medium mb-1" style={{ color: t.textMut }}>Usuario</label>
            <input type="text" value={user} onChange={(e) => setUser(e.target.value)} placeholder="ej: ffernandezruiz"
              className="w-full px-3 py-2 rounded-lg text-sm outline-none focus:ring-2 focus:ring-green-500/40"
              style={{ background: t.loginInputBg, border: `1px solid ${t.inputBorder}`, color: t.text }} />
          </div>
          <div className="mb-5">
            <label className="block text-xs font-medium mb-1" style={{ color: t.textMut }}>Contraseña</label>
            <input type="password" value={pass} onChange={(e) => setPass(e.target.value)} placeholder="••••••••"
              className="w-full px-3 py-2 rounded-lg text-sm outline-none focus:ring-2 focus:ring-green-500/40"
              style={{ background: t.loginInputBg, border: `1px solid ${t.inputBorder}`, color: t.text }} />
          </div>
          <button onClick={go} disabled={loading}
            className="w-full py-2.5 rounded-lg text-sm font-semibold text-white flex items-center justify-center gap-2 transition-all hover:brightness-110 active:scale-[0.98]"
            style={{ background: "linear-gradient(135deg, #22c55e, #16a34a)" }}>
            {loading ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <>{ico.login} Conectar</>}
          </button>
        </div>
        <p className="text-center text-xs mt-3" style={{ color: t.textFaint }}>Conexión directa a autogestion.usal.edu.ar</p>
      </div>
    </div>
  );
}

// ── DASHBOARD ──
function Dash({ comisiones, onGo }) {
  const t = useTheme();
  const [sel, setSel] = useState(new Set());
  const grouped = {}; comisiones.forEach((c) => { if (!grouped[c.materia]) grouped[c.materia] = []; grouped[c.materia].push(c); });
  const toggle = (id) => setSel((p) => { const n = new Set(p); n.has(id) ? n.delete(id) : n.add(id); return n; });
  const selAll = (m) => { const ids = grouped[m].map((c) => c.id); setSel((p) => { const n = new Set(p); const a = ids.every((i) => n.has(i)); ids.forEach((i) => a ? n.delete(i) : n.add(i)); return n; }); };
  const tot = comisiones.filter((c) => sel.has(c.id)).reduce((a, c) => a + c.inscriptos, 0);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-lg font-bold" style={{ color: t.text }}>Mis Comisiones</h2>
          <p className="text-xs mt-0.5" style={{ color: t.textMut }}>Seleccioná las comisiones a unificar</p>
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
                      <div className="text-xs" style={{ color: t.textMut }}>{c.periodo} · {c.ubicacion}</div>
                    </div>
                  </div>
                  <div className="text-right shrink-0 ml-2">
                    <div className="text-sm" style={{ color: t.textSec }}>{c.inscriptos}</div>
                    <div className="text-xs" style={{ color: t.textMut }}>{c.turno}</div>
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
  const [clase, setClase] = useState(null);
  const [als, setAls] = useState(ALUMNOS_INIT.map((a) => ({ ...a })));
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [hrs, setHrs] = useState(3);
  const [showModal, setShowModal] = useState(false);
  const [nev, setNev] = useState({ n: "", tipo: "Parcial", f: "", v: true });

  const tot = coms.reduce((a, c) => a + c.inscriptos, 0);
  const setE = (h, v) => { setAls((p) => p.map((a) => a.h === h ? { ...a, e: v } : a)); setSaved(false); };
  const allE = (v) => { setAls((p) => p.map((a) => ({ ...a, e: v }))); setSaved(false); };
  const save = () => { setSaving(true); setTimeout(() => { setSaving(false); setSaved(true); }, 2000); };
  const pres = als.filter((a) => a.e === 0).length;
  const aus = als.filter((a) => a.e > 0).length;

  const tabs = [{ id: "asist", l: "Asistencia", i: ico.clip }, { id: "parc", l: "Parciales", i: ico.cal }, { id: "cls", l: "Clases", i: ico.list }];

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 flex-wrap">
        <button onClick={onBack} className="p-2 rounded-lg" style={{ background: t.ghost, color: t.ghostText }}>{ico.back}</button>
        <div className="flex-1 min-w-0">
          <h2 className="text-lg font-bold truncate" style={{ color: t.text }}>{coms[0]?.materia}</h2>
          <p className="text-xs" style={{ color: t.textMut }}>{coms.length} comisiones · {tot} alumnos</p>
        </div>
      </div>

      <div className="flex flex-wrap gap-1.5">
        {coms.map((c) => <span key={c.id} className="px-2 py-0.5 rounded-full text-xs font-medium" style={{ background: t.greenBg, color: t.greenText, boxShadow: `inset 0 0 0 1px ${t.greenBorder}` }}>{c.id}</span>)}
      </div>

      <div className="flex gap-1 p-1 rounded-xl" style={{ background: t.surface }}>
        {tabs.map((tb) => (
          <button key={tb.id} onClick={() => { setTab(tb.id); setClase(null); }}
            className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-sm font-medium transition-all"
            style={tab === tb.id ? { background: t.greenBg, color: t.greenText } : { color: t.textMut }}>{tb.i} {tb.l}</button>
        ))}
      </div>

      {/* ── ASIST LIST ── */}
      {tab === "asist" && !clase && (
        <div className="space-y-2">
          <h3 className="text-sm font-semibold" style={{ color: t.textSec }}>Clases dictadas</h3>
          {CLASES.map((cl) => (
            <button key={cl.id} onClick={() => setClase(cl)} className="w-full text-left px-4 py-3 rounded-xl flex items-center justify-between transition-all"
              style={{ background: t.surface, border: `1px solid ${t.surfaceBorder}` }}>
              <div>
                <div className="text-sm font-medium" style={{ color: t.text }}>{cl.fecha} — {cl.dia}</div>
                <div className="text-xs" style={{ color: t.textMut }}>{cl.horario} · {cl.tipo}</div>
              </div>
              {cl.p != null && <div><span className="text-xs" style={{ color: t.greenText }}>{cl.p}P</span><span className="text-xs mx-0.5" style={{ color: t.textFaint }}>/</span><span className="text-xs" style={{ color: t.redText }}>{cl.a}A</span></div>}
            </button>
          ))}
          <h3 className="text-sm font-semibold pt-3" style={{ color: t.textSec }}>Sin dictar</h3>
          {FUTURAS.map((cl, i) => (
            <div key={i} className="px-4 py-2.5 rounded-xl flex items-center justify-between opacity-50"
              style={{ background: t.surface, border: `1px solid ${t.surfaceBorder}` }}>
              <div className="text-sm" style={{ color: t.textMut }}>{cl.fecha} — {cl.dia}</div>
              <span className="text-xs" style={{ color: t.textFaint }}>—</span>
            </div>
          ))}
        </div>
      )}

      {/* ── ASIST DETAIL ── */}
      {tab === "asist" && clase && (
        <div className="space-y-3">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <button onClick={() => setClase(null)} className="text-xs flex items-center gap-1" style={{ color: t.greenText }}>{ico.back} Volver</button>
            <div className="text-sm" style={{ color: t.textMut }}>{clase.fecha} · <span style={{ color: t.greenText }}>{pres}P</span> / <span style={{ color: t.redText }}>{aus}A</span></div>
          </div>

          <div className="flex items-start gap-2 px-3 py-2 rounded-lg text-xs" style={{ background: t.yellowBg, border: `1px solid ${t.yellowBorder}`, color: t.yellowText }}>
            <span className="shrink-0 mt-px">{ico.warn}</span> Se guardará en {coms.length} comisiones: {coms.map((c) => c.id).join(", ")}
          </div>

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

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
            {als.map((a) => (
              <div key={a.h} className="px-3 py-2 rounded-lg flex items-center justify-between"
                style={a.e > 0 ? { background: t.redBg, boxShadow: `inset 0 0 0 1px ${t.redBorder}` } : { background: t.surface, boxShadow: `inset 0 0 0 1px ${t.surfaceBorder}` }}>
                <div className="min-w-0 mr-2">
                  <div className="text-sm font-medium truncate" style={{ color: a.e > 0 ? t.redText : t.text }}>{a.nombre}</div>
                  {a.leg && <div className="text-xs" style={{ color: t.textFaint }}>{a.leg}</div>}
                </div>
                <select value={a.e} onChange={(e) => setE(a.h, +e.target.value)} className="px-2 py-1 rounded-md text-xs font-medium outline-none cursor-pointer shrink-0"
                  style={a.e === 0 ? { background: t.greenBg, color: t.greenText, border: `1px solid ${t.greenBorder}` } : { background: t.redBg, color: t.redText, border: `1px solid ${t.redBorder}` }}>
                  <option value={0} style={{ background: t.optBg }}>Presente</option>
                  {Array.from({ length: hrs }, (_, i) => i + 1).map((h) => <option key={h} value={h} style={{ background: t.optBg }}>{h} {h === 1 ? "Hora" : "Horas"}</option>)}
                </select>
              </div>
            ))}
          </div>

          <div className="sticky bottom-4 pt-2">
            <button onClick={save} disabled={saving}
              className="w-full py-3 rounded-xl text-sm font-bold flex items-center justify-center gap-2 text-white shadow-lg hover:brightness-110 active:scale-[0.99] transition-all"
              style={{ background: saved ? "#16a34a" : "linear-gradient(135deg, #22c55e, #16a34a)" }}>
              {saving ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Guardando en {coms.length} comisiones...</>
                : saved ? <>{ico.chk} ¡Guardado en {coms.length} comisiones!</>
                : <>Guardar asistencia ({coms.length} comisiones)</>}
            </button>
          </div>
        </div>
      )}

      {/* ── PARCIALES ── */}
      {tab === "parc" && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold" style={{ color: t.textSec }}>Evaluaciones</h3>
            <button onClick={() => setShowModal(true)} className="px-3 py-1.5 rounded-lg text-xs font-medium" style={{ background: t.greenBg, color: t.greenText }}>+ Crear evaluación</button>
          </div>
          <div className="flex items-start gap-2 px-3 py-2 rounded-lg text-xs" style={{ background: t.yellowBg, border: `1px solid ${t.yellowBorder}`, color: t.yellowText }}>
            <span className="shrink-0 mt-px">{ico.warn}</span> Se crearán en {coms.length} comisiones simultáneamente
          </div>
          {EVALS.map((ev, i) => (
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

          {showModal && (
            <div className="fixed inset-0 flex items-center justify-center z-50 p-4" style={{ background: t.modalOv }}>
              <div className="w-full max-w-md rounded-2xl p-5 space-y-4" style={{ background: t.modalBg, border: `1px solid ${t.surfaceBorder}` }}>
                <h3 className="text-base font-bold" style={{ color: t.text }}>Nueva evaluación</h3>
                <p className="text-xs px-3 py-2 rounded-lg" style={{ background: t.yellowBg, color: t.yellowText }}>Se creará en: {coms.map((c) => c.id).join(", ")}</p>
                <div>
                  <label className="block text-xs mb-1" style={{ color: t.textMut }}>Nombre</label>
                  <input value={nev.n} onChange={(e) => setNev({ ...nev, n: e.target.value })} placeholder="ej: 1º Parcial"
                    className="w-full px-3 py-2 rounded-lg text-sm outline-none focus:ring-2 focus:ring-green-500/40" style={{ background: t.inputBg, border: `1px solid ${t.inputBorder}`, color: t.text }} />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs mb-1" style={{ color: t.textMut }}>Tipo</label>
                    <select value={nev.tipo} onChange={(e) => setNev({ ...nev, tipo: e.target.value })} className="w-full px-3 py-2 rounded-lg text-sm outline-none" style={{ background: t.inputBg, border: `1px solid ${t.inputBorder}`, color: t.text }}>
                      {["Parcial", "TP", "Final", "Recuperatorio"].map((o) => <option key={o} style={{ background: t.optBg }}>{o}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs mb-1" style={{ color: t.textMut }}>Fecha</label>
                    <input type="date" value={nev.f} onChange={(e) => setNev({ ...nev, f: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg text-sm outline-none" style={{ background: t.inputBg, border: `1px solid ${t.inputBorder}`, color: t.text }} />
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <input type="checkbox" checked={nev.v} onChange={(e) => setNev({ ...nev, v: e.target.checked })} className="accent-green-500" />
                  <span className="text-xs" style={{ color: t.textMut }}>Visible para alumnos</span>
                </div>
                <div className="flex gap-2 pt-1">
                  <button onClick={() => setShowModal(false)} className="flex-1 py-2 rounded-lg text-sm" style={{ background: t.ghost, color: t.ghostText }}>Cancelar</button>
                  <button onClick={() => { setShowModal(false); setNev({ n: "", tipo: "Parcial", f: "", v: true }); }}
                    className="flex-1 py-2 rounded-lg text-sm font-semibold text-white hover:brightness-110" style={{ background: "linear-gradient(135deg, #22c55e, #16a34a)" }}>
                    Crear en {coms.length} comisiones
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── CLASES TABLE ── */}
      {tab === "cls" && (
        <div className="space-y-3">
          <h3 className="text-sm font-semibold" style={{ color: t.textSec }}>Todas las clases</h3>
          <div className="overflow-x-auto rounded-xl" style={{ border: `1px solid ${t.surfaceBorder}` }}>
            <table className="w-full text-sm">
              <thead>
                <tr style={{ borderBottom: `1px solid ${t.tblBorder}` }}>
                  {["Fecha", "Horario", "Tipo", "P/A", "Temas"].map((h, i) => (
                    <th key={h} className={`${i > 2 ? "text-center" : "text-left"} py-2 px-3 text-xs font-medium`} style={{ color: t.textMut, background: t.surface }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {[...CLASES, ...FUTURAS.map((f) => ({ ...f, p: null, a: null }))].map((cl, i) => (
                  <tr key={i} style={{ borderBottom: `1px solid ${t.tblBorder}` }}>
                    <td className="py-2 px-3" style={{ color: t.text }}>{cl.fecha}</td>
                    <td className="py-2 px-3" style={{ color: t.textMut }}>{cl.horario}</td>
                    <td className="py-2 px-3" style={{ color: t.textMut }}>{cl.tipo}</td>
                    <td className="py-2 px-3 text-center">
                      {cl.p != null ? <><span style={{ color: t.greenText }}>{cl.p}</span><span style={{ color: t.textFaint }}>/</span><span style={{ color: t.redText }}>{cl.a}</span></> : <span style={{ color: t.textFaint }}>—</span>}
                    </td>
                    <td className="py-2 px-3 text-center text-xs" style={{ color: t.textFaint }}>—</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

// ── MAIN ──
export default function App() {
  const [logged, setLogged] = useState(false);
  const [selComs, setSelComs] = useState(null);
  const [dark, setDark] = useState(false);
  const t = dark ? themes.dark : themes.light;

  const logout = () => { setLogged(false); setSelComs(null); };

  return (
    <ThemeCtx.Provider value={t}>
      {!logged ? (
        <Login onLogin={() => setLogged(true)} dark={dark} setDark={setDark} />
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
              <span className="text-xs hidden sm:inline mx-1" style={{ color: t.textMut }}>F. Fernandez Ruiz</span>
              <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold" style={{ background: t.avatarBg, color: t.avatarText }}>FF</div>
              <button onClick={logout} className="p-2 rounded-lg flex items-center gap-1 text-xs" style={{ background: t.ghost, color: t.ghostText }} title="Cerrar sesión">
                {ico.logout}
                <span className="hidden sm:inline">Salir</span>
              </button>
            </div>
          </header>
          <main className="max-w-4xl mx-auto px-4 py-6">
            {selComs ? <Unified coms={selComs} onBack={() => setSelComs(null)} /> : <Dash comisiones={COMISIONES} onGo={setSelComs} />}
          </main>
        </div>
      )}
    </ThemeCtx.Provider>
  );
}
