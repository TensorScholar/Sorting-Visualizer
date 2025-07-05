# algorithms/sorting/intro_sort.py

from typing import List, Any, Dict, Optional, Callable, Tuple, TypeVar
from algorithms.base_algorithm import Algorithm
import time
import math
import random

T = TypeVar('T')  # Type variable for generic types

class IntroSort(Algorithm):
    """
    Implementation of Intro Sort (Introspective Sort) - a hybrid sorting algorithm
    that combines Quick Sort, Heap Sort, and Insertion Sort.
    
    Intro Sort was designed by David R. Musser in 1997 to provide a practical
    sorting algorithm with both optimal asymptotic runtime complexity and
    excellent practical performance. It is used in the C++ Standard Library (std::sort).
    
    The algorithm works by:
    1. Starting with Quick Sort for good average-case performance
    2. Switching to Heap Sort when recursion depth exceeds a threshold to avoid
       Quick Sort's worst-case behavior (determined by 2*log₂(n))
    3. Using Insertion Sort for small sub-arrays for improved performance
    
    This provides an elegant solution that combines the strengths of multiple algorithms:
    - Quick Sort's excellent average-case performance and cache efficiency
    - Heap Sort's guaranteed O(n log n) worst-case complexity
    - Insertion Sort's efficiency for small arrays
    
    Time Complexity:
    - Best:    O(n log n)
    - Average: O(n log n)
    - Worst:   O(n log n)
    
    Space Complexity:
    - O(log n) due to recursion stack
    """
    
    def __init__(self, options: Dict[str, Any] = None):
        """
        Initialize Intro Sort with options.
        
        Args:
            options: Dictionary of options including:
                - insertion_threshold: Size threshold for using insertion sort
                - pivot_strategy: Strategy for selecting pivot ('first', 'last', 'middle', 'random', 'median-of-three')
                - optimize_threshold: Dynamically compute depth threshold
        """
        super().__init__("Intro Sort", "comparison", options)
        
        # Default options
        self.options.update({
            "insertion_threshold": 16,            # Switch to insertion sort below this size
            "pivot_strategy": "median-of-three",  # Strategy for selecting pivot in quicksort phase
            "optimize_threshold": True,           # Dynamically compute depth threshold
            "animation_delay": 0                  # Delay between steps for visualization
        })
        
        # Override with provided options
        if options:
            self.options.update(options)

    def run(self, array: List[T], options: Dict[str, Any]) -> List[T]:
        """
        Execute Intro Sort on the provided array.
        
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
            
        # Compute maximum recursion depth for quicksort phase
        max_depth = self.compute_max_depth(n, options)
        
        self.set_phase("sorting")
        
        # Begin the sort
        self.intro_sort(result, 0, n - 1, max_depth, options)
        
        self.set_phase("completed")
        return result

    def compute_max_depth(self, size: int, options: Dict[str, Any]) -> int:
        """
        Compute the maximum recursion depth for the quicksort phase.
        
        Args:
            size: Size of the array
            options: Algorithm options
            
        Returns:
            Maximum recursion depth
        """
        if not options["optimize_threshold"]:
            # Fixed at 2*log₂(n)
            return math.floor(2 * math.log2(size))
        
        # More sophisticated depth calculation
        # This is based on the observation that the average case quicksort
        # recursion depth is approximately 1.5*log₂(n)
        return math.floor(2.5 * math.log2(size))

    def intro_sort(self, array: List[T], start: int, end: int, depth_limit: int, options: Dict[str, Any]) -> None:
        """
        Main Intro Sort recursive implementation.
        
        Args:
            array: The array being sorted
            start: Start index
            end: End index
            depth_limit: Remaining recursion depth limit
            options: Algorithm options
        """
        size = end - start + 1
        
        # Introduce delay for visualization if specified
        if options["animation_delay"] > 0:
            time.sleep(options["animation_delay"] / 1000)
        
        # Use insertion sort for small arrays
        if size <= options["insertion_threshold"]:
            self.insertion_sort(array, start, end)
            
            self.record_state(array, {
                "type": "insertion-complete",
                "section": [start, end],
                "message": f"Completed insertion sort on small range [{start}...{end}]"
            })
            
            return
        
        # If depth limit is zero, switch to heap sort
        if depth_limit == 0:
            self.record_state(array, {
                "type": "algorithm-switch",
                "algorithm": "heap-sort",
                "section": [start, end],
                "message": f"Recursion depth limit reached, switching to Heap Sort for range [{start}...{end}]"
            })
            
            self.heap_sort(array, start, end)
            return
        
        # Otherwise, use quicksort partition
        self.record_state(array, {
            "type": "quicksort-phase",
            "section": [start, end],
            "depth_remaining": depth_limit,
            "message": f"Using QuickSort partition for range [{start}...{end}], depth remaining: {depth_limit}"
        })
        
        # Choose pivot and partition the array
        pivot_index = self.partition(array, start, end, options)
        
        # Recursively sort the left partition
        left_size = pivot_index - start
        if left_size > 1:
            self.intro_sort(array, start, pivot_index - 1, depth_limit - 1, options)
        
        # Recursively sort the right partition
        right_size = end - pivot_index
        if right_size > 1:
            self.intro_sort(array, pivot_index + 1, end, depth_limit - 1, options)

    def partition(self, array: List[T], start: int, end: int, options: Dict[str, Any]) -> int:
        """
        QuickSort partition operation.
        
        Args:
            array: The array to partition
            start: Start index
            end: End index
            options: Algorithm options
            
        Returns:
            Final position of the pivot
        """
        # Select pivot based on specified strategy
        pivot_index = self.select_pivot(array, start, end, options["pivot_strategy"])
        
        # Move pivot to the end
        self.swap(array, pivot_index, end)
        
        pivot_value = self.read(array, end)
        
        self.record_state(array, {
            "type": "pivot-selection",
            "original_pivot_index": pivot_index,
            "pivot_value": pivot_value,
            "message": f"Selected pivot {pivot_value} (originally at index {pivot_index})"
        })
        
        # Partition the array
        i = start  # Position for elements less than pivot
        
        for j in range(start, end):
            # Introduce delay for visualization if specified
            if options["animation_delay"] > 0:
                time.sleep(options["animation_delay"] / 1000)
                
            if self.compare(self.read(array, j), pivot_value) <= 0:
                # Element is less than or equal to pivot, move to left partition
                if i != j:
                    self.swap(array, i, j)
                    
                    self.record_state(array, {
                        "type": "partition-step",
                        "pivot_value": pivot_value,
                        "swapped": [i, j],
                        "message": f"Swapped elements at {i} and {j} during partitioning"
                    })
                i += 1
        
        # Place pivot in its final position
        self.swap(array, i, end)
        
        self.record_state(array, {
            "type": "partition-complete",
            "pivot_index": i,
            "pivot_value": pivot_value,
            "left_section": [start, i - 1],
            "right_section": [i + 1, end],
            "message": f"Completed partitioning with pivot {pivot_value} at position {i}"
        })
        
        return i

    def select_pivot(self, array: List[T], start: int, end: int, strategy: str) -> int:
        """
        Select a pivot using the specified strategy.
        
        Args:
            array: The array
            start: Start index
            end: End index
            strategy: Pivot selection strategy
            
        Returns:
            Index of the selected pivot
        """
        if strategy == "first":
            return start
            
        elif strategy == "last":
            return end
            
        elif strategy == "middle":
            return math.floor(start + (end - start) / 2)
            
        elif strategy == "random":
            return random.randint(start, end)
            
        elif strategy == "median-of-three" or True:  # Default to median-of-three
            # Get first, middle, and last elements
            mid = math.floor(start + (end - start) / 2)
            
            # Select median of three values
            a = self.read(array, start)
            b = self.read(array, mid)
            c = self.read(array, end)
            
            # Return the index of the median value
            if self.compare(a, b) <= 0:
                if self.compare(b, c) <= 0:
                    return mid    # a <= b <= c
                if self.compare(a, c) <= 0:
                    return end    # a <= c < b
                return start      # c < a <= b
            else:
                if self.compare(a, c) <= 0:
                    return start  # b < a <= c
                if self.compare(b, c) <= 0:
                    return end    # b <= c < a
                return mid        # c < b < a

    def insertion_sort(self, array: List[T], start: int, end: int) -> None:
        """
        Insertion sort implementation for small subarrays.
        
        Args:
            array: The array to sort
            start: Start index
            end: End index
        """
        self.record_state(array, {
            "type": "insertion-start",
            "section": [start, end],
            "message": f"Starting insertion sort for range [{start}...{end}]"
        })
        
        for i in range(start + 1, end + 1):
            key = self.read(array, i)
            j = i - 1
            
            # Find insertion position
            while j >= start and self.compare(self.read(array, j), key) > 0:
                self.write(array, j + 1, self.read(array, j))
                j -= 1
            
            # Insert element at correct position
            if j + 1 != i:
                self.write(array, j + 1, key)
                
                # Record this insertion step
                self.record_state(array, {
                    "type": "insertion-step",
                    "key": key,
                    "position": j + 1,
                    "message": f"Inserted {key} at position {j + 1}"
                })

    def heap_sort(self, array: List[T], start: int, end: int) -> None:
        """
        Heap sort implementation.
        
        Args:
            array: The array to sort
            start: Start index
            end: End index
        """
        size = end - start + 1
        
        # Build max heap
        self.record_state(array, {
            "type": "heap-construction",
            "section": [start, end],
            "message": f"Building max heap for range [{start}...{end}]"
        })
        
        # Heapify from the middle to the start
        for i in range(math.floor(size / 2) - 1 + start, start - 1, -1):
            self.sift_down(array, i, end, start)
        
        self.record_state(array, {
            "type": "heap-ready",
            "section": [start, end],
            "message": "Max heap constructed"
        })
        
        # Extract elements from the heap one by one
        for i in range(end, start, -1):
            # Swap first (max) element with the current last element
            self.swap(array, start, i)
            
            self.record_state(array, {
                "type": "extract-max",
                "extracted": i,
                "value": array[i],
                "message": f"Extracted max element {array[i]} to position {i}"
            })
            
            # Sift down the new root to maintain heap property
            self.sift_down(array, start, i - 1, start)

    def sift_down(self, array: List[T], root: int, end: int, offset: int) -> None:
        """
        Sift down operation for heap sort.
        
        Args:
            array: The array containing the heap
            root: Index of the root node
            end: End index of the heap
            offset: Start index offset
        """
        current = root
        
        while True:
            left = 2 * (current - offset) + 1 + offset
            right = left + 1
            largest = current
            
            # Compare with left child
            if left <= end and self.compare(self.read(array, left), self.read(array, largest)) > 0:
                largest = left
            
            # Compare with right child
            if right <= end and self.compare(self.read(array, right), self.read(array, largest)) > 0:
                largest = right
            
            # If largest is not the current node, swap and continue
            if largest != current:
                self.swap(array, current, largest)
                
                self.record_state(array, {
                    "type": "sift-down",
                    "swapped": [current, largest],
                    "message": f"Swapped {array[largest]} and {array[current]} during sift down"
                })
                
                current = largest
            else:
                # Heap property is satisfied
                break

    def get_complexity(self) -> Dict[str, Dict[str, str]]:
        """
        Get the time and space complexity of Intro Sort.
        
        Returns:
            Complexity information dictionary
        """
        return {
            "time": {
                "best": "O(n log n)",
                "average": "O(n log n)",
                "worst": "O(n log n)"
            },
            "space": {
                "best": "O(log n)",
                "average": "O(log n)",
                "worst": "O(log n)"
            }
        }

    def is_stable(self) -> bool:
        """
        Whether Intro Sort is stable (preserves relative order of equal elements).
        
        Returns:
            False as Intro Sort is not stable
        """
        return False

    def is_in_place(self) -> bool:
        """
        Whether Intro Sort is in-place (uses O(1) auxiliary space).
        
        Returns:
            True as Intro Sort is in-place (except for recursion stack)
        """
        return True
    
    def get_info(self) -> Dict[str, Any]:
        """
        Get detailed information about the algorithm.
        
        Returns:
            Dictionary with algorithm details
        """
        info = super().get_info()
        
        # Add Intro Sort specific information
        info.update({
            "optimization": {
                "insertion_threshold": self.options.get("insertion_threshold", 16),
                "pivot_strategy": self.options.get("pivot_strategy", "median-of-three"),
                "optimize_threshold": self.options.get("optimize_threshold", True)
            },
            "properties": {
                "comparison_based": True,
                "stable": False,
                "in_place": True,
                "hybrid": True,
                "adaptive": True,
                "deterministic": self.options.get("pivot_strategy", "median-of-three") != "random"
            },
            "suitable_for": {
                "small_arrays": True,
                "large_arrays": True,
                "nearly_sorted_arrays": True,
                "random_data": True,
                "production_systems": True
            },
            "variants": [
                "Standard IntroSort (quicksort → heapsort)",
                "C++ STL std::sort implementation",
                "Dual Pivot IntroSort",
                ".NET Framework Array.Sort implementation (introspective sort variant)"
            ],
            "advantages": [
                "Guaranteed O(n log n) worst-case performance",
                "Excellent average-case performance inherited from quicksort",
                "Good performance on small arrays using insertion sort",
                "In-place sorting (no extra memory needed except stack)",
                "Used in production systems (C++ STL, .NET Framework)"
            ],
            "disadvantages": [
                "Not stable (does not preserve order of equal elements)",
                "More complex implementation than single-algorithm approaches",
                "May perform unnecessary algorithm switches in some edge cases"
            ],
            "citations": [
                {
                    "author": "David R. Musser",
                    "title": "Introspective Sorting and Selection Algorithms",
                    "year": 1997,
                    "reference": "Software—Practice and Experience 27(8): 983–993"
                }
            ]
        })
        
        return info


# Example usage
if __name__ == "__main__":
    # Create and run a simple test
    sorter = IntroSort({
        "insertion_threshold": 16,
        "pivot_strategy": "median-of-three",
        "optimize_threshold": True
    })
    
    test_array = [5, 3, 8, 4, 2, 9, 1, 7, 6]
    
    result = sorter.execute(test_array)
    print(f"Original: {test_array}")
    print(f"Sorted: {result}")
    print(f"Comparisons: {sorter.metrics['comparisons']}")
    print(f"Metrics: {sorter.metrics}")
    print(f"Steps: {len(sorter.history)}")
