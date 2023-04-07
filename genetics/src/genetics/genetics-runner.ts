import { IPopulation, IPopulationFactory } from '../interfaces/population.interface';
import { IPopulationIterationFactory } from '../interfaces/population-iteration.interface';
import { IGeneticsHistoryEntry } from '../interfaces/genetics.interface';

export abstract class GeneticsRunner {
  private _history: IGeneticsHistoryEntry[] = [];

  protected constructor(
    private _populationFactory: IPopulationFactory,
    private _populationIterationFactory: IPopulationIterationFactory,
  ) {
  }


  public async runNextPopulationAsync(): Promise<IGeneticsHistoryEntry> {
    const lastHistoryEntry = this._history.at(-1);

    let population: IPopulation;

    if (!lastHistoryEntry) {
      population = await this._populationFactory.createInitialPopulationAsync();
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