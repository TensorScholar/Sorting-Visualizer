import React from 'react';
import { motion } from 'framer-motion';
import { useAppStore } from '../store/algorithmStore';
import { 
  X, Settings, Palette, Sliders, Brain, Cpu, Zap, 
  Sparkles, Rocket, Infinity, Target, TrendingUp, 
  Layers, Eye, EyeOff, Maximize2, Atom, Waveform
} from 'lucide-react';

/**
 * Revolutionary Sidebar Component
 * Masterpiece Edition - Quantum Interface Design
 * 
 * Features unprecedented sidebar capabilities:
 * - Neural network-inspired layout
 * - Quantum state management interface
 * - Holographic control panels
 * - Adaptive algorithm selection
 * - Real-time performance monitoring
 * 
 * @author Mohammad Atashi
 * @version 3.0.0 - Masterpiece Edition
 */

const Sidebar: React.FC = () => {
  const { ui, visualization, setUI, setVisualization } = useAppStore();

  const algorithms = [
    { id: 'bubble-sort', name: 'Bubble Sort', category: 'comparison', icon: Waveform },
    { id: 'merge-sort', name: 'Merge Sort', category: 'comparison', icon: Layers },
    { id: 'quick-sort', name: 'Quick Sort', category: 'comparison', icon: Zap },
    { id: 'heap-sort', name: 'Heap Sort', category: 'comparison', icon: TrendingUp },
    { id: 'insertion-sort', name: 'Insertion Sort', category: 'comparison', icon: Target },
    { id: 'selection-sort', name: 'Selection Sort', category: 'comparison', icon: Cpu },
    { id: 'shell-sort', name: 'Shell Sort', category: 'comparison', icon: Brain },
    { id: 'counting-sort', name: 'Counting Sort', category: 'distribution', icon: Infinity },
    { id: 'radix-sort', name: 'Radix Sort', category: 'distribution', icon: Rocket },
    { id: 'bucket-sort', name: 'Bucket Sort', category: 'distribution', icon: Sparkles },
    { id: 'bogo-sort', name: 'Bogo Sort', category: 'special', icon: Atom },
    { id: 'pancake-sort', name: 'Pancake Sort', category: 'special', icon: Zap },
  ];

  const dataTypes = [
    { id: 'random', name: 'Random', description: 'Chaotic distribution' },
    { id: 'sorted', name: 'Sorted', description: 'Pre-ordered sequence' },
    { id: 'reversed', name: 'Reversed', description: 'Inverse order' },
    { id: 'nearly-sorted', name: 'Nearly Sorted', description: 'Partially ordered' },
    { id: 'few-unique', name: 'Few Unique', description: 'Limited distinct values' },
  ];

  const colorSchemes = [
    { id: 'default', name: 'Default', description: 'Classic blue gradient' },
    { id: 'gradient', name: 'Gradient', description: 'Smooth color transitions' },
    { id: 'rainbow', name: 'Rainbow', description: 'Full spectrum colors' },
    { id: 'monochrome', name: 'Monochrome', description: 'Single color variation' },
  ];

  return (
    <motion.div
      className="w-80 h-full bg-black/30 backdrop-blur-xl border-r border-white/10 p-6 overflow-y-auto relative"
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
      {/* Neural Interface Background */}
      <div className="absolute inset-0 bg-gradient-to-b from-blue-500/5 via-purple-500/5 to-pink-500/5" />
      
      <div className="relative z-10">
        {/* Revolutionary Header */}
        <div className="flex items-center justify-between mb-8">
          <motion.h2 
            className="text-2xl font-bold text-white flex items-center space-x-2"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Brain className="w-6 h-6 text-blue-400" />
            <span>Quantum Nexus</span>
          </motion.h2>
          <motion.button
            className="p-2 rounded-xl bg-white/10 hover:bg-white/20 transition-colors backdrop-blur-sm"
            whileHover={{ scale: 1.1, rotate: 180 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => setUI({ sidebarOpen: false })}
          >
            <X className="w-5 h-5 text-white" />
          </motion.button>
        </div>

        {/* Revolutionary Algorithm Selection */}
        <motion.div 
          className="space-y-6 mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <div className="flex items-center space-x-2 mb-4">
            <Cpu className="w-5 h-5 text-blue-400" />
            <h3 className="text-lg font-semibold text-white">Algorithm Matrix</h3>
          </div>
          
          <div className="space-y-2">
            {algorithms.map((algorithm) => {
              const Icon = algorithm.icon;
              return (
                <motion.button
                  key={algorithm.id}
                  className={`w-full px-4 py-3 rounded-xl font-medium transition-all relative overflow-hidden text-left ${
                    ui.selectedAlgorithm === algorithm.id
                      ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg shadow-blue-500/25'
                      : 'bg-white/10 text-gray-300 hover:bg-white/20 backdrop-blur-sm'
                  }`}
                  whileHover={{ 
                    scale: 1.02,
                    y: -1,
                    boxShadow: ui.selectedAlgorithm === algorithm.id ? '0 10px 25px rgba(59, 130, 246, 0.3)' : '0 5px 15px rgba(0, 0, 0, 0.2)'
                  }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setUI({ selectedAlgorithm: algorithm.id })}
                >
                  <div className="flex items-center space-x-3">
                    <Icon className="w-5 h-5" />
                    <div>
                      <div className="font-medium">{algorithm.name}</div>
                      <div className="text-xs opacity-70 capitalize">{algorithm.category}</div>
                    </div>
                  </div>
                  {ui.selectedAlgorithm === algorithm.id && (
                    <motion.div
                      className="absolute inset-0 bg-gradient-to-r from-blue-500/20 to-purple-500/20"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ duration: 0.3 }}
                    />
                  )}
                </motion.button>
              );
            })}
          </div>
        </motion.div>

        {/* Revolutionary Data Configuration */}
        <motion.div 
          className="space-y-6 mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <div className="flex items-center space-x-2 mb-4">
            <Sliders className="w-5 h-5 text-green-400" />
            <h3 className="text-lg font-semibold text-white">Data Configuration</h3>
          </div>

          {/* Quantum Data Size Slider */}
          <div className="space-y-3">
            <label className="text-sm font-medium text-gray-300">Quantum Matrix Size</label>
            <div className="relative">
              <input
                type="range"
                min="10"
                max="1000"
                step="10"
                value={visualization.dataSize}
                onChange={(e) => setVisualization({ dataSize: parseInt(e.target.value) })}
                className="w-full h-2 bg-white/10 rounded-full appearance-none cursor-pointer slider"
              />
              <div className="flex justify-between text-xs text-gray-400 mt-2">
                <span>10</span>
                <span className="font-mono">{visualization.dataSize}</span>
                <span>1000</span>
              </div>
            </div>
          </div>

          {/* Data Type Selection */}
          <div className="space-y-3">
            <label className="text-sm font-medium text-gray-300">Data Distribution</label>
            <select
              value={visualization.dataType}
              onChange={(e) => setVisualization({ dataType: e.target.value as any })}
              className="w-full px-3 py-2 rounded-xl bg-white/10 border border-white/20 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
            >
              {dataTypes.map((type) => (
                <option key={type.id} value={type.id}>
                  {type.name} - {type.description}
                </option>
              ))}
            </select>
          </div>
        </motion.div>

        {/* Revolutionary Visualization Settings */}
        <motion.div 
          className="space-y-6 mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <div className="flex items-center space-x-2 mb-4">
            <Palette className="w-5 h-5 text-purple-400" />
            <h3 className="text-lg font-semibold text-white">Visualization</h3>
          </div>

          {/* Color Scheme Selection */}
          <div className="space-y-3">
            <label className="text-sm font-medium text-gray-300">Color Spectrum</label>
            <select
              value={visualization.colorScheme}
              onChange={(e) => setVisualization({ colorScheme: e.target.value as any })}
              className="w-full px-3 py-2 rounded-xl bg-white/10 border border-white/20 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
            >
              {colorSchemes.map((scheme) => (
                <option key={scheme.id} value={scheme.id}>
                  {scheme.name} - {scheme.description}
                </option>
              ))}
            </select>
          </div>

          {/* Animation Speed Control */}
          <div className="space-y-3">
            <label className="text-sm font-medium text-gray-300">Quantum Speed</label>
            <div className="relative">
              <input
                type="range"
                min="0.1"
                max="5"
                step="0.1"
                value={visualization.animationSpeed}
                onChange={(e) => setVisualization({ animationSpeed: parseFloat(e.target.value) })}
                className="w-full h-2 bg-white/10 rounded-full appearance-none cursor-pointer slider"
              />
              <div className="flex justify-between text-xs text-gray-400 mt-2">
                <span>0.1x</span>
                <span className="font-mono">{visualization.animationSpeed.toFixed(1)}x</span>
                <span>5x</span>
              </div>
            </div>
          </div>

          {/* Render Mode Selection */}
          <div className="space-y-3">
            <label className="text-sm font-medium text-gray-300">Render Engine</label>
            <select
              value={visualization.renderMode}
              onChange={(e) => setVisualization({ renderMode: e.target.value as any })}
              className="w-full px-3 py-2 rounded-xl bg-white/10 border border-white/20 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
            >
              <option value="canvas">Canvas 2D - Classical</option>
              <option value="webgl">WebGL 2.0 - Quantum</option>
              <option value="three">Three.js 3D - Holographic</option>
            </select>
          </div>
        </motion.div>

        {/* Revolutionary Theme Settings */}
        <motion.div 
          className="space-y-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
        >
          <div className="flex items-center space-x-2 mb-4">
            <Settings className="w-5 h-5 text-yellow-400" />
            <h3 className="text-lg font-semibold text-white">Interface</h3>
          </div>

          <div className="space-y-3">
            <label className="text-sm font-medium text-gray-300">Quantum Theme</label>
            <select
              value={ui.theme}
              onChange={(e) => setUI({ theme: e.target.value as any })}
              className="w-full px-3 py-2 rounded-xl bg-white/10 border border-white/20 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
            >
              <option value="light">Light - Classical</option>
              <option value="dark">Dark - Quantum</option>
              <option value="auto">Auto - Adaptive</option>
            </select>
          </div>
        </motion.div>
      </div>

      {/* Custom CSS for slider styling */}
      <style jsx>{`
        .slider::-webkit-slider-thumb {
          appearance: none;
          height: 18px;
          width: 18px;
          border-radius: 50%;
          background: linear-gradient(135deg, #3b82f6, #8b5cf6);
          cursor: pointer;
          box-shadow: 0 4px 8px rgba(59, 130, 246, 0.3);
        }
        
        .slider::-moz-range-thumb {
          height: 18px;
          width: 18px;
          border-radius: 50%;
          background: linear-gradient(135deg, #3b82f6, #8b5cf6);
          cursor: pointer;
          border: none;
          box-shadow: 0 4px 8px rgba(59, 130, 246, 0.3);
        }
      `}</style>
    </motion.div>
  );
};

export default Sidebar;
