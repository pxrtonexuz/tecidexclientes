create table if not exists public.whatsapp_connections (
  id uuid primary key default gen_random_uuid(),
  provider text not null default 'uazapi',
  instance_name text not null default 'default',
  status text not null default 'disconnected',
  qr_code text,
  qr_code_updated_at timestamptz,
  phone_number text,
  connected_at timestamptz,
  disconnected_at timestamptz,
  last_sync_at timestamptz,
  webhook_url text,
  metadata jsonb not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists whatsapp_connections_provider_instance_idx
  on public.whatsapp_connections (provider, instance_name);
