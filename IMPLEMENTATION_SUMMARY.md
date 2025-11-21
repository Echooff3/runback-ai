# RunBack AI - Implementation Summary

## Recent Updates

### 🎉 Enhanced Model Selector (November 2024)
The model selector has been upgraded from a simple dropdown to a **full-screen modal with dynamic model fetching and fuzzy search**:

**Key Features:**
- 📱 **Full-screen modal** on mobile (slide-up animation)
- 🔍 **Fuzzy search** for quick filtering
- 🌐 **Dynamic model fetching** from provider APIs (OpenRouter, Replicate, Fal.ai)
- 👆 **Touch-friendly** with 44px min row height
- 🎨 **Dark mode support**
- ⚡ **Graceful fallbacks** when API fetch fails

See [MODEL_SELECTOR.md](./MODEL_SELECTOR.md) for detailed documentation.

---

## Quick Reference Guide

This document provides a quick overview of the key features and requirements for implementing the RunBack AI application.

---

## Core Requirements Summary

### ✅ Must-Have Features
1. **API Provider Integration** (3 providers)
   - OpenRouter.ai
   - Replicate.ai
   - Fal.ai
   
2. **Settings Management**
   - API key storage and configuration
   - Connection testing for each provider
   - Theme toggle (Light/Dark/System)
   - Custom endpoint configuration (advanced)

3. **Chat Interface**
   - Provider selector
   - Model selector (per provider)
   - Message history with user/AI bubbles
   - **Re-run prompt functionality**
   - **Response history navigation** (flip through multiple responses)
   - Copy messages
   - Loading states and error handling

4. **System Prompts** (CRUD operations)
   - Create, read, update, delete
   - Apply to conversations
   - Default prompts included
   - Import/Export functionality

5. **Slash Prompts** (CRUD operations)
   - Create, read, update, delete
   - Autocomplete in chat (trigger with `/`)
   - Template variables support
   - Default commands included

6. **Theme Support**
   - Light mode
   - Dark mode
   - System preference detection
   - Tailwind CSS implementation

7. **Local Storage**
   - All data stored in browser (LocalStorage + IndexedDB)
   - API keys, prompts, settings, chat history
   - Export/Import functionality
   - NO external database

---

## Technology Stack

```javascript
{
  "framework": "Vite + React (or Vue)",
  "language": "TypeScript",
  "styling": "Tailwind CSS (with dark mode)",
  "stateManagement": "Zustand or React Context",
  "storage": "LocalStorage + IndexedDB",
  "build": "Vite",
  "testing": "Vitest + Playwright",
  "cicd": "GitHub Actions"
}
```

---

## Architecture Principles

### 🎯 Core Design Philosophy
- **100% Client-Side**: No backend server required
- **Zero External Dependencies**: No database servers, no API servers
- **Privacy-First**: All data stays in the browser
- **Intranet-Ready**: Deploy on any web server
- **Mobile-First**: Optimized for 320-428px viewports
- **Offline-Capable**: Prompts and settings work without internet

### 📦 Deployment Model
```
Static Files (HTML/CSS/JS)
    ↓
Simple Web Server (nginx/Apache/Python)
    ↓
Browser (Chrome/Safari/Firefox)
    ↓
Local Storage (No Database Needed!)
```

---

## Data Storage Strategy

### LocalStorage (Small, Frequently Accessed)
- Theme preference
- API keys (Base64 encoded)
- System prompts
- Slash prompts
- App settings
- Last used provider/model

### IndexedDB (Large Data) ✅ IMPLEMENTED
- ✅ Chat sessions with full persistence
- ✅ Chat history with metadata (timestamps, provider, model)
- ✅ Response history (multiple responses per prompt)
- ✅ Session management (starred, closed, deleted states)
- ✅ Indexes for efficient queries (createdAt, updatedAt, isStarred, isClosed)

### Storage Keys
```typescript
runback_theme                 // 'light' | 'dark' | 'system'
runback_api_configs           // API configurations array
runback_system_prompts        // System prompts array
runback_slash_prompts         // Slash prompts array
runback_active_prompt_id      // Currently active prompt
runback_last_provider         // Last selected provider
runback_last_model            // Last selected model
```

---

## Key Features Detail

### 1. Response History Feature ⭐ NEW
When a user re-runs a prompt:
- Original prompt stores multiple AI responses
- Navigation UI appears: `← 1 of 3 →`
- Users can flip through different responses
- Each response maintains metadata (timestamp, model, tokens)
- Max 10 responses per prompt (configurable)

```typescript
interface ChatMessage {
  // User message
  responses?: AIResponse[];  // All responses for this prompt
  currentResponseIndex?: number;  // Which one is displayed
}

interface AIResponse {
  content: string;
  provider: string;
  timestamp: Date;
  generationNumber: number;  // 1st, 2nd, 3rd attempt
}
```

### 2. Dark Mode Support 🌙 NEW
Using Tailwind CSS dark mode:
- Configure `darkMode: 'class'` in tailwind.config.js
- Toggle `dark` class on `<html>` element
- Use `dark:` variant for all colors
- Example: `bg-white dark:bg-gray-900`
- System preference detection via `prefers-color-scheme`

### 3. Provider Integration
Each provider has unique implementation:

**OpenRouter** (HTTP REST API):
```typescript
fetch('https://openrouter.ai/api/v1/chat/completions', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${apiKey}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    model: 'openai/gpt-4',
    messages: [...]
  })
});
```

**Replicate** (npm package):
```typescript
import Replicate from 'replicate';
const replicate = new Replicate({ auth: apiKey });
await replicate.run('meta/llama-2-70b-chat:latest', {...});
```

**Fal.ai** (npm package):
```typescript
import * as fal from '@fal-ai/serverless-client';
fal.config({ credentials: apiKey });
await fal.subscribe('fal-ai/fast-llm', {...});
```

---

## UI Components Structure

### Main Routes
```
/                  → Chat (default)
/settings          → Settings (API keys, theme)
/system-prompts    → System Prompts Manager
/slash-prompts     → Slash Prompts Manager
```

### Component Hierarchy
```
App
├── ThemeProvider (handles dark/light mode)
├── Router
│   ├── ChatScreen
│   │   ├── ChatHeader (provider/model selector)
│   │   ├── SystemPromptBadge
│   │   ├── MessageList
│   │   │   ├── UserMessage (with re-run button)
│   │   │   └── AIMessage (with response navigation)
│   │   └── ChatInput (with slash command support)
│   ├── SettingsScreen
│   │   ├── ThemeToggle
│   │   └── APIKeyManager
│   ├── SystemPromptsScreen
│   │   └── PromptList (CRUD operations)
│   └── SlashPromptsScreen
│       └── SlashPromptList (CRUD operations)
└── BottomNavigation (mobile)
```

---

## Implementation Phases

### Phase 1: Foundation (2-3 weeks)
- [ ] Vite + React/Vue + TypeScript setup
- [ ] Tailwind CSS with dark mode configuration
- [ ] Basic routing and navigation
- [ ] Theme toggle (Light/Dark/System)
- [ ] Settings screen with API key management
- [ ] LocalStorage persistence layer
- [ ] Mobile-responsive layout
- [ ] GitHub Actions CI/CD

### Phase 2: Chat Core (2-3 weeks)
- [x] Chat interface UI
- [x] Provider/model selection
- [x] API integration (all 3 providers)
- [x] Message display (user/AI)
- [x] Re-run prompt functionality ⭐
- [x] Response history navigation ⭐
- [x] Loading states and error handling
- [x] **Multi-tab chat sessions** ⭐ NEW
- [x] **Persistent session storage (IndexedDB)** ⭐ NEW
- [x] **Starred sessions with delete protection** ⭐ NEW
- [x] **Session history management** ⭐ NEW

### Phase 3: Prompt Management (2-3 weeks)
- [ ] System prompts CRUD
- [ ] Slash prompts CRUD
- [ ] Default prompts seeding
- [ ] Apply system prompt in chat
- [ ] Slash command autocomplete
- [ ] Import/Export functionality

### Phase 4: Polish & Optimization (1-2 weeks)
- [ ] UI/UX refinements
- [ ] Performance optimization
- [ ] Accessibility (WCAG AA)
- [ ] PWA setup (service worker, manifest)
- [ ] Testing (unit + E2E)
- [ ] Documentation

---

## Default Content

### Default System Prompts
1. **Default**: Empty/neutral
2. **Helpful Assistant**: "You are a helpful AI assistant..."
3. **Code Expert**: "You are an expert programmer..."
4. **Creative Writer**: "You are a creative writing assistant..."

### Default Slash Prompts
1. `/summarize` - "Summarize the following text:"
2. `/translate` - "Translate the following to {language}:"
3. `/explain` - "Explain this in simple terms:"
4. `/code` - "Generate code for:"
5. `/debug` - "Debug this code:"

---

## Tailwind CSS Configuration

### tailwind.config.js
```javascript
module.exports = {
  darkMode: 'class',  // Enable class-based dark mode
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'openrouter': '#3B82F6',
        'replicate': '#8B5CF6',
        'fal': '#10B981',
      }
    }
  }
}
```

### Color Usage Examples
```html
<!-- Background -->
<div class="bg-white dark:bg-gray-900">

<!-- Text -->
<p class="text-gray-900 dark:text-gray-50">

<!-- Border -->
<div class="border-gray-200 dark:border-gray-700">

<!-- Card -->
<div class="bg-gray-50 dark:bg-gray-800">

<!-- Input -->
<input class="bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-50">

<!-- Button -->
<button class="bg-indigo-600 dark:bg-indigo-500 text-white">
```

---

## GitHub Actions Workflow

### Build Pipeline
File: `.github/workflows/build.yml`

**Triggers**:
- Push to `main` or `develop`
- Pull requests to `main`
- Manual dispatch

**Steps**:
1. Checkout code
2. Setup Node.js 20
3. Install dependencies (`npm ci`)
4. Build app (`npm run build`)
5. Create `runback-ai.zip` from `dist` folder
6. Upload artifact (30-day retention)
7. Comment on PR with build info

**Output**: `runback-ai.zip` ready for deployment

---

## Security Considerations

### ✅ What's Secure
- All data stored locally (no external servers)
- API keys never sent to application servers
- Direct API calls to providers only
- No telemetry or tracking
- Open source (auditable)

### ⚠️ User Responsibilities
- Keep API keys secure
- Clear browser data = data loss (export backups!)
- API keys stored in browser (browser security applies)
- HTTPS recommended for production

### 🔒 Deployment Security
For intranet deployment:
- Deploy behind firewall
- Use web server authentication (Basic Auth, etc.)
- Network isolation
- Optional: HTTPS with self-signed cert

---

## Testing Strategy

### Unit Tests (Vitest)
- Component logic
- State management
- Storage operations
- Utility functions
- Target: >80% coverage

### E2E Tests (Playwright)
- First-time setup flow
- Send message with each provider
- Create and apply system prompt
- Use slash prompt in chat
- Theme toggle
- Export/import data

---

## Performance Targets

- Initial load: < 2s (3G)
- Time to interactive: < 3s
- Bundle size: < 150KB (gzipped)
- 60 FPS animations
- Response to input: < 100ms

---

## Deployment Instructions

### Option 1: Simple Python Server
```bash
cd dist
python3 -m http.server 8080
# Access at http://localhost:8080
```

### Option 2: Nginx
```nginx
server {
    listen 80;
    server_name runback.local;
    root /var/www/runback-ai/dist;
    index index.html;
    
    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

### Option 3: Docker
```dockerfile
FROM nginx:alpine
COPY dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

```bash
docker build -t runback-ai .
docker run -p 8080:80 runback-ai
```

---

## Acceptance Criteria Checklist

- [x] Users can configure API keys for all 3 providers
- [x] Users can test API connections
- [x] Users can send messages and receive responses
- [x] Users can switch providers/models seamlessly
- [x] Users can re-run prompts and view response history ⭐
- [x] **Users can create multiple chat tabs/sessions** ⭐ NEW
- [x] **Users can switch between chat sessions** ⭐ NEW
- [x] **Users can star sessions to prevent deletion** ⭐ NEW
- [x] **Users can close tabs (keeps in history)** ⭐ NEW
- [x] **Users can view/manage all sessions in history** ⭐ NEW
- [x] **Sessions persist across browser sessions** ⭐ NEW
- [ ] Users can create/edit/delete system prompts
- [ ] Users can create/edit/delete slash prompts
- [ ] Users can apply system prompts to chat
- [ ] Users can use slash prompts with autocomplete
- [x] Users can toggle dark/light mode ⭐
- [x] Theme preference persists
- [x] App is responsive (320-428px)
- [x] All data persists in browser (LocalStorage + IndexedDB) ⭐
- [ ] App loads in < 3s
- [x] Errors handled gracefully
- [ ] Accessible (keyboard nav, screen readers)
- [ ] Tests cover critical paths
- [ ] Documentation complete
- [ ] GitHub Actions builds runback-ai.zip ⭐

---

## Quick Start Development

```bash
# 1. Create Vite project
npm create vite@latest runback-ai -- --template react-ts

# 2. Install dependencies
cd runback-ai
npm install react-router-dom zustand axios replicate @fal-ai/serverless-client uuid date-fns

# 3. Install Tailwind CSS
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init -p

# 4. Configure Tailwind (add darkMode: 'class')
# Edit tailwind.config.js

# 5. Create storage utility
# src/lib/storage.ts

# 6. Start development
npm run dev

# 7. Build for production
npm run build

# 8. Test the build
cd dist && python3 -m http.server 8080
```

---

## Recent Implementation: Multi-Tab Chat System (Phase 2 Enhancement)

### Overview
Implemented a comprehensive multi-tab chat system with persistent storage, allowing users to maintain multiple concurrent conversations with different models and providers.

### Features Implemented

#### 1. **IndexedDB Storage Layer**
- **File**: `src/lib/storage/indexedDB.ts`
- Database: `runback_db` (version 1)
- Object Store: `chat_sessions` with indexes on `createdAt`, `updatedAt`, `isStarred`, `isClosed`, `provider`
- Full CRUD operations: save, load, loadAll, delete, update, clear
- Singleton pattern for connection management
- Automatic database initialization and upgrades

#### 2. **Session Storage Abstraction**
- **File**: `src/lib/storage/sessionStorage.ts`
- High-level functions wrapping IndexedDB operations
- Functions: `saveSession`, `loadSession`, `loadAllSessions`, `loadOpenSessions`, `deleteSession`, `toggleStarSession`, `updateSessionTitle`, `closeSession`, `reopenSession`
- Auto-title generation from first message
- Delete protection for starred sessions

#### 3. **Enhanced ChatSession Type**
- **File**: `src/types/index.ts`
- Added fields:
  - `title?: string` - Session display name (auto-generated or custom)
  - `isStarred: boolean` - Protection flag preventing deletion/closure
  - `isClosed: boolean` - Distinguishes active tabs from history

#### 4. **Refactored Chat Store**
- **File**: `src/stores/chatStore.ts`
- State changes:
  - `sessions: ChatSession[]` - Array of all open sessions
  - `activeSessionId: string | null` - Currently displayed session
  - Removed single `initSession` in favor of `createNewSession`
- New actions:
  - `loadSessions()` - Load open sessions from IndexedDB
  - `loadAllSessions()` - Load all sessions (including closed)
  - `createNewSession()` - Create and persist new session
  - `switchSession()` - Change active session
  - `closeSessionTab()` - Mark session as closed, remove from tabs
  - `reopenSession()` - Reopen closed session
  - `deleteSession()` - Permanently delete (if not starred)
  - `toggleStarSession()` - Toggle starred status
  - `updateSessionTitle()` - Update session display name
  - `saveCurrentSession()` - Manual save trigger
- Auto-save on every message change (non-blocking)
- Auto-generates title from first user message

#### 5. **Session Tab Components**

**SessionTab** (`src/components/chat/SessionTab.tsx`):
- Displays individual tab with title, star icon, close button
- Star button: filled ★ when starred, outline ☆ when not
- Close button disabled for starred sessions (with tooltip)
- Truncates long titles with ellipsis
- Active state styling (indigo background)
- Hover states and transitions

**SessionTabs** (`src/components/chat/SessionTabs.tsx`):
- Horizontal scrollable tab bar
- "+" button to create new sessions
- Maps through all open sessions
- Handles tab clicks, close, and star actions
- Mobile-responsive with scroll support

#### 6. **Updated ChatScreen**
- **File**: `src/components/chat/ChatScreen.tsx`
- Renders `SessionTabs` component above chat interface
- Loads sessions from IndexedDB on mount
- Creates initial session if none exist
- Maintains provider/model selection per session
- Messages tied to active session only

#### 7. **Session History Component**
- **File**: `src/components/settings/SessionHistory.tsx`
- Complete session management interface in Settings
- Features:
  - Search by title, provider, or model
  - Filter by starred status (button toggle)
  - Filter by open/closed/all sessions (dropdown)
  - Star/unstar sessions (toggles protection)
  - Delete sessions (disabled if starred, with tooltip)
  - Reopen closed sessions
  - Display metadata: provider, model, message count, last updated
  - Visual indicators for starred (★) and closed sessions
  - Refresh button to reload from IndexedDB
- Mobile-responsive layout with flexbox
- Color-coded providers (blue=OpenRouter, purple=Replicate, green=Fal)

#### 8. **Updated Settings Screen**
- **File**: `src/components/settings/SettingsScreen.tsx`
- Added Session History section after API Keys
- New section with divider for visual separation
- Integrated `SessionHistory` component

### Data Flow

1. **Session Creation**:
   - User clicks "+" → `createNewSession()` → Save to IndexedDB → Add to store → Switch to new session

2. **Message Sending**:
   - User sends message → `addUserMessage()` → Auto-generate title if first message → Update session → Auto-save to IndexedDB (async)

3. **AI Response**:
   - Response received → `addAIResponse()` → Append to message responses → Update session → Auto-save to IndexedDB (async)

4. **Tab Closing**:
   - User clicks X on tab → Check if starred → If not starred: `closeSessionTab()` → Mark `isClosed: true` → Save → Remove from active tabs
   - If starred: Button disabled, tooltip shows "Unstar to close"

5. **Session Deletion** (from History):
   - User clicks delete → Check if starred → If not starred: Confirm dialog → `deleteSession()` → Remove from IndexedDB
   - If starred: Button disabled, tooltip shows "Unstar to delete"

6. **Session Starring**:
   - User clicks star icon → `toggleStarSession()` → Update `isStarred` → Save to IndexedDB → Update UI

### Storage Structure

**IndexedDB Schema**:
```typescript
Database: runback_db (v1)
  ObjectStore: chat_sessions
    - keyPath: 'id'
    - indexes:
      - 'createdAt' (non-unique)
      - 'updatedAt' (non-unique)
      - 'isStarred' (non-unique)
      - 'isClosed' (non-unique)
      - 'provider' (non-unique)
```

**ChatSession Object**:
```typescript
{
  id: string;                    // UUID
  title?: string;                // Auto-generated or custom
  messages: ChatMessage[];       // Full conversation
  systemPromptId?: string;       // Linked system prompt
  provider: Provider;            // 'openrouter' | 'replicate' | 'fal'
  model?: string;                // Model ID
  createdAt: string;             // ISO timestamp
  updatedAt: string;             // ISO timestamp
  isStarred: boolean;            // Protection flag
  isClosed: boolean;             // Active vs history
}
```

### User Workflows

**Creating Multiple Chats**:
1. User opens app → First session auto-created
2. User clicks "+" → New session created with same provider/model
3. User can switch models per tab independently
4. Each tab maintains its own conversation

**Protecting Important Conversations**:
1. User stars a session (click ★ icon)
2. Close button becomes disabled with tooltip
3. Session appears in history with filled star
4. Delete button in history becomes disabled
5. Must unstar before closing or deleting

**Managing History**:
1. User goes to Settings → Chat History
2. Can search for sessions by keyword
3. Can filter by starred, open, or closed
4. Can star/unstar any session
5. Can delete unstarred sessions (with confirmation)
6. Can reopen closed sessions (adds back to tabs)

### Technical Decisions

**Why IndexedDB over LocalStorage?**
- LocalStorage limited to ~5-10MB
- Chat sessions with multiple messages exceed this quickly
- IndexedDB provides ~50MB+ storage per domain
- Better performance for large datasets
- Structured querying with indexes

**Why Starred Protection?**
- Prevents accidental deletion of important conversations
- Two-step process (unstar → delete) for safety
- Visual indicators (filled star, disabled buttons)
- Tooltips explain why actions are disabled

**Why Auto-Save?**
- No "save" button needed
- Async saves don't block UI
- Users never lose work
- Fires on every message change
- Error handling with console logging

**Why Separate Open/Closed States?**
- Closed sessions stay in history for reference
- Users can close tabs without losing data
- Can reopen sessions later
- Keeps tab bar uncluttered

### Files Modified/Created

**Created**:
- `src/lib/storage/indexedDB.ts` (206 lines)
- `src/lib/storage/sessionStorage.ts` (159 lines)
- `src/components/chat/SessionTab.tsx` (75 lines)
- `src/components/chat/SessionTabs.tsx` (56 lines)
- `src/components/settings/SessionHistory.tsx` (265 lines)

**Modified**:
- `src/types/index.ts` - Added `title`, `isStarred`, `isClosed` to ChatSession
- `src/lib/storage/constants.ts` - Added IndexedDB config constants
- `src/stores/chatStore.ts` - Complete refactor for multi-session
- `src/components/chat/ChatScreen.tsx` - Added SessionTabs, load/create logic
- `src/components/settings/SettingsScreen.tsx` - Added SessionHistory section

### Testing Recommendations

1. **Session Creation**: Create multiple sessions, verify persistence after refresh
2. **Session Switching**: Switch between tabs, verify messages stay separate
3. **Star Protection**: Star session, verify close/delete disabled
4. **Search/Filter**: Test search and filter combinations in history
5. **Delete**: Delete unstarred session, verify removed from DB
6. **Reopen**: Close tab, verify appears in history, reopen successfully
7. **Auto-Title**: Send message, verify title auto-generated from first message
8. **Provider/Model**: Change per-session, verify independent configs
9. **Large Data**: Create 20+ sessions with many messages, verify performance
10. **Browser Refresh**: Verify all sessions persist and restore correctly

### Known Limitations

- No session export/import yet (future enhancement)
- No session search by message content (only title/provider/model)
- No session renaming UI (title is auto-generated)
- No session archiving (separate from closed state)
- No storage quota monitoring/cleanup
- No offline sync between devices

### Future Enhancements

- Manual session title editing (inline edit)
- Session folders/tags for organization
- Export/import sessions as JSON
- Search within message content
- Session archiving (separate from closed)
- Storage quota warnings and cleanup UI
- LRU cleanup for old sessions (keep starred)
- Session statistics (token usage, cost estimates)

---

## Resources

- **PRD**: `/PRD.md` (comprehensive product requirements)
- **Workflow**: `/.github/workflows/build.yml` (CI/CD pipeline)
- **OpenRouter Docs**: https://openrouter.ai/docs
- **Replicate Docs**: https://replicate.com/docs
- **Fal.ai Docs**: https://docs.fal.ai
- **Vite Docs**: https://vitejs.dev
- **Tailwind Docs**: https://tailwindcss.com
- **React Docs**: https://react.dev

---

## Summary

RunBack AI is a **privacy-first, mobile-optimized LLM interface** that:
- Runs 100% in the browser (no backend)
- Connects to 3 AI providers (OpenRouter, Replicate, Fal.ai)
- Stores all data locally (no external database)
- Supports dark/light mode (Tailwind CSS)
- Enables prompt re-running with response history
- Perfect for personal intranet deployment
- Built with Vite + React + TypeScript + Tailwind CSS

**Start with Phase 1, build iteratively, and test frequently!**
