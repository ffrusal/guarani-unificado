// Guaraní Unificado - Cloudflare Worker v4
const BASE = "https://autogestion.usal.edu.ar/autogestion";

function corsHeaders(origin) {
  return {
    "Access-Control-Allow-Origin": origin || "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
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

// ── Extract HTML content from Guaraní's on_arrival() ──
// Guaraní wraps its data in: kernel.renderer.on_arrival({"content":"<html>...",...});
// The approach (from the working PHP): find on_arrival({...}), JSON.parse the arg, get .content
function extractContent(rawText) {
  // If it's XHR JSON response, parse outer JSON first to get cont
  let html = rawText;
  try {
    const outer = JSON.parse(rawText);
    if (outer.cont) html = outer.cont;
  } catch (e) {}

  // Now html contains page HTML with <script>kernel.renderer.on_arrival({...});</script>
  // Find the on_arrival call and extract its JSON argument using brace matching
  const marker = "on_arrival(";
  const idx = html.indexOf(marker);
  if (idx === -1) return html;

  const jsonStart = idx + marker.length;
  
  // Find matching closing brace by counting
  let depth = 0;
  let inString = false;
  let escape = false;
  let jsonEnd = -1;
  
  for (let i = jsonStart; i < html.length; i++) {
    const ch = html[i];
    
    if (escape) { escape = false; continue; }
    if (ch === '\\') { escape = true; continue; }
    
    if (ch === '"' && !escape) { inString = !inString; continue; }
    if (inString) continue;
    
    if (ch === '{') depth++;
    if (ch === '}') {
      depth--;
      if (depth === 0) { jsonEnd = i + 1; break; }
    }
  }
  
  if (jsonEnd === -1) {
    console.log("Could not find matching brace for on_arrival");
    return html;
  }
  
  const jsonStr = html.substring(jsonStart, jsonEnd);
  
  try {
    const obj = JSON.parse(jsonStr);
    if (obj.content) {
      console.log("Extracted content length:", obj.content.length);
      return obj.content;
    }
  } catch (e) {
    console.log("on_arrival JSON parse error:", e.message);
    // Try with the first 100 chars for debugging
    console.log("JSON start:", jsonStr.substring(0, 100));
  }
  
  return html;
}

function extractAll(html, regex) {
  const matches = [];
  let m;
  while ((m = regex.exec(html)) !== null) matches.push(m);
  return matches;
}

// ── Parse comisiones from extracted content HTML ──
function parseComisiones(rawText) {
  const content = extractContent(rawText);
  const comisiones = [];
  
  // Find all rows with data-link (comision rows)
  // Pattern: <tr data-link='...zona_clases/home/HASH...'> ... </tr>
  const trRegex = /<tr[^>]*data-link=['"](.*?)['"][^>]*>([\s\S]*?)<\/tr>/g;
  const rows = extractAll(content, trRegex);
  
  console.log("Found data-link rows:", rows.length);
  
  for (const row of rows) {
    const dataLink = row[1];
    const rowContent = row[2];
    
    // Extract hash from the URL
    const hashMatch = dataLink.match(/home\/([a-f0-9]+)/);
    if (!hashMatch) continue;
    const hash = hashMatch[1];
    
    // Extract comision ID from the <a> tag
    const aMatch = rowContent.match(/<a[^>]*>([^<]+)<\/a>/);
    const comisionId = aMatch ? aMatch[1].trim() : "";
    
    // Extract all TD cells
    const tdRegex = /<td[^>]*>([\s\S]*?)<\/td>/g;
    const tds = extractAll(rowContent, tdRegex);
    const clean = (idx) => tds[idx] ? tds[idx][1].replace(/<[^>]*>/g, "").trim() : "";
    
    // Find materia name: look backwards from this row's position for header-actividad
    const rowPos = content.indexOf(row[0]);
    const before = content.substring(Math.max(0, rowPos - 500), rowPos);
    let materia = "Sin nombre";
    const materiaMatch = before.match(/class=['"]header-actividad['"][^>]*>([\s\S]*?)<\/th>/);
    if (materiaMatch) {
      materia = materiaMatch[1].replace(/<[^>]*>/g, "").trim();
      // Remove code in parentheses: "Ética (501-15-2240)" -> "Ética"
      const codeMatch = materia.match(/^(.+?)\s*\([^)]+\)\s*$/);
      if (codeMatch) materia = codeMatch[1].trim();
    }
    
    comisiones.push({
      id: comisionId,
      hash: hash,
      materia: materia,
      subcomision: clean(1),
      ubicacion: clean(2),
      responsabilidad: clean(3),
      turno: clean(4),
      inscriptos: parseInt(clean(5)) || 0,
    });
  }
  
  return comisiones;
}

// ── Parse clases ──
function parseClases(rawText) {
  const html = extractContent(rawText);
  const dictadas = [];
  const sinDictar = [];

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
  return { dictadas, sinDictar };
}

// ── Extract ALL on_arrival contents (asistencia has 3 calls) ──
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
      if (obj.content) {
        contents.push(obj.content);
        console.log("on_arrival found:", obj.info?.id, "content_len:", obj.content.length);
      }
    } catch (e) {
      console.log("on_arrival parse error:", e.message);
    }
    
    searchFrom = jsonEnd;
  }
  
  return contents.join("\n");
}

// ── Parse alumnos ──
function parseAlumnos(rawText) {
  // Asistencia page has 3 on_arrival calls. Students are in "edicion_asistencias".
  // Extract ALL on_arrival contents and search in the combined result.
  const html = extractAllContents(rawText);
  console.log("Combined contents length:", html.length);
  
  const alumnos = [];
  const selRegex = /name="alumnos\[([a-f0-9]+)\]\[PRESENTE\]"[\s\S]*?<\/select>/g;
  const sels = extractAll(html, selRegex);
  
  console.log("Select matches:", sels.length);
  
  for (const sel of sels) {
    const hash = sel[1];
    const sh = sel[0];
    const sm = sh.match(/selected[^>]*value="(\d+)"|value="(\d+)"[^>]*selected/);
    alumnos.push({ hash, estado: sm ? parseInt(sm[1] || sm[2]) : 0, nombre: "", legajo: "" });
  }

  // Extract names using truncate div pattern (from PHP)
  const nameRegex = /class="truncate"[^>]*>([^<]+)<\/div>/g;
  const names = extractAll(html, nameRegex);
  for (let i = 0; i < Math.min(names.length, alumnos.length); i++) {
    alumnos[i].nombre = names[i][1].trim();
  }

  // Legajos - numbers inside divs after truncate div
  const legRegex = /<div>(\d{4,6})<\/div>/g;
  const legs = extractAll(html, legRegex);
  // Map legajos by position - they appear after some students (not all)
  // Better approach: parse each box-asistencia block individually
  const boxRegex = /class='box-asistencia[^']*'>([\s\S]*?)<\/div><\/div><\/div>/g;
  const boxes = extractAll(html, boxRegex);
  for (let i = 0; i < Math.min(boxes.length, alumnos.length); i++) {
    const box = boxes[i][1];
    const legMatch = box.match(/<div>(\d{4,6})<\/div>/);
    if (legMatch) alumnos[i].legajo = legMatch[1];
  }

  return alumnos;
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

      // Verify + get name
      const vRes = await gFetch("inicio_docente", session);
      const vHtml = await vRes.text();
      const nm = vHtml.match(/Bienvenido\s+([^<]+)/);

      return Response.json({ ok: true, session, nombre: nm ? nm[1].trim() : "Docente" }, { headers: cors });
    }

    // ── COMISIONES (Libro de Temas) ──
    if (path === "/api/comisiones/clases") {
      const session = request.headers.get("Authorization");
      if (!session) return Response.json({ error: "No session" }, { status: 401, headers: cors });

      // Fetch as regular page (like PHP does with FOLLOWLOCATION)
      const res = await gFetch("zona_clases", session);
      const raw = await res.text();

      if (raw.includes("acceso/login")) return Response.json({ error: "Sesión expirada" }, { status: 401, headers: cors });

      const comisiones = parseComisiones(raw);
      console.log("Comisiones found:", comisiones.length);

      return Response.json({ comisiones }, { headers: cors });
    }

    // ── COMISIONES (Parciales) ──
    if (path === "/api/comisiones/parciales") {
      const session = request.headers.get("Authorization");
      if (!session) return Response.json({ error: "No session" }, { status: 401, headers: cors });

      const res = await gFetch("zona_comisiones", session);
      const raw = await res.text();
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
      const raw = await res.text();
      if (raw.includes("acceso/login")) return Response.json({ error: "Sesión expirada" }, { status: 401, headers: cors });

      const clases = parseClases(raw);
      console.log("Clases:", clases.dictadas.length, "/", clases.sinDictar.length);
      return Response.json(clases, { headers: cors });
    }

    // ── ASISTENCIA GET ──
    if (path.match(/^\/api\/asistencia\/[a-f0-9]+\/\d+$/) && request.method === "GET") {
      const session = request.headers.get("Authorization");
      if (!session) return Response.json({ error: "No session" }, { status: 401, headers: cors });

      const [, , , hash, claseId] = path.split("/");
      const res = await gFetch(`asistencias/${hash}/${claseId}`, session, {
        headers: {
          "Referer": `${BASE}/zona_clases`,
        }
      });
      const raw = await res.text();
      
      // DEBUG
      console.log("Asistencia response status:", res.status);
      console.log("Asistencia raw length:", raw.length);
      console.log("Contains on_arrival:", raw.includes("on_arrival("));
      console.log("on_arrival count:", (raw.match(/on_arrival\(/g) || []).length);
      console.log("Contains alumnos:", raw.includes("alumnos["));
      console.log("Raw first 300:", raw.substring(0, 300));
      console.log("Contains edicion_asistencias:", raw.includes("edicion_asistencias"));
      console.log("Contains box-asistencia:", raw.includes("box-asistencia"));
      
      if (raw.includes("acceso/login")) return Response.json({ error: "Sesión expirada" }, { status: 401, headers: cors });

      const alumnos = parseAlumnos(raw);
      console.log("Alumnos:", alumnos.length);
      return Response.json({ alumnos, claseId }, { headers: cors });
    }

    // ── ASISTENCIA POST ──
    if (path.match(/^\/api\/asistencia\/[a-f0-9]+\/\d+$/) && request.method === "POST") {
      const session = request.headers.get("Authorization");
      if (!session) return Response.json({ error: "No session" }, { status: 401, headers: cors });

      const [, , , hash, claseId] = path.split("/");
      const { alumnos } = await request.json();

      // Build form data like PHP does: alumnos[HASH][PRESENTE] = valor
      const params = new URLSearchParams();
      params.set("clase[ID]", claseId);
      for (const [ah, estado] of Object.entries(alumnos)) {
        params.set(`alumnos[${ah}][PRESENTE]`, estado.toString());
      }

      const res = await gFetch(`asistencias/${hash}/${claseId}`, session, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
          "X-Requested-With": "XMLHttpRequest",
          "Origin": "https://autogestion.usal.edu.ar",
        },
        body: params.toString(),
      });

      return Response.json({ ok: res.status === 200 }, { headers: cors });
    }

    // ── ASISTENCIA BATCH ──
    if (path === "/api/asistencia-batch" && request.method === "POST") {
      const session = request.headers.get("Authorization");
      if (!session) return Response.json({ error: "No session" }, { status: 401, headers: cors });

      const { comisiones, alumnos } = await request.json();
      const results = [];

      for (const com of comisiones) {
        try {
          const params = new URLSearchParams();
          params.set("clase[ID]", com.claseId);
          for (const [ah, estado] of Object.entries(alumnos)) {
            params.set(`alumnos[${ah}][PRESENTE]`, estado.toString());
          }

          const res = await gFetch(`asistencias/${com.hash}/${com.claseId}`, session, {
            method: "POST",
            headers: {
              "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
              "X-Requested-With": "XMLHttpRequest",
              "Origin": "https://autogestion.usal.edu.ar",
            },
            body: params.toString(),
          });
          results.push({ comision: com.id, ok: res.status === 200 });
        } catch (e) {
          results.push({ comision: com.id, ok: false, error: e.message });
        }
      }

      return Response.json({ results }, { headers: cors });
    }

    // ── EVALUACIONES ──
    if (path.startsWith("/api/evaluaciones/") && request.method === "GET") {
      const session = request.headers.get("Authorization");
      if (!session) return Response.json({ error: "No session" }, { status: 401, headers: cors });

      const hash = path.replace("/api/evaluaciones/", "");
      const res = await gFetch(`evaluaciones/ver_comision/${hash}`, session);
      const raw = await res.text();
      if (raw.includes("acceso/login")) return Response.json({ error: "Sesión expirada" }, { status: 401, headers: cors });

      const content = extractContent(raw);
      const evals = [];
      const rows = extractAll(content, /<tr[^>]*>([\s\S]*?)<\/tr>/g);
      for (const row of rows) {
        const tds = extractAll(row[1], /<td[^>]*>([\s\S]*?)<\/td>/g);
        if (tds.length >= 4) {
          const cl = (s) => s.replace(/<[^>]*>/g, "").trim();
          evals.push({ nombre: cl(tds[0][1]), tipo: cl(tds[1][1]), fecha: cl(tds[2][1]), estado: cl(tds[3][1]) });
        }
      }
      return Response.json({ evaluaciones: evals }, { headers: cors });
    }

    if (path === "/api/health") return Response.json({ ok: true }, { headers: cors });

    return Response.json({ error: "Not found" }, { status: 404, headers: cors });
  } catch (e) {
    console.log("Error:", e.message, e.stack);
    return Response.json({ error: e.message }, { status: 500, headers: cors });
  }
}

export default { fetch: handleRequest };