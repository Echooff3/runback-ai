# Model Selector Feature

## Overview

The Model Selector has been upgraded from a simple dropdown to a full-screen modal with fuzzy search and dynamic model fetching from provider APIs.

## Features

### 1. Full-Screen Modal Interface
- **Mobile-optimized**: Full-screen on mobile devices with slide-up animation
- **Desktop-friendly**: Centered modal with max-width on larger screens
- **Backdrop overlay**: Dismissible by clicking outside

### 2. Fuzzy Search
- **Quick filtering**: Type to filter models by name, ID, or description
- **Smart matching**: Characters can appear in any order (fuzzy algorithm)
- **Auto-focus**: Search input automatically focused when modal opens
- **Real-time**: Results update as you type

### 3. Dynamic Model Fetching
Models are fetched in real-time from provider APIs when the modal opens:

#### OpenRouter
- **Endpoint**: `GET https://openrouter.ai/api/v1/models`
- **Auth**: Bearer token
- **Data**: Returns all 100+ available models with pricing and context info

#### Replicate
- **Endpoint**: `GET https://api.replicate.com/v1/models`
- **Auth**: Bearer token
- **Filtering**: Automatically filters for language models (LLMs)
- **Versions**: Automatically appends latest version hash when available

#### Fal.ai
- **Endpoint**: `GET https://api.fal.ai/v1/models`
- **Auth**: API key header
- **Filtering**: Automatically filters for language models

### 4. Touch-Friendly Design
- **Min row height**: 2.75rem (44px) for easy tap targets
- **Clear selection**: Visual feedback with checkmark and color highlight
- **Scrollable list**: Smooth scrolling through hundreds of models

### 5. Graceful Fallbacks
- **Error handling**: If API fetch fails, falls back to default model list
- **Loading states**: Shows loading animation while fetching
- **No results**: Clear message when search returns no matches

### 6. Provider-Scoped Parameters
- **Parameter modal**: Each model has a parameters button (›) that opens provider-aware configuration
- **Unique storage**: Parameters stored per provider+model combination using `{provider}_{modelId}` format
- **No collisions**: Same model name on different providers maintains separate configurations
- **Persistent**: All parameter settings saved to localStorage and survive browser restarts

## UI Components

### Modal Structure
```
┌─────────────────────────────────┐
│ Select Model              [×]   │ ← Header
├─────────────────────────────────┤
│ 🔍 Search models...             │ ← Search input
├─────────────────────────────────┤
│ GPT-4 Turbo              [✓]    │ ← Model row (44px min)
│ openai/gpt-4-turbo              │
│ Most capable GPT-4 model        │
│                                 │
│ Claude 3 Opus                   │
│ anthropic/claude-3-opus         │
│ Most capable Claude model       │
│                                 │ ← Scrollable
│ ... (more models) ...           │
│                                 │
├─────────────────────────────────┤
│ 125 models available            │ ← Footer
└─────────────────────────────────┘
```

### Model Row Display
Each model shows:
- **Name**: Formatted display name
- **ID**: Full model identifier (owner/name:version)
- **Description**: Brief description (if available)
- **Context**: Token context length (OpenRouter only)
- **Selected indicator**: Checkmark and highlight color
- **Selection badge**: "Selected" badge on current model

## Code Architecture

### Components
1. **ModelSelector.tsx**: Button that opens the modal
   - Shows formatted model name
   - Handles modal open/close state
   
2. **ModelSelectorModal.tsx**: Full-screen modal
   - Fetches models from provider APIs
   - Implements fuzzy search
   - Handles model selection

### Store Integration
- Uses `useSettingsStore` to get API keys
- Requires provider to be configured before fetching models

### API Integration
```typescript
// OpenRouter
const response = await fetch('https://openrouter.ai/api/v1/models', {
  headers: { 'Authorization': `Bearer ${apiKey}` }
});

// Replicate
const response = await fetch('https://api.replicate.com/v1/models', {
  headers: { 'Authorization': `Bearer ${apiKey}` }
});

// Fal.ai
const response = await fetch('https://api.fal.ai/v1/models', {
  headers: { 'Authorization': apiKey }
});
```

## Fuzzy Search Algorithm

Simple but effective character-order matching:

```typescript
const query = searchQuery.toLowerCase();
const filtered = models.filter(model => {
  const searchText = `${model.name} ${model.id} ${model.description}`.toLowerCase();
  
  let searchIndex = 0;
  for (let i = 0; i < searchText.length && searchIndex < query.length; i++) {
    if (searchText[i] === query[searchIndex]) {
      searchIndex++;
    }
  }
  
  return searchIndex === query.length;
});
```

**Example**: Searching "gpt4" matches:
- "GPT-4 Turbo" ✓
- "openai/gpt-4" ✓
- "GPT-3.5 Turbo" ✗
- "Claude 3 Opus" ✗

## Styling

### Dark Mode Support
All components support both light and dark themes:
- Light: White backgrounds, gray borders
- Dark: Gray-900 backgrounds, gray-700 borders

### Animations
- **Slide-up**: Mobile modal slides up from bottom (0.3s ease-out)
- **Hover states**: Subtle background color changes
- **Focus states**: Indigo ring on keyboard navigation

### Responsive Breakpoints
- **Mobile** (< 640px): Full-screen modal
- **Desktop** (≥ 640px): Centered modal with rounded corners

## Keyboard Navigation

- **Tab**: Navigate through models
- **Enter/Space**: Select highlighted model
- **Escape**: Close modal (browser default)
- **Type**: Focus automatically on search input

## Performance Considerations

### Caching
- Models are fetched fresh each time modal opens
- Future enhancement: Cache for 5 minutes to reduce API calls

### Large Lists
- Virtual scrolling NOT implemented (yet)
- All models rendered at once
- Performs well with < 1000 models

### API Rate Limits
- No client-side rate limiting implemented
- Relies on provider rate limits
- Future: Add exponential backoff

## Future Enhancements

1. **Caching**: Store fetched models for 5 minutes
2. **Favorites**: Star frequently used models
3. **Sorting**: Sort by name, popularity, cost, etc.
4. **Filtering**: Filter by provider, cost, context length
5. **Virtual scrolling**: For extremely large model lists (1000+)
6. **Model details**: Expand row to show full details
7. **Recent models**: Show recently used models at top
8. **Model comparison**: Compare specs side-by-side

## Testing

### Manual Testing Checklist
- [ ] Modal opens when clicking model selector button
- [ ] Search filters models correctly
- [ ] Fuzzy search works (characters in order)
- [ ] Can select model and modal closes
- [ ] Selected model shows checkmark
- [ ] Touch targets are at least 44px tall
- [ ] Modal dismisses on backdrop click
- [ ] Loading state shows while fetching
- [ ] Error state shows if API fails
- [ ] Falls back to default models on error
- [ ] Dark mode styling works
- [ ] Mobile full-screen animation works
- [ ] Desktop centered modal works

### API Testing
Test with valid and invalid API keys:
```bash
# Valid key - should fetch models
curl https://openrouter.ai/api/v1/models \
  -H "Authorization: Bearer sk-xxx..."

# Invalid key - should fallback to defaults
curl https://openrouter.ai/api/v1/models \
  -H "Authorization: Bearer invalid"
```

## Browser Compatibility

- ✅ Chrome/Edge (Chromium)
- ✅ Safari (iOS/macOS)
- ✅ Firefox
- ✅ Mobile browsers (iOS Safari, Chrome Mobile)

## Accessibility

- ✅ Keyboard navigable
- ✅ Focus visible on all interactive elements
- ✅ ARIA labels on close button
- ✅ Semantic HTML structure
- ✅ High contrast in both themes
- ⚠️ Screen reader support (needs improvement)

## Known Issues

1. **No virtual scrolling**: Large model lists (1000+) may be slow
2. **No caching**: Models fetched every time modal opens
3. **Replicate versions**: May not always append correct version hash
4. **Fal.ai filtering**: Limited model type filtering
5. **Search performance**: Fuzzy search re-runs on every keystroke

## Migration Notes

### From Old Dropdown
The old `<select>` dropdown has been replaced with a button + modal:

**Before:**
```tsx
<select value={model} onChange={...}>
  <option value="model1">Model 1</option>
</select>
```

**After:**
```tsx
<button onClick={() => setModalOpen(true)}>
  {getModelDisplayName()}
</button>
<ModelSelectorModal ... />
```

### Breaking Changes
None - API remains the same:
```tsx
<ModelSelector
  provider={provider}
  selectedModel={selectedModel}
  onModelChange={onModelChange}
/>
```

## Resources

- [OpenRouter API Docs](https://openrouter.ai/docs/quickstart)
- [Replicate API Docs](https://replicate.com/docs/reference/http)
- [Fal.ai API Docs](https://docs.fal.ai/model-apis/quickstart)
