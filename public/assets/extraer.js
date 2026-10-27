/*
 * Extrae el texto de un archivo en el navegador (PDF, Word, PowerPoint,
 * OpenDocument, Excel, texto y código). Lo usa la entrega de trabajos para
 * que la IA pueda preparar las preguntas de la defensa.
 *   window.extraerTexto(file) → Promise<string> ("" si no tiene texto legible)
 * Proyectos en ZIP: se lee el código de cada archivo (con su ruta) para la defensa.
 *   window.limpiarZip(file)   → Promise<File> el mismo proyecto sin carpetas de
 *                               compilación ni dependencias (node_modules, .git, target…)
 *   window.leerProyecto(blob)  → Promise<{ archivos: [{ ruta, tamano, codigo }], resumen }>
 */
(() => {
  const CDN = {
    jszip: "https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js",
    pdf: "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js",
    pdfWorker: "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js",
  };
  const MAX = 60000, MAX_PROYECTO = 150000;
  const TEXTO = /^(txt|md|c|cpp|h|java|py|js|ts|html|css|sql|json|xml|csv|ino|sh|ps1)$/;
  // Código y configuración que interesa leer de un proyecto.
  const CODIGO = /\.(java|kt|kts|py|ipynb|js|mjs|cjs|jsx|ts|tsx|vue|svelte|html?|css|scss|sass|less|php|rb|go|rs|cs|c|cc|cpp|h|hpp|swift|dart|sql|sh|bat|ps1|ino|gradle|properties|ya?ml|toml|ini|cfg|xml|json|md|txt|csv|fxml|xaml|razor|cshtml|jsp|r|m|scala|lua|pl|asm)$/i;
  // Carpetas y archivos que no son del alumno (dependencias, compilados, entornos, IDE).
  const SOBRA = /(^|\/)(node_modules|\.git|\.svn|\.idea|\.vscode|\.vs|\.gradle|\.mvn|target|build|dist|out|bin|obj|venv|\.venv|env|__pycache__|\.pytest_cache|\.dart_tool|\.next|\.nuxt|coverage|Pods|DerivedData|__MACOSX)(\/|$)|(^|\/)\.DS_Store$|\.(class|jar|war|exe|dll|so|o|pyc|apk|aab|ipa|dex|lock)$|package-lock\.json$|yarn\.lock$/i;
  const LENGUAJE = { java: "Java", kt: "Kotlin", py: "Python", js: "JavaScript", mjs: "JavaScript", jsx: "JavaScript", ts: "TypeScript", tsx: "TypeScript", html: "HTML", htm: "HTML", css: "CSS", scss: "CSS", php: "PHP", cs: "C#", c: "C", cpp: "C++", h: "C/C++", sql: "SQL", xml: "XML", json: "JSON", md: "Markdown", dart: "Dart", swift: "Swift", go: "Go", rs: "Rust", vue: "Vue", gradle: "Gradle", fxml: "FXML", kts: "Kotlin" };
  const lenguaje = (ruta) => LENGUAJE[(ruta.split(".").pop() || "").toLowerCase()] || "Otros";
  const cargar = (src) => new Promise((ok, ko) => {
    const s = document.createElement("script"); s.src = src; s.onload = ok;
    s.onerror = () => ko(new Error("no se ha podido cargar una librería")); document.head.appendChild(s);
  });
  const parrafos = (xml, p, t) => [...new DOMParser().parseFromString(xml, "application/xml").getElementsByTagName(p)]
    .map((n) => [...n.getElementsByTagName(t)].map((x) => x.textContent).join("").trim()).filter(Boolean);
  const zipDe = async (file) => { if (!window.JSZip) await cargar(CDN.jszip); return JSZip.loadAsync(await file.arrayBuffer()); };
  const num = (n) => Number((n.match(/(\d+)\.xml$/) || [0, 0])[1]);

  async function pdf(file) {
    if (!window.pdfjsLib) await cargar(CDN.pdf);
    pdfjsLib.GlobalWorkerOptions.workerSrc = CDN.pdfWorker;
    const doc = await pdfjsLib.getDocument({ data: await file.arrayBuffer() }).promise;
    const out = [];
    for (let i = 1; i <= Math.min(doc.numPages, 80); i++) {
      const c = await (await doc.getPage(i)).getTextContent();
      out.push(`--- Página ${i} ---\n` + c.items.map((it) => it.str + (it.hasEOL ? "\n" : " ")).join(""));
    }
    return out.join("\n\n");
  }

  async function extraer(file) {
    const ext = file.name.split(".").pop().toLowerCase();
    if (TEXTO.test(ext)) return file.text();
    if (ext === "pdf") return pdf(file);
    if (ext === "docx") return parrafos(await (await zipDe(file)).file("word/document.xml").async("string"), "w:p", "w:t").join("\n");
    if (ext === "pptx") {
      const zip = await zipDe(file);
      const diapos = Object.keys(zip.files).filter((n) => /^ppt\/slides\/slide\d+\.xml$/.test(n)).sort((a, b) => num(a) - num(b));
      const out = [];
      for (const [i, n] of diapos.entries()) out.push(`--- Diapositiva ${i + 1} ---\n` + parrafos(await zip.file(n).async("string"), "a:p", "a:t").join("\n"));
      return out.join("\n\n");
    }
    if (ext === "xlsx") {
      const zip = await zipDe(file);
      const f = zip.file("xl/sharedStrings.xml");
      return f ? parrafos(await f.async("string"), "si", "t").join("\n") : "";
    }
    if (["odt", "odp", "ods"].includes(ext)) {
      const zip = await zipDe(file);
      const doc = new DOMParser().parseFromString(await zip.file("content.xml").async("string"), "application/xml");
      return [...doc.getElementsByTagName("text:p"), ...doc.getElementsByTagName("text:h")].map((n) => n.textContent.trim()).filter(Boolean).join("\n");
    }
    if (ext === "zip") return textoProyecto(await leerProyecto(file));
    return ""; // imágenes, RAR/7z, .doc antiguos…: sin texto
  }

  /** Archivos del proyecto (sin lo que sobra) con su código. */
  async function leerProyecto(blob) {
    if (!window.JSZip) await cargar(CDN.jszip);
    const zip = await JSZip.loadAsync(blob instanceof Blob ? await blob.arrayBuffer() : blob);
    const archivos = [];
    for (const [ruta, f] of Object.entries(zip.files)) {
      if (f.dir || SOBRA.test(ruta)) continue;
      const tamano = f._data?.uncompressedSize ?? 0;
      let codigo = null;
      if (CODIGO.test(ruta) && tamano < 400_000) {
        codigo = await f.async("string");
        if (/\u0000/.test(codigo)) codigo = null; // binario disfrazado
        else if (/\.ipynb$/i.test(ruta)) { try { codigo = JSON.parse(codigo).cells.map((c) => (Array.isArray(c.source) ? c.source.join("") : c.source)).join("\n\n# ----\n"); } catch { /* lo deja como está */ } }
      }
      archivos.push({ ruta, tamano, codigo });
    }
    // Quita la carpeta raíz común («MiProyecto/…») para que las rutas sean más cortas.
    const raiz = archivos.length && archivos.every((a) => a.ruta.includes("/") && a.ruta.split("/")[0] === archivos[0].ruta.split("/")[0]) ? archivos[0].ruta.split("/")[0] + "/" : "";
    if (raiz) archivos.forEach((a) => (a.ruta = a.ruta.slice(raiz.length)));
    archivos.sort((a, b) => a.ruta.localeCompare(b.ruta));
    const resumen = {};
    for (const a of archivos.filter((x) => x.codigo != null)) {
      const l = lenguaje(a.ruta); resumen[l] ||= { archivos: 0, lineas: 0 };
      resumen[l].archivos++; resumen[l].lineas += a.codigo.split("\n").length;
    }
    return { archivos, resumen, raiz: raiz.replace(/\/$/, "") };
  }

  /** Texto del proyecto para la IA: estructura de carpetas y código de cada archivo (lo importante primero). */
  function textoProyecto(p) {
    const peso = (a) => (/(^|\/)(test|tests|androidTest)\//i.test(a.ruta) ? 2 : /\.(json|xml|ya?ml|properties|gradle|toml|ini|cfg|csv|txt|md)$/i.test(a.ruta) ? 1 : 0);
    const cab = `=== Proyecto${p.raiz ? ` «${p.raiz}»` : ""}: ${p.archivos.length} archivos · ${Object.entries(p.resumen).map(([l, r]) => `${l}: ${r.archivos} (${r.lineas} líneas)`).join(", ")} ===\n` +
      `Estructura:\n${p.archivos.map((a) => "  " + a.ruta).slice(0, 300).join("\n")}\n`;
    let out = cab;
    for (const a of p.archivos.filter((x) => x.codigo != null).sort((a, b) => peso(a) - peso(b) || a.ruta.localeCompare(b.ruta))) {
      const trozo = `\n### ${a.ruta}\n${a.codigo}\n`;
      if (out.length + trozo.length > MAX_PROYECTO) { out += `\n### ${a.ruta} (no cabe: solo se indica que existe)\n`; continue; }
      out += trozo;
    }
    return out;
  }

  /** El mismo ZIP sin dependencias ni compilados (suele bajar de 4 MB). Si no quita nada, devuelve el original. */
  window.limpiarZip = async (file) => {
    if (!/\.zip$/i.test(file.name)) return file;
    if (!window.JSZip) await cargar(CDN.jszip);
    const zip = await JSZip.loadAsync(await file.arrayBuffer());
    const fuera = Object.keys(zip.files).filter((r) => SOBRA.test(r));
    if (!fuera.length) return file;
    fuera.forEach((r) => zip.remove(r));
    const blob = await zip.generateAsync({ type: "blob", compression: "DEFLATE", compressionOptions: { level: 9 } });
    const limpio = new File([blob], file.name, { type: "application/zip" });
    limpio.quitados = fuera.length;
    return limpio;
  };
  window.leerProyecto = leerProyecto;

  window.extraerTexto = async (file) => {
    const max = /\.zip$/i.test(file.name) ? MAX_PROYECTO : MAX;
    try { return String((await extraer(file)) || "").replace(/\u0000/g, "").slice(0, max); }
    catch (e) { console.warn("No se ha podido leer el texto de", file.name, e); return ""; }
  };
})();
