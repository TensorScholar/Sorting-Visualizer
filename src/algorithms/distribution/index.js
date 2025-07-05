/**
 * Distribution-Based Sorting Algorithms Module Index
 * 
 * This module centralizes all distribution-based sorting algorithms,
 * which achieve improved time complexity by distributing elements into
 * buckets or utilizing numeric properties rather than comparisons.
 * 
 * These algorithms typically achieve O(n) time complexity for specific
 * input distributions, outperforming comparison-based algorithms in
 * constrained problem domains.
 */

// Import distribution sorting algorithm implementations
import BucketSort from './bucket';
import CountingSort from './counting';
import RadixSort from './radix';
import PigeonholeSort from './pigeonhole';

/**
 * Individual algorithm exports for direct imports
 */
export {
    BucketSort,
    CountingSort,
    RadixSort,
    PigeonholeSort
};

/**
 * Categorized distribution algorithm registry organized by
 * theoretical foundation and application characteristics
 */
export const DistributionAlgorithms = {
    counting: {
        'counting-sort': CountingSort,
        'pigeonhole-sort': PigeonholeSort
    },
    bucketing: {
        'bucket-sort': BucketSort
    },
    positional: {
        'radix-sort': RadixSort
    }
};

// Default export provides the complete distribution algorithm collection
export default DistributionAlgorithms;