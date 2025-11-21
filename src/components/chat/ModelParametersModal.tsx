import { useEffect, useState, useRef } from 'react';
import { XMarkIcon, ArrowPathIcon } from '@heroicons/react/24/outline';
import DOMPurify from 'dompurify';
import {
  parameterManager,
  installGlobalParameterAPI,
  uninstallGlobalParameterAPI,
} from '../../lib/parameterAPI';
import type { ModelParameters } from '../../types';
import { fetchModelSchema, extractInputSchema } from '../../lib/api/falParameters';
import {
  generateParameterForm,
  convertOpenAPIToParameterSchema,
  clearFormCache,
} from '../../lib/api/htmlGenerator';
import {
  saveModelParameters,
  getModelParameters,
  clearModelParameters,
} from '../../lib/storage/localStorage';

interface ModelParametersModalProps {
  isOpen: boolean;
  onClose: () => void;
  modelId: string;
  falApiKey: string;
  openrouterApiKey: string;
  onParametersChange: (parameters: ModelParameters) => void;
  initialParameters?: ModelParameters;
}

export default function ModelParametersModal({
  isOpen,
  onClose,
  modelId,
  falApiKey,
  openrouterApiKey,
  onParametersChange,
  initialParameters,
}: ModelParametersModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [generatedHTML, setGeneratedHTML] = useState<string>('');
  const [generatedJS, setGeneratedJS] = useState<string>('');
  const [hasGenerated, setHasGenerated] = useState(false);
  const [isRegenerating, setIsRegenerating] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const unsubscribeRef = useRef<(() => void) | null>(null);

  // Load and generate form when modal opens
  useEffect(() => {
    if (isOpen && !hasGenerated) {
      loadAndGenerateForm();
    }
  }, [isOpen, modelId]);

  // Install global API and execute JS when form is ready
  useEffect(() => {
    if (generatedHTML && generatedJS) {
      installGlobalParameterAPI();

      // Subscribe to parameter changes
      unsubscribeRef.current = parameterManager.onChange((params) => {
        onParametersChange(params);
      });

      // Execute the generated JavaScript
      try {
        // Use Function constructor for safer eval alternative
        const func = new Function(generatedJS);
        func();
      } catch (err) {
        console.error('Failed to execute generated JavaScript:', err);
        setError('Failed to initialize form controls');
      }

      return () => {
        if (unsubscribeRef.current) {
          unsubscribeRef.current();
        }
        uninstallGlobalParameterAPI();
      };
    }
  }, [generatedHTML, generatedJS]);

  const loadAndGenerateForm = async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Step 1: Fetch the model schema
      const schema = await fetchModelSchema(modelId, falApiKey);
      const inputSchema = extractInputSchema(schema);

      if (!inputSchema) {
        throw new Error('Could not extract input schema from model');
      }

      // Step 2: Convert to parameter schema
      const paramSchema = convertOpenAPIToParameterSchema(inputSchema);
      parameterManager.initialize(paramSchema);

      // Step 3: Load saved parameters or use initial values
      const savedParams = getModelParameters(modelId) || initialParameters;
      if (savedParams) {
        parameterManager.loadParameters(savedParams);
      }

      // Step 4: Generate HTML form with Grok
      const result = await generateParameterForm(
        modelId,
        'fal',
        inputSchema,
        openrouterApiKey,
        false
      );

      if (!result.success) {
        throw new Error(result.error || 'Failed to generate parameter form');
      }

      // Step 5: Sanitize HTML
      const sanitized = DOMPurify.sanitize(result.html, {
        ALLOWED_TAGS: [
          'div',
          'label',
          'input',
          'select',
          'option',
          'textarea',
          'button',
          'span',
          'p',
          'h1',
          'h2',
          'h3',
          'h4',
          'h5',
          'h6',
        ],
        ALLOWED_ATTR: [
          'class',
          'id',
          'type',
          'name',
          'value',
          'placeholder',
          'min',
          'max',
          'step',
          'rows',
          'cols',
          'required',
          'checked',
          'disabled',
          'readonly',
        ],
      });

      setGeneratedHTML(sanitized);
      setGeneratedJS(result.javascript);
      setHasGenerated(true);
      onParametersChange(parameterManager.getAllParameters());
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(errorMessage);
      console.error('Failed to load parameter form:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegenerate = async () => {
    setIsRegenerating(true);
    setError(null);

    try {
      // Clear cached form
      await clearFormCache(modelId, 'fal');

      // Fetch schema again
      const schema = await fetchModelSchema(modelId, falApiKey, true);
      const inputSchema = extractInputSchema(schema);

      if (!inputSchema) {
        throw new Error('Could not extract input schema from model');
      }

      // Generate new form
      const result = await generateParameterForm(
        modelId,
        'fal',
        inputSchema,
        openrouterApiKey,
        true
      );

      if (!result.success) {
        throw new Error(result.error || 'Failed to regenerate parameter form');
      }

      // Sanitize and update
      const sanitized = DOMPurify.sanitize(result.html, {
        ALLOWED_TAGS: [
          'div',
          'label',
          'input',
          'select',
          'option',
          'textarea',
          'button',
          'span',
          'p',
          'h1',
          'h2',
          'h3',
          'h4',
          'h5',
          'h6',
        ],
        ALLOWED_ATTR: [
          'class',
          'id',
          'type',
          'name',
          'value',
          'placeholder',
          'min',
          'max',
          'step',
          'rows',
          'cols',
          'required',
          'checked',
          'disabled',
          'readonly',
        ],
      });

      setGeneratedHTML(sanitized);
      setGeneratedJS(result.javascript);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to regenerate form';
      setError(errorMessage);
    } finally {
      setIsRegenerating(false);
    }
  };

  const handleReset = () => {
    parameterManager.resetParameters();
    onParametersChange(parameterManager.getAllParameters());
  };

  const handleClearSaved = () => {
    clearModelParameters(modelId);
    parameterManager.resetParameters();
    onParametersChange(parameterManager.getAllParameters());
  };

  const handleSave = () => {
    const params = parameterManager.getAllParameters();
    saveModelParameters(modelId, params);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div className="relative w-full h-full sm:h-auto sm:max-h-[90vh] sm:max-w-3xl sm:rounded-xl bg-white dark:bg-gray-900 shadow-xl flex flex-col animate-slide-up sm:animate-none">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-4 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">
              Model Parameters
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5 truncate max-w-md">
              {modelId}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleRegenerate}
              disabled={isLoading || isRegenerating}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors disabled:opacity-50"
              title="Regenerate form"
            >
              <ArrowPathIcon
                className={`w-5 h-5 text-gray-500 dark:text-gray-400 ${
                  isRegenerating ? 'animate-spin' : ''
                }`}
              />
            </button>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
              aria-label="Close modal"
            >
              <XMarkIcon className="w-6 h-6 text-gray-500 dark:text-gray-400" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-4 py-6">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="flex items-center gap-2 mb-4">
                <div
                  className="w-2 h-2 bg-indigo-600 rounded-full animate-bounce"
                  style={{ animationDelay: '0ms' }}
                ></div>
                <div
                  className="w-2 h-2 bg-indigo-600 rounded-full animate-bounce"
                  style={{ animationDelay: '150ms' }}
                ></div>
                <div
                  className="w-2 h-2 bg-indigo-600 rounded-full animate-bounce"
                  style={{ animationDelay: '300ms' }}
                ></div>
              </div>
              <p className="text-gray-600 dark:text-gray-400">Generating parameter form...</p>
              <p className="text-sm text-gray-500 dark:text-gray-500 mt-2">
                Using Grok AI to create controls
              </p>
            </div>
          ) : error ? (
            <div className="py-8">
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg px-4 py-3 mb-4">
                <p className="text-red-800 dark:text-red-300 text-sm font-medium mb-2">
                  Failed to load parameters
                </p>
                <p className="text-red-700 dark:text-red-400 text-sm">{error}</p>
              </div>
              <div className="text-center">
                <button
                  onClick={loadAndGenerateForm}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium transition-colors"
                >
                  Try Again
                </button>
              </div>
            </div>
          ) : generatedHTML ? (
            <div
              ref={containerRef}
              dangerouslySetInnerHTML={{ __html: generatedHTML }}
              className="text-gray-900 dark:text-gray-100"
            />
          ) : (
            <div className="text-center py-12">
              <p className="text-gray-500 dark:text-gray-400">
                No parameters available for this model
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        {generatedHTML && !error && (
          <div className="px-4 py-3 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 flex-shrink-0">
            <div className="flex items-center justify-between gap-2">
              <div className="flex gap-2">
                <button
                  onClick={handleReset}
                  className="px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors"
                >
                  Reset to Defaults
                </button>
                <button
                  onClick={handleClearSaved}
                  className="px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors"
                >
                  Clear Saved
                </button>
              </div>
              <button
                onClick={handleSave}
                disabled={!parameterManager.isValid()}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Save & Close
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
