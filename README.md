# RunBack AI 🚀

**A Privacy-First, Mobile-Optimized LLM Swiss Army Knife**

Swiss army knife LLM tool tightly integrated with [OpenRouter.ai](https://openrouter.ai), [Replicate.ai](https://replicate.ai), and [Fal.ai](https://fal.ai) - designed exclusively for mobile and personal intranet deployment.

[![Build Status](https://github.com/Echooff3/runback-ai/actions/workflows/build.yml/badge.svg)](https://github.com/Echooff3/runback-ai/actions/workflows/build.yml)

---

## ✨ Key Features

- 🤖 **Multi-Provider AI Access**: Connect to OpenRouter, Replicate, and Fal.ai with your own API keys
- 📱 **Mobile-First Design**: Optimized for 320-428px viewports with responsive scaling
- 🌓 **Dark/Light Mode**: Full Tailwind CSS dark mode support with system detection
- 🔄 **Response History**: Re-run prompts and flip through multiple AI responses
- 💾 **100% Local Storage**: All data stored in browser - no backend, no database required
- 🏢 **Intranet Ready**: Deploy on personal networks with zero external dependencies
- 🔒 **Privacy-First**: No telemetry, no tracking, data never leaves your device
- ⚡ **Offline Capable**: Manage prompts and settings without internet
- 📝 **System Prompts**: CRUD operations for reusable AI behavior templates
- ⌨️ **Slash Commands**: Quick-access prompt templates with `/command` syntax
- 🎨 **PWA Support**: Install as a native-like app on mobile devices

---

## 🏗️ Architecture

### Zero Backend Philosophy

RunBack AI is a **100% client-side application** that runs entirely in your browser:

- ❌ **No Database Server** (PostgreSQL, MySQL, MongoDB, etc.)
- ❌ **No API Backend** (Node.js, Python, Go, etc.)
- ❌ **No Authentication Server** (no user accounts)
- ✅ **Static HTML/CSS/JS files only**
- ✅ **LocalStorage + IndexedDB for data persistence**
- ✅ **Direct API calls to AI providers**

### Technology Stack

```
Vite + React + TypeScript + Tailwind CSS
├── React Router (navigation)
├── Zustand (state management)
├── LocalStorage (settings, API keys, prompts)
├── IndexedDB (chat history)
└── GitHub Actions (CI/CD)
```

---

## 📚 Documentation

- **[PRD.md](./PRD.md)** - Comprehensive Product Requirements Document (17 sections, 30KB)
- **[IMPLEMENTATION_SUMMARY.md](./IMPLEMENTATION_SUMMARY.md)** - Quick reference guide for developers (12KB)
- **[Build Workflow](./.github/workflows/build.yml)** - GitHub Actions CI/CD pipeline

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
- ❌ Docker (though supported as deployment option)

---

## 🌐 Deployment Options

### 1. Personal Intranet (nginx)
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

### 2. Docker Container
```dockerfile
FROM nginx:alpine
COPY dist /usr/share/nginx/html
EXPOSE 80
```

```bash
docker build -t runback-ai .
docker run -p 8080:80 runback-ai
```

### 3. Static Hosting
- Vercel
- Netlify
- GitHub Pages
- Any CDN or static file host

---

## 🎯 Core Features Detail

### 1. Multi-Provider Chat Interface
- Switch between OpenRouter, Replicate, and Fal.ai seamlessly
- Select from 100+ available models
- Real-time response streaming (future)
- Error handling and retry logic

### 2. Response History & Re-run
- Re-run any prompt to get new responses
- Navigate through multiple responses: `← 1 of 3 →`
- Compare different AI outputs side-by-side
- Each response includes metadata (timestamp, model, tokens)

### 3. System Prompts Management
- Create reusable behavior templates
- Apply to entire conversations
- CRUD operations with search/filter
- Import/Export as JSON
- Default prompts included:
  - Helpful Assistant
  - Code Expert
  - Creative Writer

### 4. Slash Commands
- Quick-insert templates: `/summarize`, `/translate`, `/explain`
- Autocomplete in chat input
- Variable support: `{text}`, `{language}`
- Custom command creation

### 5. Settings & Configuration
- API key management with connection testing
- Theme toggle (Light/Dark/System)
- Custom endpoint configuration (advanced)
- All settings persist locally

### 6. Dark Mode Support
- Full Tailwind CSS implementation
- System preference detection
- Smooth transitions
- Consistent color palette across all screens

---

## 🔒 Privacy & Security

### What's Stored Locally
- ✅ API keys (Base64 encoded in LocalStorage)
- ✅ System prompts and slash prompts
- ✅ Theme preferences and settings
- ✅ Chat history (IndexedDB, optional)

### What's NEVER Stored
- ❌ No server-side logs (no server!)
- ❌ No telemetry or analytics
- ❌ No third-party tracking
- ❌ No cloud backups

### Data Flow
```
Your Browser → AI Provider APIs (direct HTTPS)
     ↓
LocalStorage
  (your machine only)
```

**Perfect for**:
- Personal intranet deployments
- Air-gapped networks (with offline mode)
- Privacy-conscious users
- GDPR/CCPA compliance

---

## 🛠️ Development

### Project Structure (Planned)
```
runback-ai/
├── src/
│   ├── components/         # React components
│   │   ├── chat/          # Chat interface
│   │   ├── settings/      # Settings screens
│   │   ├── prompts/       # Prompt managers
│   │   └── common/        # Shared components
│   ├── lib/               # Utilities
│   │   ├── storage.ts     # LocalStorage/IndexedDB
│   │   ├── api/           # AI provider clients
│   │   └── theme.ts       # Dark mode logic
│   ├── hooks/             # React hooks
│   ├── stores/            # Zustand stores
│   ├── types/             # TypeScript types
│   └── App.tsx            # Root component
├── public/                # Static assets
├── .github/workflows/     # CI/CD
└── dist/                  # Build output
```

### Scripts
```bash
npm run dev          # Start dev server
npm run build        # Build for production
npm run preview      # Preview production build
npm run test         # Run unit tests
npm run test:e2e     # Run E2E tests
npm run lint         # Lint code
```

---

## 🧪 Testing

- **Unit Tests**: Vitest (component logic, storage, utilities)
- **E2E Tests**: Playwright (critical user flows)
- **Target Coverage**: >80% for business logic

---

## 📈 Implementation Phases

### Phase 1: Foundation (2-3 weeks)
- Project setup (Vite + React + TypeScript + Tailwind)
- Theme system (dark/light mode)
- Settings screen with API key management
- Local storage layer
- GitHub Actions CI/CD

### Phase 2: Chat Core (2-3 weeks)
- Chat interface with provider/model selection
- API integration (all 3 providers)
- Re-run prompts with response history
- Loading states and error handling

### Phase 3: Prompt Management (2-3 weeks)
- System prompts CRUD
- Slash prompts CRUD with autocomplete
- Default prompts
- Import/Export functionality

### Phase 4: Polish & Optimization (1-2 weeks)
- UI/UX refinements
- Performance optimization
- Accessibility (WCAG AA)
- PWA setup
- Documentation

**Total Estimated Time**: 8-11 weeks

---

## 🤝 Contributing

Contributions are welcome! Please read the [PRD](./PRD.md) and [Implementation Summary](./IMPLEMENTATION_SUMMARY.md) before contributing.

### Development Workflow
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests and linting
5. Submit a pull request

---

## 📝 License

[Add your license here - e.g., MIT, Apache 2.0, etc.]

---

## 🙏 Acknowledgments

- [OpenRouter.ai](https://openrouter.ai) - Unified API for 100+ LLMs
- [Replicate.ai](https://replicate.ai) - Run AI models in the cloud
- [Fal.ai](https://fal.ai) - Fast inference for AI models
- [Vite](https://vitejs.dev) - Next generation frontend tooling
- [Tailwind CSS](https://tailwindcss.com) - Utility-first CSS framework

---

## 📞 Support

- **Issues**: [GitHub Issues](https://github.com/Echooff3/runback-ai/issues)
- **Discussions**: [GitHub Discussions](https://github.com/Echooff3/runback-ai/discussions)
- **Documentation**: [PRD.md](./PRD.md) | [Implementation Summary](./IMPLEMENTATION_SUMMARY.md)

---

## 🗺️ Roadmap

See the [Future Considerations](./PRD.md#13-future-considerations) section in the PRD for planned features:

- Persistent chat history across sessions
- Multi-modal support (image generation, audio)
- Prompt marketplace
- Cost tracking per provider
- Voice input
- Custom themes
- Streaming responses
- And more!

---

**Built with ❤️ for privacy-conscious AI enthusiasts**
