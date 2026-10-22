/**
 * Herramientas del examen (las activa el profesor en cada examen):
 *  · Bloc de notas: para apuntar cálculos o ideas. Se guarda solo en este
 *    navegador mientras dura el examen y se borra al entregar. No se envía.
 *  · Calculadora científica.
 *  · Resolución de circuitos: el alumno escribe sus ecuaciones (Kirchhoff, mallas…);
 *    el servidor comprueba si están bien y, solo entonces, resuelve el sistema.
 *  · Python: editor y ejecución en el propio navegador (Pyodide en un worker, con
 *    límite de tiempo). Solo en los módulos que la tienen activada (Programación 360).
 * Son ventanas dentro de la página: usarlas no cuenta como salir del examen.
 */
(() => {
  const ICONOS = { notas: "📝", calculadora: "🧮", circuitos: "⚡", python: "🐍" };
  const TITULOS = { notas: "Bloc de notas", calculadora: "Calculadora científica", circuitos: "Resolución de circuitos", python: "Python" };
  const CORTO = { notas: "Notas", calculadora: "Calculadora", circuitos: "Circuitos", python: "Python" };
  let dock = null, ventanas = {}, claveNotas = "";

  const guardar = (k, v) => { try { localStorage.setItem(k, v); } catch { /* sin almacenamiento */ } };
  const leer = (k) => { try { return localStorage.getItem(k) || ""; } catch { return ""; } };
  const borrar = (k) => { try { localStorage.removeItem(k); } catch { /* nada */ } };

  /* ── Calculadora: analizador de expresiones (sin eval) ─────────────── */
  const FUNCIONES = {
    sin: (x, g) => Math.sin(g ? (x * Math.PI) / 180 : x), cos: (x, g) => Math.cos(g ? (x * Math.PI) / 180 : x),
    tan: (x, g) => Math.tan(g ? (x * Math.PI) / 180 : x),
    asin: (x, g) => (g ? (Math.asin(x) * 180) / Math.PI : Math.asin(x)), acos: (x, g) => (g ? (Math.acos(x) * 180) / Math.PI : Math.acos(x)),
    atan: (x, g) => (g ? (Math.atan(x) * 180) / Math.PI : Math.atan(x)),
    ln: Math.log, log: Math.log10, sqrt: Math.sqrt, exp: Math.exp, abs: Math.abs,
  };
  const SINONIMOS = { sen: "sin", asen: "asin", arcsin: "asin", arccos: "acos", arctan: "atan", raiz: "sqrt" };

  function trocear(txt) {
    const s = txt.replace(/×/g, "*").replace(/÷/g, "/").replace(/[−–]/g, "-").replace(/π/g, " pi ").replace(/√/g, " sqrt ").replace(/²/g, "^2").replace(/³/g, "^3");
    const t = [];
    for (let i = 0; i < s.length;) {
      const c = s[i];
      if (/\s/.test(c)) { i++; continue; }
      const num = /^(\d+(?:[.,]\d*)?|[.,]\d+)(?:[eE][-+]?\d+)?/.exec(s.slice(i));
      if (num) { t.push({ k: "n", v: Number(num[0].replace(",", ".")) }); i += num[0].length; continue; }
      const id = /^[a-zA-Z]+/.exec(s.slice(i));
      if (id) { const w = id[0].toLowerCase(); t.push({ k: "id", v: SINONIMOS[w] || w }); i += w.length; continue; }
      if ("+-*/^()!%".includes(c)) { t.push({ k: c }); i++; continue; }
      throw new Error(`Símbolo no válido: «${c}»`);
    }
    return t;
  }

  function evaluar(txt, { grados, ans }) {
    const t = trocear(txt); let p = 0;
    const ver = () => t[p], toma = (k) => (t[p]?.k === k ? t[p++] : null);
    const empiezaFactor = (x) => x && (x.k === "n" || x.k === "id" || x.k === "(");
    const expr = () => { let v = termino(); for (;;) { if (toma("+")) v += termino(); else if (toma("-")) v -= termino(); else return v; } };
    const termino = () => {
      let v = unario();
      for (;;) {
        if (toma("*")) v *= unario();
        else if (toma("/")) { const d = unario(); v /= d; }
        else if (empiezaFactor(ver())) v *= potencia(); // multiplicación implícita: 2π, 3(4+1)
        else return v;
      }
    };
    const unario = () => (toma("-") ? -unario() : toma("+") ? unario() : potencia());
    const potencia = () => { const b = postfijo(); return toma("^") ? b ** unario() : b; };
    const postfijo = () => {
      let v = primario();
      for (;;) {
        if (toma("!")) { if (!Number.isInteger(v) || v < 0 || v > 170) throw new Error("Factorial no válido"); let f = 1; for (let i = 2; i <= v; i++) f *= i; v = f; }
        else if (toma("%")) v /= 100;
        else return v;
      }
    };
    const primario = () => {
      const x = t[p++];
      if (!x) throw new Error("Falta un número");
      if (x.k === "n") return x.v;
      if (x.k === "(") { const v = expr(); if (!toma(")")) throw new Error("Falta cerrar un paréntesis"); return v; }
      if (x.k === "id") {
        if (x.v === "pi") return Math.PI;
        if (x.v === "e") return Math.E;
        if (x.v === "ans") return ans ?? 0;
        const f = FUNCIONES[x.v];
        if (!f) throw new Error(`No conozco «${x.v}»`);
        // sin(30)^2 = (sin 30)²; sin 30 sin paréntesis también vale.
        return f(ver()?.k === "(" ? primario() : potencia(), grados);
      }
      throw new Error("Expresión incompleta");
    };
    const v = expr();
    if (p < t.length) throw new Error("Revisa la expresión");
    if (!Number.isFinite(v)) throw new Error(Number.isNaN(v) ? "Operación no válida" : "Resultado infinito (¿división entre 0?)");
    return v;
  }

  /** 1234,5 · 1,5·10⁻⁶ (formato español, notación científica si hace falta). */
  function formatear(v) {
    if (v === 0) return "0";
    const a = Math.abs(v);
    if (a >= 1e10 || a < 1e-4) {
      const [m, e] = v.toExponential(6).split("e");
      const sup = { "-": "⁻", "+": "", 0: "⁰", 1: "¹", 2: "²", 3: "³", 4: "⁴", 5: "⁵", 6: "⁶", 7: "⁷", 8: "⁸", 9: "⁹" };
      return `${m.replace(/\.?0+$/, "").replace(".", ",")}·10${[...e].map((c) => sup[c]).join("")}`;
    }
    return String(Number(v.toPrecision(10))).replace(".", ",");
  }

  /* ── Panel lateral (a la derecha) ───────────────────────────────── */
  let lateral = null;
  function ventana(tipo, contenido) {
    const w = document.createElement("section");
    w.className = `tool-win tool-${tipo}`; w.hidden = true;
    w.setAttribute("role", "region"); w.setAttribute("aria-label", TITULOS[tipo]);
    w.innerHTML = `<header class="tool-head"><span>${ICONOS[tipo]} ${TITULOS[tipo]}</span><button type="button" class="tool-x" aria-label="Ocultar ${TITULOS[tipo]}" title="Ocultar (no se pierde nada)">✕</button></header>${contenido}`;
    // La calculadora va arriba y las notas debajo.
    if (tipo === "calculadora") lateral.prepend(w); else lateral.appendChild(w);
    w.querySelector(".tool-x").onclick = () => mostrar(tipo, false);
    return w;
  }

  function mostrar(tipo, si = ventanas[tipo].hidden, foco = true) {
    const w = ventanas[tipo];
    w.hidden = !si;
    dock.querySelector(`[data-tool="${tipo}"]`).setAttribute("aria-pressed", si);
    const alguna = Object.values(ventanas).some((x) => !x.hidden);
    lateral.hidden = !alguna;
    document.body.classList.toggle("tools-open", alguna);
    if (si && foco) (w.querySelector(".calc-in, textarea") || w).focus({ preventScroll: true });
  }

  function crearNotas() {
    const w = ventana("notas", `<textarea class="notas-txt" placeholder="Apunta aquí lo que necesites (datos, cálculos intermedios…). Solo lo ves tú y se borra al entregar." spellcheck="false"></textarea>
      <footer class="tool-foot"><span class="muted" data-cuenta></span><button type="button" class="btn ghost sm" data-vaciar>Vaciar</button></footer>`);
    const ta = w.querySelector("textarea"), cuenta = w.querySelector("[data-cuenta]");
    ta.value = leer(claveNotas);
    const actualizar = () => { cuenta.textContent = ta.value.trim() ? `${ta.value.length} caracteres · guardado` : "Vacío"; };
    ta.addEventListener("input", () => { guardar(claveNotas, ta.value); actualizar(); });
    w.querySelector("[data-vaciar]").onclick = () => { if (!ta.value || confirm("¿Vaciar el bloc de notas?")) { ta.value = ""; guardar(claveNotas, ""); actualizar(); ta.focus(); } };
    actualizar();
    return w;
  }

  /* ── Circuitos ──────────────────────────────────────────────────── */
  function crearCircuitos(ex) {
    const C = ex.circuitos, txt = C.map(() => "");
    const w = ventana("circuitos", `<div class="circ">
      ${C.length > 1 ? `<label class="circ-lab">Circuito <select class="circ-sel">${C.map((c, n) => `<option value="${n}">${esc(c.titulo)}</option>`).join("")}</select></label>` : `<div class="circ-lab"><b>${esc(C[0].titulo)}</b></div>`}
      <div class="circ-inc"></div>
      <label class="circ-lab" for="circEc">Tus ecuaciones (una por línea)</label>
      <textarea id="circEc" class="circ-ec" spellcheck="false" placeholder="Ejemplos:\nI1 = I2 + I3\n12 - 4*I1 - 6*I2 = 0"></textarea>
      <div class="circ-acc"><button type="button" class="btn sm" data-comprobar>Comprobar y resolver</button><span class="muted circ-cuenta"></span></div>
      <div class="circ-res" aria-live="polite"></div>
      <p class="circ-ayuda muted">Escribe las ecuaciones de tu método (nudos y mallas de Kirchhoff…) con las incógnitas de arriba: <code>4*I1</code> o <code>4I1</code>, decimales con coma o punto. El sentido de cada corriente lo eliges tú. Solo se resuelven si <b>todas</b> están bien y bastan; si no, verás «Error» (sin decir cuál falla). Después copia los resultados en el examen.</p></div>`);
    const sel = w.querySelector(".circ-sel"), ta = w.querySelector(".circ-ec"), res = w.querySelector(".circ-res"), cuenta = w.querySelector(".circ-cuenta"), boton = w.querySelector("[data-comprobar]");
    let n = 0;
    const usados = C.map(() => 0);
    const pintarInc = () => {
      const c = C[n];
      w.querySelector(".circ-inc").innerHTML = `<b>Incógnitas:</b> ${c.incognitas.map((x) => `<span class="chip gray" title="Apartado ${x.apartado}: ${esc(x.etiqueta)}">${esc(x.nombre)}</span>`).join(" ")}
        <div class="muted" style="font-size:12px;margin-top:3px">${c.incognitas.map((x) => `${esc(x.nombre)} = ${esc(x.etiqueta || "apartado " + x.apartado)}${x.unidad ? ` (${esc(x.unidad)})` : ""}`).join(" · ")}</div>`;
      ta.value = txt[n]; res.innerHTML = "";
      cuenta.textContent = c.intentos ? `Comprobaciones: ${usados[n]} de ${c.intentos}` : "";
    };
    if (sel) sel.onchange = () => { txt[n] = ta.value; n = Number(sel.value); pintarInc(); };
    ta.addEventListener("input", () => (txt[n] = ta.value));
    boton.onclick = async () => {
      boton.disabled = true; res.innerHTML = `<p class="muted">Comprobando…</p>`;
      try {
        const r = await fetch("/api/examen/circuito", { method: "POST", credentials: "same-origin", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: ex.id, c: n, ecuaciones: ta.value.split(/\n+/) }) });
        const d = await r.json().catch(() => ({}));
        if (!r.ok) throw new Error(d.error || "No se ha podido comprobar");
        usados[n] = d.usados;
        if (C[n].intentos) cuenta.textContent = `Comprobaciones: ${d.usados} de ${C[n].intentos}`;
        const val = (v) => String(Number(v.toPrecision(6))).replace(".", ",");
        res.innerHTML = `<div class="circ-msg ${d.resuelto ? "ok" : "mal"}">${d.resuelto ? "✓" : "✗"} ${esc(d.mensaje)}</div>
          ${d.noSeEntiende?.length ? `<ul class="circ-lista">${d.noSeEntiende.map((x) => `<li class="mal"><code>${esc(x.txt)}</code><br><small>${esc(x.error)}</small></li>`).join("")}</ul>` : ""}
          ${d.resuelto ? `<table class="circ-sol">${Object.entries(d.resuelto).map(([k, v]) => { const i = C[n].incognitas.find((x) => x.nombre === k); return `<tr><th>${esc(k)}</th><td>${val(v)} ${esc(i?.unidad || "")}</td></tr>`; }).join("")}</table>
            <p class="muted" style="font-size:12px">Un valor negativo significa que esa corriente va en sentido contrario al que elegiste.</p>` : ""}`;
      } catch (e) { res.innerHTML = `<div class="circ-msg mal">${esc(e.message)}</div>`; }
      finally { boton.disabled = false; }
    };
    pintarInc();
    return w;
  }

  /* ── Python (Pyodide en un worker: un bucle infinito no bloquea el examen) ── */
  const PYODIDE = window.PYODIDE_BASE || "https://cdn.jsdelivr.net/pyodide/v0.26.4/full/"; // PYODIDE_BASE: solo para pruebas sin Internet
  const LIMITE_PY = 10_000; // ms por ejecución
  /** Se ejecuta dentro del worker (se pasa como texto: no puede usar nada de fuera). */
  function trabajadorPython() {
    importScripts(self.PYODIDE + "pyodide.js");
    const listo = loadPyodide({ indexURL: self.PYODIDE });
    listo.then(() => postMessage({ tipo: "listo" }), (e) => postMessage({ tipo: "fallo", s: String((e && e.message) || e) }));
    const interno = /^\s*File "\/lib\/python|_pyodide|pyodide\.|^\s*\^+\s*$/;
    onmessage = async (ev) => {
      let py;
      try { py = await listo; } catch (e) { postMessage({ tipo: "fin", error: "No se ha podido cargar Python. Comprueba la conexión." }); return; }
      const entrada = String(ev.data.stdin || "").split("\n");
      py.setStdin({ stdin: () => (entrada.length ? entrada.shift() : undefined) });
      py.setStdout({ batched: (s) => postMessage({ tipo: "out", s }) });
      py.setStderr({ batched: (s) => postMessage({ tipo: "err", s }) });
      const g = py.globals.get("dict")();
      try { await py.runPythonAsync(ev.data.codigo, { globals: g }); postMessage({ tipo: "fin" }); }
      catch (e) {
        // Solo las líneas que tienen que ver con el código del alumno (no las internas de Pyodide).
        const todas = String(e.message || e).trim().split("\n");
        const k = todas.findIndex((l) => /File "<exec>"/.test(l));
        const lineas = k >= 0 ? ["Traceback (most recent call last):", ...todas.slice(k).filter((l) => !interno.test(l) || /File "<exec>"/.test(l))] : [todas.at(-1)];
        postMessage({ tipo: "fin", error: lineas.join("\n").replace(/File "<exec>", line (\d+)/g, "Tu código, línea $1").trim() });
      } finally { g.destroy(); }
    };
  }
  const CODIGO_WORKER = `self.PYODIDE = ${JSON.stringify(PYODIDE)};\n(${trabajadorPython.toString()})();`;
  let claveCodigo = "";
  function crearPython() {
    const w = ventana("python", `<div class="py">
      <label class="circ-lab" for="pyCod">Código</label>
      <textarea id="pyCod" class="py-cod" spellcheck="false" autocapitalize="off" placeholder="print('Hola')"></textarea>
      <details class="py-ent"><summary>Entrada para <code>input()</code></summary><textarea class="py-in" spellcheck="false" placeholder="Una línea por cada input()"></textarea></details>
      <div class="circ-acc"><button type="button" class="btn sm" data-ejecutar disabled>▶ Ejecutar</button><span class="muted py-estado">Cargando Python…</span></div>
      <pre class="py-out" aria-live="polite" aria-label="Salida"></pre>
      <p class="circ-ayuda muted">Se ejecuta en tu navegador (máx. ${LIMITE_PY / 1000} s). Ctrl+Intro ejecuta; Tab sangra. Tu código se guarda solo y lo ve el profesor al entregar.</p></div>`);
    const ta = w.querySelector(".py-cod"), inp = w.querySelector(".py-in"), out = w.querySelector(".py-out"), estado = w.querySelector(".py-estado"), boton = w.querySelector("[data-ejecutar]");
    ta.value = leer(claveCodigo);
    ta.addEventListener("input", () => guardar(claveCodigo, ta.value));
    ta.addEventListener("keydown", (e) => {
      if (e.key === "Tab" && !e.shiftKey) { e.preventDefault(); const a = ta.selectionStart; ta.setRangeText("    ", a, ta.selectionEnd, "end"); guardar(claveCodigo, ta.value); }
      else if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) { e.preventDefault(); if (!boton.disabled) ejecutar(); }
    });
    let worker = null, listo = false;
    const nuevoWorker = () => {
      listo = false; boton.disabled = true; estado.textContent = "Cargando Python…";
      worker = new Worker(URL.createObjectURL(new Blob([CODIGO_WORKER], { type: "text/javascript" })));
      worker.onmessage = (e) => {
        if (e.data.tipo === "listo") { listo = true; boton.disabled = false; estado.textContent = "Python listo"; }
        if (e.data.tipo === "fallo") estado.textContent = "No se ha podido cargar Python (revisa la conexión).";
      };
      worker.onerror = () => { estado.textContent = "No se ha podido cargar Python (revisa la conexión)."; };
    };
    const ejecutar = () => new Promise((fin) => {
      out.textContent = ""; out.classList.remove("err"); boton.disabled = true; estado.textContent = "Ejecutando…";
      const t0 = Date.now();
      const reloj = setTimeout(() => {
        worker.terminate(); out.textContent += `\n⏱ Se ha parado: más de ${LIMITE_PY / 1000} s (¿un bucle infinito?)`; out.classList.add("err");
        nuevoWorker(); fin();
      }, LIMITE_PY);
      worker.onmessage = (e) => {
        const d = e.data;
        if (d.tipo === "out") out.textContent += d.s + "\n";
        else if (d.tipo === "err") out.textContent += d.s + "\n";
        else if (d.tipo === "fin") {
          clearTimeout(reloj);
          if (d.error) { out.textContent += d.error; out.classList.add("err"); }
          if (!out.textContent) out.textContent = "(sin salida)";
          estado.textContent = `Terminado en ${((Date.now() - t0) / 1000).toLocaleString("es-ES", { maximumFractionDigits: 1 })} s`;
          boton.disabled = false; fin();
        }
      };
      worker.postMessage({ codigo: ta.value, stdin: inp.value });
    });
    boton.onclick = ejecutar;
    nuevoWorker();
    window.codigoPython = () => ta.value;
    return w;
  }

  function crearCalculadora() {
    const T = [
      ["DEG", "sin", "cos", "tan", "π"],
      ["2nd", "asin", "acos", "atan", "e"],
      ["x²", "√", "xʸ", "ln", "log"],
      ["(", ")", "EXP", "1/x", "10ˣ"],
      ["7", "8", "9", "⌫", "AC"],
      ["4", "5", "6", "×", "÷"],
      ["1", "2", "3", "+", "−"],
      ["0", ",", "±", "Ans", "="],
    ];
    const clase = (k) => (/^[0-9,]$/.test(k) ? "d" : k === "=" ? "eq" : k === "AC" || k === "⌫" ? "del" : /^[×÷+−]$/.test(k) ? "op" : "fn");
    const w = ventana("calculadora", `<div class="calc">
      <div class="calc-pantalla"><input class="calc-in" type="text" inputmode="none" autocomplete="off" spellcheck="false" aria-label="Expresión" placeholder="0">
        <output class="calc-res" aria-live="polite">0</output><span class="calc-modo">DEG</span></div>
      <div class="calc-teclas">${T.flat().map((k) => `<button type="button" class="ck ${clase(k)}" data-k="${k}">${k}</button>`).join("")}</div>
      <div class="calc-hist" aria-label="Últimos resultados"></div></div>`);
    const inp = w.querySelector(".calc-in"), res = w.querySelector(".calc-res"), modo = w.querySelector(".calc-modo"), hist = w.querySelector(".calc-hist");
    let grados = true, ans = null, segunda = false, recien = false;
    const INSERTA = { "×": "×", "÷": "÷", "+": "+", "−": "−", "(": "(", ")": ")", "π": "π", "e": "e", ",": ",", "x²": "²", "xʸ": "^", "EXP": "E", "√": "√(", "ln": "ln(", "log": "log(", "sin": "sin(", "cos": "cos(", "tan": "tan(", "asin": "asin(", "acos": "acos(", "atan": "atan(", "10ˣ": "10^(", "1/x": "1/(", "Ans": "Ans" };
    const insertar = (txt) => {
      // Tras un resultado, un operador sigue la cuenta con «Ans»; un número empieza otra.
      if (recien) { inp.value = /^[×÷+−^²E]/.test(txt) ? "Ans" : ""; recien = false; }
      const a = inp.selectionStart ?? inp.value.length, b = inp.selectionEnd ?? inp.value.length;
      inp.value = inp.value.slice(0, a) + txt + inp.value.slice(b);
      inp.setSelectionRange(a + txt.length, a + txt.length);
      previa();
    };
    const previa = () => {
      if (!inp.value.trim()) { res.textContent = ans == null ? "0" : formatear(ans); res.classList.remove("err"); return; }
      try { res.textContent = "= " + formatear(evaluar(inp.value, { grados, ans })); res.classList.remove("err"); }
      catch { res.textContent = "…"; }
    };
    const calcular = () => {
      if (!inp.value.trim()) return;
      try {
        const v = evaluar(inp.value, { grados, ans });
        const b = document.createElement("button"); b.type = "button"; b.className = "calc-h";
        b.innerHTML = `<span>${esc(inp.value)}</span><b>${formatear(v)}</b>`; b.title = "Usar este resultado";
        b.onclick = () => insertar(formatear(v).includes("·") ? String(v) : formatear(v));
        hist.prepend(b); while (hist.children.length > 6) hist.lastChild.remove();
        ans = v; res.textContent = formatear(v); res.classList.remove("err"); recien = true;
        inp.value = formatear(v).includes("·") ? String(v).replace("e", "E") : formatear(v);
      } catch (e) { res.textContent = e.message; res.classList.add("err"); }
    };
    const pulsar = (k) => {
      if (k === "=") return calcular();
      if (k === "AC") { inp.value = ""; recien = false; return previa(); }
      if (k === "⌫") { recien = false; const a = inp.selectionStart ?? inp.value.length; if (a > 0) { inp.value = inp.value.slice(0, a - 1) + inp.value.slice(a); inp.setSelectionRange(a - 1, a - 1); } return previa(); }
      if (k === "DEG" || k === "RAD") { grados = !grados; const b = w.querySelector('[data-k="DEG"],[data-k="RAD"]'); b.dataset.k = b.textContent = grados ? "DEG" : "RAD"; modo.textContent = grados ? "DEG" : "RAD"; return previa(); }
      if (k === "2nd") { segunda = !segunda; w.querySelector('[data-k="2nd"]').classList.toggle("on", segunda); return; }
      if (k === "±") { recien = false; inp.value = inp.value.trim() ? `−(${inp.value})` : "−"; return previa(); }
      if (/^\d$/.test(k)) return insertar(k);
      let txt = INSERTA[k];
      if (segunda && ["sin", "cos", "tan"].includes(k)) txt = INSERTA["a" + k];
      if (segunda) { segunda = false; w.querySelector('[data-k="2nd"]').classList.remove("on"); }
      insertar(txt);
    };
    w.querySelector(".calc-teclas").addEventListener("click", (e) => { const b = e.target.closest("[data-k]"); if (b) { pulsar(b.dataset.k); inp.focus({ preventScroll: true }); } });
    inp.addEventListener("input", () => { recien = false; previa(); });
    inp.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === "=") { e.preventDefault(); calcular(); }
      else if (e.key === "Escape") { e.preventDefault(); pulsar("AC"); }
      else if (recien && /^[0-9(πa-zA-Z]$/.test(e.key)) { inp.value = ""; recien = false; }
      else if (recien && /^[-+*/^]$/.test(e.key)) { inp.value = "Ans"; recien = false; }
    });
    return w;
  }

  /**
   * Muestra las herramientas del examen: una barra fija a la derecha y, al
   * pulsarla, un panel lateral. En pantallas grandes se abren solas al empezar.
   */
  window.iniciarHerramientas = (ex, email) => {
    const h = ex.herramientas || {};
    const activas = ["calculadora", "python", "circuitos", "notas"].filter((k) => h[k] !== false && (k !== "circuitos" || (ex.circuitos || []).length) && (k !== "python" || ex.python));
    if (!activas.length || dock) return;
    claveNotas = `notas:${ex.id}:${email || ""}`; claveCodigo = `python:${ex.id}:${email || ""}`;
    dock = document.createElement("div");
    dock.className = "tool-dock"; dock.setAttribute("role", "toolbar"); dock.setAttribute("aria-label", "Herramientas del examen");
    dock.innerHTML = activas.map((k) => `<button type="button" class="tool-btn" data-tool="${k}" aria-pressed="false" title="${TITULOS[k]}"><span class="ico">${ICONOS[k]}</span><span class="lbl">${CORTO[k]}</span></button>`).join("");
    lateral = document.createElement("aside");
    lateral.className = "tool-side"; lateral.hidden = true; lateral.setAttribute("aria-label", "Herramientas");
    document.body.append(lateral, dock);
    if (activas.includes("calculadora")) ventanas.calculadora = crearCalculadora();
    if (activas.includes("python")) ventanas.python = crearPython();
    if (activas.includes("circuitos")) ventanas.circuitos = crearCircuitos(ex);
    if (activas.includes("notas")) ventanas.notas = crearNotas();
    dock.addEventListener("click", (e) => { const b = e.target.closest("[data-tool]"); if (b) mostrar(b.dataset.tool); });
    // En pantallas grandes se abren solas (Python, que ocupa más, se abre al pulsarlo).
    if (window.innerWidth >= 1100) activas.filter((k) => k !== "python").forEach((k) => mostrar(k, true, false));
  };

  /** Al entregar: se quitan las herramientas y se borran las notas. */
  window.cerrarHerramientas = () => {
    if (!dock) return;
    dock.remove(); lateral?.remove(); document.body.classList.remove("tools-open");
    borrar(claveNotas); borrar(claveCodigo); delete window.codigoPython;
    dock = null; lateral = null; ventanas = {};
  };

  // Para pruebas
  window.__calc = { evaluar, formatear };
})();
