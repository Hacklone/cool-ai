import { CandidateId, ICandidate } from './candidate.interface';

export interface ICandidateTest {
  runAsync(...candidates: ICandidate[]): Promise<ICandidateTestResult>;
}

export interface ICandidateTestResult {
  history: ICandidateTestHistoryEntry[];
  candidateRanks: { score: number; candidateId: CandidateId; }[];
}

export interface ICandidateTestHistoryEntry {

}

export interface ICandidateTestFactory {
  createCandidateTestAsync(): Promise<ICandidateTest>;
}

export interface ICandidateKnownCandidateTestState {

}