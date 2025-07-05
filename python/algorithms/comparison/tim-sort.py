# algorithms/sorting/tim_sort.py

from typing import List, Any, Dict, Optional, Callable, Tuple, TypeVar
from algorithms.base_algorithm import Algorithm
import time
import math

T = TypeVar('T')  # Type variable for generic types

class TimSort(Algorithm):
    """
    Implementation of Tim Sort - an adaptive, stable, natural merging sort
    derived from merge sort and insertion sort.
    
    Tim Sort was developed by Tim Peters in 2002 for the Python programming language.
    It's a hybrid stable sorting algorithm that combines the strengths of merge sort
    and insertion sort, designed to perform well on many real-world data patterns.
    
    Key features:
    - Stable (preserves relative order of equal elements)
    - Adaptive (exploits existing order in the input data)
    - Natural (identifies and merges pre-sorted subsequences or "runs")
    - O(n log n) worst-case time complexity
    - O(n) best-case time complexity for already-sorted inputs
    
    The algorithm includes several optimizations:
    1. Identification and utilization of natural runs
    2. Binary insertion sort for small runs
    3. Galloping mode for merge operation
    4. Run length computation based on input size
    5. Merge operations designed to maintain stability
    6. Specialized merging for adjacent runs
    
    Time Complexity:
    - Best:    O(n) for already sorted input
    - Average: O(n log n)
    - Worst:   O(n log n)
    
    Space Complexity:
    - O(n) for auxiliary storage in merge operations
    """
    
    def __init__(self, options: Dict[str, Any] = None):
        """
        Initialize Tim Sort with options.
        
        Args:
            options: Dictionary of options including:
                - min_run: Minimum run size (or compute automatically if 0)
                - use_galloping: Enable galloping mode for merges
                - use_natural_runs: Identify and use natural runs
                - galloping_threshold: Consecutive wins to enter galloping mode
        """
        super().__init__("Tim Sort", "comparison", options)
        
        # Default options
        self.options.update({
            "min_run": 32,                   # Minimum length of a run
            "use_galloping": True,           # Use galloping mode for merges
            "use_natural_runs": True,        # Identify and use natural runs
            "galloping_threshold": 7,        # Consecutive wins to enter galloping mode
            "animation_delay": 0             # Delay between steps for visualization
        })
        
        # Override with provided options
        if options:
            self.options.update(options)

    def run(self, array: List[T], options: Dict[str, Any]) -> List[T]:
        """
        Execute Tim Sort on the provided array.
        
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
            
        self.set_phase("run-identification")
        
        # Compute the minimum run length
        min_run = options["min_run"] if options["min_run"] > 0 else self.compute_min_run(n)
        
        # Stack of pending runs to be merged
        run_stack = []
        
        # Process the array by identifying runs and merging them
        current_position = 0
        
        while current_position < n:
            # Identify a run (either natural or forced)
            run_start = current_position
            
            # Look for a natural run if enabled
            if options["use_natural_runs"]:
                current_position = self.identify_natural_run(result, current_position, n)
            else:
                # Always process at least two elements
                current_position = min(n - 1, current_position + 1)
            
            # Check if the run is ascending, descending, or a single element
            is_descending = (current_position > run_start and 
                           self.compare(result[run_start], result[run_start + 1]) > 0)
            
            # If descending, reverse the run
            if is_descending:
                self.reverse_run(result, run_start, current_position)
                
                self.record_state(result, {
                    "type": "run-reversal",
                    "run_start": run_start,
                    "run_end": current_position,
                    "message": f"Reversed descending run from index {run_start} to {current_position}"
                })
            elif current_position == run_start:
                # If single element run, move to next position
                current_position += 1
            
            # Extend run to min_run length if it's too short (unless we reached the end)
            run_end = current_position
            if run_end < n:
                run_end = min(n - 1, run_start + min_run - 1)
                
                # Sort this segment with insertion sort
                self.binary_insertion_sort(result, run_start, run_end)
                current_position = run_end + 1
            
            # Record the identified and potentially extended run
            self.record_state(result, {
                "type": "run-identification",
                "run_start": run_start,
                "run_end": run_end,
                "message": f"Identified run from index {run_start} to {run_end}"
            })
            
            # Push the current run onto the stack
            run_stack.append({
                "start": run_start,
                "length": run_end - run_start + 1
            })
            
            # Merge runs if necessary to maintain the invariants
            self.merge_collapse(result, run_stack)
        
        self.set_phase("final-merging")
        
        # Final merging of all remaining runs
        self.merge_force(result, run_stack)
        
        self.set_phase("completed")
        return result

    def compute_min_run(self, n: int) -> int:
        """
        Compute the minimum run length for efficiency.
        Original Tim Sort computes this based on array size.
        
        Args:
            n: Array length
            
        Returns:
            Minimum run length
        """
        # Compute a value in the range [16, 32] such that
        # n/min_run is close to, but not less than, a power of 2
        r = 0
        while n >= 64:
            r |= n & 1
            n >>= 1
        return n + r

    def identify_natural_run(self, array: List[T], start: int, length: int) -> int:
        """
        Identify a natural run in the array.
        A run is a sequence of already sorted elements.
        
        Args:
            array: The array to examine
            start: Start index
            length: Array length
            
        Returns:
            End index of the run (inclusive)
        """
        # Handle case where we're at the end of the array
        if start >= length - 1:
            return start
        
        # Determine if the run is ascending or descending
        descending = False
        
        # Start by checking the first two elements
        if self.compare(array[start], array[start + 1]) > 0:
            descending = True
        
        # Continue the run as long as elements maintain the established order
        end = start + 1
        
        if descending:
            # Look for a descending run
            while end < length - 1 and self.compare(array[end], array[end + 1]) >= 0:
                end += 1
        else:
            # Look for an ascending run
            while end < length - 1 and self.compare(array[end], array[end + 1]) <= 0:
                end += 1
        
        # Record the natural run info
        self.record_state(array, {
            "type": "natural-run",
            "run_start": start,
            "run_end": end,
            "is_descending": descending,
            "message": f"Identified {'descending' if descending else 'ascending'} natural run from {start} to {end}"
        })
        
        return end

    def reverse_run(self, array: List[T], start: int, end: int) -> None:
        """
        Reverse a run in-place.
        
        Args:
            array: The array containing the run
            start: Start index
            end: End index (inclusive)
        """
        while start < end:
            self.swap(array, start, end)
            start += 1
            end -= 1

    def binary_insertion_sort(self, array: List[T], start: int, end: int) -> None:
        """
        Sort a small range using binary insertion sort.
        
        Args:
            array: The array to sort
            start: Start index
            end: End index (inclusive)
        """
        self.record_state(array, {
            "type": "insertion-start",
            "section": [start, end],
            "message": f"Sorting range [{start}...{end}] with binary insertion sort"
        })
        
        for i in range(start + 1, end + 1):
            pivot_value = self.read(array, i)
            
            # Find insertion position using binary search
            insert_pos = self.binary_search(array, pivot_value, start, i - 1)
            
            # Shift elements to make room for the pivot
            for j in range(i - 1, insert_pos - 1, -1):
                self.write(array, j + 1, self.read(array, j))
            
            # Insert the pivot value
            self.write(array, insert_pos, pivot_value)
            
            # Record this insertion operation
            self.record_state(array, {
                "type": "insertion-step",
                "pivot": pivot_value,
                "insert_position": insert_pos,
                "section": [start, end],
                "message": f"Inserted value {pivot_value} at position {insert_pos}"
            })
        
        self.record_state(array, {
            "type": "insertion-complete",
            "section": [start, end],
            "message": f"Completed insertion sort for range [{start}...{end}]"
        })

    def binary_search(self, array: List[T], value: T, lo: int, hi: int) -> int:
        """
        Binary search to find insertion position.
        
        Args:
            array: The array to search
            value: The value to insert
            lo: Lower bound
            hi: Upper bound
            
        Returns:
            Insertion position
        """
        while lo <= hi:
            mid = lo + ((hi - lo) >> 1)
            mid_value = self.read(array, mid)
            
            comparison = self.compare(mid_value, value)
            
            if comparison < 0:
                lo = mid + 1
            elif comparison > 0:
                hi = mid - 1
            else:
                # For stability, insert after equal elements
                lo = mid + 1
        
        return lo

    def merge_collapse(self, array: List[T], run_stack: List[Dict[str, int]]) -> None:
        """
        Check stack invariants and merge runs if necessary.
        
        Args:
            array: The array being sorted
            run_stack: Stack of pending runs
        """
        # Merge adjacent runs if they don't satisfy the invariants:
        # 1. run_stack[n-2].length > run_stack[n-1].length
        # 2. run_stack[n-3].length > run_stack[n-2].length + run_stack[n-1].length
        
        while len(run_stack) > 1:
            n = len(run_stack)
            
            if ((n >= 2 and run_stack[n-2]["length"] <= run_stack[n-1]["length"]) or
                (n >= 3 and run_stack[n-3]["length"] <= run_stack[n-2]["length"] + run_stack[n-1]["length"])):
                
                if n >= 3 and run_stack[n-3]["length"] < run_stack[n-1]["length"]:
                    # Merge run n-3 and n-2
                    self.merge_runs(array, run_stack, n-3)
                else:
                    # Merge run n-2 and n-1
                    self.merge_runs(array, run_stack, n-2)
            else:
                # Invariants satisfied, no merging needed
                break

    def merge_force(self, array: List[T], run_stack: List[Dict[str, int]]) -> None:
        """
        Force merging of all runs in the stack.
        
        Args:
            array: The array being sorted
            run_stack: Stack of pending runs
        """
        while len(run_stack) > 1:
            n = len(run_stack)
            if n >= 2:
                i = n - 2
                if i > 0 and run_stack[i-1]["length"] < run_stack[i+1]["length"]:
                    i -= 1
                self.merge_runs(array, run_stack, i)
            else:
                break

    def merge_runs(self, array: List[T], run_stack: List[Dict[str, int]], i: int) -> None:
        """
        Merge two adjacent runs.
        
        Args:
            array: The array being sorted
            run_stack: Stack of pending runs
            i: Index of the first run to merge
        """
        run1 = run_stack[i]
        run2 = run_stack[i+1]
        
        start1 = run1["start"]
        end1 = start1 + run1["length"] - 1
        start2 = run2["start"]
        end2 = start2 + run2["length"] - 1
        
        # Record the merge operation
        self.record_state(array, {
            "type": "merge-start",
            "run1": [start1, end1],
            "run2": [start2, end2],
            "message": f"Starting merge of runs [{start1}...{end1}] and [{start2}...{end2}]"
        })
        
        # Introduce delay for visualization if specified
        if self.options["animation_delay"] > 0:
            time.sleep(self.options["animation_delay"] / 1000)
        
        # Merge the two runs
        self.merge_adjacent_runs(array, start1, end1, end2, self.options)
        
        # Update the stack
        run_stack[i] = {
            "start": start1,
            "length": run1["length"] + run2["length"]
        }
        run_stack.pop(i+1)
        
        # Record the merge completion
        self.record_state(array, {
            "type": "merge-complete",
            "merged_run": [start1, end2],
            "message": f"Completed merge of runs into [{start1}...{end2}]"
        })

    def merge_adjacent_runs(self, array: List[T], start1: int, end1: int, end2: int, options: Dict[str, Any]) -> None:
        """
        Merge two adjacent runs in-place.
        
        Args:
            array: The array being sorted
            start1: Start of first run
            end1: End of first run
            end2: End of second run
            options: Algorithm options
        """
        # If first run is small enough, use in-place merge
        # Otherwise, use temporary buffer
        len1 = end1 - start1 + 1
        len2 = end2 - (end1 + 1) + 1
        
        # Create a temporary buffer for the first run
        buffer = [None] * len1
        for i in range(len1):
            buffer[i] = self.read(array, start1 + i)
        
        # Track galloping mode state
        galloping = False
        consecutive_wins = 0
        
        # Merge positions
        dest = start1
        cursor1 = 0         # Position in buffer
        cursor2 = end1 + 1  # Position in second run
        
        while cursor1 < len1 and cursor2 <= end2:
            # Introduce delay for visualization if specified
            if options["animation_delay"] > 0:
                time.sleep(options["animation_delay"] / 1000)
            
            # Compare current elements
            if self.compare(buffer[cursor1], self.read(array, cursor2)) <= 0:
                # Element from first run is smaller
                self.write(array, dest, buffer[cursor1])
                cursor1 += 1
                dest += 1
                consecutive_wins = consecutive_wins + 1 if galloping else 1
            else:
                # Element from second run is smaller
                self.write(array, dest, self.read(array, cursor2))
                cursor2 += 1
                dest += 1
                consecutive_wins = 0
            
            # Check for galloping mode transition
            if options["use_galloping"] and consecutive_wins >= options["galloping_threshold"]:
                if not galloping:
                    galloping = True
                    self.record_state(array, {
                        "type": "galloping-mode",
                        "position": dest - 1,
                        "message": "Entering galloping mode"
                    })
                
                # Gallop through the winning run
                dest = self.gallop_merge(array, buffer, cursor1, len1, cursor2, end2, dest, galloping)
                
                # Reset galloping after a gallop merge
                galloping = False
                consecutive_wins = 0
            
            # Periodically record the merging progress
            if (dest - start1) % 10 == 0 or dest > end2 - 5:
                self.record_state(array, {
                    "type": "merge-progress",
                    "progress": (dest - start1) / (end2 - start1 + 1),
                    "buffer1_cursor": cursor1,
                    "array2_cursor": cursor2,
                    "message": f"Merge progress: {int(((dest - start1) / (end2 - start1 + 1)) * 100)}%"
                })
        
        # Copy any remaining elements from buffer (first run)
        while cursor1 < len1:
            self.write(array, dest, buffer[cursor1])
            cursor1 += 1
            dest += 1
        
        # Second run is already in place
        
        self.record_state(array, {
            "type": "merge-cleanup",
            "merged_section": [start1, end2],
            "message": f"Final cleanup of merged section [{start1}...{end2}]"
        })

    def gallop_merge(self, array: List[T], buffer: List[T], cursor1: int, len1: int, 
                   cursor2: int, end2: int, dest: int, winning1: bool) -> int:
        """
        Perform galloping merge to skip through runs when consecutive elements
        come from the same run.
        
        Args:
            array: The array being sorted
            buffer: Buffer containing the first run
            cursor1: Current position in buffer
            len1: Length of first run
            cursor2: Current position in second run
            end2: End position of second run
            dest: Current destination position
            winning1: Whether run1 has consecutive wins
            
        Returns:
            Updated destination position
        """
        if winning1:
            # Find how many elements from run1 are less than the first element of run2
            run2_element = self.read(array, cursor2)
            advance_count = self.gallop_search(buffer, run2_element, cursor1, len1, True)
            
            # Copy these elements in one go
            for i in range(advance_count):
                self.write(array, dest + i, buffer[cursor1 + i])
            
            dest += advance_count
            cursor1 += advance_count
            
            self.record_state(array, {
                "type": "gallop-advance",
                "count": advance_count,
                "run": 1,
                "message": f"Galloped {advance_count} elements from run 1"
            })
        else:
            # Find how many elements from run2 are less than or equal to the first element of buffer
            run1_element = buffer[cursor1]
            advance_count = self.gallop_search(array, run1_element, cursor2, end2 - cursor2 + 1, False)
            
            # Copy these elements in one go
            for i in range(advance_count):
                self.write(array, dest + i, self.read(array, cursor2 + i))
            
            dest += advance_count
            cursor2 += advance_count
            
            self.record_state(array, {
                "type": "gallop-advance",
                "count": advance_count,
                "run": 2,
                "message": f"Galloped {advance_count} elements from run 2"
            })
        
        return dest

    def gallop_search(self, array: List[T], key: T, start: int, length: int, is_buffer: bool) -> int:
        """
        Binary gallop search to find position for insertion.
        
        Args:
            array: The array to search in
            key: The value to search for
            start: Start index
            length: Length to search
            is_buffer: Whether we're searching in the buffer
            
        Returns:
            Number of elements to advance
        """
        # Gallop by powers of 2 to find an upper bound
        offset = 1
        last_offset = 0
        
        # When searching run1 (buffer), we're looking for the rightmost position
        # where buffer[pos] < key
        
        # When searching run2 (array), we're looking for the rightmost position
        # where array[pos] <= key (note the equality for stability)
        
        def compare_func(a: T, b: T) -> bool:
            if is_buffer:
                return self.compare(a, b) < 0  # For buffer: a < b
            else:
                return self.compare(a, b) <= 0  # For array: a <= b
        
        # Find an offset that overshoots
        while offset < length:
            pos = start + offset - 1
            element = array[pos] if is_buffer else self.read(array, pos)
            
            if not compare_func(element, key):
                break
            
            last_offset = offset
            offset = min(offset * 2, length)
        
        # Cap the offset at the length
        offset = min(offset, length)
        
        # Binary search between the last good offset and current offset
        low = start + last_offset - 1
        high = start + offset - 1
        
        while low <= high:
            mid = low + ((high - low) >> 1)
            element = array[mid] if is_buffer else self.read(array, mid)
            
            if compare_func(element, key):
                low = mid + 1
            else:
                high = mid - 1
        
        return low - start

    def get_complexity(self) -> Dict[str, Dict[str, str]]:
        """
        Get the time and space complexity of Tim Sort.
        
        Returns:
            Complexity information dictionary
        """
        return {
            "time": {
                "best": "O(n)",
                "average": "O(n log n)",
                "worst": "O(n log n)"
            },
            "space": {
                "best": "O(n)",
                "average": "O(n)",
                "worst": "O(n)"
            }
        }

    def is_stable(self) -> bool:
        """
        Whether Tim Sort is stable (preserves relative order of equal elements).
        
        Returns:
            True as Tim Sort is stable
        """
        return True

    def is_in_place(self) -> bool:
        """
        Whether Tim Sort is in-place (uses O(1) auxiliary space).
        
        Returns:
            False as Tim Sort uses auxiliary space
        """
        return False
    
    def get_info(self) -> Dict[str, Any]:
        """
        Get detailed information about the algorithm.
        
        Returns:
            Dictionary with algorithm details
        """
        info = super().get_info()
        
        # Add Tim Sort specific information
        info.update({
            "optimization": {
                "min_run": self.options.get("min_run", 32),
                "use_galloping": self.options.get("use_galloping", True),
                "use_natural_runs": self.options.get("use_natural_runs", True),
                "galloping_threshold": self.options.get("galloping_threshold", 7)
            },
            "properties": {
                "comparison_based": True,
                "stable": True,
                "in_place": False,
                "online": False,
                "adaptive": True,
                "natural": True,
                "hybrid": True
            },
            "suitable_for": {
                "small_arrays": True,
                "nearly_sorted_arrays": True,
                "large_arrays": True,
                "real_world_data": True
            },
            "variants": [
                "Standard Tim Sort",
                "Python's Tim Sort implementation",
                "Java's Tim Sort implementation",
                "Android's DualPivotQuicksort (hybrid with similarities to Tim Sort)"
            ],
            "advantages": [
                "Excellent real-world performance",
                "Handles ordered subsequences (runs) very efficiently",
                "Stable sorting (preserves order of equal elements)",
                "Adaptive to input patterns",
                "O(n) best case for already sorted or nearly sorted data",
                "Used in production libraries (Python, Java)"
            ],
            "disadvantages": [
                "More complex implementation than basic sorting algorithms",
                "Requires O(n) auxiliary space",
                "Slightly higher constant factors than some simpler algorithms",
                "Less cache-efficient than in-place algorithms for some workloads"
            ],
            "citations": [
                {
                    "author": "Tim Peters",
                    "title": "TimSort implementation in Python",
                    "year": 2002,
                    "reference": "Python 2.3 and later"
                }
            ]
        })
        
        return info


# Example usage
if __name__ == "__main__":
    # Create and run a simple test
    sorter = TimSort({
        "min_run": 32,
        "use_galloping": True,
        "use_natural_runs": True
    })
    
    test_array = [5, 3, 8, 4, 2, 9, 1, 7, 6]
    
    result = sorter.execute(test_array)
    print(f"Original: {test_array}")
    print(f"Sorted: {result}")
    print(f"Comparisons: {sorter.metrics['comparisons']}")
    print(f"Metrics: {sorter.metrics}")
    print(f"Steps: {len(sorter.history)}")
