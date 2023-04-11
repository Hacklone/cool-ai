import { GameConfig, GameParameters } from '../interfaces/game.interface';
import { createFieldsWithWalls, getRandomFreePositionOnFields } from './game-state';
import { Game } from './game';
import { ICandidateTest, ICandidateTestFactory } from '@cool/genetics';

export class GameFactory implements ICandidateTestFactory {
  constructor(
    private _config: GameConfig,
  ) {

  }

  public async createCandidateTestConfigAsync(): Promise<GameParameters> {
    const result: GameParameters = {
      playerPositions: [],
      foodPositions: [],
    };

    const fields = createFieldsWithWalls(this._config, []);

    for (let i = 0; i < 2; i++) {
      result.playerPositions.push(getRandomFreePositionOnFields(this._config, fields));
    }

    for (let i = 0; i < this._config.initialFoodCount; i++) {
      result.foodPositions.push(getRandomFreePositionOnFields(this._config, fields));
    }

    return result;
  }

  public async createCandidateTestAsync(parameters: GameParameters): Promise<ICandidateTest> {
    return new Game(this._config, parameters);
  }
}