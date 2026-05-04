import { readFile } from "node:fs/promises";
import path from "node:path";
import { Pool } from "pg";
import { DISTRICTS, PARTIES, ROUND_COUNT, TOTAL_CONSTITUENCIES } from "@/lib/constants";

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  throw new Error("DATABASE_URL is required to seed the database.");
}

const pool = new Pool({
  connectionString: DATABASE_URL
});

function createCandidateName(party: string, constituencyNumber: number) {
  return `${party} Candidate ${String(constituencyNumber).padStart(3, "0")}`;
}

function createRoundVotes(partyIndex: number, constituencyNumber: number, roundNumber: number) {
  return 1200 + partyIndex * 145 + constituencyNumber * 7 + roundNumber * 21;
}

async function seed() {
  const schemaPath = path.join(process.cwd(), "db", "schema.sql");
  const schemaSql = await readFile(schemaPath, "utf8");

  await pool.query(schemaSql);
  await pool.query("begin");

  try {
    await pool.query("truncate round_votes, rounds, candidates, constituencies, parties, districts restart identity cascade");

    const districtIds = new Map<string, number>();
    for (const district of DISTRICTS) {
      const result = await pool.query<{ id: number }>(
        "insert into districts(name) values($1) returning id",
        [district]
      );
      districtIds.set(district, result.rows[0].id);
    }

    const partyIds = new Map<string, number>();
    for (const party of PARTIES) {
      const result = await pool.query<{ id: number }>(
        "insert into parties(name) values($1) returning id",
        [party]
      );
      partyIds.set(party, result.rows[0].id);
    }

    for (let constituencyNumber = 1; constituencyNumber <= TOTAL_CONSTITUENCIES; constituencyNumber += 1) {
      const districtName = DISTRICTS[(constituencyNumber - 1) % DISTRICTS.length];
      const districtId = districtIds.get(districtName);

      if (!districtId) {
        throw new Error(`District missing during seed: ${districtName}`);
      }

      const constituencyResult = await pool.query<{ id: number }>(
        `
          insert into constituencies(
            district_id,
            code,
            constituency_number,
            name,
            leading_party_id,
            leading_margin
          )
          values ($1, $2, $3, $4, $5, $6)
          returning id
        `,
        [
          districtId,
          `TN-${String(constituencyNumber).padStart(3, "0")}`,
          constituencyNumber,
          `Constituency ${String(constituencyNumber).padStart(3, "0")}`,
          partyIds.get(PARTIES[constituencyNumber % PARTIES.length]) ?? null,
          1500 + constituencyNumber * 6
        ]
      );

      const constituencyId = constituencyResult.rows[0].id;
      const candidateIds = new Map<string, number>();

      for (const [partyIndex, party] of PARTIES.entries()) {
        const candidateResult = await pool.query<{ id: number }>(
          `
            insert into candidates(constituency_id, party_id, name)
            values ($1, $2, $3)
            returning id
          `,
          [constituencyId, partyIds.get(party), createCandidateName(party, constituencyNumber)]
        );

        candidateIds.set(party, candidateResult.rows[0].id);

        for (let roundNumber = 1; roundNumber <= ROUND_COUNT; roundNumber += 1) {
          let roundId: number;
          const existingRound = await pool.query<{ id: number }>(
            `
              insert into rounds(constituency_id, round_number)
              values ($1, $2)
              on conflict (constituency_id, round_number) do update
              set round_number = excluded.round_number
              returning id
            `,
            [constituencyId, roundNumber]
          );
          roundId = existingRound.rows[0].id;

          await pool.query(
            `
              insert into round_votes(round_id, candidate_id, votes)
              values ($1, $2, $3)
            `,
            [roundId, candidateIds.get(party), createRoundVotes(partyIndex, constituencyNumber, roundNumber)]
          );
        }
      }
    }

    await pool.query("commit");
  } catch (error) {
    await pool.query("rollback");
    throw error;
  } finally {
    await pool.end();
  }
}

seed().catch((error) => {
  console.error(error);
  process.exit(1);
});
