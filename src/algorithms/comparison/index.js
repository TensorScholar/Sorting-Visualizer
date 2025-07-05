/**
 * Comparison-Based Sorting Algorithms Module Index
 * 
 * This module provides a centralized export interface for all comparison-based
 * sorting algorithm implementations, facilitating clean imports throughout the application.
 * 
 * Each algorithm is implemented following rigorous software engineering principles,
 * with comprehensive instrumentation, theoretical analysis, and educational annotations.
 */

// Core comparison sorting algorithms
import BubbleSort from './bubble';
import MergeSort from './merge';
import QuickSort from './quick';
import HeapSort from './heap';
import InsertionSort from './insertion';
import SelectionSort from './selection';
import ShellSort from './shell';

// Advanced variants and hybrid algorithms 
import CocktailShakerSort from './cocktail-shaker';
import CombSort from './comb';
import CycleSort from './cycle';
import GnomeSort from './gnome';
import BinaryInsertionSort from './binary-insertion';
import IntroSort from './intro';
import TimSort from './tim';
import OddEvenSort from './odd-even';

/**
 * Individual algorithm exports for direct imports
 */
export {
    BubbleSort,
    MergeSort,
    QuickSort,
    HeapSort,
    InsertionSort,
    SelectionSort,
    ShellSort,
    CocktailShakerSort,
    CombSort,
    CycleSort,
    GnomeSort,
    BinaryInsertionSort,
    IntroSort,
    TimSort,
    OddEvenSort
};

/**
 * Categorized algorithm registry for dynamic algorithm selection
 * and organizational purposes. Algorithms are grouped by their
 * conceptual similarities and performance characteristics.
 */
export const ComparisonAlgorithms = {
    basic: {
        'bubble-sort': BubbleSort,
        'insertion-sort': InsertionSort,
        'selection-sort': SelectionSort
    },
    efficient: {
        'merge-sort': MergeSort,
        'quick-sort': QuickSort,
        'heap-sort': HeapSort,
        'shell-sort': ShellSort
    },
    hybrid: {
        'intro-sort': IntroSort,
        'tim-sort': TimSort
    },
    specialized: {
        'cocktail-shaker-sort': CocktailShakerSort,
        'comb-sort': CombSort,
        'cycle-sort': CycleSort,
        'gnome-sort': GnomeSort,
        'binary-insertion-sort': BinaryInsertionSort,
        'odd-even-sort': OddEvenSort
    }
};

// Default export provides the complete algorithm collection
export default ComparisonAlgorithms;