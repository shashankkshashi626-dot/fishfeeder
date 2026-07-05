import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import Dashboard from './components/Dashboard';
import Footer from './components/Footer';
import { useMQTT } from './hooks/useMQTT';

export const App: React.FC = () => {
  const [darkMode, setDarkMode] = useState<boolean>(true); // Default to Dark Mode
  const [showSettings, setShowSettings] = useState<boolean>(false);
  
  // Initialize MQTT Hook State
  const mqttState = useMQTT();

  // Handle Dark Mode document class toggles
  useEffect(() => {
    const root = window.document.documentElement;
    if (darkMode) {
      root.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      root.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [darkMode]);

  // Load saved theme choice
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'light') {
      setDarkMode(false);
    }
  }, []);

  return (
    <div className="min-h-screen flex flex-col font-sans select-none transition-colors duration-300 bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      
      {/* Top Navigation Header */}
      <Header 
        darkMode={darkMode} 
        setDarkMode={setDarkMode} 
        onSettingsClick={() => setShowSettings(true)} 
      />

      {/* Main Content Dashboard layout */}
      <Dashboard 
        showSettings={showSettings} 
        onCloseSettings={() => setShowSettings(false)} 
        mqttState={mqttState}
      />

      {/* Connection and Version Details Footer */}
      <Footer mqttConnected={mqttState.mqttConnected} />

    </div>
  );
};

export default App;
