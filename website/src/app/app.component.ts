import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit } from '@angular/core';
import {
  CandidateId,
  GeneticsRunner,
  IGeneticsHistoryEntry,
  IPopulation,
  NaturalSelectionPopulationFactory,
  SimpleIterationFactory,
  sortCandidatesForNaturalSelectionAsync,
} from '@cool/genetics';
import { GameConfig, GameFactory, GameResult, PlayerConfig, PlayerFactory } from '@cool/ai-rpg';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppComponent implements OnInit {
  private _gameConfig: GameConfig = {
    columnCount: 20,
    rowCount: 20,
    initialFoodCount: 10,
  };

  private _populationFactory = new NaturalSelectionPopulationFactory(
    new PlayerFactory(
      this._gameConfig,
      new PlayerConfig(
        5,
        5,
      ),
      {
        mutationRate: 0.05,
        maxMutationPower: 0.1,
      },
    ),
    {
      cloneCount: 2,
      crossoverCount: 2,
      mutationCount: 6,
      randomCount: 2,
    },
  );

  private _gameFactory = new GameFactory(
    this._gameConfig,
  );

  private _geneticsRunner = new GeneticsRunner(
    this._populationFactory,
    new SimpleIterationFactory(this._gameFactory),
  );

  constructor(
    private _changeDetector: ChangeDetectorRef,
  ) {
  }

  protected currentPopulation?: IGeneticsHistoryEntry;

  protected currentlyPlayingGameResult?: GameResult;

  protected runningStopped: boolean = true;

  public async ngOnInit() {
    await this.runNextPopulationAsync();
  }

  public async stopRunningAsync() {
    this.runningStopped = true;
  }

  public async runContinuouslyAsync() {
    this.runningStopped = false;

    let maxRuns = 500;

    while (!this.runningStopped && (maxRuns--) > 0) {
      await this.runNextPopulationAsync();
    }

    this.runningStopped = true;

    this._changeDetector.markForCheck();
  }

  public async changeGameMapAsync() {
    await this._gameFactory.changeGameMapAsync();
  }

  public async runNextPopulationAsync() {
    this.currentPopulation = await this._geneticsRunner.runNextPopulationAsync();

    this.currentPopulation.population.candidates = sortCandidatesForNaturalSelectionAsync(
      this.currentPopulation.population,
      this.currentPopulation.populationIterationResult,
    );

    this._changeDetector.markForCheck();
  }

  public getFitnessOfCandidate(candidateId: CandidateId): number {
    if (!this.currentPopulation || !this.currentPopulation.populationIterationResult) {
      return 0;
    }

    return this.currentPopulation.populationIterationResult.candidateRanks.find(_ => _.candidateId === candidateId)!.fitness;
  }

  public playCandidateTestAsync(candidateId: CandidateId) {
    if (!this.currentPopulation || !this.currentPopulation.populationIterationResult) {
      return;
    }

    this.currentlyPlayingGameResult = this.currentPopulation.populationIterationResult.candidateTestResults.find(_ => _.candidateRanks.some(__ => __.candidateId === candidateId))! as GameResult;
  }

  public async savePopulationAsync() {
    if (!this.currentPopulation) {
      return;
    }

    const serializedPopulation = await this._populationFactory.serializePopulationAsync(this.currentPopulation.population);

    serializedPopulation.candidates = serializedPopulation.candidates.slice(0, 10);

    localStorage.setItem(POPULATION_STORAGE_KEY, JSON.stringify(
      serializedPopulation,
    ));

    confirm('Successful save');
  }

  public async restorePopulationAsync() {
    const storageValue = localStorage.getItem(POPULATION_STORAGE_KEY);

    if (!storageValue) {
      return;
    }

    this._geneticsRunner.setInitialPopulationAsync(
      await this._populationFactory.deserializePopulationAsync(<IPopulation>JSON.parse(storageValue)),
    );

    await this.runNextPopulationAsync();
  }
}

export const POPULATION_STORAGE_KEY = 'population';
