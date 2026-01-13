# Import/Export Compatibility

## Overview

The topic change detection feature adds new **optional** fields to the data model. The import/export system is designed to handle these changes gracefully.

## New Fields Added

### ChatMessage Interface
```typescript
interface ChatMessage {
  // ... existing fields
  topicChanged?: boolean;           // NEW - optional
  topicChangeReasoning?: string;    // NEW - optional
}
```

### SessionCheckpoint Interface
```typescript
interface SessionCheckpoint {
  // ... existing fields
  reason?: 'manual' | 'token_limit' | 'topic_change';  // NEW - optional
}
```

## Compatibility Guarantee

### ✅ Backward Compatibility (Old Data → New System)

**Importing old backups to new version:**
- Old backup files don't have `topicChanged`, `topicChangeReasoning`, or checkpoint `reason` fields
- These fields are **optional** (marked with `?`), so TypeScript accepts undefined values
- Old chat sessions will display normally without topic change indicators
- The system will start detecting topic changes for new messages

**Example:**
```json
// Old backup (without new fields)
{
  "chatSessions": [{
    "messages": [{
      "id": "123",
      "content": "Hello",
      // No topicChanged field - this is OK
    }]
  }]
}
```
Result: ✅ Imports successfully, messages display normally

### ✅ Forward Compatibility (New Data → Old System)

**Importing new backups to old version (if someone downgrades):**
- New backup files contain `topicChanged`, `topicChangeReasoning`, and checkpoint `reason` fields
- The import validation only checks **required** fields, not all fields
- Extra fields are preserved during import but ignored by older code
- IndexedDB stores all fields, so data isn't lost

**Example:**
```json
// New backup (with new fields)
{
  "chatSessions": [{
    "messages": [{
      "id": "123",
      "content": "Hello",
      "topicChanged": true,        // Extra field
      "topicChangeReasoning": "..."  // Extra field
    }]
  }]
}
```
Result: ✅ Imports successfully, extra fields ignored by old UI

## No Breaking Changes

### Why This Is Safe

1. **Optional Fields**: All new fields use `?` making them optional in TypeScript
2. **No Validation Changes**: `validateImportData()` only validates required fields
3. **Flexible Storage**: IndexedDB stores all fields without schema enforcement
4. **Graceful Degradation**: Missing fields are handled by conditional rendering (`message.topicChanged && <TopicChangeDivider />`)

### What Gets Imported/Exported

**Export includes:**
- All chat sessions with all fields (including new optional ones)
- System prompts
- Slash prompts
- Settings (theme, helper model, etc.)
- **Excludes:** API keys (for security)

**Import handles:**
- Both merge and replace modes
- Skips duplicates by ID in merge mode
- Validates required fields only
- Preserves all fields (known and unknown)

## Migration Path

### Upgrading from Old Version
1. No action needed
2. Old backups import without modification
3. New topic detection starts working immediately for new messages

### Downgrading to Old Version
1. New backups still import successfully
2. Extra fields are ignored
3. No data loss (fields preserved in storage)

## Testing Scenarios

### ✅ Test 1: Import Old Backup to New Version
```
1. Export backup from old version (no topic fields)
2. Upgrade to new version with topic detection
3. Import the old backup
Expected: All sessions load, no topic change indicators shown
```

### ✅ Test 2: Import New Backup to New Version
```
1. Create sessions with topic changes in new version
2. Export backup (includes topic fields)
3. Import to another new version installation
Expected: Topic change indicators display correctly
```

### ✅ Test 3: Cross-Version Import
```
1. Export from new version (includes topic fields)
2. Import to old version (if downgrading)
Expected: Sessions load, extra fields silently ignored
```

## Implementation Details

### Validation Function
The `validateImportData()` function only validates required fields:
```typescript
// Validates required fields only
if (typeof p.id !== 'string') return false;
if (typeof p.content !== 'string') return false;
// etc...

// Does NOT validate optional fields like topicChanged
```

This allows new fields to pass through without breaking old validation.

### Import Function
The `importAppData()` function preserves all fields:
```typescript
await dbInstance.saveSession(session);
// Saves the entire session object, including all fields
```

IndexedDB doesn't enforce schemas, so new fields are stored automatically.

## Conclusion

**No changes needed to import/export functionality.**

The feature is designed with compatibility in mind:
- ✅ Old data works in new system
- ✅ New data works in old system (fields ignored)
- ✅ No breaking changes
- ✅ No migration scripts needed
- ✅ No version checks required

The use of optional TypeScript fields (`?`) provides natural forward/backward compatibility.
