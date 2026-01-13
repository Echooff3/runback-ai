# RunBack AI 🚀

**A Privacy-First, Mobile-Optimized LLM Swiss Army Knife**

Swiss army knife LLM tool tightly integrated with [OpenRouter.ai](https://openrouter.ai), [Replicate.ai](https://replicate.ai), and [Fal.ai](https://fal.ai) - designed exclusively for mobile and personal intranet deployment.

[![Build Status](https://github.com/Echooff3/runback-ai/actions/workflows/build.yml/badge.svg)](https://github.com/Echooff3/runback-ai/actions/workflows/build.yml)

---

## What's New

- 🧠 **Topic Change Detection & Auto-Checkpointing** — AI automatically detects topic changes using Phi-3 Mini classifier, creates checkpoints to preserve context, and displays visual indicators with debugging info (OpenRouter only). See [TOPIC_CHANGE_DETECTION.md](./TOPIC_CHANGE_DETECTION.md).
- ✨ **Helper Model & AI Polisher** — add a helper model for background tasks and a "Polish" feature for music prompts (configurable in Settings).
- 🚀 **FAL queue-based async processing** — queue submission, viewport-aware polling (10s), real-time status badges & logs, and media asset rendering (images/video/audio) with download support.
- 🗂️ **Multi-tab chat sessions** — create multiple tabs, star sessions to protect from deletion, persistent storage in IndexedDB, session history UI for searching/filtering/reopening.
- 🎉 **Enhanced Model Selector** — full-screen modal, fuzzy search, dynamic model fetching, provider-scoped parameter storage.
- 🔐 **Provider-scoped model parameters** — model parameter forms and storage are stored per provider+model to avoid collisions.
- 📤 **Import/Export** — backup and restore all app data (excluding API keys) with merge or replace modes.
- 🗂️ **System & Slash Prompts** — complete CRUD operations with autocomplete, templates, and default prompt seeding.

For full details, see [IMPLEMENTATION_SUMMARY.md](./IMPLEMENTATION_SUMMARY.md) and [MODEL_SELECTOR.md](./MODEL_SELECTOR.md).

---

## ✨ Current Status: Phase 3 Complete, Phase 4 In Progress

✅ **Phase 1: Foundation** - Settings, Theme Support, API Key Management (COMPLETE)
✅ **Phase 2: Chat Core** - Provider Integration, Multi-Tab Sessions, Enhanced Model Selection (COMPLETE)
✅ **Phase 3: Prompt Management** - System Prompts, Slash Prompts, Import/Export (COMPLETE)
🚧 **Phase 4: Polish & Optimization** - UI/UX Refinements, Performance, Accessibility (IN PROGRESS)

### Implemented Features:
- 🗂️ **Multi-Tab Chat Sessions** - Create unlimited tabs, star important sessions, persistent storage
- 🧠 **Topic Change Detection** - AI automatically detects topic changes and creates checkpoints (OpenRouter only)
- ✨ **Helper Model & AI Polisher** - Background tasks model + music prompt enhancement
- 🚀 **FAL Queue-Based Processing** - Async image/video/audio generation with real-time status updates
- 🎉 **Enhanced Model Selector** - Full-screen modal with fuzzy search and dynamic model fetching
- 🗂️ **System & Slash Prompts** - Complete CRUD operations with autocomplete and templates
- 📤 **Import/Export** - Backup and restore all app data (excluding API keys)
- 🔐 **Provider-Scoped Parameters** - Model parameters stored per provider+model to avoid collisions
- 🌓 **Dark/Light/System Theme** - Full Tailwind CSS v4 implementation
- ⚙️ **Settings Screen** - API key management for 3 providers
- 💾 **Dual Storage** - LocalStorage + IndexedDB for efficient data persistence
- 🎨 **Mobile-Responsive Design** - Optimized for 320-428px viewports
- 🔒 **Privacy-First** - No backend, no tracking, data never leaves your device

---

## 🚀 Quick Start

### For Users

**Download the Latest Build**:
1. Go to [GitHub Actions](https://github.com/Echooff3/runback-ai/actions)
2. Download `runback-ai.zip` artifact
3. Extract and serve with any web server

**Run Locally**:
```bash
# Extract the build
unzip runback-ai.zip -d runback-ai
cd runback-ai

# Option 1: Python server
python3 -m http.server 8080

# Option 2: Node.js serve
npx serve -p 8080

# Access at http://localhost:8080
```

### For Developers

**Clone and Build**:
```bash
# Clone repository
git clone https://github.com/Echooff3/runback-ai.git
cd runback-ai

# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Output in ./dist folder
```

---

## 📋 Requirements

### For Users
- Modern web browser (Chrome, Safari, Firefox, Edge)
- Web server to serve static files (nginx, Apache, Python http.server, etc.)
- API keys from desired AI providers:
  - [OpenRouter.ai](https://openrouter.ai/keys)
  - [Replicate.ai](https://replicate.com/account/api-tokens)
  - [Fal.ai](https://fal.ai/dashboard/keys)

### For Developers
- Node.js 20+ and npm
- Git

### NOT Required
- ❌ Database server
- ❌ Backend API server
- ❌ Cloud hosting (though supported)

---

## 🛠️ Technology Stack

```
Vite v7.2.4 + React 19 + TypeScript + Tailwind CSS v4
├── React Router v7.9.6 (navigation)
├── Zustand v5.0.8 (state management)
├── LocalStorage (settings, API keys, prompts)
├── IndexedDB (chat sessions and message history)
├── Marked v15.0.12 (markdown rendering)
├── DOMPurify v3.3.0 (XSS protection)
└── GitHub Actions (CI/CD)
```

---

## 📚 Documentation

- **[PRD.md](./PRD.md)** - Comprehensive Product Requirements Document
- **[IMPLEMENTATION_SUMMARY.md](./IMPLEMENTATION_SUMMARY.md)** - Quick reference guide
- **[Build Workflow](./.github/workflows/build.yml)** - CI/CD pipeline

---

## 🎯 Development Scripts

```bash
npm run dev          # Start dev server (http://localhost:5173)
npm run build        # Build for production (output to dist/)
npm run preview      # Preview production build
npm run lint         # Lint code (if configured)
```

---

## 📈 Implementation Roadmap

### ✅ Phase 1: Foundation (COMPLETE)
- Project setup (Vite + React + TypeScript + Tailwind CSS v4)
- Theme system (dark/light/system mode)
- Settings screen with API key management
- LocalStorage persistence layer
- GitHub Actions CI/CD

### ✅ Phase 2: Chat Core (COMPLETE)
- Multi-tab chat sessions with IndexedDB persistence
- Chat interface with provider/model selection
- API integration (all 3 providers)
- Re-run prompts with response history
- FAL queue-based async processing
- Topic change detection and auto-checkpointing
- Loading states and error handling

### ✅ Phase 3: Prompt Management (COMPLETE)
- System prompts CRUD with default protection
- Slash prompts CRUD with autocomplete
- Dynamic template variables
- Default prompts seeding
- Import/Export functionality

### 🚧 Phase 4: Polish & Optimization (IN PROGRESS)
- UI/UX refinements
- Performance optimization
- Accessibility (WCAG AA)
- PWA setup
- Documentation

---

## 🏗️ Project Structure

```
runback-ai/
├── src/
│   ├── components/         # React components
│   │   ├── chat/          # Chat interface ✅
│   │   ├── settings/      # Settings screens ✅
│   │   └── common/        # Shared components
│   ├── lib/               # Utilities
│   │   ├── storage/       # LocalStorage + IndexedDB ✅
│   │   ├── api/           # AI provider clients ✅
│   │   ├── defaults/      # Default prompts ✅
│   │   └── topicClassifier.ts # Topic change detection ✅
│   ├── hooks/             # React hooks
│   ├── stores/            # Zustand stores ✅
│   ├── types/             # TypeScript types ✅
│   └── App.tsx            # Root component ✅
├── public/                # Static assets
├── .github/workflows/     # CI/CD ✅
└── dist/                  # Build output (not in git)
```

---

## 🔒 Privacy & Security

### What's Stored Locally
- ✅ API keys (in LocalStorage, Base64 encoded)
- ✅ System prompts and slash prompts (LocalStorage)
- ✅ Theme preferences and settings (LocalStorage)
- ✅ Chat sessions and message history (IndexedDB)
- ✅ Model parameters (per provider+model, LocalStorage)
- ✅ Helper model configuration (LocalStorage)

### What's NEVER Stored
- ❌ No server-side logs
- ❌ No telemetry or analytics
- ❌ No third-party tracking
- ❌ No cloud backups

**Perfect for**: Personal intranet deployments, air-gapped networks, privacy-conscious users

---

## 📊 Build Performance

- **Total bundle size**: ~655KB (main JS bundle)
- **CSS bundle**: ~52KB (Tailwind CSS)
- **Zipped size**: ~199KB (gzipped JS)
- **Build time**: ~3-4 seconds
- **Target**: Consider code splitting for bundles > 500KB (noted in build output)

---

## 🤝 Contributing

Contributions are welcome! Please read the [PRD](./PRD.md) and [Implementation Summary](./IMPLEMENTATION_SUMMARY.md) before contributing.

---

## 📝 License

[To be determined]

---

## 🙏 Acknowledgments

- [OpenRouter.ai](https://openrouter.ai) - Unified API for 100+ LLMs
- [Replicate.ai](https://replicate.ai) - Run AI models in the cloud
- [Fal.ai](https://fal.ai) - Fast inference for AI models
- [Vite](https://vitejs.dev) - Next generation frontend tooling
- [Tailwind CSS](https://tailwindcss.com) - Utility-first CSS framework

---

**Built with ❤️ for privacy-conscious AI enthusiasts**

⚠️ **Disclaimer:** This is a purpose-built app for hobbyists and developers. Please ensure you understand the privacy implications and API usage costs before deployment.