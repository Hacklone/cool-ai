import { IPopulation, IPopulationFactory } from '../interfaces/population.interface';
import { IPopulationIterationFactory } from '../interfaces/population-iteration.interface';
import { IGeneticsHistoryEntry } from '../interfaces/genetics.interface';

export class GeneticsRunner {
  private _initialPopulation?: IPopulation;
  private _history: IGeneticsHistoryEntry[] = [];

  constructor(
    private _populationFactory: IPopulationFactory,
    private _populationIterationFactory: IPopulationIterationFactory,
  ) {
  }

  public setInitialPopulationAsync(population: IPopulation) {
    this._history = [];

    this._initialPopulation = population;
  }

  public async runNextPopulationAsync(): Promise<IGeneticsHistoryEntry> {
    const lastHistoryEntry = this._history.at(-1);

    let population: IPopulation;

    if (!lastHistoryEntry) {
      population = this._initialPopulation ?? await this._populationFactory.createInitialPopulationAsync();
    } else {
      population = await this._populationFactory.createNextPopulationAsync(lastHistoryEntry.population, lastHistoryEntry.populationIterationResult);
    }

    const populationIteration = await this._populationIterationFactory.createPopulationIterationAsync();

    const populationIterationResult = await populationIteration.runAsync(population);

    const historyEntry: IGeneticsHistoryEntry = {
      population: population,
      populationIterationResult: populationIterationResult,
    };

    this._history.push(historyEntry);

    return historyEntry;
  }
}