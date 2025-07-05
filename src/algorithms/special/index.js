/**
 * Special-Case Sorting Algorithms Module Index
 * 
 * This module centralizes sorting algorithms that have unique properties,
 * unusual time complexities, or specialized applications. These algorithms
 * often serve important educational purposes by highlighting algorithmic
 * concepts, historical significance, or edge cases in algorithm design.
 * 
 * While some of these algorithms may not be practical for general use,
 * they demonstrate important concepts in computational theory and
 * algorithm design.
 */

// Import special sorting algorithm implementations
import BogoSort from './bogo';
import PancakeSort from './pancake';

/**
 * Individual algorithm exports for direct imports
 */
export {
    BogoSort,
    PancakeSort
};

/**
 * Categorized special algorithm registry organized by
 * algorithmic characteristics and educational value
 */
export const SpecialAlgorithms = {
    stochastic: {
        'bogo-sort': BogoSort
    },
    prefix: {
        'pancake-sort': PancakeSort
    }
};

// Default export provides the complete special algorithm collection
export default SpecialAlgorithms;