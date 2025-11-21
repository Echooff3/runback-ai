/**
 * FAL.ai Parameter Schema Fetching Service
 * Fetches OpenAPI schemas for FAL models with caching
 */

interface OpenAPISchema {
  openapi: string;
  info: any;
  components: {
    schemas: Record<string, any>;
  };
  paths: Record<string, any>;
}

interface FalModelWithSchema {
  endpoint_id: string;
  metadata: {
    display_name?: string;
    description?: string;
    [key: string]: any;
  };
  openapi: OpenAPISchema;
}

interface CachedSchema {
  schema: OpenAPISchema;
  timestamp: number;
}

// In-memory cache
const schemaCache = new Map<string, CachedSchema>();

// Cache TTL: 24 hours
const CACHE_TTL = 24 * 60 * 60 * 1000;

// LocalStorage cache key prefix
const CACHE_KEY_PREFIX = 'fal_schema_cache_';

/**
 * Load cached schema from localStorage
 */
function loadFromLocalStorage(modelId: string): OpenAPISchema | null {
  try {
    const key = CACHE_KEY_PREFIX + modelId;
    const cached = localStorage.getItem(key);
    
    if (!cached) return null;
    
    const parsed: CachedSchema = JSON.parse(cached);
    const age = Date.now() - parsed.timestamp;
    
    // Check if cache is still valid
    if (age < CACHE_TTL) {
      return parsed.schema;
    } else {
      // Remove expired cache
      localStorage.removeItem(key);
      return null;
    }
  } catch (error) {
    console.error('Failed to load schema from localStorage:', error);
    return null;
  }
}

/**
 * Save schema to localStorage
 */
function saveToLocalStorage(modelId: string, schema: OpenAPISchema): void {
  try {
    const key = CACHE_KEY_PREFIX + modelId;
    const cached: CachedSchema = {
      schema,
      timestamp: Date.now(),
    };
    localStorage.setItem(key, JSON.stringify(cached));
  } catch (error) {
    console.error('Failed to save schema to localStorage:', error);
  }
}

/**
 * Fetch FAL model schema with OpenAPI 3.0 expansion
 */
export async function fetchModelSchema(
  modelId: string,
  apiKey: string,
  forceRefresh = false
): Promise<OpenAPISchema> {
  // Check memory cache first
  if (!forceRefresh) {
    const memCached = schemaCache.get(modelId);
    if (memCached && Date.now() - memCached.timestamp < CACHE_TTL) {
      return memCached.schema;
    }

    // Check localStorage cache
    const localCached = loadFromLocalStorage(modelId);
    if (localCached) {
      // Populate memory cache
      schemaCache.set(modelId, {
        schema: localCached,
        timestamp: Date.now(),
      });
      return localCached;
    }
  }

  // Fetch from API with expand parameter
  // Fetch from API with expand parameter and endpoint_id query param
  try {
    const encodedModelId = encodeURIComponent(modelId);
    const response = await fetch(
      `https://api.fal.ai/v1/models?expand=openapi-3.0&endpoint_id=${encodedModelId}`,
      {
        method: 'GET',
        headers: {
          Authorization: `Key ${apiKey}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to fetch model schema: ${response.statusText}`);
    }

    const data = await response.json();
    
    // API returns an object with models array
    const models = data.models || [];
    if (models.length === 0) {
      throw new Error('Model not found');
    }
    
    const modelData: FalModelWithSchema = models[0];

    if (!modelData.openapi) {
      throw new Error('Model does not have OpenAPI schema');
    }

    // Cache the schema
    schemaCache.set(modelId, {
      schema: modelData.openapi,
      timestamp: Date.now(),
    });
    saveToLocalStorage(modelId, modelData.openapi);

    return modelData.openapi;
  } catch (error) {
    console.error('Failed to fetch FAL model schema:', error);
    throw error;
  }
}

/**
 * Extract input schema from OpenAPI schema
 */
export function extractInputSchema(openapi: OpenAPISchema): any {
  try {
    // Look for the input schema in components
    const schemas = openapi.components?.schemas || {};
    
    // Find schema that looks like input (commonly ends with "Input")
    const inputSchemaKey = Object.keys(schemas).find(
      key => key.toLowerCase().includes('input')
    );
    
    if (inputSchemaKey) {
      return schemas[inputSchemaKey];
    }
    
    // Fallback: try to find from POST endpoint
    const paths = openapi.paths || {};
    for (const path of Object.values(paths)) {
      const postMethod = (path as any).post;
      if (postMethod?.requestBody?.content?.['application/json']?.schema) {
        const schema = postMethod.requestBody.content['application/json'].schema;
        // Resolve $ref if needed
        if (schema.$ref) {
          const refKey = schema.$ref.split('/').pop();
          return schemas[refKey] || schema;
        }
        return schema;
      }
    }
    
    return null;
  } catch (error) {
    console.error('Failed to extract input schema:', error);
    return null;
  }
}

/**
 * Clear cached schema for a model
 */
export function clearSchemaCache(modelId?: string): void {
  if (modelId) {
    schemaCache.delete(modelId);
    localStorage.removeItem(CACHE_KEY_PREFIX + modelId);
  } else {
    // Clear all
    schemaCache.clear();
    Object.keys(localStorage)
      .filter(key => key.startsWith(CACHE_KEY_PREFIX))
      .forEach(key => localStorage.removeItem(key));
  }
}

/**
 * Get all cached model IDs
 */
export function getCachedModelIds(): string[] {
  const ids = Array.from(schemaCache.keys());
  const localIds = Object.keys(localStorage)
    .filter(key => key.startsWith(CACHE_KEY_PREFIX))
    .map(key => key.substring(CACHE_KEY_PREFIX.length));
  
  return Array.from(new Set([...ids, ...localIds]));
}
