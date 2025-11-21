# RunBack AI - Implementation Summary

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

### IndexedDB (Large Data)
- Chat sessions (optional persistence)
- Chat history archives
- Response history (multiple responses per prompt)

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
- [ ] Chat interface UI
- [ ] Provider/model selection
- [ ] API integration (all 3 providers)
- [ ] Message display (user/AI)
- [ ] Re-run prompt functionality ⭐
- [ ] Response history navigation ⭐
- [ ] Loading states and error handling

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

- [ ] Users can configure API keys for all 3 providers
- [ ] Users can test API connections
- [ ] Users can send messages and receive responses
- [ ] Users can switch providers/models seamlessly
- [ ] Users can re-run prompts and view response history ⭐
- [ ] Users can create/edit/delete system prompts
- [ ] Users can create/edit/delete slash prompts
- [ ] Users can apply system prompts to chat
- [ ] Users can use slash prompts with autocomplete
- [ ] Users can toggle dark/light mode ⭐
- [ ] Theme preference persists
- [ ] App is responsive (320-428px)
- [ ] All data persists in browser ⭐
- [ ] App loads in < 3s
- [ ] Errors handled gracefully
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
