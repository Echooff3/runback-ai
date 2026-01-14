import { useThemeStore } from '../../stores/themeStore';
import type { Theme } from '../../types';

export default function ThemeToggle() {
  const { theme, actualTheme, setTheme } = useThemeStore();

  const handleThemeChange = (newTheme: Theme) => {
    setTheme(newTheme);
  };

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-semibold mb-2">Appearance</h3>
        <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
          Choose your preferred theme
        </p>
      </div>

      {/* Segmented Control */}
      <div className="inline-flex rounded-lg border border-gray-200 dark:border-gray-700 p-1 bg-gray-50 dark:bg-gray-800">
        <button
          onClick={() => handleThemeChange('light')}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            theme === 'light'
              ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-50 shadow-sm'
              : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-200'
          }`}
        >
          Light
        </button>
        <button
          onClick={() => handleThemeChange('dark')}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            theme === 'dark'
              ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-50 shadow-sm'
              : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-200'
          }`}
        >
          Dark
        </button>
        <button
          onClick={() => handleThemeChange('system')}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            theme === 'system'
              ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-50 shadow-sm'
              : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-200'
          }`}
        >
          System
        </button>
      </div>

      {/* Current Theme Indicator */}
      <div className="text-sm text-gray-600 dark:text-gray-300">
        Currently using: <span className="font-medium capitalize">{actualTheme} mode</span>
      </div>
    </div>
  );
}
