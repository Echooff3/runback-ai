# Product Requirements Document: LLM Swiss Army Knife

## 1. Product Overview

### 1.1 Product Name
**RunBack AI** - Mobile LLM Swiss Army Knife

### 1.2 Product Vision
A mobile-first web application that provides users with a unified interface to interact with multiple leading AI platforms (OpenRouter.ai, Replicate.ai, and Fal.ai), offering flexible prompt management and seamless provider switching in a single, intuitive chat interface.

### 1.3 Target Audience
- Developers and AI enthusiasts who work on-the-go
- Content creators needing mobile access to various AI models
- Power users who want to compare outputs across different AI providers
- Mobile-first users who prefer smartphone/tablet interfaces

### 1.4 Product Goals
- Provide a unified mobile interface for multiple AI platforms
- Enable easy switching between AI providers without context switching
- Offer robust prompt management capabilities
- Maintain secure, local storage of API credentials
- Deliver a responsive, mobile-optimized user experience

---

## 2. Technical Architecture

### 2.1 Technology Stack
- **Framework**: Vite + React (or Vue.js)
- **Language**: TypeScript
- **Styling**: Tailwind CSS (mobile-first approach)
- **State Management**: Zustand or React Context
- **Storage**: LocalStorage/IndexedDB for API keys and prompts
- **HTTP Client**: Axios or Fetch API
- **Build Tool**: Vite

### 2.2 API Integrations

#### OpenRouter.ai
- **Documentation**: https://openrouter.ai/docs/quickstart
- **Authentication**: API Key via Bearer token
- **Endpoint**: `https://openrouter.ai/api/v1/chat/completions`
- **Models**: Access to 100+ models (GPT-4, Claude, Llama, etc.)

#### Replicate.ai
- **Documentation**: https://replicate.com/docs/get-started/nodejs
- **Authentication**: API Token
- **Endpoint**: RESTful API via `replicate` npm package
- **Models**: Image generation, LLMs, audio models

#### Fal.ai
- **Documentation**: https://docs.fal.ai/model-apis/quickstart
- **Authentication**: API Key
- **Endpoint**: Model-specific endpoints
- **Models**: Fast inference for various AI models

### 2.3 Architecture Principles
- **100% Client-Side Application**: No backend server or external databases required
- **Fully Self-Contained**: Can run on personal intranet or localhost
- **Mobile-first responsive design** (320px to 428px primary viewport)
- **Static File Deployment**: Deploy as simple HTML/CSS/JS files
- **Progressive Web App (PWA) capabilities**
- **Local-Only Data Storage**: All data stored in browser (LocalStorage + IndexedDB)
- **Client-side encryption for sensitive data**
- **Offline-capable**: Full functionality without internet (except AI API calls)
- **Modular component architecture**
- **Zero Server Dependencies**: No database, no authentication server, no backend API

### 2.4 Deployment Model
The application is designed to run on a **personal intranet** or **private network**:

**Deployment Options**:
1. **Simple HTTP Server**: Serve from any web server (nginx, Apache, or Python http.server)
2. **Localhost**: Run directly on local machine
3. **Internal Network**: Deploy to company/home intranet
4. **Static Hosting**: Can be hosted on any static file server
5. **No Configuration Required**: Drop files and run

**What's NOT Required**:
- ❌ No database server (PostgreSQL, MySQL, MongoDB, etc.)
- ❌ No backend API server (Node.js, Python, Go, etc.)
- ❌ No authentication server
- ❌ No cloud services (except AI provider APIs)
- ❌ No server-side sessions or cookies
- ❌ No WebSocket server
- ❌ No Redis or cache server

**What IS Required**:
- ✅ Web browser (Chrome, Safari, Firefox, Edge)
- ✅ Web server to serve static files (nginx, Apache, etc.)
- ✅ Internet access to AI provider APIs (OpenRouter, Replicate, Fal.ai)
- ✅ User's own API keys for AI providers

**Example Deployment**:
```bash
# Option 1: Simple Python server
cd dist
python3 -m http.server 8080
# Access at http://localhost:8080

# Option 2: Nginx configuration
server {
    listen 80;
    server_name runback.local;
    root /path/to/runback-ai/dist;
    index index.html;
    
    location / {
        try_files $uri $uri/ /index.html;
    }
}

# Option 3: Docker container (optional)
FROM nginx:alpine
COPY dist /usr/share/nginx/html
EXPOSE 80
```

---

## 3. Core Features

### 3.1 Settings Menu

#### 3.1.1 API Key Management
**User Story**: As a user, I want to securely store my API keys so that I can access AI services without repeatedly entering credentials.

**Requirements**:
- Input fields for three API keys:
  - OpenRouter API Key
  - Replicate API Token
  - Fal.ai API Key
- Visual indicators for:
  - Empty/not configured (grey icon)
  - Configured (green check icon)
  - Invalid/error (red warning icon)
- Masked input fields (show/hide toggle)
- "Test Connection" button for each provider
- Clear/Reset option for each key
- Local storage with encryption
- Warning message about data persistence

**UI Components**:
```
Settings Screen
├── Header: "Settings"
├── API Keys Section
│   ├── OpenRouter Configuration Card
│   │   ├── Label: "OpenRouter API Key"
│   │   ├── Input (password type, toggle visibility)
│   │   ├── Test Connection Button
│   │   └── Status Indicator
│   ├── Replicate Configuration Card
│   │   └── (same structure)
│   └── Fal.ai Configuration Card
│       └── (same structure)
├── Endpoint Management Section (Advanced)
│   ├── Custom OpenRouter Endpoint (optional)
│   ├── Custom Replicate Endpoint (optional)
│   └── Custom Fal.ai Endpoint (optional)
└── Footer: Save Button
```

#### 3.1.2 Endpoint Configuration
**User Story**: As an advanced user, I want to configure custom API endpoints for testing or using alternative deployments.

**Requirements**:
- Optional advanced settings toggle
- URL input for custom endpoints (defaults provided)
- Validation for URL format
- Reset to default button
- Note: "Only change if using custom deployments"

#### 3.1.3 Theme Settings
**User Story**: As a user, I want to switch between dark and light mode to match my preference and environment lighting.

**Requirements**:
- **Theme Toggle**:
  - Segmented control or toggle switch
  - Options: Light, Dark, System (auto)
  - Visual preview of selected theme
  - Instant theme switching (no page reload)
- **System Theme Detection**:
  - Respect `prefers-color-scheme` media query
  - "System" option follows OS theme automatically
  - Update theme when OS preference changes (while "System" is selected)
- **Persistence**:
  - Save theme preference to LocalStorage
  - Apply saved theme on app load
  - Default to "System" on first launch
- **Visual Feedback**:
  - Smooth transition animation when switching themes (200ms)
  - Theme indicator in settings (current theme displayed)
- **Accessibility**:
  - High contrast ratios in both modes (WCAG AA)
  - No loss of functionality in either theme

**UI Components**:
```
Theme Settings Section (in Settings Screen)
├── Header: "Appearance"
├── Theme Selector (Segmented Control)
│   ├── [Light] 
│   ├── [Dark]
│   └── [System]
├── Current Theme Indicator
│   └── "Currently using: Dark mode"
└── Preview Card (shows current theme)
```

**Implementation with Tailwind CSS**:
- Use Tailwind's `dark:` variant for all color classes
- Configure `darkMode: 'class'` in `tailwind.config.js`
- Toggle `dark` class on root `<html>` element
- Example: `bg-white dark:bg-gray-900`

---

### 3.2 Chat Interface

#### 3.2.1 Provider Selection
**User Story**: As a user, I want to easily switch between AI providers to compare responses or access specific models.

**Requirements**:
- Provider selector (dropdown or segmented control)
- Options: OpenRouter, Replicate, Fal.ai
- Visual distinction for selected provider (color-coded)
- Model selector (conditional on provider):
  - OpenRouter: Dropdown with popular models (GPT-4, Claude, etc.)
  - Replicate: Dropdown with available models
  - Fal.ai: Dropdown with available models
- Disabled state if API key not configured
- Current token count/usage indicator (if available)

**UI Components**:
```
Chat Header
├── Provider Selector (Tabs or Dropdown)
│   ├── OpenRouter (Blue)
│   ├── Replicate (Purple)
│   └── Fal.ai (Green)
├── Model Selector (Dropdown)
└── Settings Icon (navigate to settings)
```

#### 3.2.2 Chat Window
**User Story**: As a user, I want a clean, mobile-optimized chat interface to interact with AI models.

**Requirements**:
- Message list (scrollable, reverse chronological)
- User messages (right-aligned, distinct color)
- AI responses (left-aligned, provider-branded color)
- Message metadata:
  - Timestamp
  - Provider/model used
  - Token count (if available)
- Loading indicator during API calls
- Error messages (inline, dismissible)
- Copy message button
- Regenerate response button
- Message input field:
  - Multi-line textarea
  - Auto-resize (max 6 lines)
  - Character counter
  - Send button
  - Attachment button (future feature)
- Pull-to-refresh to clear chat
- System prompt indicator (pill/badge showing active prompt)

**UI Components**:
```
Chat Screen
├── Chat Header (Provider/Model Selection)
├── Active System Prompt Badge (dismissible)
├── Message List
│   ├── Message Bubble (User)
│   │   ├── Text Content
│   │   ├── Timestamp
│   │   └── Actions (Copy, Re-run)
│   └── Message Bubble (AI)
│       ├── Text Content
│       ├── Provider/Model Label
│       ├── Timestamp
│       ├── Response Navigation (if multiple responses exist)
│       │   ├── Previous Response Button (←)
│       │   ├── Response Counter (1 of 3)
│       │   └── Next Response Button (→)
│       └── Actions (Copy, Regenerate)
├── Input Container
│   ├── Slash Command Button (opens prompt selector)
│   ├── System Prompt Button (opens system prompt selector)
│   ├── Message Input (Textarea)
│   └── Send Button
└── Bottom Navigation (if applicable)
```

#### 3.2.3 Response History & Re-run Feature
**User Story**: As a user, I want to re-run my prompts and flip through multiple responses to compare different AI outputs.

**Requirements**:
- **Re-run Button**: 
  - Available on user message bubbles
  - Icon: Refresh/Re-run symbol (↻)
  - Sends the same prompt again with current settings
  - Each re-run creates a new response in the history
- **Response History Navigation**:
  - Appears on AI response bubbles when multiple responses exist
  - Navigation controls:
    - Left arrow (←) - View previous response
    - Counter display - "1 of 3", "2 of 3", etc.
    - Right arrow (→) - View next response
  - Smooth transition animation when switching responses
  - Current response index highlighted
- **Response Metadata**:
  - Each response stores:
    - Response content
    - Timestamp of generation
    - Provider and model used
    - Token count (if available)
    - Response time/latency
    - Generation number (1st, 2nd, 3rd attempt)
- **History Management**:
  - All responses linked to the original user message
  - Max responses per prompt: 10 (configurable)
  - When limit reached, oldest response is replaced
  - Option to delete individual responses
  - Option to pin/favorite specific responses
- **Visual Indicators**:
  - Badge showing total responses count on user message
  - Active response indicator (highlighted in navigation)
  - Different border color for messages with multiple responses
  - Timestamp shows when currently viewed response was generated

**Behavior**:
1. User sends initial message → First response generated
2. User clicks "Re-run" on their message → Second response generated
3. AI bubble now shows navigation: "← 1 of 2 →"
4. User can flip between responses using arrows
5. User can re-run again → Third response added
6. Navigation updates to "← 1 of 3 →"
7. Each response maintains its own metadata

**UI Example**:
```
User Message Bubble:
┌──────────────────────────┐
│ Explain quantum physics  │
│ 12:34 PM        [↻] [⎘] │ ← Re-run button
│ 3 responses              │ ← Response count badge
└──────────────────────────┘

AI Response Bubble (with history):
┌────────────────────────────────┐
│ Quantum physics is...          │
│ [Continued response text...]   │
│                                │
│ ┌────────────────────────────┐ │
│ │  ← │ Response 2 of 3 │ →  │ │ ← Navigation
│ └────────────────────────────┘ │
│                                │
│ OpenRouter • GPT-4             │
│ Generated: 12:35 PM            │
│ Tokens: 150 • 1.2s            │
│                      [↻] [⎘]  │
└────────────────────────────────┘
```

---

### 3.3 System Prompts Management

#### 3.3.1 System Prompts Overview
**User Story**: As a user, I want to create and manage reusable system prompts to set consistent context for my AI conversations.

**Definition**: System prompts are instructions sent to the AI model that define its behavior, role, or context for the entire conversation.

**Requirements**:
- CRUD operations for system prompts
- List view of all system prompts:
  - Prompt name (required)
  - Prompt content preview (first 50 chars)
  - Created/modified date
  - Active indicator (checkmark if currently applied)
  - Action buttons (Edit, Delete, Apply)
- Default prompts included:
  - "Default" (empty/neutral)
  - "Helpful Assistant"
  - "Code Expert"
  - "Creative Writer"
- Search/filter functionality
- Sorting options (A-Z, Date, Most Used)
- Import/Export functionality (JSON format)

#### 3.3.2 Create/Edit System Prompt
**Requirements**:
- Modal or full-screen form:
  - Prompt Name (text input, required, max 50 chars)
  - Prompt Content (textarea, required, max 2000 chars)
  - Character counter
  - Description (optional, max 200 chars)
  - Tags (optional, for categorization)
- Preview mode (show how prompt will be sent)
- Save & Apply button (saves and activates)
- Save button (saves without activating)
- Cancel button (with unsaved changes warning)
- Delete button (with confirmation)

**UI Components**:
```
System Prompts Screen
├── Header: "System Prompts"
├── Search Bar
├── Sort/Filter Controls
├── Add New Button (FAB or header button)
├── Prompts List
│   └── Prompt Card
│       ├── Title
│       ├── Preview
│       ├── Metadata (date, usage count)
│       ├── Active Badge
│       └── Actions (Edit, Delete, Apply)
└── Import/Export Buttons (footer)

Edit Prompt Modal/Screen
├── Header: "Edit System Prompt"
├── Name Input
├── Content Textarea
├── Description Input (optional)
├── Tags Input (optional)
├── Preview Section
└── Actions (Save, Save & Apply, Cancel, Delete)
```

---

### 3.4 Slash Prompts Management

#### 3.4.1 Slash Prompts Overview
**User Story**: As a user, I want to create and use slash commands to quickly insert template text or trigger specific prompt patterns in my messages.

**Definition**: Slash prompts are quick-access templates that can be inserted into user messages via `/command` syntax, similar to Discord or Slack commands.

**Requirements**:
- CRUD operations for slash prompts
- List view of all slash prompts:
  - Command name (e.g., `/summarize`, `/translate`)
  - Description
  - Prompt template preview
  - Usage count
  - Action buttons (Edit, Delete, Use)
- Default slash prompts included:
  - `/summarize` - "Summarize the following text:"
  - `/translate` - "Translate the following to {language}:"
  - `/explain` - "Explain this in simple terms:"
  - `/code` - "Generate code for:"
  - `/debug` - "Debug this code:"
- Search/filter functionality
- Autocomplete in chat input (trigger on `/`)
- Template variables support (e.g., `{text}`, `{language}`)
- Import/Export functionality (JSON format)

#### 3.4.2 Create/Edit Slash Prompt
**Requirements**:
- Modal or full-screen form:
  - Command Name (text input, required, must start with `/`, max 30 chars)
  - Validation: No spaces, alphanumeric + underscores only
  - Description (text input, required, max 100 chars)
  - Template Content (textarea, required, max 1000 chars)
  - Template Variables section:
    - Detected variables display (e.g., `{text}`, `{language}`)
    - Variable description inputs
  - Character counter
- Preview mode (with sample variable values)
- Save button
- Cancel button (with unsaved changes warning)
- Delete button (with confirmation)

**UI Components**:
```
Slash Prompts Screen
├── Header: "Slash Prompts"
├── Search Bar
├── Add New Button (FAB or header button)
├── Prompts List
│   └── Slash Prompt Card
│       ├── Command (/command)
│       ├── Description
│       ├── Template Preview
│       ├── Usage Count
│       └── Actions (Edit, Delete)
└── Import/Export Buttons (footer)

Edit Slash Prompt Modal/Screen
├── Header: "Edit Slash Prompt"
├── Command Name Input (with / prefix)
├── Description Input
├── Template Textarea
├── Detected Variables List
│   └── Variable Input (for each detected variable)
├── Preview Section (with sample data)
└── Actions (Save, Cancel, Delete)

Autocomplete Dropdown (in chat)
├── Filter: User types "/"
├── Matching Commands List
│   └── Command Item
│       ├── Command Name
│       ├── Description
│       └── Preview
└── Keyboard Navigation Support
```

---

## 4. User Flows

### 4.1 First-Time User Flow
1. User lands on app → Welcome screen
2. "Get Started" button → Settings screen
3. User enters API key(s) for at least one provider
4. "Test Connection" → Success feedback
5. "Start Chatting" → Chat screen with provider pre-selected

### 4.2 Chat Interaction Flow
1. User selects provider (OpenRouter/Replicate/Fal.ai)
2. User optionally selects model
3. User optionally applies system prompt
4. User types message (or uses slash prompt)
5. User sends message
6. Loading indicator appears
7. AI response displays
8. User can copy, regenerate, or continue conversation

### 4.3 Prompt Management Flow
1. User navigates to System Prompts or Slash Prompts
2. User views list of existing prompts
3. User creates new prompt:
   - Fills in name and content
   - Saves prompt
4. User applies/uses prompt in chat
5. User can edit or delete prompts as needed

---

## 5. UI/UX Specifications

### 5.1 Design Principles
- **Mobile-First**: Optimize for touch interactions, thumb zones
- **Minimalist**: Clean interface, reduce cognitive load
- **Accessible**: WCAG 2.1 AA compliance
- **Performant**: Fast load times, smooth animations
- **Responsive**: Support 320px to 428px viewports (primary), scale up to tablet

### 5.2 Color Palette

#### Light Mode
- **Primary**: #4F46E5 (Indigo-600) - Main actions, links
- **Secondary**: #10B981 (Emerald-500) - Success states
- **Accent**: #8B5CF6 (Violet-500) - Highlights
- **Error**: #EF4444 (Red-500) - Errors, warnings
- **Background**: 
  - Primary: #FFFFFF (White)
  - Secondary: #F9FAFB (Gray-50)
  - Tertiary: #F3F4F6 (Gray-100)
- **Text**: 
  - Primary: #111827 (Gray-900)
  - Secondary: #6B7280 (Gray-500)
  - Tertiary: #9CA3AF (Gray-400)
- **Border**: #E5E7EB (Gray-200)
- **Shadow**: rgba(0, 0, 0, 0.1)

#### Dark Mode
- **Primary**: #6366F1 (Indigo-500) - Main actions, links
- **Secondary**: #10B981 (Emerald-500) - Success states
- **Accent**: #A78BFA (Violet-400) - Highlights
- **Error**: #F87171 (Red-400) - Errors, warnings
- **Background**: 
  - Primary: #111827 (Gray-900)
  - Secondary: #1F2937 (Gray-800)
  - Tertiary: #374151 (Gray-700)
- **Text**: 
  - Primary: #F9FAFB (Gray-50)
  - Secondary: #D1D5DB (Gray-300)
  - Tertiary: #9CA3AF (Gray-400)
- **Border**: #374151 (Gray-700)
- **Shadow**: rgba(0, 0, 0, 0.3)

#### Provider Colors (Both Modes)
- **OpenRouter**: #3B82F6 (Blue-500)
- **Replicate**: #8B5CF6 (Violet-500)
- **Fal.ai**: #10B981 (Emerald-500)

#### Tailwind CSS Implementation
```javascript
// tailwind.config.js
module.exports = {
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Custom provider colors
        'openrouter': '#3B82F6',
        'replicate': '#8B5CF6',
        'fal': '#10B981',
      }
    }
  }
}
```

**Usage Examples**:
- Background: `bg-white dark:bg-gray-900`
- Text: `text-gray-900 dark:text-gray-50`
- Border: `border-gray-200 dark:border-gray-700`
- Card: `bg-gray-50 dark:bg-gray-800`
- Input: `bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-50`

### 5.3 Typography
- **Font Family**: System font stack (SF Pro, Roboto, Helvetica)
- **Sizes**:
  - H1: 24px (screen titles)
  - H2: 20px (section headers)
  - Body: 16px (main content)
  - Small: 14px (metadata, captions)
  - Tiny: 12px (labels, timestamps)

### 5.4 Spacing
- Base unit: 4px
- Common spacing: 8px, 12px, 16px, 24px, 32px
- Screen padding: 16px horizontal
- Component gaps: 12px

### 5.5 Components
- **Buttons**: 
  - Height: 44px (touch-friendly)
  - Border radius: 8px
  - Primary, Secondary, Ghost variants
- **Input Fields**:
  - Height: 44px minimum
  - Border radius: 8px
  - Focus state: Ring outline
- **Cards**:
  - Border radius: 12px
  - Shadow: subtle elevation
  - Padding: 16px
- **Modal**:
  - Slide up animation
  - Backdrop overlay
  - Swipe-to-dismiss support

### 5.6 Navigation
- **Tab Bar** (bottom navigation):
  - Chat (Home)
  - System Prompts
  - Slash Prompts
  - Settings
- **Gesture Support**:
  - Swipe left/right: Switch providers (in chat)
  - Swipe down: Dismiss modal/keyboard
  - Pull down: Refresh/clear chat
  - Long press: Context menu

---

## 6. Data Models

### 6.1 App Settings
```typescript
interface AppSettings {
  theme: 'light' | 'dark' | 'system';
  apiConfigs: APIConfig[];
  version: string;
}
```

### 6.2 API Configuration
```typescript
interface APIConfig {
  provider: 'openrouter' | 'replicate' | 'fal';
  apiKey: string;
  endpoint?: string; // optional custom endpoint
  isConfigured: boolean;
  lastTested?: Date;
  testStatus?: 'success' | 'error';
}
```

### 6.3 System Prompt
```typescript
interface SystemPrompt {
  id: string; // UUID
  name: string;
  content: string;
  description?: string;
  tags?: string[];
  createdAt: Date;
  updatedAt: Date;
  usageCount: number;
  isDefault: boolean;
}
```

### 6.3 Slash Prompt
```typescript
interface SlashPrompt {
  id: string; // UUID
  command: string; // e.g., "/summarize"
  description: string;
  template: string;
  variables: {
    name: string;
    description: string;
    defaultValue?: string;
  }[];
  createdAt: Date;
  updatedAt: Date;
  usageCount: number;
  isDefault: boolean;
}
```

### 6.4 AI Response
```typescript
interface AIResponse {
  id: string; // UUID
  content: string;
  provider: 'openrouter' | 'replicate' | 'fal';
  model?: string;
  timestamp: Date;
  generationNumber: number; // 1st, 2nd, 3rd attempt
  metadata?: {
    tokenCount?: number;
    responseTime?: number;
    cost?: number;
  };
}
```

### 6.5 Chat Message
```typescript
interface ChatMessage {
  id: string; // UUID
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  
  // For user messages - tracking re-runs
  responses?: AIResponse[]; // Array of all responses for this prompt
  currentResponseIndex?: number; // Which response is currently displayed (0-based)
  
  // For assistant messages (backward compatibility)
  provider?: 'openrouter' | 'replicate' | 'fal';
  model?: string;
  metadata?: {
    tokenCount?: number;
    responseTime?: number;
    cost?: number;
  };
}
```

### 6.6 Chat Session
```typescript
interface ChatSession {
  id: string; // UUID
  messages: ChatMessage[];
  systemPromptId?: string;
  provider: 'openrouter' | 'replicate' | 'fal';
  model?: string;
  createdAt: Date;
  updatedAt: Date;
}
```

---

## 6.5 Local Storage Strategy

### 6.5.1 Overview
All user data is stored locally in the browser using a combination of **LocalStorage** and **IndexedDB** to ensure persistence, privacy, and offline capability. No data is sent to external servers except API calls to AI providers.

### 6.5.2 Storage Keys and Structure

#### LocalStorage (for small, frequently accessed data)
```typescript
// Storage keys
const STORAGE_KEYS = {
  THEME: 'runback_theme',              // 'light' | 'dark' | 'system'
  API_CONFIGS: 'runback_api_configs',  // APIConfig[]
  SYSTEM_PROMPTS: 'runback_system_prompts', // SystemPrompt[]
  SLASH_PROMPTS: 'runback_slash_prompts',   // SlashPrompt[]
  ACTIVE_PROMPT_ID: 'runback_active_prompt_id', // string | null
  APP_VERSION: 'runback_app_version',  // string
  LAST_PROVIDER: 'runback_last_provider', // 'openrouter' | 'replicate' | 'fal'
  LAST_MODEL: 'runback_last_model',    // string
  ONBOARDING_COMPLETE: 'runback_onboarding_complete', // boolean
};
```

**Example Storage Structure**:
```json
{
  "runback_theme": "dark",
  "runback_api_configs": [
    {
      "provider": "openrouter",
      "apiKey": "sk-xxx...",
      "endpoint": "https://openrouter.ai/api/v1/chat/completions",
      "isConfigured": true,
      "lastTested": "2024-11-21T12:00:00Z",
      "testStatus": "success"
    }
  ],
  "runback_system_prompts": [...],
  "runback_slash_prompts": [...],
  "runback_active_prompt_id": "uuid-123",
  "runback_last_provider": "openrouter",
  "runback_last_model": "openai/gpt-4"
}
```

#### IndexedDB (for large data like chat history)
**Database Name**: `runback_db`
**Version**: 1

**Object Stores**:
1. **chat_sessions**: Stores complete conversation history
   - Key: session ID (string)
   - Indexes: createdAt, updatedAt, provider
   
2. **chat_messages**: Stores individual messages
   - Key: message ID (string)
   - Indexes: sessionId, timestamp, role

**Example IndexedDB Structure**:
```typescript
// chat_sessions store
{
  id: "session-uuid-1",
  messages: [...], // Full message array
  systemPromptId: "prompt-uuid",
  provider: "openrouter",
  model: "gpt-4",
  createdAt: "2024-11-21T10:00:00Z",
  updatedAt: "2024-11-21T10:30:00Z"
}
```

### 6.5.3 Data Persistence Operations

#### Save Operations
```typescript
// Save theme preference
function saveTheme(theme: 'light' | 'dark' | 'system'): void {
  localStorage.setItem(STORAGE_KEYS.THEME, theme);
}

// Save API configuration
function saveAPIConfig(config: APIConfig): void {
  const configs = getAPIConfigs();
  const index = configs.findIndex(c => c.provider === config.provider);
  if (index >= 0) {
    configs[index] = config;
  } else {
    configs.push(config);
  }
  localStorage.setItem(STORAGE_KEYS.API_CONFIGS, JSON.stringify(configs));
}

// Save system prompt
function saveSystemPrompt(prompt: SystemPrompt): void {
  const prompts = getSystemPrompts();
  const index = prompts.findIndex(p => p.id === prompt.id);
  if (index >= 0) {
    prompts[index] = prompt;
  } else {
    prompts.push(prompt);
  }
  localStorage.setItem(STORAGE_KEYS.SYSTEM_PROMPTS, JSON.stringify(prompts));
}

// Save slash prompt
function saveSlashPrompt(prompt: SlashPrompt): void {
  const prompts = getSlashPrompts();
  const index = prompts.findIndex(p => p.id === prompt.id);
  if (index >= 0) {
    prompts[index] = prompt;
  } else {
    prompts.push(prompt);
  }
  localStorage.setItem(STORAGE_KEYS.SLASH_PROMPTS, JSON.stringify(prompts));
}

// Save chat session to IndexedDB
async function saveChatSession(session: ChatSession): Promise<void> {
  const db = await openDatabase();
  const tx = db.transaction('chat_sessions', 'readwrite');
  await tx.store.put(session);
}
```

#### Load Operations
```typescript
// Load theme preference
function loadTheme(): 'light' | 'dark' | 'system' {
  return localStorage.getItem(STORAGE_KEYS.THEME) as any || 'system';
}

// Load API configurations
function getAPIConfigs(): APIConfig[] {
  const data = localStorage.getItem(STORAGE_KEYS.API_CONFIGS);
  return data ? JSON.parse(data) : [];
}

// Load system prompts
function getSystemPrompts(): SystemPrompt[] {
  const data = localStorage.getItem(STORAGE_KEYS.SYSTEM_PROMPTS);
  return data ? JSON.parse(data) : getDefaultSystemPrompts();
}

// Load slash prompts
function getSlashPrompts(): SlashPrompt[] {
  const data = localStorage.getItem(STORAGE_KEYS.SLASH_PROMPTS);
  return data ? JSON.parse(data) : getDefaultSlashPrompts();
}

// Load chat sessions from IndexedDB
async function getChatSessions(): Promise<ChatSession[]> {
  const db = await openDatabase();
  return await db.getAll('chat_sessions');
}
```

### 6.5.4 Storage Size Management

**LocalStorage Limits**: ~5-10MB per origin (browser dependent)
**IndexedDB Limits**: Much larger, typically 50MB+ (browser dependent)

**Size Management Strategy**:
1. **Monitor Storage Usage**:
   ```typescript
   function getStorageSize(): number {
     let total = 0;
     for (let key in localStorage) {
       if (key.startsWith('runback_')) {
         total += localStorage[key].length;
       }
     }
     return total;
   }
   ```

2. **Automatic Cleanup**:
   - Limit chat sessions to last 50 conversations
   - Limit responses per prompt to 10
   - Implement LRU (Least Recently Used) eviction
   - Warn user when storage reaches 80% capacity

3. **Manual Cleanup Options**:
   - Clear old chat history (keep last N days)
   - Export and delete old conversations
   - Clear all data option in settings

### 6.5.5 Data Migration and Versioning

```typescript
interface StorageVersion {
  version: number;
  migrateFrom: (oldVersion: number) => void;
}

const CURRENT_STORAGE_VERSION = 1;

function migrateStorage(): void {
  const storedVersion = parseInt(
    localStorage.getItem('runback_storage_version') || '0'
  );
  
  if (storedVersion < CURRENT_STORAGE_VERSION) {
    // Perform migration
    if (storedVersion === 0) {
      // Initial setup - add default prompts
      initializeDefaultData();
    }
    // Future migrations here
    
    localStorage.setItem(
      'runback_storage_version', 
      CURRENT_STORAGE_VERSION.toString()
    );
  }
}
```

### 6.5.6 Security Considerations

**API Key Storage**:
- Store in LocalStorage (easily accessible but convenient)
- Option to use Base64 encoding (minimal obfuscation)
- Future: Implement Web Crypto API for encryption

**Best Practices**:
- Never log storage contents to console in production
- Clear storage on logout (future feature)
- Validate data on load (handle corrupted data)
- No sensitive data in session storage

### 6.5.7 Storage Events and Sync

```typescript
// Listen for storage changes (multi-tab support)
window.addEventListener('storage', (event) => {
  if (event.key?.startsWith('runback_')) {
    // Reload affected data
    refreshAppState();
  }
});
```

### 6.5.8 Backup and Export

**User Data Export** (JSON format):
```typescript
async function exportUserData(): Promise<Blob> {
  const data = {
    version: CURRENT_STORAGE_VERSION,
    exportDate: new Date().toISOString(),
    theme: loadTheme(),
    apiConfigs: getAPIConfigs().map(c => ({...c, apiKey: '***'})), // Redact keys
    systemPrompts: getSystemPrompts(),
    slashPrompts: getSlashPrompts(),
    chatSessions: await getChatSessions(),
  };
  
  return new Blob(
    [JSON.stringify(data, null, 2)],
    { type: 'application/json' }
  );
}
```

**User Data Import**:
```typescript
async function importUserData(file: File): Promise<void> {
  const text = await file.text();
  const data = JSON.parse(text);
  
  // Validate structure
  if (!data.version || !data.systemPrompts) {
    throw new Error('Invalid backup file');
  }
  
  // Import data (prompt for API keys separately)
  localStorage.setItem(STORAGE_KEYS.SYSTEM_PROMPTS, JSON.stringify(data.systemPrompts));
  localStorage.setItem(STORAGE_KEYS.SLASH_PROMPTS, JSON.stringify(data.slashPrompts));
  
  // Import chat sessions to IndexedDB
  if (data.chatSessions) {
    for (const session of data.chatSessions) {
      await saveChatSession(session);
    }
  }
}
```

### 6.5.9 Data Stored Summary

| Data Type | Storage | Size Estimate | Persistence |
|-----------|---------|---------------|-------------|
| Theme preference | LocalStorage | <1KB | Permanent |
| API keys (3 providers) | LocalStorage | 1-2KB | Permanent |
| System prompts | LocalStorage | 10-50KB | Permanent |
| Slash prompts | LocalStorage | 5-20KB | Permanent |
| App settings | LocalStorage | 1-5KB | Permanent |
| Chat sessions (current) | IndexedDB | 100KB-5MB | Session (can be made permanent) |
| Chat history (archived) | IndexedDB | 1-50MB | Optional |

**Total Estimated Storage**: 1-55MB (well within browser limits)

**Important Notes**:
- ✅ **All data stored locally in the browser** - no external database required
- ✅ **No server-side storage** - perfect for personal intranet deployment
- ✅ **Data stays on user's machine** - privacy guaranteed
- ✅ **Portable between devices** - export/import functionality
- ⚠️ **Browser-specific** - data doesn't sync across browsers automatically
- ⚠️ **Clear browser data = data loss** - users should export backups regularly

---

## 7. API Integration Details

### 7.1 OpenRouter Integration
**Endpoint**: `POST https://openrouter.ai/api/v1/chat/completions`

**Request Headers**:
```
Authorization: Bearer {apiKey}
Content-Type: application/json
HTTP-Referer: {app_url}
X-Title: {app_name}
```

**Request Body**:
```json
{
  "model": "openai/gpt-4",
  "messages": [
    {"role": "system", "content": "System prompt here"},
    {"role": "user", "content": "User message"}
  ]
}
```

**Response**:
```json
{
  "id": "gen-xxx",
  "choices": [{
    "message": {
      "role": "assistant",
      "content": "AI response"
    }
  }],
  "usage": {
    "prompt_tokens": 10,
    "completion_tokens": 50,
    "total_tokens": 60
  }
}
```

### 7.2 Replicate Integration
**Using**: `replicate` npm package

**Installation**: `npm install replicate`

**Usage**:
```typescript
import Replicate from "replicate";

const replicate = new Replicate({
  auth: apiKey,
});

const output = await replicate.run(
  "meta/llama-2-70b-chat:latest",
  {
    input: {
      prompt: "User message with system prompt prepended"
    }
  }
);
```

### 7.3 Fal.ai Integration
**Endpoint**: Model-specific (e.g., `https://fal.run/{model}`)

**Using**: `@fal-ai/serverless-client` npm package

**Installation**: `npm install @fal-ai/serverless-client`

**Usage**:
```typescript
import * as fal from "@fal-ai/serverless-client";

fal.config({
  credentials: apiKey,
});

const result = await fal.subscribe("fal-ai/fast-llm", {
  input: {
    prompt: "User message",
    system_prompt: "System prompt"
  },
  logs: true,
});
```

---

## 8. Security & Privacy

### 8.1 Data Storage & Privacy Model
**Core Principle**: **100% Local, Zero Server-Side Storage**

The application follows a **privacy-first, local-only architecture**:

- ✅ **All data stored in user's browser** (LocalStorage + IndexedDB)
- ✅ **No external databases** - PostgreSQL, MySQL, MongoDB, etc. NOT required
- ✅ **No backend server** - No data transmitted to application servers
- ✅ **No user accounts** - No authentication system needed
- ✅ **No cloud sync** - Data stays on local machine
- ✅ **No cookies** - Except browser's own storage mechanisms
- ✅ **No server logs** - Because there's no server to log to
- ✅ **Perfect for personal intranet** - Self-contained, air-gap friendly

**Data Flow**:
```
User's Browser → AI Provider APIs (OpenRouter/Replicate/Fal.ai)
      ↓
Local Storage
(Browser only)
```

**What Leaves the Browser**:
- ❗ API calls to AI providers (OpenRouter, Replicate, Fal.ai)
- ❗ User messages and AI responses (to/from AI providers only)

**What NEVER Leaves the Browser**:
- ✅ API keys (stored locally only)
- ✅ System prompts and slash prompts
- ✅ App settings and preferences
- ✅ Chat history (unless user exports)
- ✅ Theme preferences
- ✅ Any user configuration

### 8.2 API Key Security
- **Storage**: LocalStorage with Base64 encoding (basic obfuscation)
- **Access**: Only accessible within the same origin
- **Transmission**: Sent directly to AI providers (HTTPS only)
- **Visibility**: Masked in UI with show/hide toggle
- **Warning**: Users informed that keys are stored in browser
- **Future Enhancement**: Web Crypto API for encryption

**Security Best Practices**:
```typescript
// API keys are stored but never logged
const apiKey = localStorage.getItem('runback_api_key');
// Never: console.log(apiKey);

// API keys masked in UI
<input type="password" value={apiKey} />

// API keys sent only to legitimate providers
const response = await fetch('https://openrouter.ai/api/v1/...', {
  headers: { 'Authorization': `Bearer ${apiKey}` }
});
```

### 8.3 Personal Intranet Security

**Deployment Security** (for intranet use):
- **Network Isolation**: Deploy behind firewall on private network
- **Access Control**: Use web server authentication (Basic Auth, etc.)
- **HTTPS Optional**: Can run on HTTP within trusted network
- **No External Dependencies**: No calls to external services except AI APIs
- **Air-Gap Compatible**: Can run offline for prompt management

**Recommended Nginx Configuration** (for intranet):
```nginx
server {
    listen 80;
    server_name runback.local;
    root /var/www/runback-ai/dist;
    
    # Optional: Basic authentication
    auth_basic "RunBack AI Access";
    auth_basic_user_file /etc/nginx/.htpasswd;
    
    # Security headers
    add_header X-Frame-Options "SAMEORIGIN";
    add_header X-Content-Type-Options "nosniff";
    add_header X-XSS-Protection "1; mode=block";
    
    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

### 8.4 Content Security Policy
```html
<meta http-equiv="Content-Security-Policy" 
      content="
        default-src 'self';
        script-src 'self' 'unsafe-inline';
        style-src 'self' 'unsafe-inline';
        connect-src 'self' 
          https://openrouter.ai 
          https://api.replicate.com 
          https://fal.run;
        img-src 'self' data: https:;
      ">
```

### 8.5 Privacy Guarantees
- ❌ **No telemetry**: Zero analytics or tracking
- ❌ **No third-party scripts**: No Google Analytics, no ads
- ❌ **No external fonts**: System fonts only
- ❌ **No CDN dependencies**: All assets bundled locally
- ❌ **No server logs**: Because there's no server
- ❌ **No user profiling**: No accounts, no tracking
- ✅ **100% Private**: Your data never touches our servers (because we don't have any)
- ✅ **Open Source**: Code can be audited for privacy compliance

### 8.6 Data Management Options
**User Controls**:
- Export all data (JSON format) for backup
- Import data from backup file
- Clear specific data types (prompts, settings, history)
- Clear all data (full reset)
- No "sync" or "cloud backup" - intentionally not implemented

### 8.7 Compliance & Transparency
**Privacy Statement**:
> "RunBack AI is a 100% client-side application. All data is stored locally in your browser. 
> We have no servers, no databases, and no way to access your data. Your API keys and 
> conversations are private and never leave your device except when making direct API 
> calls to your chosen AI providers (OpenRouter, Replicate, Fal.ai). This makes RunBack AI 
> ideal for personal intranet deployment where data sovereignty is critical."

**Suitable For**:
- ✅ Personal use on private networks
- ✅ Corporate intranet (no data exfiltration risk)
- ✅ Air-gapped environments (with offline mode)
- ✅ GDPR/CCPA compliance (no data collection)
- ✅ Sensitive work environments
- ✅ Users who value privacy

---

## 9. Performance Requirements

### 9.1 Load Time
- Initial page load: < 2 seconds (3G network)
- Time to interactive: < 3 seconds
- Code splitting for lazy-loaded routes

### 9.2 Runtime Performance
- 60 FPS animations
- Response to user input: < 100ms
- Message send latency: < 500ms (excluding API time)

### 9.3 Bundle Size
- Initial bundle: < 150KB (gzipped)
- Lazy-loaded chunks: < 50KB each
- Total app size: < 500KB

### 9.4 Offline Support
- Service Worker for app shell caching
- Offline access to prompts and settings
- Queue messages for retry when connection restored (future)

---

## 10. Testing Requirements

### 10.1 Unit Tests
- Component logic
- State management
- Data transformations
- Utility functions
- Coverage target: > 80%

### 10.2 Integration Tests
- API client functions (with mocks)
- Prompt CRUD operations
- Settings persistence
- Chat flow

### 10.3 E2E Tests
- Critical user flows:
  - First-time setup
  - Send message with each provider
  - Create and apply system prompt
  - Use slash prompt in chat
- Tool: Playwright or Cypress

### 10.4 Manual Testing
- Cross-browser testing (Chrome, Safari, Firefox mobile)
- Device testing (iOS, Android)
- Touch interaction testing
- Accessibility testing (screen readers, keyboard nav)

---

## 11. Implementation Phases

### Phase 1: Foundation (MVP)
**Duration**: 2-3 weeks

**Deliverables**:
- Project setup (Vite + React/Vue + TypeScript + Tailwind CSS)
- Tailwind CSS dark mode configuration
- Dark/Light theme toggle with system detection
- Basic routing and navigation
- Settings screen with API key management
- Theme settings section
- LocalStorage persistence (API keys, theme preference)
- Mobile-responsive layout foundation
- GitHub Actions CI/CD pipeline

**Success Criteria**:
- App loads on mobile devices
- Users can save API keys
- Users can toggle between dark and light mode
- Theme preference persists across sessions
- API keys persist across sessions
- GitHub Actions successfully builds and creates runback-ai.zip

### Phase 2: Chat Core
**Duration**: 2-3 weeks

**Deliverables**:
- Chat interface implementation
- Provider selector (OpenRouter, Replicate, Fal.ai)
- Model selector (conditional on provider)
- Message display (user and AI)
- API integration for all three providers
- Error handling and loading states
- Re-run prompt functionality
- Response history navigation with flip-through UI

**Success Criteria**:
- Users can send messages and receive responses
- All three providers work correctly
- Errors are displayed gracefully
- Chat history is maintained during session
- Users can re-run prompts and view multiple responses
- Response navigation (prev/next) works smoothly

### Phase 3: Prompt Management
**Duration**: 2-3 weeks

**Deliverables**:
- System prompts CRUD interface
- Slash prompts CRUD interface
- Default prompts seeded
- Apply system prompt in chat
- Slash command autocomplete in chat
- Import/Export functionality

**Success Criteria**:
- Users can create, edit, delete prompts
- System prompts affect AI behavior
- Slash prompts insert into messages
- Prompts persist across sessions

### Phase 4: Polish & Optimization
**Duration**: 1-2 weeks

**Deliverables**:
- UI/UX refinements
- Performance optimization
- Accessibility improvements
- PWA setup (manifest, service worker)
- Documentation (README, user guide)
- Testing and bug fixes

**Success Criteria**:
- App meets performance benchmarks
- No critical bugs
- Accessible to screen readers
- Installable as PWA
- User documentation complete

---

## 12. Success Metrics

### 12.1 User Engagement
- Daily active users (DAU)
- Messages sent per user per session
- Average session duration
- Return user rate (day 1, day 7, day 30)

### 12.2 Feature Adoption
- % of users with configured API keys
- % of users using system prompts
- % of users using slash prompts
- % of users switching between providers

### 12.3 Technical Metrics
- API request success rate (> 95%)
- Average API response time
- App crash rate (< 0.1%)
- Page load time (P50, P95)

### 12.4 User Satisfaction
- User feedback/ratings (if collected)
- Feature request themes
- Bug report frequency

---

## 13. Future Considerations

### 13.1 Potential Features (Post-MVP)
- **Chat History**: Persistent conversation history across sessions
- **Multi-Modal Support**: Image generation, audio transcription
- **Prompt Marketplace**: Share and discover prompts
- **Batch Processing**: Send multiple prompts at once
- **Cost Tracking**: Monitor API usage and costs per provider
- **Collaborative Prompts**: Share conversations via link
- **Voice Input**: Speech-to-text for message input
- **Custom Themes**: User-defined color schemes beyond dark/light
- **Keyboard Shortcuts**: Power user features
- **Export Conversations**: Download as Markdown, PDF, JSON
- **Advanced Settings**: Temperature, max tokens, etc.
- **Provider Comparison**: Send same prompt to multiple providers side-by-side
- **Favorites**: Star messages or conversations
- **Response Diff View**: Compare different responses to same prompt
- **Streaming Responses**: Real-time token-by-token display

### 13.2 Technical Enhancements
- End-to-end encryption for API keys
- Backend service for improved security (optional)
- Real-time sync across devices
- Better offline support with message queue
- WebSocket support for streaming responses
- Plugin system for extensibility

### 13.3 Platform Expansion
- Native mobile apps (iOS, Android via React Native)
- Desktop app (Electron)
- Browser extension
- CLI tool

---

## 14. Dependencies

### 14.1 Required NPM Packages
```json
{
  "dependencies": {
    "react": "^18.x",
    "react-dom": "^18.x",
    "react-router-dom": "^6.x",
    "zustand": "^4.x",
    "axios": "^1.x",
    "replicate": "latest",
    "@fal-ai/serverless-client": "latest",
    "uuid": "^9.x",
    "date-fns": "^2.x"
  },
  "devDependencies": {
    "@vitejs/plugin-react": "^4.x",
    "vite": "^5.x",
    "typescript": "^5.x",
    "tailwindcss": "^3.x",
    "autoprefixer": "^10.x",
    "postcss": "^8.x",
    "@types/react": "^18.x",
    "@types/react-dom": "^18.x",
    "eslint": "^8.x",
    "prettier": "^3.x",
    "vitest": "^1.x",
    "@testing-library/react": "^14.x"
  }
}
```

### 14.2 External Services

**Required** (for AI functionality):
- OpenRouter.ai - AI model access (user's API key required)
- Replicate.ai - AI model access (user's API key required)
- Fal.ai - AI model access (user's API key required)

**NOT Required** (zero server dependencies):
- ❌ Backend API server - NOT needed
- ❌ Database server - NOT needed (uses browser storage)
- ❌ Authentication service - NOT needed (no user accounts)
- ❌ Cloud hosting with backend - NOT needed (static files only)
- ❌ WebSocket server - NOT needed
- ❌ Message queue - NOT needed
- ❌ Cache server (Redis, Memcached) - NOT needed
- ❌ CDN for assets - NOT needed (all bundled)

**Deployment Options** (choose any):
- **Personal Intranet**: Any web server (nginx, Apache, IIS)
- **Localhost**: Python http.server, Node.js serve, etc.
- **Static Hosting**: Vercel, Netlify, GitHub Pages (optional)
- **Docker Container**: Simple nginx container with files
- **Network Share**: Even a file:// path works (with limitations)

**Internet Requirements**:
- Only needed for making API calls to AI providers
- Prompt management and settings work offline
- Perfect for air-gapped networks (with pre-configured settings)

### 14.3 CI/CD Pipeline

#### GitHub Actions Workflow
A GitHub Actions workflow is configured to automate the build and packaging process.

**Workflow File**: `.github/workflows/build.yml`

**Triggers**:
- Push to `main` or `develop` branches
- Pull requests to `main` branch
- Manual workflow dispatch

**Build Steps**:
1. Checkout repository code
2. Setup Node.js (v20) with npm caching
3. Install dependencies (`npm ci`)
4. Build Vite application (`npm run build`)
5. Create zip archive of dist folder → `runback-ai.zip`
6. Upload build artifact (30-day retention)
7. Post build info as PR comment (size, date)

**Artifact Output**:
- **Name**: `runback-ai`
- **File**: `runback-ai.zip`
- **Contents**: Complete built application ready for deployment
- **Location**: GitHub Actions artifacts (downloadable from Actions tab)

**Features**:
- Automatic builds on every push/PR
- Build artifact available for download
- PR comments with build status and package size
- Cached dependencies for faster builds
- Production-ready zip package

---

## 15. Risks & Mitigations

### 15.1 Technical Risks

| Risk | Impact | Probability | Mitigation |
|------|--------|-------------|------------|
| API rate limits exceeded | High | Medium | Implement client-side rate limiting, show usage warnings |
| Provider API changes breaking integration | High | Low | Version lock APIs, monitor changelogs, add fallback handling |
| LocalStorage size limits reached | Medium | Low | Implement data cleanup, warn users, use IndexedDB for larger data |
| Mobile browser compatibility issues | High | Medium | Test on multiple browsers/devices, use polyfills, progressive enhancement |
| Performance on low-end devices | Medium | Medium | Code splitting, lazy loading, performance budgets |

### 15.2 Security Risks

| Risk | Impact | Probability | Mitigation |
|------|--------|-------------|------------|
| API keys stolen via XSS | Critical | Low | CSP headers, input sanitization, consider encryption |
| Man-in-the-middle attacks | High | Low | HTTPS only, HSTS headers |
| Local storage access by malicious scripts | High | Low | CSP, code audits, avoid eval() |

### 15.3 Product Risks

| Risk | Impact | Probability | Mitigation |
|------|--------|-------------|------------|
| Low user adoption | High | Medium | Focus on UX, gather early feedback, iterate quickly |
| Provider costs too high for users | Medium | Medium | Add cost estimation, transparent pricing info |
| Feature complexity overwhelming users | Medium | Medium | Phased rollout, onboarding flow, tooltips |

---

## 16. Acceptance Criteria

The product is considered complete when:

1. ✅ Users can configure API keys for all three providers (OpenRouter, Replicate, Fal.ai)
2. ✅ Users can test API connections and see status indicators
3. ✅ Users can send messages and receive responses from all providers
4. ✅ Users can switch between providers and models seamlessly
5. ✅ Users can re-run prompts and navigate through response history
6. ✅ Users can create, read, update, and delete system prompts
7. ✅ Users can create, read, update, and delete slash prompts
8. ✅ Users can apply system prompts to chat conversations
9. ✅ Users can use slash prompts via autocomplete in chat
10. ✅ Users can toggle between dark and light mode
11. ✅ Dark/light mode preference persists across sessions
12. ✅ The app is fully responsive on mobile devices (320px-428px)
13. ✅ All data persists across browser sessions
14. ✅ The app loads in under 3 seconds on 3G network
15. ✅ Error states are handled gracefully with user-friendly messages
16. ✅ The app is accessible (keyboard navigation, screen reader support)
17. ✅ Unit tests cover critical business logic (>80% coverage)
18. ✅ E2E tests cover primary user flows
19. ✅ Documentation (README, setup guide) is complete
20. ✅ GitHub Actions build pipeline creates runback-ai.zip artifact

---

## 17. Appendix

### 17.1 Glossary
- **System Prompt**: Instructions that define the AI's behavior for an entire conversation
- **Slash Prompt**: Quick-insert templates triggered by `/command` syntax
- **Provider**: AI service provider (OpenRouter, Replicate, or Fal.ai)
- **Model**: Specific AI model within a provider (e.g., GPT-4, Llama 2)
- **API Key**: Authentication credential for accessing provider APIs
- **PWA**: Progressive Web App - web app with native-like features

### 17.2 References
- OpenRouter Documentation: https://openrouter.ai/docs
- Replicate Documentation: https://replicate.com/docs
- Fal.ai Documentation: https://docs.fal.ai
- Vite Documentation: https://vitejs.dev
- React Documentation: https://react.dev
- Tailwind CSS Documentation: https://tailwindcss.com

### 17.3 Wireframe Descriptions

#### Chat Screen (Mobile - 375px width)
```
┌─────────────────────────────────┐
│  [≡] Chat          [@] Settings │ ← Header (64px)
├─────────────────────────────────┤
│  [OpenRouter ▼] [GPT-4 ▼]      │ ← Provider/Model (56px)
├─────────────────────────────────┤
│  [System: Code Expert] [x]      │ ← Active prompt badge (48px)
├─────────────────────────────────┤
│                                 │
│     ┌───────────────────┐       │
│     │ User message here │       │ ← User message
│     │ 12:34 PM          │       │
│     └───────────────────┘       │
│                                 │
│  ┌──────────────────────────┐   │
│  │ AI response here         │   │ ← AI message
│  │ OpenRouter • GPT-4       │   │
│  │ 12:34 PM     [↻] [⎘]    │   │
│  └──────────────────────────┘   │
│                                 │ ← Scrollable area
│  [Loading...]                   │
│                                 │
├─────────────────────────────────┤
│ [/] [§] ┌──────────────┐ [→]   │ ← Input (72px)
│         │ Message...   │        │
│         └──────────────┘        │
└─────────────────────────────────┘
```

#### Settings Screen (Mobile - 375px width) - Light Mode
```
┌─────────────────────────────────┐
│  [←] Settings                   │ ← Header (bg-white)
├─────────────────────────────────┤
│                                 │
│  Appearance                     │ ← Section header
│                                 │
│  ┌───────────────────────────┐  │
│  │  [Light] [Dark] [System]  │  │ ← Segmented control
│  │  Currently: Light mode    │  │
│  └───────────────────────────┘  │
│                                 │
│  API Keys                       │ ← Section header
│                                 │
│  ┌───────────────────────────┐  │
│  │ 🔵 OpenRouter             │  │
│  │ ┌─────────────────┐ [👁] │  │
│  │ │ ••••••••••••••• │      │  │
│  │ └─────────────────┘       │  │
│  │ [Test Connection]   ✅    │  │
│  └───────────────────────────┘  │
│                                 │
│  ┌───────────────────────────┐  │
│  │ 🟣 Replicate              │  │
│  │ ┌─────────────────┐ [👁] │  │
│  │ │                 │      │  │ ← Scrollable
│  │ └─────────────────┘       │  │
│  │ [Test Connection]   ⚪    │  │
│  └───────────────────────────┘  │
│                                 │
│  ┌───────────────────────────┐  │
│  │ 🟢 Fal.ai                 │  │
│  │ ┌─────────────────┐ [👁] │  │
│  │ │ ••••••••••••••• │      │  │
│  │ └─────────────────┘       │  │
│  │ [Test Connection]   ✅    │  │
│  └───────────────────────────┘  │
│                                 │
└─────────────────────────────────┘
```

#### Settings Screen (Mobile - 375px width) - Dark Mode
```
┌─────────────────────────────────┐
│  [←] Settings                   │ ← Header (bg-gray-900)
├─────────────────────────────────┤
│                                 │ ← Background: dark gray
│  Appearance                     │ ← Text: light gray
│                                 │
│  ┌───────────────────────────┐  │
│  │  [Light] [Dark] [System]  │  │ ← Dark selected
│  │  Currently: Dark mode     │  │
│  └───────────────────────────┘  │
│                                 │
│  API Keys                       │
│                                 │
│  ┌───────────────────────────┐  │ ← Cards: bg-gray-800
│  │ 🔵 OpenRouter             │  │
│  │ ┌─────────────────┐ [👁] │  │
│  │ │ ••••••••••••••• │      │  │ ← Input: bg-gray-700
│  │ └─────────────────┘       │  │
│  │ [Test Connection]   ✅    │  │
│  └───────────────────────────┘  │
│                                 │
│  ┌───────────────────────────┐  │
│  │ 🟣 Replicate              │  │
│  │ ┌─────────────────┐ [👁] │  │
│  │ │                 │      │  │
│  │ └─────────────────┘       │  │
│  │ [Test Connection]   ⚪    │  │
│  └───────────────────────────┘  │
│                                 │
│  ┌───────────────────────────┐  │
│  │ 🟢 Fal.ai                 │  │
│  │ ┌─────────────────┐ [👁] │  │
│  │ │ ••••••••••••••• │      │  │
│  │ └─────────────────┘       │  │
│  │ [Test Connection]   ✅    │  │
│  └───────────────────────────┘  │
│                                 │
└─────────────────────────────────┘
```

#### System Prompts Screen (Mobile - 375px width)
```
┌─────────────────────────────────┐
│  [←] System Prompts      [+]    │ ← Header
├─────────────────────────────────┤
│  ┌─────────────────────────┐    │
│  │ 🔍 Search prompts...    │    │
│  └─────────────────────────┘    │
├─────────────────────────────────┤
│                                 │
│  ┌───────────────────────────┐  │
│  │ ⭐ Code Expert           │  │
│  │ You are an expert...     │  │
│  │ Modified: 2h ago         │  │
│  │ [Edit] [Delete] [Apply]  │  │
│  └───────────────────────────┘  │
│                                 │ ← Scrollable
│  ┌───────────────────────────┐  │
│  │ Helpful Assistant ✓      │  │ ← Active
│  │ You are a helpful...     │  │
│  │ Modified: 1d ago         │  │
│  │ [Edit] [Delete] [Apply]  │  │
│  └───────────────────────────┘  │
│                                 │
│  ┌───────────────────────────┐  │
│  │ Creative Writer          │  │
│  │ You are a creative...    │  │
│  │ Modified: 3d ago         │  │
│  │ [Edit] [Delete] [Apply]  │  │
│  └───────────────────────────┘  │
│                                 │
└─────────────────────────────────┘
```

---

## Document Version
- **Version**: 1.0
- **Date**: November 21, 2024
- **Author**: Product Team
- **Status**: Draft for Review

## Change Log
| Date | Version | Changes | Author |
|------|---------|---------|--------|
| 2024-11-21 | 1.0 | Initial PRD creation | Product Team |

---

**Next Steps**:
1. Review and approve PRD with stakeholders
2. Create detailed technical design document
3. Set up project repository and development environment
4. Begin Phase 1 implementation
5. Schedule weekly sprint planning and reviews
