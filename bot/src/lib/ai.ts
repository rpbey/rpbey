import * as qna from '@tensorflow-models/qna';
import * as tf from '@tensorflow/tfjs';
import '@tensorflow/tfjs-node'; // Register the Node.js backend
import * as fs from 'fs';
import * as path from 'path';
import { container } from '@sapphire/framework';

export class AIService {
  private static instance: AIService;
  public isReady: boolean = false;
  private qnaModel: qna.QuestionAndAnswer | null = null;

  private constructor() {
    this.initialize();
  }

  public static getInstance(): AIService {
    if (!AIService.instance) {
      AIService.instance = new AIService();
    }
    return AIService.instance;
  }

  private async initialize() {
    try {
      // Enable production mode for performance
      tf.enableProdMode();
      
      // Wait for the backend to be ready
      await tf.ready();

      const backendName = tf.getBackend();
      container.logger.info(`[AI] TensorFlow.js initialized. Backend: ${backendName}`);

      if (backendName !== 'tensorflow') {
        container.logger.warn(`[AI] Warning: Not using the native 'tensorflow' Node.js backend. Performance may be degraded. Current: ${backendName}`);
      }

      // Load QnA Model
      container.logger.info('[AI] Loading QnA Model...');
      this.qnaModel = await qna.load();
      container.logger.info('[AI] QnA Model loaded.');

      this.isReady = true;
    } catch (error) {
      container.logger.error('[AI] Failed to initialize TensorFlow.js:', error);
    }
  }

  /**
   * Answers a question based on the provided context.
   */
  public async answerQuestion(question: string, context: string) {
    if (!this.qnaModel) {
      container.logger.warn('[AI] QnA Model not loaded yet.');
      return [];
    }
    return await this.qnaModel.findAnswers(question, context);
  }

  /**
   * Loads the knowledge base from a text file.
   */
  public getKnowledgeBase(filePath = 'data/knowledge_base.txt'): string {
    const fullPath = path.resolve(process.cwd(), filePath);
    if (!fs.existsSync(fullPath)) {
      return '';
    }
    return fs.readFileSync(fullPath, 'utf-8');
  }

  /**
   * Loads training data from the JSONL file.
   */
  public async loadTrainingData(filePath = 'data/training_data.jsonl'): Promise<unknown[]> {
    const fullPath = path.resolve(process.cwd(), filePath);
    if (!fs.existsSync(fullPath)) {
      container.logger.warn(`[AI] Training data file not found at ${fullPath}`);
      return [];
    }

    const data: unknown[] = [];

    // Simple line-by-line reading (for small to medium datasets)
    const content = fs.readFileSync(fullPath, 'utf-8');
    const lines = content.split('\n');

    for (const line of lines) {
      if (line.trim()) {
        try {
          data.push(JSON.parse(line));
        } catch {
          // Ignore malformed lines
        }
      }
    }

    return data;
  }

  /**
   * Creates a simple text classification model.
   * Note: This is a placeholder architecture. For real text, you'd need a tokenizer/encoder (e.g., USE).
   */
  public createModel(inputShape: number, outputClasses: number): tf.Sequential {
    const model = tf.sequential();
    
    model.add(tf.layers.dense({
      inputShape: [inputShape],
      units: 16,
      activation: 'relu'
    }));
    
    model.add(tf.layers.dense({
      units: outputClasses,
      activation: 'softmax'
    }));

    model.compile({
      optimizer: 'adam',
      loss: 'categoricalCrossentropy',
      metrics: ['accuracy']
    });

    return model;
  }

  /**
   * Saves the model to the file system.
   */
  public async saveModel(model: tf.LayersModel, savePath: string) {
    const fullPath = path.resolve(process.cwd(), savePath);
    // tfjs-node expects file:// URI
    await model.save(`file://${fullPath}`);
    container.logger.info(`[AI] Model saved to ${fullPath}`);
  }

  /**
   * Loads a model from the file system.
   */
  public async loadModel(modelPath: string): Promise<tf.LayersModel> {
    const fullPath = path.resolve(process.cwd(), modelPath, 'model.json');
    const model = await tf.loadLayersModel(`file://${fullPath}`);
    return model;
  }
}

// Export the singleton setup
export const aiService = AIService.getInstance();
