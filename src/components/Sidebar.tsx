import React from 'react';
import { motion } from 'framer-motion';
import { useAppStore } from '../store/algorithmStore';
import { X, Settings, Palette, Sliders } from 'lucide-react';

/**
 * Sidebar Component
 * 
 * Provides algorithm selection, visualization settings, and configuration
 * options with a modern, accessible interface.
 * 
 * @author Mohammad Atashi
 * @version 2.0.0
 */

const Sidebar: React.FC = () => {
  const { ui, visualization, setUI, setVisualization } = useAppStore();

  const algorithms = [
    { id: 'bubble-sort', name: 'Bubble Sort', category: 'comparison' },
    { id: 'merge-sort', name: 'Merge Sort', category: 'comparison' },
    { id: 'quick-sort', name: 'Quick Sort', category: 'comparison' },
    { id: 'heap-sort', name: 'Heap Sort', category: 'comparison' },
    { id: 'insertion-sort', name: 'Insertion Sort', category: 'comparison' },
    { id: 'selection-sort', name: 'Selection Sort', category: 'comparison' },
    { id: 'shell-sort', name: 'Shell Sort', category: 'comparison' },
    { id: 'counting-sort', name: 'Counting Sort', category: 'distribution' },
    { id: 'radix-sort', name: 'Radix Sort', category: 'distribution' },
    { id: 'bucket-sort', name: 'Bucket Sort', category: 'distribution' },
    { id: 'bogo-sort', name: 'Bogo Sort', category: 'special' },
    { id: 'pancake-sort', name: 'Pancake Sort', category: 'special' },
  ];

  const dataTypes = [
    { id: 'random', name: 'Random' },
    { id: 'sorted', name: 'Sorted' },
    { id: 'reversed', name: 'Reversed' },
    { id: 'nearly-sorted', name: 'Nearly Sorted' },
    { id: 'few-unique', name: 'Few Unique' },
  ];

  const colorSchemes = [
    { id: 'default', name: 'Default' },
    { id: 'gradient', name: 'Gradient' },
    { id: 'rainbow', name: 'Rainbow' },
    { id: 'monochrome', name: 'Monochrome' },
  ];

  return (
    <motion.div
      className="w-80 h-full bg-black/30 backdrop-blur-md border-r border-white/10 p-6 overflow-y-auto"
      initial={{ x: -300 }}
      animate={{ x: 0 }}
      exit={{ x: -300 }}
      transition={{ type: 'spring', damping: 25, stiffness: 200 }}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-white">Settings</h2>
        <button
          onClick={() => setUI({ sidebarOpen: false })}
          className="p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors"
        >
          <X className="w-5 h-5 text-white" />
        </button>
      </div>

      {/* Algorithm Selection */}
      <div className="space-y-4 mb-8">
        <div className="flex items-center space-x-2 mb-3">
          <Settings className="w-5 h-5 text-blue-400" />
          <h3 className="text-lg font-semibold text-white">Algorithm</h3>
        </div>
        
        <select
          value={ui.selectedAlgorithm}
          onChange={(e) => setUI({ selectedAlgorithm: e.target.value })}
          className="w-full px-3 py-2 rounded-lg bg-white/10 border border-white/20 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          {algorithms.map((algorithm) => (
            <option key={algorithm.id} value={algorithm.id}>
              {algorithm.name}
            </option>
          ))}
        </select>
      </div>

      {/* Data Configuration */}
      <div className="space-y-4 mb-8">
        <div className="flex items-center space-x-2 mb-3">
          <Sliders className="w-5 h-5 text-green-400" />
          <h3 className="text-lg font-semibold text-white">Data Configuration</h3>
        </div>

        {/* Data Size */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-300">Data Size</label>
          <input
            type="range"
            min="10"
            max="1000"
            step="10"
            value={visualization.dataSize}
            onChange={(e) => setVisualization({ dataSize: parseInt(e.target.value) })}
            className="w-full h-2 bg-white/10 rounded-lg appearance-none cursor-pointer slider"
          />
          <div className="flex justify-between text-xs text-gray-400">
            <span>10</span>
            <span>{visualization.dataSize}</span>
            <span>1000</span>
          </div>
        </div>

        {/* Data Type */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-300">Data Type</label>
          <select
            value={visualization.dataType}
            onChange={(e) => setVisualization({ dataType: e.target.value as any })}
            className="w-full px-3 py-2 rounded-lg bg-white/10 border border-white/20 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {dataTypes.map((type) => (
              <option key={type.id} value={type.id}>
                {type.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Visualization Settings */}
      <div className="space-y-4 mb-8">
        <div className="flex items-center space-x-2 mb-3">
          <Palette className="w-5 h-5 text-purple-400" />
          <h3 className="text-lg font-semibold text-white">Visualization</h3>
        </div>

        {/* Color Scheme */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-300">Color Scheme</label>
          <select
            value={visualization.colorScheme}
            onChange={(e) => setVisualization({ colorScheme: e.target.value as any })}
            className="w-full px-3 py-2 rounded-lg bg-white/10 border border-white/20 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {colorSchemes.map((scheme) => (
              <option key={scheme.id} value={scheme.id}>
                {scheme.name}
              </option>
            ))}
          </select>
        </div>

        {/* Animation Speed */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-300">Animation Speed</label>
          <input
            type="range"
            min="0.1"
            max="5"
            step="0.1"
            value={visualization.animationSpeed}
            onChange={(e) => setVisualization({ animationSpeed: parseFloat(e.target.value) })}
            className="w-full h-2 bg-white/10 rounded-lg appearance-none cursor-pointer slider"
          />
          <div className="flex justify-between text-xs text-gray-400">
            <span>0.1x</span>
            <span>{visualization.animationSpeed.toFixed(1)}x</span>
            <span>5x</span>
          </div>
        </div>

        {/* Render Mode */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-300">Render Mode</label>
          <select
            value={visualization.renderMode}
            onChange={(e) => setVisualization({ renderMode: e.target.value as any })}
            className="w-full px-3 py-2 rounded-lg bg-white/10 border border-white/20 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="canvas">Canvas 2D</option>
            <option value="webgl">WebGL 2.0</option>
            <option value="three">Three.js 3D</option>
          </select>
        </div>
      </div>

      {/* Theme Settings */}
      <div className="space-y-4">
        <div className="flex items-center space-x-2 mb-3">
          <Palette className="w-5 h-5 text-yellow-400" />
          <h3 className="text-lg font-semibold text-white">Theme</h3>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-300">Theme Mode</label>
          <select
            value={ui.theme}
            onChange={(e) => setUI({ theme: e.target.value as any })}
            className="w-full px-3 py-2 rounded-lg bg-white/10 border border-white/20 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="light">Light</option>
            <option value="dark">Dark</option>
            <option value="auto">Auto</option>
          </select>
        </div>
      </div>

      {/* Custom CSS for slider styling */}
      <style jsx>{`
        .slider::-webkit-slider-thumb {
          appearance: none;
          height: 16px;
          width: 16px;
          border-radius: 50%;
          background: #3b82f6;
          cursor: pointer;
        }
        
        .slider::-moz-range-thumb {
          height: 16px;
          width: 16px;
          border-radius: 50%;
          background: #3b82f6;
          cursor: pointer;
          border: none;
        }
      `}</style>
    </motion.div>
  );
};

export default Sidebar;
