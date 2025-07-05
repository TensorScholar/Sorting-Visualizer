# algorithms/sorting/cocktail_sort.py

from typing import List, Any, Dict, Optional, Callable, Tuple, Set
from algorithms.base_algorithm import Algorithm
import time

class CocktailShakerSort(Algorithm):
    """
    Implementation of Cocktail Shaker Sort (also known as Bidirectional Bubble Sort)
    with multiple optimization strategies.
    
    Cocktail Shaker Sort is a variation of Bubble Sort that sorts bidirectionally.
    It works by:
    1. Traversing the array from left to right, bubbling the largest element to the end
    2. Then traversing from right to left, bubbling the smallest element to the beginning
    3. Repeating until the array is sorted
    
    This bidirectional approach addresses the "turtle problem" in Bubble Sort,
    where small elements at the end of the array (turtles) take a long time to move
    to their correct positions.
    
    This implementation includes optimizations:
    - Early termination when no swaps occur in a complete bidirectional pass
    - Shrinking boundaries to avoid re-scanning already sorted portions
    - Detailed tracking of sorted regions
    - Optimized comparisons for improved performance
    
    Time Complexity:
    - Best:    O(n) when array is already sorted
    - Average: O(n²)
    - Worst:   O(n²) when array is in reverse order
    
    Space Complexity: O(1) - in-place sorting algorithm
    """
    
    def __init__(self, options: Dict[str, Any] = None):
        """
        Initialize Cocktail Shaker Sort with options.
        
        Args:
            options: Dictionary of options including:
                - early_termination: Stop when no swaps occur
                - shrink_boundaries: Shrink scan boundaries for sorted portions
                - optimized_comparisons: Use optimized comparison sequence
                - track_sorted_regions: Track and visualize sorted regions
        """
        super().__init__("Cocktail Shaker Sort", "comparison", options)
        
        # Default options
        self.options.update({
            "early_termination": True,        # Stop when no swaps occur
            "shrink_boundaries": True,        # Shrink scan boundaries for sorted portions
            "optimized_comparisons": True,    # Use optimized comparison sequence
            "track_sorted_regions": True,     # Track and visualize sorted regions
            "animation_delay": 0              # Delay between steps for visualization
        })
        
        # Override with provided options
        if options:
            self.options.update(options)

    def run(self, array: List[Any], options: Dict[str, Any]) -> List[Any]:
        """
        Execute Cocktail Shaker Sort on the provided array.
        
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
            
        self.set_phase("sorting")
        
        # Initialize boundaries
        start = 0
        end = n - 1
        
        # Track if any swaps were made in a pass
        swapped = True
        
        # Initialize sorted regions
        sorted_indices = set()
        
        # Main sorting loop
        while swapped and start < end:
            # Reset swapped flag for this pass
            swapped = False
            
            # Forward pass: bubble largest elements to the end
            self.record_state(result, {
                "type": "phase-start",
                "direction": "forward",
                "boundaries": [start, end],
                "message": f"Starting forward pass from index {start} to {end}"
            })
            
            for i in range(start, end):
                # Introduce delay for visualization if specified
                if options["animation_delay"] > 0:
                    time.sleep(options["animation_delay"] / 1000)
                
                # Compare adjacent elements
                if self.compare(result[i], result[i + 1]) > 0:
                    # Elements are out of order, swap them
                    self.swap(result, i, i + 1)
                    swapped = True
                    
                    # Record the swap
                    self.record_state(result, {
                        "type": "swap",
                        "indices": [i, i + 1],
                        "message": f"Swapped elements at indices {i} and {i + 1}"
                    })
            
            # If no swaps were made in the forward pass and early termination is enabled
            if not swapped and options["early_termination"]:
                self.record_state(result, {
                    "type": "optimization",
                    "message": "Early termination: No swaps in forward pass, array is sorted"
                })
                break
            
            # Mark the last element as sorted (largest element is now at the end)
            if options["track_sorted_regions"]:
                sorted_indices.add(end)
                self.record_state(result, {
                    "type": "sorted",
                    "indices": list(sorted_indices),
                    "message": f"Element at index {end} is now in its sorted position"
                })
            
            # Shrink the end boundary
            if options["shrink_boundaries"]:
                end -= 1
            
            # Reset swapped flag for backward pass
            swapped = False
            
            # Backward pass: bubble smallest elements to the beginning
            self.record_state(result, {
                "type": "phase-start",
                "direction": "backward",
                "boundaries": [start, end],
                "message": f"Starting backward pass from index {end} to {start}"
            })
            
            for i in range(end, start, -1):
                # Introduce delay for visualization if specified
                if options["animation_delay"] > 0:
                    time.sleep(options["animation_delay"] / 1000)
                
                # Compare adjacent elements
                if self.compare(result[i - 1], result[i]) > 0:
                    # Elements are out of order, swap them
                    self.swap(result, i - 1, i)
                    swapped = True
                    
                    # Record the swap
                    self.record_state(result, {
                        "type": "swap",
                        "indices": [i - 1, i],
                        "message": f"Swapped elements at indices {i - 1} and {i}"
                    })
            
            # Mark the first element as sorted (smallest element is now at the beginning)
            if options["track_sorted_regions"]:
                sorted_indices.add(start)
                self.record_state(result, {
                    "type": "sorted",
                    "indices": list(sorted_indices),
                    "message": f"Element at index {start} is now in its sorted position"
                })
            
            # Shrink the start boundary
            if options["shrink_boundaries"]:
                start += 1
        
        # Mark all elements as sorted
        self.record_state(result, {
            "type": "sorted",
            "indices": list(range(n)),
            "message": "All elements are now sorted"
        })
        
        self.set_phase("completed")
        return result

    def get_complexity(self) -> Dict[str, Dict[str, str]]:
        """
        Get the time and space complexity of Cocktail Shaker Sort.
        
        Returns:
            Complexity information dictionary
        """
        return {
            "time": {
                "best": "O(n)",
                "average": "O(n²)",
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
        Whether Cocktail Shaker Sort is stable (preserves relative order of equal elements).
        
        Returns:
            True as Cocktail Shaker Sort is stable
        """
        return True

    def is_in_place(self) -> bool:
        """
        Whether Cocktail Shaker Sort is in-place (uses O(1) auxiliary space).
        
        Returns:
            True as Cocktail Shaker Sort is in-place
        """
        return True
    
    def get_info(self) -> Dict[str, Any]:
        """
        Get detailed information about the algorithm.
        
        Returns:
            Dictionary with algorithm details
        """
        info = super().get_info()
        
        # Add cocktail sort specific information
        info.update({
            "optimization": {
                "early_termination": self.options.get("early_termination", True),
                "shrink_boundaries": self.options.get("shrink_boundaries", True),
                "optimized_comparisons": self.options.get("optimized_comparisons", True),
                "track_sorted_regions": self.options.get("track_sorted_regions", True)
            },
            "properties": {
                "comparison_based": True,
                "stable": True,
                "in_place": True,
                "online": True,
                "adaptive_to_presortedness": True,
                "bidirectional": True
            },
            "suitable_for": {
                "small_arrays": True,
                "nearly_sorted_arrays": True,
                "reverse_ordered_arrays": True,
                "large_arrays": False
            },
            "variants": [
                "Standard Bubble Sort",
                "Cocktail Shaker Sort (Bidirectional)",
                "Comb Sort (Bubble sort with diminishing gaps)",
                "Odd-Even Sort (Parallel variant)"
            ],
            "advantages": [
                "Simple implementation and easy to understand",
                "Performs better than standard Bubble Sort for certain inputs",
                "Addresses the 'turtle problem' of small values at the end of the array",
                "Stable sorting (preserves order of equal elements)",
                "In-place with O(1) auxiliary space"
            ],
            "disadvantages": [
                "Still O(n²) performance in average and worst cases",
                "Significantly slower than more advanced algorithms for large arrays",
                "Limited practical applications due to performance characteristics",
                "Not suitable for large datasets"
            ]
        })
        
        return info


# Example usage
if __name__ == "__main__":
    # Create and run a simple test
    sorter = CocktailShakerSort({
        "early_termination": True,
        "shrink_boundaries": True
    })
    
    test_array = [5, 3, 8, 4, 2, 9, 1, 7, 6]
    
    result = sorter.execute(test_array)
    print(f"Original: {test_array}")
    print(f"Sorted: {result}")
    print(f"Comparisons: {sorter.metrics['comparisons']}")
    print(f"Swaps: {sorter.metrics['swaps']}")
