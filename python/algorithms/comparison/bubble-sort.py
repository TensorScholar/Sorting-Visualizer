# algorithms/sorting/bubble_sort.py

from typing import List, Any, Dict, Optional, Union, Callable
from algorithms.base_algorithm import Algorithm
import time

class BubbleSort(Algorithm):
    """
    Implementation of Bubble Sort with multiple optimization strategies.
    
    Bubble Sort is a simple comparison-based sorting algorithm that repeatedly
    steps through the list, compares adjacent elements, and swaps them if they
    are in the wrong order. The algorithm gets its name because smaller or larger
    elements "bubble" to the top of the list.
    
    This implementation includes several optimizations:
    1. Early termination - Stops when no swaps are performed in a pass
    2. Adaptive boundary - Tracks the last swap position to reduce comparisons
    3. Bidirectional variant (Cocktail Shaker Sort) - Alternates passes between
       forward and backward directions
    
    Time Complexity:
        - Best:    O(n) with early termination when array is already sorted
        - Average: O(n²)
        - Worst:   O(n²) when array is sorted in reverse order
    
    Space Complexity:
        - O(1) - truly in-place algorithm requiring only a constant amount of extra memory
    """
    
    def __init__(self, options: Dict[str, Any] = None):
        """
        Initialize Bubble Sort with options.
        
        Args:
            options: Dictionary of options including:
                - optimize: Use early termination optimization
                - adaptive: Track sorted boundary for optimization
                - bidirectional: Use bidirectional passes (Cocktail Shaker Sort)
        """
        super().__init__("Bubble Sort", "comparison", options)
        
        # Default options with carefully chosen values based on empirical performance data
        self.options.update({
            "optimize": True,        # Early termination when no swaps are performed
            "adaptive": True,        # Track boundary of sorted elements
            "bidirectional": False,  # Alternate between forward and reverse passes
            "animation_delay": 0     # Delay between steps for visualization
        })
        
        # Override with provided options
        if options:
            self.options.update(options)

    def run(self, array: List[Any], options: Dict[str, Any]) -> List[Any]:
        """
        Execute Bubble Sort on the provided array.
        
        Args:
            array: The array to sort
            options: Runtime options
            
        Returns:
            The sorted array
        """
        # Make a copy to avoid modifying the original
        result = array.copy()
        n = len(result)
        
        # Early return for edge cases
        if n <= 1:
            return result
            
        self.set_phase("sorting")
        
        # Choose algorithm variant based on options
        if options["bidirectional"]:
            self.cocktail_shaker_sort(result, options)
        else:
            self.standard_bubble_sort(result, options)
        
        self.set_phase("completed")
        return result

    def standard_bubble_sort(self, array: List[Any], options: Dict[str, Any]) -> None:
        """
        Standard Bubble Sort implementation with optimizations.
        
        Args:
            array: The array to sort (modified in place)
            options: Runtime options
        """
        n = len(array)
        
        # Track the boundary for optimization (all elements after this are known to be sorted)
        sorted_boundary = n
        
        # Main sorting loop - at most n-1 passes required
        for i in range(n - 1):
            # Flag to detect if any swaps were made in this pass
            swapped = False
            
            # Track the highest index where a swap occurred in this pass
            last_swap = 0
            
            # Record the beginning of a new pass
            self.record_state(array, {
                "type": "pass-start",
                "pass": i + 1,
                "message": f"Starting pass {i + 1}"
            })
            
            # One pass through the unsorted portion of the array
            for j in range(1, sorted_boundary):
                # Introduce delay for visualization if specified
                if options["animation_delay"] > 0:
                    time.sleep(options["animation_delay"] / 1000)
                
                # Compare adjacent elements
                comparison_result = self.compare(array[j - 1], array[j])
                
                # Record the comparison operation
                self.record_state(array, {
                    "type": "comparison",
                    "indices": [j - 1, j],
                    "result": comparison_result,
                    "message": f"Comparing elements at indices {j - 1} and {j}"
                })
                
                # If elements are out of order, swap them
                if comparison_result > 0:
                    self.swap(array, j - 1, j)
                    swapped = True
                    last_swap = j
                    
                    # Record the swap operation
                    self.record_state(array, {
                        "type": "swap",
                        "indices": [j - 1, j],
                        "message": f"Swapped elements at indices {j - 1} and {j}"
                    })
            
            # Early termination optimization: If no swaps were made, the array is sorted
            if options["optimize"] and not swapped:
                self.record_state(array, {
                    "type": "optimization",
                    "message": f"Early termination: No swaps in pass {i + 1}, array is sorted"
                })
                break
            
            # Adaptive boundary optimization: Update the sorted boundary
            if options["adaptive"]:
                sorted_boundary = last_swap or sorted_boundary
                
                if sorted_boundary < n:
                    # Mark elements beyond the boundary as sorted
                    self.record_state(array, {
                        "type": "sorted",
                        "indices": list(range(sorted_boundary, n)),
                        "message": f"Elements from index {sorted_boundary} to {n - 1} are now sorted"
                    })
            else:
                # When not using adaptive optimization, at least the last element is guaranteed to be in its final position
                self.record_state(array, {
                    "type": "sorted",
                    "indices": [n - i - 1],
                    "message": f"Element at index {n - i - 1} is now in its correct position"
                })
            
            # Record completion of the pass
            self.record_state(array, {
                "type": "pass-end",
                "pass": i + 1,
                "message": f"Completed pass {i + 1}"
            })

    def cocktail_shaker_sort(self, array: List[Any], options: Dict[str, Any]) -> None:
        """
        Bidirectional Bubble Sort (Cocktail Shaker Sort) implementation.
        Performs passes alternating between forward and backward directions.
        
        Args:
            array: The array to sort (modified in place)
            options: Runtime options
        """
        n = len(array)
        
        # Initialize boundaries for the unsorted portion
        start = 0
        end = n - 1
        
        # Flag to detect if any swaps were made in either pass
        swapped = True
        
        # Main sorting loop
        pass_num = 0
        
        while swapped and start < end:
            swapped = False
            pass_num += 1
            
            # Record the beginning of a forward pass
            self.record_state(array, {
                "type": "pass-start",
                "direction": "forward",
                "pass": pass_num,
                "message": f"Starting forward pass {pass_num}"
            })
            
            # Forward pass - bubble the largest element to the end
            for i in range(start, end):
                # Introduce delay for visualization if specified
                if options["animation_delay"] > 0:
                    time.sleep(options["animation_delay"] / 1000)
                
                # Compare adjacent elements
                comparison_result = self.compare(array[i], array[i + 1])
                
                # Record the comparison operation
                self.record_state(array, {
                    "type": "comparison",
                    "indices": [i, i + 1],
                    "result": comparison_result,
                    "message": f"Comparing elements at indices {i} and {i + 1}"
                })
                
                # If elements are out of order, swap them
                if comparison_result > 0:
                    self.swap(array, i, i + 1)
                    swapped = True
                    
                    # Record the swap operation
                    self.record_state(array, {
                        "type": "swap",
                        "indices": [i, i + 1],
                        "message": f"Swapped elements at indices {i} and {i + 1}"
                    })
            
            # Mark the end element as sorted
            self.record_state(array, {
                "type": "sorted",
                "indices": [end],
                "message": f"Element at index {end} is now in its correct position"
            })
            
            # Record completion of the forward pass
            self.record_state(array, {
                "type": "pass-end",
                "direction": "forward",
                "pass": pass_num,
                "message": f"Completed forward pass {pass_num}"
            })
            
            # Decrement end boundary as the largest element is now in place
            end -= 1
            
            # Early termination optimization: If no swaps were made, the array is sorted
            if options["optimize"] and not swapped:
                self.record_state(array, {
                    "type": "optimization",
                    "message": f"Early termination: No swaps in forward pass {pass_num}, array is sorted"
                })
                break
            
            swapped = False
            
            # Record the beginning of a backward pass
            self.record_state(array, {
                "type": "pass-start",
                "direction": "backward",
                "pass": pass_num,
                "message": f"Starting backward pass {pass_num}"
            })
            
            # Backward pass - bubble the smallest element to the beginning
            for i in range(end, start, -1):
                # Introduce delay for visualization if specified
                if options["animation_delay"] > 0:
                    time.sleep(options["animation_delay"] / 1000)
                
                # Compare adjacent elements
                comparison_result = self.compare(array[i - 1], array[i])
                
                # Record the comparison operation
                self.record_state(array, {
                    "type": "comparison",
                    "indices": [i - 1, i],
                    "result": comparison_result,
                    "message": f"Comparing elements at indices {i - 1} and {i}"
                })
                
                # If elements are out of order, swap them
                if comparison_result > 0:
                    self.swap(array, i - 1, i)
                    swapped = True
                    
                    # Record the swap operation
                    self.record_state(array, {
                        "type": "swap",
                        "indices": [i - 1, i],
                        "message": f"Swapped elements at indices {i - 1} and {i}"
                    })
            
            # Mark the start element as sorted
            self.record_state(array, {
                "type": "sorted",
                "indices": [start],
                "message": f"Element at index {start} is now in its correct position"
            })
            
            # Record completion of the backward pass
            self.record_state(array, {
                "type": "pass-end",
                "direction": "backward",
                "pass": pass_num,
                "message": f"Completed backward pass {pass_num}"
            })
            
            # Increment start boundary as the smallest element is now in place
            start += 1
            
            # Early termination optimization: If no swaps were made, the array is sorted
            if options["optimize"] and not swapped:
                self.record_state(array, {
                    "type": "optimization",
                    "message": f"Early termination: No swaps in backward pass {pass_num}, array is sorted"
                })
                break

    def get_complexity(self) -> Dict[str, Dict[str, str]]:
        """
        Get the time and space complexity of Bubble Sort.
        
        Returns:
            Complexity information dictionary
        """
        return {
            "time": {
                "best": "O(n)" if self.options["optimize"] else "O(n²)",
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
        Whether Bubble Sort is stable (preserves relative order of equal elements).
        
        Returns:
            True as Bubble Sort is stable
        """
        return True

    def is_in_place(self) -> bool:
        """
        Whether Bubble Sort is in-place (uses O(1) auxiliary space).
        
        Returns:
            True as Bubble Sort is in-place
        """
        return True
    
    def get_info(self) -> Dict[str, Any]:
        """
        Get detailed information about the algorithm.
        
        Returns:
            Dictionary with algorithm details
        """
        info = super().get_info()
        
        # Add bubble sort specific information
        info.update({
            "optimization": {
                "early_termination": self.options.get("optimize", True),
                "adaptive_boundary": self.options.get("adaptive", True),
                "bidirectional": self.options.get("bidirectional", False)
            },
            "properties": {
                "comparison_based": True,
                "stable": True,
                "in_place": True,
                "online": True,
                "adaptive": self.options.get("optimize", True) or self.options.get("adaptive", True)
            },
            "suitable_for": {
                "small_arrays": True,
                "nearly_sorted_arrays": self.options.get("optimize", True),
                "large_arrays": False,
                "educational_purposes": True
            },
            "variants": [
                "Standard Bubble Sort",
                "Optimized Bubble Sort (early termination)",
                "Adaptive Bubble Sort (dynamic boundary)",
                "Cocktail Shaker Sort (bidirectional)",
                "Odd-Even Sort (parallel variant)"
            ],
            "advantages": [
                "Simple implementation and concept",
                "Minimal space complexity (O(1))",
                "Stable sorting (preserves order of equal elements)",
                "Adaptive when optimized (performs better on partially sorted arrays)",
                "Online algorithm (can sort as elements arrive)"
            ],
            "disadvantages": [
                "Poor time complexity (O(n²)) makes it impractical for large arrays",
                "Performs significantly more swaps than other algorithms",
                "Generally outperformed by insertion sort for small arrays",
                "Poor cache performance due to many swap operations"
            ],
            "performance": {
                "best_case": "Already sorted arrays (with early termination)",
                "worst_case": "Arrays sorted in reverse order",
                "average_case": "Random arrays"
            }
        })
        
        return info


# Example usage and testing
if __name__ == "__main__":
    # Create and run basic test cases
    sorter = BubbleSort({"optimize": True, "adaptive": True, "bidirectional": False})
    
    # Test case 1: Random array
    test_array = [5, 3, 8, 4, 2, 9, 1, 7, 6]
    result = sorter.execute(test_array)
    
    print(f"Original: {test_array}")
    print(f"Sorted: {result}")
    print(f"Metrics: {sorter.metrics}")
    
    # Test case 2: Already sorted array
    test_array_sorted = [1, 2, 3, 4, 5, 6, 7, 8, 9]
    result_sorted = sorter.execute(test_array_sorted)
    
    print(f"\nAlready sorted:")
    print(f"Original: {test_array_sorted}")
    print(f"Sorted: {result_sorted}")
    print(f"Metrics: {sorter.metrics}")
    
    # Test case 3: Reverse sorted array
    test_array_reverse = [9, 8, 7, 6, 5, 4, 3, 2, 1]
    result_reverse = sorter.execute(test_array_reverse)
    
    print(f"\nReverse sorted:")
    print(f"Original: {test_array_reverse}")
    print(f"Sorted: {result_reverse}")
    print(f"Metrics: {sorter.metrics}")
