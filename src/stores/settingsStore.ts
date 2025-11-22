import { create } from 'zustand';
import { getAPIConfigs, saveAPIConfig, getHelperModel, saveHelperModel } from '../lib/storage/localStorage';
import type { APIConfig, Provider } from '../types';

interface SettingsState {
  apiConfigs: APIConfig[];
  helperModel: string;
  loadAPIConfigs: () => void;
  updateAPIConfig: (config: APIConfig) => void;
  getProviderConfig: (provider: Provider) => APIConfig | undefined;
  isProviderConfigured: (provider: Provider) => boolean;
  getAPIKey: (provider: Provider) => string | undefined;
  setHelperModel: (model: string) => void;
}

export const useSettingsStore = create<SettingsState>((set, get) => ({
  apiConfigs: [],
  helperModel: getHelperModel() || 'x-ai/grok-3-mini',
  
  loadAPIConfigs: () => {
    const configs = getAPIConfigs();
    set({ apiConfigs: configs });
  },
  
  updateAPIConfig: (config: APIConfig) => {
    saveAPIConfig(config);
    const configs = getAPIConfigs();
    set({ apiConfigs: configs });
  },
  
  getProviderConfig: (provider: Provider) => {
    return get().apiConfigs.find(c => c.provider === provider);
  },
  
  isProviderConfigured: (provider: Provider) => {
    const config = get().getProviderConfig(provider);
    return config?.isConfigured || false;
  },
  
  getAPIKey: (provider: Provider) => {
    const config = get().getProviderConfig(provider);
    return config?.apiKey;
  },

  setHelperModel: (model: string) => {
    saveHelperModel(model);
    set({ helperModel: model });
  },
}));
