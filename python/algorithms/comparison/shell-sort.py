# algorithms/sorting/shell_sort.py

from typing import List, Any, Dict, Optional, Callable, Tuple, Set
from algorithms.base_algorithm import Algorithm
import math
import time

class ShellSort(Algorithm):
    """
    Implementation of Shell Sort with multiple gap sequence strategies and optimizations.
    
    Shell Sort is a generalization of insertion sort that allows the exchange of items that are
    far apart. The algorithm sorts elements that are distant from each other, gradually reducing
    the gap between elements to be compared until the gap is 1 (regular insertion sort).
    
    This implementation includes multiple gap sequences and optimizations:
    - Original Shell sequence: N/2, N/4, ..., 1
    - Knuth sequence: (3^k - 1)/2, where k ≥ 1 and (3^k - 1)/2 < N
    - Sedgewick sequence: 1, 8, 23, 77, 281, 1073, 4193, 16577, ...
    - Hibbard sequence: 2^k - 1, where k ≥ 1
    - Pratt sequence: 2^i * 3^j, where i,j ≥ 0
    
    Time Complexity:
    - Best:    O(n log n) - Depends on gap sequence
    - Average: O(n log² n) to O(n^(4/3)) depending on gap sequence
    - Worst:   O(n²) for original Shell sequence, O(n^(3/2)) for Hibbard
    
    Space Complexity: O(1) - In-place sorting algorithm
    """
    
    def __init__(self, options: Dict[str, Any] = None):
        """
        Initialize Shell Sort with options.
        
        Args:
            options: Dictionary of options including:
                - gap_sequence: Gap sequence to use ('shell', 'knuth', 'sedgewick', etc.)
                - optimized_comparisons: Use binary search for large gaps
                - visualize_gaps: Visualize gap sequences
                - enhanced_instrumentation: Use enhanced operation instrumentation
        """
        super().__init__("Shell Sort", "comparison", options)
        
        # Default options
        self.options.update({
            "gap_sequence": "sedgewick",     # Gap sequence strategy
            "optimized_comparisons": True,   # Use optimized comparisons
            "visualize_gaps": True,          # Visualize gap sequences
            "enhanced_instrumentation": True, # Enhanced operation instrumentation
            "animation_delay": 0             # Delay between steps for visualization
        })
        
        # Override with provided options
        if options:
            self.options.update(options)
        
        # Gap sequence generators
        self.gap_generators = {
            "shell": self.shell_sequence,
            "knuth": self.knuth_sequence,
            "sedgewick": self.sedgewick_sequence,
            "hibbard": self.hibbard_sequence,
            "pratt": self.pratt_sequence
        }

    def run(self, array: List[Any], options: Dict[str, Any]) -> List[Any]:
        """
        Execute Shell Sort on the provided array.
        
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
        
        # Get gap sequence
        gap_sequence_name = options["gap_sequence"].lower()
        gap_generator = self.gap_generators.get(
            gap_sequence_name, 
            self.gap_generators["sedgewick"]
        )
        
        # Generate gaps
        gaps = gap_generator(n)
        
        # Record the selected gap sequence
        self.record_state(result, {
            "type": "gap-sequence-selected",
            "sequence": gap_sequence_name,
            "gaps": gaps,
            "message": f"Using {gap_sequence_name} gap sequence: [{', '.join(map(str, gaps))}]"
        })
        
        # For each gap in the sequence
        for gap in gaps:
            # Record current gap
            if options["visualize_gaps"]:
                self.record_state(result, {
                    "type": "gap-change",
                    "gap": gap,
                    "message": f"Processing elements with gap {gap}"
                })
            
            # Perform an insertion sort for elements at the current gap
            for i in range(gap, n):
                # Store current element
                temp = self.read(result, i)
                j = i
                
                # Introduce delay for visualization if specified
                if options["animation_delay"] > 0:
                    time.sleep(options["animation_delay"] / 1000)
                
                # Optimization: Use binary search for finding insertion position for large gaps
                if options["optimized_comparisons"] and gap > 10:
                    # Find insertion position with binary search
                    insert_pos = self.binary_search_insertion_pos(result, temp, i - gap, gap)
                    
                    # Shift elements to the right
                    if insert_pos < i:
                        for k in range(i, insert_pos, -gap):
                            self.write(result, k, self.read(result, k - gap))
                            
                            # Record shift with large gap
                            if options["enhanced_instrumentation"]:
                                self.record_state(result, {
                                    "type": "gap-shift",
                                    "source": k - gap,
                                    "target": k,
                                    "gap": gap,
                                    "message": f"Shifted element {result[k]} from position {k-gap} to {k} (gap = {gap})"
                                })
                        
                        # Insert at correct position
                        self.write(result, insert_pos, temp)
                        
                        # Record insertion
                        self.record_state(result, {
                            "type": "gap-insert",
                            "position": insert_pos,
                            "value": temp,
                            "gap": gap,
                            "message": f"Inserted element {temp} at position {insert_pos} (gap = {gap})"
                        })
                else:
                    # Standard comparison-based gap insertion
                    while j >= gap and self.compare(self.read(result, j - gap), temp) > 0:
                        # Record comparison
                        if options["enhanced_instrumentation"]:
                            self.record_state(result, {
                                "type": "gap-comparison",
                                "indices": [j - gap, i],
                                "values": [result[j - gap], temp],
                                "gap": gap,
                                "message": f"Comparing elements at positions {j-gap} and {i} with gap {gap}"
                            })
                        
                        # Shift element right by gap
                        self.write(result, j, self.read(result, j - gap))
                        
                        # Record shift
                        if options["enhanced_instrumentation"]:
                            self.record_state(result, {
                                "type": "gap-shift",
                                "source": j - gap,
                                "target": j,
                                "gap": gap,
                                "message": f"Shifted element {result[j]} from position {j-gap} to {j} (gap = {gap})"
                            })
                        
                        j -= gap
                    
                    # Put temp in its correct position
                    if j != i:
                        self.write(result, j, temp)
                        
                        # Record insertion
                        self.record_state(result, {
                            "type": "gap-insert",
                            "position": j,
                            "value": temp,
                            "gap": gap,
                            "message": f"Inserted element {temp} at position {j} (gap = {gap})"
                        })
            
            # Record completion of current gap phase
            self.record_state(result, {
                "type": "gap-complete",
                "gap": gap,
                "message": f"Completed sorting with gap {gap}"
            })
        
        self.set_phase("completed")
        return result

    def binary_search_insertion_pos(self, array: List[Any], key: Any, end: int, gap: int) -> int:
        """
        Find insertion position using binary search for a given gap.
        This optimization reduces comparisons for large gaps.
        
        Args:
            array: Array to search
            key: Value to insert
            end: End index (inclusive)
            gap: Current gap
            
        Returns:
            Index where key should be inserted
        """
        start = 0
        
        # Binary search on the gap-separated subarray
        while start <= end:
            mid = (start + end) // 2
            mid_index = mid * gap
            
            cmp = self.compare(array[mid_index], key)
            
            if cmp < 0:
                start = mid + 1
            elif cmp > 0:
                end = mid - 1
            else:
                # Found an equal element, insert after it (stable)
                return mid_index + gap
        
        return start * gap

    def shell_sequence(self, n: int) -> List[int]:
        """
        Generate Shell's original gap sequence: N/2, N/4, ..., 1
        
        Args:
            n: Array length
            
        Returns:
            Gap sequence
        """
        gaps = []
        gap = n // 2
        
        while gap > 0:
            gaps.append(gap)
            gap = gap // 2
        
        return gaps

    def knuth_sequence(self, n: int) -> List[int]:
        """
        Generate Knuth's gap sequence: (3^k - 1)/2, where k ≥ 1 and (3^k - 1)/2 < N
        
        Args:
            n: Array length
            
        Returns:
            Gap sequence
        """
        gaps = []
        gap = 1
        
        # Generate sequence in ascending order first
        while gap < n / 3:
            gap = 3 * gap + 1
        
        # Add in descending order
        while gap > 0:
            gaps.append(gap)
            gap = gap // 3
        
        return gaps

    def sedgewick_sequence(self, n: int) -> List[int]:
        """
        Generate Sedgewick's gap sequence
        1, 8, 23, 77, 281, 1073, 4193, 16577, ...
        
        Args:
            n: Array length
            
        Returns:
            Gap sequence
        """
        gaps = []
        k = 0
        gap = 0
        
        # Generate sequence in ascending order first
        while True:
            if k % 2 == 0:
                gap = 9 * (4 ** (k // 2)) - 9 * (2 ** (k // 2)) + 1
            else:
                gap = (4 ** ((k // 2) + 1)) - 3 * (2 ** (k // 2)) + 1
            
            if gap >= n:
                break
                
            gaps.append(gap)
            k += 1
        
        # Reverse to get descending sequence
        return sorted(gaps, reverse=True)

    def hibbard_sequence(self, n: int) -> List[int]:
        """
        Generate Hibbard's gap sequence: 2^k - 1, where k ≥ 1
        1, 3, 7, 15, 31, 63, 127, 255, ...
        
        Args:
            n: Array length
            
        Returns:
            Gap sequence
        """
        gaps = []
        k = 1
        gap = (2 ** k) - 1
        
        # Generate sequence in ascending order first
        while gap < n:
            gaps.append(gap)
            k += 1
            gap = (2 ** k) - 1
        
        # Reverse to get descending sequence
        return sorted(gaps, reverse=True)

    def pratt_sequence(self, n: int) -> List[int]:
        """
        Generate Pratt's gap sequence: 2^i * 3^j, where i,j ≥ 0
        1, 2, 3, 4, 6, 8, 9, 12, 16, 18, 24, 27, ...
        
        Args:
            n: Array length
            
        Returns:
            Gap sequence
        """
        gaps = set([1])  # Use set to avoid duplicates
        
        # Generate all possible 2^i * 3^j combinations
        for i in range(20):
            pow_i = 2 ** i
            if pow_i >= n:
                break
            
            for j in range(15):
                pow_j = 3 ** j
                gap = pow_i * pow_j
                
                if gap < n:
                    gaps.add(gap)
                else:
                    break
        
        # Convert to list, sort, and reverse
        return sorted(list(gaps), reverse=True)

    def get_complexity(self) -> Dict[str, Dict[str, str]]:
        """
        Get the time and space complexity of Shell Sort.
        
        Returns:
            Complexity information dictionary
        """
        # Complexity depends on gap sequence
        time_worst = ""
        time_average = ""
        
        gap_sequence = self.options["gap_sequence"].lower()
        
        if gap_sequence == "shell":
            time_worst = "O(n²)"
            time_average = "O(n²)"
        elif gap_sequence == "hibbard":
            time_worst = "O(n^(3/2))"
            time_average = "O(n^(5/4))"
        elif gap_sequence == "sedgewick":
            time_worst = "O(n^(4/3))"
            time_average = "O(n^(4/3))"
        elif gap_sequence == "knuth":
            time_worst = "O(n^(3/2))"
            time_average = "O(n^(3/2))"
        elif gap_sequence == "pratt":
            time_worst = "O(n log² n)"
            time_average = "O(n log² n)"
        else:
            time_worst = "O(n²)"
            time_average = "O(n log² n)"
        
        return {
            "time": {
                "best": "O(n log n)",
                "average": time_average,
                "worst": time_worst
            },
            "space": {
                "best": "O(1)",
                "average": "O(1)",
                "worst": "O(1)"
            }
        }

    def is_stable(self) -> bool:
        """
        Whether Shell Sort is stable (preserves relative order of equal elements).
        
        Returns:
            False as Shell Sort is not stable
        """
        return False

    def is_in_place(self) -> bool:
        """
        Whether Shell Sort is in-place (uses O(1) auxiliary space).
        
        Returns:
            True as Shell Sort is in-place
        """
        return True
    
    def get_info(self) -> Dict[str, Any]:
        """
        Get detailed information about the algorithm.
        
        Returns:
            Dictionary with algorithm details
        """
        info = super().get_info()
        
        # Add shell sort specific information
        info.update({
            "optimization": {
                "gap_sequence": self.options.get("gap_sequence", "sedgewick"),
                "optimized_comparisons": self.options.get("optimized_comparisons", True),
                "visualize_gaps": self.options.get("visualize_gaps", True),
                "enhanced_instrumentation": self.options.get("enhanced_instrumentation", True)
            },
            "properties": {
                "comparison_based": True,
                "stable": False,
                "in_place": True,
                "adaptive": True,
                "online": False
            },
            "suitable_for": {
                "small_arrays": True,
                "medium_arrays": True,
                "nearly_sorted_arrays": True,
                "large_arrays": False,
                "limited_memory": True
            },
            "gap_sequences": {
                "shell": {
                    "description": "Original Shell sequence: N/2, N/4, ..., 1",
                    "complexity": "O(n²)",
                    "formula": "floor(n/2^k)"
                },
                "knuth": {
                    "description": "Knuth sequence: (3^k - 1)/2",
                    "complexity": "O(n^(3/2))",
                    "formula": "floor((3^k - 1) / 2)"
                },
                "sedgewick": {
                    "description": "Sedgewick's sequence: 1, 8, 23, 77, 281, 1073, ...",
                    "complexity": "O(n^(4/3))",
                    "formula": "4^k + 3*2^(k-1) + 1 or 9*4^k - 9*2^k + 1"
                },
                "hibbard": {
                    "description": "Hibbard's sequence: 2^k - 1",
                    "complexity": "O(n^(3/2))",
                    "formula": "2^k - 1"
                },
                "pratt": {
                    "description": "Pratt's sequence: 2^i * 3^j where i,j ≥ 0",
                    "complexity": "O(n log² n)",
                    "formula": "2^i * 3^j"
                }
            },
            "advantages": [
                "Improved version of insertion sort with better performance",
                "In-place algorithm with O(1) space complexity",
                "Simple implementation with few lines of code",
                "Excellent for medium-sized arrays (few hundred to few thousand elements)",
                "Adaptive to partially sorted arrays",
                "Performs well on arrays that are already partially sorted"
            ],
            "disadvantages": [
                "Not stable (does not preserve order of equal elements)",
                "Complexity heavily depends on gap sequence chosen",
                "Performance not competitive with quicksort or mergesort for large arrays",
                "Gap sequence selection requires careful consideration"
            ],
            "history_and_context": {
                "inventor": "Donald Shell",
                "year": 1959,
                "significance": "First algorithm to improve insertion sort from O(n²) complexity",
                "development_context": "Shell published the algorithm in the Communications of the ACM, " +
                    "proposing it as a significant improvement over existing sorting methods"
            }
        })
        
        return info


# Example usage
if __name__ == "__main__":
    # Create and run a simple test
    sorter = ShellSort({
        "gap_sequence": "sedgewick",
        "optimized_comparisons": True,
        "enhanced_instrumentation": True
    })
    
    test_array = [5, 3, 8, 4, 2, 9, 1, 7, 6]
    
    result = sorter.execute(test_array)
    print(f"Original: {test_array}")
    print(f"Sorted: {result}")
    print(f"Comparisons: {sorter.metrics['comparisons']}")
    print(f"Swaps: {sorter.metrics['swaps']}")
