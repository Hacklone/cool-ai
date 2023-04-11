import { ICandidateKnownCandidateTestState } from './candidate-test.interface';

export type CandidateId = string & { __CandidateId: string; };

export enum CandidateSource {
  Mutation = 'mutation',
  CrossOver = 'cross-over',
  Clone = 'clone',
  Random = 'random',
}

export function candidateSourceToRank(source: CandidateSource | undefined): number {
  switch (source) {
    case CandidateSource.Mutation:
      return 4;

    case CandidateSource.CrossOver:
      return 3;

    case CandidateSource.Clone:
      return 2;

    case CandidateSource.Random:
      return 1;

    default:
      return 0;
  }
}

export interface ICandidate {
  id: CandidateId;

  parentIds: CandidateId[];

  source: CandidateSource | undefined;

  getNextMoveAsync(knownTestState: ICandidateKnownCandidateTestState): Promise<ICandidateMove>;

  dispose(): void;
}

export interface ISerializedCandidate {
  id: CandidateId;

  parentIds: CandidateId[];

  source: CandidateSource | undefined;
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