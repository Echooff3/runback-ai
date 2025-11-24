import { useState, useEffect } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import type { SlashPrompt } from '../../types';

interface SlashPromptModalProps {
  prompt: SlashPrompt;
  onSave: (prompt: SlashPrompt) => void;
  onClose: () => void;
}

export default function SlashPromptModal({ prompt, onSave, onClose }: SlashPromptModalProps) {
  const [command, setCommand] = useState(prompt.command);
  const [description, setDescription] = useState(prompt.description);
  const [template, setTemplate] = useState(prompt.template);
  const [detectedVariables, setDetectedVariables] = useState<string[]>([]);

  // Extract variables from template
  useEffect(() => {
    const regex = /\{(\w+)\}/g;
    const matches = [...template.matchAll(regex)];
    const uniqueVars = [...new Set(matches.map(m => m[1]))];
    setDetectedVariables(uniqueVars);
  }, [template]);

  // Check if template contains <input> placeholder
  const hasInputPlaceholder = template.includes('<input>');

  const handleSave = () => {
    if (!command.trim() || !command.startsWith('/')) {
      alert('Command must start with /');
      return;
    }

    if (!description.trim()) {
      alert('Please enter a description');
      return;
    }

    if (!template.trim()) {
      alert('Please enter a template');
      return;
    }

    // Create variables array from detected variables
    const variables = detectedVariables.map(name => {
      const existingVar = prompt.variables.find(v => v.name === name);
      return existingVar || {
        name,
        description: '',
        defaultValue: '',
      };
    });

    onSave({
      ...prompt,
      command: command.trim(),
      description: description.trim(),
      template: template.trim(),
      variables,
    });
  };

  const handleCommandChange = (value: string) => {
    // Ensure command starts with /
    if (!value.startsWith('/')) {
      value = '/' + value;
    }
    // Remove spaces and special chars (except /)
    value = value.replace(/[^a-zA-Z0-9_/]/g, '');
    setCommand(value);
  };

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
      onClick={handleBackdropClick}
    >
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">
            {prompt.command && prompt.command !== '/' ? 'Edit Slash Prompt' : 'New Slash Prompt'}
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <XMarkIcon className="w-5 h-5 text-gray-600 dark:text-gray-400" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
          {/* Command */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Command <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={command}
              onChange={(e) => handleCommandChange(e.target.value)}
              placeholder="/mycommand"
              maxLength={30}
              className="w-full bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-2 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono"
            />
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Must start with / and contain only letters, numbers, and underscores
            </p>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Description <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Brief description of what this command does"
              maxLength={100}
              className="w-full bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-2 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* Template */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Template <span className="text-red-500">*</span>
            </label>
            <textarea
              value={template}
              onChange={(e) => setTemplate(e.target.value)}
              placeholder="Enter template text. Use {variableName} for placeholders or <input> for simple input"
              rows={6}
              maxLength={1000}
              className="w-full resize-none bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-3 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono text-sm"
            />
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Use {'{variable}'} syntax for multiple placeholders, or <code className="px-1 py-0.5 bg-gray-200 dark:bg-gray-700 rounded">&lt;input&gt;</code> for simple single input
            </p>
          </div>

          {/* Simple Input Placeholder Info */}
          {hasInputPlaceholder && (
            <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-3">
              <p className="text-sm font-medium text-green-900 dark:text-green-100 mb-1">
                Simple Input Mode
              </p>
              <p className="text-xs text-green-700 dark:text-green-300">
                <code className="px-1 py-0.5 bg-green-100 dark:bg-green-900 rounded">&lt;input&gt;</code> will be replaced with everything you type after the command. 
                Example: <code className="px-1 py-0.5 bg-green-100 dark:bg-green-900 rounded">/make landscape painting</code> replaces <code className="px-1 py-0.5 bg-green-100 dark:bg-green-900 rounded">&lt;input&gt;</code> with "landscape painting"
              </p>
            </div>
          )}

          {/* Detected Variables */}
          {detectedVariables.length > 0 && !hasInputPlaceholder && (
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
              <p className="text-sm font-medium text-blue-900 dark:text-blue-100 mb-2">
                Detected Variables:
              </p>
              <div className="flex flex-wrap gap-2">
                {detectedVariables.map((variable, index) => (
                  <span
                    key={index}
                    className="text-sm px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded font-mono"
                  >
                    {'{' + variable + '}'}
                  </span>
                ))}
              </div>
              <p className="text-xs text-blue-700 dark:text-blue-300 mt-2">
                These variables will be prompted when using this slash command
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 px-6 py-4 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-900 dark:text-gray-100 rounded-lg font-medium transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium transition-colors"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
}
