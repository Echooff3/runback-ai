/**
 * Grok-Powered HTML Generator
 * Uses OpenRouter's Grok-2 to generate parameter forms from OpenAPI schemas
 */

import { OpenRouterClient } from './openrouter';
import type { ParameterSchema } from '../parameterAPI';
import { getHtmlGenerationModel } from '../storage/localStorage';
import { getDBInstance } from '../storage/indexedDB';

interface GeneratedForm {
  html: string;
  javascript: string;
  success: boolean;
  error?: string;
}

interface GenerationCache {
  html: string;
  javascript: string;
  timestamp: number;
  schema: any;
}

// Cache for generated forms
const formCache = new Map<string, GenerationCache>();
const CACHE_TTL = 7 * 24 * 60 * 60 * 1000; // 7 days

/**
 * Validate HTML structure
 */
function isValidHTML(html: string): boolean {
  try {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    const parserError = doc.querySelector('parsererror');
    return !parserError && html.length > 0;
  } catch {
    return false;
  }
}

/**
 * Example forms to include in the prompt for few-shot learning
 */
const EXAMPLE_FORMS = `
EXAMPLE 1: Simple text-to-image model with basic parameters

Schema:
{
  "prompt": { "type": "string", "required": true },
  "num_images": { "type": "integer", "minimum": 1, "maximum": 4, "default": 1 },
  "seed": { "type": "integer" }
}

Generated HTML:
<div class="space-y-4">
  <div>
    <label class="block text-sm font-medium mb-1">Prompt</label>
    <textarea id="prompt" rows="3" class="w-full px-3 py-2 border rounded-lg"></textarea>
    <p class="text-xs text-gray-500 mt-1">The text prompt to generate the image from</p>
  </div>
  
  <div>
    <label class="block text-sm font-medium mb-1">Number of Images</label>
    <input type="number" id="num_images" min="1" max="4" value="1" class="w-full px-3 py-2 border rounded-lg" />
    <p class="text-xs text-gray-500 mt-1">How many images to generate (1-4)</p>
  </div>
  
  <div>
    <label class="block text-sm font-medium mb-1">Seed (Optional)</label>
    <input type="number" id="seed" class="w-full px-3 py-2 border rounded-lg" placeholder="Random" />
    <p class="text-xs text-gray-500 mt-1">Set a specific seed for reproducible results</p>
  </div>
</div>

Generated JavaScript:
// Set up parameter handlers
document.getElementById('prompt').addEventListener('input', function(e) {
  ParameterAPI.setParameter('prompt', e.target.value);
});

document.getElementById('num_images').addEventListener('change', function(e) {
  ParameterAPI.setParameter('num_images', parseInt(e.target.value));
});

document.getElementById('seed').addEventListener('change', function(e) {
  const value = e.target.value;
  if (value) {
    ParameterAPI.setParameter('seed', parseInt(value));
  }
});

EXAMPLE 2: Model with enum and boolean options

Schema:
{
  "style": { "type": "string", "enum": ["realistic", "artistic", "anime"], "default": "realistic" },
  "enable_safety": { "type": "boolean", "default": true },
  "guidance_scale": { "type": "number", "minimum": 1, "maximum": 20, "default": 7.5 }
}

Generated HTML:
<div class="space-y-4">
  <div>
    <label class="block text-sm font-medium mb-1">Style</label>
    <select id="style" class="w-full px-3 py-2 border rounded-lg">
      <option value="realistic" selected>Realistic</option>
      <option value="artistic">Artistic</option>
      <option value="anime">Anime</option>
    </select>
  </div>
  
  <div class="flex items-center">
    <input type="checkbox" id="enable_safety" checked class="mr-2" />
    <label class="text-sm font-medium">Enable Safety Checker</label>
  </div>
  
  <div>
    <label class="block text-sm font-medium mb-1">Guidance Scale</label>
    <input type="range" id="guidance_scale" min="1" max="20" step="0.5" value="7.5" class="w-full" />
    <div class="flex justify-between text-xs text-gray-500">
      <span>1</span>
      <span id="guidance_scale_value">7.5</span>
      <span>20</span>
    </div>
  </div>
</div>

Generated JavaScript:
document.getElementById('style').addEventListener('change', function(e) {
  ParameterAPI.setParameter('style', e.target.value);
});

document.getElementById('enable_safety').addEventListener('change', function(e) {
  ParameterAPI.setParameter('enable_safety', e.target.checked);
});

const guidanceScale = document.getElementById('guidance_scale');
const guidanceValue = document.getElementById('guidance_scale_value');
guidanceScale.addEventListener('input', function(e) {
  const value = parseFloat(e.target.value);
  guidanceValue.textContent = value;
  ParameterAPI.setParameter('guidance_scale', value);
});
`;

/**
 * Generate parameter form HTML and JavaScript using Grok
 */
export async function generateParameterForm(
  modelId: string,
  provider: string,
  inputSchema: any,
  openrouterApiKey: string,
  forceRegenerate = false
): Promise<GeneratedForm> {
  const db = getDBInstance();
  const cacheKey = `${provider}_${modelId}`;
  
  // Check cache first
  if (!forceRegenerate) {
    const memCached = formCache.get(cacheKey);
    if (memCached && Date.now() - memCached.timestamp < CACHE_TTL) {
      return {
        html: memCached.html,
        javascript: memCached.javascript,
        success: true,
      };
    }

    try {
      const dbCached = await db.loadFormCache(modelId, provider);
      if (dbCached && Date.now() - dbCached.timestamp < CACHE_TTL) {
        const cache: GenerationCache = {
          html: dbCached.html,
          javascript: dbCached.javascript,
          timestamp: dbCached.timestamp,
          schema: dbCached.schema,
        };
        formCache.set(cacheKey, cache);
        return {
          html: dbCached.html,
          javascript: dbCached.javascript,
          success: true,
        };
      }
    } catch (error) {
      console.warn('Failed to load form cache from IndexedDB:', error);
    }
  }

  // Generate form with retry logic (3 attempts)
  const maxAttempts = 3;
  let lastError: string | undefined;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const result = await generateFormWithGrok(modelId, inputSchema, openrouterApiKey, attempt);
      
      if (result.success) {
        // Validate HTML before caching
        if (isValidHTML(result.html)) {
          // Cache the result
          const cache: GenerationCache = {
            html: result.html,
            javascript: result.javascript,
            timestamp: Date.now(),
            schema: inputSchema,
          };
          
          formCache.set(cacheKey, cache);
          
          // Save to IndexedDB
          try {
            await db.saveFormCache(modelId, provider, result.html, result.javascript, inputSchema);
          } catch (error) {
            console.warn('Failed to cache form to IndexedDB:', error);
          }
        }
        
        return result;
      }
      
      lastError = result.error;
      console.warn(`Form generation attempt ${attempt} failed:`, result.error);
      
    } catch (error) {
      lastError = error instanceof Error ? error.message : 'Unknown error';
      console.error(`Form generation attempt ${attempt} error:`, error);
    }
    
    // Wait before retry (exponential backoff)
    if (attempt < maxAttempts) {
      await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
    }
  }

  // All attempts failed
  return {
    html: '',
    javascript: '',
    success: false,
    error: `Failed to generate form after ${maxAttempts} attempts. Last error: ${lastError}`,
  };
}

/**
 * Internal function to generate form using Grok API
 */
async function generateFormWithGrok(
  modelId: string,
  inputSchema: any,
  apiKey: string,
  _attempt: number
): Promise<GeneratedForm> {
  const client = new OpenRouterClient(apiKey);

  const prompt = `You are an expert UI/UX developer creating dynamic parameter forms for AI models. Generate HTML and JavaScript code for a parameter form based on the OpenAPI schema provided.

MODEL: ${modelId}

SCHEMA:
${JSON.stringify(inputSchema, null, 2)}

REQUIREMENTS:
1. Generate clean, semantic HTML with Tailwind CSS classes (already available)
2. Use appropriate input types: text, number, range, select, checkbox, textarea
3. Include labels, descriptions, and validation hints
4. DO NOT mark fields as required or add asterisks - all fields should be optional (the user can provide prompt from chat or settings)
5. DO NOT add the 'required' attribute to any input fields
6. Use the global ParameterAPI to set/get parameter values:
   - ParameterAPI.setParameter(name, value) - set a parameter
   - ParameterAPI.getParameter(name) - get current value
   - ParameterAPI.validateParameter(name, value) - validate before setting
7. Add event listeners to update parameters on change
8. For enums, use <select> dropdowns
9. For numbers with min/max, consider using range sliders with value display
10. Show helpful descriptions from the schema
11. Use dark mode compatible colors (text-gray-900 dark:text-gray-100, etc.)

STYLING CLASSES TO USE:
- Container: space-y-4
- Input/Select/Textarea: w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100
- Label: block text-sm font-medium text-gray-900 dark:text-gray-100 mb-1
- Description: text-xs text-gray-500 dark:text-gray-400 mt-1
- Range value display: text-xs text-gray-500 dark:text-gray-400

EXAMPLES OF GOOD FORMS:
${EXAMPLE_FORMS}

OUTPUT FORMAT:
Return a JSON object with two fields:
{
  "html": "<div class=\\"space-y-4\\">...</div>",
  "javascript": "document.getElementById('field').addEventListener('change', ...);"
}

IMPORTANT:
- Only return the JSON object, no markdown formatting
- Escape quotes properly in the JSON strings
- The JavaScript should be executable code that sets up event listeners
- Initialize ParameterAPI with default values from the schema
- Don't include <script> or <style> tags, just the raw code
- Test that field IDs match between HTML and JavaScript

Now generate the form for the schema above:`;

  try {
    const model = getHtmlGenerationModel();
    const response = await client.sendMessage(model, [
      {
        role: 'user',
        content: prompt,
      },
    ]);

    // Parse the response
    let jsonText = response.content.trim();
    
    // Remove markdown code blocks if present
    jsonText = jsonText.replace(/```json\n?/g, '').replace(/```\n?/g, '');
    
    const parsed = JSON.parse(jsonText);
    
    if (!parsed.html || !parsed.javascript) {
      throw new Error('Invalid response format from Grok');
    }

    return {
      html: parsed.html,
      javascript: parsed.javascript,
      success: true,
    };
    
  } catch (error) {
    return {
      html: '',
      javascript: '',
      success: false,
      error: error instanceof Error ? error.message : 'Failed to generate form',
    };
  }
}

/**
 * Clear form cache
 */
export async function clearFormCache(modelId?: string, provider?: string): Promise<void> {
  const db = getDBInstance();
  
  if (modelId && provider) {
    const cacheKey = `${provider}_${modelId}`;
    formCache.delete(cacheKey);
    await db.clearFormCache(modelId, provider);
  } else {
    formCache.clear();
    await db.clearFormCache();
  }
}

/**
 * Extract parameter schema from OpenAPI input schema
 */
export function convertOpenAPIToParameterSchema(inputSchema: any): ParameterSchema {
  const schema: ParameterSchema = {};
  
  if (!inputSchema || !inputSchema.properties) {
    return schema;
  }

  const properties = inputSchema.properties;
  const required = inputSchema.required || [];

  for (const [key, prop] of Object.entries(properties)) {
    const p = prop as any;
    
    schema[key] = {
      type: p.type || 'string',
      required: required.includes(key),
      default: p.default,
      minimum: p.minimum,
      maximum: p.maximum,
      minLength: p.minLength,
      maxLength: p.maxLength,
      pattern: p.pattern,
      enum: p.enum,
    };
  }

  return schema;
}
