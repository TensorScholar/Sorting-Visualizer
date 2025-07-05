// src/components/metrics-display.js

/**
 * @file Performance Metrics Display Component
 * @author Algorithm Visualization Platform Team
 * @version 1.0.0
 * 
 * @description
 * A comprehensive metrics visualization component that displays and analyzes
 * algorithm performance characteristics with academic precision. This component
 * renders operation counts, time complexity analysis, and comparison metrics
 * using responsive visualizations and interactive data displays.
 * 
 * The architecture follows a modular design with specialized sub-components
 * for different metric categories and visualization types, enabling both
 * detailed analysis of individual algorithm performance and comparative
 * evaluation across multiple algorithms.
 *
 * Time complexity: O(1) for rendering with pre-computed metrics
 * Space complexity: O(k) where k is the number of metrics tracked
 *
 * @requires React
 * @requires Chart.js (imported dynamically for performance)
 */

import React, { useState, useEffect, useRef, useMemo } from 'react';

/**
 * Helper functions for metrics analysis and processing
 * @namespace MetricsAnalysis
 * @private
 */
const MetricsAnalysis = {
  /**
   * Calculate derived efficiency metrics
   * @param {Object} metrics - Raw metrics data
   * @returns {Object} Derived metrics
   */
  calculateDerivedMetrics(metrics) {
    if (!metrics || Object.keys(metrics).length === 0) {
      return {};
    }
    
    // Calculate operation ratios and efficiency measures
    const totalOperations = (metrics.comparisons || 0) + 
                           (metrics.swaps || 0) + 
                           (metrics.reads || 0) + 
                           (metrics.writes || 0);
    
    const arraySize = metrics.arraySize || 0;
    
    return {
      // Operation ratios
      comparisonRatio: totalOperations ? metrics.comparisons / totalOperations : 0,
      swapRatio: totalOperations ? metrics.swaps / totalOperations : 0,
      readRatio: totalOperations ? metrics.reads / totalOperations : 0,
      writeRatio: totalOperations ? metrics.writes / totalOperations : 0,
      
      // Efficiency measures
      operationsPerElement: arraySize ? totalOperations / arraySize : 0,
      comparisonsPerElement: arraySize ? metrics.comparisons / arraySize : 0,
      swapsPerElement: arraySize ? metrics.swaps / arraySize : 0,
      
      // Time efficiency
      operationsPerMs: metrics.executionTime ? totalOperations / metrics.executionTime : 0,
      elementsPerMs: metrics.executionTime ? arraySize / metrics.executionTime : 0,
      
      // Memory metrics
      memoryAccessRatio: totalOperations ? metrics.memoryAccesses / totalOperations : 0,
      
      // Cache metrics
      cacheHitRatio: (metrics.cacheHits !== undefined && metrics.cacheMisses !== undefined) ? 
        metrics.cacheHits / (metrics.cacheHits + metrics.cacheMisses || 1) : undefined,
      
      // Total operations
      totalOperations
    };
  },
  
  /**
   * Calculate theoretical complexity values for known size
   * @param {Object} complexity - Complexity information (O(n), O(n log n), etc.)
   * @param {number} n - Size of the input
   * @returns {Object} Theoretical operation counts
   */
  calculateTheoreticalComplexity(complexity, n) {
    if (!complexity || !n) return {};
    
    // Parse complexity expressions and calculate theoretical values
    const calculations = {};
    
    // Helper to evaluate common complexity expressions
    const evaluate = (expr) => {
      if (expr.includes('n²') || expr.includes('n^2')) return n * n;
      if (expr.includes('n log n')) return n * Math.log2(n);
      if (expr.includes('n')) return n;
      if (expr.includes('log n')) return Math.log2(n);
      if (expr.includes('1')) return 1;
      // Default case: can't parse, return n as fallback
      return n;
    };
    
    // Calculate theoretical values for different complexity classes
    if (complexity.time) {
      if (complexity.time.average) {
        calculations.average = evaluate(complexity.time.average);
      }
      if (complexity.time.worst) {
        calculations.worst = evaluate(complexity.time.worst);
      }
      if (complexity.time.best) {
        calculations.best = evaluate(complexity.time.best);
      }
    }
    
    return calculations;
  },
  
  /**
   * Format a number for display with appropriate units
   * @param {number} value - The value to format
   * @param {string} [precision='0'] - Decimal precision
   * @returns {string} Formatted value
   */
  formatNumber(value, precision = '0') {
    if (value === undefined || value === null) return 'N/A';
    
    if (value === 0) return '0';
    
    // Format based on magnitude
    if (Math.abs(value) >= 1e9) {
      return (value / 1e9).toFixed(precision) + 'B';
    } else if (Math.abs(value) >= 1e6) {
      return (value / 1e6).toFixed(precision) + 'M';
    } else if (Math.abs(value) >= 1e3) {
      return (value / 1e3).toFixed(precision) + 'K';
    } else if (Math.abs(value) < 0.01 && value !== 0) {
      return value.toExponential(2);
    } else {
      return value.toFixed(precision);
    }
  },
  
  /**
   * Format time value with appropriate units
   * @param {number} timeMs - Time in milliseconds
   * @returns {string} Formatted time string
   */
  formatTime(timeMs) {
    if (timeMs === undefined || timeMs === null) return 'N/A';
    
    if (timeMs === 0) return '0 ms';
    
    if (timeMs < 1) {
      return (timeMs * 1000).toFixed(2) + ' μs';
    } else if (timeMs < 1000) {
      return timeMs.toFixed(2) + ' ms';
    } else {
      return (timeMs / 1000).toFixed(2) + ' s';
    }
  },
  
  /**
   * Classify algorithm performance based on metrics
   * @param {Object} metrics - Raw metrics data
   * @param {Object} theoreticalValues - Theoretical values
   * @returns {Object} Performance classification
   */
  classifyPerformance(metrics, theoreticalValues) {
    if (!metrics || !theoreticalValues) return {};
    
    const classification = {
      efficiency: null,
      scalability: null,
      memoryUsage: null,
      overall: null
    };
    
    // Evaluate efficiency based on comparison to theoretical values
    if (theoreticalValues.average && metrics.comparisons) {
      const ratio = metrics.comparisons / theoreticalValues.average;
      
      if (ratio < 0.8) classification.efficiency = 'excellent';
      else if (ratio < 1.2) classification.efficiency = 'good';
      else if (ratio < 2) classification.efficiency = 'fair';
      else classification.efficiency = 'poor';
    }
    
    // Evaluate memory usage
    if (metrics.auxiliarySpace !== undefined && metrics.arraySize) {
      const memoryRatio = metrics.auxiliarySpace / metrics.arraySize;
      
      if (memoryRatio < 0.1) classification.memoryUsage = 'excellent';
      else if (memoryRatio < 0.5) classification.memoryUsage = 'good';
      else if (memoryRatio < 1) classification.memoryUsage = 'fair';
      else classification.memoryUsage = 'high';
    }
    
    return classification;
  }
};

/**
 * Component that displays basic operation counts
 * @param {Object} props - Component properties
 * @param {Object} props.metrics - Algorithm metrics
 * @returns {JSX.Element} Rendered component
 * @private
 */
const BasicMetrics = ({ metrics }) => {
  if (!metrics || Object.keys(metrics).length === 0) {
    return <div className="no-metrics">No metrics available</div>;
  }
  
  return (
    <div className="basic-metrics">
      <div className="metrics-grid">
        <div className="metric-card">
          <div className="metric-title">Comparisons</div>
          <div className="metric-value">{MetricsAnalysis.formatNumber(metrics.comparisons)}</div>
        </div>
        
        <div className="metric-card">
          <div className="metric-title">Swaps</div>
          <div className="metric-value">{MetricsAnalysis.formatNumber(metrics.swaps)}</div>
        </div>
        
        <div className="metric-card">
          <div className="metric-title">Array Reads</div>
          <div className="metric-value">{MetricsAnalysis.formatNumber(metrics.reads)}</div>
        </div>
        
        <div className="metric-card">
          <div className="metric-title">Array Writes</div>
          <div className="metric-value">{MetricsAnalysis.formatNumber(metrics.writes)}</div>
        </div>
        
        <div className="metric-card">
          <div className="metric-title">Memory Accesses</div>
          <div className="metric-value">{MetricsAnalysis.formatNumber(metrics.memoryAccesses)}</div>
        </div>
        
        <div className="metric-card">
          <div className="metric-title">Execution Time</div>
          <div className="metric-value">{MetricsAnalysis.formatTime(metrics.executionTime)}</div>
        </div>
        
        {metrics.recursiveCalls !== undefined && (
          <div className="metric-card">
            <div className="metric-title">Recursive Calls</div>
            <div className="metric-value">{MetricsAnalysis.formatNumber(metrics.recursiveCalls)}</div>
          </div>
        )}
        
        {metrics.auxiliarySpace !== undefined && (
          <div className="metric-card">
            <div className="metric-title">Auxiliary Space</div>
            <div className="metric-value">{MetricsAnalysis.formatNumber(metrics.auxiliarySpace)} units</div>
          </div>
        )}
      </div>
    </div>
  );
};

/**
 * Component that displays derived performance metrics
 * @param {Object} props - Component properties
 * @param {Object} props.metrics - Algorithm metrics
 * @param {number} props.arraySize - Size of the array being sorted
 * @returns {JSX.Element} Rendered component
 * @private
 */
const DerivedMetrics = ({ metrics, arraySize }) => {
  // Calculate derived metrics
  const derivedMetrics = useMemo(() => {
    const extendedMetrics = { ...metrics, arraySize };
    return MetricsAnalysis.calculateDerivedMetrics(extendedMetrics);
  }, [metrics, arraySize]);
  
  if (!derivedMetrics || Object.keys(derivedMetrics).length === 0) {
    return null;
  }
  
  return (
    <div className="derived-metrics">
      <h3 className="metrics-section-title">Performance Analysis</h3>
      
      <div className="metrics-grid">
        <div className="metric-card">
          <div className="metric-title">Operations per Element</div>
          <div className="metric-value">{derivedMetrics.operationsPerElement.toFixed(2)}</div>
        </div>
        
        <div className="metric-card">
          <div className="metric-title">Comparisons per Element</div>
          <div className="metric-value">{derivedMetrics.comparisonsPerElement.toFixed(2)}</div>
        </div>
        
        <div className="metric-card">
          <div className="metric-title">Processing Speed</div>
          <div className="metric-value">{(derivedMetrics.elementsPerMs * 1000).toFixed(2)} elements/sec</div>
        </div>
        
        <div className="metric-card">
          <div className="metric-title">Operation Speed</div>
          <div className="metric-value">{(derivedMetrics.operationsPerMs * 1000).toFixed(2)} ops/sec</div>
        </div>
      </div>
      
      <div className="operation-ratio-chart">
        <h4 className="subsection-title">Operation Distribution</h4>
        <div className="ratio-bars">
          <div className="ratio-bar">
            <div 
              className="ratio-fill comparison-color" 
              style={{ width: `${derivedMetrics.comparisonRatio * 100}%` }}
            />
            <span className="ratio-label">Comparisons</span>
            <span className="ratio-value">{(derivedMetrics.comparisonRatio * 100).toFixed(1)}%</span>
          </div>
          
          <div className="ratio-bar">
            <div 
              className="ratio-fill swap-color" 
              style={{ width: `${derivedMetrics.swapRatio * 100}%` }}
            />
            <span className="ratio-label">Swaps</span>
            <span className="ratio-value">{(derivedMetrics.swapRatio * 100).toFixed(1)}%</span>
          </div>
          
          <div className="ratio-bar">
            <div 
              className="ratio-fill read-color" 
              style={{ width: `${derivedMetrics.readRatio * 100}%` }}
            />
            <span className="ratio-label">Reads</span>
            <span className="ratio-value">{(derivedMetrics.readRatio * 100).toFixed(1)}%</span>
          </div>
          
          <div className="ratio-bar">
            <div 
              className="ratio-fill write-color" 
              style={{ width: `${derivedMetrics.writeRatio * 100}%` }}
            />
            <span className="ratio-label">Writes</span>
            <span className="ratio-value">{(derivedMetrics.writeRatio * 100).toFixed(1)}%</span>
          </div>
        </div>
      </div>
    </div>
  );
};

/**
 * Component that displays theoretical complexity analysis
 * @param {Object} props - Component properties
 * @param {Object} props.complexity - Algorithm complexity information
 * @param {Object} props.metrics - Algorithm metrics
 * @param {number} props.arraySize - Size of the array being sorted
 * @returns {JSX.Element} Rendered component
 * @private
 */
const ComplexityAnalysis = ({ complexity, metrics, arraySize }) => {
  // Calculate theoretical values
  const theoreticalValues = useMemo(() => {
    return MetricsAnalysis.calculateTheoreticalComplexity(complexity, arraySize);
  }, [complexity, arraySize]);
  
  // Classification of performance
  const classification = useMemo(() => {
    return MetricsAnalysis.classifyPerformance(metrics, theoreticalValues);
  }, [metrics, theoreticalValues]);
  
  if (!complexity || !metrics) {
    return null;
  }
  
  return (
    <div className="complexity-analysis">
      <h3 className="metrics-section-title">Complexity Analysis</h3>
      
      <div className="complexity-info">
        <div className="complexity-card">
          <div className="complexity-title">Time Complexity</div>
          <div className="complexity-values">
            <div><span className="complexity-type">Best:</span> {complexity.time?.best || 'N/A'}</div>
            <div><span className="complexity-type">Average:</span> {complexity.time?.average || 'N/A'}</div>
            <div><span className="complexity-type">Worst:</span> {complexity.time?.worst || 'N/A'}</div>
          </div>
        </div>
        
        <div className="complexity-card">
          <div className="complexity-title">Space Complexity</div>
          <div className="complexity-values">
            <div><span className="complexity-type">Auxiliary:</span> {complexity.space?.average || 'N/A'}</div>
          </div>
        </div>
        
        {classification.efficiency && (
          <div className="complexity-card">
            <div className="complexity-title">Performance Classification</div>
            <div className="complexity-values">
              <div>
                <span className="complexity-type">Efficiency:</span> 
                <span className={`classification ${classification.efficiency}`}>
                  {classification.efficiency}
                </span>
              </div>
              
              {classification.memoryUsage && (
                <div>
                  <span className="complexity-type">Memory Usage:</span>
                  <span className={`classification ${classification.memoryUsage}`}>
                    {classification.memoryUsage}
                  </span>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
      
      {/* Compare actual vs theoretical performance */}
      {theoreticalValues.average && metrics.comparisons && (
        <div className="theoretical-comparison">
          <h4 className="subsection-title">Actual vs. Theoretical</h4>
          
          <div className="comparison-chart">
            <div className="comparison-item">
              <div className="comparison-label">Comparisons</div>
              <div className="comparison-bars">
                <div className="comparison-bar-container">
                  <div className="comparison-bar-label">Actual</div>
                  <div className="comparison-bar">
                    <div 
                      className="comparison-bar-fill actual" 
                      style={{ 
                        width: `${Math.min(100, (metrics.comparisons / theoreticalValues.worst) * 100)}%` 
                      }}
                    />
                  </div>
                  <div className="comparison-bar-value">{MetricsAnalysis.formatNumber(metrics.comparisons)}</div>
                </div>
                
                <div className="comparison-bar-container">
                  <div className="comparison-bar-label">Theoretical (Avg)</div>
                  <div className="comparison-bar">
                    <div 
                      className="comparison-bar-fill theoretical" 
                      style={{ 
                        width: `${Math.min(100, (theoreticalValues.average / theoreticalValues.worst) * 100)}%` 
                      }}
                    />
                  </div>
                  <div className="comparison-bar-value">{MetricsAnalysis.formatNumber(theoreticalValues.average)}</div>
                </div>
                
                {theoreticalValues.worst && (
                  <div className="comparison-bar-container">
                    <div className="comparison-bar-label">Theoretical (Worst)</div>
                    <div className="comparison-bar">
                      <div 
                        className="comparison-bar-fill theoretical-worst" 
                        style={{ width: '100%' }}
                      />
                    </div>
                    <div className="comparison-bar-value">{MetricsAnalysis.formatNumber(theoreticalValues.worst)}</div>
                  </div>
                )}
              </div>
            </div>
          </div>
          
          {/* Efficiency ratio */}
          <div className="efficiency-ratio">
            <span className="efficiency-label">Performance Ratio:</span>
            <span className="efficiency-value">
              {(metrics.comparisons / theoreticalValues.average).toFixed(2)}x theoretical average
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

/**
 * Component for visualizing algorithm metrics with Chart.js
 * This component is loaded dynamically to reduce initial bundle size
 * @param {Object} props - Component properties
 * @param {Object} props.metrics - Algorithm metrics
 * @param {Object[]} props.historyMetrics - Metrics history for time-series visualization
 * @returns {JSX.Element} Rendered component
 * @private
 */
const MetricsCharts = ({ metrics, historyMetrics }) => {
  const [chartLibrary, setChartLibrary] = useState(null);
  const operationsChartRef = useRef(null);
  const timeSeriesChartRef = useRef(null);
  
  // Load Chart.js library dynamically
  useEffect(() => {
    const loadChartLibrary = async () => {
      try {
        // Dynamic import to reduce initial bundle size
        const Chart = await import('chart.js/auto');
        setChartLibrary(Chart);
      } catch (error) {
        console.error('Failed to load Chart.js library:', error);
      }
    };
    
    loadChartLibrary();
    
    // Cleanup function
    return () => {
      if (operationsChartRef.current?.chartInstance) {
        operationsChartRef.current.chartInstance.destroy();
      }
      if (timeSeriesChartRef.current?.chartInstance) {
        timeSeriesChartRef.current.chartInstance.destroy();
      }
    };
  }, []);
  
  // Create operations chart
  useEffect(() => {
    if (!chartLibrary || !metrics || !operationsChartRef.current) return;
    
    // Destroy previous chart if exists
    if (operationsChartRef.current.chartInstance) {
      operationsChartRef.current.chartInstance.destroy();
    }
    
    const ctx = operationsChartRef.current.getContext('2d');
    
    // Create operations chart
    const chartInstance = new chartLibrary.Chart(ctx, {
      type: 'bar',
      data: {
        labels: ['Comparisons', 'Swaps', 'Reads', 'Writes'],
        datasets: [{
          label: 'Operation Counts',
          data: [
            metrics.comparisons || 0,
            metrics.swaps || 0,
            metrics.reads || 0,
            metrics.writes || 0
          ],
          backgroundColor: [
            'rgba(54, 162, 235, 0.7)', // Blue for comparisons
            'rgba(255, 99, 132, 0.7)',  // Red for swaps
            'rgba(75, 192, 192, 0.7)',  // Teal for reads
            'rgba(255, 159, 64, 0.7)'   // Orange for writes
          ],
          borderColor: [
            'rgba(54, 162, 235, 1)',
            'rgba(255, 99, 132, 1)',
            'rgba(75, 192, 192, 1)',
            'rgba(255, 159, 64, 1)'
          ],
          borderWidth: 1
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          title: {
            display: true,
            text: 'Operation Distribution'
          },
          tooltip: {
            callbacks: {
              label: function(context) {
                const value = context.raw;
                return `${context.label}: ${MetricsAnalysis.formatNumber(value)}`;
              }
            }
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            ticks: {
              callback: function(value) {
                return MetricsAnalysis.formatNumber(value);
              }
            }
          }
        }
      }
    });
    
    // Store chart instance for cleanup
    operationsChartRef.current.chartInstance = chartInstance;
    
  }, [chartLibrary, metrics]);
  
  // Create time series chart if history metrics are available
  useEffect(() => {
    if (!chartLibrary || !historyMetrics || !historyMetrics.length || !timeSeriesChartRef.current) {
      return;
    }
    
    // Destroy previous chart if exists
    if (timeSeriesChartRef.current.chartInstance) {
      timeSeriesChartRef.current.chartInstance.destroy();
    }
    
    const ctx = timeSeriesChartRef.current.getContext('2d');
    
    // Extract time series data
    const timePoints = historyMetrics.map((entry, index) => index);
    const comparisonSeries = historyMetrics.map(entry => entry.comparisons || 0);
    const swapSeries = historyMetrics.map(entry => entry.swaps || 0);
    
    // Create time series chart
    const chartInstance = new chartLibrary.Chart(ctx, {
      type: 'line',
      data: {
        labels: timePoints,
        datasets: [
          {
            label: 'Comparisons',
            data: comparisonSeries,
            borderColor: 'rgba(54, 162, 235, 1)',
            backgroundColor: 'rgba(54, 162, 235, 0.2)',
            tension: 0.4,
            fill: true
          },
          {
            label: 'Swaps',
            data: swapSeries,
            borderColor: 'rgba(255, 99, 132, 1)',
            backgroundColor: 'rgba(255, 99, 132, 0.2)',
            tension: 0.4,
            fill: true
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          title: {
            display: true,
            text: 'Operation Counts Over Time'
          },
          tooltip: {
            mode: 'index',
            intersect: false
          }
        },
        scales: {
          x: {
            title: {
              display: true,
              text: 'Algorithm Step'
            }
          },
          y: {
            beginAtZero: true,
            title: {
              display: true,
              text: 'Cumulative Operations'
            },
            ticks: {
              callback: function(value) {
                return MetricsAnalysis.formatNumber(value);
              }
            }
          }
        }
      }
    });
    
    // Store chart instance for cleanup
    timeSeriesChartRef.current.chartInstance = chartInstance;
    
  }, [chartLibrary, historyMetrics]);
  
  return (
    <div className="metrics-charts">
      <div className="chart-container operations-chart">
        <canvas ref={operationsChartRef} height="250"></canvas>
      </div>
      
      {historyMetrics && historyMetrics.length > 0 && (
        <div className="chart-container time-series-chart">
          <canvas ref={timeSeriesChartRef} height="250"></canvas>
        </div>
      )}
    </div>
  );
};

/**
 * Component that displays metrics for renderers like WebGL
 * @param {Object} props - Component properties
 * @param {Object} props.rendererMetrics - Renderer performance metrics
 * @returns {JSX.Element} Rendered component
 * @private
 */
const RendererMetrics = ({ rendererMetrics }) => {
  if (!rendererMetrics) return null;
  
  return (
    <div className="renderer-metrics">
      <h3 className="metrics-section-title">Rendering Performance</h3>
      
      <div className="metrics-grid">
        <div className="metric-card">
          <div className="metric-title">FPS</div>
          <div className="metric-value">{rendererMetrics.fps || 'N/A'}</div>
        </div>
        
        <div className="metric-card">
          <div className="metric-title">Render Time</div>
          <div className="metric-value">{MetricsAnalysis.formatTime(rendererMetrics.renderTime)}</div>
        </div>
        
        <div className="metric-card">
          <div className="metric-title">Elements</div>
          <div className="metric-value">{MetricsAnalysis.formatNumber(rendererMetrics.elementsRendered)}</div>
        </div>
        
        <div className="metric-card">
          <div className="metric-title">Buffer Updates</div>
          <div className="metric-value">{rendererMetrics.bufferUpdates || 'N/A'}</div>
        </div>
      </div>
    </div>
  );
};

/**
 * MetricsDisplay component renders comprehensive performance metrics
 * for sorting algorithm visualization and analysis
 * 
 * @param {Object} props - Component properties
 * @param {Object} props.metrics - Algorithm performance metrics
 * @param {Object} props.complexity - Algorithm complexity information
 * @param {Object} props.rendererMetrics - Renderer performance metrics
 * @param {number} props.arraySize - Size of array being processed
 * @param {Object[]} props.historyMetrics - Metrics history for time-series visualization
 * @param {boolean} [props.showCharts=true] - Whether to show charts
 * @param {boolean} [props.showDerived=true] - Whether to show derived metrics
 * @param {boolean} [props.showComplexity=true] - Whether to show complexity analysis
 * @param {boolean} [props.compact=false] - Whether to use compact display mode
 * @returns {JSX.Element} Rendered component
 */
const MetricsDisplay = ({
  metrics,
  complexity,
  rendererMetrics,
  arraySize,
  historyMetrics,
  showCharts = true,
  showDerived = true,
  showComplexity = true,
  compact = false
}) => {
  // Track whether metrics has been initialized
  const hasMetrics = metrics && Object.keys(metrics).length > 0;
  
  // Component state
  const [activeTab, setActiveTab] = useState('basic');
  
  return (
    <div className={`metrics-display ${compact ? 'compact' : ''}`}>
      <div className="metrics-header">
        <h2 className="metrics-title">Performance Metrics</h2>
        
        {!compact && (
          <div className="metrics-tabs">
            <button 
              className={`metrics-tab ${activeTab === 'basic' ? 'active' : ''}`}
              onClick={() => setActiveTab('basic')}
            >
              Basic Metrics
            </button>
            
            {showDerived && (
              <button 
                className={`metrics-tab ${activeTab === 'derived' ? 'active' : ''}`}
                onClick={() => setActiveTab('derived')}
                disabled={!hasMetrics}
              >
                Performance Analysis
              </button>
            )}
            
            {showComplexity && (
              <button 
                className={`metrics-tab ${activeTab === 'complexity' ? 'active' : ''}`}
                onClick={() => setActiveTab('complexity')}
                disabled={!hasMetrics || !complexity}
              >
                Complexity Analysis
              </button>
            )}
            
            {showCharts && (
              <button 
                className={`metrics-tab ${activeTab === 'charts' ? 'active' : ''}`}
                onClick={() => setActiveTab('charts')}
                disabled={!hasMetrics}
              >
                Charts
              </button>
            )}
            
            {rendererMetrics && (
              <button 
                className={`metrics-tab ${activeTab === 'renderer' ? 'active' : ''}`}
                onClick={() => setActiveTab('renderer')}
              >
                Renderer Performance
              </button>
            )}
          </div>
        )}
      </div>
      
      <div className="metrics-content">
        {!hasMetrics ? (
          <div className="metrics-placeholder">
            <p>Execute an algorithm to view performance metrics</p>
          </div>
        ) : (
          <>
            {/* Show all sections in compact mode, otherwise show only active tab */}
            {(compact || activeTab === 'basic') && (
              <BasicMetrics metrics={metrics} />
            )}
            
            {showDerived && (compact || activeTab === 'derived') && (
              <DerivedMetrics metrics={metrics} arraySize={arraySize} />
            )}
            
            {showComplexity && (compact || activeTab === 'complexity') && complexity && (
              <ComplexityAnalysis 
                complexity={complexity} 
                metrics={metrics} 
                arraySize={arraySize} 
              />
            )}
            
            {showCharts && (compact || activeTab === 'charts') && (
              <MetricsCharts 
                metrics={metrics} 
                historyMetrics={historyMetrics} 
              />
            )}
            
            {rendererMetrics && (compact || activeTab === 'renderer') && (
              <RendererMetrics rendererMetrics={rendererMetrics} />
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default MetricsDisplay;
