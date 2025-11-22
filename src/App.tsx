import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useThemeStore } from './stores/themeStore';
import { migrateStorage } from './lib/storage/localStorage';
import ChatScreen from './components/chat/ChatScreen';
import SettingsScreen from './components/settings/SettingsScreen';

function App() {
  const initTheme = useThemeStore((state) => state.initTheme);

  useEffect(() => {
    // Initialize theme on mount
    initTheme();
    
    // Run storage migration
    migrateStorage();
  }, [initTheme]);

  return (
    <BrowserRouter basename={import.meta.env.BASE_URL}>
      <Routes>
        <Route path="/" element={<ChatScreen />} />
        <Route path="/settings" element={<SettingsScreen />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
