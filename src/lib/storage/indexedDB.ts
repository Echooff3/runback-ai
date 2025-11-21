import type { ChatSession } from '../../types';

// IndexedDB Configuration
const DB_NAME = 'runback_db';
const DB_VERSION = 2;
const SESSIONS_STORE = 'chat_sessions';
const FORM_CACHE_STORE = 'form_cache';

export class IndexedDBManager {
  private db: IDBDatabase | null = null;
  private initPromise: Promise<void> | null = null;

  /**
   * Initialize IndexedDB connection
   */
  async init(): Promise<void> {
    if (this.db) return;
    if (this.initPromise) return this.initPromise;

    this.initPromise = new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => {
        reject(new Error('Failed to open IndexedDB'));
      };

      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        // Create chat_sessions store
        if (!db.objectStoreNames.contains(SESSIONS_STORE)) {
          const sessionStore = db.createObjectStore(SESSIONS_STORE, { keyPath: 'id' });
          
          // Create indexes for efficient queries
          sessionStore.createIndex('createdAt', 'createdAt', { unique: false });
          sessionStore.createIndex('updatedAt', 'updatedAt', { unique: false });
          sessionStore.createIndex('isStarred', 'isStarred', { unique: false });
          sessionStore.createIndex('isClosed', 'isClosed', { unique: false });
          sessionStore.createIndex('provider', 'provider', { unique: false });
        }

        // Create form_cache store
        if (!db.objectStoreNames.contains(FORM_CACHE_STORE)) {
          const formStore = db.createObjectStore(FORM_CACHE_STORE, { keyPath: 'cacheKey' });
          formStore.createIndex('modelId', 'modelId', { unique: false });
          formStore.createIndex('provider', 'provider', { unique: false });
          formStore.createIndex('timestamp', 'timestamp', { unique: false });
        }
      };
    });

    return this.initPromise;
  }

  /**
   * Save or update a chat session
   */
  async saveSession(session: ChatSession): Promise<void> {
    await this.init();
    if (!this.db) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([SESSIONS_STORE], 'readwrite');
      const store = transaction.objectStore(SESSIONS_STORE);
      const request = store.put(session);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(new Error('Failed to save session'));
    });
  }

  /**
   * Load a single session by ID
   */
  async loadSession(sessionId: string): Promise<ChatSession | null> {
    await this.init();
    if (!this.db) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([SESSIONS_STORE], 'readonly');
      const store = transaction.objectStore(SESSIONS_STORE);
      const request = store.get(sessionId);

      request.onsuccess = () => {
        resolve(request.result || null);
      };
      request.onerror = () => reject(new Error('Failed to load session'));
    });
  }

  /**
   * Load all sessions, optionally filtered
   */
  async loadAllSessions(filter?: { isClosed?: boolean; isStarred?: boolean }): Promise<ChatSession[]> {
    await this.init();
    if (!this.db) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([SESSIONS_STORE], 'readonly');
      const store = transaction.objectStore(SESSIONS_STORE);
      const request = store.getAll();

      request.onsuccess = () => {
        let sessions = request.result as ChatSession[];
        
        // Apply filters if provided
        if (filter) {
          if (filter.isClosed !== undefined) {
            sessions = sessions.filter(s => s.isClosed === filter.isClosed);
          }
          if (filter.isStarred !== undefined) {
            sessions = sessions.filter(s => s.isStarred === filter.isStarred);
          }
        }

        // Sort by updatedAt descending (most recent first)
        sessions.sort((a, b) => 
          new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
        );

        resolve(sessions);
      };
      request.onerror = () => reject(new Error('Failed to load sessions'));
    });
  }

  /**
   * Delete a session by ID
   */
  async deleteSession(sessionId: string): Promise<void> {
    await this.init();
    if (!this.db) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([SESSIONS_STORE], 'readwrite');
      const store = transaction.objectStore(SESSIONS_STORE);
      const request = store.delete(sessionId);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(new Error('Failed to delete session'));
    });
  }

  /**
   * Update specific fields of a session
   */
  async updateSession(sessionId: string, updates: Partial<ChatSession>): Promise<void> {
    const session = await this.loadSession(sessionId);
    if (!session) throw new Error('Session not found');

    const updatedSession = {
      ...session,
      ...updates,
      updatedAt: new Date().toISOString(),
    };

    await this.saveSession(updatedSession);
  }

  /**
   * Get total number of sessions
   */
  async getSessionCount(): Promise<number> {
    await this.init();
    if (!this.db) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([SESSIONS_STORE], 'readonly');
      const store = transaction.objectStore(SESSIONS_STORE);
      const request = store.count();

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(new Error('Failed to count sessions'));
    });
  }

  /**
   * Clear all sessions (use with caution)
   */
  async clearAllSessions(): Promise<void> {
    await this.init();
    if (!this.db) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([SESSIONS_STORE], 'readwrite');
      const store = transaction.objectStore(SESSIONS_STORE);
      const request = store.clear();

      request.onsuccess = () => resolve();
      request.onerror = () => reject(new Error('Failed to clear sessions'));
    });
  }

  /**
   * Save form cache to IndexedDB
   */
  async saveFormCache(
    modelId: string,
    provider: string,
    html: string,
    javascript: string,
    schema: any
  ): Promise<void> {
    await this.init();
    if (!this.db) throw new Error('Database not initialized');

    const cacheKey = `${provider}_${modelId}`;
    const cacheData = {
      cacheKey,
      modelId,
      provider,
      html,
      javascript,
      schema,
      timestamp: Date.now(),
    };

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([FORM_CACHE_STORE], 'readwrite');
      const store = transaction.objectStore(FORM_CACHE_STORE);
      const request = store.put(cacheData);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(new Error('Failed to save form cache'));
    });
  }

  /**
   * Load form cache from IndexedDB
   */
  async loadFormCache(
    modelId: string,
    provider: string
  ): Promise<{ html: string; javascript: string; timestamp: number; schema: any } | null> {
    await this.init();
    if (!this.db) throw new Error('Database not initialized');

    const cacheKey = `${provider}_${modelId}`;

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([FORM_CACHE_STORE], 'readonly');
      const store = transaction.objectStore(FORM_CACHE_STORE);
      const request = store.get(cacheKey);

      request.onsuccess = () => {
        resolve(request.result || null);
      };
      request.onerror = () => reject(new Error('Failed to load form cache'));
    });
  }

  /**
   * Clear form cache for a specific model/provider or all
   */
  async clearFormCache(modelId?: string, provider?: string): Promise<void> {
    await this.init();
    if (!this.db) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([FORM_CACHE_STORE], 'readwrite');
      const store = transaction.objectStore(FORM_CACHE_STORE);

      if (modelId && provider) {
        const cacheKey = `${provider}_${modelId}`;
        const request = store.delete(cacheKey);
        request.onsuccess = () => resolve();
        request.onerror = () => reject(new Error('Failed to clear form cache'));
      } else {
        const request = store.clear();
        request.onsuccess = () => resolve();
        request.onerror = () => reject(new Error('Failed to clear all form cache'));
      }
    });
  }

  /**
   * Close database connection
   */
  close(): void {
    if (this.db) {
      this.db.close();
      this.db = null;
      this.initPromise = null;
    }
  }
}

// Singleton instance
let dbInstance: IndexedDBManager | null = null;

export function getDBInstance(): IndexedDBManager {
  if (!dbInstance) {
    dbInstance = new IndexedDBManager();
  }
  return dbInstance;
}

export function closeDB(): void {
  if (dbInstance) {
    dbInstance.close();
    dbInstance = null;
  }
}
