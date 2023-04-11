import { CandidateSource, createArrayWithLength, ICandidateFactory, ISerializedCandidate } from '@cool/genetics';
import * as tf from '@tensorflow/tfjs';
import { ModelUtils, SerializedModel } from '../utils/model.utils';
import { GameConfig } from '../interfaces/game.interface';
import { Player } from './player';

const MUTATION_RATE = 0.4;
const MAX_MUTATION_POWER = 0.1;
const NUMBER_OF_HIDDEN_LAYERS = 3;
const PLAYER_MODEL_OUTPUT_NODES = 3;

export class PlayerFactory implements ICandidateFactory {
  private readonly PLAYER_MODEL_INPUT_NODES: number;

  constructor(
    private _gameConfig: GameConfig,
  ) {
    this.PLAYER_MODEL_INPUT_NODES = 4 + Math.pow((2 * this._gameConfig.playerVisibilityRadius) + 1, 2);
  }

  public async createRandomCandidateAsync(): Promise<Player> {
    const inputLayer = tf.layers.dense({
      units: this.PLAYER_MODEL_INPUT_NODES,
      inputShape: [this.PLAYER_MODEL_INPUT_NODES],
    });

    const hiddenLayers = createArrayWithLength(NUMBER_OF_HIDDEN_LAYERS).map(_ => tf.layers.dense({
      units: this.PLAYER_MODEL_INPUT_NODES,
      kernelInitializer: 'randomUniform',
      biasInitializer: 'randomUniform',
    }));

    const outputLayer = tf.layers.dense({ units: PLAYER_MODEL_OUTPUT_NODES });

    const model = tf.sequential({
      layers: [
        inputLayer,
        ...hiddenLayers,
        outputLayer,
      ],
    });

    return new Player(
      model,
      [],
      CandidateSource.Random,
      this._gameConfig,
    );
  }

  public async createCrossOverCandidateAsync(player1: Player, player2: Player): Promise<Player> {
    const newModel = await ModelUtils.cloneModelAsync(player1.model);

    const model1Weights = player1.model.getWeights();
    const model2Weights = player2.model.getWeights();

    const weights = newModel.getWeights();
    const newWeights: tf.Tensor[] = [];

    for (let i = 0; i < weights.length; i++) {
      if (i < (weights.length / 2)) {
        newWeights.push(model1Weights[i]!);
      } else {
        newWeights.push(model2Weights[i]!);
      }
    }

    newModel.setWeights(newWeights);

    return new Player(
      newModel,
      [player1.id, player2.id],
      CandidateSource.CrossOver,
      this._gameConfig,
    );
  }

  public async createCloneCandidateAsync(originalPlayer: Player): Promise<Player> {
    return new Player(
      await ModelUtils.cloneModelAsync(originalPlayer.model),
      [originalPlayer.id],
      CandidateSource.Clone,
      this._gameConfig,
    );
  }

  public async createMutatedCandidateAsync(originalPlayer: Player): Promise<Player> {
    return new Player(
      await ModelUtils.mutateModelAsync(originalPlayer.model, MUTATION_RATE, MAX_MUTATION_POWER),
      [originalPlayer.id],
      CandidateSource.Mutation,
      this._gameConfig,
    );
  }

  public async serializeCandidateAsync(candidate: Player): Promise<SerializedPlayer> {
    return {
      id: candidate.id,
      parentIds: candidate.parentIds,
      source: candidate.source,
      model: await ModelUtils.serializeModelAsync(candidate.model),
    };
  }

  public async deserializeAsync(serializedData: SerializedPlayer): Promise<Player> {
    return new Player(
      await ModelUtils.deserializeModelAsync(serializedData.model),
      serializedData.parentIds,
      serializedData.source,
      this._gameConfig,
    );
  }
}

export interface SerializedPlayer extends ISerializedCandidate {
  model: SerializedModel;
}