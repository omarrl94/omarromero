import { z } from 'zod';

export const Estado = z.enum(['borrador', 'revisado', 'publicado']);

export const Fuente = z.object({ documento: z.string().min(1), ref: z.string().min(1) });

export const RaSchema = z.object({
  id: z.string().regex(/^RA[1-9]$/),
  titulo: z.string().min(1),
  peso: z.number().min(0).max(1),
  bloques: z.array(z.string()),
  ce: z.array(z.object({ id: z.string(), texto: z.string() })).min(1),
  verificado: z.boolean(),
});
export const RaFileSchema = z.object({
  ras: z.array(RaSchema).length(9),
  aprobado: z.object({ notaFinalMin: z.number(), notaRaMin: z.number() }),
  coberturaMin: z.number(),
  aDefecto: z.number().min(0).max(1),
});

export const NormaEntrySchema = z.object({
  id: z.string(),
  descripcion: z.string(),
  valor: z.union([z.number(), z.string(), z.null()]),
  unidad: z.string().optional(),
  fuente: Fuente,
  verificado: z.boolean(),
});
export const NormaFileSchema = z.object({ entradas: z.array(NormaEntrySchema) });

export const LibrarySeccionSchema = z.object({ id: z.string(), titulo: z.string(), texto: z.string() });
export const LibraryDocSchema = z.object({
  id: z.string(),
  titulo: z.string(),
  tipo: z.enum(['rebt', 'manual']),
  estado: Estado,
  pendiente: z.boolean().optional(),
  secciones: z.array(LibrarySeccionSchema),
});

export const ItemSchema = z.object({
  id: z.string().regex(/^d[1-8]-n[1-5]-\d{4}$|^ep-\d{4}$/),
  estado: Estado,
  distrito: z.number().int().min(0).max(8),
  ra: z.array(z.string().regex(/^RA[1-9]$/)).min(1),
  ce: z.array(z.string()),
  nivel: z.number().int().min(1).max(5),
  tipo: z.string(),
  dificultad: z.union([z.literal(1), z.literal(1.5), z.literal(2)]),
  pe_base: z.number().positive(),
  enunciado: z.string(),
  opciones: z.array(z.string()).optional(),
  escena: z
    .object({
      titulo: z.string(),
      elementos: z.array(z.object({
        id: z.string(), etiqueta: z.string(), x: z.number(), y: z.number(), w: z.number(), h: z.number(),
        defecto: z.boolean(), explicacion: z.string(), cita: z.object({ doc: z.string(), ref: z.string() }).optional(),
      })),
    })
    .optional(),
  circuito: z.object({ averia: z.string(), alimentado: z.boolean().default(true) }).optional(),
  pruebas: z
    .array(z.object({
      id: z.string(), nombre: z.string(), valor: z.number(), unidad: z.string(),
      regla: z.object({ tipo: z.enum(['min', 'max', 'tierra_max', 'rango_frac']), norma: z.string().optional(), sens_a: z.number().optional() }),
    }))
    .optional(),
  variables: z.record(z.object({ valores: z.array(z.union([z.number(), z.string()])) })).optional(),
  solucion: z.record(z.unknown()),
  dominio_rebt: z.enum(['A', 'B', 'C']).optional(),
  requiere_cita: z.boolean(),
  citas_validas: z.array(z.object({ doc: z.string(), ref: z.string() })),
  pistas: z.array(z.string()),
  explicacion: z.string(),
  fuente: Fuente,
  verificado: z.boolean(),
});

export const DistritoSchema = z.object({
  id: z.number().int().min(1).max(8),
  nombre: z.string(),
  bloque: z.number().int(),
  ra: z.array(z.string()),
  itc: z.array(z.string()),
  niveles: z.array(z.object({ n: z.number().int().min(1).max(5), nombre: z.string(), descripcion: z.string() })).length(5),
  pendiente: z.array(z.string()).optional(),
});

export const IaTramposaSchema = z.object({
  id: z.string(),
  estado: Estado,
  pregunta: z.string(),
  respuesta: z.string(),
  errores: z.array(z.object({ fragmento: z.string(), tipo: z.string(), correccion: z.string() })),
  fuente: Fuente,
  verificado: z.boolean(),
});

export type Ra = z.infer<typeof RaSchema>;
export type RaFile = z.infer<typeof RaFileSchema>;
export type LibraryDoc = z.infer<typeof LibraryDocSchema>;
export type Item = z.infer<typeof ItemSchema>;
export type Distrito = z.infer<typeof DistritoSchema>;
