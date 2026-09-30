-- crm schema

-- Auto-update updatedAt on row changes.
create or replace function touchUpdatedAt()
returns trigger
language plpgsql
as $$
begin
  new.updatedAt = now();
  return new;
end;
$$;

create type userRole as enum ('owner', 'rep');

create type dealStage as enum ('lead', 'qualified', 'proposal', 'negotiation', 'won', 'lost');

create type activityKind as enum ('note', 'call', 'email', 'stage');

create table users (
  id uuid primary key default uuidGenerateV7(),
  createdAt timestamptz not null default now(),
  updatedAt timestamptz not null default now(),
  email text not null unique,
  name text not null,
  passwordHash text not null,
  role userRole not null default 'rep'
);

create trigger usersTouchUpdatedAt
  before update on users
  for each row execute function touchUpdatedAt();

create table invites (
  id uuid primary key default uuidGenerateV7(),
  createdAt timestamptz not null default now(),
  updatedAt timestamptz not null default now(),
  email text not null,
  token text not null unique,
  invitedById uuid references users (id) on delete set null,
  acceptedAt timestamptz,
  expiresAt timestamptz not null default now() + interval '14 days'
);

create trigger invitesTouchUpdatedAt
  before update on invites
  for each row execute function touchUpdatedAt();

create table companies (
  id uuid primary key default uuidGenerateV7(),
  createdAt timestamptz not null default now(),
  updatedAt timestamptz not null default now(),
  name text not null,
  domain text not null default '',
  industry text not null default ''
);

create trigger companiesTouchUpdatedAt
  before update on companies
  for each row execute function touchUpdatedAt();

create table contacts (
  id uuid primary key default uuidGenerateV7(),
  createdAt timestamptz not null default now(),
  updatedAt timestamptz not null default now(),
  name text not null,
  email text not null default '',
  phone text not null default '',
  companyId uuid references companies (id) on delete set null,
  ownerId uuid references users (id) on delete set null,
  notes text not null default ''
);

create index contactsCompanyId on contacts (companyId);

create trigger contactsTouchUpdatedAt
  before update on contacts
  for each row execute function touchUpdatedAt();

create table deals (
  id uuid primary key default uuidGenerateV7(),
  createdAt timestamptz not null default now(),
  updatedAt timestamptz not null default now(),
  name text not null,
  companyId uuid references companies (id) on delete set null,
  value integer not null default 0 check (value >= 0),
  stage dealStage not null default 'lead',
  closeOn date,
  ownerId uuid references users (id) on delete set null,
  wonAt timestamptz
);

create index dealsCompanyId on deals (companyId);

create trigger dealsTouchUpdatedAt
  before update on deals
  for each row execute function touchUpdatedAt();

create table activities (
  id uuid primary key default uuidGenerateV7(),
  createdAt timestamptz not null default now(),
  updatedAt timestamptz not null default now(),
  dealId uuid not null references deals (id) on delete cascade,
  userId uuid references users (id) on delete set null,
  kind activityKind not null,
  body text not null default '',
  fromStage dealStage,
  toStage dealStage
);

create index activitiesDealId on activities (dealId, createdAt);

create trigger activitiesTouchUpdatedAt
  before update on activities
  for each row execute function touchUpdatedAt();

create table tasks (
  id uuid primary key default uuidGenerateV7(),
  createdAt timestamptz not null default now(),
  updatedAt timestamptz not null default now(),
  title text not null,
  dueOn date not null,
  done boolean not null default false,
  ownerId uuid references users (id) on delete set null,
  contactId uuid references contacts (id) on delete cascade,
  dealId uuid references deals (id) on delete cascade,
  check (contactId is not null or dealId is not null)
);

create index tasksOwnerDue on tasks (ownerId, dueOn);

create trigger tasksTouchUpdatedAt
  before update on tasks
  for each row execute function touchUpdatedAt();
