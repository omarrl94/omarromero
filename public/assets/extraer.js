/*
 * Extrae el texto de un archivo en el navegador (PDF, Word, PowerPoint,
 * OpenDocument, Excel, texto y código). Lo usa la entrega de trabajos para
 * que la IA pueda preparar las preguntas de la defensa.
 *   window.extraerTexto(file) → Promise<string> ("" si no tiene texto legible)
 */
(() => {
  const CDN = {
    jszip: "https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js",
    pdf: "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js",
    pdfWorker: "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js",
  };
  const MAX = 60000;
  const TEXTO = /^(txt|md|c|cpp|h|java|py|js|ts|html|css|sql|json|xml|csv|ino|sh|ps1)$/;
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
    return ""; // imágenes, ZIP, .doc antiguos…: sin texto
  }

  window.extraerTexto = async (file) => {
    try { return String((await extraer(file)) || "").replace(/\u0000/g, "").slice(0, MAX); }
    catch (e) { console.warn("No se ha podido leer el texto de", file.name, e); return ""; }
  };
})();
