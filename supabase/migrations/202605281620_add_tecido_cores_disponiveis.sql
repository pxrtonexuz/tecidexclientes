alter table public.tecidos
add column if not exists cores_disponiveis text[] not null default '{}';
