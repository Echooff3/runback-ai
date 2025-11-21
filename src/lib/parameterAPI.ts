/**
 * Parameter API for Grok-generated HTML/JS
 * Provides a safe bridge between generated code and React state
 */

export interface ParameterValue {
  value: any;
  type: string;
  valid: boolean;
  error?: string;
}

export interface ParameterConstraints {
  type: string;
  minimum?: number;
  maximum?: number;
  minLength?: number;
  maxLength?: number;
  pattern?: string;
  enum?: any[];
  required?: boolean;
  default?: any;
}

export interface ParameterSchema {
  [key: string]: ParameterConstraints;
}

class ParameterManager {
  private parameters: Map<string, ParameterValue> = new Map();
  private schema: ParameterSchema = {};
  private changeListeners: Set<(params: Record<string, any>) => void> = new Set();

  /**
   * Initialize the parameter manager with a schema
   */
  initialize(schema: ParameterSchema): void {
    this.schema = schema;
    this.parameters.clear();
    
    // Set default values from schema
    for (const [key, constraints] of Object.entries(schema)) {
      if (constraints.default !== undefined) {
        this.parameters.set(key, {
          value: constraints.default,
          type: constraints.type,
          valid: true,
        });
      }
    }
    
    this.notifyListeners();
  }

  /**
   * Load parameters from saved state
   */
  loadParameters(params: Record<string, any>): void {
    for (const [key, value] of Object.entries(params)) {
      const constraints = this.schema[key];
      if (constraints) {
        const validation = this.validate(key, value, constraints);
        this.parameters.set(key, {
          value,
          type: constraints.type,
          valid: validation.valid,
          error: validation.error,
        });
      }
    }
    this.notifyListeners();
  }

  /**
   * Set a parameter value with validation
   */
  setParameter(name: string, value: any): boolean {
    const constraints = this.schema[name];
    
    if (!constraints) {
      console.warn(`Parameter "${name}" not found in schema`);
      return false;
    }

    const validation = this.validate(name, value, constraints);
    
    this.parameters.set(name, {
      value,
      type: constraints.type,
      valid: validation.valid,
      error: validation.error,
    });

    this.notifyListeners();
    return validation.valid;
  }

  /**
   * Get a parameter value
   */
  getParameter(name: string): any {
    const param = this.parameters.get(name);
    return param?.value;
  }

  /**
   * Get all parameters as a plain object (only valid ones)
   */
  getAllParameters(): Record<string, any> {
    const result: Record<string, any> = {};
    
    for (const [key, param] of this.parameters) {
      if (param.valid && param.value !== undefined) {
        result[key] = param.value;
      }
    }
    
    return result;
  }

  /**
   * Get all parameters including validation state
   */
  getAllParametersWithState(): Record<string, ParameterValue> {
    const result: Record<string, ParameterValue> = {};
    
    for (const [key, param] of this.parameters) {
      result[key] = { ...param };
    }
    
    return result;
  }

  /**
   * Validate a parameter value against constraints
   */
  validateParameter(name: string, value?: any): { valid: boolean; error?: string } {
    const constraints = this.schema[name];
    
    if (!constraints) {
      return { valid: false, error: `Parameter "${name}" not found in schema` };
    }

    const valueToValidate = value !== undefined ? value : this.getParameter(name);
    return this.validate(name, valueToValidate, constraints);
  }

  /**
   * Reset parameters to default values
   */
  resetParameters(): void {
    this.parameters.clear();
    
    for (const [key, constraints] of Object.entries(this.schema)) {
      if (constraints.default !== undefined) {
        this.parameters.set(key, {
          value: constraints.default,
          type: constraints.type,
          valid: true,
        });
      }
    }
    
    this.notifyListeners();
  }

  /**
   * Check if all required parameters are valid
   */
  isValid(): boolean {
    for (const [key, constraints] of Object.entries(this.schema)) {
      if (constraints.required) {
        const param = this.parameters.get(key);
        if (!param || !param.valid || param.value === undefined) {
          return false;
        }
      }
    }
    
    // Check all set parameters are valid
    for (const param of this.parameters.values()) {
      if (!param.valid) {
        return false;
      }
    }
    
    return true;
  }

  /**
   * Get validation errors
   */
  getErrors(): Record<string, string> {
    const errors: Record<string, string> = {};
    
    for (const [key, param] of this.parameters) {
      if (!param.valid && param.error) {
        errors[key] = param.error;
      }
    }
    
    return errors;
  }

  /**
   * Register a change listener
   */
  onChange(callback: (params: Record<string, any>) => void): () => void {
    this.changeListeners.add(callback);
    return () => this.changeListeners.delete(callback);
  }

  /**
   * Internal validation logic
   */
  private validate(
    name: string,
    value: any,
    constraints: ParameterConstraints
  ): { valid: boolean; error?: string } {
    // Check required
    if (constraints.required && (value === undefined || value === null || value === '')) {
      return { valid: false, error: `${name} is required` };
    }

    // Allow undefined/null for optional fields
    if (value === undefined || value === null) {
      return { valid: true };
    }

    // Type validation
    const actualType = Array.isArray(value) ? 'array' : typeof value;
    const expectedType = constraints.type;

    // Handle type coercion and validation
    switch (expectedType) {
      case 'string':
        if (actualType !== 'string') {
          value = String(value);
        }
        
        if (constraints.minLength !== undefined && value.length < constraints.minLength) {
          return { valid: false, error: `${name} must be at least ${constraints.minLength} characters` };
        }
        
        if (constraints.maxLength !== undefined && value.length > constraints.maxLength) {
          return { valid: false, error: `${name} must be at most ${constraints.maxLength} characters` };
        }
        
        if (constraints.pattern) {
          const regex = new RegExp(constraints.pattern);
          if (!regex.test(value)) {
            return { valid: false, error: `${name} does not match required pattern` };
          }
        }
        
        if (constraints.enum && !constraints.enum.includes(value)) {
          return { valid: false, error: `${name} must be one of: ${constraints.enum.join(', ')}` };
        }
        break;

      case 'number':
      case 'integer':
        const num = typeof value === 'number' ? value : parseFloat(value);
        
        if (isNaN(num)) {
          return { valid: false, error: `${name} must be a number` };
        }
        
        if (expectedType === 'integer' && !Number.isInteger(num)) {
          return { valid: false, error: `${name} must be an integer` };
        }
        
        if (constraints.minimum !== undefined && num < constraints.minimum) {
          return { valid: false, error: `${name} must be at least ${constraints.minimum}` };
        }
        
        if (constraints.maximum !== undefined && num > constraints.maximum) {
          return { valid: false, error: `${name} must be at most ${constraints.maximum}` };
        }
        break;

      case 'boolean':
        if (actualType !== 'boolean') {
          // Allow string coercion
          if (value === 'true' || value === 'false') {
            value = value === 'true';
          } else {
            return { valid: false, error: `${name} must be true or false` };
          }
        }
        break;

      case 'array':
        if (!Array.isArray(value)) {
          return { valid: false, error: `${name} must be an array` };
        }
        
        if (constraints.minLength !== undefined && value.length < constraints.minLength) {
          return { valid: false, error: `${name} must have at least ${constraints.minLength} items` };
        }
        
        if (constraints.maxLength !== undefined && value.length > constraints.maxLength) {
          return { valid: false, error: `${name} must have at most ${constraints.maxLength} items` };
        }
        break;

      case 'object':
        if (actualType !== 'object' || Array.isArray(value)) {
          return { valid: false, error: `${name} must be an object` };
        }
        break;
    }

    return { valid: true };
  }

  /**
   * Notify all listeners of parameter changes
   */
  private notifyListeners(): void {
    const params = this.getAllParameters();
    this.changeListeners.forEach(listener => listener(params));
  }
}

// Create singleton instance
const parameterManager = new ParameterManager();

// Export for direct use in React components
export { parameterManager };

/**
 * Install global API for generated HTML/JS to use
 */
export function installGlobalParameterAPI(): void {
  (window as any).ParameterAPI = {
    setParameter: (name: string, value: any) => parameterManager.setParameter(name, value),
    getParameter: (name: string) => parameterManager.getParameter(name),
    getAllParameters: () => parameterManager.getAllParameters(),
    validateParameter: (name: string, value?: any) => parameterManager.validateParameter(name, value),
    resetParameters: () => parameterManager.resetParameters(),
    isValid: () => parameterManager.isValid(),
    getErrors: () => parameterManager.getErrors(),
  };
}

/**
 * Uninstall global API
 */
export function uninstallGlobalParameterAPI(): void {
  delete (window as any).ParameterAPI;
}
