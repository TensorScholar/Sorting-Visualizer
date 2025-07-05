#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Advanced Instrumentation System for Algorithm Analysis and Visualization

This module provides a sophisticated framework for profiling, analyzing, and
visualizing algorithm behavior with particular emphasis on sorting algorithms.
It implements a comprehensive set of metrics collection mechanisms, memory access
pattern analysis, cache simulation, and execution phase detection.

The system is designed to be both academically rigorous for algorithm analysis
and pedagogically effective for educational visualization. Performance overhead
is carefully managed through selective instrumentation and efficient data structures.

Key Features:
- Fine-grained operation tracking (comparisons, swaps, reads, writes)
- Memory access pattern analysis with spatial and temporal locality metrics
- Cache behavior simulation with configurable parameters
- Call stack and recursion depth monitoring
- Element movement tracking and distance calculation
- Execution phase detection and transition analysis
- Advanced statistical metrics aggregation

Performance characteristics:
- Space Complexity: O(n) where n is the input size
- Time Overhead: Approximately 10-30% depending on instrumentation level

Usage Example:
    from instrumentation import AlgorithmInstrumentation
    
    # Create instrumentation instance
    instrumentation = AlgorithmInstrumentation()
    
    # Start instrumentation
    instrumentation.start_timing()
    
    # Track operations during algorithm execution
    instrumentation.track_comparison(a, b, result)
    instrumentation.track_swap(array, i, j)
    
    # End instrumentation and generate report
    instrumentation.end_timing()
    report = instrumentation.generate_report()

Authors: Advanced Algorithm Visualization Team
Version: 2.0.0
"""

import time
import math
import gc
import sys
import statistics
from typing import Dict, List, Any, Set, Tuple, Optional, Callable, Union, TypeVar
from collections import defaultdict, deque
from dataclasses import dataclass, field

# Type variables for generic typing
T = TypeVar('T')
Number = Union[int, float]


@dataclass
class CacheEntry:
    """Data structure for cache simulation entries."""
    index: int
    last_accessed: float
    operation: str
    hits: int = 0
    misses: int = 0


@dataclass
class OperationEvent:
    """Data structure for tracking algorithm operations."""
    type: str
    time: float
    indices: List[int] = field(default_factory=list)
    values: List[Any] = field(default_factory=list)
    metadata: Dict[str, Any] = field(default_factory=dict)


@dataclass
class CallStackFrame:
    """Data structure for tracking function call stack."""
    function: str
    args: List[Any]
    time: float
    is_recursive: bool
    depth: int


@dataclass
class PhaseTransition:
    """Data structure for tracking algorithm phase transitions."""
    phase: str
    time: float
    previous_phase: str
    metrics_snapshot: Dict[str, Any] = field(default_factory=dict)


class AlgorithmInstrumentation:
    """
    Advanced instrumentation system for tracking algorithm performance metrics
    and collecting detailed execution data for analysis and visualization.
    
    This class provides comprehensive profiling of algorithm behavior including:
    - Basic operation counts (comparisons, swaps, reads, writes)
    - Memory access patterns and cache simulation
    - Call stack and recursion tracking
    - Element movement analysis
    - Phase detection and transition analysis
    
    The instrumentation is designed to minimize performance impact while
    collecting detailed data for educational visualization and algorithmic analysis.
    It employs efficient data structures and selective measurement to balance
    detail with overhead.
    """

    def __init__(self, options: Optional[Dict[str, Any]] = None):
        """
        Initialize the instrumentation system with configuration options.
        
        Args:
            options: Configuration dictionary with the following possible keys:
                - track_memory_access: Enable memory access tracking (default: True)
                - track_cache: Enable cache simulation (default: True)
                - track_element_movement: Enable element movement tracking (default: True)
                - track_phases: Enable execution phase detection (default: True)
                - cache_size: Number of entries in simulated cache (default: 64)
                - detailed_metrics: Collect additional statistical metrics (default: True)
        
        Time Complexity: O(1)
        Space Complexity: O(1) initial allocation
        """
        # Default options
        self.options = {
            "track_memory_access": True,
            "track_cache": True,
            "track_element_movement": True,
            "track_phases": True,
            "cache_size": 64,
            "detailed_metrics": True
        }
        
        # Override with provided options
        if options:
            self.options.update(options)

        # Initialize metrics tracking
        self.reset()

    def reset(self) -> None:
        """
        Reset all instrumentation data to initial state.
        
        This method is called automatically during initialization and can be
        used to reset the instrumentation between multiple algorithm executions.
        
        Time Complexity: O(1) - Constant time for dictionary/object initialization
        Space Complexity: O(1) - Fixed size state initialization
        """
        # Runtime metrics - Basic operation counts
        self.metrics = {
            # Basic operation counts
            "comparisons": 0,
            "swaps": 0,
            "reads": 0,
            "writes": 0,
            
            # Memory-related metrics
            "memory_accesses": 0,
            "memory_usage": 0,
            "auxiliary_space": 0,
            
            # Call statistics
            "function_calls": 0,
            "recursive_calls": 0,
            "recursion_depth": 0,
            "max_recursion_depth": 0,
            
            # Time measurements
            "start_time": 0,
            "end_time": 0,
            "execution_time": 0,
            
            # Conditional branches
            "branches": 0,
            "branch_hits": {
                "true": 0,
                "false": 0
            }
        }
        
        # Performance profile
        self.profile = {
            "operation_timeline": [],
            "memory_usage_timeline": [],
            "call_stack": [],
            "hotspots": defaultdict(lambda: {"calls": 0, "total_time": 0, "max_time": 0, "min_time": float('inf')}),
            "time_distribution": defaultdict(float)
        }
        
        # Array access patterns
        self.access_patterns = {
            "read_indices": [],
            "write_indices": [],
            "access_frequency": defaultdict(int),
            "sequential_accesses": 0,
            "random_accesses": 0,
            "access_distribution": defaultdict(int)
        }
        
        # Cache simulation
        self.cache_simulation = {
            "cache_size": self.options["cache_size"],
            "cache_hits": 0,
            "cache_misses": 0,
            "cache": {},         # Using dict for Python's cache simulation
            "evictions": 0,
            "hit_rate_timeline": [],
            "recent_accesses": deque(maxlen=100)  # For locality analysis
        }
        
        # Element movement tracking
        self.element_movements = {
            "paths": defaultdict(list),    # Track individual element paths through the array
            "distances": defaultdict(int),  # Track total distance moved by each element
            "total_distance": 0
        }
        
        # Phase detection
        self.phases = {
            "current": "initialization",
            "transitions": [],
            "durations": defaultdict(float),
            "operations_per_phase": defaultdict(int)
        }
        
        # Statistical aggregation
        self.statistics = {
            "comparison_values": [],       # For distribution analysis
            "time_per_operation": [],      # For timing distribution
            "operation_intervals": [],     # Time between similar operations
            "memory_access_distances": []  # Spatial locality metric
        }

    def start_timing(self) -> None:
        """
        Start timing the algorithm execution.
        
        This should be called at the beginning of the algorithm execution.
        
        Time Complexity: O(1)
        Space Complexity: O(1)
        """
        self.metrics["start_time"] = time.time()
        self.set_phase("initialization")
        
        # Take initial memory snapshot if tracking memory
        if self.options["track_memory_access"]:
            self._track_memory_usage("initial")

    def end_timing(self) -> None:
        """
        End timing the algorithm execution.
        
        This should be called at the end of the algorithm execution.
        
        Time Complexity: O(1)
        Space Complexity: O(1)
        """
        self.metrics["end_time"] = time.time()
        self.metrics["execution_time"] = self.metrics["end_time"] - self.metrics["start_time"]
        self.set_phase("completed")
        
        # Take final memory snapshot if tracking memory
        if self.options["track_memory_access"]:
            self._track_memory_usage("final")

    def track_comparison(self, a: Any, b: Any, result: int, metadata: Optional[Dict[str, Any]] = None) -> None:
        """
        Track a comparison operation between two elements.
        
        Args:
            a: First element being compared
            b: Second element being compared
            result: Result of comparison (-1, 0, 1)
            metadata: Additional information about the comparison
        
        Time Complexity: O(1)
        Space Complexity: O(1) - Constant overhead per operation tracked
        """
        self.metrics["comparisons"] += 1
        
        # Record the operation
        operation_data = OperationEvent(
            type="comparison",
            time=time.time(),
            values=[a, b],
            metadata=metadata or {}
        )
        operation_data.metadata["result"] = result
        
        # Store in timeline
        self.profile["operation_timeline"].append(operation_data)
        
        # Track for statistical analysis if enabled
        if self.options["detailed_metrics"]:
            self.statistics["comparison_values"].append((a, b, result))
            
            # Track time since last operation
            current_time = time.time()
            if hasattr(self, "_last_comparison_time"):
                interval = current_time - self._last_comparison_time
                self.statistics["operation_intervals"].append(("comparison", interval))
            self._last_comparison_time = current_time
            
            # Track operation in current phase
            self.phases["operations_per_phase"][self.phases["current"]] += 1

    def track_swap(self, array: List[Any], i: int, j: int, metadata: Optional[Dict[str, Any]] = None) -> None:
        """
        Track a swap operation between two elements in an array.
        
        Args:
            array: The array being modified
            i: Index of first element
            j: Index of second element
            metadata: Additional information about the swap
        
        Time Complexity: O(1)
        Space Complexity: O(1) 
        """
        self.metrics["swaps"] += 1
        self.metrics["reads"] += 2
        self.metrics["writes"] += 2
        self.metrics["memory_accesses"] += 4
        
        # Track element movements if enabled
        if self.options["track_element_movement"]:
            # Get the elements being swapped
            element_a = array[i]
            element_b = array[j]
            
            # Record paths
            self.element_movements["paths"][element_a].append(i)
            self.element_movements["paths"][element_b].append(j)
            
            # Update positions after swap
            self.element_movements["paths"][element_a].append(j)
            self.element_movements["paths"][element_b].append(i)
            
            # Calculate and track distance
            distance = abs(j - i)
            self.element_movements["total_distance"] += distance * 2  # Both elements move
            
            # Update individual element distances
            self.element_movements["distances"][element_a] += distance
            self.element_movements["distances"][element_b] += distance
        
        # Simulate cache behavior if enabled
        if self.options["track_cache"]:
            self.simulate_cache_access(i, "read")
            self.simulate_cache_access(j, "read")
            self.simulate_cache_access(i, "write")
            self.simulate_cache_access(j, "write")
        
        # Record the operation
        operation_data = OperationEvent(
            type="swap",
            time=time.time(),
            indices=[i, j],
            values=[array[i], array[j]],
            metadata=metadata or {}
        )
        
        # Store in timeline
        self.profile["operation_timeline"].append(operation_data)
        
        # Track time since last operation for detailed metrics
        if self.options["detailed_metrics"]:
            current_time = time.time()
            if hasattr(self, "_last_swap_time"):
                interval = current_time - self._last_swap_time
                self.statistics["operation_intervals"].append(("swap", interval))
            self._last_swap_time = current_time
            
            # Track operation in current phase
            self.phases["operations_per_phase"][self.phases["current"]] += 1

    def track_read(self, array: List[Any], index: int, metadata: Optional[Dict[str, Any]] = None) -> Any:
        """
        Track a read operation from an array.
        
        Args:
            array: The array being read from
            index: Index being accessed
            metadata: Additional information about the read
            
        Returns:
            The value read from the array
        
        Time Complexity: O(1)
        Space Complexity: O(1)
        """
        self.metrics["reads"] += 1
        self.metrics["memory_accesses"] += 1
        
        # Record access pattern if tracking memory access
        if self.options["track_memory_access"]:
            self.access_patterns["read_indices"].append(index)
            self.access_patterns["access_frequency"][index] += 1
            
            # Check if this is sequential or random access
            if len(self.access_patterns["read_indices"]) > 1:
                last_index = self.access_patterns["read_indices"][-2]
                if abs(index - last_index) == 1:
                    self.access_patterns["sequential_accesses"] += 1
                else:
                    self.access_patterns["random_accesses"] += 1
                    
                # Track for spatial locality analysis
                if self.options["detailed_metrics"]:
                    self.statistics["memory_access_distances"].append(abs(index - last_index))
        
        # Simulate cache behavior if enabled
        if self.options["track_cache"]:
            self.simulate_cache_access(index, "read")
        
        # Get the value being read
        value = array[index]
        
        # Record the operation
        operation_data = OperationEvent(
            type="read",
            time=time.time(),
            indices=[index],
            values=[value],
            metadata=metadata or {}
        )
        
        # Store in timeline
        self.profile["operation_timeline"].append(operation_data)
        
        # Track operation in current phase
        if self.options["detailed_metrics"]:
            self.phases["operations_per_phase"][self.phases["current"]] += 1
        
        return value

    def track_write(self, array: List[Any], index: int, value: Any, metadata: Optional[Dict[str, Any]] = None) -> None:
        """
        Track a write operation to an array.
        
        Args:
            array: The array being written to
            index: Index being accessed
            value: Value being written
            metadata: Additional information about the write
        
        Time Complexity: O(1)
        Space Complexity: O(1)
        """
        self.metrics["writes"] += 1
        self.metrics["memory_accesses"] += 1
        
        # Record access pattern if tracking memory access
        if self.options["track_memory_access"]:
            self.access_patterns["write_indices"].append(index)
            self.access_patterns["access_frequency"][index] += 1
        
        # Track element movements if enabled
        if self.options["track_element_movement"]:
            # Check if this element has been tracked before
            if value in self.element_movements["paths"] and self.element_movements["paths"][value]:
                last_position = self.element_movements["paths"][value][-1]
                distance = abs(index - last_position)
                
                # Record new position
                self.element_movements["paths"][value].append(index)
                
                # Update distance metrics
                self.element_movements["total_distance"] += distance
                self.element_movements["distances"][value] += distance
            else:
                # First time seeing this element, initialize tracking
                self.element_movements["paths"][value] = [index]
        
        # Simulate cache behavior if enabled
        if self.options["track_cache"]:
            self.simulate_cache_access(index, "write")
        
        # Record the operation
        operation_data = OperationEvent(
            type="write",
            time=time.time(),
            indices=[index],
            values=[value],
            metadata=metadata or {}
        )
        
        # Store in timeline
        self.profile["operation_timeline"].append(operation_data)
        
        # Perform the write operation
        array[index] = value
        
        # Track operation in current phase
        if self.options["detailed_metrics"]:
            self.phases["operations_per_phase"][self.phases["current"]] += 1

    def track_function_call(self, function_name: str, args: List[Any], is_recursive: bool = False, 
                           metadata: Optional[Dict[str, Any]] = None) -> None:
        """
        Track a function call.
        
        Args:
            function_name: Name of the function being called
            args: Arguments passed to the function
            is_recursive: Whether this is a recursive call
            metadata: Additional information about the function call
        
        Time Complexity: O(1)
        Space Complexity: O(1)
        """
        self.metrics["function_calls"] += 1
        
        # Update recursion metrics if applicable
        if is_recursive:
            self.metrics["recursive_calls"] += 1
            self.metrics["recursion_depth"] += 1
            
            # Update max recursion depth if needed
            if self.metrics["recursion_depth"] > self.metrics["max_recursion_depth"]:
                self.metrics["max_recursion_depth"] = self.metrics["recursion_depth"]
        
        # Record call to stack
        call_time = time.time()
        call_frame = CallStackFrame(
            function=function_name,
            args=args,
            time=call_time,
            is_recursive=is_recursive,
            depth=self.metrics["recursion_depth"]
        )
        
        self.profile["call_stack"].append(call_frame)
        
        # Record the operation
        operation_data = OperationEvent(
            type="call",
            time=call_time,
            metadata=metadata or {}
        )
        operation_data.metadata.update({
            "function": function_name,
            "is_recursive": is_recursive,
            "depth": self.metrics["recursion_depth"]
        })
        
        # Store in timeline
        self.profile["operation_timeline"].append(operation_data)
        
        # Track operation in current phase
        if self.options["detailed_metrics"]:
            self.phases["operations_per_phase"][self.phases["current"]] += 1

    def track_function_return(self, function_name: str, return_value: Any, is_recursive: bool = False,
                             metadata: Optional[Dict[str, Any]] = None) -> None:
        """
        Track a function return.
        
        Args:
            function_name: Name of the returning function
            return_value: Value being returned
            is_recursive: Whether this is returning from a recursive call
            metadata: Additional information about the function return
        
        Time Complexity: O(1)
        Space Complexity: O(1)
        """
        # Find matching call frame
        call_frame = None
        if self.profile["call_stack"]:
            call_frame = self.profile["call_stack"].pop()
            
            # Validate that we're returning from the expected function
            if call_frame.function != function_name:
                # Stack mismatch - this indicates an instrumentation error
                # Restore the frame we popped and log a warning
                self.profile["call_stack"].append(call_frame)
                import warnings
                warnings.warn(
                    f"Call stack mismatch: expected {function_name}, got {call_frame.function}",
                    RuntimeWarning
                )
            else:
                # Calculate call duration
                return_time = time.time()
                call_duration = return_time - call_frame.time
                
                # Update hotspot tracking
                hotspot = self.profile["hotspots"][function_name]
                hotspot["calls"] += 1
                hotspot["total_time"] += call_duration
                
                if call_duration > hotspot["max_time"]:
                    hotspot["max_time"] = call_duration
                    
                if call_duration < hotspot["min_time"]:
                    hotspot["min_time"] = call_duration
        
        # Update recursion metrics
        if is_recursive:
            self.metrics["recursion_depth"] = max(0, self.metrics["recursion_depth"] - 1)
        
        # Record the operation
        operation_data = OperationEvent(
            type="return",
            time=time.time(),
            metadata=metadata or {}
        )
        operation_data.metadata.update({
            "function": function_name,
            "is_recursive": is_recursive,
            "depth": self.metrics["recursion_depth"]
        })
        
        # Store in timeline
        self.profile["operation_timeline"].append(operation_data)
        
        # Track operation in current phase
        if self.options["detailed_metrics"]:
            self.phases["operations_per_phase"][self.phases["current"]] += 1

    def track_branch(self, condition: bool, metadata: Optional[Dict[str, Any]] = None) -> None:
        """
        Track a conditional branch operation.
        
        Args:
            condition: The branch condition result
            metadata: Additional information about the branch
        
        Time Complexity: O(1)
        Space Complexity: O(1)
        """
        self.metrics["branches"] += 1
        self.metrics["branch_hits"]["true" if condition else "false"] += 1
        
        # Record the operation
        operation_data = OperationEvent(
            type="branch",
            time=time.time(),
            metadata=metadata or {}
        )
        operation_data.metadata["condition"] = condition
        
        # Store in timeline
        self.profile["operation_timeline"].append(operation_data)
        
        # Track operation in current phase
        if self.options["detailed_metrics"]:
            self.phases["operations_per_phase"][self.phases["current"]] += 1

    def set_phase(self, phase: str) -> None:
        """
        Set the current algorithm execution phase.
        
        Algorithm execution is typically divided into phases such as initialization,
        partitioning, merging, etc. This method tracks transitions between phases
        and records timing information for each phase.
        
        Args:
            phase: The name of the new phase
        
        Time Complexity: O(1)
        Space Complexity: O(1)
        """
        # Skip if phase hasn't changed or phase tracking is disabled
        if phase == self.phases["current"] or not self.options["track_phases"]:
            return
        
        now = time.time()
        
        # Record duration of previous phase
        if self.phases["transitions"]:
            prev_transition = self.phases["transitions"][-1]
            duration = now - prev_transition.time
            
            # Add to phase durations
            self.phases["durations"][prev_transition.phase] += duration
        
        # Take a snapshot of current metrics
        metrics_snapshot = {
            "comparisons": self.metrics["comparisons"],
            "swaps": self.metrics["swaps"],
            "reads": self.metrics["reads"],
            "writes": self.metrics["writes"],
            "memory_accesses": self.metrics["memory_accesses"],
            "elapsed_time": now - self.metrics["start_time"]
        }
        
        # Record the transition
        transition = PhaseTransition(
            phase=phase,
            time=now,
            previous_phase=self.phases["current"],
            metrics_snapshot=metrics_snapshot
        )
        
        self.phases["transitions"].append(transition)
        self.phases["current"] = phase

    def track_memory_allocation(self, bytes_allocated: int, purpose: str) -> None:
        """
        Track memory allocation during algorithm execution.
        
        Args:
            bytes_allocated: Number of bytes allocated
            purpose: Description of what the memory is used for
        
        Time Complexity: O(1)
        Space Complexity: O(1)
        """
        self.metrics["auxiliary_space"] += bytes_allocated
        self.metrics["memory_usage"] += bytes_allocated
        
        # Record the allocation
        self.profile["memory_usage_timeline"].append({
            "time": time.time(),
            "total_bytes": self.metrics["memory_usage"],
            "operation": "allocate",
            "bytes": bytes_allocated,
            "purpose": purpose
        })

    def track_memory_deallocation(self, bytes_deallocated: int, purpose: str) -> None:
        """
        Track memory deallocation during algorithm execution.
        
        Args:
            bytes_deallocated: Number of bytes freed
            purpose: Description of what the memory was used for
        
        Time Complexity: O(1)
        Space Complexity: O(1)
        """
        self.metrics["memory_usage"] -= bytes_deallocated
        
        # Record the deallocation
        self.profile["memory_usage_timeline"].append({
            "time": time.time(),
            "total_bytes": self.metrics["memory_usage"],
            "operation": "deallocate",
            "bytes": bytes_deallocated,
            "purpose": purpose
        })

    def _track_memory_usage(self, label: str) -> None:
        """
        Take a snapshot of current memory usage.
        
        Args:
            label: Label for the memory snapshot
        
        Time Complexity: O(1) - Though gc.collect() may take longer
        Space Complexity: O(1)
        """
        # Force garbage collection to get accurate memory usage
        gc.collect()
        
        # Get current memory usage (implementation-dependent)
        try:
            import psutil
            process = psutil.Process()
            memory_info = process.memory_info()
            current_memory = memory_info.rss  # Resident Set Size
        except (ImportError, AttributeError):
            # Fallback - less accurate
            current_memory = sys.getsizeof(self) + sum(sys.getsizeof(x) for x in gc.get_objects())
        
        # Record memory snapshot
        self.profile["memory_usage_timeline"].append({
            "time": time.time(),
            "total_bytes": current_memory,
            "operation": "snapshot",
            "label": label
        })

    def simulate_cache_access(self, index: int, operation: str) -> None:
        """
        Simulate cache behavior for memory access.
        
        This implements a simple Least Recently Used (LRU) cache simulation to model
        CPU cache behavior during algorithm execution.
        
        Args:
            index: The array index being accessed
            operation: Type of operation ('read' or 'write')
        
        Time Complexity: O(1) for cache hit, O(n) for cache miss with eviction
        Space Complexity: O(1) - Bound by cache_size
        """
        if not self.options["track_cache"]:
            return
            
        # Convert index to string for cache key
        cache_key = str(index)
        current_time = time.time()
        
        # Add to recent accesses for locality analysis
        self.cache_simulation["recent_accesses"].append((index, operation, current_time))
        
        # Check if index is in cache
        if cache_key in self.cache_simulation["cache"]:
            # Cache hit
            self.cache_simulation["cache_hits"] += 1
            
            # Update entry's last accessed time
            self.cache_simulation["cache"][cache_key].last_accessed = current_time
            self.cache_simulation["cache"][cache_key].hits += 1
        else:
            # Cache miss
            self.cache_simulation["cache_misses"] += 1
            
            # Check if cache is full
            if len(self.cache_simulation["cache"]) >= self.cache_simulation["cache_size"]:
                # Need to evict entry - find least recently used
                lru_key = None
                oldest_time = float('inf')
                
                for key, entry in self.cache_simulation["cache"].items():
                    if entry.last_accessed < oldest_time:
                        oldest_time = entry.last_accessed
                        lru_key = key
                
                # Evict the LRU entry
                if lru_key is not None:
                    del self.cache_simulation["cache"][lru_key]
                    self.cache_simulation["evictions"] += 1
            
            # Add new entry to cache
            self.cache_simulation["cache"][cache_key] = CacheEntry(
                index=index,
                last_accessed=current_time,
                operation=operation,
                misses=1
            )
        
        # Record hit rate for timeline if collecting detailed metrics
        if self.options["detailed_metrics"] and (self.cache_simulation["cache_hits"] + self.cache_simulation["cache_misses"]) % 10 == 0:
            total_accesses = self.cache_simulation["cache_hits"] + self.cache_simulation["cache_misses"]
            hit_rate = self.cache_simulation["cache_hits"] / total_accesses if total_accesses > 0 else 0
            
            self.cache_simulation["hit_rate_timeline"].append({
                "time": current_time,
                "hit_rate": hit_rate,
                "accesses": total_accesses
            })

    def generate_report(self) -> Dict[str, Any]:
        """
        Generate a comprehensive analysis report.
        
        This method aggregates all collected metrics and analysis into a 
        structured report suitable for visualization and algorithm analysis.
        
        Returns:
            Dict containing detailed performance metrics and analysis
        
        Time Complexity: O(n) where n is the number of operations tracked
        Space Complexity: O(n) for the report data structure
        """
        # Calculate derived metrics
        total_operations = (self.metrics["comparisons"] + 
                           self.metrics["swaps"] + 
                           self.metrics["reads"] + 
                           self.metrics["writes"])
        
        # Prepare the basic report
        report = {
            "metrics": self.metrics.copy(),
            
            # Performance summary
            "performance": {
                "operations_per_second": total_operations / (self.metrics["execution_time"] or 0.001),
                "average_time_per_operation": self.metrics["execution_time"] / (total_operations or 1),
                "cache_hit_rate": (self.cache_simulation["cache_hits"] / 
                                 (self.cache_simulation["cache_hits"] + self.cache_simulation["cache_misses"] or 1)),
                "branch_predictability": (self.metrics["branch_hits"]["true"] / 
                                       (self.metrics["branches"] or 1))
            },
            
            # Access pattern analysis
            "access_patterns": {
                "sequential_ratio": (self.access_patterns["sequential_accesses"] / 
                                   (self.access_patterns["sequential_accesses"] + 
                                    self.access_patterns["random_accesses"] or 1)),
                "most_accessed_indices": self._get_most_accessed_indices(10),
                "access_distribution": self._get_access_distribution(),
                "hotspots": self._get_access_hotspots()
            },
            
            # Movement efficiency
            "movement_efficiency": {
                "total_distance": self.element_movements["total_distance"],
                "average_distance": (self.element_movements["total_distance"] / 
                                   (len(self.element_movements["distances"]) or 1)),
                "farthest_moving_elements": self._get_farthest_moving_elements(10)
            },
            
            # Phase analysis
            "phase_analysis": {
                "phases": dict(self.phases["durations"]),
                "transition_points": [
                    {
                        "from": t.previous_phase,
                        "to": t.phase,
                        "time_ms": (t.time - self.metrics["start_time"]) * 1000
                    }
                    for t in self.phases["transitions"]
                ],
                "operations_per_phase": dict(self.phases["operations_per_phase"])
            },
            
            # Call profile
            "profile": {
                "hotspots": [
                    {
                        "function": name,
                        "calls": stats["calls"],
                        "total_time_ms": stats["total_time"] * 1000,
                        "average_time_ms": stats["total_time"] * 1000 / stats["calls"] if stats["calls"] else 0,
                        "percentage_of_total": (stats["total_time"] / self.metrics["execution_time"]) * 100 
                            if self.metrics["execution_time"] else 0
                    }
                    for name, stats in sorted(
                        self.profile["hotspots"].items(), 
                        key=lambda x: x[1]["total_time"], 
                        reverse=True
                    )
                ],
                "call_tree_depth": self.metrics["max_recursion_depth"],
                "timeline_events": len(self.profile["operation_timeline"])
            },
            
            # Efficiency metrics
            "efficiency": {
                "operations_per_element": total_operations / (len(self.access_patterns["read_indices"]) or 1),
                "memory_efficiency": self.metrics["memory_accesses"] / (total_operations or 1),
                "work_done": self._calculate_work_done()
            }
        }
        
        # Add detailed statistical analysis if enabled
        if self.options["detailed_metrics"] and self.statistics["memory_access_distances"]:
            report["detailed_statistics"] = {
                "memory_locality": {
                    "average_access_distance": statistics.mean(self.statistics["memory_access_distances"]),
                    "median_access_distance": statistics.median(self.statistics["memory_access_distances"]),
                    "max_access_distance": max(self.statistics["memory_access_distances"]),
                    "spatial_locality_score": self._calculate_spatial_locality_score()
                }
            }
            
            # Add operation timing statistics if we have enough data
            if len(self.statistics["operation_intervals"]) > 1:
                by_op_type = defaultdict(list)
                for op_type, interval in self.statistics["operation_intervals"]:
                    by_op_type[op_type].append(interval)
                    
                report["detailed_statistics"]["operation_timing"] = {
                    op_type: {
                        "average_interval": statistics.mean(intervals),
                        "min_interval": min(intervals),
                        "max_interval": max(intervals)
                    }
                    for op_type, intervals in by_op_type.items() if intervals
                }
        
        return report

    def _get_most_accessed_indices(self, limit: int) -> List[Dict[str, Any]]:
        """
        Get the most frequently accessed indices.
        
        Args:
            limit: Maximum number of indices to return
            
        Returns:
            List of dictionaries with index, count, and percentage information
            
        Time Complexity: O(n log n) for sorting
        Space Complexity: O(n)
        """
        # Sort indices by access frequency
        sorted_indices = sorted(
            self.access_patterns["access_frequency"].items(),
            key=lambda x: x[1],
            reverse=True
        )
        
        # Take top 'limit' entries
        top_indices = sorted_indices[:limit]
        
        # Calculate total accesses for percentage
        total_accesses = self.metrics["reads"] + self.metrics["writes"]
        
        # Format results
        return [
            {
                "index": int(index),
                "count": count,
                "percentage": (count / total_accesses) * 100 if total_accesses else 0
            }
            for index, count in top_indices
        ]

    def _get_access_distribution(self) -> Dict[str, Any]:
        """
        Analyze the distribution of memory accesses.
        
        Returns:
            Dictionary with access distribution information
            
        Time Complexity: O(n) where n is the number of accesses
        Space Complexity: O(k) where k is the range of indices
        """
        # Combine read and write accesses
        all_accesses = self.access_patterns["read_indices"] + self.access_patterns["write_indices"]
        
        if not all_accesses:
            return {"uniform": True, "clusters": []}
        
        # Find min and max accessed indices
        min_index = min(all_accesses)
        max_index = max(all_accesses)
        range_size = max_index - min_index + 1
        
        # Create histogram buckets
        bucket_count = min(20, range_size)
        bucket_size = range_size / bucket_count if bucket_count > 0 else 1
        histogram = [0] * bucket_count
        
        # Fill histogram
        for index in all_accesses:
            bucket = min(bucket_count - 1, int((index - min_index) / bucket_size))
            histogram[bucket] += 1
        
        # Find access clusters (regions of high density)
        clusters = []
        current_cluster = None
        
        for i in range(bucket_count):
            density = histogram[i] / len(all_accesses)
            
            if density > 0.1:  # Arbitrary threshold for a "cluster"
                if current_cluster is None:
                    current_cluster = {
                        "start_bucket": i,
                        "end_bucket": i,
                        "count": histogram[i],
                        "start_index": min_index + int(i * bucket_size),
                        "end_index": min_index + int((i + 1) * bucket_size) - 1
                    }
                else:
                    current_cluster["end_bucket"] = i
                    current_cluster["count"] += histogram[i]
                    current_cluster["end_index"] = min_index + int((i + 1) * bucket_size) - 1
            elif current_cluster:
                clusters.append(current_cluster)
                current_cluster = None
        
        # Don't forget the last cluster if we ended on one
        if current_cluster:
            clusters.append(current_cluster)
        
        # Calculate uniformity measure
        ideal_count = len(all_accesses) / bucket_count if bucket_count > 0 else len(all_accesses)
        deviations = [abs(count - ideal_count) for count in histogram]
        uniformity = 1 - (sum(deviations) / len(all_accesses) if all_accesses else 0)
        
        return {
            "histogram": histogram,
            "bucket_size": bucket_size,
            "min_index": min_index,
            "max_index": max_index,
            "uniformity": uniformity,
            "clusters": clusters
        }

    def _get_access_hotspots(self) -> List[Dict[str, Any]]:
        """
        Identify memory access hotspots.
        
        Returns:
            List of hotspot regions
        
        Time Complexity: O(n)
        Space Complexity: O(k) where k is the number of hotspots
        """
        # Simple implementation - return most accessed indices
        # A more sophisticated implementation could use clustering or heatmap analysis
        return self._get_most_accessed_indices(5)

    def _get_farthest_moving_elements(self, limit: int) -> List[Dict[str, Any]]:
        """
        Get elements that moved the farthest during sorting.
        
        Args:
            limit: Maximum number of elements to return
            
        Returns:
            List of elements with distance and path information
            
        Time Complexity: O(n log n) for sorting
        Space Complexity: O(n)
        """
        # Sort elements by total distance moved
        sorted_elements = sorted(
            self.element_movements["distances"].items(),
            key=lambda x: x[1],
            reverse=True
        )
        
        # Take top 'limit' entries and format results
        return [
            {
                "element": element,
                "distance": distance,
                "path": self.element_movements["paths"].get(element, [])
            }
            for element, distance in sorted_elements[:limit]
        ]

    def _calculate_work_done(self) -> float:
        """
        Calculate a weighted measure of algorithmic work.
        
        Returns:
            Numerical score representing work performed
            
        Time Complexity: O(1)
        Space Complexity: O(1)
        """
        # Define operation weights for work calculation
        weights = {
            "comparison": 1.0,
            "swap": 2.0,
            "read": 0.5,
            "write": 1.0,
            "movement": 0.1  # Per unit of distance
        }
        
        # Calculate weighted sum
        return (
            self.metrics["comparisons"] * weights["comparison"] +
            self.metrics["swaps"] * weights["swap"] +
            self.metrics["reads"] * weights["read"] +
            self.metrics["writes"] * weights["write"] +
            self.element_movements["total_distance"] * weights["movement"]
        )

    def _calculate_spatial_locality_score(self) -> float:
        """
        Calculate a score representing spatial locality of memory accesses.
        
        Returns:
            Spatial locality score (0.0-1.0, higher is better)
            
        Time Complexity: O(n)
        Space Complexity: O(1)
        """
        if not self.statistics["memory_access_distances"]:
            return 1.0  # Default for no data
            
        # Calculate weighted score based on access distances
        # Shorter distances = better spatial locality
        distances = self.statistics["memory_access_distances"]
        max_distance = max(distances) if distances else 1
        
        # Convert distances to locality scores (1.0 for distance 1, approaching 0 for large distances)
        locality_scores = [1.0 / min(d, max_distance) for d in distances]
        
        # Return average locality score
        return sum(locality_scores) / len(locality_scores) if locality_scores else 1.0


# For testing/example usage
if __name__ == "__main__":
    # Example usage demonstration
    instrumentation = AlgorithmInstrumentation()
    instrumentation.start_timing()
    
    # Simulated array and operations
    array = [5, 3, 8, 4, 2]
    
    # Simulate some operations
    for i in range(len(array) - 1):
        for j in range(i + 1, len(array)):
            # Compare elements
            result = -1 if array[i] < array[j] else 1 if array[i] > array[j] else 0
            instrumentation.track_comparison(array[i], array[j], result)
            
            # Swap if needed
            if result > 0:
                instrumentation.track_swap(array, i, j)
    
    # End timing and generate report
    instrumentation.end_timing()
    report = instrumentation.generate_report()
    
    # Print some key metrics
    print(f"Total comparisons: {report['metrics']['comparisons']}")
    print(f"Total swaps: {report['metrics']['swaps']}")
    print(f"Execution time: {report['metrics']['execution_time']:.6f} seconds")
    print(f"Operations per second: {report['performance']['operations_per_second']:.2f}")
    print(f"Sorted array: {array}")
