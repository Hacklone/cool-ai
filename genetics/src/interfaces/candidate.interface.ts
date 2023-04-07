import { ICandidateKnownCandidateTestState } from './candidate-test.interface';

export type CandidateId = string & { __CandidateId: string; };

export interface ICandidate {
  id: CandidateId;

  getNextMoveAsync(knownTestState: ICandidateKnownCandidateTestState): Promise<ICandidateMove>;
}

export interface ICandidateMove {

}

export interface ICandidateFactory {
  createRandomCandidateAsync(): Promise<ICandidate>;

  createCloneCandidateAsync(originalCandidate: ICandidate): Promise<ICandidate>;

  createCrossOverCandidateAsync(candidate1: ICandidate, candidate2: ICandidate): Promise<ICandidate>;

  createMutatedCandidateAsync(originalCandidate: ICandidate): Promise<ICandidate>;
}