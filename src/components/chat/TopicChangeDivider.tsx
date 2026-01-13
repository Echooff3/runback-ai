import { useState } from 'react';
import { ArrowPathIcon, ChevronDownIcon, ChevronUpIcon } from '@heroicons/react/24/outline';

interface TopicChangeDividerProps {
  timestamp: string;
  reasoning?: string;
  checkpointCreated?: boolean;
}

export default function TopicChangeDivider({ 
  timestamp, 
  reasoning,
  checkpointCreated = false 
}: TopicChangeDividerProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="w-full my-6 flex flex-col items-center justify-center">
      <div className="bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 px-6 py-3 rounded-lg shadow-sm border border-purple-200 dark:border-purple-800 max-w-md">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <ArrowPathIcon className="w-5 h-5 text-purple-600 dark:text-purple-400" />
            <div className="flex flex-col">
              <span className="text-purple-800 dark:text-purple-200 font-medium text-sm">
                Topic Changed
              </span>
              {checkpointCreated && (
                <span className="text-xs text-purple-600 dark:text-purple-400">
                  Checkpoint created
                </span>
              )}
            </div>
          </div>
          
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-purple-600 dark:text-purple-400 hover:text-purple-800 dark:hover:text-purple-200 transition-colors p-1 rounded hover:bg-purple-100 dark:hover:bg-purple-800/30"
            aria-label={isExpanded ? "Hide details" : "Show details"}
          >
            {isExpanded ? (
              <ChevronUpIcon className="w-4 h-4" />
            ) : (
              <ChevronDownIcon className="w-4 h-4" />
            )}
          </button>
        </div>
        
        {isExpanded && (
          <div className="mt-3 pt-3 border-t border-purple-200 dark:border-purple-700">
            <div className="text-xs space-y-2">
              <div>
                <span className="font-semibold text-purple-700 dark:text-purple-300">Time: </span>
                <span className="text-purple-600 dark:text-purple-400">
                  {new Date(timestamp).toLocaleString()}
                </span>
              </div>
              
              {reasoning && (
                <div>
                  <span className="font-semibold text-purple-700 dark:text-purple-300">Analysis: </span>
                  <span className="text-purple-600 dark:text-purple-400">
                    {reasoning}
                  </span>
                </div>
              )}
              
              <div>
                <span className="font-semibold text-purple-700 dark:text-purple-300">Action: </span>
                <span className="text-purple-600 dark:text-purple-400">
                  {checkpointCreated 
                    ? "Previous conversation summarized and saved as checkpoint" 
                    : "Topic change detected but no checkpoint created"}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
