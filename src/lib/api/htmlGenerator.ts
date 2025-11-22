/**
 * Procedural HTML Generator
 * Generates parameter forms from OpenAPI schemas using deterministic logic
 */

import type { ParameterSchema } from '../parameterAPI';
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
 * Generate parameter form HTML and JavaScript procedurally
 */
export async function generateParameterForm(
  modelId: string,
  provider: string,
  inputSchema: any,
  _openrouterApiKey: string, // Unused now
  forceRegenerate = false
): Promise<GeneratedForm> {
  const db = getDBInstance();
  const cacheKey = `${provider}_${modelId}`;
  
  // Check cache first
  /* TEMPORARILY DISABLED FOR DEBUGGING
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
  */

  try {
    const result = generateFormProcedurally(inputSchema);
    
    if (result.success) {
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
    
  } catch (error) {
    return {
      html: '',
      javascript: '',
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

function generateFormProcedurally(inputSchema: any): GeneratedForm {
  if (!inputSchema || !inputSchema.properties) {
    return {
      html: '<div class="text-gray-500">No parameters available.</div>',
      javascript: '',
      success: true
    };
  }

  let htmlParts: string[] = ['<div class="space-y-4">'];
  let jsParts: string[] = ['console.log("Initializing form listeners...");'];

  const properties = inputSchema.properties;
  
  for (const [key, prop] of Object.entries(properties)) {
    const p = prop as any;
    const label = p.title || key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
    const description = p.description || '';
    const type = p.type;
    const isEnum = !!p.enum;
    
    let fieldHtml = '';
    let fieldJs = '';

    const inputId = key;

    // Wrap JS in try-catch to prevent one failure from stopping others
    const wrapJs = (inner: string) => `
      try {
        const el = document.getElementById('${inputId}');
        if (el) {
          console.log('Attaching listener to ${inputId}');
          ${inner}
        } else {
          console.warn('Could not find element ${inputId}');
        }
      } catch (err) {
        console.error('Error attaching listener to ${inputId}:', err);
      }
    `;

    if (isEnum) {
      // Dropdown
      const options = p.enum.map((val: any) => `<option value="${val}" ${p.default === val ? 'selected' : ''}>${val}</option>`).join('');
      fieldHtml = `
        <div>
          <label class="block text-sm font-medium text-gray-900 dark:text-gray-100 mb-1">${label}</label>
          <select id="${inputId}" class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100">
            ${options}
          </select>
          ${description ? `<p class="text-xs text-gray-500 dark:text-gray-400 mt-1">${description}</p>` : ''}
        </div>
      `;
      fieldJs = wrapJs(`
        el.addEventListener('change', function(e) {
          console.log('Change event for ${inputId}:', e.target.value);
          ParameterAPI.setParameter('${inputId}', e.target.value);
        });
      `);
    } else if (type === 'boolean') {
      // Checkbox
      fieldHtml = `
        <div class="flex items-center">
          <input type="checkbox" id="${inputId}" ${p.default ? 'checked' : ''} class="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500 dark:bg-gray-700 dark:border-gray-600">
          <label for="${inputId}" class="ml-2 block text-sm font-medium text-gray-900 dark:text-gray-100">${label}</label>
        </div>
        ${description ? `<p class="ml-6 text-xs text-gray-500 dark:text-gray-400 mt-1">${description}</p>` : ''}
      `;
      fieldJs = wrapJs(`
        el.addEventListener('change', function(e) {
          console.log('Checkbox change for ${inputId}:', e.target.checked);
          ParameterAPI.setParameter('${inputId}', e.target.checked);
        });
      `);
    } else if (type === 'integer' || type === 'number') {
      // Number or Range
      const min = p.minimum;
      const max = p.maximum;
      const step = type === 'integer' ? 1 : (p.type === 'number' ? 0.1 : 'any'); // heuristic
      
      if (min !== undefined && max !== undefined) {
        // Range slider
        fieldHtml = `
          <div>
            <div class="flex justify-between">
              <label class="block text-sm font-medium text-gray-900 dark:text-gray-100 mb-1">${label}</label>
              <span id="${inputId}_display" class="text-xs text-gray-500 dark:text-gray-400">${p.default !== undefined ? p.default : min}</span>
            </div>
            <input type="range" id="${inputId}" min="${min}" max="${max}" step="${step}" value="${p.default !== undefined ? p.default : min}" class="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700">
            <div class="flex justify-between text-xs text-gray-500 dark:text-gray-400 mt-1">
              <span>${min}</span>
              <span>${max}</span>
            </div>
            ${description ? `<p class="text-xs text-gray-500 dark:text-gray-400 mt-1">${description}</p>` : ''}
          </div>
        `;
        fieldJs = `
          try {
            const ${inputId}Input = document.getElementById('${inputId}');
            const ${inputId}Display = document.getElementById('${inputId}_display');
            
            if (${inputId}Input && ${inputId}Display) {
              console.log('Attaching listener to ${inputId}');
              ${inputId}Input.addEventListener('input', function(e) {
                const val = ${type === 'integer' ? 'parseInt' : 'parseFloat'}(e.target.value);
                console.log('Range input for ${inputId}:', val);
                ${inputId}Display.textContent = val;
                ParameterAPI.setParameter('${inputId}', val);
              });
            } else {
              console.warn('Could not find element ${inputId} or display');
            }
          } catch (err) {
            console.error('Error attaching listener to ${inputId}:', err);
          }
        `;
      } else {
        // Simple number input
        fieldHtml = `
          <div>
            <label class="block text-sm font-medium text-gray-900 dark:text-gray-100 mb-1">${label}</label>
            <input type="number" id="${inputId}" ${min !== undefined ? `min="${min}"` : ''} ${max !== undefined ? `max="${max}"` : ''} step="${step}" value="${p.default !== undefined ? p.default : ''}" class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100">
            ${description ? `<p class="text-xs text-gray-500 dark:text-gray-400 mt-1">${description}</p>` : ''}
          </div>
        `;
        fieldJs = wrapJs(`
          el.addEventListener('change', function(e) {
            const val = ${type === 'integer' ? 'parseInt' : 'parseFloat'}(e.target.value);
            ParameterAPI.setParameter('${inputId}', val);
          });
        `);
      }
    } else if (type === 'object' || type === 'array' || !type) {
      // JSON Textarea for objects, arrays, or unknown types
      // Ensure we don't double-stringify if it's already a string
      let defaultValue = '{}';
      if (p.default) {
        defaultValue = typeof p.default === 'string' ? p.default : JSON.stringify(p.default, null, 2);
      } else if (type === 'array') {
        defaultValue = '[]';
      }
      
      fieldHtml = `
        <div>
          <label class="block text-sm font-medium text-gray-900 dark:text-gray-100 mb-1">${label} (JSON)</label>
          <textarea id="${inputId}" rows="5" class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 font-mono text-xs">${defaultValue}</textarea>
          ${description ? `<p class="text-xs text-gray-500 dark:text-gray-400 mt-1">${description}</p>` : ''}
        </div>
      `;
      
      fieldJs = wrapJs(`
        el.addEventListener('input', function(e) {
          console.log('JSON input for ${inputId}:', e.target.value);
          try {
            const val = JSON.parse(e.target.value);
            console.log('Parsed JSON for ${inputId}:', val);
            const success = ParameterAPI.setParameter('${inputId}', val);
            console.log('setParameter success for ${inputId}:', success);
            e.target.classList.remove('border-red-500', 'dark:border-red-500');
            e.target.classList.add('border-gray-300', 'dark:border-gray-600');
          } catch (err) {
            console.warn('Invalid JSON for ${inputId}:', err.message);
            // Invalid JSON
            e.target.classList.remove('border-gray-300', 'dark:border-gray-600');
            e.target.classList.add('border-red-500', 'dark:border-red-500');
          }
        });
      `);
    } else {
      // String (Text or Textarea)
      const isLongText = key.includes('prompt') || (p.maxLength && p.maxLength > 100);
      
      // Check if this string field might actually be a JSON field (heuristic)
      const isJsonField = key.includes('setting') || key.includes('config') || key.includes('params');

      if (isJsonField) {
         // Treat as JSON textarea even if type is string
         const defaultValue = p.default ? (typeof p.default === 'string' ? p.default : JSON.stringify(p.default, null, 2)) : '{}';
         
         fieldHtml = `
          <div>
            <label class="block text-sm font-medium text-gray-900 dark:text-gray-100 mb-1">${label} (JSON Object)</label>
            <textarea id="${inputId}" rows="5" class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 font-mono text-xs">${defaultValue}</textarea>
            ${description ? `<p class="text-xs text-gray-500 dark:text-gray-400 mt-1">${description}</p>` : ''}
          </div>
        `;
        
        // If the schema type is string, we should pass the raw string value (minified JSON)
        // If the schema type is object, we should pass the parsed object
        const isStringType = type === 'string';
        
        fieldJs = wrapJs(`
          el.addEventListener('input', function(e) {
            console.log('JSON input for ${inputId}:', e.target.value);
            try {
              const val = JSON.parse(e.target.value);
              console.log('Parsed JSON for ${inputId}:', val);
              
              // If schema expects string, pass the raw string (or minified JSON)
              // If schema expects object, pass the parsed object
              const valueToSet = ${isStringType} ? JSON.stringify(val) : val;
              
              ParameterAPI.setParameter('${inputId}', valueToSet);
              e.target.classList.remove('border-red-500', 'dark:border-red-500');
              e.target.classList.add('border-gray-300', 'dark:border-gray-600');
            } catch (err) {
              console.warn('Invalid JSON for ${inputId}:', err.message);
              e.target.classList.remove('border-gray-300', 'dark:border-gray-600');
              e.target.classList.add('border-red-500', 'dark:border-red-500');
            }
          });
        `);
      } else if (isLongText) {
        fieldHtml = `
          <div>
            <label class="block text-sm font-medium text-gray-900 dark:text-gray-100 mb-1">${label}</label>
            <textarea id="${inputId}" rows="3" class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100">${p.default || ''}</textarea>
            ${description ? `<p class="text-xs text-gray-500 dark:text-gray-400 mt-1">${description}</p>` : ''}
          </div>
        `;
        fieldJs = wrapJs(`
          el.addEventListener('input', function(e) {
            console.log('String input for ${inputId}:', e.target.value);
            const success = ParameterAPI.setParameter('${inputId}', e.target.value);
            console.log('setParameter success for ${inputId}:', success);
          });
        `);
      } else {
        fieldHtml = `
          <div>
            <label class="block text-sm font-medium text-gray-900 dark:text-gray-100 mb-1">${label}</label>
            <input type="text" id="${inputId}" value="${p.default || ''}" class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100">
            ${description ? `<p class="text-xs text-gray-500 dark:text-gray-400 mt-1">${description}</p>` : ''}
          </div>
        `;
        fieldJs = wrapJs(`
          el.addEventListener('input', function(e) {
            console.log('String input for ${inputId}:', e.target.value);
            const success = ParameterAPI.setParameter('${inputId}', e.target.value);
            console.log('setParameter success for ${inputId}:', success);
          });
        `);
      }
    }

    htmlParts.push(fieldHtml);
    jsParts.push(fieldJs);
  }

  htmlParts.push('</div>');

  return {
    html: htmlParts.join('\n'),
    javascript: jsParts.join('\n'),
    success: true
  };
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
