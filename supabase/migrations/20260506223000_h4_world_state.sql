-- H.4 sub-paso 4b.0 — estado del mundo por slot (decisión #90).
-- Primera migración de schema desde H.0.
--
-- El estado del mundo de una run (grids explorados, POIs revelados, anclas,
-- día, acciones gastadas, posición del PJ y vista actual) cuelga del SLOT y no
-- del usuario. Colgarlo del user_id haría que el segundo PJ heredase el mapa
-- explorado del primero, contra #44 (permadeath puro) y contra C3b de #85
-- ("entre runs nada hereda"). Un slot es una run.
--
-- Nullable a propósito: los saves creados antes de 4b.0 tienen NULL y el motor
-- los hidrata al estado inicial (`hydrateWorldState` en rules/world-state.ts).
-- No hay backfill: un save viejo no tiene mundo explorado que recuperar.
--
-- Sin cambios de RLS: la fila ya está protegida por las policies de H.0, que
-- filtran por user_id sobre toda la fila.

alter table public.save_slots
  add column world_state jsonb;

comment on column public.save_slots.world_state is
  'Estado del mundo de esta run (decisión #90). Shape en rules/world-state.ts, versionado en su campo `version`. NULL = save anterior a 4b.0, se hidrata al inicial.';
