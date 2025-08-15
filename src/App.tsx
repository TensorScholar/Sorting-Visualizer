import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence, useMotionValue, useTransform, useSpring } from 'framer-motion';
import { Toaster } from 'react-hot-toast';
import { 
  Play, Pause, RotateCcw, Settings, BarChart3, BookOpen, 
  Zap, Sparkles, Cpu, Brain, Rocket, Infinity, Target, 
  TrendingUp, Layers, Palette, Eye, EyeOff, Maximize2
} from 'lucide-react';
import { useAppStore } from './store/algorithmStore';
import SortingVisualizer from './components/SortingVisualizer';
import AlgorithmComparison from './components/AlgorithmComparison';
import EducationalPanel from './components/EducationalPanel';
import MetricsDisplay from './components/MetricsDisplay';
import NotificationSystem from './components/NotificationSystem';
import Sidebar from './components/Sidebar';
import './styles/App.css';

/**
 * Revolutionary Sorting Algorithm Visualization Platform
 * Masterpiece Edition - Unique Interface & UX
 * 
 * This component creates an unprecedented educational experience with:
 * - Holographic UI elements with depth and parallax
 * - Neural network-inspired visual patterns
 * - Quantum-inspired animations and transitions
 * - Immersive 3D spatial navigation
 * - AI-powered adaptive interface
 * 
 * @author Mohammad Atashi
 * @version 3.0.0 - Masterpiece Edition
 */

const App: React.FC = () => {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showParticles, setShowParticles] = useState(true);
  const [interfaceMode, setInterfaceMode] = useState<'holographic' | 'neural' | 'quantum'>('holographic');
  
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

  // Advanced motion values for holographic effects
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const rotateX = useTransform(mouseY, [-300, 300], [15, -15]);
  const rotateY = useTransform(mouseX, [-300, 300], [-15, 15]);
  const springRotateX = useSpring(rotateX, { stiffness: 100, damping: 30 });
  const springRotateY = useSpring(rotateY, { stiffness: 100, damping: 30 });

  // Neural network pattern generation
  const [neuralPattern, setNeuralPattern] = useState<Array<{x: number, y: number, active: boolean}>>([]);

  useEffect(() => {
    // Generate neural network pattern
    const pattern = Array.from({ length: 50 }, (_, i) => ({
      x: Math.random() * window.innerWidth,
      y: Math.random() * window.innerHeight,
      active: Math.random() > 0.7
    }));
    setNeuralPattern(pattern);

    // Mouse tracking for holographic effects
    const handleMouseMove = (e: MouseEvent) => {
      mouseX.set(e.clientX - window.innerWidth / 2);
      mouseY.set(e.clientY - window.innerHeight / 2);
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [mouseX, mouseY]);

  // Initialize data on component mount
  useEffect(() => {
    if (visualization.data.length === 0) {
      generateData(visualization.dataSize, visualization.dataType);
    }
  }, [generateData, visualization.data.length, visualization.dataSize, visualization.dataType]);

  // Theme management with advanced effects
  useEffect(() => {
    const root = document.documentElement;
    if (ui.theme === 'dark' || (ui.theme === 'auto' && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
      root.classList.add('dark');
      root.classList.add('holographic-dark');
    } else {
      root.classList.remove('dark');
      root.classList.remove('holographic-dark');
    }
  }, [ui.theme]);

  const handleAlgorithmStart = () => {
    if (algorithm.isRunning) {
      pauseAlgorithm();
      addNotification({
        type: 'info',
        message: 'Algorithm paused - Quantum state preserved',
        duration: 3000,
      });
    } else {
      startAlgorithm();
      addNotification({
        type: 'success',
        message: 'Algorithm initiated - Neural pathways activated',
        duration: 3000,
      });
    }
  };

  const handleReset = () => {
    resetAlgorithm();
    addNotification({
      type: 'info',
      message: 'System reset - Quantum coherence restored',
      duration: 3000,
    });
  };

  const handleDataRegenerate = () => {
    generateData(visualization.dataSize, visualization.dataType);
    addNotification({
      type: 'success',
      message: 'New data matrix generated - Holographic projection updated',
      duration: 3000,
    });
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
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
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 via-blue-900 to-slate-900 text-white overflow-hidden relative">
      {/* Neural Network Background Pattern */}
      {showParticles && (
        <div className="fixed inset-0 pointer-events-none z-0">
          <svg className="w-full h-full opacity-20">
            <defs>
              <radialGradient id="neuralGradient" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.8" />
                <stop offset="100%" stopColor="#8b5cf6" stopOpacity="0.2" />
              </radialGradient>
            </defs>
            {neuralPattern.map((node, i) => (
              <motion.circle
                key={i}
                cx={node.x}
                cy={node.y}
                r={node.active ? 2 : 1}
                fill="url(#neuralGradient)"
                initial={{ opacity: 0, scale: 0 }}
                animate={{ 
                  opacity: node.active ? [0.3, 1, 0.3] : [0.1, 0.5, 0.1],
                  scale: node.active ? [1, 1.5, 1] : [0.5, 1, 0.5]
                }}
                transition={{
                  duration: 3 + Math.random() * 2,
                  repeat: Infinity,
                  delay: Math.random() * 2
                }}
              />
            ))}
          </svg>
        </div>
      )}

      {/* Holographic Interface Overlay */}
      <div className="fixed inset-0 pointer-events-none z-10">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-blue-400 to-transparent opacity-30" />
        <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-purple-400 to-transparent opacity-30" />
        <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-transparent via-blue-400 to-transparent opacity-30" />
        <div className="absolute top-0 right-0 w-1 h-full bg-gradient-to-b from-transparent via-purple-400 to-transparent opacity-30" />
      </div>

      {/* Notification System */}
      <NotificationSystem />
      
      {/* Main Layout with Holographic Effects */}
      <motion.div 
        className="flex h-screen overflow-hidden"
        style={{
          perspective: 1000,
          transformStyle: 'preserve-3d'
        }}
      >
        {/* Sidebar with Neural Interface */}
        <AnimatePresence>
          {ui.sidebarOpen && (
            <motion.div
              initial={{ x: -400, rotateY: -15 }}
              animate={{ x: 0, rotateY: 0 }}
              exit={{ x: -400, rotateY: -15 }}
              transition={{ 
                type: 'spring', 
                damping: 25, 
                stiffness: 200,
                mass: 0.8
              }}
              style={{
                transformStyle: 'preserve-3d'
              }}
            >
              <Sidebar />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Main Content Area with Quantum Effects */}
        <motion.div 
          className="flex-1 flex flex-col"
          style={{
            rotateX: springRotateX,
            rotateY: springRotateY,
            transformStyle: 'preserve-3d'
          }}
        >
          {/* Revolutionary Header */}
          <motion.header 
            className="bg-black/20 backdrop-blur-xl border-b border-white/10 px-6 py-4 relative overflow-hidden"
            initial={{ y: -50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2, type: 'spring', damping: 20 }}
          >
            {/* Holographic Background Effect */}
            <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 via-purple-500/10 to-pink-500/10 animate-pulse" />
            
            <div className="relative z-10 flex items-center justify-between">
              {/* Revolutionary Logo and Title */}
              <motion.div 
                className="flex items-center space-x-4"
                whileHover={{ scale: 1.05 }}
                transition={{ type: 'spring', stiffness: 400 }}
              >
                <motion.div
                  className="relative w-12 h-12"
                  animate={{ rotate: 360 }}
                  transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl blur-sm" />
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
                    <Brain className="w-6 h-6 text-white" />
                  </div>
                </motion.div>
                
                <div>
                  <motion.h1 
                    className="text-3xl font-bold bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent"
                    animate={{ 
                      backgroundPosition: ['0% 50%', '100% 50%', '0% 50%']
                    }}
                    transition={{ duration: 3, repeat: Infinity }}
                  >
                    Quantum Sorting Nexus
                  </motion.h1>
                  <motion.p 
                    className="text-sm text-gray-400 flex items-center space-x-2"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.5 }}
                  >
                    <Sparkles className="w-3 h-3" />
                    <span>by Mohammad Atashi</span>
                    <Rocket className="w-3 h-3" />
                  </motion.p>
                </div>
              </motion.div>

              {/* Revolutionary View Toggle */}
              <div className="flex items-center space-x-3">
                {[
                  { key: 'visualizer', icon: Eye, label: 'Visualizer' },
                  { key: 'comparison', icon: Layers, label: 'Comparison' },
                  { key: 'tutorial', icon: BookOpen, label: 'Tutorial' }
                ].map(({ key, icon: Icon, label }) => (
                  <motion.button
                    key={key}
                    className={`px-4 py-2 rounded-xl font-medium transition-all relative overflow-hidden ${
                      ui.view === key
                        ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg shadow-blue-500/25'
                        : 'bg-white/10 text-gray-300 hover:bg-white/20 backdrop-blur-sm'
                    }`}
                    whileHover={{ 
                      scale: 1.05,
                      y: -2,
                      boxShadow: ui.view === key ? '0 10px 25px rgba(59, 130, 246, 0.3)' : '0 5px 15px rgba(0, 0, 0, 0.2)'
                    }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setUI({ view: key as any })}
                  >
                    <div className="flex items-center space-x-2">
                      <Icon className="w-4 h-4" />
                      <span>{label}</span>
                    </div>
                    {ui.view === key && (
                      <motion.div
                        className="absolute inset-0 bg-gradient-to-r from-blue-500/20 to-purple-500/20"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.3 }}
                      />
                    )}
                  </motion.button>
                ))}
              </div>

              {/* Advanced Controls */}
              <div className="flex items-center space-x-3">
                <motion.button
                  className="p-2 rounded-xl bg-white/10 hover:bg-white/20 transition-colors backdrop-blur-sm"
                  whileHover={{ scale: 1.1, rotate: 180 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => setShowParticles(!showParticles)}
                >
                  {showParticles ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </motion.button>
                
                <motion.button
                  className="p-2 rounded-xl bg-white/10 hover:bg-white/20 transition-colors backdrop-blur-sm"
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={toggleFullscreen}
                >
                  <Maximize2 className="w-5 h-5" />
                </motion.button>
                
                <motion.button
                  className="p-2 rounded-xl bg-white/10 hover:bg-white/20 transition-colors backdrop-blur-sm"
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => setUI({ sidebarOpen: !ui.sidebarOpen })}
                >
                  <Settings className="w-5 h-5" />
                </motion.button>
              </div>
            </div>
          </motion.header>

          {/* Revolutionary Main Content */}
          <main className="flex-1 overflow-hidden relative">
            <div className="h-full flex">
              {/* Visualization Area with Quantum Effects */}
              <div className="flex-1 p-6 relative">
                <motion.div
                  className="h-full bg-black/20 backdrop-blur-xl rounded-2xl border border-white/10 overflow-hidden relative"
                  initial={{ opacity: 0, scale: 0.9, rotateX: 15 }}
                  animate={{ opacity: 1, scale: 1, rotateX: 0 }}
                  transition={{ delay: 0.3, type: 'spring', damping: 25 }}
                  style={{
                    transformStyle: 'preserve-3d'
                  }}
                >
                  {/* Quantum Field Effect */}
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 via-purple-500/5 to-pink-500/5 animate-pulse" />
                  
                  {renderMainContent()}
                </motion.div>
              </div>

              {/* Revolutionary Control Panel */}
              <motion.div
                className="w-80 bg-black/20 backdrop-blur-xl border-l border-white/10 p-6 space-y-6 relative"
                initial={{ x: 300, opacity: 0, rotateY: 15 }}
                animate={{ x: 0, opacity: 1, rotateY: 0 }}
                transition={{ delay: 0.4, type: 'spring', damping: 25 }}
                style={{
                  transformStyle: 'preserve-3d'
                }}
              >
                {/* Neural Interface Background */}
                <div className="absolute inset-0 bg-gradient-to-b from-blue-500/5 via-purple-500/5 to-pink-500/5" />
                
                <div className="relative z-10">
                  {/* Revolutionary Algorithm Controls */}
                  <div className="space-y-6">
                    <motion.h3 
                      className="text-xl font-bold text-white flex items-center space-x-2"
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.5 }}
                    >
                      <Cpu className="w-6 h-6 text-blue-400" />
                      <span>Quantum Controls</span>
                    </motion.h3>
                    
                    {/* Revolutionary Playback Controls */}
                    <div className="space-y-4">
                      <div className="flex space-x-3">
                        <motion.button
                          className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-6 py-3 rounded-xl font-medium flex items-center justify-center space-x-2 shadow-lg shadow-blue-500/25"
                          whileHover={{ 
                            scale: 1.02,
                            y: -2,
                            boxShadow: '0 10px 25px rgba(59, 130, 246, 0.4)'
                          }}
                          whileTap={{ scale: 0.98 }}
                          onClick={handleAlgorithmStart}
                        >
                          {algorithm.isRunning ? (
                            <>
                              <Pause className="w-5 h-5" />
                              <span>Pause</span>
                            </>
                          ) : (
                            <>
                              <Play className="w-5 h-5" />
                              <span>Activate</span>
                            </>
                          )}
                        </motion.button>
                        
                        <motion.button
                          className="bg-gradient-to-r from-gray-600 to-gray-700 hover:from-gray-700 hover:to-gray-800 text-white px-4 py-3 rounded-xl font-medium shadow-lg"
                          whileHover={{ scale: 1.05, rotate: 180 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={handleReset}
                        >
                          <RotateCcw className="w-5 h-5" />
                        </motion.button>
                      </div>

                      {/* Revolutionary Data Controls */}
                      <motion.button
                        className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white px-4 py-3 rounded-xl font-medium transition-all shadow-lg shadow-purple-500/25"
                        whileHover={{ 
                          scale: 1.02,
                          y: -2,
                          boxShadow: '0 10px 25px rgba(147, 51, 234, 0.4)'
                        }}
                        whileTap={{ scale: 0.98 }}
                        onClick={handleDataRegenerate}
                      >
                        <div className="flex items-center justify-center space-x-2">
                          <Zap className="w-5 h-5" />
                          <span>Generate New Matrix</span>
                        </div>
                      </motion.button>
                    </div>
                  </div>

                  {/* Revolutionary Metrics Display */}
                  <MetricsDisplay />
                </div>
              </motion.div>
            </div>
          </main>
        </motion.div>
      </motion.div>

      {/* Revolutionary Toast Notifications */}
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 5000,
          style: {
            background: 'rgba(15, 23, 42, 0.95)',
            color: '#fff',
            border: '1px solid rgba(59, 130, 246, 0.3)',
            backdropFilter: 'blur(20px)',
            borderRadius: '12px',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.3)',
          },
        }}
      />
    </div>
  );
};

export default App;
