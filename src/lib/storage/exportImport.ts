import { STORAGE_KEYS, CURRENT_STORAGE_VERSION, APP_VERSION } from './constants';
import { 
  loadTheme, 
  getSystemPrompts, 
  getSlashPrompts, 
  getActivePromptId,
  getLastProvider,
  getLastModel,
  getHelperModel,
} from './localStorage';
import { getDBInstance } from './indexedDB';
import type { Theme, SystemPrompt, SlashPrompt, ChatSession } from '../../types';

// Export data structure (excludes API keys)
export interface ExportData {
  version: number;
  appVersion: string;
  exportDate: string;
  theme: Theme;
  helperModel: string | null;
  lastProvider: string | null;
  lastModel: string | null;
  activePromptId: string | null;
  systemPrompts: SystemPrompt[];
  slashPrompts: SlashPrompt[];
  chatSessions: ChatSession[];
}

/**
 * Export all app data except API keys
 * @returns ExportData object containing all exportable data
 */
export async function exportAppData(): Promise<ExportData> {
  // Load chat sessions from IndexedDB
  const dbInstance = getDBInstance();
  const chatSessions = await dbInstance.loadAllSessions();

  const exportData: ExportData = {
    version: CURRENT_STORAGE_VERSION,
    appVersion: APP_VERSION,
    exportDate: new Date().toISOString(),
    theme: loadTheme(),
    helperModel: getHelperModel(),
    lastProvider: getLastProvider(),
    lastModel: getLastModel(),
    activePromptId: getActivePromptId(),
    systemPrompts: getSystemPrompts(),
    slashPrompts: getSlashPrompts(),
    chatSessions: chatSessions,
  };

  return exportData;
}

/**
 * Download export data as a JSON file
 */
export async function downloadExportFile(): Promise<void> {
  const exportData = await exportAppData();
  
  const blob = new Blob(
    [JSON.stringify(exportData, null, 2)],
    { type: 'application/json' }
  );
  
  // Create download link
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  
  // Generate filename with date
  const date = new Date().toISOString().slice(0, 10);
  link.download = `runback-ai-backup-${date}.json`;
  
  // Trigger download
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  // Cleanup
  URL.revokeObjectURL(url);
}

/**
 * Validate imported data structure
 */
export function validateImportData(data: unknown): data is ExportData {
  if (!data || typeof data !== 'object') {
    return false;
  }

  const obj = data as Record<string, unknown>;

  // Check required fields exist
  if (typeof obj.version !== 'number') {
    return false;
  }

  // Check arrays exist
  if (!Array.isArray(obj.systemPrompts) || !Array.isArray(obj.slashPrompts)) {
    return false;
  }

  // Validate each system prompt has required fields
  for (const prompt of obj.systemPrompts) {
    if (!prompt || typeof prompt !== 'object') return false;
    const p = prompt as Record<string, unknown>;
    if (typeof p.id !== 'string' || typeof p.name !== 'string' || typeof p.content !== 'string') {
      return false;
    }
  }

  // Validate each slash prompt has required fields
  for (const prompt of obj.slashPrompts) {
    if (!prompt || typeof prompt !== 'object') return false;
    const p = prompt as Record<string, unknown>;
    if (typeof p.id !== 'string' || typeof p.command !== 'string' || typeof p.template !== 'string') {
      return false;
    }
  }

  // chatSessions is optional but if present must be an array
  if (obj.chatSessions !== undefined && !Array.isArray(obj.chatSessions)) {
    return false;
  }

  return true;
}

export type ImportMode = 'merge' | 'replace';

export interface ImportResult {
  success: boolean;
  message: string;
  imported: {
    systemPrompts: number;
    slashPrompts: number;
    chatSessions: number;
  };
}

/**
 * Import app data from JSON file
 * @param data The parsed JSON data to import
 * @param mode 'merge' to add to existing data, 'replace' to overwrite
 */
export async function importAppData(data: ExportData, mode: ImportMode): Promise<ImportResult> {
  const result: ImportResult = {
    success: true,
    message: '',
    imported: {
      systemPrompts: 0,
      slashPrompts: 0,
      chatSessions: 0,
    },
  };

  try {
    // Import theme
    if (data.theme) {
      localStorage.setItem(STORAGE_KEYS.THEME, data.theme);
    }

    // Import helper model
    if (data.helperModel) {
      localStorage.setItem(STORAGE_KEYS.HELPER_MODEL, data.helperModel);
    }

    // Import last provider/model
    if (data.lastProvider) {
      localStorage.setItem(STORAGE_KEYS.LAST_PROVIDER, data.lastProvider);
    }
    if (data.lastModel) {
      localStorage.setItem(STORAGE_KEYS.LAST_MODEL, data.lastModel);
    }

    // Import system prompts
    if (data.systemPrompts && data.systemPrompts.length > 0) {
      if (mode === 'replace') {
        localStorage.setItem(STORAGE_KEYS.SYSTEM_PROMPTS, JSON.stringify(data.systemPrompts));
        result.imported.systemPrompts = data.systemPrompts.length;
      } else {
        // Merge: add new prompts, skip duplicates by ID
        const existing = getSystemPrompts();
        const existingIds = new Set(existing.map(p => p.id));
        const newPrompts = data.systemPrompts.filter(p => !existingIds.has(p.id));
        const merged = [...existing, ...newPrompts];
        localStorage.setItem(STORAGE_KEYS.SYSTEM_PROMPTS, JSON.stringify(merged));
        result.imported.systemPrompts = newPrompts.length;
      }
    }

    // Import slash prompts
    if (data.slashPrompts && data.slashPrompts.length > 0) {
      if (mode === 'replace') {
        localStorage.setItem(STORAGE_KEYS.SLASH_PROMPTS, JSON.stringify(data.slashPrompts));
        result.imported.slashPrompts = data.slashPrompts.length;
      } else {
        // Merge: add new prompts, skip duplicates by ID
        const existing = getSlashPrompts();
        const existingIds = new Set(existing.map(p => p.id));
        const newPrompts = data.slashPrompts.filter(p => !existingIds.has(p.id));
        const merged = [...existing, ...newPrompts];
        localStorage.setItem(STORAGE_KEYS.SLASH_PROMPTS, JSON.stringify(merged));
        result.imported.slashPrompts = newPrompts.length;
      }
    }

    // Import chat sessions to IndexedDB
    if (data.chatSessions && data.chatSessions.length > 0) {
      const dbInstance = getDBInstance();
      
      if (mode === 'replace') {
        // Clear existing sessions and add all imported ones
        await dbInstance.clearAllSessions();
        for (const session of data.chatSessions) {
          await dbInstance.saveSession(session);
        }
        result.imported.chatSessions = data.chatSessions.length;
      } else {
        // Merge: add new sessions, skip duplicates by ID
        const existingSessions = await dbInstance.loadAllSessions();
        const existingIds = new Set(existingSessions.map(s => s.id));
        let importedCount = 0;
        for (const session of data.chatSessions) {
          if (!existingIds.has(session.id)) {
            await dbInstance.saveSession(session);
            importedCount++;
          }
        }
        result.imported.chatSessions = importedCount;
      }
    }

    // Set active prompt ID if provided and exists in imported prompts
    if (data.activePromptId) {
      const importedPrompts = getSystemPrompts();
      if (importedPrompts.some(p => p.id === data.activePromptId)) {
        localStorage.setItem(STORAGE_KEYS.ACTIVE_PROMPT_ID, data.activePromptId);
      }
    }

    result.message = mode === 'replace' 
      ? 'Data imported successfully (replaced existing data)' 
      : `Data merged successfully`;

  } catch (error) {
    result.success = false;
    result.message = error instanceof Error ? error.message : 'Failed to import data';
  }

  return result;
}

/**
 * Read and parse a file as JSON
 */
export function readFileAsJSON(file: File): Promise<unknown> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const data = JSON.parse(text);
        resolve(data);
      } catch {
        reject(new Error('Invalid JSON file'));
      }
    };
    
    reader.onerror = () => {
      reject(new Error('Failed to read file'));
    };
    
    reader.readAsText(file);
  });
}
