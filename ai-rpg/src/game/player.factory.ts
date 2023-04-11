import { CandidateSource, createArrayWithLength, ICandidateFactory, ISerializedCandidate } from '@cool/genetics';
import * as tf from '@tensorflow/tfjs';
import { ModelUtils, SerializedModel } from '../utils/model.utils';
import { GameConfig, PlayerConfig } from '../interfaces/game.interface';
import { Player } from './player';

const NUMBER_OF_HIDDEN_LAYERS = 3;
const PLAYER_MODEL_OUTPUT_NODES = 3;

export class PlayerFactory implements ICandidateFactory {
  constructor(
    private _gameConfig: GameConfig,
    private _playerConfig: PlayerConfig,
    private _config: {
      mutationRate: number;
      maxMutationPower: number;
    },
  ) {
  }

  public async createRandomCandidateAsync(): Promise<Player> {
    const inputLayer = tf.layers.dense({
      units: this._playerConfig.inputNodeCount,
      inputShape: [this._playerConfig.inputNodeCount],
    });

    const hiddenLayers = createArrayWithLength(NUMBER_OF_HIDDEN_LAYERS).map(_ => tf.layers.dense({
      units: this._playerConfig.inputNodeCount,
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
      this._playerConfig,
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
      this._playerConfig,
    );
  }

  public async createCloneCandidateAsync(originalPlayer: Player): Promise<Player> {
    return new Player(
      await ModelUtils.cloneModelAsync(originalPlayer.model),
      [originalPlayer.id],
      CandidateSource.Clone,
      this._gameConfig,
      this._playerConfig,
    );
  }

  public async createMutatedCandidateAsync(originalPlayer: Player): Promise<Player> {
    return new Player(
      await ModelUtils.mutateModelAsync(originalPlayer.model, this._config.mutationRate, this._config.maxMutationPower),
      [originalPlayer.id],
      CandidateSource.Mutation,
      this._gameConfig,
      this._playerConfig,
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
      this._playerConfig,
    );
  }
}

export interface SerializedPlayer extends ISerializedCandidate {
  model: SerializedModel;
}