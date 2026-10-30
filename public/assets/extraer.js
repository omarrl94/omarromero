/*
 * Extrae el texto de un archivo en el navegador (PDF, Word, PowerPoint,
 * OpenDocument, Excel, texto y código). Lo usa la entrega de trabajos para
 * que la IA pueda preparar las preguntas de la defensa.
 *   window.extraerTexto(file) → Promise<string> ("" si no tiene texto legible)
 * Proyectos en ZIP: se lee el código de cada archivo (con su ruta) para la defensa.
 *   window.limpiarZip(file)   → Promise<File> el mismo proyecto sin carpetas de
 *                               compilación ni dependencias (node_modules, .git, target…)
 *   window.leerProyecto(blob)  → Promise<{ archivos: [{ ruta, tamano, codigo }], resumen }>
 * Capturas de pantalla (Word, PowerPoint, PDF e imágenes): para que la IA también las analice.
 *   window.extraerConCapturas(file) → Promise<{ texto, capturas: [base64 JPEG] }>
 *                               el texto lleva «[Captura n]» donde está cada imagen.
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

  /* ── Capturas de pantalla ───────────────────────────────────── */
  const MAX_CAPTURAS = 20;
  const IMAGEN = /^(png|jpe?g|gif|webp|bmp)$/;
  /** Reduce la imagen (máx. 1400 × 2000 px) a JPEG; null si es pequeña (iconos, logotipos) o no se puede leer. */
  async function aJpeg(blob) {
    let bmp;
    try { bmp = await createImageBitmap(blob); } catch { return null; }
    if (bmp.width < 160 || bmp.height < 100) return null;
    const k = Math.min(1, 1400 / bmp.width, 2000 / bmp.height);
    const c = document.createElement("canvas");
    c.width = Math.round(bmp.width * k); c.height = Math.round(bmp.height * k);
    const g = c.getContext("2d"); g.fillStyle = "#fff"; g.fillRect(0, 0, c.width, c.height); g.drawImage(bmp, 0, 0, c.width, c.height);
    return c.toDataURL("image/jpeg", 0.8).split(",")[1];
  }
  const relaciones = async (zip, ruta) => {
    const f = zip.file(ruta);
    if (!f) return {};
    const x = new DOMParser().parseFromString(await f.async("string"), "application/xml");
    return Object.fromEntries([...x.getElementsByTagName("Relationship")].map((r) => [r.getAttribute("Id"), r.getAttribute("Target")]));
  };
  // «../media/image1.png» desde «ppt/slides/» → «ppt/media/image1.png»
  const resolver = (base, ruta) => { const p = (base + ruta).split("/"), out = []; for (const x of p) x === ".." ? out.pop() : x !== "." && out.push(x); return out.join("/"); };

  /** Párrafos con «[Captura n]» donde hay una imagen (Word: w:p/w:t; PowerPoint: a:p/a:t). */
  async function textoConImagenes(zip, xmlRuta, base, rels, p, t, capturas, vistas) {
    const xml = new DOMParser().parseFromString(await zip.file(xmlRuta).async("string"), "application/xml");
    const lineas = [];
    for (const par of xml.getElementsByTagName(p)) {
      let s = "";
      for (const n of par.getElementsByTagName("*")) {
        if (n.tagName === t) s += n.textContent;
        else if (n.tagName === "w:tab") s += " ";
        else if ((n.tagName === "a:blip" || n.tagName === "v:imagedata") && capturas.length < MAX_CAPTURAS) {
          const ruta = rels[n.getAttribute("r:embed") || n.getAttribute("r:id")];
          if (!ruta || vistas.has(ruta)) continue;
          vistas.add(ruta);
          const f = zip.file(resolver(base, ruta));
          const jpg = f && IMAGEN.test(ruta.split(".").pop().toLowerCase()) && (await aJpeg(await f.async("blob")));
          if (jpg) { capturas.push(jpg); s += ` [Captura ${capturas.length}] `; }
        }
      }
      if (s.trim()) lineas.push(s.trim());
    }
    return lineas.join("\n");
  }

  async function pdfConCapturas(file) {
    if (!window.pdfjsLib) await cargar(CDN.pdf);
    pdfjsLib.GlobalWorkerOptions.workerSrc = CDN.pdfWorker;
    const doc = await pdfjsLib.getDocument({ data: await file.arrayBuffer() }).promise;
    const O = pdfjsLib.OPS, conImagen = new Set([O.paintImageXObject, O.paintInlineImageXObject, O.paintJpegXObject, O.paintImageXObjectRepeat].filter(Boolean));
    const out = [], capturas = [];
    for (let i = 1; i <= Math.min(doc.numPages, 80); i++) {
      const pag = await doc.getPage(i);
      const c = await pag.getTextContent();
      let s = `--- Página ${i} ---\n` + c.items.map((it) => it.str + (it.hasEOL ? "\n" : " ")).join("");
      // En un PDF las capturas no se pueden sacar sueltas: se guarda la página entera si tiene alguna imagen.
      if (capturas.length < MAX_CAPTURAS && (await pag.getOperatorList()).fnArray.some((f) => conImagen.has(f))) {
        const v0 = pag.getViewport({ scale: 1 }), v = pag.getViewport({ scale: Math.min(2, 1400 / v0.width) });
        const cv = document.createElement("canvas"); cv.width = Math.round(v.width); cv.height = Math.round(v.height);
        const g = cv.getContext("2d"); g.fillStyle = "#fff"; g.fillRect(0, 0, cv.width, cv.height);
        await pag.render({ canvasContext: g, viewport: v }).promise;
        const jpg = await aJpeg(await new Promise((ok) => cv.toBlob(ok, "image/png")));
        if (jpg) { capturas.push(jpg); s += `\n[Captura ${capturas.length}: página ${i} con imágenes]`; }
      }
      out.push(s);
    }
    return { texto: out.join("\n\n"), capturas };
  }

  async function conCapturas(file) {
    const ext = file.name.split(".").pop().toLowerCase();
    if (IMAGEN.test(ext)) { const jpg = await aJpeg(file); return { texto: jpg ? "[Captura 1]" : "", capturas: jpg ? [jpg] : [] }; }
    if (ext === "pdf") return pdfConCapturas(file);
    if (ext === "docx") {
      const zip = await zipDe(file), capturas = [];
      const texto = await textoConImagenes(zip, "word/document.xml", "word/", await relaciones(zip, "word/_rels/document.xml.rels"), "w:p", "w:t", capturas, new Set());
      return { texto, capturas };
    }
    if (ext === "pptx") {
      const zip = await zipDe(file), capturas = [], vistas = new Set();
      const diapos = Object.keys(zip.files).filter((n) => /^ppt\/slides\/slide\d+\.xml$/.test(n)).sort((a, b) => num(a) - num(b));
      const out = [];
      for (const [i, n] of diapos.entries()) {
        const rels = await relaciones(zip, n.replace(/slides\/(slide\d+\.xml)$/, "slides/_rels/$1.rels"));
        out.push(`--- Diapositiva ${i + 1} ---\n` + (await textoConImagenes(zip, n, "ppt/slides/", rels, "a:p", "a:t", capturas, vistas)) +
          // Las imágenes de una diapositiva están fuera de los cuadros de texto (p:pic).
          (await imagenesSueltas(zip, n, "ppt/slides/", rels, capturas, vistas)));
      }
      return { texto: out.join("\n\n"), capturas };
    }
    return { texto: await extraer(file), capturas: [] };
  }
  async function imagenesSueltas(zip, xmlRuta, base, rels, capturas, vistas) {
    const xml = new DOMParser().parseFromString(await zip.file(xmlRuta).async("string"), "application/xml");
    let s = "";
    for (const pic of xml.getElementsByTagName("p:pic")) {
      const blip = pic.getElementsByTagName("a:blip")[0], ruta = blip && rels[blip.getAttribute("r:embed")];
      if (!ruta || vistas.has(ruta) || capturas.length >= MAX_CAPTURAS) continue;
      vistas.add(ruta);
      const f = zip.file(resolver(base, ruta));
      const jpg = f && IMAGEN.test(ruta.split(".").pop().toLowerCase()) && (await aJpeg(await f.async("blob")));
      if (jpg) { capturas.push(jpg); s += `\n[Captura ${capturas.length}]`; }
    }
    return s;
  }
  window.CAPTURABLE = /\.(docx|pptx|pdf|png|jpe?g|gif|webp|bmp)$/i;
  window.extraerConCapturas = async (file) => {
    const max = /\.zip$/i.test(file.name) ? MAX_PROYECTO : MAX;
    try {
      const r = await conCapturas(file);
      return { texto: String(r.texto || "").replace(/\u0000/g, "").slice(0, max), capturas: r.capturas };
    } catch (e) {
      console.warn("No se han podido leer las capturas de", file.name, e);
      return { texto: await window.extraerTexto(file), capturas: [] };
    }
  };

  window.extraerTexto = async (file) => {
    const max = /\.zip$/i.test(file.name) ? MAX_PROYECTO : MAX;
    try { return String((await extraer(file)) || "").replace(/\u0000/g, "").slice(0, max); }
    catch (e) { console.warn("No se ha podido leer el texto de", file.name, e); return ""; }
  };
})();
