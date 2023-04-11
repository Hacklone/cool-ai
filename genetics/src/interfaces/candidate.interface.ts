import { ICandidateKnownCandidateTestState } from './candidate-test.interface';

export type CandidateId = string & { __CandidateId: string; };

export interface ICandidate {
  id: CandidateId;

  getNextMoveAsync(knownTestState: ICandidateKnownCandidateTestState): Promise<ICandidateMove>;

  dispose(): void;
}

export interface ISerializedCandidate {

}

export interface ICandidateMove {
  candidateId: CandidateId;
}

export interface ICandidateFactory {
  createRandomCandidateAsync(): Promise<ICandidate>;

  createCloneCandidateAsync(originalCandidate: ICandidate): Promise<ICandidate>;

  createCrossOverCandidateAsync(candidate1: ICandidate, candidate2: ICandidate): Promise<ICandidate>;

  createMutatedCandidateAsync(originalCandidate: ICandidate): Promise<ICandidate>;

  serializeCandidateAsync(candidate: ICandidate): Promise<ISerializedCandidate>;

  deserializeAsync(serializedData: ISerializedCandidate): Promise<ICandidate>;
}