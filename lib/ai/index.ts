import { openai } from '@ai-sdk/openai';
import { anthropic } from '@ai-sdk/anthropic';
import { experimental_wrapLanguageModel as wrapLanguageModel } from 'ai';

import { customMiddleware } from './custom-middleware';

export const customModel = (apiIdentifier: string) => {
  // Check if model is Anthropic
  if (apiIdentifier.startsWith('claude-')) {
    return wrapLanguageModel({
      model: anthropic(apiIdentifier),
      middleware: customMiddleware,
    });
  }
  
  // Default to OpenAI
  return wrapLanguageModel({
    model: openai(apiIdentifier),
    middleware: customMiddleware,
  });
};

export const imageGenerationModel = openai.image('dall-e-3');
