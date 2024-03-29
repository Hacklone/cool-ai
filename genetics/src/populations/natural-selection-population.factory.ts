import {
  IPopulation,
  IPopulationFactory,
  ISerializedPopulation,
  PopulationId,
} from '../interfaces/population.interface';
import { IPopulationIterationResult } from '../interfaces/population-iteration.interface';
import { candidateSourceToRank, ICandidate, ICandidateFactory } from '../interfaces/candidate.interface';
import { createArrayWithLength } from '../utils/array.utils';
import { v4 as uuid } from 'uuid';
import { chunk } from 'lodash';

export class NaturalSelectionPopulationFactory implements IPopulationFactory {
  private readonly _populationCount: number;

  constructor(
    private _candidateFactory: ICandidateFactory,
    public readonly configuration: {
      cloneCount: number,
      crossoverCount: number,
      mutationCount: number,
      randomCount: number,
    } = {
      cloneCount: 2,
      crossoverCount: 2,
      mutationCount: 2,
      randomCount: 2,
    },
  ) {
    this._populationCount = this.configuration.cloneCount + this.configuration.crossoverCount + this.configuration.mutationCount + this.configuration.randomCount;
  }

  public async createInitialPopulationAsync(): Promise<IPopulation> {
    return {
      id: <PopulationId>uuid(),
      index: 0,
      candidates: await this.createRandomCandidatesAsync(this._populationCount),
    };
  }

  public async createNextPopulationAsync(
    previousPopulation: IPopulation,
    iterationResult: IPopulationIterationResult,
  ): Promise<IPopulation> {
    const rankedCandidates = sortCandidatesForNaturalSelectionAsync(previousPopulation, iterationResult);

    const clonedCandidates = await Promise.all(rankedCandidates.slice(0, this.configuration.cloneCount).map(_ => this._candidateFactory.createCloneCandidateAsync(_)));
    const crossedCandidates = await Promise.all(chunk(rankedCandidates, 2).filter(_ => _.length >= 2).map(([a, b]) => this._candidateFactory.createCrossOverCandidateAsync(a!, b!)));
    const mutatedCandidates = await Promise.all(rankedCandidates.slice(0, this.configuration.mutationCount).map(_ => this._candidateFactory.createMutatedCandidateAsync(_)));
    const randomCandidates = await this.createRandomCandidatesAsync(this.configuration.randomCount);

    const newPopulation: IPopulation = {
      id: <PopulationId>uuid(),
      index: previousPopulation.index + 1,
      candidates: [
        ...mutatedCandidates,
        ...crossedCandidates,
        ...clonedCandidates,
        ...randomCandidates,
      ],
    };

    if (newPopulation.candidates.length < this._populationCount) {
      newPopulation.candidates.push(...(await this.createRandomCandidatesAsync(this._populationCount - newPopulation.candidates.length)));
    }

    for (const candidate of previousPopulation.candidates) {
      candidate.dispose();
    }

    return newPopulation;
  }

  private async createRandomCandidatesAsync(count: number): Promise<ICandidate[]> {
    return await Promise.all(createArrayWithLength(count).map(() => {
      return this._candidateFactory.createRandomCandidateAsync();
    }));
  }

  public async serializePopulationAsync(population: IPopulation): Promise<ISerializedPopulation> {
    return {
      id: population.id,
      index: population.index,
      candidates: await Promise.all(population.candidates.map(_ => this._candidateFactory.serializeCandidateAsync(_))),
    };
  }

  public async deserializePopulationAsync(serializedData: ISerializedPopulation): Promise<IPopulation> {
    return {
      id: serializedData.id,
      index: serializedData.index,
      candidates: await Promise.all(serializedData.candidates.map(_ => this._candidateFactory.deserializeAsync(_))),
    };
  }
}

export function sortCandidatesForNaturalSelectionAsync(
  previousPopulation: IPopulation,
  iterationResult: IPopulationIterationResult,
): ICandidate[] {
  return iterationResult.candidateRanks
    .map(_ => {
      return {
        candidate: previousPopulation.candidates.find(candidate => candidate.id === _.candidateId)!,
        fitness: _.fitness,
      };
    })
    .sort((a, b) => candidateSourceToRank(b.candidate.source) - candidateSourceToRank(a.candidate.source))
    .sort((a, b) => b.fitness - a.fitness)
    .map(_ => _.candidate);
}