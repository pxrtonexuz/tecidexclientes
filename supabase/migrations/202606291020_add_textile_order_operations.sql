alter table public.pedidos
  add column if not exists prioridade text not null default 'normal',
  add column if not exists prazo_combinado date,
  add column if not exists quantidade_total integer,
  add column if not exists especificacoes jsonb not null default '{}'::jsonb;

alter table public.ordens_servico
  add column if not exists detalhes_tecnicos jsonb not null default '{}'::jsonb,
  add column if not exists pendencias text[] not null default '{}';

update public.pedidos
set status_operacional = case status_operacional
  when 'novo' then 'triagem'
  when 'em_separacao' then 'triagem'
  when 'em_producao' then 'producao'
  when 'pronto_entrega' then 'finalizado'
  when 'entregue' then 'finalizado'
  else status_operacional
end
where status_operacional in ('novo', 'em_separacao', 'em_producao', 'pronto_entrega', 'entregue');

create index if not exists pedidos_prioridade_idx on public.pedidos (prioridade);
create index if not exists pedidos_prazo_combinado_idx on public.pedidos (prazo_combinado);

notify pgrst, 'reload schema';
