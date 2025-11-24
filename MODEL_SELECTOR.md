# Model Selector

This document describes the Enhanced Model Selector implemented in the app.

## Features

- Full-screen modal on mobile with a slide-up animation
- Fuzzy search for quick filtering of models
- Dynamic model fetching from provider APIs (OpenRouter, Replicate, Fal.ai)
- Touch-friendly rows (minimum 44px row height)
- Dark mode support
- Graceful fallbacks when provider APIs fail or rate-limit
- Provider scoping: models are shown per selected provider
- Provider-aware parameter modal: parameter forms and saved parameters are stored per provider+model

## Usage

- Open the model selector from the chat header or provider picker.
- Search for models using the fuzzy search input.
- Select a model to apply it to the current session/tab.
- Open the parameters modal (›) next to any model to configure provider-scoped parameters for that model.

## Accessibility

- Keyboard navigable list (Up/Down to move, Enter to select)
- Proper ARIA roles for listbox and options
- Focus trap while modal is open
- 44px minimum touch target to comply with mobile touch guidelines

## Implementation notes

- Models are fetched per provider; the selector caches results in-memory and in IndexedDB for quick reopen
- If API fetching fails, the UI falls back to a bundled local list of common models per provider
- Selecting a model updates the current session's model and persists last used model in localStorage
- Parameter modal uses a composite key `{provider}_{modelId}` for storage

## Testing

- Verify modal opens and covers full screen on mobile viewports
- Verify fuzzy search returns expected models
- Confirm parameter modal saves/loads provider-scoped parameters
- Test fallback by simulating provider API failures

## Example invocation

```tsx
<ModelSelector provider={currentProvider} onSelect={handleModelSelect} />
```
