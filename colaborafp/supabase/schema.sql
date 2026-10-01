-- =====================================================================
-- ColaboraFP — Esquema de Supabase
-- Ejecutar en: Supabase Dashboard → SQL Editor → New query → Run
-- =====================================================================

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------
-- Salas de clase
-- ---------------------------------------------------------------------
create table if not exists public.rooms (
  id          uuid primary key default gen_random_uuid(),
  pin         text not null check (pin ~ '^[0-9]{6}$'),
  name        text not null check (char_length(name) between 1 and 120),
  module      text,
  teacher_id  uuid not null references auth.users (id) on delete cascade,
  is_active   boolean not null default true,
  created_at  timestamptz not null default now()
);

-- Un PIN solo puede estar en uso por una sala activa a la vez
create unique index if not exists rooms_active_pin_idx on public.rooms (pin) where is_active;
create index if not exists rooms_teacher_idx on public.rooms (teacher_id, created_at desc);

-- ---------------------------------------------------------------------
-- Recursos (código, enunciados, enlaces)
-- ---------------------------------------------------------------------
create table if not exists public.resources (
  id          uuid primary key default gen_random_uuid(),
  room_id     uuid not null references public.rooms (id) on delete cascade,
  author      text not null check (char_length(author) between 1 and 30),   -- 'teacher' o alias del alumno
  type        text not null check (type in ('code', 'task', 'link', 'file')),
  content     text not null check (char_length(content) between 1 and 20000),
  language    text,
  title       text check (title is null or char_length(title) <= 120),
  status      text not null default 'pending' check (status in ('pending', 'approved')),
  file_size   integer check (file_size is null or file_size between 1 and 5242880),
  file_type   text check (file_type is null or char_length(file_type) <= 120),
  file_data   text check (file_data is null or char_length(file_data) <= 7000000),  -- base64 (≤ 5 MB)
  created_at  timestamptz not null default now()
);

create index if not exists resources_room_idx on public.resources (room_id, created_at);

-- Migración para instalaciones previas
alter table public.resources drop constraint if exists resources_type_check;
alter table public.resources add constraint resources_type_check check (type in ('code', 'task', 'link', 'file'));
alter table public.resources add column if not exists file_size integer;
alter table public.resources add column if not exists file_type text;
alter table public.resources add column if not exists file_data text;

-- ---------------------------------------------------------------------
-- Funciones auxiliares (security definer: saltan la RLS de forma controlada)
-- ---------------------------------------------------------------------

-- El alumnado resuelve un PIN sin poder listar todas las salas
create or replace function public.get_room_by_pin(p_pin text)
returns table (id uuid, pin text, name text, module text)
language sql stable security definer set search_path = public as $$
  select r.id, r.pin, r.name, r.module
  from public.rooms r
  where r.pin = p_pin and r.is_active
  limit 1;
$$;

create or replace function public.room_is_active(p_room uuid)
returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.rooms where id = p_room and is_active);
$$;

create or replace function public.is_room_owner(p_room uuid)
returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.rooms where id = p_room and teacher_id = auth.uid());
$$;

grant execute on function public.get_room_by_pin(text) to anon, authenticated;
grant execute on function public.room_is_active(uuid) to anon, authenticated;
grant execute on function public.is_room_owner(uuid) to authenticated;

-- ---------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------
alter table public.rooms enable row level security;
alter table public.resources enable row level security;

-- Salas: solo su profesor/a las gestiona
drop policy if exists "rooms_owner_all" on public.rooms;
create policy "rooms_owner_all" on public.rooms
  for all to authenticated
  using (teacher_id = auth.uid())
  with check (teacher_id = auth.uid());

-- Recursos: cualquiera (con el room_id, que solo se obtiene con el PIN) ve lo aprobado
drop policy if exists "resources_read_approved" on public.resources;
create policy "resources_read_approved" on public.resources
  for select to anon, authenticated
  using (status = 'approved');

-- El profesor dueño ve también las peticiones pendientes
drop policy if exists "resources_owner_read" on public.resources;
create policy "resources_owner_read" on public.resources
  for select to authenticated
  using (public.is_room_owner(room_id));

-- Alumnado: solo puede ENVIAR PETICIONES pendientes a salas activas, nunca firmar como 'teacher'
drop policy if exists "resources_student_request" on public.resources;
create policy "resources_student_request" on public.resources
  for insert to anon, authenticated
  with check (status = 'pending' and author <> 'teacher' and public.room_is_active(room_id));

-- Profesor dueño: publica directamente, aprueba y elimina
drop policy if exists "resources_owner_insert" on public.resources;
create policy "resources_owner_insert" on public.resources
  for insert to authenticated
  with check (public.is_room_owner(room_id));

drop policy if exists "resources_owner_update" on public.resources;
create policy "resources_owner_update" on public.resources
  for update to authenticated
  using (public.is_room_owner(room_id))
  with check (public.is_room_owner(room_id));

drop policy if exists "resources_owner_delete" on public.resources;
create policy "resources_owner_delete" on public.resources
  for delete to authenticated
  using (public.is_room_owner(room_id));

-- ---------------------------------------------------------------------
-- Realtime
-- ---------------------------------------------------------------------
do $$
begin
  alter publication supabase_realtime add table public.resources;
exception when duplicate_object then null;
end $$;

do $$
begin
  alter publication supabase_realtime add table public.rooms;
exception when duplicate_object then null;
end $$;
