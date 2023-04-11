import { ICandidate, ISerializedCandidate } from './candidate.interface';
import { IPopulationIterationResult } from './population-iteration.interface';

export type PopulationId = string & { __PopulationId: string; };

export interface IPopulation {
  id: PopulationId;

  index: number;

  candidates: ICandidate[];
}

export interface ISerializedPopulation {
  id: PopulationId;

  index: number;

  candidates: ISerializedCandidate[];
}

export interface IPopulationFactory {
  createInitialPopulationAsync(): Promise<IPopulation>;

  createNextPopulationAsync(previousPopulation: IPopulation, iterationResult: IPopulationIterationResult): Promise<IPopulation>;

  serializePopulationAsync(population: IPopulation): Promise<ISerializedPopulation>;

  deserializePopulationAsync(serializedData: ISerializedPopulation): Promise<IPopulation>;
}