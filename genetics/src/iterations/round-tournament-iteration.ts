import {
  IPopulationIteration,
  IPopulationIterationFactory,
  IPopulationIterationResult,
} from '../interfaces/population-iteration.interface';
import { IPopulation } from '../interfaces/population.interface';
import { CandidateId, ICandidate } from '../interfaces/candidate.interface';
import {
  ICandidateTestConfig,
  ICandidateTestFactory,
  ICandidateTestResult,
} from '../interfaces/candidate-test.interface';

export class RoundTournamentIteration implements IPopulationIteration {
  constructor(
    private _candidateTestFactory: ICandidateTestFactory,
  ) {
  }

  public async runAsync(population: IPopulation): Promise<IPopulationIterationResult> {
    const candidates = Array.from(population.candidates);

    candidates.sort(() => Math.random());

    const iterationPairs: {
      candidate1: ICandidate;
      candidate2: ICandidate;
    }[] = [];

    for (let i = 0; i < candidates.length; i++) {
      for (let j = (i + 1); j < candidates.length; j++) {
        iterationPairs.push({
          candidate1: candidates[i]!,
          candidate2: candidates[j]!,
        });
      }
    }

    const testConfig = await this._candidateTestFactory.createCandidateTestConfigAsync(population.id);

    const testResults = await Promise.all(iterationPairs.map(pair => this.runTestOnPairAsync(testConfig, pair.candidate1, pair.candidate2)));

    const candidatePoints = new Map<CandidateId, {
      fitness: number;
      candidateId: CandidateId;
    }>(candidates.map(_ => [_.id, {
      candidateId: _.id,
      fitness: 0,
    }]));

    for (const result of testResults) {
      result!.candidateRanks.forEach(_ => {
        candidatePoints.get(_.candidateId)!.fitness += _.score;
      });
    }

    const candidateRanks = Array.from(candidatePoints.values());

    candidateRanks.sort((a, b) => b.fitness - a.fitness);

    return {
      candidateTestResults: testResults,
      candidateRanks: candidateRanks,
    };
  }

  private async runTestOnPairAsync(testConfig: ICandidateTestConfig, candidate1: ICandidate, candidate2: ICandidate): Promise<ICandidateTestResult> {
    const iteration = await this._candidateTestFactory.createCandidateTestAsync(testConfig);

    return await iteration.runAsync(candidate1, candidate2);
  }
}

export class RoundTournamentIterationFactory implements IPopulationIterationFactory {
  constructor(
    private _candidateTestFactory: ICandidateTestFactory,
  ) {
  }

  public async createPopulationIterationAsync(): Promise<IPopulationIteration> {
    return new RoundTournamentIteration(this._candidateTestFactory);
  }
}