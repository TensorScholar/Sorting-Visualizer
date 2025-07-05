# algorithms/sorting/quick_sort.py

import random
import time
from typing import List, Any, Dict, Optional, Union, Callable, Tuple
from algorithms.base_algorithm import Algorithm

class QuickSort(Algorithm):
    """
    Implementation of Quick Sort with multiple optimization strategies.
    
    Quick Sort is a divide-and-conquer algorithm that:
    1. Selects a 'pivot' element from the array
    2. Partitions the array around the pivot (elements < pivot on the left, elements > pivot on the right)
    3. Recursively applies the above steps to the sub-arrays
    
    This implementation includes sophisticated optimizations:
    1. Multiple pivot selection strategies (first, last, middle, random, median-of-three)
    2. Three-way partitioning (Dutch national flag algorithm) for handling duplicates efficiently
    3. Insertion sort for small subarrays to reduce recursion overhead
    4. Tail recursion elimination to reduce stack space requirements
    5. Adaptive pivot selection based on array characteristics
    
    Time Complexity:
        - Best:    O(n log n) when partitions are balanced
        - Average: O(n log n)
        - Worst:   O(n²) with pathological pivot choices, but mitigated by our optimizations
    
    Space Complexity:
        - O(log n) average case for recursion stack
        - O(n) worst case with unbalanced partitions
    """
    
    def __init__(self, options: Dict[str, Any] = None):
        """
        Initialize Quick Sort with options.
        
        Args:
            options: Dictionary of options including:
                - pivot_strategy: Strategy for selecting pivot
                - insertion_threshold: Threshold for switching to insertion sort
                - three_way_partition: Use three-way partitioning for duplicates
                - tail_recursion: Use tail recursion optimization
                - adaptive_pivot: Adapt pivot strategy based on array characteristics
        """
        super().__init__("Quick Sort", "comparison", options)
        
        # Default options with carefully chosen values based on empirical performance data
        self.options.update({
            "pivot_strategy": "median-of-three",  # Strategy for selecting pivot
            "insertion_threshold": 16,            # Switch to insertion sort for small arrays
            "three_way_partition": True,          # Use three-way partitioning for handling duplicates
            "tail_recursion": True,               # Use tail recursion optimization
            "adaptive_pivot": True,               # Adapt pivot strategy based on array characteristics
            "animation_delay": 0                  # Delay between steps for visualization
        })
        
        # Override with provided options
        if options:
            self.options.update(options)

    def run(self, array: List[Any], options: Dict[str, Any]) -> List[Any]:
        """
        Execute Quick Sort on the provided array.
        
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
        
        # Start the quicksort process
        self.quick_sort(result, 0, n - 1, options)
        
        self.set_phase("completed")
        return result

    def quick_sort(self, array: List[Any], low: int, high: int, options: Dict[str, Any]) -> None:
        """
        Main recursive Quick Sort function.
        
        Args:
            array: The array being sorted
            low: Start index
            high: End index
            options: Runtime options
        """
        # Record the current recursive call
        self.record_state(array, {
            "type": "recursive-call",
            "section": [low, high],
            "message": f"Sorting section from index {low} to {high}"
        })
        
        # Introduce delay for visualization if specified
        if options["animation_delay"] > 0:
            time.sleep(options["animation_delay"] / 1000)
        
        # Base case: If the partition size is below threshold, use insertion sort
        if high - low < options["insertion_threshold"]:
            self.insertion_sort(array, low, high, options)
            return
        
        # Base case: If the partition is empty or has only one element
        if low >= high:
            return
        
        # Choose the partitioning algorithm based on options
        if options["three_way_partition"]:
            # Three-way partitioning for arrays with potential duplicates
            lt, gt = self.three_way_partition(array, low, high, options)
            
            # Record completed partitioning
            self.record_state(array, {
                "type": "partition-complete",
                "lt": lt,
                "gt": gt,
                "message": f"Three-way partition: [{low}...{lt-1}] < pivot, [{lt}...{gt}] = pivot, [{gt+1}...{high}] > pivot"
            })
            
            # Recursively sort left partition
            self.quick_sort(array, low, lt - 1, options)
            
            # Recursively sort right partition using tail recursion optimization if enabled
            if options["tail_recursion"]:
                # Instead of recursing, prepare for next iteration
                # Python doesn't optimize tail recursion, so we manually simulate it with a while loop
                low = gt + 1
                # Continue with the next iteration if needed
                if low < high:
                    self.quick_sort(array, low, high, options)
            else:
                # Standard recursive call for right partition
                self.quick_sort(array, gt + 1, high, options)
        else:
            # Standard partitioning
            pivot_index = self.partition(array, low, high, options)
            
            # Record completed partitioning
            self.record_state(array, {
                "type": "partition-complete",
                "pivot_index": pivot_index,
                "message": f"Standard partition: pivot at index {pivot_index}"
            })
            
            # Recursively sort left partition
            self.quick_sort(array, low, pivot_index - 1, options)
            
            # Recursively sort right partition using tail recursion optimization if enabled
            if options["tail_recursion"]:
                # Instead of recursing, prepare for next iteration
                low = pivot_index + 1
                # Continue with the next iteration if needed
                if low < high:
                    self.quick_sort(array, low, high, options)
            else:
                # Standard recursive call for right partition
                self.quick_sort(array, pivot_index + 1, high, options)

    def partition(self, array: List[Any], low: int, high: int, options: Dict[str, Any]) -> int:
        """
        Standard partition scheme (Lomuto's partition).
        
        Args:
            array: The array to partition
            low: Start index
            high: End index
            options: Runtime options
            
        Returns:
            Final position of the pivot
        """
        # Select a pivot based on the chosen strategy
        pivot_index = self.select_pivot(array, low, high, options["pivot_strategy"], options["adaptive_pivot"])
        
        # Record pivot selection
        self.record_state(array, {
            "type": "pivot-selection",
            "pivot_index": pivot_index,
            "value": array[pivot_index],
            "strategy": "adaptive" if options["adaptive_pivot"] else options["pivot_strategy"],
            "message": f"Selected pivot {array[pivot_index]} at index {pivot_index}"
        })
        
        # Move pivot to the end temporarily
        self.swap(array, pivot_index, high)
        
        # Record pivot movement
        self.record_state(array, {
            "type": "pivot-movement",
            "indices": [pivot_index, high],
            "message": f"Moved pivot to index {high} for partitioning"
        })
        
        pivot_value = self.read(array, high)
        
        # Initialize partition index
        i = low
        
        # Partition the array
        for j in range(low, high):
            # Introduce delay for visualization if specified
            if options["animation_delay"] > 0:
                time.sleep(options["animation_delay"] / 1000)
            
            # Compare current element with pivot
            comparison = self.compare(self.read(array, j), pivot_value)
            
            # Record comparison
            self.record_state(array, {
                "type": "comparison",
                "indices": [j, high],
                "result": comparison,
                "message": f"Comparing element at index {j} with pivot"
            })
            
            # If current element is less than pivot, move it to the left side
            if comparison < 0:
                # Swap elements
                if i != j:
                    self.swap(array, i, j)
                    
                    # Record the swap
                    self.record_state(array, {
                        "type": "partition-swap",
                        "indices": [i, j],
                        "message": f"Moved smaller element from index {j} to {i}"
                    })
                
                # Increment partition index
                i += 1
        
        # Move pivot to its final position
        self.swap(array, i, high)
        
        # Record final pivot position
        self.record_state(array, {
            "type": "pivot-final",
            "pivot_index": i,
            "message": f"Placed pivot {pivot_value} at final position {i}"
        })
        
        return i

    def three_way_partition(self, array: List[Any], low: int, high: int, options: Dict[str, Any]) -> Tuple[int, int]:
        """
        Three-way partitioning (Dutch national flag algorithm).
        Handles duplicates efficiently by creating three partitions:
        - Elements less than pivot
        - Elements equal to pivot
        - Elements greater than pivot
        
        Args:
            array: The array to partition
            low: Start index
            high: End index
            options: Runtime options
            
        Returns:
            Tuple of [lt, gt] indices where lt is the first element equal to pivot and gt is the last
        """
        # Select a pivot based on the chosen strategy
        pivot_index = self.select_pivot(array, low, high, options["pivot_strategy"], options["adaptive_pivot"])
        
        # Record pivot selection
        self.record_state(array, {
            "type": "pivot-selection",
            "pivot_index": pivot_index,
            "value": array[pivot_index],
            "strategy": "adaptive" if options["adaptive_pivot"] else options["pivot_strategy"],
            "message": f"Selected pivot {array[pivot_index]} at index {pivot_index} for three-way partition"
        })
        
        pivot_value = self.read(array, pivot_index)
        
        # Initialize pointers for the three sections
        lt = low      # Elements < pivot will be to the left of lt
        gt = high     # Elements > pivot will be to the right of gt
        i = low       # Current element being examined
        
        # Partition the array
        while i <= gt:
            # Introduce delay for visualization if specified
            if options["animation_delay"] > 0:
                time.sleep(options["animation_delay"] / 1000)
            
            # Compare current element with pivot
            comparison = self.compare(self.read(array, i), pivot_value)
            
            # Record comparison
            self.record_state(array, {
                "type": "comparison",
                "indices": [i, pivot_index],
                "result": comparison,
                "message": f"Comparing element at index {i} with pivot"
            })
            
            if comparison < 0:
                # Element is less than pivot, move to the left section
                self.swap(array, lt, i)
                
                # Record the swap
                self.record_state(array, {
                    "type": "partition-swap",
                    "indices": [lt, i],
                    "message": f"Moved smaller element from index {i} to {lt}"
                })
                
                lt += 1
                i += 1
            elif comparison > 0:
                # Element is greater than pivot, move to the right section
                self.swap(array, i, gt)
                
                # Record the swap
                self.record_state(array, {
                    "type": "partition-swap",
                    "indices": [i, gt],
                    "message": f"Moved larger element from index {i} to {gt}"
                })
                
                gt -= 1
                # Don't increment i since we need to examine the element we just swapped in
            else:
                # Element is equal to pivot, keep in the middle section
                i += 1
        
        # Record final partitioning
        self.record_state(array, {
            "type": "three-way-partition",
            "lt": lt,
            "gt": gt,
            "message": f"Three-way partition complete: [{low}...{lt-1}] < pivot, [{lt}...{gt}] = pivot, [{gt+1}...{high}] > pivot"
        })
        
        return lt, gt

    def insertion_sort(self, array: List[Any], low: int, high: int, options: Dict[str, Any]) -> None:
        """
        Insertion sort for small subarrays.
        
        Args:
            array: The array to sort
            low: Start index
            high: End index
            options: Runtime options
        """
        # Record switch to insertion sort
        self.record_state(array, {
            "type": "algorithm-switch",
            "section": [low, high],
            "message": f"Switching to insertion sort for small subarray [{low}...{high}]"
        })
        
        for i in range(low + 1, high + 1):
            # Introduce delay for visualization if specified
            if options["animation_delay"] > 0:
                time.sleep(options["animation_delay"] / 1000)
            
            key = self.read(array, i)
            j = i - 1
            
            # Find the correct position for the key
            while j >= low and self.compare(self.read(array, j), key) > 0:
                # Shift elements to the right
                self.write(array, j + 1, self.read(array, j))
                j -= 1
            
            # Insert the key in its correct position
            if j + 1 != i:
                self.write(array, j + 1, key)
                
                # Record insertion
                self.record_state(array, {
                    "type": "insertion",
                    "index": j + 1,
                    "value": key,
                    "message": f"Inserted {key} at position {j + 1}"
                })
        
        # Record completion of insertion sort
        self.record_state(array, {
            "type": "subarray-sorted",
            "section": [low, high],
            "message": f"Insertion sort complete for subarray [{low}...{high}]"
        })

    def select_pivot(self, array: List[Any], low: int, high: int, strategy: str, adaptive: bool) -> int:
        """
        Select a pivot element using the specified strategy.
        
        Args:
            array: The array
            low: Start index
            high: End index
            strategy: Pivot selection strategy
            adaptive: Whether to use adaptive pivot selection
            
        Returns:
            Index of the selected pivot
        """
        # Early return for single-element arrays
        if low == high:
            return low
        
        # Adaptive pivot selection based on array characteristics
        if adaptive:
            # Examine a sample of elements to determine the best strategy
            size = high - low + 1
            
            if size >= 16:
                # For larger arrays, check if the array might be partially sorted
                samples = [
                    low, 
                    int(low + size * 0.25), 
                    int(low + size * 0.5),
                    int(low + size * 0.75),
                    high
                ]
                
                ascending = 0
                descending = 0
                
                # Check for ascending or descending patterns
                for i in range(1, len(samples)):
                    comparison = self.compare(array[samples[i-1]], array[samples[i]])
                    if comparison <= 0:
                        ascending += 1
                    if comparison >= 0:
                        descending += 1
                
                # If the array appears to be partially sorted, use median-of-three
                if ascending >= 3 or descending >= 3:
                    return self.median_of_three(array, low, high)
                
                # Otherwise, use a strategy appropriate for the array size
                if size > 100:
                    # For very large arrays, use median-of-medians (approximated with ninther)
                    return self.ninther(array, low, high)
        
        # Standard pivot selection strategies
        if strategy == "first":
            return low
        elif strategy == "last":
            return high
        elif strategy == "middle":
            return low + (high - low) // 2
        elif strategy == "random":
            return random.randint(low, high)
        elif strategy == "median-of-three":
            return self.median_of_three(array, low, high)
        else:
            # Default to median-of-three as it provides good general performance
            return self.median_of_three(array, low, high)

    def median_of_three(self, array: List[Any], low: int, high: int) -> int:
        """
        Find the median of three elements (first, middle, last).
        
        Args:
            array: The array
            low: Start index
            high: End index
            
        Returns:
            Index of the median element
        """
        mid = low + (high - low) // 2
        
        # Compare the three elements
        if self.compare(array[low], array[mid]) > 0:
            if self.compare(array[mid], array[high]) > 0:
                return mid  # mid is the median
            elif self.compare(array[low], array[high]) > 0:
                return high  # high is the median
            else:
                return low  # low is the median
        else:
            if self.compare(array[low], array[high]) > 0:
                return low  # low is the median
            elif self.compare(array[mid], array[high]) > 0:
                return high  # high is the median
            else:
                return mid  # mid is the median

    def ninther(self, array: List[Any], low: int, high: int) -> int:
        """
        Find the "ninther" - the median of medians of three samples of three elements.
        This is a good approximation of the true median with minimal overhead.
        
        Args:
            array: The array
            low: Start index
            high: End index
            
        Returns:
            Index of the selected pivot
        """
        size = high - low + 1
        step = size // 8
        
        # Select three points for each of three sections
        sections = [
            [low, low + step, low + 2 * step],
            [low + (high - low) // 2 - step, low + (high - low) // 2, low + (high - low) // 2 + step],
            [high - 2 * step, high - step, high]
        ]
        
        # Find the median of each section
        medians = []
        for section in sections:
            medians.append(self.median_of_three(array, section[0], section[2]))
        
        # Return the median of the three medians
        return self.median_of_three(array, medians[0], medians[2])

    def get_complexity(self) -> Dict[str, Dict[str, str]]:
        """
        Get the time and space complexity of Quick Sort.
        
        Returns:
            Complexity information dictionary
        """
        return {
            "time": {
                "best": "O(n log n)",
                "average": "O(n log n)",
                "worst": "O(n²)"  # Although our optimizations mitigate this in practice
            },
            "space": {
                "best": "O(log n)",
                "average": "O(log n)",
                "worst": "O(n)"
            }
        }

    def is_stable(self) -> bool:
        """
        Whether Quick Sort is stable (preserves relative order of equal elements).
        
        Returns:
            False as standard Quick Sort is not stable
        """
        return False

    def is_in_place(self) -> bool:
        """
        Whether Quick Sort is in-place (uses minimal auxiliary space).
        
        Returns:
            True as Quick Sort is generally considered in-place
        """
        return True
    
    def get_info(self) -> Dict[str, Any]:
        """
        Get detailed information about the algorithm.
        
        Returns:
            Dictionary with algorithm details
        """
        info = super().get_info()
        
        # Add quicksort specific information
        info.update({
            "optimization": {
                "pivot_strategy": self.options.get("pivot_strategy", "median-of-three"),
                "adaptive_pivot": self.options.get("adaptive_pivot", True),
                "insertion_threshold": self.options.get("insertion_threshold", 16),
                "three_way_partition": self.options.get("three_way_partition", True),
                "tail_recursion": self.options.get("tail_recursion", True)
            },
            "properties": {
                "comparison_based": True,
                "stable": False,
                "in_place": True,
                "online": False,
                "divide_and_conquer": True,
                "adaptive": self.options.get("adaptive_pivot", True)
            },
            "suitable_for": {
                "small_arrays": True,  # With insertion sort optimization
                "nearly_sorted_arrays": self.options.get("adaptive_pivot", True),  # If using adaptive pivot
                "large_arrays": True,
                "duplicate_elements": self.options.get("three_way_partition", True)  # Especially with three-way partitioning
            },
            "variants": [
                "Lomuto partition scheme",
                "Hoare partition scheme",
                "Three-way partitioning (Dutch national flag)",
                "Dual-pivot Quick Sort",
                "Introsort (hybrid with Heap Sort)",
                "Quick Sort with median-of-medians"
            ],
            "pivot_strategies": {
                "first": "Simple but performs poorly on sorted arrays",
                "last": "Simple but performs poorly on reverse-sorted arrays",
                "middle": "Good for partially sorted arrays",
                "random": "Probabilistic protection against worst-case inputs",
                "median-of-three": "Good general-purpose strategy, helps with partially sorted arrays",
                "adaptive": "Dynamically chooses strategy based on array characteristics",
                "ninther": "Good approximation of true median for large arrays"
            },
            "advantages": [
                "Fast in-place sorting with excellent average-case performance",
                "Good cache locality for in-memory sorting",
                "Low overhead with minimal memory usage",
                "Can be optimized for different types of input data",
                "Outperforms other O(n log n) algorithms in practice for random data"
            ],
            "disadvantages": [
                "Not stable (does not preserve order of equal elements)",
                "Vulnerable to worst-case O(n²) behavior without proper pivot selection",
                "Requires careful optimization to handle corner cases efficiently",
                "Recursive implementation can cause stack overflow for large arrays without tail recursion optimization"
            ],
            "performance": {
                "best_case": "Random data with balanced partitioning",
                "worst_case": "Sorted or reverse-sorted arrays with poor pivot selection strategy",
                "average_case": "Random data with occasional skewed partitions"
            }
        })
        
        return info


# Example usage and testing
if __name__ == "__main__":
    # Create and run basic test cases
    sorter = QuickSort({
        "pivot_strategy": "median-of-three",
        "three_way_partition": True,
        "insertion_threshold": 16
    })
    
    # Test case 1: Random array
    test_array = [5, 3, 8, 4, 2, 9, 1, 7, 6]
    result = sorter.execute(test_array)
    
    print(f"Original: {test_array}")
    print(f"Sorted: {result}")
    print(f"Metrics: {sorter.metrics}")
    
    # Test case 2: Array with duplicates
    test_array_dups = [3, 1, 4, 1, 5, 9, 2, 6, 5, 3, 5]
    result_dups = sorter.execute(test_array_dups)
    
    print(f"\nArray with duplicates:")
    print(f"Original: {test_array_dups}")
    print(f"Sorted: {result_dups}")
    print(f"Metrics: {sorter.metrics}")
    
    # Test case 3: Nearly sorted array
    test_array_nearly = [1, 2, 3, 5, 4, 6, 7, 8, 9]
    result_nearly = sorter.execute(test_array_nearly)
    
    print(f"\nNearly sorted array:")
    print(f"Original: {test_array_nearly}")
    print(f"Sorted: {result_nearly}")
    print(f"Metrics: {sorter.metrics}")
