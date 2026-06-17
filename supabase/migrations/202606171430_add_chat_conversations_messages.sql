create table if not exists public.chat_conversations (
  id uuid primary key default gen_random_uuid(),
  session_id text not null unique,
  telefone text,
  nome text,
  status text not null default 'ativa',
  etapa text not null default 'em_atendimento',
  atendimento_ia text not null default 'ativo',
  last_message_at timestamptz,
  last_message_preview text,
  source text not null default 'whatsapp',
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.chat_messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid references public.chat_conversations(id) on delete cascade,
  session_id text not null,
  external_message_id text,
  direction text not null check (direction in ('inbound', 'outbound')),
  sender_type text not null check (sender_type in ('cliente', 'agente', 'ia', 'sistema')),
  content text not null default '',
  payload jsonb not null default '{}'::jsonb,
  sent_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create table if not exists public.chat_webhook_events (
  id uuid primary key default gen_random_uuid(),
  provider text not null default 'uazapi',
  event_type text,
  external_message_id text,
  session_id text,
  processed boolean not null default false,
  payload jsonb not null default '{}'::jsonb,
  error text,
  created_at timestamptz not null default now()
);

create index if not exists chat_conversations_telefone_idx on public.chat_conversations (telefone);
create index if not exists chat_conversations_last_message_at_idx on public.chat_conversations (last_message_at desc);
create index if not exists chat_messages_session_id_idx on public.chat_messages (session_id);
create index if not exists chat_messages_sent_at_idx on public.chat_messages (sent_at desc);
create unique index if not exists chat_messages_external_message_idx
  on public.chat_messages (external_message_id)
  where external_message_id is not null;

alter table public.chat_conversations enable row level security;
alter table public.chat_messages enable row level security;
alter table public.chat_webhook_events enable row level security;

drop policy if exists "Allow anon manage chat_conversations" on public.chat_conversations;
create policy "Allow anon manage chat_conversations"
  on public.chat_conversations for all
  to anon
  using (true)
  with check (true);

drop policy if exists "Allow anon manage chat_messages" on public.chat_messages;
create policy "Allow anon manage chat_messages"
  on public.chat_messages for all
  to anon
  using (true)
  with check (true);

drop policy if exists "Allow anon manage chat_webhook_events" on public.chat_webhook_events;
create policy "Allow anon manage chat_webhook_events"
  on public.chat_webhook_events for all
  to anon
  using (true)
  with check (true);

notify pgrst, 'reload schema';
