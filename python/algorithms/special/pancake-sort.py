# algorithms/sorting/pancake_sort.py

from typing import List, Any, Dict, Optional, Callable, Tuple
from algorithms.base_algorithm import Algorithm
import time

class PancakeSort(Algorithm):
    """
    Implementation of Pancake Sort algorithm with visualization of the flipping operations.
    
    Pancake Sort is a sorting algorithm that sorts an array by repeatedly flipping 
    prefixes of the array (like flipping pancakes on a griddle with a spatula).
    It works by:
    1. Finding the maximum element in the unsorted portion of the array
    2. Flipping the array from start to the position of this maximum element (bringing it to the front)
    3. Flipping the array from start to the boundary of sorted/unsorted regions (moving the maximum to its correct position)
    4. Reducing the unsorted region by one element and repeating
    
    Pancake Sort is primarily of theoretical interest with connections to prefix reversal problems
    in computational biology and genome rearrangement.
    
    This implementation includes:
    - Visualization of the flipping operations
    - Optimized flip sequence computation
    - Variant with fewer flips (optimized strategy)
    - Connection to the pancake problem and its applications
    
    Time Complexity:
    - Best:    O(n)
    - Average: O(n²)
    - Worst:   O(n²)
    
    Space Complexity: O(1) - in-place sorting algorithm
    """
    
    def __init__(self, options: Dict[str, Any] = None):
        """
        Initialize Pancake Sort with options.
        
        Args:
            options: Dictionary of options including:
                - visualize_flips: Visualize the flipping operations
                - optimized_strategy: Use optimized flipping strategy to reduce flip count
                - find_minimum: Find minimum instead of maximum (alternate strategy)
                - track_flip_metrics: Track and analyze flip operations
        """
        super().__init__("Pancake Sort", "special", options)
        
        # Default options
        self.options.update({
            "visualize_flips": True,      # Visualize the flipping operations
            "optimized_strategy": True,   # Use optimized flipping strategy
            "find_minimum": False,        # Find minimum instead of maximum (alternate strategy)
            "track_flip_metrics": True,   # Track and analyze flip operations
            "animation_delay": 0          # Delay between steps for visualization
        })
        
        # Override with provided options
        if options:
            self.options.update(options)
        
        # Track flip operations
        self.flip_count = 0
        self.flip_sequence = []

    def run(self, array: List[Any], options: Dict[str, Any]) -> List[Any]:
        """
        Execute Pancake Sort on the provided array.
        
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
        
        # Reset flip metrics
        self.flip_count = 0
        self.flip_sequence = []
        
        # Optimized strategy reduces the number of flips
        if options["optimized_strategy"]:
            return self.optimized_pancake_sort(result, options)
        
        # Basic pancake sort
        return self.basic_pancake_sort(result, options)

    def basic_pancake_sort(self, array: List[Any], options: Dict[str, Any]) -> List[Any]:
        """
        Basic pancake sort implementation.
        
        Args:
            array: Array to sort
            options: Runtime options
            
        Returns:
            Sorted array
        """
        n = len(array)
        
        # For each position in the array (from the largest to the smallest)
        for curr_size in range(n, 1, -1):
            # Find the index of the maximum element in the current window
            max_idx = self.find_max_index(array, curr_size)
            
            # Introduce delay for visualization if specified
            if options["animation_delay"] > 0:
                time.sleep(options["animation_delay"] / 1000)
            
            self.record_state(array, {
                "type": "find-max",
                "max_index": max_idx,
                "current_size": curr_size,
                "message": f"Found maximum element {array[max_idx]} at index {max_idx} in window [0..{curr_size-1}]"
            })
            
            # If the maximum element is already at the end of the current window, no need to flip
            if max_idx == curr_size - 1:
                continue
            
            # If the maximum element is not at the beginning, flip from 0 to max_idx
            if max_idx != 0:
                # Flip from 0 to max_idx (bring the maximum to the front)
                self.flip(array, max_idx, options)
                
                self.record_state(array, {
                    "type": "flip",
                    "flip_index": max_idx,
                    "message": f"Flipped subarray [0..{max_idx}] to bring maximum to front"
                })
            
            # Now flip from 0 to curr_size-1 (bring the maximum to its final position)
            self.flip(array, curr_size - 1, options)
            
            self.record_state(array, {
                "type": "flip",
                "flip_index": curr_size - 1,
                "message": f"Flipped subarray [0..{curr_size-1}] to place maximum at position {curr_size-1}"
            })
            
            # Mark the element as in its correct final position
            self.record_state(array, {
                "type": "sorted",
                "indices": [curr_size - 1],
                "message": f"Element {array[curr_size-1]} is now in its correct position {curr_size-1}"
            })
        
        self.set_phase("completed")
        return array

    def optimized_pancake_sort(self, array: List[Any], options: Dict[str, Any]) -> List[Any]:
        """
        Optimized pancake sort with reduced flips.
        
        Args:
            array: Array to sort
            options: Runtime options
            
        Returns:
            Sorted array
        """
        n = len(array)
        
        # Sort from smallest to largest position (bottom-up)
        for i in range(n):
            # Introduce delay for visualization if specified
            if options["animation_delay"] > 0:
                time.sleep(options["animation_delay"] / 1000)
            
            # Strategy can either find maximum or minimum elements
            if options["find_minimum"]:
                target_index = self.find_min_index(array, i, n)
                target_value = array[target_index]
                target_position = i
                
                self.record_state(array, {
                    "type": "find-min",
                    "target_index": target_index,
                    "target_position": target_position,
                    "current_window": [i, n-1],
                    "message": f"Found minimum element {target_value} at index {target_index}"
                })
            else:
                target_index = self.find_max_index(array, n - i)
                target_value = array[target_index]
                target_position = n - i - 1
                
                self.record_state(array, {
                    "type": "find-max",
                    "target_index": target_index,
                    "target_position": target_position,
                    "current_window": [0, n-i-1],
                    "message": f"Found maximum element {target_value} at index {target_index}"
                })
            
            # If element is already in position, continue
            if target_index == target_position:
                self.record_state(array, {
                    "type": "skip-flip",
                    "index": target_index,
                    "message": f"Element {target_value} is already in its correct position {target_position}"
                })
                continue
            
            # Optimized flip sequence to minimize operations
            if options["find_minimum"]:
                # Bringing minimum to front
                if target_index > i:
                    # Bring target to beginning of unsorted region
                    if target_index > i + 1:
                        self.flip(array, target_index, options)
                        self.record_state(array, {
                            "type": "flip",
                            "flip_index": target_index,
                            "message": f"Flipped subarray [{i}..{target_index}] to bring minimum to position {i}"
                        })
                else:
                    # No flip needed, already at beginning of unsorted region
                    pass
            else:
                # Bringing maximum to end
                if target_index < target_position:
                    # If not at front, bring to front first
                    if target_index > 0:
                        self.flip(array, target_index, options)
                        self.record_state(array, {
                            "type": "flip",
                            "flip_index": target_index,
                            "message": f"Flipped subarray [0..{target_index}] to bring maximum to front"
                        })
                    
                    # Then flip to final position
                    self.flip(array, target_position, options)
                    self.record_state(array, {
                        "type": "flip",
                        "flip_index": target_position,
                        "message": f"Flipped subarray [0..{target_position}] to place maximum at position {target_position}"
                    })
            
            # Mark element as sorted
            self.record_state(array, {
                "type": "sorted",
                "indices": [target_position],
                "message": f"Element {array[target_position]} is now in its correct position {target_position}"
            })
        
        self.set_phase("completed")
        return array

    def find_max_index(self, array: List[Any], size: int) -> int:
        """
        Find the index of the maximum element in a subarray.
        
        Args:
            array: Input array
            size: Size of the subarray (from start)
            
        Returns:
            Index of the maximum element
        """
        max_idx = 0
        
        for i in range(size):
            if self.compare(array[i], array[max_idx]) > 0:
                max_idx = i
        
        return max_idx

    def find_min_index(self, array: List[Any], start: int, end: int) -> int:
        """
        Find the index of the minimum element in a range.
        
        Args:
            array: Input array
            start: Start index (inclusive)
            end: End index (exclusive)
            
        Returns:
            Index of the minimum element
        """
        min_idx = start
        
        for i in range(start, end):
            if self.compare(array[i], array[min_idx]) < 0:
                min_idx = i
        
        return min_idx

    def flip(self, array: List[Any], k: int, options: Dict[str, Any]) -> None:
        """
        Flip a subarray from index 0 to k.
        
        Args:
            array: Array to modify
            k: End index of flip operation (inclusive)
            options: Runtime options
        """
        # Increment flip count
        self.flip_count += 1
        
        # Record flip operation if tracking metrics
        if options["track_flip_metrics"]:
            self.flip_sequence.append(k + 1)  # 1-indexed for conventional pancake notation
        
        # Introduce delay for visualization if specified
        if options["animation_delay"] > 0:
            time.sleep(options["animation_delay"] / 1000)
        
        # Reverse the elements from 0 to k
        i = 0
        while i < k:
            # Swap elements at i and k
            self.swap(array, i, k)
            i += 1
            k -= 1

    def get_complexity(self) -> Dict[str, Dict[str, str]]:
        """
        Get the time and space complexity of Pancake Sort.
        
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
            },
            "flips": {
                "upper_bound": "2n - 3",  # Upper bound on the number of flips
                "lower_bound": "15n/14"   # Lower bound (Heydari-Sobhi)
            }
        }

    def is_stable(self) -> bool:
        """
        Whether Pancake Sort is stable (preserves relative order of equal elements).
        
        Returns:
            False as Pancake Sort is not stable
        """
        return False

    def is_in_place(self) -> bool:
        """
        Whether Pancake Sort is in-place (uses O(1) auxiliary space).
        
        Returns:
            True as Pancake Sort is in-place
        """
        return True
    
    def get_info(self) -> Dict[str, Any]:
        """
        Get detailed information about the algorithm.
        
        Returns:
            Dictionary with algorithm details
        """
        info = super().get_info()
        
        # Add pancake sort specific information
        info.update({
            "optimization": {
                "visualize_flips": self.options.get("visualize_flips", True),
                "optimized_strategy": self.options.get("optimized_strategy", True),
                "find_minimum": self.options.get("find_minimum", False),
                "track_flip_metrics": self.options.get("track_flip_metrics", True)
            },
            "properties": {
                "comparison_based": True,
                "stable": False,
                "in_place": True,
                "online": False,
                "prefix_reversal": True
            },
            "suitable_for": {
                "small_arrays": True,
                "prefix_reversal_problems": True,
                "theoretical_study": True,
                "genomics_research": True
            },
            "variants": [
                "Standard Pancake Sort",
                "Optimized Pancake Sort (fewer flips)",
                "Burnt Pancake Sort (both sides matter)",
                "Prefix Reversal Problem variant"
            ],
            "advantages": [
                "Simple to understand and implement",
                "In-place with O(1) auxiliary space",
                "Useful for studying prefix reversal problems",
                "Connected to problems in computational biology",
                "Interesting theoretical properties"
            ],
            "disadvantages": [
                "Not practical for real-world sorting applications",
                "O(n²) time complexity is inefficient for large arrays",
                "Not stable (does not preserve order of equal elements)",
                "Requires more element movements than other sorting algorithms"
            ],
            "application_domains": [
                "Computational Biology (genome rearrangement problems)",
                "Network routing (permutation routing)",
                "Parallel processing task scheduling",
                "Theoretical Computer Science (prefix reversal distance problems)"
            ],
            "history": {
                "origin": "Puzzle problem introduced by mathematician Jacob E. Goodman (under pseudonym Harry Dweighter - 'harried waiter')",
                "notes": "Named after the problem of sorting a stack of pancakes by size using a spatula to flip prefixes"
            },
            "metrics": {
                "flip_count": self.flip_count,
                "flip_sequence": self.flip_sequence
            }
        })
        
        return info


# Example usage
if __name__ == "__main__":
    # Create and run a simple test
    sorter = PancakeSort({
        "visualize_flips": True,
        "optimized_strategy": True
    })
    
    test_array = [5, 3, 8, 4, 2, 9, 1, 7, 6]
    
    result = sorter.execute(test_array)
    print(f"Original: {test_array}")
    print(f"Sorted: {result}")
    print(f"Comparisons: {sorter.metrics['comparisons']}")
    print(f"Flips: {sorter.flip_count}")
    print(f"Flip sequence: {sorter.flip_sequence}")
