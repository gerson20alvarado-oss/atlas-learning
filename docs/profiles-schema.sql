-- Atlas Learning — Perfil de Usuario
-- Ejecutar completo en el SQL Editor de Supabase.

-- ============================================================
-- 1. Tabla — user_id como PK, relación 1:1 real con auth.users,
--    sin id adicional que la duplicaría sin aportar nada.
-- ============================================================

create table if not exists profiles (
  user_id     uuid primary key references auth.users(id) on delete cascade,
  first_name  text not null,
  last_name   text not null,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

alter table profiles enable row level security;

-- ============================================================
-- 2. RLS — más simple que license_keys, y por una razón real: aquí
--    no hay "reclamar un recurso sin dueño", cada usuario solo
--    toca su propia fila. Un RLS estándar de escritura es
--    correcto y suficiente, sin necesitar una función atómica.
-- ============================================================

create policy "Users read their own profile"
  on profiles for select
  to authenticated
  using (auth.uid() = user_id);

create policy "Users create their own profile"
  on profiles for insert
  to authenticated
  with check (auth.uid() = user_id);

create policy "Users update their own profile"
  on profiles for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ============================================================
-- 3. updated_at automático — no porque hoy exista edición, sino
--    porque una columna que nunca cambia no debería llamarse así.
-- ============================================================

create or replace function set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_set_updated_at
  before update on profiles
  for each row execute function set_updated_at();
