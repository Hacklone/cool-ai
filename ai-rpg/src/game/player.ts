import { CandidateId, ICandidate } from '@cool/genetics';
import { v4 as uuid } from 'uuid';
import {
  directionToNumber,
  GameFieldPosition,
  GameObjectType,
  PlayerMove,
  PlayerMoveType,
  PlayerVisible,
  positionEquals,
} from '../interfaces/game.interface';
import * as tf from '@tensorflow/tfjs';
import { PLAYER_VISIBILITY_RADIUS } from './game-state';

export const PLAYER_MODEL_INPUT_NODES = 4 + (PLAYER_VISIBILITY_RADIUS * PLAYER_VISIBILITY_RADIUS);
export const PLAYER_MODEL_OUTPUT_NODES = 3;

export class Player implements ICandidate {
  constructor(
    public model: tf.LayersModel,
  ) {
  }

  public id = <CandidateId>uuid();

  public async getNextMoveAsync(playerVisible: PlayerVisible): Promise<PlayerMove> {
    const inputTensor = tf.tensor([
      playerVisible.playerState.energy,
      playerVisible.playerState.position.row,
      playerVisible.playerState.position.column,
      directionToNumber(playerVisible.playerState.direction),
      ...this._generateVisibleFields(playerVisible),
    ] satisfies number[]);

    const prediction = <tf.Tensor<any>>this.model.predict(inputTensor);

    const predictionData = Array.from(await prediction.data());

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
        type: PlayerMoveType.TurnLeft,
      };
    }

    if (decision.index === 1) {
      return {
        type: PlayerMoveType.TurnRight,
      };
    }

    return {
      type: PlayerMoveType.MoveForward,
    };
  }

  private _generateVisibleFields(playerVisible: PlayerVisible): number[] {
    const result = [];

    for (let row = -2; row < 3; row++) {
      for (let column = -2; column < 3; column++) {
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