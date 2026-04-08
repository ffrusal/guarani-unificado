// Guaraní Unificado - Cloudflare Worker
// Proxy inverso a autogestion.usal.edu.ar con scraping de HTML

const BASE = "https://autogestion.usal.edu.ar/autogestion";

// ── CORS headers ──
function corsHeaders(origin) {
  return {
    "Access-Control-Allow-Origin": origin || "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Access-Control-Allow-Credentials": "true",
  };
}

// ── Fetch helper con cookie forwarding ──
async function guaraniFetch(path, opts = {}) {
  const url = `${BASE}/${path}`;
  const headers = {
    "Accept": "application/json, text/javascript, */*; q=0.01",
    "Accept-Language": "es-419,es;q=0.9",
    "X-Requested-With": "XMLHttpRequest",
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36",
    ...opts.headers,
  };

  const res = await fetch(url, {
    method: opts.method || "GET",
    headers,
    body: opts.body,
    redirect: "manual",
  });

  return res;
}

// ── HTML Parser helpers ──
function extractBetween(html, start, end) {
  const i = html.indexOf(start);
  if (i === -1) return "";
  const j = html.indexOf(end, i + start.length);
  return j === -1 ? html.slice(i + start.length) : html.slice(i + start.length, j);
}

function extractAll(html, regex) {
  const matches = [];
  let m;
  while ((m = regex.exec(html)) !== null) matches.push(m);
  return matches;
}

// ── Parse comisiones from zona_clases or zona_comisiones HTML ──
function parseComisiones(html) {
  const comisiones = [];
  // Match each materia block
  const materiaBlocks = html.split(/<h3[^>]*>/);

  // Simpler approach: find all table rows with comision links
  const rowRegex = /<a[^>]*href="[^"]*home\/([^"]*)"[^>]*>([^<]+)<\/a>/g;
  const rows = extractAll(html, rowRegex);

  // Parse the structured tables
  const tableRegex = /<table[^>]*class="[^"]*table[^"]*"[^>]*>([\s\S]*?)<\/table>/g;
  const tables = extractAll(html, tableRegex);

  // Extract materia headers
  const headerRegex = /<th[^>]*colspan[^>]*>([^<]+)<\/th>/g;
  const headers = extractAll(html, headerRegex);

  // Extract periodo sections
  const periodoRegex = /<h3[^>]*>([^<]+)<\/h3>/g;
  const periodos = extractAll(html, periodoRegex);

  // Build comisiones from table rows
  const trRegex = /<tr[^>]*>([\s\S]*?)<\/tr>/g;
  const allRows = extractAll(html, trRegex);

  let currentMateria = "";
  let currentPeriodo = "";

  for (const row of allRows) {
    const content = row[1];

    // Check if it's a header row (materia name)
    const headerMatch = content.match(/<th[^>]*colspan[^>]*>([^<]+)\(([^)]+)\)<\/th>/);
    if (headerMatch) {
      currentMateria = headerMatch[1].trim();
      continue;
    }

    // Check if it's a data row with a comision link
    const linkMatch = content.match(/<a[^>]*href="[^"]*home\/([^"]*)"[^>]*>([^<]+)<\/a>/);
    if (linkMatch) {
      const hash = linkMatch[1];
      const comisionId = linkMatch[2].trim();

      // Extract other TD cells
      const tdRegex = /<td[^>]*>([\s\S]*?)<\/td>/g;
      const tds = extractAll(content, tdRegex);

      comisiones.push({
        id: comisionId,
        hash: hash,
        materia: currentMateria,
        subcomision: tds[1] ? tds[1][1].replace(/<[^>]*>/g, "").trim() : "",
        ubicacion: tds[2] ? tds[2][1].replace(/<[^>]*>/g, "").trim() : "",
        responsabilidad: tds[3] ? tds[3][1].replace(/<[^>]*>/g, "").trim() : "",
        turno: tds[4] ? tds[4][1].replace(/<[^>]*>/g, "").trim() : "",
        inscriptos: tds[5] ? parseInt(tds[5][1].replace(/<[^>]*>/g, "").trim()) || 0 : 0,
      });
    }
  }

  return comisiones;
}

// ── Parse clases from zona_clases/home/{hash} HTML ──
function parseClases(html) {
  const dictadas = [];
  const sinDictar = [];

  const trRegex = /<tr[^>]*>([\s\S]*?)<\/tr>/g;
  const allRows = extractAll(html, trRegex);
  let section = ""; // "dictadas" or "sinDictar"

  for (const row of allRows) {
    const content = row[1];
    if (content.includes("Clases dictadas")) { section = "dictadas"; continue; }
    if (content.includes("Clases sin dictar")) { section = "sinDictar"; continue; }
    if (content.includes("<th")) continue; // skip header rows

    const tdRegex = /<td[^>]*>([\s\S]*?)<\/td>/g;
    const tds = extractAll(content, tdRegex);
    if (tds.length < 4) continue;

    const clean = (s) => s.replace(/<[^>]*>/g, "").trim();

    // Extract asistencia link hash
    const asistMatch = content.match(/asistencias\/([a-f0-9]+)\/(\d+)/);

    const clase = {
      fecha: clean(tds[0][1]),
      dia: clean(tds[1][1]),
      horario: clean(tds[2][1]),
      tipo: clean(tds[3][1]),
    };

    if (section === "dictadas" && tds.length >= 5) {
      const pa = clean(tds[4][1]);
      const paMatch = pa.match(/(\d+)\s*-\s*(\d+)/);
      clase.presentes = paMatch ? parseInt(paMatch[1]) : null;
      clase.ausentes = paMatch ? parseInt(paMatch[2]) : null;
      clase.asistenciaHash = asistMatch ? asistMatch[1] : null;
      clase.claseId = asistMatch ? asistMatch[2] : null;
      dictadas.push(clase);
    } else {
      sinDictar.push(clase);
    }
  }

  return { dictadas, sinDictar };
}

// ── Parse alumnos from asistencias page HTML ──
function parseAlumnos(html) {
  const alumnos = [];

  // Find all student cards - they have select elements with student hashes
  const selectRegex = /name="alumnos\[([a-f0-9]+)\]"[^>]*>([\s\S]*?)<\/select>/g;
  const selects = extractAll(html, selectRegex);

  // Find student names near the selects
  const cardRegex = /<div[^>]*class="[^"]*zona_persona[^"]*"[^>]*>([\s\S]*?)<\/div>\s*<\/div>/g;

  // Simpler: match the pattern of name + legajo + select
  const studentRegex = /class="[^"]*nombre[^"]*"[^>]*>([^<]+)<[\s\S]*?class="[^"]*legajo[^"]*"[^>]*>([^<]*)<[\s\S]*?name="alumnos\[([a-f0-9]+)\]"[^>]*value="(\d+)"[^>]*selected/g;

  // Fallback: extract name-hash pairs
  for (const sel of selects) {
    const hash = sel[1];
    const optionsHtml = sel[2];

    // Find selected value
    const selectedMatch = optionsHtml.match(/value="(\d+)"[^>]*selected/);
    const estado = selectedMatch ? parseInt(selectedMatch[1]) : 0;

    alumnos.push({ hash, estado });
  }

  // Try to match names
  const nameRegex = />([A-ZÁÉÍÓÚÑ][A-ZÁÉÍÓÚÑ\s,]+)<\//g;
  const nameMatches = extractAll(html, nameRegex);

  // Match legajos
  const legajoRegex = />\s*(\d{5,6})\s*</g;
  const legajoMatches = extractAll(html, legajoRegex);

  return alumnos;
}

// ── Route handler ──
async function handleRequest(request, env) {
  const url = new URL(request.url);
  const origin = request.headers.get("Origin");
  const cors = corsHeaders(origin);

  // CORS preflight
  if (request.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: cors });
  }

  const path = url.pathname;

  try {
    // ── POST /api/login ──
    if (path === "/api/login" && request.method === "POST") {
      const { usuario, password } = await request.json();

      const loginRes = await fetch(`${BASE}/acceso?auth-form`, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
          "Origin": "https://autogestion.usal.edu.ar",
          "Referer": "https://autogestion.usal.edu.ar/autogestion/acceso",
        },
        body: `usuario=${encodeURIComponent(usuario)}&password=${encodeURIComponent(password)}`,
        redirect: "manual",
      });

      // Extract session cookie from Set-Cookie header
      const setCookie = loginRes.headers.get("Set-Cookie") || "";
      const sessionMatch = setCookie.match(/siu_sess_autogestion_des01=([^;]+)/);

      if (!sessionMatch) {
        return Response.json({ error: "Login failed - credenciales inválidas" }, { status: 401, headers: cors });
      }

      const sessionCookie = `siu_sess_autogestion_des01=${sessionMatch[1]}`;

      // Verify login by fetching inicio_docente
      const verifyRes = await fetch(`${BASE}/inicio_docente`, {
        headers: {
          "Cookie": sessionCookie,
          "User-Agent": "Mozilla/5.0",
          "X-Requested-With": "XMLHttpRequest",
        },
      });

      if (verifyRes.status !== 200) {
        return Response.json({ error: "Login failed - no se pudo verificar sesión" }, { status: 401, headers: cors });
      }

      const html = await verifyRes.text();
      const nameMatch = html.match(/Bienvenido\s+([^<]+)/);
      const nombre = nameMatch ? nameMatch[1].trim() : "Docente";

      return Response.json({
        ok: true,
        session: sessionCookie,
        nombre,
      }, { headers: cors });
    }

    // ── GET /api/comisiones/clases ──
    if (path === "/api/comisiones/clases") {
      const session = request.headers.get("Authorization");
      if (!session) return Response.json({ error: "No session" }, { status: 401, headers: cors });

      const res = await fetch(`${BASE}/zona_clases?co=1`, {
        headers: { "Cookie": session, "X-Requested-With": "XMLHttpRequest", "User-Agent": "Mozilla/5.0" },
      });

      const html = await res.text();
      const comisiones = parseComisiones(html);

      return Response.json({ comisiones }, { headers: cors });
    }

    // ── GET /api/comisiones/parciales ──
    if (path === "/api/comisiones/parciales") {
      const session = request.headers.get("Authorization");
      if (!session) return Response.json({ error: "No session" }, { status: 401, headers: cors });

      const res = await fetch(`${BASE}/zona_comisiones?co=1`, {
        headers: { "Cookie": session, "X-Requested-With": "XMLHttpRequest", "User-Agent": "Mozilla/5.0" },
      });

      const html = await res.text();
      const comisiones = parseComisiones(html);

      return Response.json({ comisiones }, { headers: cors });
    }

    // ── GET /api/clases/:hash ──
    if (path.startsWith("/api/clases/")) {
      const session = request.headers.get("Authorization");
      if (!session) return Response.json({ error: "No session" }, { status: 401, headers: cors });

      const hash = path.replace("/api/clases/", "");
      const res = await fetch(`${BASE}/zona_clases/home/${hash}`, {
        headers: { "Cookie": session, "X-Requested-With": "XMLHttpRequest", "User-Agent": "Mozilla/5.0" },
      });

      const html = await res.text();
      const clases = parseClases(html);

      return Response.json(clases, { headers: cors });
    }

    // ── GET /api/asistencia/:hash/:claseId ──
    if (path.match(/^\/api\/asistencia\/[a-f0-9]+\/\d+$/)) {
      const session = request.headers.get("Authorization");
      if (!session) return Response.json({ error: "No session" }, { status: 401, headers: cors });

      const parts = path.split("/");
      const hash = parts[3];
      const claseId = parts[4];

      const res = await fetch(`${BASE}/asistencias/${hash}/${claseId}`, {
        headers: { "Cookie": session, "X-Requested-With": "XMLHttpRequest", "User-Agent": "Mozilla/5.0" },
      });

      const html = await res.text();
      const alumnos = parseAlumnos(html);

      return Response.json({ alumnos, claseId }, { headers: cors });
    }

    // ── POST /api/asistencia/:hash/:claseId ──
    if (path.match(/^\/api\/asistencia\/[a-f0-9]+\/\d+$/) && request.method === "POST") {
      const session = request.headers.get("Authorization");
      if (!session) return Response.json({ error: "No session" }, { status: 401, headers: cors });

      const parts = path.split("/");
      const hash = parts[3];
      const claseId = parts[4];
      const { alumnos } = await request.json();

      // Build form data like Guaraní expects
      const formParts = [`clase(ID)=${claseId}`];
      for (const [alumnoHash, estado] of Object.entries(alumnos)) {
        formParts.push(`alumnos%5B${alumnoHash}%5D=${estado}`);
        formParts.push(`%5BPRESENTE%5D=`);
      }

      const res = await fetch(`${BASE}/asistencias/${hash}/${claseId}`, {
        method: "POST",
        headers: {
          "Cookie": session,
          "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
          "X-Requested-With": "XMLHttpRequest",
          "User-Agent": "Mozilla/5.0",
          "Origin": "https://autogestion.usal.edu.ar",
          "Referer": `https://autogestion.usal.edu.ar/autogestion/asistencias/${hash}/${claseId}`,
        },
        body: formParts.join("&"),
      });

      return Response.json({
        ok: res.status === 200,
        status: res.status,
      }, { headers: cors });
    }

    // ── POST /api/asistencia-batch ──
    // Guardar asistencia en múltiples comisiones
    if (path === "/api/asistencia-batch" && request.method === "POST") {
      const session = request.headers.get("Authorization");
      if (!session) return Response.json({ error: "No session" }, { status: 401, headers: cors });

      const { comisiones, claseIds, alumnos } = await request.json();
      // comisiones: [{hash, claseId}]
      // alumnos: {hash: estado}

      const results = [];
      for (const com of comisiones) {
        const formParts = [`clase(ID)=${com.claseId}`];
        for (const [alumnoHash, estado] of Object.entries(alumnos)) {
          formParts.push(`alumnos%5B${alumnoHash}%5D=${estado}`);
          formParts.push(`%5BPRESENTE%5D=`);
        }

        try {
          const res = await fetch(`${BASE}/asistencias/${com.hash}/${com.claseId}`, {
            method: "POST",
            headers: {
              "Cookie": session,
              "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
              "X-Requested-With": "XMLHttpRequest",
              "User-Agent": "Mozilla/5.0",
              "Origin": "https://autogestion.usal.edu.ar",
            },
            body: formParts.join("&"),
          });
          results.push({ comision: com.id, ok: res.status === 200 });
        } catch (e) {
          results.push({ comision: com.id, ok: false, error: e.message });
        }
      }

      return Response.json({ results }, { headers: cors });
    }

    // ── GET /api/evaluaciones/:hash ──
    if (path.startsWith("/api/evaluaciones/") && request.method === "GET") {
      const session = request.headers.get("Authorization");
      if (!session) return Response.json({ error: "No session" }, { status: 401, headers: cors });

      const hash = path.replace("/api/evaluaciones/", "");
      const res = await fetch(`${BASE}/evaluaciones/ver_comision/${hash}`, {
        headers: { "Cookie": session, "X-Requested-With": "XMLHttpRequest", "User-Agent": "Mozilla/5.0" },
      });

      const html = await res.text();
      // Parse evaluaciones table
      const evals = [];
      const trRegex = /<tr[^>]*>([\s\S]*?)<\/tr>/g;
      const rows = extractAll(html, trRegex);
      for (const row of rows) {
        const tds = extractAll(row[1], /<td[^>]*>([\s\S]*?)<\/td>/g);
        if (tds.length >= 4) {
          evals.push({
            nombre: tds[0][1].replace(/<[^>]*>/g, "").trim(),
            tipo: tds[1][1].replace(/<[^>]*>/g, "").trim(),
            fecha: tds[2][1].replace(/<[^>]*>/g, "").trim(),
            estado: tds[3][1].replace(/<[^>]*>/g, "").trim(),
          });
        }
      }

      return Response.json({ evaluaciones: evals }, { headers: cors });
    }

    // ── Health check ──
    if (path === "/api/health") {
      return Response.json({ status: "ok", timestamp: new Date().toISOString() }, { headers: cors });
    }

    return Response.json({ error: "Not found" }, { status: 404, headers: cors });

  } catch (e) {
    return Response.json({ error: e.message }, { status: 500, headers: cors });
  }
}

export default {
  async fetch(request, env, ctx) {
    return handleRequest(request, env);
  },
};
