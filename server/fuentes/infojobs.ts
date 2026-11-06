import type { OfertaBruta } from '../../shared/ofertas';
import { variable } from '../entorno';
import { pedirJson, type Fuente } from './comun';

interface RespuestaInfojobs {
  offers: {
    id: string;
    title: string;
    city?: string;
    province?: { value?: string };
    link: string;
    published: string;
    updated?: string;
    author?: { name?: string };
    contractType?: { value?: string };
    workDay?: { value?: string };
    experienceMin?: { value?: string };
    requirementMin?: string;
    teleworking?: { value?: string };
  }[];
}

/** Una llamada por término: 3 llamadas por actualización (informática). */
export const TERMINOS_INFOJOBS = ['prácticas', 'becario', 'junior'];
/** Categorías del sector comercial (Actividades Comerciales): una llamada de «prácticas» por categoría. */
export const CATEGORIAS_COMERCIO_INFOJOBS = ['comercial-ventas', 'venta-al-detalle', 'marketing-comunicacion', 'atencion-a-clientes', 'compras-logistica-almacen'];

export function urlInfojobs(q: string, categoria = 'informatica-telecomunicaciones'): string {
  const p = new URLSearchParams({
    q,
    province: 'madrid',
    category: categoria,
    sinceDate: '_15_DAYS',
    maxResults: '50',
    order: 'updated-desc',
  });
  return `https://api.infojobs.net/api/9/offer?${p}`;
}

export const infojobs: Fuente = {
  id: 'infojobs',
  nombre: 'InfoJobs',
  configurada: () => Boolean(variable('INFOJOBS_CLIENT_ID') && variable('INFOJOBS_CLIENT_SECRET')),
  async obtener(fetchImpl = fetch) {
    const auth = Buffer.from(`${variable('INFOJOBS_CLIENT_ID')}:${variable('INFOJOBS_CLIENT_SECRET')}`).toString('base64');
    const ofertas: OfertaBruta[] = [];
    const consultas = [
      ...TERMINOS_INFOJOBS.map((q) => ({ q, categoria: 'informatica-telecomunicaciones', obligatoria: true })),
      ...CATEGORIAS_COMERCIO_INFOJOBS.map((categoria) => ({ q: 'prácticas', categoria, obligatoria: false })),
    ];
    for (const { q, categoria, obligatoria } of consultas) {
      let r: RespuestaInfojobs;
      try {
        r = await pedirJson<RespuestaInfojobs>(urlInfojobs(q, categoria), { headers: { Authorization: `Basic ${auth}` } }, fetchImpl);
      } catch (e) {
        // Informática es obligatoria; si falla una categoría del sector comercial, se sigue con las demás.
        if (obligatoria) throw e;
        continue;
      }
      for (const o of r.offers ?? []) {
        ofertas.push({
          fuente: 'infojobs',
          idFuente: o.id,
          titulo: o.title,
          empresa: o.author?.name ?? '',
          ubicacion: [o.city, o.province?.value].filter(Boolean).join(', ') + (o.teleworking?.value ? ` (${o.teleworking.value})` : ''),
          url: o.link,
          fechaPublicacion: o.published,
          descripcion: o.requirementMin,
          jornada: o.workDay?.value,
          contrato: o.contractType?.value,
          experiencia: o.experienceMin?.value,
        });
      }
    }
    return ofertas;
  },
};
