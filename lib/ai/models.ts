// Define your models here.

export interface Model {
  id: string;
  label: string;
  apiIdentifier: string;
  description: string;
}

export const models: Array<Model> = [
  {
    id: 'gpt-4o-mini',
    label: 'GPT 4o mini',
    apiIdentifier: 'gpt-4o-mini',
    description: 'Small model for fast, lightweight tasks',
  },
  {
    id: 'gpt-4o',
    label: 'GPT 4o',
    apiIdentifier: 'gpt-4o',
    description: 'For complex, multi-step tasks',
  },
  {
    id: 'claude-3-opus',
    label: 'Claude 3 Opus',
    apiIdentifier: 'claude-3-opus-20240229',
    description: 'Most powerful Anthropic model for complex tasks',
  },
  {
    id: 'claude-3-5-sonnet',
    label: 'Claude 3 Sonnet',
    apiIdentifier: 'claude-3-5-sonnet-latest',
    description: 'Balanced Anthropic model for most tasks',
  }
] as const;

export const DEFAULT_MODEL_NAME: string = 'gpt-4o-mini';
