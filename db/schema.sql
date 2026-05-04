create table if not exists districts (
  id serial primary key,
  name text not null unique
);

create table if not exists parties (
  id serial primary key,
  name text not null unique
);

create table if not exists constituencies (
  id serial primary key,
  district_id integer not null references districts(id) on delete cascade,
  code text not null unique,
  constituency_number integer not null unique,
  name text not null,
  leading_party_id integer references parties(id),
  leading_margin integer,
  updated_at timestamptz not null default now()
);

create table if not exists candidates (
  id serial primary key,
  constituency_id integer not null references constituencies(id) on delete cascade,
  party_id integer not null references parties(id) on delete cascade,
  name text not null,
  unique (constituency_id, party_id)
);

create table if not exists rounds (
  id serial primary key,
  constituency_id integer not null references constituencies(id) on delete cascade,
  round_number integer not null,
  unique (constituency_id, round_number)
);

create table if not exists round_votes (
  id serial primary key,
  round_id integer not null references rounds(id) on delete cascade,
  candidate_id integer not null references candidates(id) on delete cascade,
  votes integer not null default 0,
  unique (round_id, candidate_id)
);

create index if not exists idx_constituencies_district_id on constituencies(district_id);
create index if not exists idx_candidates_constituency_id on candidates(constituency_id);
create index if not exists idx_rounds_constituency_id on rounds(constituency_id);
create index if not exists idx_round_votes_round_id on round_votes(round_id);
