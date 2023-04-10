import { CandidateId, ICandidate } from './candidate.interface';

export interface ICandidateTest {
  runAsync(...candidates: ICandidate[]): Promise<ICandidateTestResult>;
}

export interface ICandidateTestResult {
  candidateRanks: { score: number; candidateId: CandidateId; }[];
}

export interface ICandidateTestFactory {
  createCandidateTestAsync(): Promise<ICandidateTest>;
}

export interface ICandidateKnownCandidateTestState {

}