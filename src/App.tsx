import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Toaster } from 'react-hot-toast';
import { Play, Pause, RotateCcw, Settings, BarChart3, BookOpen } from 'lucide-react';
import { useAppStore } from './store/algorithmStore';
import SortingVisualizer from './components/SortingVisualizer';
import AlgorithmComparison from './components/AlgorithmComparison';
import EducationalPanel from './components/EducationalPanel';
import MetricsDisplay from './components/MetricsDisplay';
import NotificationSystem from './components/NotificationSystem';
import Sidebar from './components/Sidebar';
import './styles/App.css';

/**
 * Advanced Sorting Algorithm Visualization Platform
 * Main Application Component
 * 
 * This component serves as the application's root UI controller,
 * orchestrating algorithm selection, visualization mode switching,
 * and managing the primary interface components with modern architecture.
 * 
 * @author Mohammad Atashi
 * @email mohammadaliatashi@icloud.com
 * @version 2.0.0
 */

const App: React.FC = () => {
  const {
    ui,
    algorithm,
    visualization,
    setUI,
    startAlgorithm,
    pauseAlgorithm,
    resetAlgorithm,
    generateData,
    addNotification,
  } = useAppStore();

  // Initialize data on component mount
  useEffect(() => {
    if (visualization.data.length === 0) {
      generateData(visualization.dataSize, visualization.dataType);
    }
  }, [generateData, visualization.data.length, visualization.dataSize, visualization.dataType]);

  // Theme management
  useEffect(() => {
    const root = document.documentElement;
    if (ui.theme === 'dark' || (ui.theme === 'auto' && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [ui.theme]);

  const handleAlgorithmStart = () => {
    if (algorithm.isRunning) {
      pauseAlgorithm();
      addNotification({
        type: 'info',
        message: 'Algorithm paused',
        duration: 2000,
      });
    } else {
      startAlgorithm();
      addNotification({
        type: 'success',
        message: 'Algorithm started',
        duration: 2000,
      });
    }
  };

  const handleReset = () => {
    resetAlgorithm();
    addNotification({
      type: 'info',
      message: 'Algorithm reset',
      duration: 2000,
    });
  };

  const handleDataRegenerate = () => {
    generateData(visualization.dataSize, visualization.dataType);
    addNotification({
      type: 'success',
      message: 'New data generated',
      duration: 2000,
    });
  };

  const renderMainContent = () => {
    switch (ui.view) {
      case 'comparison':
        return <AlgorithmComparison />;
      case 'tutorial':
        return <EducationalPanel />;
      default:
        return <SortingVisualizer />;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white">
      {/* Notification System */}
      <NotificationSystem />
      
      {/* Main Layout */}
      <div className="flex h-screen overflow-hidden">
        {/* Sidebar */}
        <AnimatePresence>
          {ui.sidebarOpen && (
            <motion.div
              initial={{ x: -300 }}
              animate={{ x: 0 }}
              exit={{ x: -300 }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            >
              <Sidebar />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col">
          {/* Header */}
          <motion.header 
            className="bg-black/20 backdrop-blur-md border-b border-white/10 px-6 py-4"
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.1 }}
          >
            <div className="flex items-center justify-between">
              {/* Logo and Title */}
              <div className="flex items-center space-x-4">
                <motion.div
                  className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <BarChart3 className="w-6 h-6" />
                </motion.div>
                <div>
                  <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                    Advanced Sorting Visualizer
                  </h1>
                  <p className="text-sm text-gray-400">by Mohammad Atashi</p>
                </div>
              </div>

              {/* View Toggle */}
              <div className="flex items-center space-x-2">
                <motion.button
                  className={`px-4 py-2 rounded-lg font-medium transition-all ${
                    ui.view === 'visualizer'
                      ? 'bg-blue-600 text-white'
                      : 'bg-white/10 text-gray-300 hover:bg-white/20'
                  }`}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setUI({ view: 'visualizer' })}
                >
                  Visualizer
                </motion.button>
                <motion.button
                  className={`px-4 py-2 rounded-lg font-medium transition-all ${
                    ui.view === 'comparison'
                      ? 'bg-blue-600 text-white'
                      : 'bg-white/10 text-gray-300 hover:bg-white/20'
                  }`}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setUI({ view: 'comparison' })}
                >
                  Comparison
                </motion.button>
                <motion.button
                  className={`px-4 py-2 rounded-lg font-medium transition-all ${
                    ui.view === 'tutorial'
                      ? 'bg-blue-600 text-white'
                      : 'bg-white/10 text-gray-300 hover:bg-white/20'
                  }`}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setUI({ view: 'tutorial' })}
                >
                  <BookOpen className="w-4 h-4 mr-2" />
                  Tutorial
                </motion.button>
              </div>

              {/* Controls */}
              <div className="flex items-center space-x-3">
                <motion.button
                  className="p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setUI({ sidebarOpen: !ui.sidebarOpen })}
                >
                  <Settings className="w-5 h-5" />
                </motion.button>
              </div>
            </div>
          </motion.header>

          {/* Main Content */}
          <main className="flex-1 overflow-hidden">
            <div className="h-full flex">
              {/* Visualization Area */}
              <div className="flex-1 p-6">
                <motion.div
                  className="h-full bg-black/20 backdrop-blur-sm rounded-xl border border-white/10 overflow-hidden"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.2 }}
                >
                  {renderMainContent()}
                </motion.div>
              </div>

              {/* Control Panel */}
              <motion.div
                className="w-80 bg-black/20 backdrop-blur-sm border-l border-white/10 p-6 space-y-6"
                initial={{ x: 300, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.3 }}
              >
                {/* Algorithm Controls */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-white">Controls</h3>
                  
                  {/* Playback Controls */}
                  <div className="flex space-x-2">
                    <motion.button
                      className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium flex items-center justify-center space-x-2"
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={handleAlgorithmStart}
                    >
                      {algorithm.isRunning ? (
                        <>
                          <Pause className="w-4 h-4" />
                          <span>Pause</span>
                        </>
                      ) : (
                        <>
                          <Play className="w-4 h-4" />
                          <span>Start</span>
                        </>
                      )}
                    </motion.button>
                    
                    <motion.button
                      className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg font-medium"
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={handleReset}
                    >
                      <RotateCcw className="w-4 h-4" />
                    </motion.button>
                  </div>

                  {/* Data Controls */}
                  <div className="space-y-3">
                    <button
                      className="w-full bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                      onClick={handleDataRegenerate}
                    >
                      Generate New Data
                    </button>
                  </div>
                </div>

                {/* Metrics Display */}
                <MetricsDisplay />
              </motion.div>
            </div>
          </main>
        </div>
      </div>

      {/* Toast Notifications */}
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: '#1f2937',
            color: '#fff',
            border: '1px solid rgba(255, 255, 255, 0.1)',
          },
        }}
      />
    </div>
  );
};

export default App;
