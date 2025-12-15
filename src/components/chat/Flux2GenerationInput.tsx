import { useState, useEffect, useRef, type KeyboardEvent } from 'react';
import { PaperAirplaneIcon } from '@heroicons/react/24/solid';
import { PhotoIcon } from '@heroicons/react/24/outline';
import { Link } from 'react-router-dom';
import { getSlashPrompts, saveSlashPrompt } from '../../lib/storage/localStorage';
import type { SlashPrompt } from '../../types';

interface Flux2GenerationInputProps {
  onSend: (message: string) => void;
  disabled?: boolean;
  initialPrompt?: string;
}

type ImageSize = 'square_hd' | 'square' | 'portrait_4_3' | 'portrait_16_9' | 'landscape_4_3' | 'landscape_16_9';
type OutputFormat = 'jpeg' | 'png' | 'webp';
type Acceleration = 'none' | 'regular' | 'high';

export default function Flux2GenerationInput({ 
  onSend, 
  disabled = false,
  initialPrompt = ''
}: Flux2GenerationInputProps) {
  const [prompt, setPrompt] = useState('');
  const [imageSize, setImageSize] = useState<ImageSize>('square_hd');
  const [numImages, setNumImages] = useState(1);
  const [enableSafetyChecker, setEnableSafetyChecker] = useState(false);
  const [outputFormat, setOutputFormat] = useState<OutputFormat>('png');
  const [acceleration, setAcceleration] = useState<Acceleration>('regular');
  const [enablePromptExpansion, setEnablePromptExpansion] = useState(false);
  const [guidanceScale, setGuidanceScale] = useState(2.5);
  const [numInferenceSteps, setNumInferenceSteps] = useState(28);
  const [seed, setSeed] = useState<number | undefined>(undefined);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [showSlashSuggestions, setShowSlashSuggestions] = useState(false);
  const [slashSuggestions, setSlashSuggestions] = useState<SlashPrompt[]>([]);
  const [selectedSuggestionIndex, setSelectedSuggestionIndex] = useState(0);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Load initial values when they change
  useEffect(() => {
    if (initialPrompt) setPrompt(initialPrompt);
  }, [initialPrompt]);

  // Check for slash command trigger
  useEffect(() => {
    const lastWord = prompt.split(/\s/).pop() || '';
    if (lastWord.startsWith('/') && lastWord.length > 0) {
      const slashPrompts = getSlashPrompts();
      const filtered = slashPrompts.filter(p => 
        p.command.toLowerCase().startsWith(lastWord.toLowerCase())
      );
      if (filtered.length > 0) {
        setSlashSuggestions(filtered);
        setShowSlashSuggestions(true);
        setSelectedSuggestionIndex(0);
      } else {
        setShowSlashSuggestions(false);
      }
    } else {
      setShowSlashSuggestions(false);
    }
  }, [prompt]);

  const handleSlashPromptSelect = (slashPrompt: SlashPrompt) => {
    // Update usage count
    saveSlashPrompt({
      ...slashPrompt,
      usageCount: slashPrompt.usageCount + 1,
    });

    // Parse the prompt to get the command and the input after it
    const promptParts = prompt.trim().split(/\s+/);
    const commandIndex = promptParts.findIndex(part => part.toLowerCase() === slashPrompt.command.toLowerCase());
    
    // Get everything after the command as the input
    const userInput = commandIndex >= 0 && promptParts.length > commandIndex + 1
      ? promptParts.slice(commandIndex + 1).join(' ')
      : '';
    
    let finalTemplate = slashPrompt.template;
    
    // Check if template uses simple <input> placeholder
    if (finalTemplate.includes('<input>')) {
      finalTemplate = finalTemplate.replace(/<input>/g, userInput);
    } else if (slashPrompt.variables.length > 0) {
      // Use the existing variable system with prompts
      for (const variable of slashPrompt.variables) {
        const value = window.prompt(`Enter value for ${variable.name}:`, variable.defaultValue || '');
        if (value !== null) {
          finalTemplate = finalTemplate.replace(new RegExp(`\\{${variable.name}\\}`, 'g'), value);
        }
      }
    }

    setPrompt(finalTemplate);
    setShowSlashSuggestions(false);
    setTimeout(() => textareaRef.current?.focus(), 0);
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (showSlashSuggestions) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedSuggestionIndex(prev => 
          prev < slashSuggestions.length - 1 ? prev + 1 : prev
        );
        return;
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedSuggestionIndex(prev => prev > 0 ? prev - 1 : prev);
        return;
      }
      if (e.key === 'Tab' || e.key === 'Enter') {
        if (!e.shiftKey && slashSuggestions[selectedSuggestionIndex]) {
          e.preventDefault();
          handleSlashPromptSelect(slashSuggestions[selectedSuggestionIndex]);
          return;
        }
      }
      if (e.key === 'Escape') {
        setShowSlashSuggestions(false);
        return;
      }
    }
  };

  const handleSend = () => {
    if (!prompt.trim() || disabled) return;

    const payload: Record<string, any> = {
      prompt: prompt.trim(),
      image_size: imageSize,
      num_images: numImages,
      enable_safety_checker: enableSafetyChecker,
      output_format: outputFormat,
      acceleration: acceleration,
      enable_prompt_expansion: enablePromptExpansion,
      guidance_scale: guidanceScale,
      num_inference_steps: numInferenceSteps
    };

    if (seed !== undefined) {
      payload.seed = seed;
    }
    
    onSend(JSON.stringify(payload));
    setPrompt('');
  };

  return (
    <div className="border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-4 py-4">
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400">
            <PhotoIcon className="w-5 h-5" />
            <span className="text-sm font-medium">Flux 2 Image Generation</span>
          </div>
          <button 
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="text-xs text-gray-500 hover:text-indigo-600 dark:text-gray-400 dark:hover:text-indigo-400"
          >
            {showAdvanced ? 'Hide Options' : 'Show Options'}
          </button>
        </div>

        {/* Slash Suggestions Dropdown */}
        {showSlashSuggestions && slashSuggestions.length > 0 && (
          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg overflow-hidden max-h-64 overflow-y-auto">
            <div className="flex items-center justify-between px-4 py-2 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
              <span className="text-xs font-medium text-gray-600 dark:text-gray-400">Slash Commands</span>
              <Link
                to="/slash-prompts"
                className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline"
              >
                Manage
              </Link>
            </div>
            {slashSuggestions.map((suggestion, index) => (
              <button
                key={suggestion.id}
                onClick={() => handleSlashPromptSelect(suggestion)}
                className={`w-full text-left px-4 py-3 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors ${
                  index === selectedSuggestionIndex ? 'bg-gray-100 dark:bg-gray-700' : ''
                }`}
              >
                <div className="flex items-center gap-2">
                  <code className="font-mono font-semibold text-indigo-600 dark:text-indigo-400">
                    {suggestion.command}
                  </code>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  {suggestion.description}
                </p>
              </button>
            ))}
          </div>
        )}
        
        <textarea
          ref={textareaRef}
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Describe the image you want to generate... (Type / for commands)"
          disabled={disabled}
          rows={3}
          className="w-full resize-none bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-3 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50"
        />
        
        {showAdvanced && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-gray-50 dark:bg-gray-800 p-3 rounded-lg border border-gray-100 dark:border-gray-700">
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Image Size</label>
              <select
                value={imageSize}
                onChange={(e) => setImageSize(e.target.value as ImageSize)}
                disabled={disabled}
                className="w-full bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md px-2 py-1.5 text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="square_hd">Square HD</option>
                <option value="square">Square</option>
                <option value="portrait_4_3">Portrait 4:3</option>
                <option value="portrait_16_9">Portrait 16:9</option>
                <option value="landscape_4_3">Landscape 4:3</option>
                <option value="landscape_16_9">Landscape 16:9</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Number of Images</label>
              <input
                type="number"
                min={1}
                max={4}
                value={numImages}
                onChange={(e) => setNumImages(parseInt(e.target.value))}
                disabled={disabled}
                className="w-full bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md px-2 py-1.5 text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Output Format</label>
              <select
                value={outputFormat}
                onChange={(e) => setOutputFormat(e.target.value as OutputFormat)}
                disabled={disabled}
                className="w-full bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md px-2 py-1.5 text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="jpeg">JPEG</option>
                <option value="png">PNG</option>
                <option value="webp">WebP</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Acceleration</label>
              <select
                value={acceleration}
                onChange={(e) => setAcceleration(e.target.value as Acceleration)}
                disabled={disabled}
                className="w-full bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md px-2 py-1.5 text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="none">None</option>
                <option value="regular">Regular</option>
                <option value="high">High</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Guidance Scale</label>
              <input
                type="number"
                min={0}
                max={20}
                step={0.1}
                value={guidanceScale}
                onChange={(e) => setGuidanceScale(parseFloat(e.target.value))}
                disabled={disabled}
                className="w-full bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md px-2 py-1.5 text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Inference Steps</label>
              <input
                type="number"
                min={4}
                max={50}
                value={numInferenceSteps}
                onChange={(e) => setNumInferenceSteps(parseInt(e.target.value))}
                disabled={disabled}
                className="w-full bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md px-2 py-1.5 text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Seed (Optional)</label>
              <input
                type="number"
                value={seed ?? ''}
                onChange={(e) => setSeed(e.target.value ? parseInt(e.target.value) : undefined)}
                placeholder="Random"
                disabled={disabled}
                className="w-full bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md px-2 py-1.5 text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div className="flex items-center mt-2">
              <input
                type="checkbox"
                id="safety-checker"
                checked={enableSafetyChecker}
                onChange={(e) => setEnableSafetyChecker(e.target.checked)}
                disabled={disabled}
                className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
              />
              <label htmlFor="safety-checker" className="ml-2 block text-sm text-gray-700 dark:text-gray-300">
                Enable Safety Checker
              </label>
            </div>

            <div className="flex items-center mt-2">
              <input
                type="checkbox"
                id="prompt-expansion"
                checked={enablePromptExpansion}
                onChange={(e) => setEnablePromptExpansion(e.target.checked)}
                disabled={disabled}
                className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
              />
              <label htmlFor="prompt-expansion" className="ml-2 block text-sm text-gray-700 dark:text-gray-300">
                Enable Prompt Expansion
              </label>
            </div>
          </div>
        )}

        <div className="flex justify-end">
          <button
            onClick={handleSend}
            disabled={disabled || !prompt.trim()}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            title="Generate Image"
          >
            <span>Generate</span>
            <PaperAirplaneIcon className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
