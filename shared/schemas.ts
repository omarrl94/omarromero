import { z } from 'zod';
import { config } from '../config/ffe.config';

const perfilIds = config.perfiles.map((p) => p.id) as [string, ...string[]];
const zonaIds = config.zonas.map((z) => z.id) as [string, ...string[]];

export const PerfilIdSchema = z.enum(perfilIds);
export const ZonaIdSchema = z.enum(zonaIds);
export const TamanoSchema = z.enum(['pyme', 'consultora', 'startup', 'gran-empresa']);
export const TipoContactoSchema = z.enum(['rrhh', 'talento', 'practicas', 'general']);
export const ConfianzaSchema = z.enum(['alta', 'media', 'baja']);

/** Proveedores de correo gratuito: nunca son correos corporativos. */
export const DOMINIOS_GRATUITOS = [
  'gmail.com', 'googlemail.com', 'hotmail.com', 'hotmail.es', 'outlook.com', 'outlook.es', 'live.com',
  'yahoo.com', 'yahoo.es', 'icloud.com', 'me.com', 'protonmail.com', 'proton.me', 'gmx.com', 'gmx.es', 'aol.com',
];

/** Partes locales que indican buzón genérico (no de una persona). */
export const PALABRAS_GENERICAS = [
  'rrhh', 'rh', 'hr', 'talento', 'talent', 'empleo', 'empleos', 'job', 'jobs', 'career', 'careers', 'carreras',
  'trabajo', 'trabajaconnosotros', 'info', 'informacion', 'contacto', 'contact', 'contacta', 'hola', 'hello', 'hi',
  'practicas', 'becas', 'beca', 'intern', 'internship', 'internships', 'seleccion', 'recruiting', 'recruitment',
  'recruit', 'people', 'personas', 'cv', 'curriculum', 'cvs', 'admin', 'administracion', 'oficina', 'office',
  'recursos', 'humanos', 'madrid', 'spain', 'espana', 'team', 'equipo', 'joinus', 'join',
  'unete', 'trabaja', 'universidades', 'universidad', 'university', 'campus', 'graduates', 'junior', 'formacion',
  'fp', 'dual', 'empresa', 'comercial', 'atencion', 'clientes', 'secretaria', 'general', 'gestion',
];

const EMAIL_RE = /^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$/i;

export function dominioDeCorreo(email: string): string {
  return email.split('@')[1]?.toLowerCase() ?? '';
}

export function esCorreoGratuito(email: string): boolean {
  return DOMINIOS_GRATUITOS.includes(dominioDeCorreo(email));
}

/**
 * Heurística conservadora: un correo es «genérico» si su parte local contiene alguna palabra
 * de buzón corporativo. Si no la contiene (p. ej. «laura.garcia@»), se considera posiblemente
 * personal y se rechaza. Ante la duda, fuera.
 */
export function esCorreoGenerico(email: string): boolean {
  const local = email.split('@')[0]?.toLowerCase() ?? '';
  const trozos = local.split(/[._+-]/).filter(Boolean);
  return trozos.some((t) => PALABRAS_GENERICAS.includes(t)) || PALABRAS_GENERICAS.includes(local);
}

/** El dominio del correo coincide con el de la web (o es subdominio/dominio padre). */
export function dominioCoincide(email: string, web: string): boolean {
  const d = dominioDeCorreo(email);
  let h: string;
  try {
    h = new URL(web).hostname.toLowerCase().replace(/^www\./, '');
  } catch {
    return false;
  }
  const base = (x: string) => x.split('.').slice(-2).join('.');
  return d === h || d.endsWith('.' + h) || h.endsWith('.' + d) || base(d) === base(h);
}

const urlHttps = z.url({ protocol: /^https?$/ });

export const ContactoSchema = z
  .object({
    /** email: hay correo público verificado. formulario: solo formulario oficial. */
    tipo: z.enum(['email', 'formulario']),
    email: z.string().regex(EMAIL_RE).optional(),
    /** URL exacta donde aparece el correo (o donde está el formulario). */
    fuenteUrl: urlHttps,
    formularioUrl: urlHttps.optional(),
    tipoContacto: TipoContactoSchema,
  })
  .superRefine((c, ctx) => {
    if (c.tipo === 'email') {
      if (!c.email) ctx.addIssue({ code: 'custom', message: 'Falta el correo' });
      else {
        if (esCorreoGratuito(c.email)) ctx.addIssue({ code: 'custom', message: 'Correo de proveedor gratuito' });
        if (!esCorreoGenerico(c.email)) ctx.addIssue({ code: 'custom', message: 'Posible correo personal' });
      }
    }
    if (c.tipo === 'formulario' && !c.formularioUrl) {
      ctx.addIssue({ code: 'custom', message: 'Falta la URL del formulario' });
    }
  });

export const FeedAtsSchema = z.object({
  proveedor: z.enum(['greenhouse', 'lever', 'ashby']),
  identificador: z.string().regex(/^[a-z0-9-]+$/i),
});

export const EmpresaSchema = z
  .object({
    id: z.string().regex(/^[a-z0-9-]+$/),
    nombre: z.string().min(2),
    web: urlHttps,
    sector: z.string().min(2),
    tamano: TamanoSchema,
    zona: ZonaIdSchema,
    direccion: z.string().optional(),
    perfiles: z.array(PerfilIdSchema).min(1),
    motivoEncaje: z.string().min(10),
    contacto: ContactoSchema,
    /** Página oficial de empleo, si existe. */
    empleoUrl: urlHttps.optional(),
    /** Solo si la propia empresa ha publicado un programa u oferta de prácticas. */
    programaPracticas: z
      .object({ titulo: z.string(), url: urlHttps, fechaComprobacion: z.iso.date() })
      .optional(),
    feedAts: FeedAtsSchema.optional(),
    verificacion: z.object({
      fecha: z.iso.date(),
      confianza: ConfianzaSchema,
      /** Resultado de la consulta MX del dominio del correo (null si es solo formulario). */
      mx: z.boolean().nullable(),
      notas: z.string().optional(),
    }),
  })
  .superRefine((e, ctx) => {
    if (e.contacto.tipo === 'email' && e.contacto.email && !dominioCoincide(e.contacto.email, e.web)) {
      // Se permite (grupos con varios dominios) pero obliga a explicarlo en las notas.
      if (!e.verificacion.notas?.toLowerCase().includes('dominio')) {
        ctx.addIssue({ code: 'custom', message: 'El dominio del correo no coincide con la web y no se explica en notas' });
      }
    }
    const ciclos = new Set(e.perfiles.map((p) => config.perfiles.find((x) => x.id === p)?.ciclo));
    if (ciclos.size === 0) ctx.addIssue({ code: 'custom', message: 'Sin perfiles válidos' });
  });

export const EmpresasSchema = z.array(EmpresaSchema).superRefine((lista, ctx) => {
  const ids = new Set<string>();
  for (const e of lista) {
    if (ids.has(e.id)) ctx.addIssue({ code: 'custom', message: `id duplicado: ${e.id}` });
    ids.add(e.id);
  }
});

/** Candidatas de la investigación: SIN verificar, nunca se sirven. */
export const CandidataSchema = z.object({
  id: z.string().regex(/^[a-z0-9-]+$/),
  nombre: z.string().min(2),
  web: urlHttps,
  sector: z.string(),
  tamano: TamanoSchema,
  zona: ZonaIdSchema,
  direccion: z.string().optional(),
  perfiles: z.array(PerfilIdSchema).min(1),
  motivoEncaje: z.string().min(10),
  /** Páginas oficiales donde buscar el correo o el formulario (contacto, empleo, aviso legal). */
  paginasContacto: z.array(urlHttps).min(1),
  /** Correo visto en la investigación. NO es dato verificado: el script lo comprueba en la fuente. */
  emailVisto: z.string().regex(EMAIL_RE).optional(),
  tipoContactoEsperado: TipoContactoSchema.default('general'),
  formularioUrl: urlHttps.optional(),
  empleoUrl: urlHttps.optional(),
  programaPracticasUrl: urlHttps.optional(),
  feedAts: FeedAtsSchema.optional(),
  notas: z.string().optional(),
});
export const CandidatasSchema = z.array(CandidataSchema);

export const JornadaSchema = z.enum(['completa', 'parcial', 'desconocida']);
export const TipoOfertaSchema = z.enum(['practicas', 'beca', 'junior', 'primer-empleo']);

export const OfertaSchema = z.object({
  id: z.string(),
  titulo: z.string().min(2),
  empresa: z.string(),
  ubicacion: z.string(),
  remoto: z.boolean(),
  jornada: JornadaSchema,
  tipo: TipoOfertaSchema,
  perfiles: z.array(PerfilIdSchema),
  fuente: z.string(),
  url: urlHttps,
  fechaPublicacion: z.iso.datetime({ offset: true }),
  fechaCaducidad: z.iso.datetime({ offset: true }).optional(),
  resumen: z.string().max(400).optional(),
});

export const EstadoFuenteSchema = z.object({
  id: z.string(),
  nombre: z.string(),
  estado: z.enum(['ok', 'error', 'sin-configurar']),
  mensaje: z.string().optional(),
  total: z.number().int().nonnegative(),
  fecha: z.iso.datetime({ offset: true }),
});

export const CacheOfertasSchema = z.object({
  actualizado: z.iso.datetime({ offset: true }).nullable(),
  fuentes: z.array(EstadoFuenteSchema),
  ofertas: z.array(OfertaSchema),
});

export const SolicitudRetiradaSchema = z.object({
  empresa: z.string().min(2).max(200),
  email: z.string().regex(EMAIL_RE).max(200),
  motivo: z.string().max(2000).optional(),
  /** Honeypot anti-bots: debe venir vacío. */
  web: z.string().max(0).optional(),
});

export type Empresa = z.infer<typeof EmpresaSchema>;
export type Candidata = z.infer<typeof CandidataSchema>;
export type Oferta = z.infer<typeof OfertaSchema>;
export type EstadoFuente = z.infer<typeof EstadoFuenteSchema>;
export type CacheOfertas = z.infer<typeof CacheOfertasSchema>;
export type TipoContacto = z.infer<typeof TipoContactoSchema>;
