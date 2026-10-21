-- Roles
create type public.app_role as enum ('admin','editor');
create type public.social_platform as enum ('instagram','tiktok','youtube','facebook','x');
create type public.record_status as enum ('draft','approved','archived');
create type public.source_kind as enum ('official_api','licensed_provider','manual','csv','demo');

create table public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  role app_role not null,
  created_at timestamptz not null default now(),
  unique (user_id, role)
);
grant select on public.user_roles to authenticated;
grant all on public.user_roles to service_role;
alter table public.user_roles enable row level security;

create or replace function public.has_role(_user_id uuid, _role app_role)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.user_roles where user_id = _user_id and role = _role)
$$;

create policy "own roles readable" on public.user_roles for select to authenticated
  using (user_id = auth.uid() or public.has_role(auth.uid(),'admin'));

-- first account becomes admin (bootstrap); later accounts get no role
create or replace function public.bootstrap_first_admin()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if not exists (select 1 from public.user_roles where role = 'admin') then
    insert into public.user_roles(user_id, role) values (new.id, 'admin');
  end if;
  return new;
end $$;
create trigger on_auth_user_created_bootstrap after insert on auth.users
  for each row execute function public.bootstrap_first_admin();

create or replace function public.touch_updated_at() returns trigger language plpgsql set search_path = public as $$
begin new.updated_at = now(); return new; end $$;

-- Categories
create table public.categories (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9-]{2,40}$'),
  name text not null check (char_length(name) between 2 and 60),
  sort_order int not null default 0
);
grant select on public.categories to anon, authenticated;
grant insert, update, delete on public.categories to authenticated;
grant all on public.categories to service_role;
alter table public.categories enable row level security;
create policy "categories public read" on public.categories for select using (true);
create policy "categories admin write" on public.categories for all to authenticated
  using (public.has_role(auth.uid(),'admin')) with check (public.has_role(auth.uid(),'admin'));

-- Data sources
create table public.data_sources (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9-]{2,60}$'),
  name text not null,
  kind source_kind not null,
  platform social_platform,
  secret_name text check (secret_name is null or secret_name ~ '^[A-Z][A-Z0-9_]{2,60}$'),
  docs_url text,
  notes text,
  enabled boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
grant select on public.data_sources to anon, authenticated;
grant insert, update, delete on public.data_sources to authenticated;
grant all on public.data_sources to service_role;
alter table public.data_sources enable row level security;
create policy "sources public read" on public.data_sources for select using (true);
create policy "sources admin write" on public.data_sources for all to authenticated
  using (public.has_role(auth.uid(),'admin')) with check (public.has_role(auth.uid(),'admin'));
create trigger t_sources_upd before update on public.data_sources for each row execute function public.touch_updated_at();

-- People
create table public.people (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9-]{2,80}$'),
  name text not null check (char_length(name) between 2 and 120),
  avatar_url text,
  country_code char(2) not null check (country_code ~ '^[A-Z]{2}$'),
  party text,
  political_office text,
  bio text check (bio is null or char_length(bio) <= 600),
  is_demo boolean not null default false,
  status record_status not null default 'draft',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index people_country_idx on public.people(country_code) where status = 'approved';
create index people_name_idx on public.people(lower(name));
grant select on public.people to anon, authenticated;
grant insert, update, delete on public.people to authenticated;
grant all on public.people to service_role;
alter table public.people enable row level security;
create policy "people public approved" on public.people for select using (status = 'approved' or public.has_role(auth.uid(),'admin'));
create policy "people admin write" on public.people for all to authenticated
  using (public.has_role(auth.uid(),'admin')) with check (public.has_role(auth.uid(),'admin'));
create trigger t_people_upd before update on public.people for each row execute function public.touch_updated_at();

create table public.person_categories (
  person_id uuid not null references public.people(id) on delete cascade,
  category_id uuid not null references public.categories(id) on delete cascade,
  primary key (person_id, category_id)
);
create index pc_category_idx on public.person_categories(category_id);
grant select on public.person_categories to anon, authenticated;
grant insert, update, delete on public.person_categories to authenticated;
grant all on public.person_categories to service_role;
alter table public.person_categories enable row level security;
create policy "pc public read" on public.person_categories for select using (
  exists (select 1 from public.people p where p.id = person_id and (p.status='approved' or public.has_role(auth.uid(),'admin'))));
create policy "pc admin write" on public.person_categories for all to authenticated
  using (public.has_role(auth.uid(),'admin')) with check (public.has_role(auth.uid(),'admin'));

-- Social accounts
create table public.social_accounts (
  id uuid primary key default gen_random_uuid(),
  person_id uuid not null references public.people(id) on delete cascade,
  platform social_platform not null,
  handle text not null check (handle ~ '^[A-Za-z0-9._-]{1,60}$'),
  url text,
  external_id text,
  status record_status not null default 'draft',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (platform, handle)
);
create index sa_person_idx on public.social_accounts(person_id);
create index sa_platform_idx on public.social_accounts(platform) where status='approved';
grant select on public.social_accounts to anon, authenticated;
grant insert, update, delete on public.social_accounts to authenticated;
grant all on public.social_accounts to service_role;
alter table public.social_accounts enable row level security;
create policy "sa public approved" on public.social_accounts for select using (
  public.has_role(auth.uid(),'admin') or (status='approved' and exists (select 1 from public.people p where p.id=person_id and p.status='approved')));
create policy "sa admin write" on public.social_accounts for all to authenticated
  using (public.has_role(auth.uid(),'admin')) with check (public.has_role(auth.uid(),'admin'));
create trigger t_sa_upd before update on public.social_accounts for each row execute function public.touch_updated_at();

-- Snapshots
create table public.metric_snapshots (
  id uuid primary key default gen_random_uuid(),
  account_id uuid not null references public.social_accounts(id) on delete cascade,
  source_id uuid not null references public.data_sources(id),
  captured_at timestamptz not null,
  followers bigint check (followers is null or followers >= 0),
  following bigint check (following is null or following >= 0),
  posts bigint check (posts is null or posts >= 0),
  total_views bigint check (total_views is null or total_views >= 0),
  avg_likes numeric check (avg_likes is null or avg_likes >= 0),
  avg_comments numeric check (avg_comments is null or avg_comments >= 0),
  engagement_rate numeric check (engagement_rate is null or (engagement_rate >= 0 and engagement_rate <= 100)),
  is_estimate boolean not null default false,
  approved boolean not null default true,
  ingest_run_id uuid,
  created_at timestamptz not null default now(),
  unique (account_id, captured_at, source_id)
);
create index ms_account_time_idx on public.metric_snapshots(account_id, captured_at desc);
grant select on public.metric_snapshots to anon, authenticated;
grant insert, update, delete on public.metric_snapshots to authenticated;
grant all on public.metric_snapshots to service_role;
alter table public.metric_snapshots enable row level security;
create policy "ms public approved" on public.metric_snapshots for select using (
  public.has_role(auth.uid(),'admin') or (approved and exists (
    select 1 from public.social_accounts a join public.people p on p.id=a.person_id
    where a.id=account_id and a.status='approved' and p.status='approved')));
create policy "ms admin write" on public.metric_snapshots for all to authenticated
  using (public.has_role(auth.uid(),'admin')) with check (public.has_role(auth.uid(),'admin'));

-- Ingest runs
create table public.ingest_runs (
  id uuid primary key default gen_random_uuid(),
  source_id uuid references public.data_sources(id) on delete set null,
  method text not null check (method in ('csv','manual','connector')),
  status text not null default 'running' check (status in ('running','success','partial','failed')),
  rows_total int not null default 0,
  rows_ok int not null default 0,
  rows_failed int not null default 0,
  errors jsonb not null default '[]'::jsonb,
  file_name text,
  created_by uuid,
  started_at timestamptz not null default now(),
  finished_at timestamptz
);
create index ir_started_idx on public.ingest_runs(started_at desc);
grant select, insert, update, delete on public.ingest_runs to authenticated;
grant all on public.ingest_runs to service_role;
alter table public.ingest_runs enable row level security;
create policy "ir admin" on public.ingest_runs for all to authenticated
  using (public.has_role(auth.uid(),'admin')) with check (public.has_role(auth.uid(),'admin'));

-- Ranking RPC (RLS applies: security invoker)
create or replace function public.get_ranking(
  p_region text default 'world', p_country text default null, p_category text default null,
  p_platform text default 'instagram', p_period_days int default 30, p_sort text default 'followers',
  p_search text default null, p_party text default null, p_office text default null,
  p_limit int default 25, p_offset int default 0)
returns table(person_id uuid, slug text, name text, avatar_url text, country_code text, party text,
  political_office text, is_demo boolean, account_id uuid, platform social_platform, handle text,
  followers bigint, followers_prev bigint, gain bigint, growth_pct numeric, engagement_rate numeric,
  captured_at timestamptz, prev_captured_at timestamptz, source_name text, is_estimate boolean, total_count bigint)
language sql stable security invoker set search_path = public as $$
with base as (
  select p.id pid, p.slug, p.name, p.avatar_url, p.country_code::text cc, p.party, p.political_office, p.is_demo,
         a.id acc_id, a.platform, a.handle
  from people p join social_accounts a on a.person_id = p.id
  where p.status='approved' and a.status='approved'
    and (p_platform is null or a.platform::text = p_platform)
    and (coalesce(p_region,'world') <> 'br' or p.country_code = 'BR')
    and (p_country is null or p.country_code = upper(p_country))
    and (p_category is null or exists (select 1 from person_categories pc join categories c on c.id=pc.category_id
                                         where pc.person_id=p.id and c.slug=p_category))
    and (p_party is null or p.party ilike p_party)
    and (p_office is null or p.political_office ilike '%'||p_office||'%')
    and (p_search is null or p.name ilike '%'||p_search||'%' or a.handle ilike '%'||ltrim(p_search,'@')||'%')
), latest as (
  select b.*, s.followers f, s.captured_at cat, s.is_estimate est, ds.name src,
    coalesce(s.engagement_rate, case when s.followers > 0 and s.avg_likes is not null
      then round(((s.avg_likes + coalesce(s.avg_comments,0)) / s.followers) * 100, 3) end) eng
  from base b
  left join lateral (select * from metric_snapshots m where m.account_id=b.acc_id and m.approved and m.followers is not null
                     order by m.captured_at desc limit 1) s on true
  left join data_sources ds on ds.id = s.source_id
), withprev as (
  select l.*, pv.followers pf, pv.captured_at pat from latest l
  left join lateral (select m.followers, m.captured_at from metric_snapshots m
     where l.cat is not null and m.account_id=l.acc_id and m.approved and m.followers is not null
       and m.captured_at <= l.cat - make_interval(days => greatest(p_period_days,1))
       and m.captured_at >= l.cat - make_interval(days => (greatest(p_period_days,1) * 1.25 + 1)::int)
     order by m.captured_at desc limit 1) pv on true
), calc as (
  select w.*, case when pf is not null then f - pf end g,
         case when pf > 0 then round(((f - pf)::numeric / pf) * 100, 3) end gp
  from withprev w
)
select pid, slug, name, avatar_url, cc, party, political_office, is_demo, acc_id, platform, handle,
       f, pf, g, gp, eng, cat, pat, src, est, count(*) over ()
from calc
order by
  case when p_sort = 'loss' then g::numeric end asc nulls last,
  case when p_sort = 'decline' then gp end asc nulls last,
  case p_sort when 'followers' then f::numeric when 'gain' then g::numeric when 'growth' then gp when 'engagement' then eng end desc nulls last,
  f desc nulls last, name
limit least(greatest(p_limit,1),100) offset greatest(p_offset,0);
$$;
grant execute on function public.get_ranking to anon, authenticated;

-- Seed reference data
insert into public.categories(slug,name,sort_order) values
 ('politicos','Políticos',1),('influenciadores','Influenciadores',2),('celebridades','Celebridades',3),
 ('jornalistas','Jornalistas',4),('atletas','Atletas',5),('musicos','Músicos',6),('criadores','Criadores',7);

insert into public.data_sources(slug,name,kind,platform,secret_name,docs_url,notes,enabled) values
 ('demo','Dados fictícios de demonstração','demo',null,null,null,'Séries sintéticas para demonstrar a interface. Não representam pessoas reais.',true),
 ('manual','Inserção manual (admin)','manual',null,null,null,'Snapshots digitados por administradores com data e fonte.',true),
 ('csv','Importação CSV (admin)','csv',null,null,null,'Arquivos CSV validados linha a linha.',true),
 ('meta-graph','Meta Graph API (Instagram/Facebook)','official_api','instagram','META_GRAPH_ACCESS_TOKEN','https://developers.facebook.com/docs/instagram-platform','Exige app aprovado pela Meta. Business Discovery cobre apenas contas profissionais.',false),
 ('youtube-data','YouTube Data API v3','official_api','youtube','YOUTUBE_API_KEY','https://developers.google.com/youtube/v3','Contagem de inscritos é arredondada pela API (3 dígitos significativos). Cota diária.',false),
 ('tiktok-research','TikTok Research API','official_api','tiktok','TIKTOK_RESEARCH_TOKEN','https://developers.tiktok.com/products/research-api/','Acesso restrito a pesquisadores aprovados.',false),
 ('x-api','X API v2','official_api','x','X_BEARER_TOKEN','https://docs.x.com/x-api/introduction','Leitura de public_metrics depende do plano contratado.',false),
 ('socialblade','Social Blade Business API','licensed_provider',null,'SOCIALBLADE_API_KEY','https://socialblade.com/business-api','Provedor licenciado; valores podem ser estimativas.',false);

-- Fictional demo dataset (clearly flagged, no real people)
do $$
declare
  demo_src uuid := (select id from public.data_sources where slug='demo');
  rec record; pid uuid; aid uuid; d int; base numeric; f numeric; plats text[]; pl text; i int;
begin
  perform setseed(0.42);
  for rec in select * from (values
    ('ana-demo-ribeiro','Ana Ribeiro (Demo)','BR','influenciadores',null,null,1800000,0.0022),
    ('bruno-demo-castro','Bruno Castro (Demo)','BR','politicos','Partido Fictício A','Deputado(a) federal (fictício)',640000,0.0011),
    ('carla-demo-mendes','Carla Mendes (Demo)','BR','jornalistas',null,null,410000,0.0006),
    ('diego-demo-alves','Diego Alves (Demo)','BR','atletas',null,null,5200000,0.0015),
    ('elisa-demo-prado','Elisa Prado (Demo)','BR','musicos',null,null,8900000,-0.0004),
    ('felipe-demo-rocha','Felipe Rocha (Demo)','BR','criadores',null,null,2300000,0.0031),
    ('gabriela-demo-nunes','Gabriela Nunes (Demo)','BR','politicos','Partido Fictício B','Senador(a) (fictício)',980000,-0.0007),
    ('heitor-demo-lima','Heitor Lima (Demo)','BR','celebridades',null,null,12400000,0.0003),
    ('iris-demo-sato','Iris Sato (Demo)','JP','musicos',null,null,15600000,0.0012),
    ('james-demo-walker','James Walker (Demo)','US','celebridades',null,null,48000000,0.0005),
    ('lena-demo-fischer','Lena Fischer (Demo)','DE','jornalistas',null,null,720000,0.0009),
    ('mateo-demo-garcia','Mateo García (Demo)','AR','atletas',null,null,22000000,0.0018),
    ('nadia-demo-haddad','Nadia Haddad (Demo)','FR','influenciadores',null,null,3300000,-0.0012),
    ('omar-demo-silva','Omar Silva (Demo)','PT','criadores',null,null,1100000,0.0040),
    ('paula-demo-reyes','Paula Reyes (Demo)','MX','politicos','Partido Ficticio C','Prefeita (fictício)',530000,0.0008),
    ('ravi-demo-patel','Ravi Patel (Demo)','IN','criadores',null,null,9700000,0.0026)
  ) as t(slug,name,cc,cat,party,office,base,growth)
  loop
    insert into public.people(slug,name,country_code,party,political_office,bio,is_demo,status)
    values (rec.slug, rec.name, rec.cc, rec.party, rec.office,
      'Perfil fictício criado para demonstração da plataforma. Não corresponde a nenhuma pessoa real.', true, 'approved')
    returning id into pid;
    insert into public.person_categories(person_id, category_id) select pid, id from public.categories where slug = rec.cat;
    plats := case (abs(hashtext(rec.slug)) % 3) when 0 then array['instagram','tiktok','youtube']
             when 1 then array['instagram','x','facebook'] else array['instagram','tiktok','x'] end;
    i := 0;
    foreach pl in array plats loop
      i := i + 1;
      insert into public.social_accounts(person_id, platform, handle, status)
      values (pid, pl::social_platform, 'demo_' || replace(split_part(rec.slug,'-demo-',1),'-','') || '_' || split_part(rec.slug,'-demo-',2) || case when i>1 then '' else '' end, 'approved')
      returning id into aid;
      base := rec.base * (case i when 1 then 1 when 2 then 0.55 else 0.3 end);
      for d in reverse 400..0 loop
        f := base * power(1 + rec.growth * (case i when 2 then 1.6 else 1 end), 400 - d) * (1 + (random() - 0.5) * 0.002);
        insert into public.metric_snapshots(account_id, source_id, captured_at, followers, posts, avg_likes, avg_comments, is_estimate)
        values (aid, demo_src, date_trunc('day', now() at time zone 'utc') at time zone 'utc' - make_interval(days => d),
                round(f), 300 + (400 - d) / 3,
                round(f * (0.006 + random() * 0.02)), round(f * (0.0004 + random() * 0.001)), false);
      end loop;
    end loop;
  end loop;
end $$;