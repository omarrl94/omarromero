-- ════════════════════════════════════════════════════════════════
-- Rollo Madrid · esquema de base de datos
--
-- Pégalo entero en Supabase → SQL Editor → New query → Run.
-- Es idempotente: se puede volver a ejecutar sin romper nada.
--
-- Reglas de la casa:
--   · Leer el mapa es libre (cualquiera, con o sin cuenta).
--   · Escribir exige sesión.
--   · Cada quien manda sobre sus propias reseñas y sobre nada más.
-- ════════════════════════════════════════════════════════════════

-- ── Bares ───────────────────────────────────────────────────────
-- La clave primaria es el place_id de Google: los locales no se
-- inventan, se adoptan desde Places.
create table if not exists public.bares (
  place_id    text primary key,
  nombre      text not null,
  direccion   text not null default '',
  lat         double precision not null,
  lng         double precision not null,
  creado_por  uuid references auth.users (id) on delete set null,
  creado_en   timestamptz not null default now()
);

-- ── Reseñas ─────────────────────────────────────────────────────
-- user_id admite null solo para las reseñas de ejemplo que se
-- insertan desde aquí (el SQL Editor se salta las políticas). Desde
-- la app siempre va firmada: la política de insert lo exige.
create table if not exists public.reviews (
  id          uuid primary key default gen_random_uuid(),
  place_id    text not null references public.bares (place_id) on delete cascade,
  -- Qué aseo se valoró: el de ellas y el de ellos rara vez se parecen.
  aseo        text not null default 'unico'
              check (aseo in ('femenino', 'masculino', 'unico')),
  user_id     uuid references auth.users (id) on delete cascade,
  autor       text not null,
  limpieza    smallint not null check (limpieza between 1 and 5),
  espacio     smallint not null check (espacio between 1 and 5),
  intimidad   smallint not null check (intimidad between 1 and 5),
  suministros smallint not null check (suministros between 1 and 5),
  comentario  text not null default '' check (char_length(comentario) <= 400),
  fecha       timestamptz not null default now()
);

-- Para bases creadas antes de que existiera la distinción de aseos.
alter table public.reviews
  add column if not exists aseo text not null default 'unico';
do $$
begin
  alter table public.reviews
    add constraint reviews_aseo_valido
    check (aseo in ('femenino', 'masculino', 'unico'));
exception
  when duplicate_object then null;
end $$;

-- Un voto por persona, bar y aseo: el segundo actualiza el primero. Sin
-- WHERE para que el upsert del cliente pueda inferir el conflicto; las
-- reseñas de ejemplo (user_id null) conviven porque Postgres trata cada
-- null como distinto.
drop index if exists public.reviews_una_por_persona;
create unique index if not exists reviews_una_por_persona_y_aseo
  on public.reviews (place_id, user_id, aseo);

create index if not exists reviews_por_bar on public.reviews (place_id);

-- ── Row Level Security ──────────────────────────────────────────
alter table public.bares   enable row level security;
alter table public.reviews enable row level security;

-- Lectura abierta: el mapa se consulta sin cuenta.
drop policy if exists "bares visibles para todos" on public.bares;
create policy "bares visibles para todos"
  on public.bares for select
  using (true);

drop policy if exists "reseñas visibles para todas" on public.reviews;
create policy "reseñas visibles para todas"
  on public.reviews for select
  using (true);

-- Fichar un bar exige sesión, y queda registrado quién lo trajo.
drop policy if exists "fichar bares con sesión" on public.bares;
create policy "fichar bares con sesión"
  on public.bares for insert
  to authenticated
  with check (creado_por = auth.uid());

-- Publicar, corregir o retirar: solo lo tuyo.
drop policy if exists "publicar reseña propia" on public.reviews;
create policy "publicar reseña propia"
  on public.reviews for insert
  to authenticated
  with check (user_id = auth.uid());

drop policy if exists "editar reseña propia" on public.reviews;
create policy "editar reseña propia"
  on public.reviews for update
  to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

drop policy if exists "borrar reseña propia" on public.reviews;
create policy "borrar reseña propia"
  on public.reviews for delete
  to authenticated
  using (user_id = auth.uid());

-- Nadie puede cambiar ni borrar un bar desde el cliente: no hay
-- política de update ni de delete, así que RLS lo deniega.

-- ── Permisos ────────────────────────────────────────────────────
-- Supabase ya los concede por defecto a las tablas nuevas, pero
-- dejarlos escritos hace que este archivo baste por sí solo. RLS
-- sigue siendo la puerta: esto solo abre la cerradura de fuera.
grant usage on schema public to anon, authenticated;
grant select on public.bares, public.reviews to anon, authenticated;
grant insert, update, delete on public.bares, public.reviews to authenticated;

-- ════════════════════════════════════════════════════════════════
-- Semilla opcional: cinco clásicos de Madrid para que el mapa no
-- nazca vacío. Los place_id llevan prefijo mock- porque son
-- inventados; cuando alguien busque el bar de verdad entrará con su
-- place_id oficial. Borra este bloque si no lo quieres.
-- ════════════════════════════════════════════════════════════════
insert into public.bares (place_id, nombre, direccion, lat, lng) values
  ('mock-la-venencia',    'La Venencia',  'C. de Echegaray, 7 · Huertas',   40.4152, -3.6995),
  ('mock-casa-camacho',   'Casa Camacho', 'C. de San Andrés, 4 · Malasaña', 40.4258, -3.7037),
  ('mock-bodega-ardosa',  'La Ardosa',    'C. de Colón, 13 · Malasaña',     40.4245, -3.7009),
  ('mock-el-tigre',       'El Tigre',     'C. de las Infantas, 30 · Chueca', 40.4211, -3.6979),
  ('mock-casa-labra',     'Casa Labra',   'C. de Tetuán, 12 · Sol',         40.4180, -3.7044)
on conflict (place_id) do nothing;

insert into public.reviews
  (place_id, aseo, user_id, autor, limpieza, espacio, intimidad, suministros, comentario, fecha)
select * from (values
  ('mock-la-venencia',   'femenino',  null::uuid, 'Marta R.',      5, 4, 5, 5,
   'Baño de manzanilla y madera noble. Papel de sobra, pestillo firme y cero olor. Aquí se entra sin miedo y se sale mejor persona.',
   now() - interval '38 days'),
  ('mock-la-venencia',   'femenino',  null::uuid, 'Chule',         4, 4, 5, 5,
   'Impecable a las ocho. A las doce ya hablamos.',
   now() - interval '17 days'),
  ('mock-la-venencia',   'masculino', null::uuid, 'Nacho',         3, 3, 3, 4,
   'El de ellos es otra historia: cumple, pero ni madera noble ni leches. A las once ya pide un repaso.',
   now() - interval '32 days'),
  ('mock-casa-camacho',  'unico',     null::uuid, 'Vermutero',     2, 1, 2, 1,
   'Cabina tamaño ascensor de finca vieja: cierras la puerta y saludas a tus rodillas. Papel, de casa.',
   now() - interval '14 days'),
  ('mock-bodega-ardosa', 'masculino', null::uuid, 'Kike',          3, 3, 2, 4,
   'El pestillo va a su bola: canta algo mientras estás dentro. Jabón sí, secamanos ni de broma.',
   now() - interval '22 days'),
  ('mock-el-tigre',      'masculino', null::uuid, 'Superviviente', 1, 2, 1, 1,
   'Zona catastrófica confirmada. Entra solo en emergencia nivel cinco, sin respirar y con el móvil guardado.',
   now() - interval '10 days'),
  ('mock-el-tigre',      'femenino',  null::uuid, 'Lucía',         2, 3, 2, 2,
   'El de mujeres salva los muebles por los pelos: hay papel y cierra, que ya es más de lo que se puede decir del otro.',
   now() - interval '8 days')
) as semilla
where not exists (select 1 from public.reviews where user_id is null);
