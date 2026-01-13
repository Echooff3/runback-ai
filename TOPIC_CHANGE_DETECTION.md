# Topic Change Detection and Auto-Checkpointing

## Overview

This feature automatically detects when a user changes the conversation topic and creates a checkpoint to preserve the previous conversation context. This is similar to how GitHub Copilot manages conversation history in VS Code.

![Initial App Screen](https://github.com/user-attachments/assets/8273f9d0-f1c7-42c3-9c5a-2f7d2cd7a6d2)

## How It Works

### 1. Topic Classification

When a user sends a new message in a chat session (OpenRouter provider only), the system:

1. **Sends the message to a classifier model** (`microsoft/phi-3-mini-128k-instruct`)
2. **Analyzes the conversation history** (last 5 messages for efficiency)
3. **Determines if the new input represents a topic change**

The classifier uses the following logic:
- **Topic Continuation** (false): Follow-up questions, "tell me more", asking for clarification, exploring aspects of the same topic
- **Topic Change** (true): "Actually, let's talk about X instead", "switching topics", completely unrelated new questions

### 2. Automatic Checkpointing

If a topic change is detected:

1. **Creates a checkpoint** before adding the new message
2. **Summarizes the previous conversation** using the helper model
3. **Marks the message** with `topicChanged: true` metadata
4. **Displays a visual indicator** in the UI

### 3. Visual Representation

The UI shows topic changes with a distinctive purple/blue gradient divider that includes:

- **Topic Changed** label with icon
- **Timestamp** of when the change occurred
- **Expandable debug panel** (click to show/hide) with:
  - Exact timestamp
  - Classification reasoning (if available)
  - Checkpoint creation status

## Technical Details

### Files Changed

1. **`src/lib/topicClassifier.ts`** - Core classification logic
   - Uses `microsoft/phi-3-mini-128k-instruct` model
   - Analyzes last 5 messages for context
   - Returns JSON with `topic_changed` boolean

2. **`src/types/index.ts`** - Type definitions
   - Added `topicChanged?: boolean` to `ChatMessage`
   - Added `topicChangeReasoning?: string` to `ChatMessage`
   - Added `reason?: 'manual' | 'token_limit' | 'topic_change'` to `SessionCheckpoint`

3. **`src/stores/chatStore.ts`** - State management
   - Updated `addUserMessage` to accept topic change metadata
   - Updated `createCheckpoint` to accept a reason parameter

4. **`src/components/chat/TopicChangeDivider.tsx`** - UI component
   - Displays topic change indicator
   - Expandable debug information
   - Purple/blue gradient styling for visual distinction

5. **`src/components/chat/ChatScreen.tsx`** - Main integration
   - Calls topic classifier before adding user messages
   - Triggers auto-checkpoint on topic change
   - Renders TopicChangeDivider components

### Checkpoint Reasons

The system now tracks three types of checkpoints:

1. **`manual`** - User explicitly runs `/checkpoint` command
2. **`token_limit`** - Automatic checkpoint when context exceeds 60% of model limit
3. **`topic_change`** - Automatic checkpoint when topic change is detected

### Performance Considerations

- **Classifier only runs for OpenRouter** - Since it requires an OpenRouter API key
- **Only for regular chat sessions** - Not for songwriting or other specialized modes
- **Only after first message** - No classification needed for the first message
- **Efficient context window** - Uses only last 5 messages for classification
- **Fail-safe behavior** - On classification error, assumes no topic change (prevents unwanted checkpoints)

## Usage

### For End Users

The feature works automatically:

1. **Start a conversation** about any topic
2. **Continue the conversation** normally - no topic change detected
3. **Switch to a new topic** - e.g., "Actually, let's talk about Python instead"
4. **See the visual indicator** showing the topic change
5. **Click the indicator** to see debugging information

### For Developers

#### Testing Topic Detection

```typescript
// The classifier is called automatically in ChatScreen.tsx
// during handleSendMessage()

// Example conversation:
// User: "Tell me about React hooks"
// Assistant: "React hooks are..."
// User: "What about useEffect?" 
// -> No topic change (follow-up question)

// User: "Actually, let's talk about Vue.js instead"
// -> Topic change detected ✓
```

#### Debugging

Enable console logging to see:
- `[ChatScreen] Running topic change detection...`
- `[ChatScreen] Topic change detection result: { topic_changed: true/false }`
- `[ChatScreen] Topic change detected, creating checkpoint...`
- `[TopicClassifier] Classification failed:` (on errors)

## Configuration

### Model Selection

The classifier uses `microsoft/phi-3-mini-128k-instruct` because it's:
- **Fast** - Quick responses for real-time classification
- **Cheap** - Low cost per API call
- **Smart enough** - Can understand nuanced topic changes
- **Available on OpenRouter** - No additional setup needed

### Helper Model

The conversation summarization uses the configured helper model (default: `x-ai/grok-3-mini`). This can be changed in Settings.

## Limitations

1. **OpenRouter only** - Topic detection requires OpenRouter API key
2. **Chat sessions only** - Not available for songwriting or other specialized modes
3. **First message** - No classification for the first message (nothing to compare against)
4. **Classification accuracy** - While generally accurate, the classifier may occasionally misclassify subtle topic shifts

## Future Enhancements

Possible improvements:
- Support for other providers (Replicate, Fal.ai)
- Configurable classifier model
- Adjustable sensitivity (strict vs. loose topic detection)
- Manual override (force topic change or continuation)
- Topic labels/categorization
- Visual topic timeline/graph
