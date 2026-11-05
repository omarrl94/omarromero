import empresasVerificadas from '../data/empresas.json';
import retiradas from '../data/retiradas.json';
import { EmpresasSchema, type Empresa } from '../shared/schemas';
import { modoPruebas } from './entorno';

interface Retirada {
  id?: string;
  dominio?: string;
  fecha: string;
}

function retirada(e: Empresa, lista: Retirada[]): boolean {
  const host = new URL(e.web).hostname.replace(/^www\./, '');
  return lista.some((r) => (r.id && r.id === e.id) || (r.dominio && host.endsWith(r.dominio)));
}

/**
 * Empresas que se sirven: las verificadas de data/empresas.json, validadas con Zod
 * y sin las retiradas. Solo en modo de pruebas (fuera de Netlify) se usan los datos ficticios.
 */
export async function cargarEmpresas(): Promise<Empresa[]> {
  let bruto: unknown = empresasVerificadas;
  if (modoPruebas() && process.env.CONECTA_DATOS === 'ficticios') {
    bruto = (await import('../tests/fixtures/empresas.ficticias.json')).default;
  }
  const r = EmpresasSchema.safeParse(bruto);
  if (!r.success) throw new Error(`data/empresas.json no es válido: ${r.error.issues[0]?.message}`);
  return r.data.filter((e) => !retirada(e, retiradas as Retirada[]));
}
