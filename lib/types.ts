export type DistrictRecord = {
  id: number;
  name: string;
};

export type DashboardQueryOptions = {
  districtIds: number[];
  page: number;
  pageSize: number;
};

export type PartyResult = {
  candidateName: string;
  totalVotes: number;
};

export type PartyRound = {
  candidateName: string;
  votes: number;
};

export type RoundResult = {
  roundNumber: number;
  partyRounds: Record<string, PartyRound>;
};

export type ConstituencyResult = {
  id: number;
  code: string;
  constituencyNumber: number;
  name: string;
  districtName: string;
  partyResults: Record<string, PartyResult>;
  rounds: RoundResult[];
  leadingParty: string | null;
  leadingMargin: number | null;
};

export type DashboardData = {
  availableDistricts: DistrictRecord[];
  selectedDistrictIds: number[];
  constituencies: ConstituencyResult[];
  totalConstituencies: number;
  currentPage: number;
  totalPages: number;
};

export type DashboardLoadResult =
  | {
      ok: true;
      dashboard: DashboardData;
    }
  | {
      ok: false;
      reason: "missing_database_url" | "database_unavailable";
      message: string;
    };
