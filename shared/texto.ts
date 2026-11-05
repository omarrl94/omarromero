/** Minúsculas y sin tildes, para comparar texto en español. */
export function normalizar(texto: string): string {
  return texto
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

/** ¿Aparece la palabra o expresión como término completo? */
export function contieneTermino(textoNormalizado: string, termino: string): boolean {
  const t = normalizar(termino).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return new RegExp(`(^|[^a-z0-9])${t}($|[^a-z0-9])`).test(textoNormalizado);
}

/** Quita etiquetas HTML y entidades básicas, y recorta. */
export function textoPlano(html: string, max = 400): string {
  const limpio = html
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, ' ')
    .trim();
  return limpio.length > max ? limpio.slice(0, max - 1).trimEnd() + '…' : limpio;
}
