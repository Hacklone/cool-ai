import { CandidateId, ICandidate } from './candidate.interface';

export interface ICandidateTest {
  runAsync(...candidates: ICandidate[]): Promise<ICandidateTestResult>;
}

export interface ICandidateTestConfig {

}

export interface ICandidateTestResult {
  candidateRanks: { score: number; candidateId: CandidateId; }[];
}

export interface ICandidateTestFactory {
  createCandidateTestConfigAsync(): Promise<ICandidateTestConfig>;

  createCandidateTestAsync(testConfig: ICandidateTestConfig): Promise<ICandidateTest>;
}

export interface ICandidateKnownCandidateTestState {

}