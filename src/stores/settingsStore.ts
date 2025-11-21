import { create } from 'zustand';
import { getAPIConfigs, saveAPIConfig, getHtmlGenerationModel, saveHtmlGenerationModel } from '../lib/storage/localStorage';
import type { APIConfig, Provider } from '../types';

interface SettingsState {
  apiConfigs: APIConfig[];
  htmlGenerationModel: string;
  loadAPIConfigs: () => void;
  updateAPIConfig: (config: APIConfig) => void;
  setHtmlGenerationModel: (model: string) => void;
  getProviderConfig: (provider: Provider) => APIConfig | undefined;
  isProviderConfigured: (provider: Provider) => boolean;
  getAPIKey: (provider: Provider) => string | undefined;
}

export const useSettingsStore = create<SettingsState>((set, get) => ({
  apiConfigs: [],
  htmlGenerationModel: getHtmlGenerationModel(),
  
  loadAPIConfigs: () => {
    const configs = getAPIConfigs();
    const htmlModel = getHtmlGenerationModel();
    set({ apiConfigs: configs, htmlGenerationModel: htmlModel });
  },
  
  updateAPIConfig: (config: APIConfig) => {
    saveAPIConfig(config);
    const configs = getAPIConfigs();
    set({ apiConfigs: configs });
  },

  setHtmlGenerationModel: (model: string) => {
    saveHtmlGenerationModel(model);
    set({ htmlGenerationModel: model });
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
}));
