// Guaraní Unificado - Cloudflare Worker v5
// Changes from v4: improved evaluaciones parser, crear evaluacion endpoint
const BASE = "https://autogestion.usal.edu.ar/autogestion";

function corsHeaders(origin) {
  return {
    "Access-Control-Allow-Origin": origin || "*",
    "Access-Control-Allow-Methods": "GET, POST, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Usuario",
    "Access-Control-Allow-Credentials": "true",
  };
}

async function gFetch(path, session, opts = {}) {
  const url = path.startsWith("http") ? path : `${BASE}/${path}`;
  return fetch(url, {
    method: opts.method || "GET",
    headers: {
      "Cookie": session,
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36",
      "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      "Accept-Language": "es-419,es;q=0.9",
      ...opts.headers,
    },
    body: opts.body,
    redirect: opts.redirect || "follow",
  });
}

async function gText(response) {
  const buf = await response.arrayBuffer();
  return new TextDecoder("iso-8859-1").decode(buf);
}

// ── Extract HTML content from Guaraní's on_arrival() ──
function extractContent(rawText) {
  let html = rawText;
  try {
    const outer = JSON.parse(rawText);
    if (outer.cont) html = outer.cont;
  } catch (e) {}

  const marker = "on_arrival(";
  const idx = html.indexOf(marker);
  if (idx === -1) return html;

  const jsonStart = idx + marker.length;
  let depth = 0, inString = false, escape = false, jsonEnd = -1;
  for (let i = jsonStart; i < html.length; i++) {
    const ch = html[i];
    if (escape) { escape = false; continue; }
    if (ch === '\\') { escape = true; continue; }
    if (ch === '"' && !escape) { inString = !inString; continue; }
    if (inString) continue;
    if (ch === '{') depth++;
    if (ch === '}') { depth--; if (depth === 0) { jsonEnd = i + 1; break; } }
  }
  if (jsonEnd === -1) return html;

  const jsonStr = html.substring(jsonStart, jsonEnd);
  try {
    const obj = JSON.parse(jsonStr);
    if (obj.content) return obj.content;
  } catch (e) {}
  return html;
}

function extractAll(html, regex) {
  const matches = [];
  let m;
  while ((m = regex.exec(html)) !== null) matches.push(m);
  return matches;
}

function extractAllContents(rawText) {
  const contents = [];
  const marker = "on_arrival(";
  let searchFrom = 0;
  while (true) {
    const idx = rawText.indexOf(marker, searchFrom);
    if (idx === -1) break;
    const jsonStart = idx + marker.length;
    let depth = 0, inString = false, escape = false, jsonEnd = -1;
    for (let i = jsonStart; i < rawText.length; i++) {
      const ch = rawText[i];
      if (escape) { escape = false; continue; }
      if (ch === '\\') { escape = true; continue; }
      if (ch === '"' && !escape) { inString = !inString; continue; }
      if (inString) continue;
      if (ch === '{') depth++;
      if (ch === '}') { depth--; if (depth === 0) { jsonEnd = i + 1; break; } }
    }
    if (jsonEnd === -1) break;
    try {
      const obj = JSON.parse(rawText.substring(jsonStart, jsonEnd));
      if (obj.content) contents.push(obj.content);
    } catch (e) {}
    searchFrom = jsonEnd;
  }
  return contents.join("\n");
}

// ── Parse comisiones ──
function parseComisiones(rawText) {
  const content = extractContent(rawText);
  const comisiones = [];
  const trRegex = /<tr[^>]*data-link=['"](.*?)['"][^>]*>([\s\S]*?)<\/tr>/g;
  const rows = extractAll(content, trRegex);

  for (const row of rows) {
    const dataLink = row[1];
    const rowContent = row[2];
    const hashMatch = dataLink.match(/home\/([a-f0-9]+)/);
    if (!hashMatch) continue;
    const hash = hashMatch[1];
    const aMatch = rowContent.match(/<a[^>]*>([^<]+)<\/a>/);
    const comisionId = aMatch ? aMatch[1].trim() : "";
    const tdRegex = /<td[^>]*>([\s\S]*?)<\/td>/g;
    const tds = extractAll(rowContent, tdRegex);
    const clean = (idx) => tds[idx] ? tds[idx][1].replace(/<[^>]*>/g, "").trim() : "";
    const rowPos = content.indexOf(row[0]);
    const before = content.substring(Math.max(0, rowPos - 500), rowPos);
    let materia = "Sin nombre";
    const materiaMatch = before.match(/class=['"]header-actividad['"][^>]*>([\s\S]*?)<\/th>/);
    if (materiaMatch) {
      materia = materiaMatch[1].replace(/<[^>]*>/g, "").trim();
      const codeMatch = materia.match(/^(.+?)\s*\([^)]+\)\s*$/);
      if (codeMatch) materia = codeMatch[1].trim();
    }
    comisiones.push({
      id: comisionId, hash, materia,
      subcomision: clean(1), ubicacion: clean(2),
      responsabilidad: clean(3), turno: clean(4),
      inscriptos: parseInt(clean(5)) || 0,
    });
  }
  return comisiones;
}

// ── Parse clases ──
function parseClases(rawText) {
  const html = extractContent(rawText);
  const dictadas = [], sinDictar = [];
  const parseSec = (secHtml, arr, isDictada) => {
    if (!secHtml) return;
    const trRegex = /<tr[^>]*>([\s\S]*?)<\/tr>/g;
    const rows = extractAll(secHtml, trRegex);
    for (const row of rows) {
      const c = row[1];
      if (c.includes("<th")) continue;
      const tdRegex = /<td[^>]*>([\s\S]*?)<\/td>/g;
      const tds = extractAll(c, tdRegex);
      if (tds.length < 4) continue;
      const cl = (s) => s.replace(/<[^>]*>/g, "").trim();
      const am = c.match(/asistencias\/([a-f0-9]+)\/(\d+)/);
      const clase = { fecha: cl(tds[0][1]), dia: cl(tds[1][1]), horario: cl(tds[2][1]), tipo: cl(tds[3][1]) };
      if (isDictada) {
        if (tds.length >= 5) {
          const pa = cl(tds[4][1]).match(/(\d+)\s*-\s*(\d+)/);
          clase.presentes = pa ? parseInt(pa[1]) : null;
          clase.ausentes = pa ? parseInt(pa[2]) : null;
        }
        clase.asistenciaHash = am ? am[1] : null;
        clase.claseId = am ? am[2] : null;
        arr.push(clase);
      } else { arr.push(clase); }
    }
  };
  const d = html.match(/Clases dictadas([\s\S]*?)(?:Clases sin dictar|$)/i);
  const s = html.match(/Clases sin dictar([\s\S]*?)$/i);
  parseSec(d?.[1], dictadas, true);
  parseSec(s?.[1], sinDictar, false);
  let asistenciaBaseHash = null;
  if (dictadas.length > 0 && dictadas[0].asistenciaHash) asistenciaBaseHash = dictadas[0].asistenciaHash;
  // Extract temas hash from navigation pills (same per comision)
  const temasMatch = rawText.match(/temas_dictados\/([a-f0-9]+)/);
  const temasBaseHash = temasMatch ? temasMatch[1] : null;
  return { dictadas, sinDictar, asistenciaBaseHash, temasBaseHash };
}

// ── Parse alumnos ──
function parseAlumnos(rawText) {
  const html = extractAllContents(rawText);
  const alumnos = [];
  const selRegex = /name="alumnos\[([a-f0-9]+)\]\[PRESENTE\]"[\s\S]*?<\/select>/g;
  const sels = extractAll(html, selRegex);
  for (const sel of sels) {
    const hash = sel[1];
    const sh = sel[0];
    const sm = sh.match(/selected[^>]*value="(\d+)"|value="(\d+)"[^>]*selected/);
    alumnos.push({ hash, estado: sm ? parseInt(sm[1] || sm[2]) : 0, nombre: "", legajo: "" });
  }
  const nameRegex = /class="truncate"[^>]*>([^<]+)<\/div>/g;
  const names = extractAll(html, nameRegex);
  for (let i = 0; i < Math.min(names.length, alumnos.length); i++) alumnos[i].nombre = names[i][1].trim();
  const boxRegex = /class='box-asistencia[^']*'>([\s\S]*?)<\/div><\/div><\/div>/g;
  const boxes = extractAll(html, boxRegex);
  for (let i = 0; i < Math.min(boxes.length, alumnos.length); i++) {
    const legMatch = boxes[i][1].match(/<div>(\d{4,6})<\/div>/);
    if (legMatch) alumnos[i].legajo = legMatch[1];
  }
  return alumnos;
}

// ── Parse evaluaciones (improved v5) ──
// Extracts full eval data + action hashes + crearHash from ver_comision page
function parseEvaluaciones(rawText) {
  const content = extractContent(rawText);
  const evals = [];

  // Extract "Crear evaluación" link hash
  let crearHash = null;
  const crearMatch = content.match(/nueva_evaluacion\/([a-f0-9]+)/);
  if (crearMatch) crearHash = crearMatch[1];

  // Parse eval rows
  const rowRegex = /<tr class=['"]\s*evaluacion-fila\s*['"][^>]*>([\s\S]*?)<\/tr>/g;
  const rows = extractAll(content, rowRegex);

  for (const row of rows) {
    const c = row[1];
    const tdRegex = /<td[^>]*>([\s\S]*?)<\/td>/g;
    const tds = extractAll(c, tdRegex);
    const cl = (s) => s.replace(/<[^>]*>/g, "").trim();

    if (tds.length < 6) continue;

    // Extract action hashes from the last <td>
    const actionTd = tds.length >= 7 ? tds[6][1] : (tds.length >= 6 ? tds[5][1] : "");
    const editarMatch = actionTd.match(/editar_evaluacion\/([a-f0-9]+)/);
    const verCerrarMatch = actionTd.match(/listar_notas\/([a-f0-9]+)/);
    const cargarMatch = actionTd.match(/editar_notas\/([a-f0-9]+)/);

    // Extract porcentaje - it's in a td with class "barra", may have a progress bar or text
    const porcText = cl(tds[5][1]);
    const porcMatch = porcText.match(/(\d+)/);

    evals.push({
      nombre: cl(tds[0][1]),
      tipo: cl(tds[1][1]),
      fecha: cl(tds[2][1]),
      estado: cl(tds[3][1]),
      visible: cl(tds[4][1]),
      porcentaje: porcMatch ? parseInt(porcMatch[1]) : 0,
      editarHash: editarMatch ? editarMatch[1] : null,
      verCerrarHash: verCerrarMatch ? verCerrarMatch[1] : null,
      cargarHash: cargarMatch ? cargarMatch[1] : null,
    });
  }

  return { evaluaciones: evals, crearHash };
}

// ── Parse crear evaluación form to get the form action hash ──
function parseCrearForm(rawText) {
  const content = extractContent(rawText);
  // The form action contains crear_evaluacion/HASH
  const formMatch = content.match(/crear_evaluacion\/([a-f0-9]+)/);
  return formMatch ? formMatch[1] : null;
}

// ── Extract a specific on_arrival by clase_js ──
function extractOnArrivalByClass(rawText, targetClass) {
  let html = rawText;
  try { const outer = JSON.parse(rawText); if (outer.cont) html = outer.cont; } catch (e) {}
  const marker = "on_arrival(";
  let searchFrom = 0;
  while (true) {
    const idx = html.indexOf(marker, searchFrom);
    if (idx === -1) break;
    const jsonStart = idx + marker.length;
    let depth = 0, inString = false, escape = false, jsonEnd = -1;
    for (let i = jsonStart; i < html.length; i++) {
      const ch = html[i];
      if (escape) { escape = false; continue; }
      if (ch === '\\') { escape = true; continue; }
      if (ch === '"' && !escape) { inString = !inString; continue; }
      if (inString) continue;
      if (ch === '{') depth++;
      if (ch === '}') { depth--; if (depth === 0) { jsonEnd = i + 1; break; } }
    }
    if (jsonEnd === -1) break;
    try {
      const obj = JSON.parse(html.substring(jsonStart, jsonEnd));
      if (obj.clase_js === targetClass) return obj;
    } catch (e) {}
    searchFrom = jsonEnd;
  }
  return null;
}

// ── Parse editar_notas page ──
function parseNotasPage(rawText) {
  // Try edicion_notas first (edit mode, eval abierta)
  let obj = extractOnArrivalByClass(rawText, "edicion_notas");
  let readOnly = false;
  if (!obj) {
    // Fall back to lista_notas (read-only mode, eval cerrada)
    obj = extractOnArrivalByClass(rawText, "lista_notas");
    readOnly = true;
  }
  if (!obj) return null;

  const info = obj.info || {};
  const content = obj.content || "";
  const alumnos = [];

  if (readOnly) {
    // Parse lista_notas: students in HTML rows with data-alumno="ID"
    const rowRegex = /<tr[^>]*data-alumno=['"](\d+)['"][^>]*>([\s\S]*?)<\/tr>/g;
    const rows = extractAll(content, rowRegex);
    for (const row of rows) {
      const id = row[1];
      const rc = row[2];
      const nameMatch = rc.match(/class=['"]nombre['"]>([^<]+)</);
      const legMatch = rc.match(/class=['"]legajo['"]>\s*Legajo:\s*([^<]*)</);
      const notaMatch = rc.match(/class=['"]centrar alinear['"]>\s*(\d+)\s*\(/);
      const resMatch = rc.match(/class=['"]js-resultado-text['"]>([^<]+)</);
      alumnos.push({
        hash: id,
        nombre: nameMatch ? nameMatch[1].trim() : "",
        legajo: legMatch ? legMatch[1].trim() : "",
        nota: notaMatch ? notaMatch[1] : "",
        resultado: resMatch ? resMatch[1].trim() : "",
      });
    }
  } else {
    // Parse edicion_notas: use info.alumnos JSON (much more reliable)
    // Map SIU resultado codes (A/R/U) to readable text
    const resMap = { A: "Aprobado", R: "Reprobado", U: "Ausente", "": "" };
    if (info.alumnos && typeof info.alumnos === "object") {
      for (const id in info.alumnos) {
        const a = info.alumnos[id];
        alumnos.push({
          hash: a.alumno || id, // student ID (numeric)
          nombre: a.apellido_nombres_elegido || a.alumno_nombre || "",
          legajo: a.legajo || "",
          nota: a.nota || "",
          resultado: resMap[a.resultado] !== undefined ? resMap[a.resultado] : (a.resultado_nombre || ""),
          resultadoCode: a.resultado || "", // raw code for saving
        });
      }
    }
  }

  const reabrirMatch = content.match(/reabrir_evaluacion\/([a-f0-9]+)/);
  const cerrarMatch = content.match(/cerrar_evaluacion\/([a-f0-9]+)/);
  const fechaMatch = content.match(/<strong>Fecha:<\/strong><\/td><td>([^<]+)/);
  const estadoMatch = content.match(/<strong>Estado:<\/strong><\/td><td>([^<]+)/);

  // Sort alphabetically by name (case-insensitive, accent-aware)
  alumnos.sort((a, b) => (a.nombre || "").localeCompare((b.nombre || ""), "es", { sensitivity: "base" }));

  return {
    alumnos,
    readOnly,
    evaluacionHash: info.evaluacion || null,
    escalaId: info.id_escala || "102",
    resultadoNotas: info.resultado_notas || [],
    urlGuardar: info.url_guardar || null,
    urlAgregarComision: info.url_agregar_comision || null,
    hayAlumnos: alumnos.length > 0,
    reabrirHash: reabrirMatch ? reabrirMatch[1] : null,
    cerrarHash: cerrarMatch ? cerrarMatch[1] : null,
    fecha: fechaMatch ? fechaMatch[1].trim() : "",
    estado: estadoMatch ? estadoMatch[1].trim() : "",
  };
}

// ── Routes ──
async function handleRequest(request, env) {
  const url = new URL(request.url);
  const origin = request.headers.get("Origin");
  const cors = corsHeaders(origin);

  if (request.method === "OPTIONS") return new Response(null, { status: 204, headers: cors });

  const path = url.pathname;

  try {
    // ── LOGIN ──
    if (path === "/api/login" && request.method === "POST") {
      const { usuario, password } = await request.json();
      const loginRes = await fetch(`${BASE}/acceso?auth=form`, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
          "Origin": "https://autogestion.usal.edu.ar",
          "Referer": "https://autogestion.usal.edu.ar/autogestion/acceso",
        },
        body: `usuario=${encodeURIComponent(usuario)}&password=${encodeURIComponent(password)}&login=Ingresar`,
        redirect: "manual",
      });
      const setCookie = loginRes.headers.get("Set-Cookie") || "";
      const cookieMatch = setCookie.match(/(siu_sess[^=]*=[^;]+)/);
      if (!cookieMatch) return Response.json({ error: "Credenciales inválidas" }, { status: 401, headers: cors });
      const session = cookieMatch[1];

      // Switch to Docente profile (for users with multiple profiles)
      // SIU uses GET acceso/perfil?id=Docente → 302 to inicio_docente
      await gFetch("acceso/perfil?id=Docente", session);

      // Verify login + get name
      const vRes = await gFetch("inicio_docente", session);
      const vHtml = await gText(vRes);
      const isDocente = vHtml.includes("inicio_docente") || vHtml.includes("zona_clases") || vHtml.includes("Bienvenido");
      const nm = vHtml.match(/Bienvenido\s+([^<]+)/);
      const nombre = nm ? nm[1].trim() : (vHtml.match(/icon-user[^>]*>[^<]*<\/i>\s*([^<]+)/)?.[1]?.trim() || "Docente");

      console.log("Login profile check - isDocente:", isDocente, "url:", vRes.url);

      return Response.json({ ok: true, session, nombre }, { headers: cors });
    }

    // ── LOGIN WITH COOKIE (for OAuth-based USAL login) ──
    // User authenticates at autogestion.usal.edu.ar via Google OAuth,
    // then passes the resulting session cookie here
    if (path === "/api/login-with-cookie" && request.method === "POST") {
      let { session } = await request.json();
      if (!session) return Response.json({ error: "Sesión vacía" }, { status: 400, headers: cors });

      session = session.trim();
      // If user pasted just the value (no =), prepend the cookie name
      if (!session.includes("=")) session = "siu_sess__autogestion_des01=" + session;
      // If user pasted with quotes, strip them
      session = session.replace(/^["']|["']$/g, "");

      // Verify and switch to Docente profile
      await gFetch("acceso/perfil?id=Docente", session);

      const vRes = await gFetch("inicio_docente", session);
      const vHtml = await gText(vRes);

      // Check if session is valid (not redirected to login)
      if (vHtml.includes("auth=cuenta_ext") || vHtml.includes("Ingresar con cuenta") || vHtml.includes("acceso/login")) {
        return Response.json({ error: "Sesión inválida o expirada. Iniciá sesión en autogestion.usal.edu.ar y copiá la cookie de nuevo." }, { status: 401, headers: cors });
      }

      const nm = vHtml.match(/Bienvenido\s+([^<]+)/);
      const nombre = nm ? nm[1].trim() : (vHtml.match(/icon-user[^>]*>[^<]*<\/i>\s*([^<]+)/)?.[1]?.trim() || "Docente");
      return Response.json({ ok: true, session, nombre }, { headers: cors });
    }

    // ── COMISIONES (Libro de Temas) ──
    if (path === "/api/comisiones/clases") {
      const session = request.headers.get("Authorization");
      if (!session) return Response.json({ error: "No session" }, { status: 401, headers: cors });
      const res = await gFetch("zona_clases", session);
      const raw = await gText(res);
      if (raw.includes("acceso/login")) return Response.json({ error: "Sesión expirada" }, { status: 401, headers: cors });
      const comisiones = parseComisiones(raw);
      return Response.json({ comisiones }, { headers: cors });
    }

    // ── COMISIONES (Parciales) ──
    if (path === "/api/comisiones/parciales") {
      const session = request.headers.get("Authorization");
      if (!session) return Response.json({ error: "No session" }, { status: 401, headers: cors });
      const res = await gFetch("zona_comisiones", session);
      const raw = await gText(res);
      if (raw.includes("acceso/login")) return Response.json({ error: "Sesión expirada" }, { status: 401, headers: cors });
      const comisiones = parseComisiones(raw);
      return Response.json({ comisiones }, { headers: cors });
    }

    // ── CLASES ──
    if (path.startsWith("/api/clases/")) {
      const session = request.headers.get("Authorization");
      if (!session) return Response.json({ error: "No session" }, { status: 401, headers: cors });
      const hash = path.replace("/api/clases/", "");
      const res = await gFetch(`zona_clases/home/${hash}`, session);
      const raw = await gText(res);
      if (raw.includes("acceso/login")) return Response.json({ error: "Sesión expirada" }, { status: 401, headers: cors });
      const clases = parseClases(raw);
      return Response.json(clases, { headers: cors });
    }

    // ── ASISTENCIA GET ──
    if (path.match(/^\/api\/asistencia\/[a-f0-9]+\/\d+$/) && request.method === "GET") {
      const session = request.headers.get("Authorization");
      if (!session) return Response.json({ error: "No session" }, { status: 401, headers: cors });
      const [, , , comisionHash, claseId] = path.split("/");
      const clasesRes = await gFetch(`zona_clases/home/${comisionHash}`, session);
      const clasesHtml = await gText(clasesRes);
      const clasesContent = extractAllContents(clasesHtml);
      const asistMatch = clasesContent.match(/asistencias\/([a-f0-9]+)\/\d+/);
      const asistHash = asistMatch ? asistMatch[1] : comisionHash;
      const res = await gFetch(`asistencias/${asistHash}/${claseId}`, session, {
        headers: { "Referer": `${BASE}/zona_clases/home/${comisionHash}` }
      });
      const raw = await gText(res);
      if (raw.includes("acceso/login")) return Response.json({ error: "Sesión expirada" }, { status: 401, headers: cors });
      const alumnos = parseAlumnos(raw);
      return Response.json({ alumnos, claseId }, { headers: cors });
    }

    // ── ASISTENCIA UNIFICADA ──
    if (path === "/api/asistencia-unificada" && request.method === "POST") {
      const session = request.headers.get("Authorization");
      if (!session) return Response.json({ error: "No session" }, { status: 401, headers: cors });
      const { comisionHashes, fecha } = await request.json();
      const allAlumnos = new Map();
      const comisionDetails = [];
      let maxHoras = 3;

      for (const comHash of comisionHashes) {
        try {
          const clasesRes = await gFetch(`zona_clases/home/${comHash}`, session);
          const clasesHtml = await gText(clasesRes);
          const clasesContent = extractAllContents(clasesHtml);
          const asistMatch = clasesContent.match(/asistencias\/([a-f0-9]+)\/(\d+)/);
          if (!asistMatch) continue;
          const asistBaseHash = asistMatch[1];
          const clases = parseClases(clasesHtml);
          let targetClaseId = null;
          if (fecha) {
            for (const c of clases.dictadas) {
              if (c.fecha && c.fecha.includes(fecha)) { targetClaseId = c.claseId; break; }
            }
            if (!targetClaseId) {
              const sinDictarMatch = clasesContent.match(new RegExp(`asistencias/${asistBaseHash.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}/(\\d+)[^"]*${fecha.replace(/\//g, '\\/')}`));
              if (sinDictarMatch) targetClaseId = sinDictarMatch[1];
            }
          }
          if (!targetClaseId) {
            const selectedMatch = clasesContent.match(/selected[^>]*data-link=[^>]*asistencias\/[a-f0-9]+\/(\d+)/);
            if (selectedMatch) targetClaseId = selectedMatch[1];
          }
          if (!targetClaseId && clases.dictadas.length > 0) targetClaseId = clases.dictadas[0].claseId;
          if (!targetClaseId) targetClaseId = asistMatch[2];

          const asistRes = await gFetch(`asistencias/${asistBaseHash}/${targetClaseId}`, session, {
            headers: { "Referer": `${BASE}/zona_clases/home/${comHash}` }
          });
          const asistHtml = await gText(asistRes);
          const alumnos = parseAlumnos(asistHtml);
          const asistContents = extractAllContents(asistHtml);
          const horasMatch = asistContents.match(/Horas:.*?<td>(\d+)/);
          if (horasMatch) { const h = parseInt(horasMatch[1]); if (h > maxHoras) maxHoras = h; }

          comisionDetails.push({ comisionHash: comHash, asistHash: asistBaseHash, claseId: targetClaseId, studentCount: alumnos.length });
          for (const al of alumnos) {
            if (!allAlumnos.has(al.hash)) allAlumnos.set(al.hash, { ...al, comisiones: [comHash] });
            else allAlumnos.get(al.hash).comisiones.push(comHash);
          }
        } catch (e) { console.log("Error processing comision", comHash.slice(-8), ":", e.message); }
      }

      const sortedAlumnos = [...allAlumnos.values()].sort((a, b) => a.nombre.localeCompare(b.nombre, "es"));
      return Response.json({ alumnos: sortedAlumnos, comisiones: comisionDetails, total: sortedAlumnos.length, maxHoras }, { headers: cors });
    }

    // ── ASISTENCIA POST ──
    if (path.match(/^\/api\/asistencia\/[a-f0-9]+\/\d+$/) && request.method === "POST") {
      const session = request.headers.get("Authorization");
      if (!session) return Response.json({ error: "No session" }, { status: 401, headers: cors });
      const [, , , comisionHash, claseId] = path.split("/");
      const { alumnos } = await request.json();
      const clasesRes = await gFetch(`zona_clases/home/${comisionHash}`, session);
      const clasesHtml = await gText(clasesRes);
      const clasesContent = extractAllContents(clasesHtml);
      const asistMatch = clasesContent.match(/asistencias\/([a-f0-9]+)\/\d+/);
      const asistHash = asistMatch ? asistMatch[1] : comisionHash;
      const params = new URLSearchParams();
      params.set("clase[ID]", claseId);
      for (const [ah, estado] of Object.entries(alumnos)) params.set(`alumnos[${ah}][PRESENTE]`, estado.toString());
      const res = await gFetch(`asistencias/${asistHash}/${claseId}`, session, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8", "X-Requested-With": "XMLHttpRequest", "Origin": "https://autogestion.usal.edu.ar" },
        body: params.toString(),
      });
      return Response.json({ ok: res.status === 200 }, { headers: cors });
    }

    // ── ASISTENCIA BATCH SAVE ──
    if (path === "/api/asistencia-batch" && request.method === "POST") {
      const session = request.headers.get("Authorization");
      if (!session) return Response.json({ error: "No session" }, { status: 401, headers: cors });
      const { comisiones, alumnos } = await request.json();
      const results = [];
      for (const com of comisiones) {
        try {
          let asistHash = com.asistHash;
          if (!asistHash && com.comisionHash) {
            const cr = await gFetch(`zona_clases/home/${com.comisionHash}`, session);
            const ch = await gText(cr);
            const cc = extractAllContents(ch);
            const am = cc.match(/asistencias\/([a-f0-9]+)\/\d+/);
            asistHash = am ? am[1] : com.hash || com.comisionHash;
          }
          if (!asistHash) asistHash = com.hash;
          const asistRes = await gFetch(`asistencias/${asistHash}/${com.claseId}`, session, {
            headers: { "Referer": `${BASE}/zona_clases` }
          });
          const asistHtml = await gText(asistRes);
          const comStudents = parseAlumnos(asistHtml);
          if (comStudents.length === 0) { results.push({ claseId: com.claseId, ok: true, skipped: true, reason: "no students" }); continue; }
          const params = new URLSearchParams();
          params.set("clase[ID]", com.claseId);
          let count = 0;
          for (const student of comStudents) {
            const estado = alumnos[student.hash] !== undefined ? alumnos[student.hash] : student.estado;
            params.set(`alumnos[${student.hash}][PRESENTE]`, estado.toString());
            count++;
          }
          const res = await gFetch(`asistencias/${asistHash}/${com.claseId}`, session, {
            method: "POST",
            headers: { "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8", "X-Requested-With": "XMLHttpRequest", "Origin": "https://autogestion.usal.edu.ar" },
            body: params.toString(),
          });
          const resText = await gText(res);
          const ok = res.status === 200 && !resText.includes("error");
          results.push({ claseId: com.claseId, ok, studentsSaved: count });
        } catch (e) { results.push({ claseId: com.claseId, ok: false, error: e.message }); }
      }
      return Response.json({ results }, { headers: cors });
    }

    // ── EVALUACIONES GET (improved v5) ──
    if (path.startsWith("/api/evaluaciones/") && request.method === "GET") {
      const session = request.headers.get("Authorization");
      if (!session) return Response.json({ error: "No session" }, { status: 401, headers: cors });

      const hash = path.replace("/api/evaluaciones/", "");
      const res = await gFetch(`evaluaciones/ver_comision/${hash}`, session);
      const raw = await gText(res);
      if (raw.includes("acceso/login")) return Response.json({ error: "Sesión expirada" }, { status: 401, headers: cors });

      const { evaluaciones, crearHash } = parseEvaluaciones(raw);
      console.log("Evaluaciones:", evaluaciones.length, "crearHash:", crearHash?.slice(-8));
      return Response.json({ evaluaciones, crearHash }, { headers: cors });
    }

    // ── CREAR EVALUACIÓN ──
    // Two-step: 1) GET nueva_evaluacion page to find form action hash
    //           2) POST to crear_evaluacion with the form data
    if (path.startsWith("/api/evaluaciones/") && request.method === "POST") {
      const session = request.headers.get("Authorization");
      if (!session) return Response.json({ error: "No session" }, { status: 401, headers: cors });

      const hash = path.replace("/api/evaluaciones/", "");
      const { nombre, fecha, horaInicio, horaFin, tipo, descripcion, visible, escala } = await request.json();

      // Step 1: GET the nueva_evaluacion page to obtain the form action hash
      // First we need the crearHash (nueva_evaluacion hash) from ver_comision
      const verRes = await gFetch(`evaluaciones/ver_comision/${hash}`, session);
      const verRaw = await gText(verRes);
      const { crearHash } = parseEvaluaciones(verRaw);

      if (!crearHash) {
        return Response.json({ error: "No se encontró el link de crear evaluación" }, { status: 400, headers: cors });
      }

      // Step 2: GET nueva_evaluacion to find the form action hash
      const formRes = await gFetch(`evaluaciones/nueva_evaluacion/${crearHash}`, session);
      const formRaw = await gText(formRes);
      const formActionHash = parseCrearForm(formRaw);

      if (!formActionHash) {
        return Response.json({ error: "No se pudo obtener el formulario de creación" }, { status: 400, headers: cors });
      }

      console.log("Creating eval: nueva_eval hash:", crearHash.slice(-8), "form action hash:", formActionHash.slice(-8));

      // Step 3: POST the form
      const params = new URLSearchParams();
      params.set("nueva_eval[fecha]", fecha); // dd/mm/aaaa
      params.set("nueva_eval[hora_inicio]", horaInicio); // HH:MM
      params.set("nueva_eval[hora_fin]", horaFin); // HH:MM
      params.set("nueva_eval[nombre]", nombre);
      params.set("nueva_eval[descripcion]", descripcion || "");
      params.set("nueva_eval[evaluacion_tipo]", tipo); // 1=Parcial, 2=Recuperatorio, 4=Integrador, 5=Coloquio, 6=TP
      params.set("nueva_eval[visible_al_alumno]", visible || "S"); // S or N
      params.set("nueva_eval[escala_nota]", escala || "102"); // 101=Aprob/Desaprob, 102=0-10

      const postRes = await gFetch(`evaluaciones/crear_evaluacion/${formActionHash}`, session, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
          "X-Requested-With": "XMLHttpRequest",
          "Origin": "https://autogestion.usal.edu.ar",
          "Referer": `${BASE}/evaluaciones/nueva_evaluacion/${crearHash}`,
          "Accept": "application/json, text/javascript, */*; q=0.01",
        },
        body: params.toString(),
      });

      const postRaw = await gText(postRes);
      console.log("Create eval response:", postRaw.substring(0, 200));

      // SIU returns: {"cod":"-2","cont":{"url":"...ver_comision/HASH...","tiene_mensaje":"1","mensaje":"La evaluación se dio de alta"}}
      try {
        const result = JSON.parse(postRaw);
        if (result.cont && result.cont.mensaje) {
          return Response.json({ ok: true, mensaje: result.cont.mensaje }, { headers: cors });
        }
        // Check for error messages
        if (result.cont && typeof result.cont === "string" && result.cont.includes("error")) {
          return Response.json({ ok: false, error: "Error del servidor SIU" }, { headers: cors });
        }
        return Response.json({ ok: true, raw: result }, { headers: cors });
      } catch (e) {
        // Non-JSON response - might be HTML redirect (success)
        if (postRes.status === 200) {
          return Response.json({ ok: true, mensaje: "Evaluación creada" }, { headers: cors });
        }
        return Response.json({ ok: false, error: "Respuesta inesperada del SIU" }, { headers: cors });
      }
    }

    // ── CREAR EVALUACIÓN BATCH (multi-comision) ──
    if (path === "/api/evaluaciones-batch" && request.method === "POST") {
      const session = request.headers.get("Authorization");
      if (!session) return Response.json({ error: "No session" }, { status: 401, headers: cors });

      const { hashes, nombre, fecha, horaInicio, horaFin, tipo, descripcion, visible, escala } = await request.json();
      const results = [];

      for (const hash of hashes) {
        try {
          // Step 1: get crearHash from ver_comision
          const verRes = await gFetch(`evaluaciones/ver_comision/${hash}`, session);
          const verRaw = await gText(verRes);
          const { crearHash } = parseEvaluaciones(verRaw);
          if (!crearHash) { results.push({ hash: hash.slice(-8), ok: false, error: "Sin link crear" }); continue; }

          // Step 2: get form action hash
          const formRes = await gFetch(`evaluaciones/nueva_evaluacion/${crearHash}`, session);
          const formRaw = await gText(formRes);
          const formActionHash = parseCrearForm(formRaw);
          if (!formActionHash) { results.push({ hash: hash.slice(-8), ok: false, error: "Sin form action" }); continue; }

          // Step 3: POST
          const params = new URLSearchParams();
          params.set("nueva_eval[fecha]", fecha);
          params.set("nueva_eval[hora_inicio]", horaInicio);
          params.set("nueva_eval[hora_fin]", horaFin);
          params.set("nueva_eval[nombre]", nombre);
          params.set("nueva_eval[descripcion]", descripcion || "");
          params.set("nueva_eval[evaluacion_tipo]", tipo);
          params.set("nueva_eval[visible_al_alumno]", visible || "S");
          params.set("nueva_eval[escala_nota]", escala || "102");

          const postRes = await gFetch(`evaluaciones/crear_evaluacion/${formActionHash}`, session, {
            method: "POST",
            headers: {
              "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
              "X-Requested-With": "XMLHttpRequest",
              "Origin": "https://autogestion.usal.edu.ar",
              "Referer": `${BASE}/evaluaciones/nueva_evaluacion/${crearHash}`,
              "Accept": "application/json, text/javascript, */*; q=0.01",
            },
            body: params.toString(),
          });
          const postRaw = await gText(postRes);
          try {
            const result = JSON.parse(postRaw);
            results.push({ hash: hash.slice(-8), ok: true, mensaje: result.cont?.mensaje || "OK" });
          } catch (e) {
            results.push({ hash: hash.slice(-8), ok: postRes.status === 200 });
          }
        } catch (e) {
          results.push({ hash: hash.slice(-8), ok: false, error: e.message });
        }
      }

      return Response.json({ results }, { headers: cors });
    }

    // ── NOTAS: GET (editar_notas or listar_notas) ──
    if (path.match(/^\/api\/notas\/[a-f0-9]+$/) && request.method === "GET") {
      const session = request.headers.get("Authorization");
      if (!session) return Response.json({ error: "No session" }, { status: 401, headers: cors });
      const hash = path.replace("/api/notas/", "");
      const readOnly = url.searchParams.get("readonly") === "1";
      const siuPath = readOnly ? `evaluaciones/listar_notas/${hash}` : `evaluaciones/editar_notas/${hash}`;
      const res = await gFetch(siuPath, session);
      const raw = await gText(res);
      if (raw.includes("acceso/login")) return Response.json({ error: "Sesión expirada" }, { status: 401, headers: cors });
      const parsed = parseNotasPage(raw);
      if (!parsed) return Response.json({ error: "No se pudo parsear la página de notas" }, { status: 500, headers: cors });
      console.log("Notas page:", siuPath.split('/').pop().slice(0,8), "alumnos:", parsed.alumnos.length, "readOnly:", parsed.readOnly);
      return Response.json(parsed, { headers: cors });
    }

    // ── NOTAS: agregar alumnos de la comisión ──
    if (path.match(/^\/api\/notas\/[a-f0-9]+\/agregar-comision$/) && request.method === "POST") {
      const session = request.headers.get("Authorization");
      if (!session) return Response.json({ error: "No session" }, { status: 401, headers: cors });
      const cargarHash = path.replace("/api/notas/", "").replace("/agregar-comision", "");

      // First fetch the editar_notas page to get the evaluacion hash and URL
      const pageRes = await gFetch(`evaluaciones/editar_notas/${cargarHash}`, session);
      const pageRaw = await gText(pageRes);
      const pageData = parseNotasPage(pageRaw);
      if (!pageData || !pageData.evaluacionHash) {
        return Response.json({ error: "No se encontró el hash de evaluación" }, { status: 400, headers: cors });
      }

      // POST to agregar_comision
      const addRes = await gFetch("evaluaciones/agregar_comision", session, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
          "X-Requested-With": "XMLHttpRequest",
          "Accept": "application/json, text/javascript, */*; q=0.01",
          "Referer": `${BASE}/evaluaciones/editar_notas/${cargarHash}`,
        },
        body: `evaluacion=${pageData.evaluacionHash}`,
      });
      const addRaw = await gText(addRes);
      console.log("Agregar comision response:", addRaw.substring(0, 300));

      // Re-fetch the page to get the updated student list
      const res2 = await gFetch(`evaluaciones/editar_notas/${cargarHash}`, session);
      const raw2 = await gText(res2);
      const parsed2 = parseNotasPage(raw2);

      return Response.json({
        ok: true,
        alumnos: parsed2?.alumnos || [],
        evaluacionHash: parsed2?.evaluacionHash || pageData.evaluacionHash,
        resultadoNotas: parsed2?.resultadoNotas || pageData.resultadoNotas,
      }, { headers: cors });
    }

    // ── NOTAS: guardar notas ──
    if (path.match(/^\/api\/notas\/[a-f0-9]+\/guardar$/) && request.method === "POST") {
      const session = request.headers.get("Authorization");
      if (!session) return Response.json({ error: "No session" }, { status: 401, headers: cors });
      const cargarHash = path.replace("/api/notas/", "").replace("/guardar", "");
      const { evaluacionHash, alumnos } = await request.json();
      // alumnos: array of { hash, nota, resultado }

      // First fetch the page to get the correct evaluacion hash if not provided
      let evalHash = evaluacionHash;
      if (!evalHash) {
        const pageRes = await gFetch(`evaluaciones/editar_notas/${cargarHash}`, session);
        const pageRaw = await gText(pageRes);
        const pageData = parseNotasPage(pageRaw);
        evalHash = pageData?.evaluacionHash;
      }
      if (!evalHash) return Response.json({ error: "No evaluacion hash" }, { status: 400, headers: cors });

      // Build form data: evaluacion=HASH&alumnos[ID][nota]=X&alumnos[ID][resultado]=Y
      // SIU expects: resultado as code (A/R/U), nota as 0-10, hash as numeric student ID
      const resCodeMap = { "Aprobado": "A", "Reprobado": "R", "Ausente": "U", "A": "A", "R": "R", "U": "U" };
      const params = new URLSearchParams();
      params.set("evaluacion", evalHash);
      for (const al of alumnos) {
        if (al.nota !== "" && al.nota !== undefined && al.nota !== null) {
          params.set(`alumnos[${al.hash}][nota]`, al.nota.toString());
        }
        if (al.resultado) {
          const code = resCodeMap[al.resultado] || al.resultado;
          params.set(`alumnos[${al.hash}][resultado]`, code);
        }
        if (al.corregido_por) {
          params.set(`alumnos[${al.hash}][corregido_por]`, al.corregido_por);
        }
      }

      const saveRes = await gFetch("evaluaciones/editar_alumnos", session, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
          "X-Requested-With": "XMLHttpRequest",
          "Accept": "application/json, text/javascript, */*; q=0.01",
          "Referer": `${BASE}/evaluaciones/editar_notas/${cargarHash}`,
        },
        body: params.toString(),
      });
      const saveRaw = await gText(saveRes);
      console.log("Save notas response:", saveRaw.substring(0, 300));

      try {
        const result = JSON.parse(saveRaw);
        return Response.json({ ok: true, result }, { headers: cors });
      } catch (e) {
        return Response.json({ ok: saveRes.status === 200, raw: saveRaw.substring(0, 200) }, { headers: cors });
      }
    }

    // ── NOTAS: reabrir evaluación ──
    if (path.match(/^\/api\/notas\/[a-f0-9]+\/reabrir$/) && request.method === "POST") {
      const session = request.headers.get("Authorization");
      if (!session) return Response.json({ error: "No session" }, { status: 401, headers: cors });
      const reabrirHash = path.replace("/api/notas/", "").replace("/reabrir", "");
      const res = await gFetch(`evaluaciones/reabrir_evaluacion/${reabrirHash}`, session);
      const raw = await gText(res);
      if (raw.includes("acceso/login")) return Response.json({ error: "Sesión expirada" }, { status: 401, headers: cors });
      return Response.json({ ok: true }, { headers: cors });
    }

    // ── NOTAS: cerrar evaluación ──
    if (path.match(/^\/api\/notas\/[a-f0-9]+\/cerrar$/) && request.method === "POST") {
      const session = request.headers.get("Authorization");
      if (!session) return Response.json({ error: "No session" }, { status: 401, headers: cors });
      const cerrarHash = path.replace("/api/notas/", "").replace("/cerrar", "");
      const res = await gFetch(`evaluaciones/cerrar_evaluacion/${cerrarHash}`, session);
      const raw = await gText(res);
      if (raw.includes("acceso/login")) return Response.json({ error: "Sesión expirada" }, { status: 401, headers: cors });
      return Response.json({ ok: true }, { headers: cors });
    }

    // ── TEMAS: GET tema for a specific clase ──
    if (path.match(/^\/api\/temas\/[a-f0-9]+\/\d+$/) && request.method === "GET") {
      const session = request.headers.get("Authorization");
      if (!session) return Response.json({ error: "No session" }, { status: 401, headers: cors });
      const parts = path.replace("/api/temas/", "").split("/");
      const temasHash = parts[0];
      const claseId = parts[1];
      const res = await gFetch(`temas_dictados/${temasHash}/${claseId}`, session);
      const raw = await gText(res);
      if (raw.includes("acceso/login")) return Response.json({ error: "Sesión expirada" }, { status: 401, headers: cors });
      // Extract textarea content
      const obj = extractOnArrivalByClass(raw, "edicion_temas");
      let tema = "";
      if (obj && obj.content) {
        const m = obj.content.match(/<textarea[^>]*name=['"]tema_dictado['"][^>]*>([\s\S]*?)<\/textarea>/);
        if (m) tema = m[1].replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&amp;/g, "&").replace(/&quot;/g, '"').replace(/&#039;/g, "'");
      }
      return Response.json({ tema, claseId, temasHash }, { headers: cors });
    }

    // ── TEMAS: POST save tema for a specific clase ──
    if (path.match(/^\/api\/temas\/[a-f0-9]+\/\d+$/) && request.method === "POST") {
      const session = request.headers.get("Authorization");
      if (!session) return Response.json({ error: "No session" }, { status: 401, headers: cors });
      const parts = path.replace("/api/temas/", "").split("/");
      const temasHash = parts[0];
      const claseId = parts[1];
      const { tema } = await request.json();
      const params = new URLSearchParams();
      params.set("clase", claseId);
      params.set("tema_dictado", tema || "");
      const res = await gFetch(`temas_dictados/${temasHash}/${claseId}`, session, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
          "Origin": "https://autogestion.usal.edu.ar",
          "Referer": `${BASE}/temas_dictados/${temasHash}/${claseId}`,
        },
        body: params.toString(),
      });
      const raw = await gText(res);
      const ok = res.status === 200 && !raw.includes("acceso/login");
      return Response.json({ ok, claseId }, { headers: cors });
    }

    // ── TEMAS: batch save same tema to multiple comisiones (matched by fecha) ──
    if (path === "/api/temas-batch" && request.method === "POST") {
      const session = request.headers.get("Authorization");
      if (!session) return Response.json({ error: "No session" }, { status: 401, headers: cors });
      const { comisiones, tema, fecha } = await request.json();
      // comisiones: [{ comisionHash }] — resolve temasHash + matching claseId by fecha for each
      const results = [];
      for (const com of comisiones) {
        try {
          const cr = await gFetch(`zona_clases/home/${com.comisionHash}`, session);
          const ch = await gText(cr);
          const parsed = parseClases(ch);
          const temasHash = parsed.temasBaseHash;
          if (!temasHash) { results.push({ comisionHash: com.comisionHash, ok: false, error: "No temas hash" }); continue; }
          // Match clase by fecha (search in both dictadas and sinDictar — but only dictadas have claseId)
          // For sinDictar we still need to find the claseId — fall back to searching raw HTML
          const allClases = [...(parsed.dictadas || []), ...(parsed.sinDictar || [])];
          let claseId = null;
          const target = allClases.find((c) => c.fecha === fecha);
          if (target && target.claseId) claseId = target.claseId;
          if (!claseId) {
            // Try to find any claseId for that fecha in the raw HTML via temas_dictados links
            const rx = new RegExp(`temas_dictados\\/${temasHash}\\/(\\d+)[^>]*>([^<]*${fecha.replace(/[.*+?^${}()|[\\]\\\\]/g, "\\\\$&")})`, "i");
            const m = ch.match(rx);
            if (m) claseId = m[1];
          }
          if (!claseId) { results.push({ comisionHash: com.comisionHash, ok: false, error: `Clase no encontrada para ${fecha}` }); continue; }
          const params = new URLSearchParams();
          params.set("clase", claseId);
          params.set("tema_dictado", tema || "");
          const r = await gFetch(`temas_dictados/${temasHash}/${claseId}`, session, {
            method: "POST",
            headers: {
              "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
              "Origin": "https://autogestion.usal.edu.ar",
              "Referer": `${BASE}/temas_dictados/${temasHash}/${claseId}`,
            },
            body: params.toString(),
          });
          const ok = r.status === 200;
          results.push({ comisionHash: com.comisionHash, ok, claseId });
        } catch (e) {
          results.push({ comisionHash: com.comisionHash, ok: false, error: e.message });
        }
      }
      return Response.json({ results }, { headers: cors });
    }

    // ── GRUPOS ──
    if (path === "/api/grupos" && request.method === "GET") {
      const session = request.headers.get("Authorization");
      if (!session) return Response.json({ error: "No session" }, { status: 401, headers: cors });
      const usuario = request.headers.get("X-Usuario") || "default";
      const userKey = `grupos:${usuario}`;
      if (!env.GROUPS) return Response.json({ grupos: [] }, { headers: cors });
      const data = await env.GROUPS.get(userKey, "json");
      return Response.json({ grupos: data || [] }, { headers: cors });
    }

    if (path === "/api/grupos" && request.method === "POST") {
      const session = request.headers.get("Authorization");
      if (!session) return Response.json({ error: "No session" }, { status: 401, headers: cors });
      const usuario = request.headers.get("X-Usuario") || "default";
      const userKey = `grupos:${usuario}`;
      const { nombre, comisionIds } = await request.json();
      if (!env.GROUPS) return Response.json({ error: "KV not configured" }, { status: 500, headers: cors });
      const data = await env.GROUPS.get(userKey, "json") || [];
      const existing = data.findIndex((g) => g.nombre === nombre);
      if (existing >= 0) data[existing].comisionIds = comisionIds;
      else data.push({ nombre, comisionIds, creado: new Date().toISOString() });
      await env.GROUPS.put(userKey, JSON.stringify(data));
      return Response.json({ ok: true, grupos: data }, { headers: cors });
    }

    if (path.startsWith("/api/grupos/") && request.method === "DELETE") {
      const session = request.headers.get("Authorization");
      if (!session) return Response.json({ error: "No session" }, { status: 401, headers: cors });
      const usuario = request.headers.get("X-Usuario") || "default";
      const userKey = `grupos:${usuario}`;
      const nombre = decodeURIComponent(path.replace("/api/grupos/", ""));
      if (!env.GROUPS) return Response.json({ error: "KV not configured" }, { status: 500, headers: cors });
      let data = await env.GROUPS.get(userKey, "json") || [];
      data = data.filter((g) => g.nombre !== nombre);
      await env.GROUPS.put(userKey, JSON.stringify(data));
      return Response.json({ ok: true, grupos: data }, { headers: cors });
    }

    if (path === "/api/health") return Response.json({ ok: true }, { headers: cors });

    return Response.json({ error: "Not found" }, { status: 404, headers: cors });
  } catch (e) {
    console.log("Error:", e.message, e.stack);
    return Response.json({ error: e.message }, { status: 500, headers: cors });
  }
}

export default { fetch: handleRequest };