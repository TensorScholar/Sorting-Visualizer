import React from 'react';
import { motion } from 'framer-motion';
import { useAppStore } from '../store/algorithmStore';
import { BarChart3, Clock, Zap, TrendingUp } from 'lucide-react';

/**
 * Metrics Display Component
 * 
 * Shows real-time performance metrics and algorithm statistics
 * with animated charts and modern visual design.
 * 
 * @author Mohammad Atashi
 * @version 2.0.0
 */

const MetricsDisplay: React.FC = () => {
  const { algorithm, visualization } = useAppStore();

  const formatNumber = (num: number): string => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M';
    } else if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
  };

  const formatTime = (ms: number): string => {
    if (ms < 1) return '<1ms';
    if (ms < 1000) return `${ms.toFixed(1)}ms`;
    return `${(ms / 1000).toFixed(2)}s`;
  };

  const getEfficiencyScore = (): number => {
    const { comparisons, swaps, reads, writes } = algorithm.metrics;
    const totalOperations = comparisons + swaps + reads + writes;
    if (totalOperations === 0) return 0;
    
    // Calculate efficiency based on operations per element
    const efficiency = Math.max(0, 100 - (totalOperations / visualization.data.length) * 10);
    return Math.min(100, efficiency);
  };

  const efficiencyScore = getEfficiencyScore();

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold text-white flex items-center space-x-2">
        <BarChart3 className="w-5 h-5" />
        <span>Performance Metrics</span>
      </h3>

      {/* Algorithm Info */}
      <div className="bg-white/5 rounded-lg p-4 border border-white/10">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-300">Algorithm</span>
          <span className="text-sm text-white">{algorithm.name}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-gray-300">Data Size</span>
          <span className="text-sm text-white">{visualization.data.length} elements</span>
        </div>
      </div>

      {/* Efficiency Score */}
      <div className="bg-white/5 rounded-lg p-4 border border-white/10">
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm font-medium text-gray-300">Efficiency Score</span>
          <span className="text-sm text-white">{efficiencyScore.toFixed(1)}%</span>
        </div>
        <div className="w-full bg-white/10 rounded-full h-2">
          <motion.div
            className="h-full bg-gradient-to-r from-green-500 to-blue-500 rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${efficiencyScore}%` }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
          />
        </div>
      </div>

      {/* Operation Counts */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Zap className="w-4 h-4 text-yellow-400" />
            <span className="text-sm text-gray-300">Comparisons</span>
          </div>
          <span className="text-sm font-mono text-white">
            {formatNumber(algorithm.metrics.comparisons)}
          </span>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <TrendingUp className="w-4 h-4 text-red-400" />
            <span className="text-sm text-gray-300">Swaps</span>
          </div>
          <span className="text-sm font-mono text-white">
            {formatNumber(algorithm.metrics.swaps)}
          </span>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <BarChart3 className="w-4 h-4 text-blue-400" />
            <span className="text-sm text-gray-300">Memory Access</span>
          </div>
          <span className="text-sm font-mono text-white">
            {formatNumber(algorithm.metrics.reads + algorithm.metrics.writes)}
          </span>
        </div>
      </div>

      {/* Timing */}
      <div className="bg-white/5 rounded-lg p-4 border border-white/10">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center space-x-2">
            <Clock className="w-4 h-4 text-purple-400" />
            <span className="text-sm font-medium text-gray-300">Execution Time</span>
          </div>
          <span className="text-sm font-mono text-white">
            {formatTime(algorithm.metrics.executionTime)}
          </span>
        </div>
        
        {algorithm.metrics.executionTime > 0 && (
          <div className="text-xs text-gray-400">
            ~{formatNumber(Math.round(visualization.data.length / (algorithm.metrics.executionTime / 1000)))} ops/sec
          </div>
        )}
      </div>

      {/* Progress */}
      {algorithm.totalSteps > 0 && (
        <div className="bg-white/5 rounded-lg p-4 border border-white/10">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-300">Progress</span>
            <span className="text-sm text-white">
              {algorithm.currentStep} / {algorithm.totalSteps}
            </span>
          </div>
          <div className="w-full bg-white/10 rounded-full h-2">
            <motion.div
              className="h-full bg-gradient-to-r from-blue-500 to-purple-500 rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${(algorithm.currentStep / algorithm.totalSteps) * 100}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>
        </div>
      )}

      {/* Status */}
      <div className="bg-white/5 rounded-lg p-4 border border-white/10">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-gray-300">Status</span>
          <div className="flex items-center space-x-2">
            <div className={`w-2 h-2 rounded-full ${
              algorithm.isRunning 
                ? 'bg-green-400 animate-pulse' 
                : algorithm.isComplete 
                ? 'bg-blue-400' 
                : 'bg-gray-400'
            }`} />
            <span className="text-sm text-white">
              {algorithm.isRunning 
                ? 'Running' 
                : algorithm.isComplete 
                ? 'Complete' 
                : 'Ready'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MetricsDisplay;
