import { STORAGE_KEYS, CURRENT_STORAGE_VERSION } from './constants';
import type { Theme, APIConfig, SystemPrompt, SlashPrompt } from '../../types';
import { DEFAULT_SYSTEM_PROMPTS, DEFAULT_SLASH_PROMPTS } from '../defaults/prompts';
import { v4 as uuidv4 } from 'uuid';

// Theme operations
export function saveTheme(theme: Theme): void {
  localStorage.setItem(STORAGE_KEYS.THEME, theme);
}

export function loadTheme(): Theme {
  const stored = localStorage.getItem(STORAGE_KEYS.THEME);
  return (stored as Theme) || 'system';
}

// API Configuration operations
export function saveAPIConfig(config: APIConfig): void {
  const configs = getAPIConfigs();
  const index = configs.findIndex(c => c.provider === config.provider);
  if (index >= 0) {
    configs[index] = config;
  } else {
    configs.push(config);
  }
  localStorage.setItem(STORAGE_KEYS.API_CONFIGS, JSON.stringify(configs));
}

export function getAPIConfigs(): APIConfig[] {
  const data = localStorage.getItem(STORAGE_KEYS.API_CONFIGS);
  return data ? JSON.parse(data) : [];
}

export function getAPIConfig(provider: string): APIConfig | undefined {
  const configs = getAPIConfigs();
  return configs.find(c => c.provider === provider);
}

// System Prompts operations
export function saveSystemPrompt(prompt: SystemPrompt): void {
  const prompts = getSystemPrompts();
  const index = prompts.findIndex(p => p.id === prompt.id);
  if (index >= 0) {
    prompts[index] = prompt;
  } else {
    prompts.push(prompt);
  }
  localStorage.setItem(STORAGE_KEYS.SYSTEM_PROMPTS, JSON.stringify(prompts));
}

export function getSystemPrompts(): SystemPrompt[] {
  const data = localStorage.getItem(STORAGE_KEYS.SYSTEM_PROMPTS);
  if (data) {
    return JSON.parse(data);
  }
  
  // Initialize with default prompts if empty
  const now = new Date().toISOString();
  const defaultPrompts: SystemPrompt[] = DEFAULT_SYSTEM_PROMPTS.map(prompt => ({
    ...prompt,
    id: uuidv4(),
    createdAt: now,
    updatedAt: now,
    usageCount: 0,
  }));
  
  localStorage.setItem(STORAGE_KEYS.SYSTEM_PROMPTS, JSON.stringify(defaultPrompts));
  return defaultPrompts;
}

export function deleteSystemPrompt(id: string): void {
  const prompts = getSystemPrompts().filter(p => p.id !== id);
  localStorage.setItem(STORAGE_KEYS.SYSTEM_PROMPTS, JSON.stringify(prompts));
}

// Slash Prompts operations
export function saveSlashPrompt(prompt: SlashPrompt): void {
  const prompts = getSlashPrompts();
  const index = prompts.findIndex(p => p.id === prompt.id);
  if (index >= 0) {
    prompts[index] = prompt;
  } else {
    prompts.push(prompt);
  }
  localStorage.setItem(STORAGE_KEYS.SLASH_PROMPTS, JSON.stringify(prompts));
}

export function getSlashPrompts(): SlashPrompt[] {
  const data = localStorage.getItem(STORAGE_KEYS.SLASH_PROMPTS);
  if (data) {
    return JSON.parse(data);
  }
  
  // Initialize with default prompts if empty
  const now = new Date().toISOString();
  const defaultPrompts: SlashPrompt[] = DEFAULT_SLASH_PROMPTS.map(prompt => ({
    ...prompt,
    id: uuidv4(),
    createdAt: now,
    updatedAt: now,
    usageCount: 0,
  }));
  
  localStorage.setItem(STORAGE_KEYS.SLASH_PROMPTS, JSON.stringify(defaultPrompts));
  return defaultPrompts;
}

export function deleteSlashPrompt(id: string): void {
  const prompts = getSlashPrompts().filter(p => p.id !== id);
  localStorage.setItem(STORAGE_KEYS.SLASH_PROMPTS, JSON.stringify(prompts));
}

// Active prompt
export function setActivePromptId(id: string | null): void {
  if (id === null) {
    localStorage.removeItem(STORAGE_KEYS.ACTIVE_PROMPT_ID);
  } else {
    localStorage.setItem(STORAGE_KEYS.ACTIVE_PROMPT_ID, id);
  }
}

export function getActivePromptId(): string | null {
  return localStorage.getItem(STORAGE_KEYS.ACTIVE_PROMPT_ID);
}

// Last provider/model
export function saveLastProvider(provider: string): void {
  localStorage.setItem(STORAGE_KEYS.LAST_PROVIDER, provider);
}

export function getLastProvider(): string | null {
  return localStorage.getItem(STORAGE_KEYS.LAST_PROVIDER);
}

export function saveLastModel(model: string): void {
  localStorage.setItem(STORAGE_KEYS.LAST_MODEL, model);
}

export function getLastModel(): string | null {
  return localStorage.getItem(STORAGE_KEYS.LAST_MODEL);
}

export function saveHelperModel(model: string): void {
  localStorage.setItem(STORAGE_KEYS.HELPER_MODEL, model);
}

export function getHelperModel(): string | null {
  return localStorage.getItem(STORAGE_KEYS.HELPER_MODEL);
}


// Model Parameters operations (unique per provider + model)
const MODEL_PARAMS_KEY_PREFIX = 'model_params_';

export function saveModelParameters(modelId: string, provider: string, parameters: Record<string, any>): void {
  try {
    const key = MODEL_PARAMS_KEY_PREFIX + provider + '_' + modelId;
    const data = {
      parameters,
      provider,
      modelId,
      timestamp: Date.now(),
    };
    console.log(`[localStorage] Saving parameters for ${key}:`, JSON.stringify(data, null, 2));
    localStorage.setItem(key, JSON.stringify(data));
  } catch (error) {
    console.error('Failed to save model parameters:', error);
  }
}

export function getModelParameters(modelId: string, provider: string): Record<string, any> | null {
  try {
    const key = MODEL_PARAMS_KEY_PREFIX + provider + '_' + modelId;
    const data = localStorage.getItem(key);
    
    console.log(`[localStorage] Loading parameters for ${key}, found:`, data ? 'yes' : 'no');
    
    if (!data) return null;
    
    const parsed = JSON.parse(data);
    console.log(`[localStorage] Parsed parameters:`, JSON.stringify(parsed.parameters, null, 2));
    return parsed.parameters || null;
  } catch (error) {
    console.error('Failed to load model parameters:', error);
    return null;
  }
}

export function clearModelParameters(modelId?: string, provider?: string): void {
  try {
    if (modelId && provider) {
      const key = MODEL_PARAMS_KEY_PREFIX + provider + '_' + modelId;
      localStorage.removeItem(key);
    } else {
      // Clear all model parameters
      Object.keys(localStorage)
        .filter(key => key.startsWith(MODEL_PARAMS_KEY_PREFIX))
        .forEach(key => localStorage.removeItem(key));
    }
  } catch (error) {
    console.error('Failed to clear model parameters:', error);
  }
}

// Storage migration
export function migrateStorage(): void {
  const storedVersion = parseInt(
    localStorage.getItem(STORAGE_KEYS.STORAGE_VERSION) || '0'
  );
  
  if (storedVersion < CURRENT_STORAGE_VERSION) {
    // Perform migration if needed
    if (storedVersion === 0) {
      // Initial setup - version marker
    }
    
    localStorage.setItem(
      STORAGE_KEYS.STORAGE_VERSION,
      CURRENT_STORAGE_VERSION.toString()
    );
  }
}

// Clear all data
export function clearAllData(): void {
  Object.values(STORAGE_KEYS).forEach(key => {
    localStorage.removeItem(key);
  });
}
