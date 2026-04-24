-- H.0 — Schema inicial.
-- Dos tablas: save_slots (partidas del jugador) y banks (Modo Privado, dev-only).
-- No creamos public.users: referenciamos auth.users directamente con FK.
-- RLS activada en ambas. Policy: el usuario autenticado solo accede a sus filas.

-- =============================================================================
-- save_slots
-- =============================================================================
-- 3 slots por usuario según scope §1.1. La restricción de 3 se aplica en app
-- en H.2 (al crear personaje), no en la tabla: un UNIQUE parcial aquí
-- bloquearía futuras migraciones del modelo.
create table public.save_slots (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  slot_index smallint not null check (slot_index between 0 and 2),
  character_data jsonb,
  alive boolean not null default true,
  epitaph jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, slot_index)
);

create index save_slots_user_id_idx on public.save_slots(user_id);

alter table public.save_slots enable row level security;

create policy "save_slots: owner select"
  on public.save_slots for select
  using (auth.uid() = user_id);

create policy "save_slots: owner insert"
  on public.save_slots for insert
  with check (auth.uid() = user_id);

create policy "save_slots: owner update"
  on public.save_slots for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "save_slots: owner delete"
  on public.save_slots for delete
  using (auth.uid() = user_id);

-- =============================================================================
-- banks
-- =============================================================================
-- Banco del Modo Privado. En H.0 solo estructura + RLS de dueño.
-- La restricción "solo admin" del Modo Privado es lógica de app (H.8).
create table public.banks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  content jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index banks_user_id_idx on public.banks(user_id);

alter table public.banks enable row level security;

create policy "banks: owner select"
  on public.banks for select
  using (auth.uid() = user_id);

create policy "banks: owner insert"
  on public.banks for insert
  with check (auth.uid() = user_id);

create policy "banks: owner update"
  on public.banks for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "banks: owner delete"
  on public.banks for delete
  using (auth.uid() = user_id);

-- =============================================================================
-- Trigger de updated_at (reusado por ambas tablas)
-- =============================================================================
create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger save_slots_touch_updated_at
  before update on public.save_slots
  for each row execute function public.touch_updated_at();

create trigger banks_touch_updated_at
  before update on public.banks
  for each row execute function public.touch_updated_at();
