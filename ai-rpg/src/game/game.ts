import { CandidateId, deepClone, ICandidateTest, ICandidateTestFactory } from '@cool/genetics';
import {
  GameConfig,
  GameObjectType,
  GameResult,
  GameState,
  PlayerGameObject,
  PlayerMove,
} from '../interfaces/game.interface';
import { Player } from './player';
import { applyGameChangeToState, calculatePlayerVisible, createInitialState } from './game-state';

export class Game implements ICandidateTest {
  private _initialState?: Readonly<GameState>;
  private _currentState?: GameState;
  private _stateChangeTriggers: (Readonly<PlayerMove>)[] = [];

  constructor(
    private _config: GameConfig,
  ) {
  }

  public async runAsync(...players: Player[]): Promise<GameResult> {
    this._initialState = createInitialState(players, this._config);

    this._currentState = deepClone(this._initialState);

    let alivePlayers: Player[];

    let maxRuns = 1000;

    do {
      alivePlayers = this._currentState.gameObjects.filter(_ => _.type === GameObjectType.Player && (_ as PlayerGameObject).energy > 0).map(_ => players.find(player => player.id === _.id)!);

      for (const player of alivePlayers) {
        const nextMove = await player.getNextMoveAsync(calculatePlayerVisible(this._currentState!, player, this._config.playerVisibilityRadius));

        this._stateChangeTriggers.push(nextMove);

        this._currentState = applyGameChangeToState(this._currentState, nextMove);

        await wait(2);
      }
    } while (alivePlayers.length && ((maxRuns--) > 0));

    return {
      candidateRanks: this._currentState.playerScore.map(_ => {
        return {
          candidateId: <CandidateId>_.id,
          score: _.score,
        };
      }),
      initialState: this._initialState,
      stateChangeTriggers: this._stateChangeTriggers,
    };
  }
}

export class GameFactory implements ICandidateTestFactory {
  constructor(
    private _config: GameConfig,
  ) {

  }

  public async createCandidateTestAsync(): Promise<ICandidateTest> {
    return new Game(this._config);
  }
}

function wait(milliseconds: number): Promise<void> {
  return new Promise((res) => {
    setTimeout(() => {
      res();
    }, milliseconds);
  });
}