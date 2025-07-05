"""
Base Algorithm Module for Sorting and Selection Algorithms

This module defines the foundational abstract class from which all 
algorithm implementations derive, providing a unified interface for
execution, instrumentation, and analysis.

The Algorithm class implements a comprehensive measurement framework
with detailed operation tracking, state history recording, and performance
metrics, enabling precise analysis and visualization of algorithmic behavior.

Author: Advanced Sorting Algorithm Visualization Platform Team
License: MIT
Version: 2.0.0
"""

import time
import copy
import math
import inspect
from typing import List, Dict, Any, Callable, Optional, Tuple, Set, Union, TypeVar, Generic

T = TypeVar('T')  # Generic type for elements being sorted

class Algorithm(Generic[T]):
    """
    Abstract base class for all sorting and selection algorithms.
    
    This class provides a unified interface and infrastructure for algorithm
    implementation, instrumentation, visualization, and analysis. It includes
    comprehensive measurement tools for tracking operations (comparisons, swaps,
    reads, writes), recording state history, and calculating performance metrics.
    
    Algorithm implementations should extend this class and override the `run` method
    to implement their specific sorting logic while leveraging the instrumentation
    capabilities of this base class.
    
    Attributes:
        name (str): Algorithm name for display and identification
        category (str): Algorithm category (e.g., 'comparison', 'distribution')
        options (Dict[str, Any]): Configuration options
        metrics (Dict[str, Any]): Performance metrics and operation counts
        history (List[Dict[str, Any]]): Recorded algorithm states for visualization
        current_step (int): Current step in execution history
        is_running (bool): Whether the algorithm is currently executing
        is_paused (bool): Whether execution is paused
        is_complete (bool): Whether execution has completed
        event_listeners (Dict[str, List[Callable]]): Registered event listeners
    
    Type Parameters:
        T: Element type for the array being sorted
    """
    
    def __init__(self, name: str, category: str, options: Optional[Dict[str, Any]] = None):
        """
        Initialize a new algorithm instance.
        
        Args:
            name: Algorithm name for display and identification
            category: Algorithm category (e.g., 'comparison', 'distribution')
            options: Optional configuration options
        """
        # Basic information
        self.name: str = name
        self.category: str = category
        
        # Default configuration options
        self.options: Dict[str, Any] = {
            "track_memory_access": True,   # Track memory read/write operations
            "track_operations": True,      # Track comparisons, swaps, etc.
            "record_history": True,        # Record state history for visualization
            "animation_delay": 0,          # Delay between steps for visualization
            "step_execution": False,       # Execute one step at a time
            "collect_stats": True,         # Collect statistical information
            "profile_call_stack": False,   # Track function call stack
        }
        
        # Override defaults with any provided options
        if options:
            self.options.update(options)

        # Initialize metrics tracking
        self.metrics: Dict[str, Any] = {
            # Operation counts
            "comparisons": 0,          # Number of element comparisons
            "swaps": 0,                # Number of element swaps
            "reads": 0,                # Number of array reads
            "writes": 0,               # Number of array writes
            "memory_accesses": 0,      # Total memory accesses (reads + writes)
            "recursive_calls": 0,      # Number of recursive calls
            "moves": 0,                # Number of element moves (distinct from swaps)
            
            # Memory metrics
            "auxiliary_space": 0,      # Maximum auxiliary space used
            "current_aux_space": 0,    # Current auxiliary space in use
            
            # Time measurements
            "start_time": 0,           # Execution start timestamp
            "end_time": 0,             # Execution end timestamp
            "execution_time": 0,       # Total execution time
            
            # Advanced metrics
            "call_depth": 0,           # Current recursion/call depth
            "max_call_depth": 0,       # Maximum recursion/call depth reached
            "branch_operations": 0,    # Number of branching operations
        }

        # State history for visualization
        self.history: List[Dict[str, Any]] = []
        self.current_step: int = 0
        
        # Execution state flags
        self.is_running: bool = False
        self.is_paused: bool = False
        self.is_complete: bool = False
        
        # Current execution phase (for tracking algorithm stages)
        self.current_phase: str = "initialization"
        
        # Call stack tracking for profiling
        self.call_stack: List[Dict[str, Any]] = []
        
        # Event system
        self.event_listeners: Dict[str, List[Callable]] = {
            "step": [],           # Triggered after each state recording
            "comparison": [],     # Triggered on element comparison
            "swap": [],           # Triggered on element swap
            "access": [],         # Triggered on array access (read/write)
            "complete": [],       # Triggered on algorithm completion
            "phase_change": []    # Triggered on algorithm phase change
        }
    
    def reset(self) -> 'Algorithm[T]':
        """
        Reset algorithm state and metrics.
        
        This method clears all metrics, history, and execution state to prepare
        for a new algorithm execution. It keeps configuration options intact.
        
        Returns:
            self: The algorithm instance (for method chaining)
        """
        # Reset metrics
        self.metrics = {
            "comparisons": 0,
            "swaps": 0,
            "reads": 0,
            "writes": 0,
            "memory_accesses": 0,
            "recursive_calls": 0,
            "moves": 0,
            "auxiliary_space": 0,
            "current_aux_space": 0,
            "start_time": 0,
            "end_time": 0,
            "execution_time": 0,
            "call_depth": 0,
            "max_call_depth": 0,
            "branch_operations": 0,
        }
        
        # Reset history and state
        self.history = []
        self.current_step = 0
        self.is_running = False
        self.is_paused = False
        self.is_complete = False
        self.current_phase = "initialization"
        self.call_stack = []
        
        return self
    
    def execute(self, array: List[T], options: Optional[Dict[str, Any]] = None) -> List[T]:
        """
        Execute the algorithm on the provided array.
        
        This method performs the algorithm execution with instrumentation to track
        metrics and record state history. It manages the execution lifecycle, including
        timing, state tracking, and event emitting.
        
        Args:
            array: The input array to process
            options: Optional runtime options to override defaults
            
        Returns:
            The processed (sorted) array
        """
        # Reset state for new execution
        self.reset()
        
        # Create merged options (defaults + instance options + runtime options)
        merged_options = self.options.copy()
        if options:
            merged_options.update(options)
            
        # Set execution flags
        self.is_running = True
        self.metrics["start_time"] = time.time()
        
        # Create a copy of the array to avoid modifying the original
        array_copy = array.copy()
        
        # Record initial state if history recording is enabled
        if merged_options["record_history"]:
            self.record_state(array_copy, {
                "type": "initial",
                "message": "Initial array state"
            })
        
        # Execute the algorithm's run method, which must be implemented by subclasses
        try:
            result = self.run(array_copy, merged_options)
        except Exception as e:
            # Record error state if there was an exception
            if merged_options["record_history"]:
                self.record_state(array_copy, {
                    "type": "error",
                    "message": f"Execution error: {str(e)}",
                    "error": str(e)
                })
            self.is_running = False
            self.is_complete = True
            raise
        
        # Record execution time
        self.metrics["end_time"] = time.time()
        self.metrics["execution_time"] = self.metrics["end_time"] - self.metrics["start_time"]
        
        # Update execution state
        self.is_running = False
        self.is_complete = True
        
        # Set the final phase
        self.set_phase("completed")
        
        # Record final state
        if merged_options["record_history"]:
            self.record_state(result, {
                "type": "final",
                "message": "Final sorted state"
            })
        
        # Emit complete event
        self.emit("complete", {
            "metrics": self.metrics,
            "result": result
        })
        
        return result
    
    def run(self, array: List[T], options: Dict[str, Any]) -> List[T]:
        """
        The core algorithm implementation.
        
        This method must be overridden by subclasses to implement the specific
        algorithm logic. It should use the provided instrumentation methods
        (compare, swap, read, write) to enable proper metrics tracking.
        
        Args:
            array: The array to process
            options: Runtime options
            
        Returns:
            The processed array
            
        Raises:
            NotImplementedError: Always, as this is an abstract method
        """
        raise NotImplementedError("Method 'run' must be implemented by subclasses")
    
    def compare(self, a: T, b: T, comparator: Optional[Callable[[T, T], int]] = None) -> int:
        """
        Compare two elements with instrumentation.
        
        This method wraps element comparisons to track metrics while maintaining
        the expected comparison semantics. It supports custom comparator functions.
        
        Args:
            a: First element to compare
            b: Second element to compare
            comparator: Optional custom comparison function
            
        Returns:
            -1 if a < b, 0 if a == b, 1 if a > b
        """
        # Increment comparison counter
        self.metrics["comparisons"] += 1
        
        # Perform comparison
        if comparator:
            result = comparator(a, b)
        else:
            # Default comparison logic
            if a < b:
                result = -1
            elif a > b:
                result = 1
            else:
                result = 0
        
        # Emit comparison event
        self.emit("comparison", {"a": a, "b": b, "result": result})
        
        return result
    
    def swap(self, array: List[T], i: int, j: int) -> None:
        """
        Swap two elements in an array with instrumentation.
        
        This method performs an element swap while tracking metrics for both
        the swap operation itself and the underlying read/write operations.
        
        Args:
            array: The array to modify
            i: First index
            j: Second index
        """
        # Skip if indices are the same
        if i == j:
            return
        
        # Increment swap counter
        self.metrics["swaps"] += 1
        
        # Track the reads and writes involved in the swap
        self.metrics["reads"] += 2      # Reading both elements
        self.metrics["writes"] += 2     # Writing both elements
        self.metrics["memory_accesses"] += 4  # Total memory operations
        
        # Perform the swap (using Python's tuple unpacking for clarity)
        array[i], array[j] = array[j], array[i]
        
        # Emit swap event
        self.emit("swap", {
            "indices": [i, j],
            "values": [array[i], array[j]]
        })
    
    def read(self, array: List[T], index: int) -> T:
        """
        Read a value from an array with instrumentation.
        
        This method wraps array read operations to track metrics while
        maintaining the expected access semantics.
        
        Args:
            array: The array to read from
            index: The index to read
            
        Returns:
            The value at the specified index
        """
        # Increment read counters
        self.metrics["reads"] += 1
        self.metrics["memory_accesses"] += 1
        
        # Perform the read
        value = array[index]
        
        # Emit access event
        self.emit("access", {"type": "read", "index": index, "value": value})
        
        return value
    
    def write(self, array: List[T], index: int, value: T) -> None:
        """
        Write a value to an array with instrumentation.
        
        This method wraps array write operations to track metrics while
        maintaining the expected assignment semantics.
        
        Args:
            array: The array to write to
            index: The index to write
            value: The value to write
        """
        # Increment write counters
        self.metrics["writes"] += 1
        self.metrics["memory_accesses"] += 1
        
        # Perform the write
        array[index] = value
        
        # Emit access event
        self.emit("access", {"type": "write", "index": index, "value": value})
    
    def move(self, array: List[T], source: int, dest: int) -> None:
        """
        Move an element from one position to another with instrumentation.
        
        This operation is distinct from a swap as it involves shifting elements
        to accommodate the moved element, rather than exchanging two elements.
        
        Args:
            array: The array to modify
            source: Source index of the element to move
            dest: Destination index for the element
        """
        # Skip if indices are the same
        if source == dest:
            return
        
        # Increment move counter
        self.metrics["moves"] += 1
        
        # Read the value to be moved
        value = self.read(array, source)
        
        # Shift elements to make room for the moved element
        if dest < source:
            # Shift right-to-left (for moving left)
            for i in range(source, dest, -1):
                self.write(array, i, self.read(array, i - 1))
        else:
            # Shift left-to-right (for moving right)
            for i in range(source, dest):
                self.write(array, i, self.read(array, i + 1))
        
        # Write the value to its destination
        self.write(array, dest, value)
    
    def allocate_auxiliary(self, size: int, purpose: str = "") -> None:
        """
        Track allocation of auxiliary space.
        
        This method updates metrics related to memory usage to help analyze
        the space complexity of algorithms in practice.
        
        Args:
            size: Number of elements or bytes allocated
            purpose: Optional description of what the space is used for
        """
        self.metrics["current_aux_space"] += size
        
        # Update max auxiliary space if current usage exceeds previous maximum
        if self.metrics["current_aux_space"] > self.metrics["auxiliary_space"]:
            self.metrics["auxiliary_space"] = self.metrics["current_aux_space"]
    
    def deallocate_auxiliary(self, size: int, purpose: str = "") -> None:
        """
        Track deallocation of auxiliary space.
        
        This method updates metrics related to memory usage as auxiliary space
        is freed during algorithm execution.
        
        Args:
            size: Number of elements or bytes deallocated
            purpose: Optional description of what the space was used for
        """
        self.metrics["current_aux_space"] = max(0, self.metrics["current_aux_space"] - size)
    
    def record_state(self, array: List[T], metadata: Optional[Dict[str, Any]] = None) -> None:
        """
        Record the current state of the array for visualization.
        
        This method takes a snapshot of the current array state and adds it to the
        history for later visualization and analysis.
        
        Args:
            array: The current array state
            metadata: Additional information about this state
        """
        # Skip if history recording is disabled
        if not self.options["record_history"]:
            return
        
        # Create state snapshot with current metrics and timestamp
        state = {
            "array": array.copy(),
            "metrics": copy.deepcopy(self.metrics),
            "timestamp": time.time(),
            "phase": self.current_phase
        }
        
        # Add any provided metadata
        if metadata:
            state.update(metadata)
        
        # Add to history
        self.history.append(state)
        
        # Emit step event
        self.emit("step", {
            "step": len(self.history) - 1,
            "state": self.history[-1]
        })
    
    def get_step(self, step_index: int) -> Optional[Dict[str, Any]]:
        """
        Retrieve a specific step from the algorithm history.
        
        Args:
            step_index: The index of the step to retrieve
            
        Returns:
            The state at the requested step, or None if index is invalid
        """
        if step_index < 0 or step_index >= len(self.history):
            return None
        
        self.current_step = step_index
        return self.history[step_index]
    
    def set_phase(self, phase: str) -> None:
        """
        Set the current algorithm phase.
        
        This method tracks transitions between algorithm phases (e.g., "partitioning",
        "merging") to provide more context for visualization and analysis.
        
        Args:
            phase: Name of the new phase
        """
        # Skip if phase hasn't changed
        if phase == self.current_phase:
            return
        
        # Record the phase change
        old_phase = self.current_phase
        self.current_phase = phase
        
        # Emit phase change event
        self.emit("phase_change", {
            "old_phase": old_phase,
            "new_phase": phase,
            "time": time.time()
        })
    
    def on(self, event: str, callback: Callable) -> 'Algorithm[T]':
        """
        Register an event listener.
        
        This method adds a callback function to be called when the specified
        event occurs during algorithm execution.
        
        Args:
            event: The event name to listen for
            callback: The function to call when the event occurs
            
        Returns:
            self: The algorithm instance (for method chaining)
        """
        if event in self.event_listeners:
            self.event_listeners[event].append(callback)
        return self
    
    def emit(self, event: str, data: Any) -> None:
        """
        Trigger an event.
        
        This method calls all registered listeners for the specified event,
        passing them the provided data.
        
        Args:
            event: The event name to trigger
            data: Data to pass to event listeners
        """
        if event in self.event_listeners:
            for callback in self.event_listeners[event]:
                callback(data)
    
    def enter_recursive_call(self, function_name: str = "", args: Any = None) -> None:
        """
        Track entry into a recursive function call.
        
        This method updates metrics related to recursion depth and call stack
        to help analyze the space complexity introduced by recursion.
        
        Args:
            function_name: Name of the function being called
            args: Arguments passed to the function
        """
        # Increment recursive call counter
        self.metrics["recursive_calls"] += 1
        
        # Update call depth metrics
        self.metrics["call_depth"] += 1
        if self.metrics["call_depth"] > self.metrics["max_call_depth"]:
            self.metrics["max_call_depth"] = self.metrics["call_depth"]
        
        # Track call stack if enabled
        if self.options["profile_call_stack"]:
            # Get caller information
            frame = inspect.currentframe().f_back
            caller_info = inspect.getframeinfo(frame)
            
            # Add to call stack
            self.call_stack.append({
                "function": function_name or caller_info.function,
                "file": caller_info.filename,
                "line": caller_info.lineno,
                "args": args,
                "time": time.time()
            })
    
    def exit_recursive_call(self) -> None:
        """
        Track exit from a recursive function call.
        
        This method updates metrics related to recursion depth and call stack
        as recursive calls return.
        """
        # Update call depth
        self.metrics["call_depth"] = max(0, self.metrics["call_depth"] - 1)
        
        # Update call stack if enabled
        if self.options["profile_call_stack"] and self.call_stack:
            self.call_stack.pop()
    
    def track_branch(self, condition: bool, description: str = "") -> bool:
        """
        Track a branching operation in the algorithm.
        
        This method helps analyze the flow of execution through the algorithm
        by tracking conditional branching decisions.
        
        Args:
            condition: The boolean condition being evaluated
            description: Optional description of the branch purpose
            
        Returns:
            The condition value (unchanged, for transparent usage in conditionals)
        """
        # Increment branch counter
        self.metrics["branch_operations"] += 1
        
        return condition
    
    def get_info(self) -> Dict[str, Any]:
        """
        Get detailed algorithm information for display.
        
        This method returns a comprehensive information object describing the
        algorithm's characteristics, metrics, and execution state.
        
        Returns:
            Dictionary containing algorithm metadata
        """
        return {
            "name": self.name,
            "category": self.category,
            "metrics": copy.deepcopy(self.metrics),
            "complexity": self.get_complexity(),
            "stability": self.is_stable(),
            "in_place": self.is_in_place(),
            "execution_status": {
                "running": self.is_running,
                "paused": self.is_paused,
                "complete": self.is_complete,
                "current_phase": self.current_phase
            }
        }
    
    def get_complexity(self) -> Dict[str, Dict[str, str]]:
        """
        Get the time and space complexity of the algorithm.
        
        This method should be overridden by subclasses to provide accurate
        complexity information for the specific algorithm.
        
        Returns:
            Nested dictionary with time and space complexity information
        """
        return {
            "time": {
                "best": "O(?)",
                "average": "O(?)",
                "worst": "O(?)"
            },
            "space": {
                "best": "O(?)",
                "average": "O(?)",
                "worst": "O(?)"
            }
        }
    
    def is_stable(self) -> bool:
        """
        Determine whether the algorithm is stable.
        
        A stable sorting algorithm preserves the relative order of equal elements.
        This method should be overridden by subclasses to provide accurate information.
        
        Returns:
            True if the algorithm is stable, False otherwise
        """
        return False
    
    def is_in_place(self) -> bool:
        """
        Determine whether the algorithm is in-place.
        
        An in-place algorithm uses O(1) auxiliary space, excluding the input array.
        This method should be overridden by subclasses to provide accurate information.
        
        Returns:
            True if the algorithm is in-place, False otherwise
        """
        return False
    
    def calculate_theoretical_comparisons(self, n: int, case: str = "average") -> int:
        """
        Calculate the theoretical number of comparisons for a given input size.
        
        This method provides a theoretical baseline for comparison with actual
        measured performance. It should be overridden by subclasses with
        algorithm-specific formulas.
        
        Args:
            n: Input size (number of elements)
            case: Which case to calculate ("best", "average", "worst")
            
        Returns:
            Theoretical number of comparisons
        """
        # Default implementation - should be overridden by subclasses
        if case == "best":
            return n - 1  # Minimum comparisons needed to verify an array is sorted
        elif case == "worst":
            return (n * (n - 1)) // 2  # Maximum comparisons (e.g., bubble sort)
        else:  # average
            return (n * math.log2(n)) if n > 0 else 0  # Typical O(n log n) algorithm
    
    def analyze_performance(self, n: int) -> Dict[str, Any]:
        """
        Analyze actual performance compared to theoretical expectations.
        
        This method compares measured metrics with theoretical expectations
        to help identify optimization opportunities and validate complexity analysis.
        
        Args:
            n: Input size (number of elements)
            
        Returns:
            Performance analysis information
        """
        # Calculate theoretical metrics
        theoretical = {
            "comparisons": {
                "best": self.calculate_theoretical_comparisons(n, "best"),
                "average": self.calculate_theoretical_comparisons(n, "average"),
                "worst": self.calculate_theoretical_comparisons(n, "worst")
            }
        }
        
        # Compare with actual metrics
        actual_comparisons = self.metrics["comparisons"]
        
        # Determine which case the performance most closely matches
        case_ratios = {
            "best": actual_comparisons / theoretical["comparisons"]["best"] if theoretical["comparisons"]["best"] > 0 else float('inf'),
            "average": actual_comparisons / theoretical["comparisons"]["average"] if theoretical["comparisons"]["average"] > 0 else float('inf'),
            "worst": actual_comparisons / theoretical["comparisons"]["worst"] if theoretical["comparisons"]["worst"] > 0 else float('inf')
        }
        
        # Find the closest case (closest ratio to 1.0)
        closest_case = min(case_ratios.items(), key=lambda x: abs(x[1] - 1.0))[0]
        
        return {
            "input_size": n,
            "theoretical": theoretical,
            "actual": {
                "comparisons": actual_comparisons,
                "swaps": self.metrics["swaps"],
                "reads": self.metrics["reads"],
                "writes": self.metrics["writes"],
                "execution_time": self.metrics["execution_time"]
            },
            "analysis": {
                "closest_case": closest_case,
                "comparison_efficiency": theoretical["comparisons"]["average"] / actual_comparisons if actual_comparisons > 0 else 0,
                "operations_per_element": (actual_comparisons + self.metrics["swaps"]) / n if n > 0 else 0
            }
        }
    
    def __str__(self) -> str:
        """
        String representation of the algorithm.
        
        Returns:
            A string describing the algorithm
        """
        return f"{self.name} ({self.category})"
    
    def __repr__(self) -> str:
        """
        Detailed representation of the algorithm instance.
        
        Returns:
            A detailed string representation including key metrics
        """
        metrics_str = ""
        if self.is_complete:
            metrics_str = f", comparisons={self.metrics['comparisons']}, swaps={self.metrics['swaps']}"
        
        return f"{self.__class__.__name__}(name='{self.name}', category='{self.category}'{metrics_str})"
