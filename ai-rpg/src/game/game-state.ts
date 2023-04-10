import {
  FoodGameObject,
  GameFieldDirection,
  GameFieldPosition,
  GameObject,
  GameObjectType,
  GameState,
  PlayerGameObject,
  PlayerMove,
  PlayerMoveType,
  PlayerVisible,
} from '../interfaces/game.interface';
import { Player } from './player';
import { v4 as uuid } from 'uuid';
import { random } from 'lodash';
import { createArrayWithLength, deepClone } from '@cool/genetics';

export const BOARD_WIDTH = 50;
export const BOARD_HEIGHT = 50;

export const NUMBER_OF_FOODS = 3;

export const PLAYER_VISIBILITY_RADIUS = 3;

export function createInitialState(players: Player[]): GameState {
  const gameObjects: GameObject[] = [];

  const initialState: GameState = {
    playerScore: players.map(_ => {
      return { id: _.id, score: 0 };
    }),
    gameObjects: gameObjects,
    fields: createArrayWithLength(BOARD_HEIGHT).map((_, rowIndex) =>
      createArrayWithLength(BOARD_WIDTH).map((_, columnIndex) => {
        if (rowIndex === 0 || columnIndex === 0 || rowIndex === (BOARD_HEIGHT - 1) || columnIndex === (BOARD_WIDTH - 1)) {
          const wallObject: GameObject = {
            id: uuid(),
            type: GameObjectType.Wall,
            position: {
              row: rowIndex,
              column: columnIndex,
            },
            direction: GameFieldDirection.Down,
          };

          gameObjects.push(wallObject);

          return wallObject;
        }

        return undefined;
      }),
    ),
  };

  for (const player of players) {
    const position = _getRandomFreePosition(initialState.fields);

    const playerGameObject: PlayerGameObject = {
      id: player.id,
      type: GameObjectType.Player,
      position: position,
      direction: GameFieldDirection.Down,
      energy: 10,
    };

    gameObjects.push(playerGameObject);

    (initialState.fields[position.row]!)[position.column] = playerGameObject;
  }

  for (let i = 0; i < NUMBER_OF_FOODS; i++) {
    const position = _getRandomFreePosition(initialState.fields);

    const foodGameObject: FoodGameObject = {
      id: uuid(),
      type: GameObjectType.Food,
      position: position,
      direction: GameFieldDirection.Down,
      energyBoost: 10,
    };

    gameObjects.push(foodGameObject);

    (initialState.fields[position.row]!)[position.column] = foodGameObject;
  }

  return initialState;

  function _getRandomFreePosition(fields: ((GameObject | undefined)[])[]): GameFieldPosition {
    let result: GameFieldPosition;

    do {
      result = {
        row: random(0, BOARD_HEIGHT - 1),
        column: random(0, BOARD_WIDTH - 1),
      };
    } while (fields[result.row]?.[result.column]);

    return result;
  }
}

export function applyGameChangeToState(gameState: Readonly<GameState>, player: Player, playerMove: PlayerMove): Readonly<GameState> {
  const resultState = deepClone(gameState);

  const playerState: PlayerGameObject = resultState.gameObjects.find(_ => _.type === GameObjectType.Player && _.id === player.id) as PlayerGameObject;

  switch (playerMove.type) {
    case PlayerMoveType.TurnLeft:
      switch (playerState.direction) {
        case GameFieldDirection.Up:
          playerState.direction = GameFieldDirection.Left;
          break;

        case GameFieldDirection.Right:
          playerState.direction = GameFieldDirection.Up;
          break;

        case GameFieldDirection.Down:
          playerState.direction = GameFieldDirection.Right;
          break;

        case GameFieldDirection.Left:
          playerState.direction = GameFieldDirection.Down;
          break;

        default:
          throw new Error(`Unknown direction: ${ playerState.direction }`);
      }

      break;

    case PlayerMoveType.TurnRight:
      switch (playerState.direction) {
        case GameFieldDirection.Up:
          playerState.direction = GameFieldDirection.Right;
          break;

        case GameFieldDirection.Right:
          playerState.direction = GameFieldDirection.Down;
          break;

        case GameFieldDirection.Down:
          playerState.direction = GameFieldDirection.Left;
          break;

        case GameFieldDirection.Left:
          playerState.direction = GameFieldDirection.Up;
          break;

        default:
          throw new Error(`Unknown direction: ${ playerState.direction }`);
      }

      break;

    case PlayerMoveType.MoveForward:
      let destinationPosition: GameFieldPosition;

      switch (playerState.direction) {
        case GameFieldDirection.Up:
          destinationPosition = {
            row: playerState.position.row - 1,
            column: playerState.position.column,
          };
          break;

        case GameFieldDirection.Right:
          destinationPosition = {
            row: playerState.position.row,
            column: playerState.position.column + 1,
          };
          break;

        case GameFieldDirection.Down:
          destinationPosition = {
            row: playerState.position.row + 1,
            column: playerState.position.column,
          };
          break;

        case GameFieldDirection.Left:
          destinationPosition = {
            row: playerState.position.row,
            column: playerState.position.column - 1,
          };
          break;

        default:
          throw new Error(`Unknown direction: ${ playerState.direction }`);
      }

      const isInvalidDestination = destinationPosition.row < 0 || destinationPosition.row > (BOARD_HEIGHT - 1) || destinationPosition.column < 0 || destinationPosition.column > (BOARD_WIDTH - 1);

      if (isInvalidDestination) {
        break;
      }

      const gameObjectInDestination = gameState.fields[destinationPosition.row]![destinationPosition.column];

      switch (gameObjectInDestination?.type) {
        case GameObjectType.Wall:
        case GameObjectType.Player:
          // Cannot go there
          break;

        case GameObjectType.Food:
        case undefined:
          gameState.fields[playerState.position.row]![playerState.position.column] = undefined;

          playerState.position = destinationPosition;

          gameState.fields[playerState.position.row]![playerState.position.column] = playerState;

          if (gameObjectInDestination && gameObjectInDestination.type === GameObjectType.Food) {
            playerState.energy += (gameObjectInDestination as FoodGameObject).energyBoost;

            gameState.gameObjects.splice(gameState.gameObjects.findIndex(_ => _.id === gameObjectInDestination.id), 1);
          }

          break;

        default:
          throw new Error(`Unknown game object type: ${ gameObjectInDestination?.type }`);
      }

      break;

    default:
      throw new Error(`Unknown player move: ${ playerMove.type }`);
  }

  playerState.energy--;

  return resultState;
}

export function calculatePlayerVisible(gameState: Readonly<GameState>, player: Player): PlayerVisible {
  const playerState: PlayerGameObject = gameState.gameObjects.find(_ => _.type === GameObjectType.Player && _.id === player.id) as PlayerGameObject;

  return {
    visibleFieldObjects: gameState.gameObjects.filter(_ => _.id !== player.id && Math.abs(_.position.row - playerState.position.row) < PLAYER_VISIBILITY_RADIUS && Math.abs(_.position.column - playerState.position.column) < PLAYER_VISIBILITY_RADIUS),
    playerState: playerState,
  };
}