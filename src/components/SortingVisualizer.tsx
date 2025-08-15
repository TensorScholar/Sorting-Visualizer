import React, { useRef, useEffect, useCallback, useState } from 'react';
import { motion } from 'framer-motion';
import { useAppStore } from '../store/algorithmStore';
import { WebGLRenderer } from '../visualization/renderers/webgl-renderer';
import { ThreeRenderer } from '../visualization/renderers/three-renderer';
import { CanvasRenderer } from '../visualization/renderers/canvas-renderer';
import { useAnimationFrame } from '../hooks/useAnimationFrame';
import { cn } from '../utils/cn';

/**
 * Advanced Sorting Visualizer Component
 * 
 * Provides high-performance visualization of sorting algorithms using
 * multiple rendering backends (WebGL, Three.js, Canvas) with adaptive
 * scaling and modern visual effects.
 * 
 * @author Mohammad Atashi
 * @version 2.0.0
 */

interface SortingVisualizerProps {
  className?: string;
}

const SortingVisualizer: React.FC<SortingVisualizerProps> = ({ className }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [renderer, setRenderer] = useState<WebGLRenderer | ThreeRenderer | CanvasRenderer | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    visualization,
    algorithm,
    setVisualization,
    setAlgorithm,
  } = useAppStore();

  // Initialize renderer based on mode and data size
  const initializeRenderer = useCallback(async () => {
    if (!canvasRef.current || !containerRef.current) return;

    try {
      setError(null);
      
      let newRenderer: WebGLRenderer | ThreeRenderer | CanvasRenderer;
      
      switch (visualization.renderMode) {
        case 'three':
          if (visualization.dataSize > 1000) {
            newRenderer = new ThreeRenderer(canvasRef.current, {
              antialias: true,
              alpha: true,
              preserveDrawingBuffer: true,
            });
          } else {
            // Fallback to WebGL for smaller datasets
            newRenderer = new WebGLRenderer(canvasRef.current, {
              antialias: true,
              alpha: true,
            });
          }
          break;
          
        case 'webgl':
          newRenderer = new WebGLRenderer(canvasRef.current, {
            antialias: true,
            alpha: true,
          });
          break;
          
        default:
          newRenderer = new CanvasRenderer(canvasRef.current, {
            antialias: true,
          });
          break;
      }

      await newRenderer.initialize();
      setRenderer(newRenderer);
      setIsInitialized(true);
      
    } catch (err) {
      console.error('Failed to initialize renderer:', err);
      setError('Failed to initialize visualization renderer. Please try a different mode.');
      
      // Fallback to canvas renderer
      try {
        const fallbackRenderer = new CanvasRenderer(canvasRef.current!, {
          antialias: true,
        });
        await fallbackRenderer.initialize();
        setRenderer(fallbackRenderer);
        setIsInitialized(true);
      } catch (fallbackErr) {
        setError('Visualization is not available. Please check your browser support.');
      }
    }
  }, [visualization.renderMode, visualization.dataSize]);

  // Handle data updates
  useEffect(() => {
    if (renderer && isInitialized && visualization.data.length > 0) {
      renderer.setData(visualization.data, {
        colorScheme: visualization.colorScheme,
        showHeapView: visualization.showHeapView,
        animationSpeed: visualization.animationSpeed,
      });
    }
  }, [renderer, isInitialized, visualization.data, visualization.colorScheme, visualization.showHeapView, visualization.animationSpeed]);

  // Handle algorithm state updates
  useEffect(() => {
    if (renderer && isInitialized && algorithm.history.length > 0) {
      const currentState = algorithm.history[algorithm.currentStep];
      if (currentState) {
        renderer.updateState(currentState, {
          comparisons: algorithm.metrics.comparisons,
          swaps: algorithm.metrics.swaps,
          reads: algorithm.metrics.reads,
          writes: algorithm.metrics.writes,
        });
      }
    }
  }, [renderer, isInitialized, algorithm.currentStep, algorithm.history, algorithm.metrics]);

  // Initialize renderer on mount and mode change
  useEffect(() => {
    initializeRenderer();
    
    return () => {
      if (renderer) {
        renderer.dispose();
      }
    };
  }, [initializeRenderer]);

  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      if (renderer && containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        renderer.resize(rect.width, rect.height);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [renderer]);

  // Animation loop
  useAnimationFrame((timestamp) => {
    if (renderer && isInitialized && algorithm.isRunning) {
      renderer.render(timestamp);
    }
  });

  // Auto-adjust render mode based on data size
  useEffect(() => {
    if (visualization.dataSize > 5000 && visualization.renderMode !== 'three') {
      setVisualization({ renderMode: 'three' });
    } else if (visualization.dataSize > 500 && visualization.renderMode === 'canvas') {
      setVisualization({ renderMode: 'webgl' });
    }
  }, [visualization.dataSize, visualization.renderMode, setVisualization]);

  return (
    <motion.div
      ref={containerRef}
      className={cn(
        'relative w-full h-full flex flex-col',
        className
      )}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      {/* Render Mode Indicator */}
      <div className="absolute top-4 left-4 z-10">
        <motion.div
          className="px-3 py-1 rounded-full text-xs font-medium bg-black/50 backdrop-blur-sm border border-white/20"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.5 }}
        >
          {visualization.renderMode.toUpperCase()} Mode
        </motion.div>
      </div>

      {/* Error Display */}
      {error && (
        <motion.div
          className="absolute top-4 right-4 z-10 max-w-sm"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
        >
          <div className="bg-red-500/90 backdrop-blur-sm text-white px-4 py-2 rounded-lg text-sm">
            {error}
          </div>
        </motion.div>
      )}

      {/* Canvas Container */}
      <div className="flex-1 relative">
        <canvas
          ref={canvasRef}
          className="w-full h-full block"
          style={{
            background: 'transparent',
          }}
        />
        
        {/* Loading Overlay */}
        {!isInitialized && (
          <motion.div
            className="absolute inset-0 flex items-center justify-center bg-black/50 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <div className="text-center">
              <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
              <p className="text-sm text-gray-300">Initializing renderer...</p>
            </div>
          </motion.div>
        )}

        {/* Algorithm Progress Overlay */}
        {algorithm.totalSteps > 0 && (
          <motion.div
            className="absolute bottom-4 left-4 right-4 z-10"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <div className="bg-black/50 backdrop-blur-sm rounded-lg p-4 border border-white/20">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-white">
                  {algorithm.name}
                </span>
                <span className="text-xs text-gray-400">
                  Step {algorithm.currentStep} of {algorithm.totalSteps}
                </span>
              </div>
              
              {/* Progress Bar */}
              <div className="w-full bg-white/20 rounded-full h-2 overflow-hidden">
                <motion.div
                  className="h-full bg-gradient-to-r from-blue-500 to-purple-500"
                  initial={{ width: 0 }}
                  animate={{ width: `${(algorithm.currentStep / algorithm.totalSteps) * 100}%` }}
                  transition={{ duration: 0.3 }}
                />
              </div>
              
              {/* Metrics */}
              <div className="flex justify-between mt-2 text-xs text-gray-400">
                <span>Comparisons: {algorithm.metrics.comparisons}</span>
                <span>Swaps: {algorithm.metrics.swaps}</span>
                <span>Time: {algorithm.metrics.executionTime.toFixed(2)}ms</span>
              </div>
            </div>
          </motion.div>
        )}
      </div>

      {/* Controls Overlay */}
      <motion.div
        className="absolute top-4 right-4 z-10 flex space-x-2"
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.4 }}
      >
        {/* Render Mode Toggle */}
        <select
          value={visualization.renderMode}
          onChange={(e) => setVisualization({ renderMode: e.target.value as any })}
          className="px-3 py-1 rounded-lg bg-black/50 backdrop-blur-sm border border-white/20 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="canvas">Canvas</option>
          <option value="webgl">WebGL</option>
          <option value="three">Three.js</option>
        </select>

        {/* Color Scheme Toggle */}
        <select
          value={visualization.colorScheme}
          onChange={(e) => setVisualization({ colorScheme: e.target.value as any })}
          className="px-3 py-1 rounded-lg bg-black/50 backdrop-blur-sm border border-white/20 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="default">Default</option>
          <option value="gradient">Gradient</option>
          <option value="rainbow">Rainbow</option>
          <option value="monochrome">Monochrome</option>
        </select>
      </motion.div>
    </motion.div>
  );
};

export default SortingVisualizer;
