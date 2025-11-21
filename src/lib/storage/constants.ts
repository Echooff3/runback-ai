// Storage keys for LocalStorage
export const STORAGE_KEYS = {
  THEME: 'runback_theme',
  API_CONFIGS: 'runback_api_configs',
  SYSTEM_PROMPTS: 'runback_system_prompts',
  SLASH_PROMPTS: 'runback_slash_prompts',
  ACTIVE_PROMPT_ID: 'runback_active_prompt_id',
  APP_VERSION: 'runback_app_version',
  LAST_PROVIDER: 'runback_last_provider',
  LAST_MODEL: 'runback_last_model',
  ONBOARDING_COMPLETE: 'runback_onboarding_complete',
  STORAGE_VERSION: 'runback_storage_version',
} as const;

export const CURRENT_STORAGE_VERSION = 1;
export const APP_VERSION = '1.0.0';
