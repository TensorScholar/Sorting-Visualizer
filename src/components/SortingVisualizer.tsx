import React, { useRef, useEffect, useCallback, useState } from 'react';
import { motion, useMotionValue, useTransform, useSpring } from 'framer-motion';
import { useAppStore } from '../store/algorithmStore';
import { WebGLRenderer } from '../visualization/renderers/webgl-renderer';
import { ThreeRenderer } from '../visualization/renderers/three-renderer';
import { CanvasRenderer } from '../visualization/renderers/canvas-renderer';
import { useAnimationFrame } from '../hooks/useAnimationFrame';
import { cn } from '../utils/cn';
import { Atom, Sparkles, Brain, CpuIcon, Eye, EyeOff } from 'lucide-react';

/**
 * Revolutionary Sorting Visualizer Component
 * Masterpiece Edition - Quantum Visualization System
 * 
 * @author Mohammad Atashi
 * @version 3.0.0 - Masterpiece Edition
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
  const [showParticleField, setShowParticleField] = useState(true);

  // Quantum motion effects
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const canvasRotateX = useTransform(mouseY, [-300, 300], [5, -5]);
  const canvasRotateY = useTransform(mouseX, [-300, 300], [-5, 5]);
  const springCanvasRotateX = useSpring(canvasRotateX, { stiffness: 50, damping: 20 });
  const springCanvasRotateY = useSpring(canvasRotateY, { stiffness: 50, damping: 20 });

  const {
    visualization,
    algorithm,
    setVisualization,
  } = useAppStore();

  // Mouse tracking
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        mouseX.set(e.clientX - rect.left - rect.width / 2);
        mouseY.set(e.clientY - rect.top - rect.height / 2);
      }
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [mouseX, mouseY]);

  // Initialize renderer
  const initializeRenderer = useCallback(async () => {
    if (!canvasRef.current || !containerRef.current) return;

    try {
      setError(null);
      
      let newRenderer: WebGLRenderer | ThreeRenderer | CanvasRenderer;
      
      switch (visualization.renderMode) {
        case 'three':
          newRenderer = new ThreeRenderer(canvasRef.current, {
            antialias: true,
            alpha: true,
            preserveDrawingBuffer: true,
          });
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
      setError('Quantum renderer failed. Using classical visualization.');
      
      try {
        const fallbackRenderer = new CanvasRenderer(canvasRef.current!, {
          antialias: true,
        });
        await fallbackRenderer.initialize();
        setRenderer(fallbackRenderer);
        setIsInitialized(true);
      } catch (fallbackErr) {
        setError('Visualization system offline.');
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

  // Initialize renderer
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

  return (
    <motion.div
      ref={containerRef}
      className={cn(
        'relative w-full h-full flex flex-col overflow-hidden',
        className
      )}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.8, ease: 'easeOut' }}
    >
      {/* Quantum Particle Field */}
      {showParticleField && (
        <div className="absolute inset-0 pointer-events-none z-0">
          <svg className="w-full h-full">
            {Array.from({ length: 50 }, (_, i) => (
              <motion.circle
                key={i}
                cx={Math.random() * 100 + '%'}
                cy={Math.random() * 100 + '%'}
                r={Math.random() * 3 + 1}
                fill={`hsl(${Math.random() * 60 + 200}, 70%, 60%)`}
                initial={{ opacity: 0, scale: 0 }}
                animate={{ 
                  opacity: [0.3, 1, 0.3],
                  scale: [1, 1.5, 1]
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

      {/* Quantum Field Grid */}
      <div className="absolute inset-0 pointer-events-none z-1">
        <svg className="w-full h-full opacity-10">
          <defs>
            <pattern id="quantumGrid" x="0" y="0" width="50" height="50" patternUnits="userSpaceOnUse">
              <path d="M 50 0 L 0 0 0 50" fill="none" stroke="#3b82f6" strokeWidth="1"/>
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#quantumGrid)" />
        </svg>
      </div>

      {/* Mode Indicator */}
      <div className="absolute top-4 left-4 z-20">
        <motion.div
          className="px-4 py-2 rounded-full text-sm font-medium bg-black/50 backdrop-blur-xl border border-white/20 flex items-center space-x-2"
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ delay: 0.8, type: 'spring', damping: 15 }}
        >
          <Atom className="w-4 h-4 text-blue-400" />
          <span className="text-white">QUANTUM MODE</span>
          <Sparkles className="w-4 h-4 text-purple-400" />
        </motion.div>
      </div>

      {/* Error Display */}
      {error && (
        <motion.div
          className="absolute top-4 right-4 z-20 max-w-sm"
          initial={{ opacity: 0, x: 20, scale: 0.8 }}
          animate={{ opacity: 1, x: 0, scale: 1 }}
        >
          <div className="bg-red-500/90 backdrop-blur-xl text-white px-4 py-3 rounded-xl text-sm border border-red-400/30 shadow-2xl">
            <div className="flex items-center space-x-2">
              <CpuIcon className="w-4 h-4" />
              <span>{error}</span>
            </div>
          </div>
        </motion.div>
      )}

      {/* Quantum Canvas Container */}
      <div className="flex-1 relative">
        <motion.canvas
          ref={canvasRef}
          className="w-full h-full block rounded-2xl"
          style={{
            background: 'transparent',
            rotateX: springCanvasRotateX,
            rotateY: springCanvasRotateY,
            transformStyle: 'preserve-3d'
          }}
        />
        
        {/* Loading Overlay */}
        {!isInitialized && (
          <motion.div
            className="absolute inset-0 flex items-center justify-center bg-black/50 backdrop-blur-xl rounded-2xl"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <div className="text-center">
              <motion.div
                className="w-12 h-12 border-2 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
              />
              <motion.p 
                className="text-sm text-gray-300"
                animate={{ opacity: [0.5, 1, 0.5] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                Initializing Quantum Renderer...
              </motion.p>
            </div>
          </motion.div>
        )}

        {/* Algorithm Progress Overlay */}
        {algorithm.totalSteps > 0 && (
          <motion.div
            className="absolute bottom-4 left-4 right-4 z-20"
            initial={{ opacity: 0, y: 20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ delay: 0.3, type: 'spring', damping: 20 }}
          >
            <div className="bg-black/50 backdrop-blur-xl rounded-2xl p-6 border border-white/20 shadow-2xl">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <motion.div
                    className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center"
                    animate={{ rotate: [0, 360] }}
                    transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
                  >
                    <Brain className="w-4 h-4 text-white" />
                  </motion.div>
                  <div>
                    <span className="text-sm font-medium text-white">{algorithm.name}</span>
                    <div className="text-xs text-gray-400">Quantum Processing Unit</div>
                  </div>
                </div>
                <span className="text-xs text-gray-400 font-mono">
                  Step {algorithm.currentStep} of {algorithm.totalSteps}
                </span>
              </div>
              
              {/* Quantum Progress Bar */}
              <div className="w-full bg-white/10 rounded-full h-3 overflow-hidden mb-4">
                <motion.div
                  className="h-full bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 rounded-full relative"
                  initial={{ width: 0 }}
                  animate={{ width: `${(algorithm.currentStep / algorithm.totalSteps) * 100}%` }}
                  transition={{ duration: 0.5, ease: 'easeOut' }}
                >
                  <motion.div
                    className="absolute inset-0 bg-white/20"
                    animate={{ x: ['-100%', '100%'] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  />
                </motion.div>
              </div>
              
              {/* Quantum Metrics */}
              <div className="grid grid-cols-3 gap-4 text-xs">
                <div className="text-center">
                  <div className="text-blue-400 font-mono">{algorithm.metrics.comparisons}</div>
                  <div className="text-gray-400">Comparisons</div>
                </div>
                <div className="text-center">
                  <div className="text-purple-400 font-mono">{algorithm.metrics.swaps}</div>
                  <div className="text-gray-400">Swaps</div>
                </div>
                <div className="text-center">
                  <div className="text-pink-400 font-mono">{algorithm.metrics.executionTime.toFixed(1)}ms</div>
                  <div className="text-gray-400">Time</div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </div>

      {/* Quantum Controls Overlay */}
      <motion.div
        className="absolute top-4 right-4 z-20 flex space-x-3"
        initial={{ opacity: 0, scale: 0.9, y: -20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ delay: 0.4, type: 'spring', damping: 20 }}
      >
        {/* Render Mode Toggle */}
        <motion.select
          value={visualization.renderMode}
          onChange={(e) => setVisualization({ renderMode: e.target.value as any })}
          className="px-3 py-2 rounded-xl bg-black/50 backdrop-blur-xl border border-white/20 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <option value="canvas">Canvas 2D</option>
          <option value="webgl">WebGL 2.0</option>
          <option value="three">Three.js 3D</option>
        </motion.select>

        {/* Color Scheme Toggle */}
        <motion.select
          value={visualization.colorScheme}
          onChange={(e) => setVisualization({ colorScheme: e.target.value as any })}
          className="px-3 py-2 rounded-xl bg-black/50 backdrop-blur-xl border border-white/20 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <option value="default">Default</option>
          <option value="gradient">Gradient</option>
          <option value="rainbow">Rainbow</option>
          <option value="monochrome">Monochrome</option>
        </motion.select>

        {/* Particle Field Toggle */}
        <motion.button
          className="p-2 rounded-xl bg-black/50 backdrop-blur-xl border border-white/20 text-white transition-all"
          whileHover={{ scale: 1.1, rotate: 180 }}
          whileTap={{ scale: 0.9 }}
          onClick={() => setShowParticleField(!showParticleField)}
        >
          {showParticleField ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
        </motion.button>
      </motion.div>
    </motion.div>
  );
};

export default SortingVisualizer;
