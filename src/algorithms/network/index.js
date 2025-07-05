/**
 * Network/Parallel Sorting Algorithms Module Index
 * 
 * This module centralizes sorting algorithms designed around network
 * or parallel computation models. These algorithms are particularly
 * valuable for educational purposes in understanding parallel algorithms
 * and sorting networks.
 * 
 * These algorithms have distinctive visualization properties that illustrate
 * the concept of parallel execution even when running in a sequential environment.
 */

// Import network sorting algorithm implementations
import BitonicSort from './bitonic';
import OddEvenMergeSort from './odd-even-merge';

/**
 * Individual algorithm exports for direct imports
 */
export {
    BitonicSort,
    OddEvenMergeSort
};

/**
 * Categorized network algorithm registry organized by
 * network topology and execution characteristics
 */
export const NetworkAlgorithms = {
    complete: {
        'bitonic-sort': BitonicSort
    },
    merge: {
        'odd-even-merge-sort': OddEvenMergeSort
    }
};

// Default export provides the complete network algorithm collection
export default NetworkAlgorithms;