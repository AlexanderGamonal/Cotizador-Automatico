-- ============================================================
-- Cotizador: esquema aparte "cotizador" (no toca las tablas de public)
-- Acceso solo para usuarios listados en cotizador.members.
-- ============================================================
create schema if not exists cotizador;

-- Usuarios autorizados a usar el cotizador (el proyecto comparte Auth con otras apps)
create table cotizador.members (
  user_id    uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);
alter table cotizador.members enable row level security;  -- sin políticas: solo vía funciones

create function cotizador.is_member()
returns boolean
language sql stable security definer set search_path = ''
as $$
  select exists (select 1 from cotizador.members m where m.user_id = (select auth.uid()));
$$;

create function cotizador.set_updated_at()
returns trigger
language plpgsql set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ── Ajustes de empresa y tasas ───────────────────────────────
create table cotizador.company_settings (
  user_id          uuid primary key default auth.uid() references auth.users(id) on delete cascade,
  empresa          text,
  ruc              text,
  direccion        text,
  telefono         text,
  logo_url         text,
  igv_rate         numeric(5,4) not null default 0.18 check (igv_rate >= 0 and igv_rate < 1),
  renta_rate       numeric(5,4) not null default 0.01 check (renta_rate >= 0 and renta_rate < 1),
  validez_dias     int          not null default 7    check (validez_dias > 0),
  condiciones_pago text,
  tiempo_entrega   text,
  garantia         text,
  updated_at       timestamptz not null default now()
);
create trigger company_settings_updated_at before update on cotizador.company_settings
  for each row execute function cotizador.set_updated_at();

-- ── Clientes ─────────────────────────────────────────────────
create table cotizador.clients (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null default auth.uid() references auth.users(id) on delete cascade,
  razon_social text not null,
  ruc          text,
  whatsapp     text,
  email        text,
  created_at   timestamptz not null default now()
);
create index clients_user_ruc_idx on cotizador.clients (user_id, ruc);

-- ── Catálogo de productos ────────────────────────────────────
create table cotizador.products (
  id                 uuid primary key default gen_random_uuid(),
  user_id            uuid not null default auth.uid() references auth.users(id) on delete cascade,
  name               text not null,
  cost_with_igv      numeric(12,2) not null default 0 check (cost_with_igv >= 0),
  default_margin_pct numeric(5,2)  not null default 20 check (default_margin_pct >= 0 and default_margin_pct < 100),
  active             boolean not null default true,
  created_at         timestamptz not null default now()
);
create index products_user_idx on cotizador.products (user_id, active);

-- ── Correlativo de cotizaciones (solo vía create_quote) ──────
create table cotizador.quote_counters (
  user_id     uuid not null references auth.users(id) on delete cascade,
  year        int  not null,
  last_number int  not null default 0,
  primary key (user_id, year)
);
alter table cotizador.quote_counters enable row level security;  -- sin políticas

-- ── Cotizaciones ─────────────────────────────────────────────
create table cotizador.quotes (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null default auth.uid() references auth.users(id) on delete cascade,
  number          text not null,
  client_id       uuid references cotizador.clients(id) on delete set null,
  client_name     text,
  client_ruc      text,
  client_whatsapp text,
  status          text not null default 'borrador'
                  check (status in ('borrador','enviada','aceptada','rechazada')),
  issue_date      date not null default ((now() at time zone 'America/Lima')::date),
  valid_until     date,
  payment_terms   text,
  delivery_terms  text,
  warranty        text,
  subtotal        numeric(12,2) not null default 0,
  igv_total       numeric(12,2) not null default 0,
  total           numeric(12,2) not null default 0,
  total_profit    numeric(12,2) not null default 0,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  unique (user_id, number)
);
create index quotes_user_created_idx on cotizador.quotes (user_id, created_at desc);
create index quotes_status_idx       on cotizador.quotes (user_id, status);
create index quotes_client_idx       on cotizador.quotes (client_id);
create trigger quotes_updated_at before update on cotizador.quotes
  for each row execute function cotizador.set_updated_at();

create table cotizador.quote_items (
  id            uuid primary key default gen_random_uuid(),
  quote_id      uuid not null references cotizador.quotes(id) on delete cascade,
  user_id       uuid not null default auth.uid() references auth.users(id) on delete cascade,
  position      int  not null,
  name          text not null,
  qty           numeric(12,2) not null check (qty >= 1),
  cost_with_igv numeric(12,2) not null check (cost_with_igv >= 0),
  margin_pct    numeric(5,2)  not null check (margin_pct >= 0 and margin_pct < 100),
  renta_rate    numeric(5,4)  not null,
  igv_rate      numeric(5,4)  not null,
  unit_price    numeric(12,2) not null,
  line_total    numeric(12,2) not null,
  line_profit   numeric(12,2) not null
);
create index quote_items_quote_idx on cotizador.quote_items (quote_id, position);

-- ── Row Level Security: dueño + miembro autorizado ───────────
alter table cotizador.company_settings enable row level security;
alter table cotizador.clients          enable row level security;
alter table cotizador.products         enable row level security;
alter table cotizador.quotes           enable row level security;
alter table cotizador.quote_items      enable row level security;

create policy own_rows on cotizador.company_settings for all to authenticated
  using ((select auth.uid()) = user_id and cotizador.is_member())
  with check ((select auth.uid()) = user_id and cotizador.is_member());
create policy own_rows on cotizador.clients for all to authenticated
  using ((select auth.uid()) = user_id and cotizador.is_member())
  with check ((select auth.uid()) = user_id and cotizador.is_member());
create policy own_rows on cotizador.products for all to authenticated
  using ((select auth.uid()) = user_id and cotizador.is_member())
  with check ((select auth.uid()) = user_id and cotizador.is_member());
create policy own_rows on cotizador.quotes for all to authenticated
  using ((select auth.uid()) = user_id and cotizador.is_member())
  with check ((select auth.uid()) = user_id and cotizador.is_member());
create policy own_rows on cotizador.quote_items for all to authenticated
  using ((select auth.uid()) = user_id and cotizador.is_member())
  with check (
    (select auth.uid()) = user_id and cotizador.is_member()
    and exists (select 1 from cotizador.quotes q where q.id = quote_id and q.user_id = (select auth.uid()))
  );

-- ── Guardado atómico: número correlativo + cotización + ítems ─
create function cotizador.create_quote(p_quote jsonb, p_items jsonb)
returns cotizador.quotes
language plpgsql security definer set search_path = ''
as $$
declare
  v_uid    uuid := (select auth.uid());
  v_year   int  := extract(year from (now() at time zone 'America/Lima'))::int;
  v_n      int;
  v_row    cotizador.quotes;
begin
  if v_uid is null or not cotizador.is_member() then
    raise exception 'No autorizado' using errcode = '42501';
  end if;
  if p_items is null or jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items) = 0 then
    raise exception 'La cotización necesita al menos un ítem';
  end if;

  insert into cotizador.quote_counters as c (user_id, year, last_number)
  values (v_uid, v_year, 1)
  on conflict (user_id, year) do update set last_number = c.last_number + 1
  returning c.last_number into v_n;

  insert into cotizador.quotes (
    user_id, number, client_id, client_name, client_ruc, client_whatsapp, status,
    valid_until, payment_terms, delivery_terms, warranty,
    subtotal, igv_total, total, total_profit
  ) values (
    v_uid,
    'COT-' || v_year || '-' || lpad(v_n::text, 4, '0'),
    nullif(p_quote->>'client_id', '')::uuid,
    p_quote->>'client_name', p_quote->>'client_ruc', p_quote->>'client_whatsapp',
    coalesce(p_quote->>'status', 'borrador'),
    nullif(p_quote->>'valid_until', '')::date,
    p_quote->>'payment_terms', p_quote->>'delivery_terms', p_quote->>'warranty',
    coalesce((p_quote->>'subtotal')::numeric, 0),
    coalesce((p_quote->>'igv_total')::numeric, 0),
    coalesce((p_quote->>'total')::numeric, 0),
    coalesce((p_quote->>'total_profit')::numeric, 0)
  ) returning * into v_row;

  insert into cotizador.quote_items (
    quote_id, user_id, position, name, qty, cost_with_igv, margin_pct,
    renta_rate, igv_rate, unit_price, line_total, line_profit
  )
  select v_row.id, v_uid, e.ord::int, x.name, x.qty, x.cost_with_igv, x.margin_pct,
         x.renta_rate, x.igv_rate, x.unit_price, x.line_total, x.line_profit
  from jsonb_array_elements(p_items) with ordinality as e(item, ord),
       lateral jsonb_to_record(e.item) as x(
         name text, qty numeric, cost_with_igv numeric, margin_pct numeric,
         renta_rate numeric, igv_rate numeric, unit_price numeric, line_total numeric,
         line_profit numeric
       );

  return v_row;
end;
$$;

-- ── Permisos ─────────────────────────────────────────────────
revoke all on schema cotizador from public, anon;
grant usage on schema cotizador to authenticated;

grant select, insert, update, delete on
  cotizador.company_settings, cotizador.clients, cotizador.products,
  cotizador.quotes, cotizador.quote_items
to authenticated;

revoke execute on function cotizador.is_member()          from public, anon;
revoke execute on function cotizador.create_quote(jsonb, jsonb) from public, anon;
grant  execute on function cotizador.is_member()          to authenticated;
grant  execute on function cotizador.create_quote(jsonb, jsonb) to authenticated;
