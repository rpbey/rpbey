import * as tf from '@tensorflow/tfjs';
import '@tensorflow/tfjs-backend-cpu';
import fs from 'node:fs';
import path from 'node:path';

// Force CPU backend
tf.setBackend('cpu');

// Configuration
const SAMPLE_RATE = 48000;
const DURATION_SEC = 1;
const CHUNK_SIZE = SAMPLE_RATE * DURATION_SEC; // 48000 samples
const DATASET_DIR = path.join(process.cwd(), 'temp', 'dataset');
const MODEL_DIR = path.join(process.cwd(), 'model');

async function loadRawFile(filepath: string): Promise<Float32Array> {
  const buffer = await fs.promises.readFile(filepath);
  // Convert Int16 buffer to Float32 [-1.0, 1.0]
  const int16 = new Int16Array(
    buffer.buffer,
    buffer.byteOffset,
    buffer.length / 2,
  );
  const float32 = new Float32Array(int16.length);
  for (let i = 0; i < int16.length; i++) {
    float32[i] = int16[i] / 32768.0;
  }
  return float32;
}

function chunkAudio(audio: Float32Array): Float32Array[] {
  const chunks: Float32Array[] = [];
  // Use stereo step (2 channels) -> actually let's just take left channel for simplicity to train faster
  // Input is stereo interlaced (L, R, L, R...)
  // We want chunks of 48000 samples (1 sec).
  // Total raw length is samples * channels.

  // Extract mono first
  const mono = new Float32Array(audio.length / 2);
  for (let i = 0; i < mono.length; i++) {
    mono[i] = audio[i * 2];
  }

  for (let i = 0; i < mono.length; i += CHUNK_SIZE) {
    if (i + CHUNK_SIZE <= mono.length) {
      chunks.push(mono.slice(i, i + CHUNK_SIZE));
    }
  }
  return chunks;
}

async function prepareDataset() {
  console.log('📂 Loading data...');
  const xs: Float32Array[] = [];
  const ys: number[] = [];

  // Helper to process a directory
  async function processDir(dir: string) {
    if (!fs.existsSync(dir)) return;
    const files = fs.readdirSync(dir).filter((f) => f.endsWith('.pcm'));

    for (const file of files) {
      const p = path.join(dir, file);
      const audio = await loadRawFile(p);
      const chunks = chunkAudio(audio);

      // Determine label
      // Class 1: RPBEY (positive)
      // Class 0: Noise/Other (negative)
      let label = 0;
      if (file.startsWith('rpbey')) {
        label = 1;
      }

      chunks.forEach((c) => {
        xs.push(c);
        ys.push(label);
      });
    }
  }

  await processDir(DATASET_DIR);
  // Also use old recordings as noise if needed, but let's stick to labeled dataset primarily
  // await processDir(RECORDINGS_DIR);

  console.log(
    `📊 Stats: ${ys.filter((y) => y === 1).length} RPBEY samples, ${ys.filter((y) => y === 0).length} Noise samples.`,
  );

  if (xs.length === 0) {
    throw new Error('No data found in temp/dataset!');
  }

  // Balance dataset (simple undersampling of noise if too much, or duplication of positive)
  // For now, raw.

  // Shuffle
  const indices = xs.map((_, i) => i);
  tf.util.shuffle(indices);

  const shuffledXs = indices.map((i) => xs[i]);
  const shuffledYs = indices.map((i) => ys[i]);

  // Flatten
  const totalLength = shuffledXs.length * CHUNK_SIZE;
  const flatData = new Float32Array(totalLength);
  for (let i = 0; i < shuffledXs.length; i++) {
    flatData.set(shuffledXs[i], i * CHUNK_SIZE);
  }

  // Convert to Tensors
  // Input shape: [batch, 48000, 1]
  const xTensor = tf.tensor3d(flatData, [shuffledXs.length, CHUNK_SIZE, 1]);
  const yTensor = tf.oneHot(tf.tensor1d(shuffledYs, 'int32'), 2);

  return { xTensor, yTensor };
}

async function createModel() {
  const model = tf.sequential();

  // Simple 1D CNN for audio
  // Input: 48000 samples (1 sec)

  // Downsample/Conv 1
  model.add(
    tf.layers.conv1d({
      inputShape: [CHUNK_SIZE, 1],
      kernelSize: 80, // Large kernel for raw audio
      strides: 4,
      filters: 8,
      activation: 'relu',
    }),
  );
  model.add(tf.layers.maxPooling1d({ poolSize: 4 }));

  // Conv 2
  model.add(
    tf.layers.conv1d({
      kernelSize: 3,
      filters: 16,
      activation: 'relu',
    }),
  );
  model.add(tf.layers.maxPooling1d({ poolSize: 4 }));

  // Flatten & Dense
  model.add(tf.layers.flatten());
  model.add(tf.layers.dense({ units: 32, activation: 'relu' }));
  model.add(tf.layers.dense({ units: 2, activation: 'softmax' })); // 2 Classes

  model.compile({
    optimizer: tf.train.adam(0.001),
    loss: 'categoricalCrossentropy',
    metrics: ['accuracy'],
  });

  return model;
}

// Custom IO Handler for pure JS environment
class NodeFileSystem implements tf.io.IOHandler {
  constructor(private path: string) {}

  async save(artifacts: tf.io.ModelArtifacts): Promise<tf.io.SaveResult> {
    if (!fs.existsSync(this.path)) fs.mkdirSync(this.path, { recursive: true });

    // Save model.json
    const modelJsonPath = path.join(this.path, 'model.json');
    const weightsData = artifacts.weightData;
    delete artifacts.weightData; // Do not include raw weights in JSON

    fs.writeFileSync(modelJsonPath, JSON.stringify(artifacts, null, 2));

    // Save weights
    if (weightsData) {
      const weightsPath = path.join(this.path, 'weights.bin');
      fs.writeFileSync(weightsPath, Buffer.from(weightsData as ArrayBuffer));

      // Update manifest
      // Actually tfjs usually expects weights in model.json manifest to point to filenames
      // But for simple reloading we might need to conform to spec
    }

    return {
      modelArtifactsInfo: {
        dateSaved: new Date(),
        modelTopologyType: 'JSON',
      },
    };
  }
}

async function train() {
  try {
    const { xTensor, yTensor } = await prepareDataset();
    console.log(`🧠 Training on ${xTensor.shape[0]} samples...`);

    const model = await createModel();
    model.summary();

    await model.fit(xTensor, yTensor, {
      epochs: 5,
      batchSize: 8,
      validationSplit: 0.2,
      callbacks: {
        onEpochEnd: (epoch, logs) => {
          console.log(
            `Epoch ${epoch + 1}: loss=${logs?.loss.toFixed(4)}, acc=${logs?.acc.toFixed(4)}`,
          );
        },
      },
    });

    console.log('💾 Saving model...');
    await model.save(new NodeFileSystem(MODEL_DIR));
    console.log('✅ Model saved!');
  } catch (err) {
    console.error('Training error:', err);
  }
}

train();
