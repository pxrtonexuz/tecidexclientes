create table if not exists public.clientes (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  telefone text not null,
  telefone_normalizado text not null,
  email text,
  documento text,
  tipo_cliente text not null default 'pessoa_fisica',
  empresa_nome text,
  cidade text,
  uf text,
  endereco text,
  origem text not null default 'whatsapp',
  status_relacionamento text not null default 'novo',
  responsavel_user_id uuid,
  tags text[] not null default '{}',
  observacoes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists clientes_telefone_normalizado_idx
  on public.clientes (telefone_normalizado);

create index if not exists clientes_nome_idx
  on public.clientes using gin (to_tsvector('portuguese', nome));

create table if not exists public.pedidos (
  id uuid primary key default gen_random_uuid(),
  numero text not null unique,
  cliente_id uuid not null references public.clientes(id) on delete restrict,
  lead_id uuid references public.leads(id) on delete set null,
  session_id text,
  status_comercial text not null default 'venda_concluida',
  status_operacional text not null default 'novo',
  valor numeric(12,2),
  modelo text,
  origem text not null default 'crm_chat',
  criado_por uuid,
  responsavel_user_id uuid,
  observacoes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists pedidos_cliente_id_idx on public.pedidos (cliente_id);
create index if not exists pedidos_lead_id_idx on public.pedidos (lead_id);
create index if not exists pedidos_status_operacional_idx on public.pedidos (status_operacional);

create table if not exists public.ordens_servico (
  id uuid primary key default gen_random_uuid(),
  pedido_id uuid not null unique references public.pedidos(id) on delete cascade,
  numero_os text not null unique,
  status text not null default 'aberta',
  pdf_url text,
  resumo_operacional text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.pedido_conversa_recortes (
  id uuid primary key default gen_random_uuid(),
  pedido_id uuid not null unique references public.pedidos(id) on delete cascade,
  session_id text not null,
  message_start_id bigint,
  message_end_id bigint,
  started_at timestamptz,
  ended_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists pedido_conversa_recortes_session_id_idx
  on public.pedido_conversa_recortes (session_id);

create table if not exists public.pedido_resumos_ia (
  id uuid primary key default gen_random_uuid(),
  pedido_id uuid not null unique references public.pedidos(id) on delete cascade,
  modelo_usado text,
  resumo_texto text,
  resumo_json jsonb,
  confidence numeric(4,3),
  warnings text[] not null default '{}',
  created_at timestamptz not null default now()
);

create table if not exists public.pedido_eventos (
  id uuid primary key default gen_random_uuid(),
  pedido_id uuid not null references public.pedidos(id) on delete cascade,
  actor_user_id uuid,
  tipo text not null,
  from_status text,
  to_status text,
  metadata jsonb not null default '{}',
  created_at timestamptz not null default now()
);

create index if not exists pedido_eventos_pedido_id_idx on public.pedido_eventos (pedido_id);
