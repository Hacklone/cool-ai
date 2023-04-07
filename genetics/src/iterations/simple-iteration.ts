import { IPopulationIteration, IPopulationIterationResult } from '../interfaces/population-iteration.interface';
import { ICandidateTestFactory } from '../interfaces/candidate-test.interface';
import { IPopulation } from '../interfaces/population.interface';

export class SimpleIteration implements IPopulationIteration {
  constructor(
    private _candidateTestFactory: ICandidateTestFactory,
  ) {
  }

  public async runAsync(population: IPopulation): Promise<IPopulationIterationResult> {
    const testResults = await Promise.all(population.candidates.map(async _ => {
      const test = await this._candidateTestFactory.createCandidateTestAsync();

      return await test.runAsync(_);
    }));

    return {
      candidateTestResults: testResults,
      candidateRanks: testResults.map(_ => {
        return {
          candidateId: _.candidateRanks[0]!.candidateId,
          fitness: _.candidateRanks[0]!.score,
        };
      }),
    };
  }

}