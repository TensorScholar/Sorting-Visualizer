/**
 * Selection Algorithms Module Index
 * 
 * This module centralizes algorithms focused on selection problems
 * rather than complete sorting. These algorithms efficiently find the
 * k-th smallest/largest element or a subset of k elements without
 * performing a full sort.
 * 
 * Selection algorithms typically achieve better time complexity than
 * sorting for finding a single element or small subset of elements.
 */

// Import selection algorithm implementations
import QuickSelect from './quick-select';
import MedianOfMedians from './median-of-medians';

/**
 * Individual algorithm exports for direct imports
 */
export {
    QuickSelect,
    MedianOfMedians
};

/**
 * Categorized selection algorithm registry organized by
 * theoretical approach and performance characteristics
 */
export const SelectionAlgorithms = {
    partitioning: {
        'quick-select': QuickSelect
    },
    deterministic: {
        'median-of-medians': MedianOfMedians
    }
};

// Default export provides the complete selection algorithm collection
export default SelectionAlgorithms;