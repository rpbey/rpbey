import * as tf from '@tensorflow/tfjs';
import { env, pipeline } from '@xenova/transformers';
import '@tensorflow/tfjs-backend-cpu';
import fs from 'node:fs';
import path from 'node:path';
import wavefile from 'wavefile';

// Force CPU backend for TensorFlow to avoid tfjs-node compatibility issues
await tf.setBackend('cpu');

// Configure transformers to run locally
env.allowLocalModels = false;
env.useBrowserCache = false;
env.backends.onnx.wasm.numThreads = 1; // Limit threads to avoid overload

// Singleton instances
let transcriber: any = null;
const _synthesizer: any = null;

// --- STT (Speech-to-Text) ---
export async function loadTranscriber() {
  if (!transcriber) {
    console.log('[AI] Loading Whisper model (Xenova/whisper-tiny)...');
    try {
      transcriber = await pipeline(
        'automatic-speech-recognition',
        'Xenova/whisper-tiny',
      );
      console.log('[AI] Whisper model loaded.');
    } catch (err) {
      console.error('[AI] Failed to load Whisper:', err);
      throw err;
    }
  }
  return transcriber;
}

export async function transcribePcm(pcmBuffer: Buffer): Promise<string> {
  const model = await loadTranscriber();

  const wav = new wavefile.WaveFile();
  wav.fromScratch(2, 48000, '16', pcmBuffer);
  wav.toSampleRate(16000);

  const samples = wav.getSamples(false, Float32Array);
  let audioData: Float32Array;
  if (Array.isArray(samples)) {
    const left = samples[0];
    const right = samples[1];
    audioData = new Float32Array(left.length);
    for (let i = 0; i < left.length; i++) {
      audioData[i] = (left[i] + right[i]) / 2;
    }
  } else {
    audioData = samples as unknown as Float32Array;
  }

  const output = await model(audioData, {
    language: 'french',
    task: 'transcribe',
  });

  return output.text.trim();
}

import { PassThrough, type Readable } from 'node:stream';
// --- TTS (Text-to-Speech) ---
// Note: We use edge-tts-universal for high-quality Neural voices (better than Google Translate)
import { Communicate, EdgeTTS } from 'edge-tts-universal';

export async function synthesizeSpeech(text: string): Promise<string> {
  // Use a high-quality French Neural voice
  // fr-FR-VivienneMultilingualNeural is a very natural female voice
  const tts = new EdgeTTS(text, 'fr-FR-VivienneMultilingualNeural');
  const result = await tts.synthesize();

  // Save to temp file as MP3
  const filename = `tts-${Date.now()}.mp3`;
  const tempDir = path.join(process.cwd(), 'temp');
  const filepath = path.join(tempDir, filename);

  if (!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir, { recursive: true });
  }

  // Convert ArrayBuffer to Buffer and write
  const audioBuffer = Buffer.from(await result.audio.arrayBuffer());
  fs.writeFileSync(filepath, audioBuffer);

  return filepath;
}

export function synthesizeSpeechStream(text: string): Readable {
  const stream = new PassThrough();
  const communicate = new Communicate(text, {
    voice: 'fr-FR-VivienneMultilingualNeural',
  });

  (async () => {
    try {
      console.log(`[TTS] Starting stream for: "${text}"`);
      let count = 0;
      let totalBytes = 0;

      for await (const chunk of communicate.stream()) {
        // console.log(`[TTS] Chunk received: ${chunk.type}`);
        if (chunk.type === 'audio' && chunk.data) {
          count++;
          const buf = Buffer.from(chunk.data);
          totalBytes += buf.length;
          stream.write(buf);
        }
      }
      console.log(
        `[TTS] Finished streaming. Chunks: ${count}, Total Bytes: ${totalBytes}`,
      );
      stream.end();
    } catch (err) {
      console.error('[TTS] Critical Error streaming:', err);
      stream.emit('error', err);
    }
  })();

  return stream;
}
