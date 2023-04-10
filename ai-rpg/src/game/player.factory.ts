import { createArrayWithLength, ICandidateFactory } from '@cool/genetics';
import { Player, PLAYER_MODEL_INPUT_NODES, PLAYER_MODEL_OUTPUT_NODES } from './player';
import * as tf from '@tensorflow/tfjs';
import { ModelUtils } from '../utils/model.utils';

const MUTATION_RATE = 0.4;
const MAX_MUTATION_POWER = 0.2;
const NUMBER_OF_HIDDEN_LAYERS = 3;

export class PlayerFactory implements ICandidateFactory {
  public async createRandomCandidateAsync(): Promise<Player> {
    const inputLayer = tf.layers.dense({
      units: PLAYER_MODEL_INPUT_NODES,
      inputShape: [PLAYER_MODEL_INPUT_NODES],
    });
    const hiddenLayers = createArrayWithLength(NUMBER_OF_HIDDEN_LAYERS).map(_ => tf.layers.dense({
      units: PLAYER_MODEL_INPUT_NODES,
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
    );
  }

  public async createCloneCandidateAsync(originalPlayer: Player): Promise<Player> {
    return new Player(await ModelUtils.cloneModelAsync(originalPlayer.model));
  }

  public async createMutatedCandidateAsync(originalPlayer: Player): Promise<Player> {
    return new Player(
      await ModelUtils.mutateModelAsync(originalPlayer.model, MUTATION_RATE, MAX_MUTATION_POWER),
    );
  }

}