import {
  FoodGameObject, GameConfig,
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

const PLAYER_POSITIONS: GameFieldPosition[] = [
  {
    row: 8,
    column: 8,
  }
];

const FOOD_POSITIONS: GameFieldPosition[] = [
  {
    row: 10,
    column: 12,
  },
  {
    row: 15,
    column: 12,
  },
  {
    row: 12,
    column: 8,
  },
  {
    row: 2,
    column: 10,
  },
  {
    row: 8,
    column: 10,
  },
  {
    row: 16,
    column: 16,
  },
  {
    row: 5,
    column: 18,
  },
  {
    row: 18,
    column: 5,
  },
  {
    row: 17,
    column: 5,
  },
  {
    row: 14,
    column: 3,
  },
];

export function createInitialState(players: Player[], config: GameConfig): GameState {
  const gameObjects: GameObject[] = [];

  const gameConfig = {
    rowCount: config.rowCount,
    columnCount: config.columnCount,
  };

  const initialState: GameState = {
    config: gameConfig,
    playerScore: players.map(_ => {
      return { id: _.id, score: 0 };
    }),
    gameObjects: gameObjects,
    fields: createArrayWithLength(gameConfig.rowCount).map((_, rowIndex) =>
      createArrayWithLength(gameConfig.columnCount).map((_, columnIndex) => {
        if (rowIndex === 0 || columnIndex === 0 || rowIndex === (gameConfig.rowCount - 1) || columnIndex === (gameConfig.columnCount - 1)) {
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

  for (let i = 0; i < players.length; i++){
    const player = players[i]!;

    const position = PLAYER_POSITIONS[i]!;//_getRandomFreePosition(initialState.fields);

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

  for (let i = 0; i < config.initialFoodCount; i++) {
    const position = FOOD_POSITIONS[i]!;//_getRandomFreePosition(initialState.fields);

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
        row: random(0, gameConfig.rowCount - 1),
        column: random(0, gameConfig.columnCount - 1),
      };
    } while (fields[result.row]?.[result.column]);

    return result;
  }
}

export function applyGameChangeToState(gameStateBASE: Readonly<GameState>, playerMove: PlayerMove): Readonly<GameState> {
  const resultState = deepClone(gameStateBASE);

  const playerState: PlayerGameObject = resultState.gameObjects.find(_ => _.type === GameObjectType.Player && _.id === playerMove.candidateId) as PlayerGameObject;

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

      const isInvalidDestination = destinationPosition.row < 0 || destinationPosition.row > (resultState.config.rowCount - 1) || destinationPosition.column < 0 || destinationPosition.column > (resultState.config.columnCount - 1);

      if (isInvalidDestination) {
        break;
      }

      const gameObjectInDestination = resultState.fields[destinationPosition.row]![destinationPosition.column];

      switch (gameObjectInDestination?.type) {
        case GameObjectType.Wall:
        case GameObjectType.Player:
          // Cannot go there
          break;

        case GameObjectType.Food:
        case undefined:
          resultState.fields[playerState.position.row]![playerState.position.column] = undefined;

          playerState.position = destinationPosition;

          resultState.fields[playerState.position.row]![playerState.position.column] = playerState;

          if (gameObjectInDestination && gameObjectInDestination.type === GameObjectType.Food) {
            playerState.energy += (gameObjectInDestination as FoodGameObject).energyBoost;

            resultState.gameObjects.splice(resultState.gameObjects.findIndex(_ => _.id === gameObjectInDestination.id), 1);
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

  resultState.playerScore.find(_ => _.id === playerMove.candidateId)!.score++;

  return resultState;
}

export function calculatePlayerVisible(gameState: Readonly<GameState>, player: Player, playerVisibilityRadius: number): PlayerVisible {
  const playerState: PlayerGameObject = gameState.gameObjects.find(_ => _.type === GameObjectType.Player && _.id === player.id) as PlayerGameObject;

  return {
    visibleFieldObjects: gameState.gameObjects.filter(_ => _.id !== player.id && Math.abs(_.position.row - playerState.position.row) < playerVisibilityRadius && Math.abs(_.position.column - playerState.position.column) < playerVisibilityRadius),
    playerState: playerState,
  };
}