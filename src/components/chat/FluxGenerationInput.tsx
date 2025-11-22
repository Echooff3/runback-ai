import { useState, useEffect } from 'react';
import { PaperAirplaneIcon } from '@heroicons/react/24/solid';
import { PhotoIcon } from '@heroicons/react/24/outline';

interface FluxGenerationInputProps {
  onSend: (message: string) => void;
  disabled?: boolean;
  initialPrompt?: string;
}

type ImageSize = 'square_hd' | 'square' | 'portrait_4_3' | 'portrait_16_9' | 'landscape_4_3' | 'landscape_16_9';
type OutputFormat = 'jpeg' | 'png';
type Acceleration = 'none' | 'regular' | 'high';

export default function FluxGenerationInput({ 
  onSend, 
  disabled = false,
  initialPrompt = ''
}: FluxGenerationInputProps) {
  const [prompt, setPrompt] = useState('');
  const [imageSize, setImageSize] = useState<ImageSize>('landscape_4_3');
  const [numImages, setNumImages] = useState(1);
  const [enableSafetyChecker, setEnableSafetyChecker] = useState(true);
  const [outputFormat, setOutputFormat] = useState<OutputFormat>('jpeg');
  const [acceleration, setAcceleration] = useState<Acceleration>('none');
  const [showAdvanced, setShowAdvanced] = useState(false);

  // Load initial values when they change
  useEffect(() => {
    if (initialPrompt) setPrompt(initialPrompt);
  }, [initialPrompt]);

  const handleSend = () => {
    if (!prompt.trim() || disabled) return;

    const payload = JSON.stringify({
      prompt: prompt.trim(),
      image_size: imageSize,
      num_images: numImages,
      enable_safety_checker: enableSafetyChecker,
      output_format: outputFormat,
      acceleration: acceleration
    });
    
    onSend(payload);
    setPrompt('');
  };

  return (
    <div className="border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-4 py-4">
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400">
            <PhotoIcon className="w-5 h-5" />
            <span className="text-sm font-medium">Flux Image Generation</span>
          </div>
          <button 
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="text-xs text-gray-500 hover:text-indigo-600 dark:text-gray-400 dark:hover:text-indigo-400"
          >
            {showAdvanced ? 'Hide Options' : 'Show Options'}
          </button>
        </div>
        
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="Describe the image you want to generate..."
          disabled={disabled}
          rows={3}
          className="w-full resize-none bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-3 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50"
        />
        
        {showAdvanced && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-gray-50 dark:bg-gray-750 p-3 rounded-lg border border-gray-100 dark:border-gray-700">
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
