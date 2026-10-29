import { config } from '../../config/index.js';
import { logger } from '../../utils/logger.js';
import { MockAIProvider } from './mockProvider.js';
import { GeminiAIProvider } from './geminiProvider.js';
import { OpenAIProvider } from './openaiProvider.js';

export class AIProviderFactory {
  static getProvider() {
    const providerType = (config.aiProvider || 'mock').toLowerCase();

    if (providerType === 'gemini' && config.geminiApiKey) {
      logger.info(`Using Gemini AI Provider with model: ${config.geminiModel || 'gemini-3.8-flash'}`);
      return new GeminiAIProvider(config.geminiApiKey, config.geminiModel);
    }

    if (providerType === 'openai' && config.openaiApiKey) {
      logger.info('Using OpenAI Provider');
      return new OpenAIProvider(config.openaiApiKey);
    }

    logger.info('Using Deterministic Mock AI Provider (Deterministic demo mode)');
    return new MockAIProvider();
  }

  static getProviderInfo() {
    const requested = (config.aiProvider || 'mock').toLowerCase();
    const hasGeminiKey = Boolean(config.geminiApiKey);
    const hasOpenAIKey = Boolean(config.openaiApiKey);

    let active = 'mock';
    let status = 'Deterministic Mock Mode Active';

    if (requested === 'gemini' && hasGeminiKey) {
      active = 'gemini';
      status = 'Live Gemini 1.5/2.0 API Connected';
    } else if (requested === 'openai' && hasOpenAIKey) {
      active = 'openai';
      status = 'Live OpenAI GPT-4o API Connected';
    } else if (requested !== 'mock') {
      status = `Requested '${requested}' but API key not detected. Falling back to Deterministic Mock Mode.`;
    }

    return {
      activeProvider: active,
      requestedProvider: requested,
      hasGeminiKey,
      hasOpenAIKey,
      statusMessage: status,
      isMock: active === 'mock'
    };
  }
}
