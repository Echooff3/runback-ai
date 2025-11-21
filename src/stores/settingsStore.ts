import { create } from 'zustand';
import { getAPIConfigs, saveAPIConfig } from '../lib/storage/localStorage';
import type { APIConfig, Provider } from '../types';

interface SettingsState {
  apiConfigs: APIConfig[];
  loadAPIConfigs: () => void;
  updateAPIConfig: (config: APIConfig) => void;
  getProviderConfig: (provider: Provider) => APIConfig | undefined;
  isProviderConfigured: (provider: Provider) => boolean;
}

export const useSettingsStore = create<SettingsState>((set, get) => ({
  apiConfigs: [],
  
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
}));
