import { ICandidate } from './candidate.interface';
import { IPopulationIterationResult } from './population-iteration.interface';

export type PopulationId = string & { __PopulationId: string; };

export interface IPopulation {
  id: PopulationId;

  candidates: ICandidate[];
}

export interface IPopulationFactory {
  createInitialPopulationAsync(): Promise<IPopulation>;

  createNextPopulationAsync(previousPopulation: IPopulation, iterationResult: IPopulationIterationResult): Promise<IPopulation>;
}