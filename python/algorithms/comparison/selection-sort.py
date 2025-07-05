# algorithms/sorting/selection_sort.py

from typing import List, Any, Dict, Optional, Callable, Tuple
from algorithms.base_algorithm import Algorithm
import time

class SelectionSort(Algorithm):
    """
    Implementation of Selection Sort with algorithmic optimizations and educational instrumentation.
    
    Selection Sort operates by dividing the input into a sorted and unsorted region,
    repeatedly selecting the smallest (or largest) element from the unsorted region
    and moving it to the sorted region. The algorithm maintains two subarrays:
    1. The subarray which is already sorted
    2. The remaining subarray which remains to be sorted
    
    This implementation includes multiple variants:
    - Standard Selection Sort (one-way traversal finding minimum elements)
    - Bidirectional Selection Sort (finding both minimum and maximum each pass)
    - Stable Selection Sort variant
    
    Time Complexity:
    - Best:    O(n²) - Even if array is sorted, all comparisons still occur
    - Average: O(n²)
    - Worst:   O(n²)
    
    Space Complexity: O(1) for standard implementation
    """
    
    def __init__(self, options: Dict[str, Any] = None):
        """
        Initialize Selection Sort with options.
        
        Args:
            options: Dictionary of options including:
                - bidirectional: Use bidirectional optimization (min+max each pass)
                - stable: Use stable variant (preserves order of equal elements)
                - visualize_regions: Visualize sorted and unsorted regions
                - enhanced_instrumentation: Use enhanced operation instrumentation
        """
        super().__init__("Selection Sort", "comparison", options)
        
        # Default options
        self.options.update({
            "bidirectional": False,          # Use bidirectional optimization
            "stable": False,                 # Use stable variant
            "visualize_regions": True,       # Visualize sorted and unsorted regions
            "enhanced_instrumentation": True, # Enhanced operation instrumentation
            "animation_delay": 0             # Delay between steps for visualization
        })
        
        # Override with provided options
        if options:
            self.options.update(options)

    def run(self, array: List[Any], options: Dict[str, Any]) -> List[Any]:
        """
        Execute Selection Sort on the provided array.
        
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
        
        # Select implementation based on options
        if options["bidirectional"]:
            self.bidirectional_selection_sort(result, n, options)
        elif options["stable"]:
            self.stable_selection_sort(result, n, options)
        else:
            self.standard_selection_sort(result, n, options)
        
        self.set_phase("completed")
        return result

    def standard_selection_sort(self, array: List[Any], n: int, options: Dict[str, Any]) -> None:
        """
        Standard Selection Sort algorithm implementation.
        This is the most common implementation, finding the minimum element
        in each pass and placing it at the beginning of the unsorted region.
        
        Args:
            array: Array to sort
            n: Array length
            options: Runtime options
        """
        # In each iteration, the smallest unsorted element is selected and placed
        # at the end of the sorted portion of the array
        for i in range(n - 1):
            # Find the minimum element in the unsorted portion
            min_index = i
            
            # Introduce delay for visualization if specified
            if options["animation_delay"] > 0:
                time.sleep(options["animation_delay"] / 1000)
            
            # Visualize the current boundary between sorted and unsorted regions
            if options["visualize_regions"]:
                self.record_state(array, {
                    "type": "region-boundary",
                    "sorted_region": list(range(i)),
                    "current_position": i,
                    "message": f"Elements 0 to {i-1} are sorted. Finding minimum in remaining elements."
                })
            
            # Search for minimum element in unsorted region
            for j in range(i + 1, n):
                # Record comparison operation
                if options["enhanced_instrumentation"]:
                    self.record_state(array, {
                        "type": "comparison",
                        "indices": [min_index, j],
                        "message": f"Comparing minimum so far ({array[min_index]}) with element at position {j} ({array[j]})"
                    })
                
                # Compare current minimum with element at j
                if self.compare(array[j], array[min_index]) < 0:
                    min_index = j
                    
                    # Record new minimum found
                    if options["enhanced_instrumentation"]:
                        self.record_state(array, {
                            "type": "new-minimum",
                            "index": j,
                            "value": array[j],
                            "message": f"New minimum {array[j]} found at position {j}"
                        })
            
            # If the minimum element isn't already at position i, swap it
            if min_index != i:
                self.swap(array, i, min_index)
                
                # Record swap operation
                self.record_state(array, {
                    "type": "swap",
                    "indices": [i, min_index],
                    "message": f"Placed minimum element {array[i]} at position {i}"
                })
            else:
                # Record that element is already in correct position
                self.record_state(array, {
                    "type": "already-positioned",
                    "index": i,
                    "message": f"Element {array[i]} is already the minimum and in correct position {i}"
                })
            
            # Mark the element as sorted
            self.record_state(array, {
                "type": "sorted",
                "indices": list(range(i + 1)),
                "message": f"Elements 0 to {i} are now sorted"
            })

    def bidirectional_selection_sort(self, array: List[Any], n: int, options: Dict[str, Any]) -> None:
        """
        Bidirectional Selection Sort implementation.
        This optimization finds both minimum and maximum elements in each pass,
        reducing the number of passes by approximately half.
        
        Args:
            array: Array to sort
            n: Array length
            options: Runtime options
        """
        left = 0
        right = n - 1
        
        # Continue until the pointers meet in the middle
        while left < right:
            # Initialize min and max indices
            min_index = left
            max_index = right
            
            # Introduce delay for visualization if specified
            if options["animation_delay"] > 0:
                time.sleep(options["animation_delay"] / 1000)
            
            # Visualize the current boundaries
            if options["visualize_regions"]:
                self.record_state(array, {
                    "type": "region-boundary",
                    "sorted_left_region": list(range(left)),
                    "sorted_right_region": list(range(right + 1, n)),
                    "unsorted_region": list(range(left, right + 1)),
                    "message": f"Elements 0 to {left-1} and {right+1} to {n-1} are sorted. Processing middle region."
                })
            
            # Find both minimum and maximum in a single pass
            for i in range(left, right + 1):
                # Compare with current minimum
                if self.compare(array[i], array[min_index]) < 0:
                    min_index = i
                    
                    if options["enhanced_instrumentation"]:
                        self.record_state(array, {
                            "type": "new-minimum",
                            "index": i,
                            "value": array[i],
                            "message": f"New minimum {array[i]} found at position {i}"
                        })
                # Compare with current maximum
                elif self.compare(array[i], array[max_index]) > 0:
                    max_index = i
                    
                    if options["enhanced_instrumentation"]:
                        self.record_state(array, {
                            "type": "new-maximum",
                            "index": i,
                            "value": array[i],
                            "message": f"New maximum {array[i]} found at position {i}"
                        })
            
            # Special case handling: if the minimum element is at the right boundary
            # or the maximum element is at the left boundary, there is potential 
            # for a value to be overwritten, so we need to handle these cases carefully
            
            # If the minimum element is at the right boundary
            if min_index == right:
                # If the maximum element is at the left boundary, and we move the 
                # minimum element to the left boundary first, then we'd lose track
                # of the maximum element's new position
                if max_index == left:
                    max_index = min_index  # Update maxIndex to the new position
            # If the maximum element is at the left boundary
            elif max_index == left:
                # If we move the maximum element to the right boundary first, 
                # and the minimum element is at the right boundary, then we'd lose
                # track of the minimum element's new position
                if min_index == right:
                    min_index = max_index  # Update minIndex to the new position
            
            # Place minimum element at the left boundary
            if min_index != left:
                self.swap(array, left, min_index)
                
                # If the maximum was at the position we just swapped with,
                # update its new position
                if max_index == left:
                    max_index = min_index
                
                self.record_state(array, {
                    "type": "swap",
                    "indices": [left, min_index],
                    "message": f"Placed minimum element {array[left]} at position {left}"
                })
            else:
                self.record_state(array, {
                    "type": "already-positioned",
                    "index": left,
                    "message": f"Element {array[left]} is already the minimum and in correct position {left}"
                })
            
            # Place maximum element at the right boundary
            if max_index != right:
                self.swap(array, right, max_index)
                
                self.record_state(array, {
                    "type": "swap",
                    "indices": [right, max_index],
                    "message": f"Placed maximum element {array[right]} at position {right}"
                })
            else:
                self.record_state(array, {
                    "type": "already-positioned",
                    "index": right,
                    "message": f"Element {array[right]} is already the maximum and in correct position {right}"
                })
            
            # Mark elements as sorted
            self.record_state(array, {
                "type": "sorted",
                "indices": list(range(left + 1)) + list(range(right, n)),
                "message": f"Elements 0 to {left} and {right} to {n-1} are now sorted"
            })
            
            # Move boundaries inward
            left += 1
            right -= 1

    def stable_selection_sort(self, array: List[Any], n: int, options: Dict[str, Any]) -> None:
        """
        Stable Selection Sort implementation.
        This variant preserves the relative order of equal elements,
        at the cost of increased time complexity.
        
        Args:
            array: Array to sort
            n: Array length
            options: Runtime options
        """
        # For each position in the array
        for i in range(n - 1):
            # Find the minimum element
            min_index = i
            
            # Introduce delay for visualization if specified
            if options["animation_delay"] > 0:
                time.sleep(options["animation_delay"] / 1000)
            
            # Visualize the current boundary
            if options["visualize_regions"]:
                self.record_state(array, {
                    "type": "region-boundary",
                    "sorted_region": list(range(i)),
                    "current_position": i,
                    "message": f"Elements 0 to {i-1} are sorted. Finding minimum in remaining elements."
                })
            
            # Find the minimum element
            for j in range(i + 1, n):
                if options["enhanced_instrumentation"]:
                    self.record_state(array, {
                        "type": "comparison",
                        "indices": [min_index, j],
                        "message": f"Comparing minimum so far ({array[min_index]}) with element at position {j} ({array[j]})"
                    })
                
                if self.compare(array[j], array[min_index]) < 0:
                    min_index = j
                    
                    if options["enhanced_instrumentation"]:
                        self.record_state(array, {
                            "type": "new-minimum",
                            "index": j,
                            "value": array[j],
                            "message": f"New minimum {array[j]} found at position {j}"
                        })
            
            # To ensure stability, we need to shift elements rather than swap
            if min_index != i:
                # Save the minimum value to insert at position i
                min_value = self.read(array, min_index)
                
                # Shift all elements between i and min_index one position to the right
                for j in range(min_index, i, -1):
                    self.write(array, j, self.read(array, j - 1))
                    
                    if options["enhanced_instrumentation"]:
                        self.record_state(array, {
                            "type": "shift",
                            "index": j,
                            "value": array[j],
                            "message": f"Shifted element from position {j-1} to position {j}"
                        })
                
                # Insert the minimum value at position i
                self.write(array, i, min_value)
                
                self.record_state(array, {
                    "type": "insert",
                    "index": i,
                    "value": min_value,
                    "message": f"Inserted minimum element {min_value} at position {i}"
                })
            else:
                self.record_state(array, {
                    "type": "already-positioned",
                    "index": i,
                    "message": f"Element {array[i]} is already the minimum and in correct position {i}"
                })
            
            # Mark the element as sorted
            self.record_state(array, {
                "type": "sorted",
                "indices": list(range(i + 1)),
                "message": f"Elements 0 to {i} are now sorted"
            })

    def get_complexity(self) -> Dict[str, Dict[str, str]]:
        """
        Get the time and space complexity of Selection Sort.
        
        Returns:
            Complexity information dictionary
        """
        return {
            "time": {
                "best": "O(n²)",
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
        Whether Selection Sort is stable (preserves relative order of equal elements).
        Standard implementation is not stable, but stable variant is available.
        
        Returns:
            True if using stable variant, otherwise False
        """
        return self.options["stable"]

    def is_in_place(self) -> bool:
        """
        Whether Selection Sort is in-place (uses O(1) auxiliary space).
        
        Returns:
            True as Selection Sort is in-place
        """
        return True  # Both variants use O(1) auxiliary space
    
    def get_info(self) -> Dict[str, Any]:
        """
        Get detailed information about the algorithm.
        
        Returns:
            Dictionary with algorithm details
        """
        info = super().get_info()
        
        # Add selection sort specific information
        info.update({
            "optimization": {
                "bidirectional": self.options.get("bidirectional", False),
                "stable": self.options.get("stable", False),
                "visualize_regions": self.options.get("visualize_regions", True),
                "enhanced_instrumentation": self.options.get("enhanced_instrumentation", True)
            },
            "properties": {
                "comparison_based": True,
                "stable": self.options.get("stable", False),
                "in_place": True,
                "online": False,
                "adaptive": False
            },
            "suitable_for": {
                "small_arrays": True,
                "nearly_sorted_arrays": False,
                "large_arrays": False,
                "limited_memory": True
            },
            "variants": [
                "Standard Selection Sort",
                "Bidirectional Selection Sort",
                "Stable Selection Sort (preserves order of equal elements)",
                "Heap Selection (Heap Sort)"
            ],
            "advantages": [
                "Simple implementation with minimal conceptual complexity",
                "In-place sorting with O(1) auxiliary space",
                "Minimal number of writes to the original array (O(n))",
                "Performs well for small arrays",
                "Performance is consistent regardless of input distribution"
            ],
            "disadvantages": [
                "O(n²) time complexity makes it inefficient for large arrays",
                "No early termination possibility for already-sorted arrays",
                "Standard implementation is not stable",
                "Doesn't utilize hardware caches efficiently"
            ],
            "analysis": {
                "comparisons": {
                    "formula": "n(n-1)/2",
                    "exact": True,
                    "explanation": "Always performs exactly this many comparisons regardless of input"
                },
                "swaps": {
                    "formula": "n-1 ≤ swaps ≤ n-1",
                    "exact": False,
                    "explanation": "Minimum when array is already sorted, maximum when each element needs to be swapped"
                },
                "writes": {
                    "bidirectional": "Approximately 2n writes in the worst case",
                    "standard": "Up to 3(n-1) writes in the worst case",
                    "stable": "Up to n² writes in the worst case"
                }
            }
        })
        
        return info


# Example usage
if __name__ == "__main__":
    # Create and run a simple test
    sorter = SelectionSort({
        "bidirectional": True,
        "stable": False,
        "enhanced_instrumentation": True
    })
    
    test_array = [5, 3, 8, 4, 2, 9, 1, 7, 6]
    
    result = sorter.execute(test_array)
    print(f"Original: {test_array}")
    print(f"Sorted: {result}")
    print(f"Comparisons: {sorter.metrics['comparisons']}")
    print(f"Swaps: {sorter.metrics['swaps']}")
