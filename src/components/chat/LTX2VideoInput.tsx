import { useState, type KeyboardEvent } from 'react';
import { SparklesIcon, VideoCameraIcon } from '@heroicons/react/24/solid';
import { useSettingsStore } from '../../stores/settingsStore';
import { AiPolisherTasks } from '../../lib/aiPolisher';

interface LTX2VideoInputProps {
  onSend: (message: string) => void;
  disabled?: boolean;
}

interface LTX2VideoPayload {
  prompt: string;
  num_frames?: number;
  video_size?: string | { width: number; height: number };
  generate_audio?: boolean;
  use_multiscale?: boolean;
  fps?: number;
  acceleration?: 'none' | 'regular' | 'high' | 'full';
  camera_lora?: 'dolly_in' | 'dolly_out' | 'dolly_left' | 'dolly_right' | 'jib_up' | 'jib_down' | 'static' | 'none';
  camera_lora_scale?: number;
  negative_prompt?: string;
  seed?: number | null;
  enable_prompt_expansion?: boolean;
  enable_safety_checker?: boolean;
  video_output_type?: 'X264 (.mp4)' | 'VP9 (.webm)' | 'PRORES4444 (.mov)' | 'GIF (.gif)';
  video_quality?: 'low' | 'medium' | 'high' | 'maximum';
  video_write_mode?: 'fast' | 'balanced' | 'small';
  sync_mode?: boolean;
}

const DEFAULT_NEGATIVE_PROMPT = "blurry, out of focus, overexposed, underexposed, low contrast, washed out colors, excessive noise, grainy texture, poor lighting, flickering, motion blur, distorted proportions, unnatural skin tones, deformed facial features, asymmetrical face, missing facial features, extra limbs, disfigured hands, wrong hand count, artifacts around text, inconsistent perspective, camera shake, incorrect depth of field, background too sharp, background clutter, distracting reflections, harsh shadows, inconsistent lighting direction, color banding, cartoonish rendering, 3D CGI look, unrealistic materials, uncanny valley effect, incorrect ethnicity, wrong gender, exaggerated expressions, wrong gaze direction, mismatched lip sync, silent or muted audio, distorted voice, robotic voice, echo, background noise, off-sync audio,incorrect dialogue, added dialogue, repetitive speech, jittery movement, awkward pauses, incorrect timing, unnatural transitions, inconsistent framing, tilted camera, flat lighting, inconsistent tone, cinematic oversaturation, stylized filters, or AI artifacts.";

export default function LTX2VideoInput({ 
  onSend, 
  disabled = false
}: LTX2VideoInputProps) {
  const [viewMode, setViewMode] = useState<'simple' | 'advanced'>('simple');
  const [prompt, setPrompt] = useState('');
  const [isPolishing, setIsPolishing] = useState(false);
  
  // Simple view state
  const [generateAudio, setGenerateAudio] = useState(false);
  
  // Advanced view state
  const [numFrames, setNumFrames] = useState(121);
  const [videoSize, setVideoSize] = useState<string>('portrait_16_9');
  const [customWidth, setCustomWidth] = useState(576);
  const [customHeight, setCustomHeight] = useState(1024);
  const [useCustomSize, setUseCustomSize] = useState(false);
  const [useMultiscale, setUseMultiscale] = useState(true);
  const [fps, setFps] = useState(25);
  const [acceleration, setAcceleration] = useState<'none' | 'regular' | 'high' | 'full'>('none');
  const [cameraLora, setCameraLora] = useState<'dolly_in' | 'dolly_out' | 'dolly_left' | 'dolly_right' | 'jib_up' | 'jib_down' | 'static' | 'none'>('none');
  const [cameraLoraScale, setCameraLoraScale] = useState(1);
  const [negativePrompt, setNegativePrompt] = useState(DEFAULT_NEGATIVE_PROMPT);
  const [seed, setSeed] = useState<string>('');
  const [enablePromptExpansion, setEnablePromptExpansion] = useState(true);
  const [enableSafetyChecker, setEnableSafetyChecker] = useState(false);
  const [videoOutputType, setVideoOutputType] = useState<'X264 (.mp4)' | 'VP9 (.webm)' | 'PRORES4444 (.mov)' | 'GIF (.gif)'>('X264 (.mp4)');
  const [videoQuality, setVideoQuality] = useState<'low' | 'medium' | 'high' | 'maximum'>('medium');
  const [videoWriteMode, setVideoWriteMode] = useState<'fast' | 'balanced' | 'small'>('balanced');
  const [syncMode, setSyncMode] = useState(false);
  
  const { getAPIKey, helperModel } = useSettingsStore();
  const openRouterKey = getAPIKey('openrouter');

  const handleSend = () => {
    if (!prompt.trim() || disabled) return;

    const payload: LTX2VideoPayload = {
      prompt: prompt.trim(),
    };

    if (viewMode === 'simple') {
      // Simple view with preset options
      payload.video_size = 'portrait_16_9'; // 9:16 aspect ratio
      payload.num_frames = 121;
      payload.negative_prompt = DEFAULT_NEGATIVE_PROMPT;
      payload.enable_prompt_expansion = true;
      payload.enable_safety_checker = false;
      payload.video_output_type = 'X264 (.mp4)';
      payload.video_quality = 'medium';
      payload.video_write_mode = 'balanced';
      payload.generate_audio = generateAudio;
    } else {
      // Advanced view with all options
      payload.num_frames = numFrames;
      if (useCustomSize) {
        payload.video_size = { width: customWidth, height: customHeight };
      } else {
        payload.video_size = videoSize;
      }
      payload.generate_audio = generateAudio;
      payload.use_multiscale = useMultiscale;
      payload.fps = fps;
      payload.acceleration = acceleration;
      payload.camera_lora = cameraLora;
      payload.camera_lora_scale = cameraLoraScale;
      payload.negative_prompt = negativePrompt;
      if (seed.trim()) {
        payload.seed = parseInt(seed);
      }
      payload.enable_prompt_expansion = enablePromptExpansion;
      payload.enable_safety_checker = enableSafetyChecker;
      payload.video_output_type = videoOutputType;
      payload.video_quality = videoQuality;
      payload.video_write_mode = videoWriteMode;
      payload.sync_mode = syncMode;
    }
    
    onSend(JSON.stringify(payload));
    
    // Clear only the prompt field
    setPrompt('');
  };

  const handlePolishPrompt = async () => {
    if (!openRouterKey || !prompt.trim() || isPolishing) return;

    setIsPolishing(true);
    try {
      const polished = await AiPolisherTasks.polishVideoPrompt(
        prompt,
        openRouterKey,
        helperModel
      );
      setPrompt(polished);
    } catch (error) {
      console.error('Failed to polish video prompt:', error);
    } finally {
      setIsPolishing(false);
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4">
      <div className="max-w-4xl mx-auto space-y-3">
        {/* View Mode Toggle */}
        <div className="flex gap-2">
          <button
            onClick={() => setViewMode('simple')}
            disabled={disabled}
            className={`flex-1 py-2 px-3 rounded-md text-xs font-medium transition-colors ${
              viewMode === 'simple'
                ? 'bg-indigo-600 text-white'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
            } disabled:opacity-50`}
          >
            Simple View
          </button>
          <button
            onClick={() => setViewMode('advanced')}
            disabled={disabled}
            className={`flex-1 py-2 px-3 rounded-md text-xs font-medium transition-colors ${
              viewMode === 'advanced'
                ? 'bg-indigo-600 text-white'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
            } disabled:opacity-50`}
          >
            Advanced View
          </button>
        </div>

        {/* Prompt Input */}
        <div className="flex gap-2">
          <div className="flex-1 relative">
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Describe your video... (e.g., 'A cowboy walking through a dusty town at high noon, cinematic depth, realistic lighting')"
              disabled={disabled}
              className="w-full px-3 py-2 pr-10 text-sm rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none disabled:opacity-50"
              rows={3}
              maxLength={2000}
            />
            {openRouterKey && (
              <button
                onClick={handlePolishPrompt}
                disabled={disabled || isPolishing || !prompt.trim()}
                className="absolute right-2 top-2 p-1.5 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded disabled:opacity-50 disabled:cursor-not-allowed"
                title="Polish with AI"
              >
                <SparklesIcon className={`w-4 h-4 ${isPolishing ? 'animate-pulse' : ''}`} />
              </button>
            )}
          </div>
          
          <button
            onClick={handleSend}
            disabled={disabled || !prompt.trim()}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            <VideoCameraIcon className="w-5 h-5" />
            Generate
          </button>
        </div>

        {/* Simple View Options */}
        {viewMode === 'simple' && (
          <div className="flex items-center gap-4 text-xs text-gray-600 dark:text-gray-400">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={generateAudio}
                onChange={(e) => setGenerateAudio(e.target.checked)}
                disabled={disabled}
                className="rounded border-gray-300 dark:border-gray-600 text-indigo-600 focus:ring-indigo-500 disabled:opacity-50"
              />
              <span>Generate Audio</span>
            </label>
            <span className="text-gray-400 dark:text-gray-600">•</span>
            <span>Portrait 9:16 • 121 frames</span>
            <span className="text-gray-400 dark:text-gray-600">•</span>
            <span>{prompt.length}/2000 chars</span>
          </div>
        )}

        {/* Advanced View Options */}
        {viewMode === 'advanced' && (
          <div className="space-y-3 border-t border-gray-200 dark:border-gray-700 pt-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Audio Toggle */}
              <label className="flex items-center gap-2 text-xs cursor-pointer">
                <input
                  type="checkbox"
                  checked={generateAudio}
                  onChange={(e) => setGenerateAudio(e.target.checked)}
                  disabled={disabled}
                  className="rounded border-gray-300 dark:border-gray-600 text-indigo-600 focus:ring-indigo-500 disabled:opacity-50"
                />
                <span className="text-gray-700 dark:text-gray-300">Generate Audio</span>
              </label>

              {/* Multiscale Toggle */}
              <label className="flex items-center gap-2 text-xs cursor-pointer">
                <input
                  type="checkbox"
                  checked={useMultiscale}
                  onChange={(e) => setUseMultiscale(e.target.checked)}
                  disabled={disabled}
                  className="rounded border-gray-300 dark:border-gray-600 text-indigo-600 focus:ring-indigo-500 disabled:opacity-50"
                />
                <span className="text-gray-700 dark:text-gray-300">Use Multi-Scale</span>
              </label>

              {/* Prompt Expansion Toggle */}
              <label className="flex items-center gap-2 text-xs cursor-pointer">
                <input
                  type="checkbox"
                  checked={enablePromptExpansion}
                  onChange={(e) => setEnablePromptExpansion(e.target.checked)}
                  disabled={disabled}
                  className="rounded border-gray-300 dark:border-gray-600 text-indigo-600 focus:ring-indigo-500 disabled:opacity-50"
                />
                <span className="text-gray-700 dark:text-gray-300">Enable Prompt Expansion</span>
              </label>

              {/* Safety Checker Toggle */}
              <label className="flex items-center gap-2 text-xs cursor-pointer">
                <input
                  type="checkbox"
                  checked={enableSafetyChecker}
                  onChange={(e) => setEnableSafetyChecker(e.target.checked)}
                  disabled={disabled}
                  className="rounded border-gray-300 dark:border-gray-600 text-indigo-600 focus:ring-indigo-500 disabled:opacity-50"
                />
                <span className="text-gray-700 dark:text-gray-300">Enable Safety Checker</span>
              </label>

              {/* Sync Mode Toggle */}
              <label className="flex items-center gap-2 text-xs cursor-pointer">
                <input
                  type="checkbox"
                  checked={syncMode}
                  onChange={(e) => setSyncMode(e.target.checked)}
                  disabled={disabled}
                  className="rounded border-gray-300 dark:border-gray-600 text-indigo-600 focus:ring-indigo-500 disabled:opacity-50"
                />
                <span className="text-gray-700 dark:text-gray-300">Sync Mode</span>
              </label>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Number of Frames */}
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Number of Frames (9-481)
                </label>
                <input
                  type="number"
                  min="9"
                  max="481"
                  value={numFrames}
                  onChange={(e) => setNumFrames(parseInt(e.target.value) || 121)}
                  disabled={disabled}
                  className="w-full px-3 py-2 text-sm rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-indigo-500 focus:border-transparent disabled:opacity-50"
                />
              </div>

              {/* FPS */}
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                  FPS (1-60)
                </label>
                <input
                  type="number"
                  min="1"
                  max="60"
                  value={fps}
                  onChange={(e) => setFps(parseInt(e.target.value) || 25)}
                  disabled={disabled}
                  className="w-full px-3 py-2 text-sm rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-indigo-500 focus:border-transparent disabled:opacity-50"
                />
              </div>

              {/* Video Size */}
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Video Size
                </label>
                <select
                  value={useCustomSize ? 'custom' : videoSize}
                  onChange={(e) => {
                    if (e.target.value === 'custom') {
                      setUseCustomSize(true);
                    } else {
                      setUseCustomSize(false);
                      setVideoSize(e.target.value);
                    }
                  }}
                  disabled={disabled}
                  className="w-full px-3 py-2 text-sm rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-indigo-500 focus:border-transparent disabled:opacity-50"
                >
                  <option value="square_hd">Square HD</option>
                  <option value="square">Square</option>
                  <option value="portrait_4_3">Portrait 4:3</option>
                  <option value="portrait_16_9">Portrait 16:9</option>
                  <option value="landscape_4_3">Landscape 4:3</option>
                  <option value="landscape_16_9">Landscape 16:9</option>
                  <option value="custom">Custom</option>
                </select>
              </div>

              {/* Acceleration */}
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Acceleration
                </label>
                <select
                  value={acceleration}
                  onChange={(e) => setAcceleration(e.target.value as any)}
                  disabled={disabled}
                  className="w-full px-3 py-2 text-sm rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-indigo-500 focus:border-transparent disabled:opacity-50"
                >
                  <option value="none">None</option>
                  <option value="regular">Regular</option>
                  <option value="high">High</option>
                  <option value="full">Full</option>
                </select>
              </div>
            </div>

            {/* Custom Size Inputs */}
            {useCustomSize && (
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Width (1-14142)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="14142"
                    value={customWidth}
                    onChange={(e) => setCustomWidth(parseInt(e.target.value) || 576)}
                    disabled={disabled}
                    className="w-full px-3 py-2 text-sm rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-indigo-500 focus:border-transparent disabled:opacity-50"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Height (1-14142)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="14142"
                    value={customHeight}
                    onChange={(e) => setCustomHeight(parseInt(e.target.value) || 1024)}
                    disabled={disabled}
                    className="w-full px-3 py-2 text-sm rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-indigo-500 focus:border-transparent disabled:opacity-50"
                  />
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Camera LoRA */}
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Camera LoRA
                </label>
                <select
                  value={cameraLora}
                  onChange={(e) => setCameraLora(e.target.value as any)}
                  disabled={disabled}
                  className="w-full px-3 py-2 text-sm rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-indigo-500 focus:border-transparent disabled:opacity-50"
                >
                  <option value="none">None</option>
                  <option value="dolly_in">Dolly In</option>
                  <option value="dolly_out">Dolly Out</option>
                  <option value="dolly_left">Dolly Left</option>
                  <option value="dolly_right">Dolly Right</option>
                  <option value="jib_up">Jib Up</option>
                  <option value="jib_down">Jib Down</option>
                  <option value="static">Static</option>
                </select>
              </div>

              {/* Camera LoRA Scale */}
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Camera LoRA Scale (0-1)
                </label>
                <input
                  type="number"
                  min="0"
                  max="1"
                  step="0.1"
                  value={cameraLoraScale}
                  onChange={(e) => setCameraLoraScale(parseFloat(e.target.value) || 1)}
                  disabled={disabled}
                  className="w-full px-3 py-2 text-sm rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-indigo-500 focus:border-transparent disabled:opacity-50"
                />
              </div>

              {/* Video Output Type */}
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Video Output Type
                </label>
                <select
                  value={videoOutputType}
                  onChange={(e) => setVideoOutputType(e.target.value as any)}
                  disabled={disabled}
                  className="w-full px-3 py-2 text-sm rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-indigo-500 focus:border-transparent disabled:opacity-50"
                >
                  <option value="X264 (.mp4)">X264 (.mp4)</option>
                  <option value="VP9 (.webm)">VP9 (.webm)</option>
                  <option value="PRORES4444 (.mov)">PRORES4444 (.mov)</option>
                  <option value="GIF (.gif)">GIF (.gif)</option>
                </select>
              </div>

              {/* Video Quality */}
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Video Quality
                </label>
                <select
                  value={videoQuality}
                  onChange={(e) => setVideoQuality(e.target.value as any)}
                  disabled={disabled}
                  className="w-full px-3 py-2 text-sm rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-indigo-500 focus:border-transparent disabled:opacity-50"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="maximum">Maximum</option>
                </select>
              </div>

              {/* Video Write Mode */}
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Video Write Mode
                </label>
                <select
                  value={videoWriteMode}
                  onChange={(e) => setVideoWriteMode(e.target.value as any)}
                  disabled={disabled}
                  className="w-full px-3 py-2 text-sm rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-indigo-500 focus:border-transparent disabled:opacity-50"
                >
                  <option value="fast">Fast</option>
                  <option value="balanced">Balanced</option>
                  <option value="small">Small</option>
                </select>
              </div>

              {/* Seed */}
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Seed (optional)
                </label>
                <input
                  type="text"
                  value={seed}
                  onChange={(e) => setSeed(e.target.value)}
                  placeholder="Random if empty"
                  disabled={disabled}
                  className="w-full px-3 py-2 text-sm rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 focus:ring-indigo-500 focus:border-transparent disabled:opacity-50"
                />
              </div>
            </div>

            {/* Negative Prompt */}
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                Negative Prompt
              </label>
              <textarea
                value={negativePrompt}
                onChange={(e) => setNegativePrompt(e.target.value)}
                placeholder="Things to avoid in the video..."
                disabled={disabled}
                className="w-full px-3 py-2 text-sm rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none disabled:opacity-50"
                rows={2}
              />
            </div>

            <div className="text-xs text-gray-600 dark:text-gray-400">
              {prompt.length}/2000 chars
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
