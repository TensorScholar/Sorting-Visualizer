# algorithms/sorting/comb_sort.py

from typing import List, Any, Dict, Optional, Callable, Tuple
from algorithms.base_algorithm import Algorithm
import time
import math

class CombSort(Algorithm):
    """
    Implementation of Comb Sort algorithm with multiple optimization strategies.
    
    Comb Sort improves on Bubble Sort by using a gap sequence to eliminate
    turtles (small values near the end of the array) early in the sorting process.
    It works by:
    1. Starting with a large gap and comparing elements that are gap positions apart
    2. Gradually reducing the gap until it becomes 1 (at which point it is equivalent to Bubble Sort)
    3. Using a shrink factor (commonly 1.3) to reduce the gap in each iteration
    
    This implementation includes optimizations:
    - Early termination when no swaps occur in a complete pass
    - Multiple shrink factor options
    - Final phase optimization with bubble sort
    - Adaptive gap sequence adjustments
    
    Time Complexity:
    - Best:    O(n log n)
    - Average: O(n² / 2ᵏ) where k is number of increments
    - Worst:   O(n²)
    
    Space Complexity: O(1) - in-place sorting algorithm
    """
    
    def __init__(self, options: Dict[str, Any] = None):
        """
        Initialize Comb Sort with options.
        
        Args:
            options: Dictionary of options including:
                - early_termination: Stop when no swaps occur in a pass
                - shrink_factor: Factor by which to shrink the gap (common values: 1.3, 1.25)
                - bubble_sort_finalization: Use bubble sort for final phase
                - adaptive_gap_sequence: Adjust gap sequence based on array characteristics
        """
        super().__init__("Comb Sort", "comparison", options)
        
        # Default options
        self.options.update({
            "early_termination": True,         # Stop when no swaps occur
            "shrink_factor": 1.3,              # Commonly used shrink factor (Knuth factor: 1.3)
            "bubble_sort_finalization": True,  # Use bubble sort for final phase
            "adaptive_gap_sequence": True,     # Adjust gap sequence based on array characteristics
            "animation_delay": 0               # Delay between steps for visualization
        })
        
        # Override with provided options
        if options:
            self.options.update(options)

    def run(self, array: List[Any], options: Dict[str, Any]) -> List[Any]:
        """
        Execute Comb Sort on the provided array.
        
        Args:
            array: The array to sort
            options: Runtime options
            
        Returns:
            The sorted array
        """
        # Make a copy to avoid modifying the original
        result = array.copy()
        n = len(result)
        
        # Early return for small arrays
        if n <= 1:
            return result
            
        self.set_phase("gap-reduction")
        
        # Initialize gap to array length
        gap = n
        
        # Flag to check if array is sorted
        is_sorted = False
        
        # Main sorting loop
        while not is_sorted:
            # Update gap using shrink factor
            gap = math.floor(gap / options["shrink_factor"])
            
            # Ensure gap doesn't go below 1
            if gap < 1:
                gap = 1
            
            # Apply adaptive gap adjustment if enabled
            if options["adaptive_gap_sequence"] and gap > 1:
                # Adjust gap to avoid certain sequences that can lead to worst-case behavior
                if gap == 9 or gap == 10:
                    gap = 11
                if gap == 8:
                    gap = 7
            
            # Record current gap
            self.record_state(result, {
                "type": "gap-update",
                "gap": gap,
                "message": f"Updated gap to {gap}"
            })
            
            # Introduce delay for visualization if specified
            if options["animation_delay"] > 0:
                time.sleep(options["animation_delay"] / 1000)
            
            # Assume the array will be sorted after this pass
            is_sorted = True
            
            # Perform a single pass with current gap
            for i in range(n - gap):
                # Compare elements that are gap positions apart
                if self.compare(result[i], result[i + gap]) > 0:
                    # Elements are out of order, swap them
                    self.swap(result, i, i + gap)
                    
                    # Array might not be sorted yet
                    is_sorted = False
                    
                    # Record the swap
                    self.record_state(result, {
                        "type": "swap",
                        "indices": [i, i + gap],
                        "gap": gap,
                        "message": f"Swapped elements at indices {i} and {i + gap} with gap {gap}"
                    })
            
            # If gap is 1 and no swaps were made, the array is sorted
            if gap == 1 and is_sorted:
                self.record_state(result, {
                    "type": "sorted",
                    "message": "Array is sorted with no swaps in final pass"
                })
                break
            
            # Transition to final bubble sort phase if enabled
            if gap == 1 and options["bubble_sort_finalization"]:
                self.set_phase("bubble-finalization")
        
        # Apply bubble sort optimization for final phase if enabled
        if options["bubble_sort_finalization"] and not is_sorted:
            self.bubble_sort_finalization(result, options)
        
        self.set_phase("completed")
        return result

    def bubble_sort_finalization(self, array: List[Any], options: Dict[str, Any]) -> None:
        """
        Bubble sort final pass to ensure array is sorted.
        
        Args:
            array: Array to sort
            options: Runtime options
        """
        n = len(array)
        
        self.record_state(array, {
            "type": "phase-start",
            "message": "Starting bubble sort finalization phase"
        })
        
        # Traditional bubble sort with early termination
        swapped = True
        while swapped:
            swapped = False
            
            for i in range(1, n):
                # Introduce delay for visualization if specified
                if options["animation_delay"] > 0:
                    time.sleep(options["animation_delay"] / 1000)
                
                if self.compare(array[i - 1], array[i]) > 0:
                    self.swap(array, i - 1, i)
                    swapped = True
                    
                    # Record the swap
                    self.record_state(array, {
                        "type": "swap",
                        "indices": [i - 1, i],
                        "message": f"Bubble sort finalization: Swapped elements at indices {i - 1} and {i}"
                    })
            
            # Mark the last element as sorted after each pass
            n -= 1
        
        self.record_state(array, {
            "type": "sorted",
            "message": "Bubble sort finalization complete, array is sorted"
        })

    def get_complexity(self) -> Dict[str, Dict[str, str]]:
        """
        Get the time and space complexity of Comb Sort.
        
        Returns:
            Complexity information dictionary
        """
        return {
            "time": {
                "best": "O(n log n)",
                "average": "O(n² / 2ᵏ)",  # where k is number of increments
                "worst": "O(n²)"
            },
            "space": {
                "best": "O(1)",
                "average": "O(1)",
                "worst": "O(1)"
            }
        }

    def is_stable(self) -> bool:
        """
        Whether Comb Sort is stable (preserves relative order of equal elements).
        
        Returns:
            False as Comb Sort is not stable
        """
        return False

    def is_in_place(self) -> bool:
        """
        Whether Comb Sort is in-place (uses O(1) auxiliary space).
        
        Returns:
            True as Comb Sort is in-place
        """
        return True
    
    def get_info(self) -> Dict[str, Any]:
        """
        Get detailed information about the algorithm.
        
        Returns:
            Dictionary with algorithm details
        """
        info = super().get_info()
        
        # Add comb sort specific information
        info.update({
            "optimization": {
                "early_termination": self.options.get("early_termination", True),
                "shrink_factor": self.options.get("shrink_factor", 1.3),
                "bubble_sort_finalization": self.options.get("bubble_sort_finalization", True),
                "adaptive_gap_sequence": self.options.get("adaptive_gap_sequence", True)
            },
            "properties": {
                "comparison_based": True,
                "stable": False,
                "in_place": True,
                "online": False,
                "gap_sequence_based": True
            },
            "suitable_for": {
                "small_arrays": True,
                "nearly_sorted_arrays": True,
                "reverse_ordered_arrays": True,
                "large_arrays": False
            },
            "variants": [
                "Standard Comb Sort",
                "Comb Sort 11 (gap avoids multiples of 9, 10, or 11)",
                "Comb Sort with specific gap sequences",
                "Dobosiewicz Sort (variant with different gap reduction)"
            ],
            "advantages": [
                "Simple implementation, only slightly more complex than bubble sort",
                "Significantly outperforms bubble sort on average",
                "Addresses the 'turtle problem' effectively with gap sequence",
                "In-place with O(1) auxiliary space",
                "Does well on reversed or nearly-sorted data"
            ],
            "disadvantages": [
                "Generally outperformed by more advanced algorithms like quicksort",
                "Not stable (does not preserve order of equal elements)",
                "Still O(n²) in worst case",
                "Performance highly dependent on chosen shrink factor"
            ],
            "history": {
                "inventors": "Stephen Lacey and Richard Box",
                "year_invented": 1991,
                "original_paper": "A Variation of Shell's Sort",
                "evolution_notes": "Developed as an improvement over bubble sort to handle the 'turtle problem'"
            }
        })
        
        return info


# Example usage
if __name__ == "__main__":
    # Create and run a simple test
    sorter = CombSort({
        "shrink_factor": 1.3,
        "adaptive_gap_sequence": True
    })
    
    test_array = [5, 3, 8, 4, 2, 9, 1, 7, 6]
    
    result = sorter.execute(test_array)
    print(f"Original: {test_array}")
    print(f"Sorted: {result}")
    print(f"Comparisons: {sorter.metrics['comparisons']}")
    print(f"Swaps: {sorter.metrics['swaps']}")
