import {
  ICandidateKnownCandidateTestState,
  ICandidateMove,
  ICandidateTestConfig,
  ICandidateTestResult,
} from '@cool/genetics';

export interface GameConfig {
  columnCount: number;
  rowCount: number;
  initialFoodCount: number;
}

export interface GameParameters extends ICandidateTestConfig {
  playerPositions: GameFieldPosition[];

  foodPositions: GameFieldPosition[];
}

export interface GameState {
  fields: (GameObject | undefined)[][];

  gameObjects: GameObject[];

  playerScore: { id: string; score: number; }[];

  config: GameConfig;
}

export interface GameStateChange {
  gameObjectChanges: {
    id: GameObjectId;

    newPosition: GameFieldPosition | undefined;

    newDirection: GameFieldDirection | undefined;
  }[];

  playerScoreChanges: { id: string; score: number; }[];
}

export type GameObjectId = string;

export interface GameObject {
  id: GameObjectId;

  type: GameObjectType;

  position: GameFieldPosition;

  direction: GameFieldDirection;
}

export interface PlayerGameObject extends GameObject {
  type: GameObjectType.Player;

  energy: number;
}

export interface FoodGameObject extends GameObject {
  type: GameObjectType.Food;

  energyBoost: number;
}

export enum GameObjectType {
  Wall = 'wall',

  Player = 'player',

  Food = 'food',
}

export enum GameFieldDirection {
  Up = 'up',
  Right = 'right',
  Down = 'down',
  Left = 'left',
}

export function directionToNumber(direction: GameFieldDirection): number {
  switch (direction) {
    case GameFieldDirection.Up:
      return 0;
    case GameFieldDirection.Right:
      return 1;
    case GameFieldDirection.Down:
      return 2;
    case GameFieldDirection.Left:
      return 3;

  }
}

export interface GameFieldPosition {
  row: number;
  column: number;
}

export class PlayerConfig {
  constructor(
    public visibilityRadius: number,
    public memoryLength: number,
  ) {
  }

  public get inputNodeCount(): number {
    return 4 + Math.pow((2 * this.visibilityRadius) + 1, 2);
  }
}

export interface PlayerVisible extends ICandidateKnownCandidateTestState {
  visibleFieldObjects: GameObject[];

  playerState: PlayerGameObject;
}

export interface PlayerMove extends ICandidateMove {
  type: PlayerMoveType;
}

export enum PlayerMoveType {
  TurnLeft = 'turn-left',
  TurnRight = 'turn-right',
  MoveForward = 'move-forward',
}

export interface GameResult extends ICandidateTestResult {
  initialState: GameState;
  stateChangeTriggers: PlayerMove[];
}

export function positionEquals(a: GameFieldPosition, b: GameFieldPosition): boolean {
  return a.row === b.row && a.column === b.column;
}