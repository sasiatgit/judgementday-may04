import { cache } from "react";
import { getPool, hasDatabaseUrl } from "@/lib/db";
import type {
  ConstituencyResult,
  DashboardData,
  DashboardLoadResult,
  DashboardQueryOptions,
  DistrictRecord,
  PartyResult,
  PartyRound,
  RoundResult
} from "@/lib/types";
import { PARTIES, ROUND_COUNT } from "@/lib/constants";

type ResultsRow = {
  constituency_id: number;
  code: string;
  constituency_number: number;
  constituency_name: string;
  district_name: string;
  party_name: string;
  candidate_name: string;
  total_votes: string;
  leading_party: string | null;
  leading_margin: string | null;
  round_number: number;
  round_votes: string;
};

type LegacyDistrictRow = {
  id: number;
  name: string;
};

type LegacyConstituencyRow = {
  no: number;
  constituency: string;
  district: string;
};

const getDistricts = cache(async (): Promise<DistrictRecord[]> => {
  const pool = getPool();
  const result = await pool.query<DistrictRecord>(
    "select id, name from districts order by name asc"
  );

  return result.rows;
});

export function parseDistrictSearchParam(value: string | string[] | undefined): number[] {
  const rawValue = Array.isArray(value) ? value[0] : value;

  if (!rawValue) {
    return [];
  }

  return rawValue
    .split(",")
    .map((item) => Number(item.trim()))
    .filter((item) => Number.isInteger(item) && item > 0);
}

export function parsePageSearchParam(value: string | string[] | undefined): number {
  const rawValue = Array.isArray(value) ? value[0] : value;
  const parsed = Number(rawValue ?? "1");
  return Number.isInteger(parsed) && parsed > 0 ? parsed : 1;
}

function buildResultsMap(rows: ResultsRow[]): ConstituencyResult[] {
  const constituencies = new Map<number, ConstituencyResult>();

  for (const row of rows) {
    let constituency = constituencies.get(row.constituency_id);

    if (!constituency) {
      constituency = {
        id: row.constituency_id,
        code: row.code,
        constituencyNumber: row.constituency_number,
        name: row.constituency_name,
        districtName: row.district_name,
        partyResults: {},
        rounds: [],
        leadingParty: row.leading_party,
        leadingMargin: row.leading_margin ? Number(row.leading_margin) : null
      };

      constituencies.set(row.constituency_id, constituency);
    }

    let partyResult = constituency.partyResults[row.party_name] as PartyResult | undefined;
    if (!partyResult) {
      partyResult = {
        candidateName: row.candidate_name,
        totalVotes: Number(row.total_votes)
      };
      constituency.partyResults[row.party_name] = partyResult;
    }

    let round = constituency.rounds.find((entry) => entry.roundNumber === row.round_number);
    if (!round) {
      round = {
        roundNumber: row.round_number,
        partyRounds: {}
      };
      constituency.rounds.push(round);
    }

    round.partyRounds[row.party_name] = {
      candidateName: row.candidate_name,
      votes: Number(row.round_votes)
    } satisfies PartyRound;
  }

  return Array.from(constituencies.values()).map((constituency) => ({
    ...constituency,
    rounds: constituency.rounds.sort((left, right) => left.roundNumber - right.roundNumber)
  }));
}

function createEmptyPartyResults(constituencyName: string) {
  return Object.fromEntries(
    PARTIES.map((party) => [
      party,
      {
        candidateName: `${party} candidate pending`,
        totalVotes: 0
      }
    ])
  );
}

function createEmptyRounds() {
  return Array.from({ length: ROUND_COUNT }, (_, index) => ({
    roundNumber: index + 1,
    partyRounds: Object.fromEntries(
      PARTIES.map((party) => [
        party,
        {
          candidateName: `${party} candidate pending`,
          votes: 0
        }
      ])
    )
  }));
}

async function loadLegacyDashboardData({
  districtIds,
  page,
  pageSize
}: DashboardQueryOptions): Promise<DashboardData> {
  const pool = getPool();
  const districtResult = await pool.query<LegacyDistrictRow>(
    `
      select row_number() over(order by district asc)::int as id, district as name
      from (select distinct district from constituencies) districts
      order by district asc
    `
  );

  const availableDistricts = districtResult.rows.map((row) => ({
    id: row.id,
    name: row.name
  }));

  const districtIdMap = new Map(availableDistricts.map((district) => [district.id, district.name]));
  const selectedDistrictNames = districtIds
    .map((id) => districtIdMap.get(id))
    .filter((name): name is string => Boolean(name));

  const filtersActive = selectedDistrictNames.length > 0;
  const totalResult = await pool.query<{ count: string }>(
    `
      select count(*)::text as count
      from constituencies
      where ($1::boolean = false or district = any($2::text[]))
    `,
    [filtersActive, selectedDistrictNames]
  );

  const totalConstituencies = Number(totalResult.rows[0]?.count ?? 0);
  const totalPages = Math.max(1, Math.ceil(totalConstituencies / pageSize));
  const offset = (page - 1) * pageSize;

  const constituencyResult = await pool.query<LegacyConstituencyRow>(
    `
      select no, constituency, district
      from constituencies
      where ($1::boolean = false or district = any($2::text[]))
      order by no asc
      limit $3
      offset $4
    `,
    [filtersActive, selectedDistrictNames, pageSize, offset]
  );

  const constituencies: ConstituencyResult[] = constituencyResult.rows.map((row) => ({
    id: row.no,
    code: `TN-${String(row.no).padStart(3, "0")}`,
    constituencyNumber: Number(row.no),
    name: row.constituency,
    districtName: row.district,
    partyResults: createEmptyPartyResults(row.constituency),
    rounds: createEmptyRounds(),
    leadingParty: null,
    leadingMargin: null
  }));

  return {
    availableDistricts,
    selectedDistrictIds: districtIds.filter((id) => districtIdMap.has(id)),
    constituencies,
    totalConstituencies,
    currentPage: page,
    totalPages
  };
}

export async function getDashboardData({
  districtIds,
  page,
  pageSize
}: DashboardQueryOptions): Promise<DashboardData> {
  const pool = getPool();
  const tablesResult = await pool.query<{ tablename: string }>(
    `
      select tablename
      from pg_tables
      where schemaname = 'public'
    `
  );
  const tableNames = new Set(tablesResult.rows.map((row) => row.tablename));
  const hasCountingSchema =
    tableNames.has("districts") &&
    tableNames.has("parties") &&
    tableNames.has("candidates") &&
    tableNames.has("rounds") &&
    tableNames.has("round_votes");

  if (!hasCountingSchema) {
    return loadLegacyDashboardData({ districtIds, page, pageSize });
  }

  const availableDistricts = await getDistricts();
  const validDistrictIds = districtIds.filter((id) =>
    availableDistricts.some((district) => district.id === id)
  );

  const filtersActive = validDistrictIds.length > 0;
  const filterValues = validDistrictIds;

  const totalResult = await pool.query<{ count: string }>(
    `
      select count(*)::text as count
      from constituencies c
      where ($1::boolean = false or c.district_id = any($2::int[]))
    `,
    [filtersActive, filterValues]
  );

  const totalConstituencies = Number(totalResult.rows[0]?.count ?? 0);
  const totalPages = Math.max(1, Math.ceil(totalConstituencies / pageSize));
  const offset = (page - 1) * pageSize;

  const constituencyResult = await pool.query<{ id: number }>(
    `
      select c.id
      from constituencies c
      where ($1::boolean = false or c.district_id = any($2::int[]))
      order by c.constituency_number asc
      limit $3
      offset $4
    `,
    [filtersActive, filterValues, pageSize, offset]
  );

  const constituencyIds = constituencyResult.rows.map((row) => row.id);
  if (constituencyIds.length === 0) {
    return {
      availableDistricts,
      selectedDistrictIds: validDistrictIds,
      constituencies: [],
      totalConstituencies,
      currentPage: page,
      totalPages
    };
  }

  const results = await pool.query<ResultsRow>(
    `
      select
        c.id as constituency_id,
        c.code,
        c.constituency_number,
        c.name as constituency_name,
        d.name as district_name,
        p.name as party_name,
        cand.name as candidate_name,
        totals.total_votes::text as total_votes,
        lp.name as leading_party,
        c.leading_margin::text as leading_margin,
        r.round_number,
        coalesce(sum(rv.votes), 0)::text as round_votes
      from constituencies c
      join districts d on d.id = c.district_id
      join candidates cand on cand.constituency_id = c.id
      join parties p on p.id = cand.party_id
      join rounds r on r.constituency_id = c.id
      join lateral (
        select coalesce(sum(rv_total.votes), 0) as total_votes
        from rounds r_total
        left join round_votes rv_total
          on rv_total.round_id = r_total.id
          and rv_total.candidate_id = cand.id
        where r_total.constituency_id = c.id
      ) totals on true
      left join round_votes rv
        on rv.round_id = r.id
        and rv.candidate_id = cand.id
      left join parties lp on lp.id = c.leading_party_id
      where c.id = any($1::int[])
      group by
        c.id,
        c.code,
        c.constituency_number,
        c.name,
        d.name,
        p.name,
        cand.name,
        totals.total_votes,
        lp.name,
        c.leading_margin,
        r.round_number
      order by c.constituency_number asc, r.round_number asc, p.name asc
    `,
    [constituencyIds]
  );

  return {
    availableDistricts,
    selectedDistrictIds: validDistrictIds,
    constituencies: buildResultsMap(results.rows),
    totalConstituencies,
    currentPage: page,
    totalPages
  };
}

export async function loadDashboardData(
  options: DashboardQueryOptions
): Promise<DashboardLoadResult> {
  try {
    const dashboard = await getDashboardData(options);
    return {
      ok: true,
      dashboard
    };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to connect to PostgreSQL right now.";

    return {
      ok: false,
      reason: hasDatabaseUrl() ? "database_unavailable" : "missing_database_url",
      message:
        hasDatabaseUrl()
          ? message
          : "Could not connect with the local PostgreSQL fallback either. Start PostgreSQL or add DATABASE_URL in .env."
    };
  }
}
