import { ModelArtifacts, SaveResult } from '@tensorflow/tfjs-core/dist/io/types';
import * as tf from '@tensorflow/tfjs';
import { LayersModel } from '@tensorflow/tfjs';
import { deepClone } from '@cool/genetics';

const Buffer = require('buffer/').Buffer;

export type SerializedModel = SaveResult & {
  weightData: string;
};

export abstract class ModelUtils {
  public static async cloneModelAsync(model: LayersModel): Promise<LayersModel> {
    const serializedModel = await this.serializeModelAsync(model);

    return await this.deserializeModelAsync(deepClone(serializedModel));
  }

  public static async mutateModelAsync(model: LayersModel, mutationRate: number, mutationPower: number) {
    const newModel = await this.cloneModelAsync(model);

    const hiddenLayers = newModel.layers.slice(1, -1);

    for (const layer of hiddenLayers) {
      const newWeights: tf.Tensor[] = [];

      const originalWeightsData = layer.getWeights();

      for (const weightData of originalWeightsData) {
        const originalWeightTensor = weightData.clone();

        if (Math.random() > (1 - mutationRate)) {
          newWeights.push(originalWeightTensor);
        } else {
          const tensorToMultiplyWith = tf.tensor(
            (await originalWeightTensor.data()).map(() => {
              const flipper = Math.random() > mutationRate ? -1 : 1;

              return Math.random() * mutationPower * flipper;
            }),
            originalWeightTensor.shape,
          );

          const mutatedWeight = originalWeightTensor.mul(tensorToMultiplyWith);

          newWeights.push(mutatedWeight);
        }
      }

      layer.setWeights(newWeights);
    }

    return newModel;
  }

  public static async serializeModelAsync(model: LayersModel): Promise<SerializedModel> {
    const result = <SerializedModel>await model.save(tf.io.withSaveHandler(async modelArtifacts => <SaveResult>modelArtifacts));

    result.weightData = <any>Buffer.from(result.weightData!).toString('base64');

    return result;
  }

  public static async deserializeModelAsync(data: SerializedModel): Promise<LayersModel> {
    const parsedData = <ModelArtifacts><any>data;

    parsedData.weightData = new Uint8Array(Buffer.from(data.weightData, 'base64')).buffer;

    return await tf.loadLayersModel(tf.io.fromMemory(parsedData));
  }
}