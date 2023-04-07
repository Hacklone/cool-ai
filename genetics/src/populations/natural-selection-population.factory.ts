import { IPopulation, IPopulationFactory, PopulationId } from '../interfaces/population.interface';
import { IPopulationIterationResult } from '../interfaces/population-iteration.interface';
import { ICandidate, ICandidateFactory } from '../interfaces/candidate.interface';
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
      candidates: await this.createRandomCandidatesAsync(this._populationCount),
    };
  }

  public async createNextPopulationAsync(
    previousPopulation: IPopulation,
    iterationResult: IPopulationIterationResult,
  ): Promise<IPopulation> {
    const rankedCandidates = iterationResult.candidateRanks.sort((a, b) => b.fitness - a.fitness).map(_ => previousPopulation.candidates.find(__ => _.candidateId === _.candidateId)!);

    const clonedCandidates = await Promise.all(rankedCandidates.slice(0, this.configuration.cloneCount).map(_ => this._candidateFactory.createCloneCandidateAsync(_)));
    const crossedCandidates = await Promise.all(chunk(rankedCandidates, 2).filter(_ => _.length >= 2).map(([a, b]) => this._candidateFactory.createCrossOverCandidateAsync(a!, b!)));
    const mutatedCandidates = await Promise.all(rankedCandidates.slice(0, this.configuration.mutationCount).map(_ => this._candidateFactory.createMutatedCandidateAsync(_)));
    const randomCandidates = await this.createRandomCandidatesAsync(this.configuration.randomCount);

    const newPopulation: IPopulation = {
      id: <PopulationId>uuid(),
      candidates: [
        ...clonedCandidates,
        ...crossedCandidates,
        ...mutatedCandidates,
        ...randomCandidates,
      ],
    };

    if (newPopulation.candidates.length < this._populationCount) {
      newPopulation.candidates.push(...(await this.createRandomCandidatesAsync(this._populationCount - newPopulation.candidates.length)));
    }

    return newPopulation;
  }

  private async createRandomCandidatesAsync(count: number): Promise<ICandidate[]> {
    return await Promise.all(createArrayWithLength(count).map(() => {
      return this._candidateFactory.createRandomCandidateAsync();
    }));
  }
}