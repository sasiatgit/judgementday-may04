import { notFound } from "next/navigation";
import { FiltersBar } from "@/components/filters-bar";
import { Pagination } from "@/components/pagination";
import { ResultsTable } from "@/components/results-table";
import { RoundDetails } from "@/components/round-details";
import {
  loadDashboardData,
  parseDistrictSearchParam,
  parsePageSearchParam
} from "@/lib/data";

type PageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export const dynamic = "force-dynamic";

export default async function Home({ searchParams }: PageProps) {
  const resolvedSearchParams = (await searchParams) ?? {};
  const selectedDistricts = parseDistrictSearchParam(resolvedSearchParams.districts);
  const currentPage = parsePageSearchParam(resolvedSearchParams.page);
  const result = await loadDashboardData({
    page: currentPage,
    pageSize: 50,
    districtIds: selectedDistricts
  });

  if (!result.ok) {
    return (
      <main className="page-shell">
        <section className="hero-card">
          <div>
            <p className="eyebrow">Tamil Nadu Assembly Election 2026</p>
            <h1>Election dashboard is ready. Database setup is the only missing step.</h1>
            <p className="hero-copy">
              The app is running correctly, but PostgreSQL is not connected yet.
              Configure your connection string and seed the election data to load the
              `38 districts`, `234 constituencies`, and `16 rounds` dashboard.
            </p>
          </div>
          <div className="hero-stats">
            <div className="stat-card">
              <span>Status</span>
              <strong>Waiting for DB</strong>
            </div>
            <div className="stat-card">
              <span>Reason</span>
              <strong>{result.reason === "missing_database_url" ? "Missing .env" : "DB unavailable"}</strong>
            </div>
          </div>
        </section>

        <section className="results-card">
          <div className="section-head">
            <div>
              <h2>Setup required</h2>
              <p>{result.message}</p>
            </div>
          </div>
          <div className="empty-state">
            <p>
              1. Create a `.env` file with `DATABASE_URL=postgres://...`
            </p>
            <p>2. Run `npm run db:seed`</p>
            <p>3. Run `npm run dev`</p>
          </div>
        </section>
      </main>
    );
  }

  const { dashboard } = result;

  if (dashboard.totalConstituencies > 0 && currentPage > dashboard.totalPages) {
    notFound();
  }

  return (
    <main className="page-shell">
      <section className="hero-card">
        <div>
          <p className="eyebrow">Tamil Nadu Assembly Election 2026</p>
          <h1>Counting dashboard with district filters, party candidates, and 16 round totals</h1>
          <p className="hero-copy">
            Server-rendered Next.js dashboard backed by PostgreSQL. Filter districts on top,
            browse 234 constituencies below, and inspect round-wise votes for each party candidate.
          </p>
        </div>
        <div className="hero-stats">
          <div className="stat-card">
            <span>Districts</span>
            <strong>{dashboard.availableDistricts.length}</strong>
          </div>
          <div className="stat-card">
            <span>Constituencies</span>
            <strong>{dashboard.totalConstituencies}</strong>
          </div>
          <div className="stat-card">
            <span>Rounds</span>
            <strong>16</strong>
          </div>
        </div>
      </section>

      <FiltersBar
        districts={dashboard.availableDistricts}
        selectedDistrictIds={dashboard.selectedDistrictIds}
      />

      <section className="content-stack">
        <ResultsTable constituencies={dashboard.constituencies} />
        <Pagination
          currentPage={dashboard.currentPage}
          totalPages={dashboard.totalPages}
          selectedDistrictIds={dashboard.selectedDistrictIds}
        />
        <RoundDetails constituencies={dashboard.constituencies} />
      </section>
    </main>
  );
}
