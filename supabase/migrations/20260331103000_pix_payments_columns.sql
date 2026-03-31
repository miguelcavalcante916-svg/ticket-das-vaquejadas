alter table public.payments
  add column if not exists method text,
  add column if not exists external_id text;

create unique index if not exists payments_external_id_ux
  on public.payments (external_id)
  where external_id is not null;

update public.payments
set method = coalesce(method, 'pix'),
    external_id = coalesce(external_id, provider_payment_id)
where method is null
   or external_id is null;

