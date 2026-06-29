create table if not exists public.pedido_colaboracao (
  id uuid primary key default gen_random_uuid(),
  pedido_id uuid not null references public.pedidos(id) on delete cascade,
  actor_user_id uuid,
  actor_nome text,
  mensagem text not null,
  created_at timestamptz not null default now()
);

create index if not exists pedido_colaboracao_pedido_id_idx
  on public.pedido_colaboracao (pedido_id, created_at);

alter table public.pedido_colaboracao enable row level security;

drop policy if exists "Allow anon manage pedido_colaboracao" on public.pedido_colaboracao;
create policy "Allow anon manage pedido_colaboracao"
  on public.pedido_colaboracao for all
  to anon
  using (true)
  with check (true);

notify pgrst, 'reload schema';
