# algorithms/sorting/gnome_sort.py

from typing import List, Any, Dict, Optional, Callable, Tuple
from algorithms.base_algorithm import Algorithm
import time

class GnomeSort(Algorithm):
    """
    Implementation of Gnome Sort algorithm with optimization strategies.
    
    Gnome Sort (also called Stupid Sort) is a simple comparison-based sorting algorithm
    that works by moving an element to its proper position in the sorted portion of the array
    using a single position variable, without nested loops.
    
    The basic algorithm concept:
    1. Start at the first element
    2. If the current element is greater than or equal to the previous one, move forward one step
    3. If the current element is less than the previous one, swap them and move backward one step
    4. If at the start of the array, move forward one step
    5. If at the end of the array, the array is sorted
    
    This implementation includes optimizations:
    - Optimized movement (remembering the position to continue from)
    - Early termination when the array is already sorted
    - Enhanced visualization of the algorithm's progress
    
    Time Complexity:
    - Best:    O(n) when array is already sorted
    - Average: O(n²)
    - Worst:   O(n²)
    
    Space Complexity:
    - O(1) (in-place sorting algorithm)
    """
    
    def __init__(self, options: Dict[str, Any] = None):
        """
        Initialize Gnome Sort with options.
        
        Args:
            options: Dictionary of options including:
                - optimized_movement: Use optimized movement strategy
                - detect_sorted: Detect if array is already sorted
                - visualize_position: Visualize current position pointer
                - animation_delay: Delay between steps for visualization
        """
        super().__init__("Gnome Sort", "comparison", options)
        
        # Default options
        self.options.update({
            "optimized_movement": True,   # Use optimized movement strategy
            "detect_sorted": True,        # Detect if array is already sorted
            "visualize_position": True,   # Visualize current position pointer
            "animation_delay": 0          # Delay between steps for visualization
        })
        
        # Override with provided options
        if options:
            self.options.update(options)

    def run(self, array: List[Any], options: Dict[str, Any]) -> List[Any]:
        """
        Execute Gnome Sort on the provided array.
        
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
        
        # Check if already sorted (optimization)
        if options["detect_sorted"] and self._is_sorted(result):
            self.record_state(result, {
                "type": "optimization",
                "message": "Array is already sorted, no operations needed"
            })
            
            self.record_state(result, {
                "type": "sorted",
                "indices": list(range(n)),
                "message": "Array is fully sorted"
            })
            
            self.set_phase("completed")
            return result
        
        # Record initial state
        self.record_state(result, {
            "type": "initial",
            "position": 0,
            "message": "Starting Gnome Sort"
        })
        
        # Standard Gnome Sort
        if not options["optimized_movement"]:
            position = 0
            
            while position < n:
                # Introduce delay for visualization if specified
                if options["animation_delay"] > 0:
                    time.sleep(options["animation_delay"] / 1000)
                
                # Record current position
                if options["visualize_position"]:
                    self.record_state(result, {
                        "type": "position",
                        "position": position,
                        "message": f"Current position: {position}"
                    })
                
                # At the start of array or in correct order
                if position == 0 or self.compare(result[position - 1], result[position]) <= 0:
                    # Move forward
                    position += 1
                    
                    # Record the forward movement
                    self.record_state(result, {
                        "type": "forward",
                        "position": position,
                        "message": f"Moving forward to position {position}"
                    })
                else:
                    # Swap and move backward
                    self.swap(result, position, position - 1)
                    position -= 1
                    
                    # Record the swap and backward movement
                    self.record_state(result, {
                        "type": "backward",
                        "position": position,
                        "indices": [position, position + 1],
                        "message": f"Swapped elements and moved backward to position {position}"
                    })
        # Optimized Gnome Sort
        else:
            position = 0
            
            while position < n:
                # Introduce delay for visualization if specified
                if options["animation_delay"] > 0:
                    time.sleep(options["animation_delay"] / 1000)
                
                # Record current position
                if options["visualize_position"]:
                    self.record_state(result, {
                        "type": "position",
                        "position": position,
                        "message": f"Current position: {position}"
                    })
                
                if position == 0:
                    # At the start, always move forward
                    position += 1
                    
                    # Record the forward movement
                    self.record_state(result, {
                        "type": "forward",
                        "position": position,
                        "message": f"At the start of array, moving forward to position {position}"
                    })
                elif self.compare(result[position - 1], result[position]) <= 0:
                    # Elements are in order, move forward
                    position += 1
                    
                    # Record the forward movement
                    self.record_state(result, {
                        "type": "forward",
                        "position": position,
                        "message": f"Elements in order, moving forward to position {position}"
                    })
                else:
                    # Swap and move backward
                    self.swap(result, position, position - 1)
                    
                    # Record the swap
                    self.record_state(result, {
                        "type": "swap",
                        "position": position - 1,
                        "indices": [position, position - 1],
                        "message": f"Swapped elements at positions {position-1} and {position}"
                    })
                    
                    # Move backward
                    position -= 1
                    
                    # Record the backward movement
                    self.record_state(result, {
                        "type": "backward",
                        "position": position,
                        "message": f"Moving backward to position {position}"
                    })
        
        # Mark array as fully sorted
        self.record_state(result, {
            "type": "sorted",
            "indices": list(range(n)),
            "message": "Array is fully sorted"
        })
        
        self.set_phase("completed")
        return result

    def _is_sorted(self, array: List[Any]) -> bool:
        """
        Check if an array is already sorted.
        
        Args:
            array: The array to check
        
        Returns:
            True if the array is sorted
        """
        for i in range(1, len(array)):
            if self.compare(array[i - 1], array[i]) > 0:
                return False
        return True

    def get_complexity(self) -> Dict[str, Dict[str, str]]:
        """
        Get the time and space complexity of Gnome Sort.
        
        Returns:
            Complexity information dictionary
        """
        return {
            "time": {
                "best": "O(n)",  # When array is already sorted
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
        Whether Gnome Sort is stable (preserves relative order of equal elements).
        
        Returns:
            True as Gnome Sort is stable
        """
        return True

    def is_in_place(self) -> bool:
        """
        Whether Gnome Sort is in-place (uses O(1) auxiliary space).
        
        Returns:
            True as Gnome Sort is in-place
        """
        return True
    
    def get_info(self) -> Dict[str, Any]:
        """
        Get detailed information about the algorithm.
        
        Returns:
            Dictionary with algorithm details
        """
        info = super().get_info()
        
        # Add algorithm-specific information
        info.update({
            "optimization": {
                "optimized_movement": self.options.get("optimized_movement", True),
                "detect_sorted": self.options.get("detect_sorted", True),
                "visualize_position": self.options.get("visualize_position", True)
            },
            "properties": {
                "comparison_based": True,
                "stable": True,
                "in_place": True,
                "online": False,
                "adaptivity": "O(n)"  # Performs optimally on already sorted arrays
            },
            "suitable_for": {
                "small_arrays": True,
                "large_arrays": False,
                "nearly_sorted_arrays": True,
                "educational_context": True
            },
            "advantages": [
                "Simple to implement with minimal code",
                "More efficient than bubble sort in some cases",
                "Stable (preserves relative order of equal elements)",
                "In-place (requires constant extra space)",
                "Performs well on nearly sorted arrays"
            ],
            "disadvantages": [
                "O(n²) complexity makes it inefficient for large arrays",
                "Generally slower than insertion sort despite similar complexity",
                "No mechanism to avoid unnecessary comparisons",
                "Not suitable for production use with large datasets"
            ],
            "origins": {
                "name": "Named \"Gnome Sort\" by Dick Grune, after the Dutch garden gnome who organizes flower pots",
                "year": "2000",
                "inventors": ["Hamid Sarbazi-Azad"],
                "alternate_names": ["Stupid Sort"]
            },
            "educational_insights": [
                "Demonstrates how to create a sorting algorithm with a single position variable",
                "Shows the fundamental concept of moving elements to their correct position",
                "Illustrates the trade-off between code simplicity and performance",
                "Provides insight into how different optimization strategies affect performance"
            ]
        })
        
        return info


# Example usage
if __name__ == "__main__":
    # Create and run a simple test
    sorter = GnomeSort({
        "optimized_movement": True,
        "detect_sorted": True,
        "visualize_position": True
    })
    
    test_array = [5, 3, 8, 4, 2, 9, 1, 7, 6]
    
    result = sorter.execute(test_array)
    print(f"Original: {test_array}")
    print(f"Sorted: {result}")
    print(f"Comparisons: {sorter.metrics['comparisons']}")
    print(f"Swaps: {sorter.metrics['swaps']}")
