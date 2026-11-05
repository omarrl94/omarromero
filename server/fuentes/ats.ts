import type { OfertaBruta } from '../../shared/ofertas';
import type { Empresa } from '../../shared/schemas';
import { textoPlano } from '../../shared/texto';
import { pedirJson, type Fuente } from './comun';

const UBICACION_VALIDA = /madrid|spain|espa[nñ]a|remote|remoto|emea|europe/i;

interface Greenhouse {
  jobs: { id: number; title: string; updated_at: string; first_published?: string; absolute_url: string; location?: { name?: string }; content?: string }[];
}
interface Lever {
  id: string;
  text: string;
  createdAt: number;
  hostedUrl: string;
  categories?: { location?: string; commitment?: string };
  descriptionPlain?: string;
}
interface Ashby {
  jobs: { id: string; title: string; location?: string; employmentType?: string; publishedAt: string; jobUrl: string; isListed?: boolean; isRemote?: boolean; descriptionPlain?: string }[];
}

export async function ofertasDeEmpresa(e: Empresa, fetchImpl: typeof fetch = fetch): Promise<OfertaBruta[]> {
  if (!e.feedAts) return [];
  const { proveedor, identificador } = e.feedAts;
  const id = encodeURIComponent(identificador);
  let lista: OfertaBruta[] = [];
  if (proveedor === 'greenhouse') {
    const r = await pedirJson<Greenhouse>(`https://boards-api.greenhouse.io/v1/boards/${id}/jobs?content=true`, {}, fetchImpl);
    lista = r.jobs.map((j) => ({
      fuente: 'greenhouse', idFuente: `${identificador}-${j.id}`, titulo: j.title, empresa: e.nombre,
      ubicacion: j.location?.name ?? '', url: j.absolute_url, fechaPublicacion: j.first_published ?? j.updated_at,
      descripcion: j.content ? textoPlano(j.content.replace(/&lt;/g, '<').replace(/&gt;/g, '>')) : undefined,
    }));
  } else if (proveedor === 'lever') {
    const r = await pedirJson<Lever[]>(`https://api.lever.co/v0/postings/${id}?mode=json`, {}, fetchImpl);
    lista = r.map((j) => ({
      fuente: 'lever', idFuente: j.id, titulo: j.text, empresa: e.nombre, ubicacion: j.categories?.location ?? '',
      url: j.hostedUrl, fechaPublicacion: new Date(j.createdAt).toISOString(), jornada: j.categories?.commitment,
      contrato: j.categories?.commitment, descripcion: j.descriptionPlain?.slice(0, 600),
    }));
  } else {
    const r = await pedirJson<Ashby>(`https://api.ashbyhq.com/posting-api/job-board/${id}?includeCompensation=false`, {}, fetchImpl);
    lista = r.jobs.filter((j) => j.isListed !== false).map((j) => ({
      fuente: 'ashby', idFuente: j.id, titulo: j.title, empresa: e.nombre,
      ubicacion: `${j.location ?? ''}${j.isRemote ? ' (remoto)' : ''}`, url: j.jobUrl, fechaPublicacion: j.publishedAt,
      jornada: j.employmentType, contrato: j.employmentType, descripcion: j.descriptionPlain?.slice(0, 600),
    }));
  }
  return lista.filter((o) => UBICACION_VALIDA.test(o.ubicacion));
}

/** Una fuente por proveedor ATS, que recorre las empresas verificadas con feed. */
export function fuentesAts(empresas: Empresa[]): Fuente[] {
  const proveedores = ['greenhouse', 'lever', 'ashby'] as const;
  const nombres = { greenhouse: 'Greenhouse (empresas del directorio)', lever: 'Lever (empresas del directorio)', ashby: 'Ashby (empresas del directorio)' };
  return proveedores.map((p) => {
    const conFeed = empresas.filter((e) => e.feedAts?.proveedor === p);
    return {
      id: p,
      nombre: nombres[p],
      configurada: () => conFeed.length > 0,
      async obtener(fetchImpl = fetch) {
        const resultados = await Promise.allSettled(conFeed.map((e) => ofertasDeEmpresa(e, fetchImpl)));
        const fallos = resultados.filter((r) => r.status === 'rejected');
        if (fallos.length === conFeed.length && fallos.length > 0) throw (fallos[0] as PromiseRejectedResult).reason;
        return resultados.flatMap((r) => (r.status === 'fulfilled' ? r.value : []));
      },
    };
  });
}
