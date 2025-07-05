/**
 * Comprehensive Algorithm Registry
 * 
 * This module consolidates all algorithm implementations across categories,
 * providing a centralized access point for algorithm instantiation, metadata,
 * and configuration throughout the application.
 * 
 * The modular, category-based organization facilitates:
 * 1. Dynamic algorithm loading
 * 2. Category-based filtering and organization
 * 3. Consistent option configuration patterns
 * 4. Runtime algorithm analysis and comparison
 */

// Import algorithm categories with their implementations
import ComparisonAlgorithms, * as comparison from './comparison';
import DistributionAlgorithms, * as distribution from './distribution';
import NetworkAlgorithms, * as network from './network';
import SpecialAlgorithms, * as special from './special';
import SelectionAlgorithms, * as selection from './selection';

/**
 * Consolidated algorithm registry with categorical organization
 * for hierarchical access and navigation
 */
export const AlgorithmRegistry = {
    comparison: ComparisonAlgorithms,
    distribution: DistributionAlgorithms,
    network: NetworkAlgorithms,
    special: SpecialAlgorithms,
    selection: SelectionAlgorithms
};

/**
 * Flattened algorithm map for direct key-based access to algorithm classes
 * with metadata about their categorization
 */
export const AlgorithmMap = Object.entries(AlgorithmRegistry).reduce(
    (map, [category, algorithms]) => {
        Object.entries(algorithms).forEach(([type, collection]) => {
            Object.entries(collection).forEach(([key, Algorithm]) => {
                map[key] = { Algorithm, category, type };
            });
        });
        return map;
    },
    {}
);

/**
 * Factory function for algorithm instantiation with appropriate options
 * 
 * @param {string} algorithmKey - The key identifying the algorithm
 * @param {Object} customOptions - Custom options to override defaults
 * @returns {Object} - Instantiated algorithm with merged options
 * @throws {Error} - If algorithm not found in registry
 */
export const createAlgorithm = (algorithmKey, customOptions = {}) => {
    const entry = AlgorithmMap[algorithmKey];
    
    if (!entry) {
        throw new Error(`Algorithm "${algorithmKey}" not found in registry`);
    }
    
    // Get default options for this algorithm
    const defaultOptions = getDefaultOptions(algorithmKey, entry.category, entry.type);
    
    // Merge default options with custom options
    const options = { ...defaultOptions, ...customOptions };
    
    // Instantiate algorithm with merged options
    return new entry.Algorithm(options);
};

/**
 * Helper to determine appropriate default options for each algorithm
 * based on its category and specific characteristics
 * 
 * @param {string} algorithmKey - The algorithm identifier
 * @param {string} category - Algorithm category
 * @param {string} type - Algorithm type within category
 * @returns {Object} - Default options for the specified algorithm
 */
function getDefaultOptions(algorithmKey, category, type) {
    // Base options by category
    const categoryOptions = {
        comparison: { visualizeSwaps: true },
        distribution: { visualizeBuckets: true },
        network: { visualizeNetwork: true },
        special: { visualizeOperations: true },
        selection: { visualizePartitioning: true }
    };
    
    // Algorithm-specific optimizations
    const algorithmOptions = {
        'bubble-sort': { optimize: true, adaptive: true },
        'merge-sort': { adaptive: true, insertionThreshold: 10 },
        'quick-sort': { pivotStrategy: 'median-of-three', threeWayPartition: true },
        'heap-sort': { visualizeHeap: true, optimizeLeafChecks: true },
        'counting-sort': { optimizedCounting: true },
        'radix-sort': { radix: 10, msdFirst: false },
        'bucket-sort': { bucketSize: 'sqrt', adaptiveBuckets: true },
        'bitonic-sort': { parallelSimulation: true },
        'bogo-sort': { maxIterations: 1000, animateShuffles: true },
        'quick-select': { pivotStrategy: 'median-of-three' }
    };
    
    // Combine category defaults with algorithm-specific options
    return {
        ...categoryOptions[category],
        ...(algorithmOptions[algorithmKey] || {})
    };
}

// Export individual category exports for direct imports
export {
    comparison,
    distribution,
    network,
    special,
    selection
};

// Default export provides the complete registry
export default AlgorithmRegistry;