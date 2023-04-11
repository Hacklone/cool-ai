import { CandidateId, CandidateSource, createArrayWithLength, ICandidate } from '@cool/genetics';
import { v4 as uuid } from 'uuid';
import {
  directionToNumber,
  GameConfig,
  GameFieldPosition,
  GameObjectType,
  PlayerConfig,
  PlayerMove,
  PlayerMoveType,
  PlayerVisible,
  positionEquals,
} from '../interfaces/game.interface';
import * as tf from '@tensorflow/tfjs';

type PlayerInput = number[];

export class Player implements ICandidate {
  private readonly _memory!: PlayerInput[];

  constructor(
    public model: tf.LayersModel,
    public parentIds: CandidateId[],
    public source: CandidateSource | undefined,
    private _gameConfig: GameConfig,
    private _playerConfig: PlayerConfig,
  ) {
    this._memory = createArrayWithLength(this._playerConfig.memoryLength)
      .map(() => <PlayerInput>(createArrayWithLength(this._playerConfig.inputNodeCount).map(() => -1)));
  }

  public id = <CandidateId>uuid();

  public get visibilityRadius() {
    return this._playerConfig.visibilityRadius;
  }

  public dispose() {
    this.model.dispose();
  }

  public async getNextMoveAsync(playerVisible: PlayerVisible): Promise<PlayerMove> {
    const input: PlayerInput = [
      playerVisible.playerState.energy,
      playerVisible.playerState.position.row,
      playerVisible.playerState.position.column,
      directionToNumber(playerVisible.playerState.direction),
      ...this._generateVisibleFields(playerVisible),
    ];

    const inputTensor = tf.tensor2d([
      ...this._memory.slice(-1 * this._playerConfig.memoryLength),
      input,
    ], [this._playerConfig.memoryLength + 1, this._playerConfig.inputNodeCount]);

    const prediction = <tf.Tensor<any>>this.model.predict(inputTensor);

    const predictionData = Array.from(await prediction.data());

    this._memory.push(input);

    prediction.dispose();
    inputTensor.dispose();

    const decision = predictionData.reduce((res, item, index) => {
      if (item > res.value) {
        return {
          index: index,
          value: item,
        };
      }

      return res;
    }, { index: -1, value: -1 });

    if (decision.index <= 0) {
      return {
        candidateId: <CandidateId>this.id,
        type: PlayerMoveType.TurnLeft,
      };
    }

    if (decision.index === 1) {
      return {
        candidateId: <CandidateId>this.id,
        type: PlayerMoveType.TurnRight,
      };
    }

    return {
      candidateId: <CandidateId>this.id,
      type: PlayerMoveType.MoveForward,
    };
  }

  private _generateVisibleFields(playerVisible: PlayerVisible): number[] {
    const result = [];

    for (let row = (-1 * this._playerConfig.visibilityRadius); row < (this._playerConfig.visibilityRadius + 1); row++) {
      for (let column = (-1 * this._playerConfig.visibilityRadius); column < (this._playerConfig.visibilityRadius + 1); column++) {
        const position: GameFieldPosition = {
          row: playerVisible.playerState.position.row + row,
          column: playerVisible.playerState.position.column + column,
        };

        const objectAtPosition = playerVisible.visibleFieldObjects.find(_ => positionEquals(_.position, position));

        switch (objectAtPosition?.type) {
          case GameObjectType.Wall:
            result.push(1);
            break;
          case GameObjectType.Player:
            result.push(2);
            break;
          case GameObjectType.Food:
            result.push(3);
            break;
          case undefined:
            result.push(0);
            break;

          default:
            throw new Error(`Unhandled object type: ${ objectAtPosition?.type }`);
        }
      }
    }

    return result;
  }
}