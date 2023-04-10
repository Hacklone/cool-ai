import { CandidateId, deepClone, ICandidateTest } from '@cool/genetics';
import { GameObjectType, GameResult, GameState, PlayerGameObject, PlayerMove } from '../interfaces/game.interface';
import { Player } from './player';
import { applyGameChangeToState, calculatePlayerVisible, createInitialState } from './game-state';

export class Game implements ICandidateTest {
  private _initialState?: Readonly<GameState>;
  private _currentState?: GameState;
  private _stateChangeTriggers: (Readonly<PlayerMove>)[] = [];

  public async runAsync(...players: Player[]): Promise<GameResult> {
    this._initialState = createInitialState(players);

    this._currentState = deepClone(this._initialState);

    let alivePlayers: Player[];

    do {
      alivePlayers = this._currentState.gameObjects.filter(_ => _.type === GameObjectType.Player && (_ as PlayerGameObject).energy > 0).map(_ => players.find(player => player.id === _.id)!);

      for (const player of alivePlayers) {
        const nextMove = await player.getNextMoveAsync(calculatePlayerVisible(this._currentState!, player));

        this._stateChangeTriggers.push(nextMove);

        this._currentState = applyGameChangeToState(this._currentState, player, nextMove);
      }
    } while (alivePlayers.length);

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