# RunBack AI 🚀

**A Privacy-First, Mobile-Optimized LLM Swiss Army Knife**

Swiss army knife LLM tool tightly integrated with [OpenRouter.ai](https://openrouter.ai), [Replicate.ai](https://replicate.ai), and [Fal.ai](https://fal.ai) - designed exclusively for mobile and personal intranet deployment.

[![Build Status](https://github.com/Echooff3/runback-ai/actions/workflows/build.yml/badge.svg)](https://github.com/Echooff3/runback-ai/actions/workflows/build.yml)

---

## What's New

- ✨ **Helper Model & AI Polisher** — add a helper model for background tasks and a "Polish" feature for music prompts (configurable in Settings).
- 🚀 **FAL queue-based async processing** — queue submission, viewport-aware polling (10s), real-time status badges & logs, and media asset rendering (images/video/audio) with download support.
- 🗂️ **Multi-tab chat sessions** — create multiple tabs, star sessions to protect from deletion, persistent storage in IndexedDB, session history UI for searching/filtering/reopening.
- 🎉 **Enhanced Model Selector** — full-screen modal, fuzzy search, dynamic model fetching, provider-scoped parameter storage.
- 🔐 **Provider-scoped model parameters** — model parameter forms and storage are stored per provider+model to avoid collisions.

For full details, see [IMPLEMENTATION_SUMMARY.md](./IMPLEMENTATION_SUMMARY.md) and [MODEL_SELECTOR.md](./MODEL_SELECTOR.md).

---

## ✨ Current Status: Phase 2 In Progress

✅ **Phase 1: Foundation** - Settings, Theme Support, API Key Management
🚧 **Phase 2: Chat Core** - Provider Integration, Enhanced Model Selection

### Recent Updates:
- 🆕 **Enhanced Model Selector** - Full-screen modal with fuzzy search and dynamic model fetching
  - Search through 100+ models from OpenRouter, Replicate, and Fal.ai
  - Touch-friendly 44px row heights
  - Real-time model fetching from provider APIs
  - Graceful fallbacks when APIs are unavailable

### Implemented Features:
- 🌓 **Dark/Light/System Theme** - Full Tailwind CSS v4 implementation
- ⚙️ **Settings Screen** - API key management for 3 providers
- 💾 **LocalStorage Persistence** - All data stored locally in browser
- 🎨 **Mobile-Responsive Design** - Optimized for 320-428px viewports
- 🔒 **Privacy-First** - No backend, no tracking, data never leaves your device
- 🔍 **Smart Model Selection** - Fuzzy search through available models

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
Vite v7.2.4 + React 18 + TypeScript + Tailwind CSS v4
├── React Router (navigation)
├── Zustand (state management)
├── LocalStorage (settings, API keys, prompts)
├── IndexedDB (chat history - Phase 2)
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

### 🚧 Phase 2: Chat Core (Next)
- Chat interface with provider/model selection
- API integration (all 3 providers)
- Re-run prompts with response history
- Loading states and error handling

### 📅 Phase 3: Prompt Management
- System prompts CRUD
- Slash prompts CRUD with autocomplete
- Default prompts
- Import/Export functionality

### 📅 Phase 4: Polish & Optimization
- UI/UX refinements
- Performance optimization
- Accessibility (WCAG AA)
- PWA setup
- Documentation

**Total Estimated Time**: 8-11 weeks

---

## 🏗️ Project Structure

```
runback-ai/
├── src/
│   ├── components/         # React components
│   │   ├── chat/          # Chat interface (Phase 2)
│   │   ├── settings/      # Settings screens ✅
│   │   ├── prompts/       # Prompt managers (Phase 3)
│   │   └── common/        # Shared components
│   ├── lib/               # Utilities
│   │   ├── storage/       # LocalStorage utilities ✅
│   │   └── api/           # AI provider clients (Phase 2)
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
- ✅ API keys (in LocalStorage)
- ✅ System prompts and slash prompts
- ✅ Theme preferences and settings
- ✅ Chat history (IndexedDB, optional)

### What's NEVER Stored
- ❌ No server-side logs
- ❌ No telemetry or analytics
- ❌ No third-party tracking
- ❌ No cloud backups

**Perfect for**: Personal intranet deployments, air-gapped networks, privacy-conscious users

---

## 📊 Build Performance

- Total bundle size: **264KB** (target: <500KB) ✅
- Zipped artifact: **79KB**
- Main JS bundle: 230KB
- CSS bundle: 15KB (Tailwind)
- Build time: ~2 seconds

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

**Built with ❤️ for privacy-conscious AI enthusiasts
import reactDom from 'eslint-plugin-react-dom'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...
      // Enable lint rules for React
      reactX.configs['recommended-typescript'],
      // Enable lint rules for React DOM
      reactDom.configs.recommended,
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```

⚠️ **Disclaimer:** This is a purpose-built app for hobbyists. Please proceed only if you know what you are doing.