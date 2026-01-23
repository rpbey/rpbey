import { pipeline, env } from '@xenova/transformers';
import * as tf from '@tensorflow/tfjs';
import '@tensorflow/tfjs-backend-cpu';
import wavefile from 'wavefile';
import fs from 'node:fs';
import path from 'node:path';

// Force CPU backend for TensorFlow to avoid tfjs-node compatibility issues
await tf.setBackend('cpu');

// Configure transformers to run locally
env.allowLocalModels = false; 
env.useBrowserCache = false;
env.backends.onnx.wasm.numThreads = 1; // Limit threads to avoid overload

// Singleton instances
let transcriber: any = null;
let synthesizer: any = null;

// --- STT (Speech-to-Text) ---
export async function loadTranscriber() {
  if (!transcriber) {
    console.log('[AI] Loading Whisper model (Xenova/whisper-tiny)...');
    try {
      transcriber = await pipeline('automatic-speech-recognition', 'Xenova/whisper-tiny');
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

// --- TTS (Text-to-Speech) ---
export async function loadSynthesizer() {
  if (!synthesizer) {
    console.log('[AI] Loading TTS model (Xenova/speecht5_tts)...');
    try {
      // SpeechT5 is decent for CPU and supports speakers
      // We will use the default speaker embedding if available or a specific one
      synthesizer = await pipeline('text-to-speech', 'Xenova/speecht5_tts', { quantized: false });
      console.log('[AI] TTS model loaded.');
    } catch (err) {
      console.error('[AI] Failed to load TTS:', err);
      throw err;
    }
  }
  return synthesizer;
}

export async function synthesizeSpeech(text: string): Promise<string> {
  const model = await loadSynthesizer();
  
  const speaker_embeddings_url = 'https://huggingface.co/datasets/Xenova/transformers.js-docs/resolve/main/speaker_embeddings.bin';
  
  if (!global.speakerEmbeddings) {
      const buffer = await (await fetch(speaker_embeddings_url)).arrayBuffer();
      global.speakerEmbeddings = new Float32Array(buffer);
  }

  const output = await model(text, {
    speaker_embeddings: global.speakerEmbeddings
  });
  
  // Create a standard WAV file from the model output
  const wav = new wavefile.WaveFile();
  
  // Output is Float32, 16kHz (usually), Mono
  // We save it as is. FFmpeg (via discord.js) will handle resampling/stereo conversion during playback.
  wav.fromScratch(1, output.sampling_rate, '32f', output.audio);
  
  // Save to temp file
  const filename = `tts-${Date.now()}.wav`;
  const filepath = path.join(process.cwd(), 'temp', filename);
  
  if (!fs.existsSync(path.join(process.cwd(), 'temp'))) {
      fs.mkdirSync(path.join(process.cwd(), 'temp'));
  }
  
  fs.writeFileSync(filepath, wav.toBuffer());
  
  return filepath;
}

// Global cache for embeddings
declare global {
    var speakerEmbeddings: Float32Array | undefined;
}