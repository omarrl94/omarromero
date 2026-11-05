import type { OfertaBruta } from '../../shared/ofertas';
import { variable } from '../entorno';
import { pedirJson, type Fuente } from './comun';

interface RespuestaAdzuna {
  results: {
    id: string;
    title: string;
    description?: string;
    created: string;
    redirect_url: string;
    contract_time?: string;
    contract_type?: string;
    company?: { display_name?: string };
    location?: { display_name?: string };
  }[];
}

/** Páginas por actualización: cada página es 1 llamada a la API (50 resultados). */
export const PAGINAS_ADZUNA = 3;

export function urlAdzuna(pagina: number, appId: string, appKey: string): string {
  const p = new URLSearchParams({
    app_id: appId,
    app_key: appKey,
    results_per_page: '50',
    where: 'Madrid',
    category: 'it-jobs',
    what_or: 'prácticas practicas becario becaria beca junior trainee internship',
    what_exclude: 'senior lead manager director',
    max_days_old: '45',
    sort_by: 'date',
    'content-type': 'application/json',
  });
  return `https://api.adzuna.com/v1/api/jobs/es/search/${pagina}?${p}`;
}

export const adzuna: Fuente = {
  id: 'adzuna',
  nombre: 'Adzuna',
  configurada: () => Boolean(variable('ADZUNA_APP_ID') && variable('ADZUNA_APP_KEY')),
  async obtener(fetchImpl = fetch) {
    const id = variable('ADZUNA_APP_ID')!;
    const key = variable('ADZUNA_APP_KEY')!;
    const ofertas: OfertaBruta[] = [];
    for (let pagina = 1; pagina <= PAGINAS_ADZUNA; pagina++) {
      const r = await pedirJson<RespuestaAdzuna>(urlAdzuna(pagina, id, key), {}, fetchImpl);
      for (const o of r.results ?? []) {
        ofertas.push({
          fuente: 'adzuna',
          idFuente: String(o.id),
          titulo: o.title,
          empresa: o.company?.display_name ?? '',
          ubicacion: o.location?.display_name ?? '',
          url: o.redirect_url,
          fechaPublicacion: o.created,
          descripcion: o.description,
          jornada: o.contract_time,
          contrato: o.contract_type,
        });
      }
      if ((r.results ?? []).length < 50) break;
    }
    return ofertas;
  },
};
