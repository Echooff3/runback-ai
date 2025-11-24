import { useState, useRef } from 'react';
import { 
  downloadExportFile, 
  readFileAsJSON, 
  validateImportData, 
  importAppData,
  type ImportMode,
  type ImportResult,
  type ExportData,
} from '../../lib/storage/exportImport';

export default function ImportExport() {
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [showImportModal, setShowImportModal] = useState(false);
  const [pendingData, setPendingData] = useState<ExportData | null>(null);
  const [importError, setImportError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleExport = async () => {
    setIsExporting(true);
    setImportResult(null);
    setImportError(null);
    
    try {
      await downloadExportFile();
    } catch (error) {
      console.error('Export failed:', error);
      setImportError('Failed to export data');
    } finally {
      setIsExporting(false);
    }
  };

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setImportError(null);
    setImportResult(null);

    // Validate file type
    if (!file.name.endsWith('.json')) {
      setImportError('Please select a JSON file');
      return;
    }

    // Read and validate file content
    try {
      const data = await readFileAsJSON(file);
      
      if (!validateImportData(data)) {
        setImportError('Invalid backup file format. Please select a valid RunBack AI backup file.');
        return;
      }

      // Store the validated data instead of the file
      setPendingData(data);
      setShowImportModal(true);
    } catch (error) {
      setImportError(error instanceof Error ? error.message : 'Failed to read file');
    }

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleImport = async (mode: ImportMode) => {
    if (!pendingData) return;

    setIsImporting(true);
    setShowImportModal(false);

    try {
      const result = await importAppData(pendingData, mode);
      setImportResult(result);

      if (result.success) {
        // Reload page to apply changes - required because Zustand stores
        // and React contexts need to reinitialize with the new data
        setTimeout(() => {
          window.location.reload();
        }, 2000);
      }
    } catch (error) {
      setImportError(error instanceof Error ? error.message : 'Failed to import data');
    } finally {
      setIsImporting(false);
      setPendingData(null);
    }
  };

  const handleCancelImport = () => {
    setShowImportModal(false);
    setPendingData(null);
  };

  return (
    <div>
      <div className="mb-4">
        <h3 className="text-lg font-semibold mb-2">Import / Export</h3>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Backup your prompts, chat history, and settings. API keys are not included in exports for security.
        </p>
      </div>

      <div className="flex flex-wrap gap-3">
        {/* Export Button */}
        <button
          onClick={handleExport}
          disabled={isExporting}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white rounded-lg transition-colors"
        >
          {isExporting ? (
            <>
              <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                  fill="none"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
              Exporting...
            </>
          ) : (
            <>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              Export Data
            </>
          )}
        </button>

        {/* Import Button */}
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={isImporting}
          className="flex items-center gap-2 px-4 py-2 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 disabled:opacity-50 text-gray-900 dark:text-gray-100 rounded-lg transition-colors"
        >
          {isImporting ? (
            <>
              <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                  fill="none"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
              Importing...
            </>
          ) : (
            <>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
              </svg>
              Import Data
            </>
          )}
        </button>

        {/* Hidden File Input */}
        <input
          ref={fileInputRef}
          type="file"
          accept=".json"
          onChange={handleFileSelect}
          className="hidden"
        />
      </div>

      {/* Error Message */}
      {importError && (
        <div className="mt-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          <p className="text-sm text-red-800 dark:text-red-200">
            ❌ {importError}
          </p>
        </div>
      )}

      {/* Success Message */}
      {importResult?.success && (
        <div className="mt-4 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
          <p className="text-sm text-green-800 dark:text-green-200">
            ✅ {importResult.message}
          </p>
          <ul className="text-xs text-green-700 dark:text-green-300 mt-2 space-y-1">
            <li>• System Prompts: {importResult.imported.systemPrompts}</li>
            <li>• Slash Prompts: {importResult.imported.slashPrompts}</li>
            <li>• Chat Sessions: {importResult.imported.chatSessions}</li>
          </ul>
          <p className="text-xs text-green-600 dark:text-green-400 mt-2">
            Reloading page to apply changes...
          </p>
        </div>
      )}

      {/* Import Failed Message */}
      {importResult && !importResult.success && (
        <div className="mt-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          <p className="text-sm text-red-800 dark:text-red-200">
            ❌ Import failed: {importResult.message}
          </p>
        </div>
      )}

      {/* Import Mode Modal */}
      {showImportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-md w-full mx-4 p-6">
            <h4 className="text-lg font-semibold mb-4">Import Options</h4>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
              How would you like to import the backup file?
            </p>

            <div className="space-y-3">
              <button
                onClick={() => handleImport('merge')}
                className="w-full p-4 text-left border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
              >
                <div className="font-medium mb-1">Merge with existing data</div>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Add new items from the backup. Existing items with the same ID will be kept.
                </p>
              </button>

              <button
                onClick={() => handleImport('replace')}
                className="w-full p-4 text-left border border-red-200 dark:border-red-800 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
              >
                <div className="font-medium text-red-600 dark:text-red-400 mb-1">
                  Replace existing data
                </div>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Delete all current prompts and sessions, then import everything from the backup.
                </p>
              </button>
            </div>

            <button
              onClick={handleCancelImport}
              className="w-full mt-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
