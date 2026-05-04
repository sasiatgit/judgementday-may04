import type { ConstituencyResult } from "@/lib/types";

type RoundDetailsProps = {
  constituencies: ConstituencyResult[];
};

const PARTY_ORDER = ["ADMK", "DMK", "TVK", "NTK", "Others"];

export function RoundDetails({ constituencies }: RoundDetailsProps) {
  return (
    <section className="rounds-card">
      <div className="section-head">
        <div>
          <h2>Round-wise counting details</h2>
          <p>Each constituency includes votes for every candidate from rounds 1 to 16.</p>
        </div>
      </div>

      {constituencies.length === 0 ? (
        <div className="empty-state">Round-wise details will appear here once a constituency matches.</div>
      ) : (
        <div className="rounds-grid">
          {constituencies.map((constituency) => (
            <article className="round-card" key={constituency.id}>
              <h3>
                {constituency.constituencyNumber}. {constituency.name}
              </h3>
              <p className="round-meta">{constituency.districtName}</p>
              <div className="table-wrap">
                <table className="rounds-table">
                  <thead>
                    <tr>
                      <th>Round</th>
                      {PARTY_ORDER.map((party) => (
                        <th key={party}>{party}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {constituency.rounds.map((round) => (
                      <tr key={round.roundNumber}>
                        <td>
                          <strong>Round {round.roundNumber}</strong>
                        </td>
                        {PARTY_ORDER.map((party) => {
                          const partyRound = round.partyRounds[party];

                          return (
                            <td key={party} className="round-entry">
                              <strong>{partyRound?.votes.toLocaleString("en-IN") ?? 0}</strong>
                              <span>{partyRound?.candidateName ?? "Not assigned"}</span>
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
