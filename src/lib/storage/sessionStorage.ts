import { getDBInstance } from './indexedDB';
import type { ChatSession, Provider } from '../../types';
import { v4 as uuidv4 } from 'uuid';

/**
 * Save a session to IndexedDB
 */
export async function saveSession(session: ChatSession): Promise<void> {
  const db = getDBInstance();
  await db.saveSession(session);
}

/**
 * Load a single session by ID
 */
export async function loadSession(sessionId: string): Promise<ChatSession | null> {
  const db = getDBInstance();
  return await db.loadSession(sessionId);
}

/**
 * Load all sessions with optional filters
 */
export async function loadAllSessions(options?: {
  includeOpen?: boolean;
  includeClosed?: boolean;
  starredOnly?: boolean;
}): Promise<ChatSession[]> {
  const db = getDBInstance();
  const allSessions = await db.loadAllSessions();

  let filtered = allSessions;

  // Filter by open/closed status
  if (options?.includeOpen !== undefined || options?.includeClosed !== undefined) {
    filtered = filtered.filter(session => {
      if (options.includeOpen && !session.isClosed) return true;
      if (options.includeClosed && session.isClosed) return true;
      return false;
    });
  }

  // Filter by starred status
  if (options?.starredOnly) {
    filtered = filtered.filter(session => session.isStarred);
  }

  return filtered;
}

/**
 * Load only open (non-closed) sessions
 */
export async function loadOpenSessions(): Promise<ChatSession[]> {
  return await loadAllSessions({ includeOpen: true, includeClosed: false });
}

/**
 * Delete a session (only if not starred)
 */
export async function deleteSession(sessionId: string): Promise<{ success: boolean; error?: string }> {
  const db = getDBInstance();
  const session = await db.loadSession(sessionId);

  if (!session) {
    return { success: false, error: 'Session not found' };
  }

  if (session.isStarred) {
    return { success: false, error: 'Cannot delete starred session. Unstar it first.' };
  }

  await db.deleteSession(sessionId);
  return { success: true };
}

/**
 * Toggle the starred status of a session
 */
export async function toggleStarSession(sessionId: string): Promise<boolean> {
  const db = getDBInstance();
  const session = await db.loadSession(sessionId);

  if (!session) {
    throw new Error('Session not found');
  }

  const newStarredStatus = !session.isStarred;
  await db.updateSession(sessionId, { isStarred: newStarredStatus });
  
  return newStarredStatus;
}

/**
 * Update the title of a session
 */
export async function updateSessionTitle(sessionId: string, title: string): Promise<void> {
  const db = getDBInstance();
  await db.updateSession(sessionId, { title });
}

/**
 * Mark a session as closed (but keep in history)
 */
export async function closeSession(sessionId: string): Promise<void> {
  const db = getDBInstance();
  await db.updateSession(sessionId, { isClosed: true });
}

/**
 * Reopen a closed session
 */
export async function reopenSession(sessionId: string): Promise<void> {
  const db = getDBInstance();
  await db.updateSession(sessionId, { isClosed: false });
}

/**
 * Create a new session
 */
export function createNewSession(provider: Provider, model?: string, systemPromptId?: string): ChatSession {
  return {
    id: uuidv4(),
    title: undefined,
    messages: [],
    provider,
    model,
    systemPromptId,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    isStarred: false,
    isClosed: false,
  };
}

/**
 * Auto-generate a title from the first user message
 */
export function generateSessionTitle(firstMessage?: string): string {
  if (!firstMessage) {
    return `Chat ${new Date().toLocaleString('en-US', { 
      month: 'short', 
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit'
    })}`;
  }

  // Take first 40 characters and add ellipsis if longer
  const truncated = firstMessage.slice(0, 40);
  return firstMessage.length > 40 ? `${truncated}...` : truncated;
}

/**
 * Get session count
 */
export async function getSessionCount(): Promise<number> {
  const db = getDBInstance();
  return await db.getSessionCount();
}

/**
 * Clear all sessions (use with caution)
 */
export async function clearAllSessions(): Promise<void> {
  const db = getDBInstance();
  await db.clearAllSessions();
}
