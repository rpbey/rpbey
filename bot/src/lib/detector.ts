import * as tf from '@tensorflow/tfjs';
import '@tensorflow/tfjs-backend-cpu';
import fs from 'node:fs';
import path from 'node:path';

const MODEL_PATH = path.join(process.cwd(), 'model', 'model.json');
let model: tf.LayersModel | null = null;

// Helper to load model from filesystem
class NodeFileSystemLoader implements tf.io.IOHandler {
  constructor(private path: string) {}
  async load(): Promise<tf.io.ModelArtifacts> {
    const modelJson = JSON.parse(fs.readFileSync(this.path, 'utf8'));
    // Load weights
    const dir = path.dirname(this.path);
    const weightsPath = path.join(dir, 'weights.bin');
    if (fs.existsSync(weightsPath)) {
      const buffer = fs.readFileSync(weightsPath);
      modelJson.weightData = buffer.buffer.slice(
        buffer.byteOffset,
        buffer.byteOffset + buffer.byteLength,
      );
    }
    return modelJson;
  }
}

export async function loadDetector() {
  if (!model) {
    await tf.setBackend('cpu');
    console.log('[Detector] Loading model...');
    model = await tf.loadLayersModel(new NodeFileSystemLoader(MODEL_PATH));
    console.log('[Detector] Model loaded.');
  }
  return model;
}

export async function detectKeyword(pcmBuffer: Buffer): Promise<boolean> {
  const model = await loadDetector();

  // Preprocess: PCM (16-bit) -> Float32
  // Expected shape: [1, 48000, 1]
  const int16 = new Int16Array(
    pcmBuffer.buffer,
    pcmBuffer.byteOffset,
    pcmBuffer.length / 2,
  );

  // We need 48000 samples (mono).
  // Buffer is stereo (interleaved). Length is 96000 samples total? Or chunk size?
  // If chunk is 1 sec stereo 48k => 96k samples.
  // We extract mono.

  const mono = new Float32Array(48000);
  for (let i = 0; i < 48000; i++) {
    if (i * 2 < int16.length) {
      mono[i] = int16[i * 2] / 32768.0;
    } else {
      mono[i] = 0; // Pad
    }
  }

  const input = tf.tensor3d(mono, [1, 48000, 1]);
  const prediction = model.predict(input) as tf.Tensor;
  const probs = await prediction.data();

  input.dispose();
  prediction.dispose();

  // Class 1 = RPBEY
  const score = probs[1];
  return score > 0.8;
}
