import { IPopulationIteration, IPopulationIterationResult } from '../interfaces/population-iteration.interface';
import { IPopulation } from '../interfaces/population.interface';
import { CandidateId, ICandidate } from '../interfaces/candidate.interface';
import { ICandidateTestFactory, ICandidateTestResult } from '../interfaces/candidate-test.interface';

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

    const testResults = await Promise.all(iterationPairs.map(pair => this.runTestOnPairAsync(pair.candidate1, pair.candidate2)));

    const candidatePoints = new Map<CandidateId, {
      fitness: number;
      candidateId: CandidateId;
    }>(candidates.map(_ => [_.id, {
      candidateId: _.id,
      fitness: 0,
    }]));

    for (const result of testResults) {
      result!.candidateRanks.sort((a, b) => b.score - a.score);

      const winningCandidateId = result!.candidateRanks.at(0)?.candidateId;

      if (winningCandidateId) {
        candidatePoints.get(winningCandidateId)!.fitness += 1;
      }
    }

    const candidateRanks = Array.from(candidatePoints.values());

    candidateRanks.sort((a, b) => b.fitness - a.fitness);

    return {
      candidateTestResults: testResults,
      candidateRanks: candidateRanks,
    };
  }

  private async runTestOnPairAsync(candidate1: ICandidate, candidate2: ICandidate): Promise<ICandidateTestResult> {
    const iteration = await this._candidateTestFactory.createCandidateTestAsync();

    return await iteration.runAsync(candidate1, candidate2);
  }
}