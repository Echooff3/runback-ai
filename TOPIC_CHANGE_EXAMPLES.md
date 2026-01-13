# Topic Change Detection - Example Flow

This document shows example conversations to illustrate how the topic change detection works.

## Example 1: Topic Continuation (No Checkpoint)

**Conversation:**
```
User: "Tell me about React hooks"
AI: "React Hooks are functions that let you use state and other React features..."

User: "What about useEffect?"
→ Classification: topic_changed = false
→ Reason: Follow-up question about the same topic (React hooks)
→ Action: No checkpoint created
```

**Visual:** No divider shown, conversation continues normally.

---

## Example 2: Topic Change (Checkpoint Created)

**Conversation:**
```
User: "Tell me about React hooks"
AI: "React Hooks are functions that let you use state and other React features..."

User: "Actually, let's talk about Python decorators instead"
→ Classification: topic_changed = true
→ Reason: Explicit topic switch from React to Python
→ Action: Checkpoint created before new message
```

**Visual:** Purple/blue gradient divider appears before the new message:

```
┌─────────────────────────────────────┐
│ 🔄 Topic Changed                    │
│    Checkpoint created               │
│    [Click to expand details]        │
└─────────────────────────────────────┘
```

When expanded:
```
┌─────────────────────────────────────┐
│ 🔄 Topic Changed                    │
│    Checkpoint created               │
│    [Click to collapse details]      │
│ ─────────────────────────────────── │
│ Time: 1/13/2026, 3:45:23 PM        │
│ Analysis: User explicitly changed   │
│          from React to Python       │
│ Action: Previous conversation       │
│        summarized and saved         │
└─────────────────────────────────────┘
```

---

## Example 3: Subtle Continuation

**Conversation:**
```
User: "What's the weather like in Paris?"
AI: "The weather in Paris is currently..."

User: "Tell me more"
→ Classification: topic_changed = false
→ Reason: Generic continuation phrase
→ Action: No checkpoint created

User: "What about the forecast?"
→ Classification: topic_changed = false
→ Reason: Still about Paris weather
→ Action: No checkpoint created
```

---

## Example 4: Related but Different Topic

**Conversation:**
```
User: "How do I make a chocolate cake?"
AI: "To make a chocolate cake, you'll need..."

User: "What about cookies instead?"
→ Classification: topic_changed = true
→ Reason: Switching from cakes to cookies (related but different)
→ Action: Checkpoint created
```

---

## Example 5: Question After Answer

**Conversation:**
```
User: "Explain quantum computing"
AI: "Quantum computing is a type of computation that uses quantum mechanics..."

User: "Can you explain it more simply?"
→ Classification: topic_changed = false
→ Reason: Asking for clarification on the same topic
→ Action: No checkpoint created

User: "What are some examples?"
→ Classification: topic_changed = false
→ Reason: Follow-up for examples
→ Action: No checkpoint created
```

---

## Example 6: Complete Topic Switch

**Conversation:**
```
User: "What are the best practices for REST APIs?"
AI: "Best practices for REST APIs include..."

User: "Never mind that. Tell me about machine learning instead."
→ Classification: topic_changed = true
→ Reason: Explicit dismissal and new topic
→ Action: Checkpoint created
```

---

## Classification Logic

The classifier uses these signals to detect topic changes:

### **Indicators of Continuation** (topic_changed = false):
- Follow-up questions ("what about...", "tell me more")
- Clarification requests ("can you explain...", "what do you mean")
- Related questions on the same subject
- Asking for examples or details
- Generic responses ("yes", "go on", "continue")

### **Indicators of Topic Change** (topic_changed = true):
- Explicit switches ("actually, let's talk about X")
- Dismissals ("never mind", "forget that")
- Completely unrelated questions
- New topics without context
- Clear subject changes

---

## Debug Information

When you click the topic change divider, you can see:

1. **Timestamp**: When the topic change was detected
2. **Analysis**: The reasoning (if provided by the classifier)
3. **Action**: Whether a checkpoint was created
4. **Previous Context**: The conversation summary (stored in checkpoint)

This helps you understand why the system detected a topic change and allows you to verify the classifier is working correctly.

---

## Performance Notes

- **Classification Speed**: ~1-2 seconds (Phi-3 Mini is fast)
- **API Cost**: Very low (Phi-3 Mini is cheap on OpenRouter)
- **Context Used**: Only last 5 messages (efficient)
- **Error Handling**: Falls back to "no topic change" on errors

---

## When It Runs

The classifier only runs when:
- ✅ Provider is OpenRouter
- ✅ Session type is 'chat' (not songwriting)
- ✅ There are previous messages
- ✅ OpenRouter API key is configured

Otherwise, messages are added normally without classification.
