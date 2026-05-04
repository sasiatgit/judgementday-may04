import type { ConstituencyResult } from "@/lib/types";

type ResultsTableProps = {
  constituencies: ConstituencyResult[];
};

const PARTY_ORDER = ["ADMK", "DMK", "TVK", "NTK", "Others"];

export function ResultsTable({ constituencies }: ResultsTableProps) {
  return (
    <section className="results-card">
      <div className="section-head">
        <div>
          <h2>Constituency summary</h2>
          <p>Party columns show candidate names and total votes across all 16 rounds.</p>
        </div>
      </div>

      {constituencies.length === 0 ? (
        <div className="empty-state">No constituencies match the selected district filters.</div>
      ) : (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>#</th>
                <th>District</th>
                <th>Constituency</th>
                {PARTY_ORDER.map((party) => (
                  <th key={party}>{party}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {constituencies.map((constituency) => (
                <tr key={constituency.id}>
                  <td>{constituency.constituencyNumber}</td>
                  <td>
                    <strong>{constituency.districtName}</strong>
                    <span className="meta-copy">{constituency.code}</span>
                  </td>
                  <td>
                    <strong>{constituency.name}</strong>
                    <span className="meta-copy">
                      Leader: {constituency.leadingParty ?? "TBD"} | Margin:{" "}
                      {constituency.leadingMargin?.toLocaleString("en-IN") ?? 0}
                    </span>
                  </td>
                  {PARTY_ORDER.map((party) => {
                    const candidate = constituency.partyResults[party];

                    return (
                      <td key={party} className="party-cell">
                        <strong>{candidate?.candidateName ?? "Not assigned"}</strong>
                        <span>Total votes: {(candidate?.totalVotes ?? 0).toLocaleString("en-IN")}</span>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
