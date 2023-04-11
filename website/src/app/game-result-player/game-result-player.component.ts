import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  Input,
  OnChanges,
  OnInit,
  SimpleChanges,
} from '@angular/core';
import {
  applyGameChangeToState,
  GameObjectType,
  GameResult,
  GameState,
  PlayerGameObject,
  PlayerMove,
} from '@cool/ai-rpg';

@Component({
  selector: 'app-game-result-player',
  templateUrl: './game-result-player.component.html',
  styleUrls: ['./game-result-player.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GameResultPlayerComponent implements OnInit, OnChanges {
  private _currentChangeIndex = -1;

  constructor(
    private _changeDetector: ChangeDetectorRef,
  ) {
  }

  @Input()
  public gameResult!: GameResult;

  protected currentGameState?: GameState;
  protected previousGameState?: GameState;

  protected isPlaying = false;

  protected get currentPlayerMove(): PlayerMove | undefined {
    return this.gameResult.stateChangeTriggers[this._currentChangeIndex];
  }

  protected get currentPlayers(): PlayerGameObject[] {
    return <PlayerGameObject[]>this.currentGameState?.gameObjects?.filter(_ => _.type === GameObjectType.Player) ?? [];
  }

  public ngOnInit(): void {
    this._reset();
  }

  public ngOnChanges(changes: SimpleChanges): void {
    this._reset();
  }

  public playStates() {
    this.isPlaying = true;

    this._keepPlayingStates();
  }

  private _keepPlayingStates() {
    if (!this.isPlaying) {
      return;
    }

    this.isPlaying = true;

    this.nextState();

    setTimeout(() => {
      this._keepPlayingStates();
    }, 500);
  }

  public stopPlayingStates() {
    this.isPlaying = false;

    this._changeDetector.markForCheck();
  }

  public previousState() {
    if (!this.previousGameState || this._currentChangeIndex <= 0) {
      return;
    }

    this.currentGameState = this.previousGameState;
    this._currentChangeIndex--;

    this._changeDetector.markForCheck();
  }

  public nextState() {
    if (!this.currentGameState || this._currentChangeIndex >= (this.gameResult.stateChangeTriggers.length - 1)) {
      this.stopPlayingStates();

      return;
    }

    this.previousGameState = this.currentGameState;
    this._currentChangeIndex++;

    const changeTrigger = this.gameResult.stateChangeTriggers[this._currentChangeIndex];

    this.currentGameState = applyGameChangeToState(this.currentGameState, changeTrigger);

    this._changeDetector.markForCheck();
  }

  private _reset() {
    this._currentChangeIndex = -1;

    this.previousGameState = undefined;
    this.currentGameState = this.gameResult.initialState;
  }
}
