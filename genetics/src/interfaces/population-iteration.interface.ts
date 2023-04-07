import { CandidateId } from './candidate.interface';
import { IPopulation } from './population.interface';
import { ICandidateTestResult } from './candidate-test.interface';

export interface IPopulationIteration {
  runAsync(population: IPopulation): Promise<IPopulationIterationResult>;
}

export interface IPopulationIterationResult {
  candidateRanks: { fitness: number; candidateId: CandidateId; }[];

  candidateTestResults: ICandidateTestResult[];
}

export interface IPopulationIterationFactory {
  createPopulationIterationAsync(): Promise<IPopulationIteration>;
}

