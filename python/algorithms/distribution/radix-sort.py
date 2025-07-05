# algorithms/sorting/radix_sort.py

from typing import List, Any, Dict, Optional, Callable, Tuple
from algorithms.base_algorithm import Algorithm
import time
import math

class RadixSort(Algorithm):
    """
    Implementation of Radix Sort with both LSD and MSD variants.
    
    Radix Sort is a non-comparison integer sorting algorithm that processes
    individual digits, sorting numbers by their positional notation. It has
    two primary variants:
    
    1. LSD (Least Significant Digit): Processes digits from right to left
       - Stable sort
       - Simpler implementation
       - Requires a single pass through the data for each digit position
    
    2. MSD (Most Significant Digit): Processes digits from left to right
       - Not inherently stable without extra work
       - More complex recursive implementation
       - Can early-terminate for partially ordered data
    
    Time Complexity: O(w * n) where w is the number of digits and n is the array size
    Space Complexity: O(n + k) where k is the range of digit values (typically 10 for decimal)
    """
    
    def __init__(self, options: Dict[str, Any] = None):
        """
        Initialize Radix Sort with options.
        
        Args:
            options: Dictionary of options including:
                - variant: 'lsd' or 'msd'
                - radix: Base of the number system (default: decimal)
                - use_counting_sort: Use counting sort for digit sorting
                - in_place: Attempt to use less auxiliary memory (MSD only)
                - stable: Ensure stability (matters for MSD)
        """
        super().__init__("Radix Sort", "distribution", options)
        
        # Default options
        self.options.update({
            "variant": "lsd",             # 'lsd' or 'msd'
            "radix": 10,                  # Base of the number system (default: decimal)
            "use_counting_sort": True,    # Use counting sort for digit sorting
            "in_place": False,            # Attempt to use less auxiliary memory (MSD only)
            "stable": True,               # Ensure stability (matters for MSD)
            "animation_delay": 0          # Delay between steps for visualization
        })
        
        # Override with provided options
        if options:
            self.options.update(options)

    def run(self, array: List[Any], options: Dict[str, Any]) -> List[Any]:
        """
        Execute Radix Sort on the provided array.
        
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
        
        self.set_phase("analysis")
        
        # Find the maximum number to determine number of digits
        max_val = max(abs(x) for x in result) if result else 0
        
        # Handle arrays with negative numbers
        has_negative = any(x < 0 for x in result)
        
        # Record initial state
        self.record_state(result, {
            "type": "initialization",
            "max": max_val,
            "has_negative": has_negative,
            "message": f"Analyzing input: max value = {max_val}, contains negative numbers: {has_negative}"
        })
        
        # Choose sorting implementation based on variant
        if options["variant"] == "msd":
            if has_negative:
                # Handle negative numbers for MSD variant
                self._handle_negative_numbers_msd(result, max_val, options)
            else:
                # Sort positive numbers with MSD Radix Sort
                self._msd_radix_sort(result, 0, n - 1, self._get_max_digit_count(max_val, options["radix"]), options)
        else:
            # Default to LSD variant
            if has_negative:
                # Handle negative numbers for LSD variant
                self._handle_negative_numbers_lsd(result, max_val, options)
            else:
                # Sort positive numbers with LSD Radix Sort
                self._lsd_radix_sort(result, max_val, options)
        
        self.set_phase("completed")
        return result

    def _lsd_radix_sort(self, array: List[int], max_val: int, options: Dict[str, Any]) -> None:
        """
        LSD (Least Significant Digit) Radix Sort implementation.
        
        Args:
            array: Array to be sorted
            max_val: Maximum value in the array
            options: Runtime options
        """
        self.set_phase("lsd-sorting")
        
        n = len(array)
        radix = options["radix"]
        
        # Get the number of digits in the maximum number
        max_digit_count = self._get_max_digit_count(max_val, radix)
        
        self.record_state(array, {
            "type": "radix-info",
            "radix": radix,
            "max_digits": max_digit_count,
            "message": f"Starting LSD Radix Sort with base {radix}, maximum of {max_digit_count} digits"
        })
        
        # Process each digit position, starting from the least significant (rightmost)
        exp = 1  # Start with the 1's place
        for digit_place in range(max_digit_count):
            # Record current digit position
            self.record_state(array, {
                "type": "digit-position",
                "position": digit_place,
                "exponent": exp,
                "message": f"Sorting by digit position {digit_place} ({exp}'s place)"
            })
            
            # Introduce delay for visualization if specified
            if options["animation_delay"] > 0:
                time.sleep(options["animation_delay"] / 1000)
            
            # Sort array elements according to the current digit
            if options["use_counting_sort"]:
                self._counting_sort_by_digit(array, exp, radix, options)
            else:
                self._bucket_sort_by_digit(array, exp, radix, options)
            
            # Move to next digit position
            exp *= radix
            
            # Record the array state after sorting this digit position
            self.record_state(array, {
                "type": "lsd-pass-complete",
                "position": digit_place,
                "message": f"Completed sorting pass for digit position {digit_place}"
            })

    def _msd_radix_sort(self, array: List[int], start: int, end: int, digit_position: int, options: Dict[str, Any]) -> None:
        """
        MSD (Most Significant Digit) Radix Sort implementation.
        Recursive implementation that sorts from most significant to least significant digit.
        
        Args:
            array: Array to be sorted
            start: Start index for current recursion
            end: End index for current recursion
            digit_position: Current digit position (max to 0)
            options: Runtime options
        """
        self.set_phase("msd-sorting")
        
        # Base cases
        if start >= end or digit_position < 0:
            return
        
        # Small subarray optimization
        if end - start < 10:
            self._insertion_sort(array, start, end)
            return
        
        radix = options["radix"]
        exp = radix ** digit_position
        
        # Introduce delay for visualization if specified
        if options["animation_delay"] > 0:
            time.sleep(options["animation_delay"] / 1000)
        
        # Record the current recursion state
        self.record_state(array, {
            "type": "msd-recursion",
            "start": start,
            "end": end,
            "digit_position": digit_position,
            "exponent": exp,
            "message": f"MSD sorting from index {start} to {end} at digit position {digit_position}"
        })
        
        # Use counting sort to order by the current digit
        if options["use_counting_sort"]:
            self._counting_sort_by_digit_range(array, exp, radix, start, end, options)
        else:
            # Alternative: bucket sort for this digit
            self._bucket_sort_by_digit_range(array, exp, radix, start, end, options)
        
        # Now recursively sort each bucket (group of elements with the same digit)
        digit_counts = [0] * radix
        
        # Count the frequency of each digit value at the current position
        for i in range(start, end + 1):
            digit = (abs(array[i]) // exp) % radix
            digit_counts[digit] += 1
        
        # Calculate starting position of each digit group
        start_index = start
        for digit in range(radix):
            count = digit_counts[digit]
            if count > 0:
                end_index = start_index + count - 1
                
                # Record the bucket boundaries
                self.record_state(array, {
                    "type": "msd-bucket",
                    "digit": digit,
                    "start": start_index,
                    "end": end_index,
                    "message": f"Processing bucket for digit value {digit} (indices {start_index} to {end_index})"
                })
                
                # Recursively sort this bucket by the next digit position
                self._msd_radix_sort(array, start_index, end_index, digit_position - 1, options)
                
                start_index = end_index + 1

    def _counting_sort_by_digit(self, array: List[int], exp: int, radix: int, options: Dict[str, Any]) -> None:
        """
        Sort array elements by a specific digit using counting sort.
        
        Args:
            array: Array to be sorted
            exp: Exponent for the current digit position (1, 10, 100, etc.)
            radix: Base of the number system
            options: Runtime options
        """
        n = len(array)
        output = [0] * n
        count = [0] * radix
        
        # Store count of occurrences of each digit
        for i in range(n):
            digit = (abs(array[i]) // exp) % radix
            count[digit] += 1
            
            # Record the digit extraction
            if i % max(1, n // 10) == 0:  # Record only some steps for large arrays
                self.record_state(array, {
                    "type": "digit-extraction",
                    "index": i,
                    "value": array[i],
                    "digit": digit,
                    "position": exp,
                    "message": f"Extracted digit {digit} at position {exp} from value {array[i]}"
                })
        
        # Record the digit counts
        self.record_state(array, {
            "type": "digit-counts",
            "counts": count.copy(),
            "message": f"Digit frequency counts at position {exp}: [{', '.join(map(str, count))}]"
        })
        
        # Change count[i] so that count[i] contains the position of this digit in output[]
        for i in range(1, radix):
            count[i] += count[i - 1]
        
        # Record the cumulative counts
        self.record_state(array, {
            "type": "cumulative-counts",
            "counts": count.copy(),
            "message": f"Cumulative counts for stable positioning: [{', '.join(map(str, count))}]"
        })
        
        # Build the output array
        # Process elements in reverse to maintain stability
        for i in range(n - 1, -1, -1):
            digit = (abs(array[i]) // exp) % radix
            position = count[digit] - 1
            output[position] = array[i]
            count[digit] -= 1
            
            # Record significant placement operations
            if i % max(1, n // 10) == 0:  # Record only some steps for large arrays
                self.record_state(array.copy(), {
                    "type": "element-placement",
                    "index": i,
                    "value": array[i],
                    "digit": digit,
                    "position": position,
                    "message": f"Placing element {array[i]} with digit {digit} at output position {position}"
                })
        
        # Copy the output array to the original array
        for i in range(n):
            self.write(array, i, output[i])
        
        # Record the completed pass
        self.record_state(array, {
            "type": "counting-sort-complete",
            "exponent": exp,
            "message": f"Completed counting sort pass for digit position {exp}"
        })

    def _counting_sort_by_digit_range(self, array: List[int], exp: int, radix: int, start: int, end: int, options: Dict[str, Any]) -> None:
        """
        Sort a range of array elements by a specific digit using counting sort.
        Used for MSD Radix Sort on subarrays.
        
        Args:
            array: Array to be sorted
            exp: Exponent for the current digit position
            radix: Base of the number system
            start: Start index of the range
            end: End index of the range
            options: Runtime options
        """
        range_size = end - start + 1
        output = [0] * range_size
        count = [0] * radix
        
        # Store count of occurrences of each digit in the range
        for i in range(start, end + 1):
            digit = (abs(array[i]) // exp) % radix
            count[digit] += 1
        
        # Record the digit counts
        self.record_state(array, {
            "type": "digit-counts",
            "counts": count.copy(),
            "start": start,
            "end": end,
            "message": f"Digit frequency counts at position {exp} for range [{start}..{end}]: [{', '.join(map(str, count))}]"
        })
        
        # Change count[i] so that count[i] contains the position of this digit in output[]
        for i in range(1, radix):
            count[i] += count[i - 1]
        
        # Build the output array
        # Process elements in reverse to maintain stability
        for i in range(end, start - 1, -1):
            digit = (abs(array[i]) // exp) % radix
            position = count[digit] - 1
            output[position] = array[i]
            count[digit] -= 1
            
            # Record significant placement operations
            if (i - start) % max(1, range_size // 10) == 0:
                self.record_state(array.copy(), {
                    "type": "element-placement",
                    "index": i,
                    "value": array[i],
                    "digit": digit,
                    "message": f"Placing element {array[i]} with digit {digit} in output"
                })
        
        # Copy back to original array
        for i in range(range_size):
            self.write(array, start + i, output[i])
        
        # Record the completed pass
        self.record_state(array, {
            "type": "counting-sort-complete",
            "exponent": exp,
            "start": start,
            "end": end,
            "message": f"Completed counting sort pass for digit position {exp} in range [{start}..{end}]"
        })

    def _bucket_sort_by_digit(self, array: List[int], exp: int, radix: int, options: Dict[str, Any]) -> None:
        """
        Sort array elements by a specific digit using bucket sort approach.
        Alternative to counting sort for digit sorting.
        
        Args:
            array: Array to be sorted
            exp: Exponent for the current digit position
            radix: Base of the number system
            options: Runtime options
        """
        n = len(array)
        buckets = [[] for _ in range(radix)]
        
        # Distribute elements into buckets based on the current digit
        for i in range(n):
            digit = (abs(array[i]) // exp) % radix
            buckets[digit].append(array[i])
            
            # Record bucket distribution
            if i % max(1, n // 10) == 0:
                self.record_state(array.copy(), {
                    "type": "bucket-distribution",
                    "index": i,
                    "value": array[i],
                    "digit": digit,
                    "message": f"Placing {array[i]} into bucket {digit} ({exp}'s place digit)"
                })
        
        # Record bucket state
        self.record_state(array, {
            "type": "buckets-filled",
            "buckets": [bucket.copy() for bucket in buckets],
            "message": f"Elements distributed into {radix} buckets by digit at position {exp}"
        })
        
        # Concatenate all buckets back into the original array
        index = 0
        for digit in range(radix):
            bucket = buckets[digit]
            
            # Record that we're processing this bucket
            if bucket:
                self.record_state(array.copy(), {
                    "type": "bucket-processing",
                    "digit": digit,
                    "bucket_size": len(bucket),
                    "message": f"Transferring {len(bucket)} elements from bucket {digit} back to array"
                })
            
            for value in bucket:
                self.write(array, index, value)
                index += 1
        
        # Record the completed pass
        self.record_state(array, {
            "type": "bucket-sort-complete",
            "exponent": exp,
            "message": f"Completed bucket sort pass for digit position {exp}"
        })

    def _bucket_sort_by_digit_range(self, array: List[int], exp: int, radix: int, start: int, end: int, options: Dict[str, Any]) -> None:
        """
        Sort a range of array elements by a specific digit using bucket sort.
        Used for MSD Radix Sort on subarrays.
        
        Args:
            array: Array to be sorted
            exp: Exponent for the current digit position
            radix: Base of the number system
            start: Start index of the range
            end: End index of the range
            options: Runtime options
        """
        range_size = end - start + 1
        buckets = [[] for _ in range(radix)]
        
        # Distribute elements into buckets
        for i in range(start, end + 1):
            digit = (abs(array[i]) // exp) % radix
            buckets[digit].append(array[i])
        
        # Record bucket state
        self.record_state(array, {
            "type": "buckets-filled",
            "buckets": [bucket.copy() for bucket in buckets],
            "start": start,
            "end": end,
            "message": f"Elements from range [{start}..{end}] distributed into buckets by digit at position {exp}"
        })
        
        # Concatenate buckets back into the original array
        index = start
        for digit in range(radix):
            bucket = buckets[digit]
            
            for value in bucket:
                self.write(array, index, value)
                index += 1
        
        # Record the completed pass
        self.record_state(array, {
            "type": "bucket-sort-complete",
            "exponent": exp,
            "start": start,
            "end": end,
            "message": f"Completed bucket sort pass for digit position {exp} in range [{start}..{end}]"
        })

    def _insertion_sort(self, array: List[int], start: int, end: int) -> None:
        """
        Simple insertion sort for small subarrays.
        
        Args:
            array: Array to be sorted
            start: Start index
            end: End index
        """
        for i in range(start + 1, end + 1):
            key = self.read(array, i)
            j = i - 1
            
            while j >= start and self.compare(self.read(array, j), key) > 0:
                self.write(array, j + 1, self.read(array, j))
                j -= 1
            
            self.write(array, j + 1, key)
        
        self.record_state(array, {
            "type": "insertion-sort",
            "start": start,
            "end": end,
            "message": f"Applied insertion sort on small range [{start}..{end}]"
        })

    def _handle_negative_numbers_lsd(self, array: List[int], max_val: int, options: Dict[str, Any]) -> None:
        """
        Handle arrays with negative numbers for LSD variant.
        
        Args:
            array: Array containing negative numbers
            max_val: Maximum absolute value in the array
            options: Runtime options
        """
        self.set_phase("handling-negatives")
        
        n = len(array)
        positives = []
        negatives = []
        
        # Separate positive and negative numbers
        for i in range(n):
            value = self.read(array, i)
            if value < 0:
                negatives.append(-value)  # Store absolute value for sorting
            else:
                positives.append(value)
        
        self.record_state(array, {
            "type": "negative-handling",
            "positive_count": len(positives),
            "negative_count": len(negatives),
            "message": f"Separated into {len(positives)} positive and {len(negatives)} negative numbers"
        })
        
        # Sort positive and negative parts separately
        if positives:
            self._lsd_radix_sort(positives, max_val, options)
        
        if negatives:
            self._lsd_radix_sort(negatives, max_val, options)
            # Reverse and negate the sorted negative numbers
            negatives.reverse()
            negatives = [-num for num in negatives]
        
        # Combine the results: negatives followed by positives
        combined = negatives + positives
        
        # Copy back to the original array
        for i in range(n):
            self.write(array, i, combined[i])
        
        self.record_state(array, {
            "type": "negatives-combined",
            "message": "Combined sorted negative and positive partitions"
        })

    def _handle_negative_numbers_msd(self, array: List[int], max_val: int, options: Dict[str, Any]) -> None:
        """
        Handle arrays with negative numbers for MSD variant.
        
        Args:
            array: Array containing negative numbers
            max_val: Maximum absolute value in the array
            options: Runtime options
        """
        self.set_phase("handling-negatives")
        
        n = len(array)
        positives = []
        negatives = []
        
        # Separate positive and negative numbers
        for i in range(n):
            value = self.read(array, i)
            if value < 0:
                negatives.append(-value)  # Store absolute value for sorting
            else:
                positives.append(value)
        
        self.record_state(array, {
            "type": "negative-handling",
            "positive_count": len(positives),
            "negative_count": len(negatives),
            "message": f"Separated into {len(positives)} positive and {len(negatives)} negative numbers"
        })
        
        # Sort positive and negative parts separately with MSD
        max_digits = self._get_max_digit_count(max_val, options["radix"])
        
        if positives:
            self._msd_radix_sort(positives, 0, len(positives) - 1, max_digits - 1, options)
        
        if negatives:
            self._msd_radix_sort(negatives, 0, len(negatives) - 1, max_digits - 1, options)
            # Reverse and negate the sorted negative numbers
            negatives.reverse()
            negatives = [-num for num in negatives]
        
        # Combine the results: negatives followed by positives
        combined = negatives + positives
        
        # Copy back to the original array
        for i in range(n):
            self.write(array, i, combined[i])
        
        self.record_state(array, {
            "type": "negatives-combined",
            "message": "Combined sorted negative and positive partitions"
        })

    def _get_max_digit_count(self, num: int, radix: int) -> int:
        """
        Calculate the number of digits in a number given a radix.
        
        Args:
            num: Number to analyze
            radix: Base of the number system
            
        Returns:
            Number of digits
        """
        if num == 0:
            return 1
        return math.floor(math.log(num, radix)) + 1

    def get_complexity(self) -> Dict[str, Dict[str, str]]:
        """
        Get the time and space complexity of Radix Sort.
        
        Returns:
            Complexity information dictionary
        """
        variant = self.options["variant"]
        
        return {
            "time": {
                "best": "O(w * n)",
                "average": "O(w * n)",
                "worst": "O(w * n)"
            },
            "space": {
                "best": "O(log n)" if variant == "msd" and self.options["in_place"] else "O(n + k)",
                "average": "O(n + k)",
                "worst": "O(n + k)"
            }
        }

    def is_stable(self) -> bool:
        """
        Whether Radix Sort is stable (preserves relative order of equal elements).
        
        Returns:
            True if LSD variant or if MSD with stability option
        """
        return self.options["variant"] == "lsd" or (
            self.options["variant"] == "msd" and self.options["stable"]
        )

    def is_in_place(self) -> bool:
        """
        Whether Radix Sort is in-place (uses O(1) auxiliary space).
        
        Returns:
            False as Radix Sort requires auxiliary space
        """
        return False  # Standard implementation requires O(n) auxiliary space
    
    def get_info(self) -> Dict[str, Any]:
        """
        Get detailed information about the algorithm.
        
        Returns:
            Dictionary with algorithm details
        """
        info = super().get_info()
        
        # Add radix sort specific information
        info.update({
            "optimization": {
                "variant": self.options.get("variant", "lsd"),
                "radix": self.options.get("radix", 10),
                "use_counting_sort": self.options.get("use_counting_sort", True),
                "in_place": self.options.get("in_place", False),
                "stable": self.options.get("stable", True)
            },
            "properties": {
                "comparison_based": False,
                "stable": self.is_stable(),
                "in_place": self.is_in_place(),
                "online": False,
                "divide_and_conquer": self.options.get("variant", "lsd") == "msd"
            },
            "suitable_for": {
                "small_arrays": False,
                "integer_data": True,
                "fixed_length_keys": True,
                "limited_range": True,
                "string_data": True
            },
            "variants": [
                "Least Significant Digit (LSD) Radix Sort",
                "Most Significant Digit (MSD) Radix Sort",
                "American Flag Sort (more efficient MSD variant)",
                "Flashsort (MSD variant)",
                "In-place MSD Radix Sort"
            ],
            "advantages": [
                "Linear time complexity O(w * n) independent of input distribution",
                "Can be faster than O(n log n) comparison sorts for fixed-length keys",
                "Stable (for LSD variant)",
                "Suitable for parallel implementation",
                "Good for string/integer sorting with fixed-length keys"
            ],
            "disadvantages": [
                "Limited to integers and strings (lexicographical ordering)",
                "Space intensive due to auxiliary memory requirements",
                "Performance highly dependent on key length and distribution",
                "Often slower than quicksort for general purpose sorting",
                "Complex implementation for variable-length keys"
            ]
        })
        
        return info


# Example usage
if __name__ == "__main__":
    # Create and run a simple test
    sorter = RadixSort({
        "variant": "lsd",
        "radix": 10,
        "use_counting_sort": True
    })
    
    test_array = [170, 45, 75, 90, 802, 24, 2, 66]
    
    result = sorter.execute(test_array)
    print(f"Original: {test_array}")
    print(f"Sorted: {result}")
    print(f"Comparisons: {sorter.metrics['comparisons']}")
    print(f"Memory accesses: {sorter.metrics['memory_accesses']}")
