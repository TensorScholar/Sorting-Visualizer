# algorithms/sorting/merge_sort.py

from typing import List, Any, Dict, Optional, Callable, Tuple
from algorithms.base_algorithm import Algorithm
import time

class MergeSort(Algorithm):
    """
    Implementation of Merge Sort with multiple optimization strategies.
    
    Merge Sort is a divide-and-conquer algorithm that:
    1. Divides the input array into two halves
    2. Recursively sorts the two halves 
    3. Merges the sorted halves to produce the final sorted array
    
    This implementation includes several optimizations:
    - Bottom-up iterative implementation to avoid recursion overhead
    - Insertion sort for small subarrays
    - Adaptive optimizations for already-sorted runs
    - In-place merging option to reduce memory usage
    - Enhanced merge implementations with optimized comparisons
    
    Time Complexity:
    - Best:    O(n) with adaptive optimizations, otherwise O(n log n)
    - Average: O(n log n)
    - Worst:   O(n log n)
    
    Space Complexity:
    - O(n) for standard implementation
    - O(1) for in-place merge variant (at the cost of performance)
    """
    
    def __init__(self, options: Dict[str, Any] = None):
        """
        Initialize Merge Sort with options.
        
        Args:
            options: Dictionary of options including:
                - bottom_up: Use bottom-up (iterative) implementation
                - adaptive: Use adaptive optimization for partially sorted data
                - in_place_merge: Use in-place merging (trades speed for memory)
                - insertion_threshold: Switch to insertion sort for small arrays
                - optimize_merge: Use optimized merge implementation
        """
        super().__init__("Merge Sort", "comparison", options)
        
        # Default options
        self.options.update({
            "bottom_up": False,           # Use bottom-up (iterative) implementation
            "adaptive": True,             # Use adaptive optimization for partially sorted data
            "in_place_merge": False,      # Use in-place merging (trades speed for memory)
            "insertion_threshold": 10,    # Switch to insertion sort for small arrays
            "optimize_merge": True,       # Use optimized merge implementation
            "animation_delay": 0          # Delay between steps for visualization
        })
        
        # Override with provided options
        if options:
            self.options.update(options)

    def run(self, array: List[Any], options: Dict[str, Any]) -> List[Any]:
        """
        Execute Merge Sort on the provided array.
        
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
        
        # Choose implementation based on options
        if options["bottom_up"]:
            self.bottom_up_merge_sort(result, options)
        else:
            # Allocate auxiliary array once to avoid repeated allocations
            aux = [None] * n
            self.top_down_merge_sort(result, 0, n - 1, aux, options)
        
        self.set_phase("completed")
        return result

    def top_down_merge_sort(self, 
                           array: List[Any], 
                           low: int, 
                           high: int, 
                           aux: List[Any], 
                           options: Dict[str, Any]) -> None:
        """
        Top-down (recursive) Merge Sort implementation.
        
        Args:
            array: The array being sorted
            low: Start index
            high: End index
            aux: Auxiliary array for merging
            options: Runtime options
        """
        # Record current recursive call
        self.record_state(array, {
            "type": "recursive_call",
            "section": [low, high],
            "message": f"Sorting section from index {low} to {high}"
        })
        
        # Introduce delay for visualization if specified
        if options["animation_delay"] > 0:
            time.sleep(options["animation_delay"] / 1000)
        
        # Base case: Array of size 1 or smaller is already sorted
        if high <= low:
            return
        
        # Use insertion sort for small arrays
        if high - low < options["insertion_threshold"]:
            self.insertion_sort(array, low, high, options)
            return
        
        # Adaptive optimization: Check if the subarray is already sorted
        if options["adaptive"] and self._is_already_sorted(array, low, high):
            self.record_state(array, {
                "type": "optimization",
                "section": [low, high],
                "message": f"Subarray from {low} to {high} is already sorted"
            })
            return
        
        # Calculate middle point
        mid = low + (high - low) // 2
        
        # Record the division step
        self.record_state(array, {
            "type": "divide",
            "section": [low, high],
            "middle": mid,
            "message": f"Dividing at index {mid}"
        })
        
        # Recursively sort left and right halves
        self.top_down_merge_sort(array, low, mid, aux, options)
        self.top_down_merge_sort(array, mid + 1, high, aux, options)
        
        # Adaptive optimization: Skip merge if already in order
        if options["adaptive"] and self.compare(array[mid], array[mid + 1]) <= 0:
            self.record_state(array, {
                "type": "optimization",
                "section": [low, high],
                "message": f"Skipping merge because array[{mid}] <= array[{mid+1}]"
            })
            return
        
        # Merge the two sorted halves
        if options["in_place_merge"]:
            self.merge_in_place(array, low, mid, high, options)
        elif options["optimize_merge"]:
            self.merge_optimized(array, low, mid, high, aux, options)
        else:
            self.merge(array, low, mid, high, aux, options)

    def bottom_up_merge_sort(self, array: List[Any], options: Dict[str, Any]) -> None:
        """
        Bottom-up (iterative) Merge Sort implementation.
        Avoids recursion overhead by using nested loops.
        
        Args:
            array: The array to sort
            options: Runtime options
        """
        n = len(array)
        aux = [None] * n
        
        # Record initial state
        self.record_state(array, {
            "type": "initialization",
            "message": "Starting bottom-up merge sort"
        })
        
        # Start with subarrays of size 1, then 2, 4, 8, ...
        width = 1
        while width < n:
            # Record the current width
            self.record_state(array, {
                "type": "width_update",
                "width": width,
                "message": f"Merging subarrays of width {width}"
            })
            
            # Merge subarrays of size width
            i = 0
            while i < n - width:
                # Calculate boundaries for merge
                low = i
                mid = i + width - 1
                high = min(i + width * 2 - 1, n - 1)
                
                # Use insertion sort for small subarrays
                if high - low < options["insertion_threshold"]:
                    self.insertion_sort(array, low, high, options)
                else:
                    # Adaptive optimization: Skip merge if already in order
                    if not (options["adaptive"] and 
                           mid < high and 
                           self.compare(array[mid], array[mid + 1]) <= 0):
                        
                        # Record the merge step
                        self.record_state(array, {
                            "type": "merge_step",
                            "section": [low, high],
                            "middle": mid,
                            "message": f"Merging sections [{low}...{mid}] and [{mid+1}...{high}]"
                        })
                        
                        # Merge the two subarrays
                        if options["in_place_merge"]:
                            self.merge_in_place(array, low, mid, high, options)
                        elif options["optimize_merge"]:
                            self.merge_optimized(array, low, mid, high, aux, options)
                        else:
                            self.merge(array, low, mid, high, aux, options)
                
                # Move to next pair of subarrays
                i += width * 2
            
            # Double the width for next iteration
            width *= 2

    def merge(self, 
             array: List[Any], 
             low: int, 
             mid: int, 
             high: int, 
             aux: List[Any], 
             options: Dict[str, Any]) -> None:
        """
        Standard merge operation that combines two sorted subarrays.
        
        Args:
            array: The array containing subarrays to merge
            low: Start index
            mid: Middle index
            high: End index
            aux: Auxiliary array for merging
            options: Runtime options
        """
        # Record merge operation start
        self.record_state(array, {
            "type": "merge_begin",
            "section": [low, high],
            "middle": mid,
            "message": f"Beginning merge of [{low}...{mid}] and [{mid+1}...{high}]"
        })
        
        # Copy elements to auxiliary array
        for k in range(low, high + 1):
            aux[k] = self.read(array, k)
        
        # Merge back into original array
        i = low        # Index for left subarray
        j = mid + 1    # Index for right subarray
        
        for k in range(low, high + 1):
            # Introduce delay for visualization if specified
            if options["animation_delay"] > 0:
                time.sleep(options["animation_delay"] / 1000)
            
            # If left subarray is exhausted, take from right
            if i > mid:
                self.write(array, k, self.read(aux, j))
                j += 1
            # If right subarray is exhausted, take from left
            elif j > high:
                self.write(array, k, self.read(aux, i))
                i += 1
            # Compare elements and take smaller one
            elif self.compare(aux[i], aux[j]) <= 0:
                self.write(array, k, self.read(aux, i))
                i += 1
            else:
                self.write(array, k, self.read(aux, j))
                j += 1
            
            # Record merge progress periodically
            if (k - low) % 10 == 0 or k == high:
                self.record_state(array, {
                    "type": "merge_progress",
                    "section": [low, high],
                    "progress": (k - low) / (high - low),
                    "message": f"Merge progress: {int(((k - low) / (high - low)) * 100)}%"
                })
        
        # Record merge completion
        self.record_state(array, {
            "type": "merge_complete",
            "section": [low, high],
            "message": f"Completed merge for section [{low}...{high}]"
        })

    def merge_optimized(self, 
                       array: List[Any], 
                       low: int, 
                       mid: int, 
                       high: int, 
                       aux: List[Any], 
                       options: Dict[str, Any]) -> None:
        """
        Optimized merge operation with enhanced comparison logic.
        
        Args:
            array: The array containing subarrays to merge
            low: Start index
            mid: Middle index
            high: End index
            aux: Auxiliary array for merging
            options: Runtime options
        """
        # Copy left subarray
        for i in range(low, mid + 1):
            aux[i] = self.read(array, i)
        
        # Copy right subarray in reverse order to optimize end conditions
        for j in range(mid + 1, high + 1):
            aux[high - (j - (mid + 1))] = self.read(array, j)
        
        # Merge with dual-pointer approach from both ends
        i = low        # Start of left subarray
        j = high       # End of right subarray (reversed)
        
        for k in range(low, high + 1):
            # Introduce delay for visualization if specified
            if options["animation_delay"] > 0:
                time.sleep(options["animation_delay"] / 1000)
            
            # Compare elements (one from each end) and take smaller one
            if self.compare(aux[i], aux[j]) <= 0:
                self.write(array, k, self.read(aux, i))
                i += 1
            else:
                self.write(array, k, self.read(aux, j))
                j -= 1
            
            # Record merge progress periodically
            if (k - low) % 10 == 0 or k == high:
                self.record_state(array, {
                    "type": "merge_progress",
                    "section": [low, high],
                    "progress": (k - low) / (high - low),
                    "message": f"Merge progress: {int(((k - low) / (high - low)) * 100)}%"
                })

    def merge_in_place(self, 
                      array: List[Any], 
                      low: int, 
                      mid: int, 
                      high: int, 
                      options: Dict[str, Any]) -> None:
        """
        In-place merge operation that uses O(1) extra space.
        Note: This is slower than standard merge but uses less memory.
        
        Args:
            array: The array containing subarrays to merge
            low: Start index
            mid: Middle index
            high: End index
            options: Runtime options
        """
        # Record in-place merge start
        self.record_state(array, {
            "type": "merge_begin",
            "section": [low, high],
            "middle": mid,
            "message": f"Beginning in-place merge of [{low}...{mid}] and [{mid+1}...{high}]"
        })
        
        # Base case for already-sorted ranges
        if mid < high and self.compare(array[mid], array[mid + 1]) <= 0:
            return
        
        # In-place merge algorithm (insertion sort-like approach)
        first = low        # Current position in first subarray
        second = mid + 1   # Current position in second subarray
        
        # Process until one subarray is exhausted
        while first <= mid and second <= high:
            # Introduce delay for visualization if specified
            if options["animation_delay"] > 0:
                time.sleep(options["animation_delay"] / 1000)
            
            # If element is already in place, move to next element
            if self.compare(array[first], array[second]) <= 0:
                first += 1
            else:
                # Save the value to insert
                value = self.read(array, second)
                index = second
                
                # Shift elements to make room for insertion
                while index > first:
                    self.write(array, index, self.read(array, index - 1))
                    index -= 1
                
                # Insert the value in the correct position
                self.write(array, first, value)
                
                # Adjust pointers
                first += 1
                mid += 1
                second += 1
                
                # Record significant steps
                self.record_state(array, {
                    "type": "merge_in_place",
                    "section": [low, high],
                    "insertion": first - 1,
                    "value": value,
                    "message": f"Inserted element {value} at position {first - 1}"
                })
        
        # Record merge completion
        self.record_state(array, {
            "type": "merge_complete",
            "section": [low, high],
            "message": f"Completed in-place merge for section [{low}...{high}]"
        })

    def insertion_sort(self, 
                      array: List[Any], 
                      low: int, 
                      high: int, 
                      options: Dict[str, Any]) -> None:
        """
        Insertion sort for small subarrays.
        
        Args:
            array: The array to sort
            low: Start index
            high: End index
            options: Runtime options
        """
        self.record_state(array, {
            "type": "insertion_sort",
            "section": [low, high],
            "message": f"Using insertion sort for small section [{low}...{high}]"
        })
        
        for i in range(low + 1, high + 1):
            key = self.read(array, i)
            j = i - 1
            
            # Introduce delay for visualization if specified
            if options["animation_delay"] > 0:
                time.sleep(options["animation_delay"] / 1000)
            
            # Find insertion position
            while j >= low and self.compare(self.read(array, j), key) > 0:
                self.write(array, j + 1, self.read(array, j))
                j -= 1
            
            # Insert element at correct position
            if j + 1 != i:
                self.write(array, j + 1, key)
                
                # Record insertion operation
                self.record_state(array, {
                    "type": "insertion_step",
                    "section": [low, high],
                    "insertion": j + 1,
                    "value": key,
                    "message": f"Inserted {key} at position {j + 1}"
                })

    def _is_already_sorted(self, array: List[Any], low: int, high: int) -> bool:
        """
        Check if a subarray is already sorted.
        
        Args:
            array: The array to check
            low: Start index
            high: End index
            
        Returns:
            True if the subarray is sorted
        """
        for i in range(low + 1, high + 1):
            if self.compare(array[i - 1], array[i]) > 0:
                return False
        return True

    def get_complexity(self) -> Dict[str, Dict[str, str]]:
        """
        Get the time and space complexity of Merge Sort.
        
        Returns:
            Complexity information dictionary
        """
        return {
            "time": {
                "best": "O(n)" if self.options["adaptive"] else "O(n log n)",
                "average": "O(n log n)",
                "worst": "O(n log n)"
            },
            "space": {
                "best": "O(1)" if self.options["in_place_merge"] else "O(n)",
                "average": "O(1)" if self.options["in_place_merge"] else "O(n)",
                "worst": "O(1)" if self.options["in_place_merge"] else "O(n)"
            }
        }

    def is_stable(self) -> bool:
        """
        Whether Merge Sort is stable (preserves relative order of equal elements).
        
        Returns:
            True as Merge Sort is stable
        """
        return True

    def is_in_place(self) -> bool:
        """
        Whether Merge Sort is in-place (uses O(1) auxiliary space).
        
        Returns:
            True only if using in-place merge option
        """
        return self.options["in_place_merge"]
    
    def get_info(self) -> Dict[str, Any]:
        """
        Get detailed information about the algorithm.
        
        Returns:
            Dictionary with algorithm details
        """
        info = super().get_info()
        
        # Add merge sort specific information
        info.update({
            "optimization": {
                "bottom_up": self.options.get("bottom_up", False),
                "adaptive": self.options.get("adaptive", True),
                "in_place_merge": self.options.get("in_place_merge", False),
                "insertion_threshold": self.options.get("insertion_threshold", 10),
                "optimize_merge": self.options.get("optimize_merge", True)
            },
            "properties": {
                "comparison_based": True,
                "stable": True,
                "in_place": self.options.get("in_place_merge", False),
                "online": False,
                "divide_and_conquer": True
            },
            "suitable_for": {
                "small_arrays": False,
                "nearly_sorted_arrays": True,
                "large_arrays": True,
                "linked_lists": True,
                "external_sorting": True
            },
            "variations": [
                "Top-down (recursive) Merge Sort",
                "Bottom-up (iterative) Merge Sort",
                "Natural Merge Sort (adaptive)",
                "In-place Merge Sort",
                "Timsort (hybrid with insertion sort)",
                "Parallel Merge Sort"
            ],
            "advantages": [
                "Guaranteed O(n log n) performance in worst case",
                "Stable sorting (preserves order of equal elements)",
                "Well-suited for external sorting (disk-based)",
                "Parallelizes well for multi-threaded implementations",
                "Excellent for linked lists (requires only pointer manipulation)"
            ],
            "disadvantages": [
                "Requires O(n) extra space in standard implementation",
                "Not cache-efficient due to non-local memory references",
                "Slower than quicksort for in-memory sorting in many cases",
                "In-place variants have significantly worse performance"
            ]
        })
        
        return info


# Example usage
if __name__ == "__main__":
    # Create and run a simple test
    sorter = MergeSort({
        "bottom_up": False,
        "adaptive": True,
        "insertion_threshold": 10
    })
    
    test_array = [5, 3, 8, 4, 2, 9, 1, 7, 6]
    
    result = sorter.execute(test_array)
    print(f"Original: {test_array}")
    print(f"Sorted: {result}")
    print(f"Comparisons: {sorter.metrics['comparisons']}")
    print(f"Metrics: {sorter.metrics}")
    print(f"Steps: {len(sorter.history)}")
