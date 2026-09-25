create table public.profiles (
  id uuid primary key,
  name text not null default '',
  monthly_income numeric(14,2) not null default 0,
  initial_balance numeric(14,2) not null default 0,
  control_type text not null default 'pessoal',
  onboarded boolean not null default false,
  created_at timestamptz not null default now()
);
grant select, insert, update on public.profiles to authenticated;
grant all on public.profiles to service_role;
alter table public.profiles enable row level security;
create policy "own profile select" on public.profiles for select to authenticated using (auth.uid() = id);
create policy "own profile insert" on public.profiles for insert to authenticated with check (auth.uid() = id);
create policy "own profile update" on public.profiles for update to authenticated using (auth.uid() = id);

create table public.transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid(),
  type text not null check (type in ('receita','despesa')),
  amount numeric(14,2) not null check (amount > 0),
  description text not null default '',
  category text not null default 'Outros',
  occurred_on date not null default current_date,
  created_at timestamptz not null default now()
);
grant select, insert, update, delete on public.transactions to authenticated;
grant all on public.transactions to service_role;
alter table public.transactions enable row level security;
create policy "own tx" on public.transactions for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

create table public.goals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid(),
  name text not null,
  target_amount numeric(14,2) not null check (target_amount > 0),
  created_at timestamptz not null default now()
);
grant select, insert, update, delete on public.goals to authenticated;
grant all on public.goals to service_role;
alter table public.goals enable row level security;
create policy "own goals" on public.goals for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

create table public.goal_contributions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid(),
  goal_id uuid not null references public.goals(id) on delete cascade,
  amount numeric(14,2) not null check (amount > 0),
  created_at timestamptz not null default now()
);
grant select, insert, update, delete on public.goal_contributions to authenticated;
grant all on public.goal_contributions to service_role;
alter table public.goal_contributions enable row level security;
create policy "own contrib" on public.goal_contributions for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

create table public.chat_messages (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid(),
  message jsonb not null,
  created_at timestamptz not null default clock_timestamp()
);
grant select, insert, update, delete on public.chat_messages to authenticated;
grant all on public.chat_messages to service_role;
alter table public.chat_messages enable row level security;
create policy "own chat" on public.chat_messages for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

create or replace function public.handle_new_user() returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, name) values (new.id, coalesce(new.raw_user_meta_data->>'name', new.raw_user_meta_data->>'full_name', split_part(new.email,'@',1)));
  return new;
end; $$;
create trigger on_auth_user_created after insert on auth.users for each row execute function public.handle_new_user();