import { STORAGE_KEYS, CURRENT_STORAGE_VERSION } from './constants';
import type { Theme, APIConfig, SystemPrompt, SlashPrompt } from '../../types';

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
  return data ? JSON.parse(data) : [];
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
  return data ? JSON.parse(data) : [];
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
