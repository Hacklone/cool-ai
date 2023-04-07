import { IPopulation } from './population.interface';
import { IPopulationIterationResult } from './population-iteration.interface';

export interface IGeneticsHistoryEntry {
  population: IPopulation;
  populationIterationResult: IPopulationIterationResult;
}