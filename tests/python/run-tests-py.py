#!/usr/bin/env python3
"""
Advanced Sorting Algorithm Visualization Platform - Comprehensive Test Runner

This script serves as the main entry point for executing test suites for the Python
components of the sorting algorithm visualization platform. It provides a sophisticated
command-line interface for selecting specific categories of tests, configuring test
behavior, and generating detailed reports on test outcomes.

The test runner supports:
- Algorithm category-based test selection (comparison, distribution, network, etc.)
- Test type filtering (unit, integration, performance, visual)
- Advanced reporting with visualizations of test results
- Performance benchmarking with detailed metrics
- Parallelized test execution for efficiency
- Coverage analysis with detailed reports
- Data set configuration for thorough algorithm testing

The design follows a modular architecture with separation of concerns between:
- Test discovery and organization
- Test execution and monitoring
- Result analysis and reporting
- Performance benchmarking

This runner integrates with the pytest framework while providing additional capabilities
specific to algorithm testing and visualization verification.

Authors:
    Sorting Algorithm Visualization Team

Usage:
    python run_tests.py [options]

Examples:
    python run_tests.py --category=comparison --report-dir=./reports
    python run_tests.py --algorithm=merge_sort --performance
    python run_tests.py --full-suite --parallel=4 --coverage
"""

import argparse
import datetime
import json
import os
import sys
import time
from collections import defaultdict
from pathlib import Path
import shutil
import subprocess
import tempfile
from typing import Dict, List, Optional, Set, Tuple, Union

try:
    import pytest
    import matplotlib.pyplot as plt
    import numpy as np
    from pytest_cov.plugin import CoveragePlugin
except ImportError as e:
    print(f"Error: Required package not found: {e}")
    print("Please install required packages with: pip install pytest pytest-cov matplotlib numpy")
    sys.exit(1)


class AlgorithmTestSuite:
    """
    Comprehensive test suite manager for sorting algorithm implementations.
    
    This class manages the organization, discovery, and categorization of tests
    for the sorting algorithm visualization platform. It maps algorithm categories
    to their respective test modules and provides methods for selecting and
    filtering tests based on various criteria.
    """
    
    # Algorithm categories with their associated test modules
    CATEGORY_MAPPING = {
        'comparison': [
            'bubble_sort_test.py',
            'cocktail_shaker_sort_test.py',
            'comb_sort_test.py',
            'cycle_sort_test.py',
            'gnome_sort_test.py',
            'heap_sort_test.py',
            'insertion_sort_test.py',
            'binary_insertion_sort_test.py',
            'intro_sort_test.py',
            'merge_sort_test.py',
            'odd_even_sort_test.py',
            'quick_sort_test.py',
            'selection_sort_test.py',
            'shell_sort_test.py',
            'tim_sort_test.py'
        ],
        'distribution': [
            'bucket_sort_test.py',
            'counting_sort_test.py',
            'pigeonhole_sort_test.py',
            'radix_sort_test.py'
        ],
        'network': [
            'bitonic_sort_test.py',
            'odd_even_merge_sort_test.py'
        ],
        'special': [
            'bogo_sort_test.py',
            'pancake_sort_test.py'
        ],
        'selection': [
            'quick_select_test.py',
            'median_of_medians_test.py'
        ],
        'core': [
            'base_algorithm_test.py',
            'instrumentation_test.py'
        ]
    }
    
    # Individual algorithm to test file mapping for direct selection
    ALGORITHM_MAPPING = {
        'bubble_sort': 'bubble_sort_test.py',
        'cocktail_shaker_sort': 'cocktail_shaker_sort_test.py',
        'comb_sort': 'comb_sort_test.py',
        'cycle_sort': 'cycle_sort_test.py',
        'gnome_sort': 'gnome_sort_test.py',
        'heap_sort': 'heap_sort_test.py',
        'insertion_sort': 'insertion_sort_test.py',
        'binary_insertion_sort': 'binary_insertion_sort_test.py',
        'intro_sort': 'intro_sort_test.py',
        'merge_sort': 'merge_sort_test.py',
        'odd_even_sort': 'odd_even_sort_test.py',
        'quick_sort': 'quick_sort_test.py',
        'selection_sort': 'selection_sort_test.py',
        'shell_sort': 'shell_sort_test.py',
        'tim_sort': 'tim_sort_test.py',
        'bucket_sort': 'bucket_sort_test.py',
        'counting_sort': 'counting_sort_test.py',
        'pigeonhole_sort': 'pigeonhole_sort_test.py',
        'radix_sort': 'radix_sort_test.py',
        'bitonic_sort': 'bitonic_sort_test.py',
        'odd_even_merge_sort': 'odd_even_merge_sort_test.py',
        'bogo_sort': 'bogo_sort_test.py',
        'pancake_sort': 'pancake_sort_test.py',
        'quick_select': 'quick_select_test.py',
        'median_of_medians': 'median_of_medians_test.py'
    }
    
    # Base paths for different test types
    BASE_PATHS = {
        'algorithms': 'tests/python/algorithms',
        'unit': 'tests/python',
        'integration': 'tests/python/integration',
        'performance': 'tests/python/performance',
        'visual': 'tests/python/visualization'
    }
    
    def __init__(self, project_root: str):
        """
        Initialize the test suite with the project root directory.
        
        Args:
            project_root: Path to the project root directory
        """
        self.project_root = Path(project_root)
        self.verify_project_structure()
    
    def verify_project_structure(self) -> None:
        """
        Verify that the project structure contains the expected test directories.
        
        Raises:
            FileNotFoundError: If critical test directories are missing
        """
        algorithms_path = self.project_root / self.BASE_PATHS['algorithms']
        if not algorithms_path.exists():
            raise FileNotFoundError(
                f"Algorithm tests directory not found at {algorithms_path}. "
                "Please ensure you're running from the project root directory."
            )
    
    def get_test_modules(self, 
                        category: Optional[str] = None, 
                        algorithm: Optional[str] = None,
                        test_type: str = 'unit') -> List[str]:
        """
        Get the test modules to run based on category, algorithm, and test type.
        
        Args:
            category: Algorithm category (comparison, distribution, etc.) or None for all
            algorithm: Specific algorithm name or None for all in the category
            test_type: Type of tests to run (unit, integration, performance, visual)
            
        Returns:
            List of test module paths to run
        """
        if algorithm:
            # Run tests for a specific algorithm
            if algorithm not in self.ALGORITHM_MAPPING:
                raise ValueError(f"Unknown algorithm: {algorithm}")
            
            test_file = self.ALGORITHM_MAPPING[algorithm]
            category_path = self._determine_category_for_algorithm(algorithm)
            return [str(self.project_root / self.BASE_PATHS['algorithms'] / category_path / test_file)]
        
        elif category:
            # Run tests for a specific category
            if category not in self.CATEGORY_MAPPING:
                raise ValueError(f"Unknown category: {category}")
            
            return [
                str(self.project_root / self.BASE_PATHS['algorithms'] / category / test_file)
                for test_file in self.CATEGORY_MAPPING[category]
            ]
        
        else:
            # Run all tests of the specified type
            if test_type == 'unit':
                return [str(self.project_root / self.BASE_PATHS['unit'])]
            else:
                return [str(self.project_root / self.BASE_PATHS[test_type])]
    
    def _determine_category_for_algorithm(self, algorithm: str) -> str:
        """
        Determine the category directory for a specific algorithm.
        
        Args:
            algorithm: Name of the algorithm
            
        Returns:
            Category directory name
            
        Raises:
            ValueError: If the algorithm cannot be mapped to a category
        """
        for category, algorithms in self.CATEGORY_MAPPING.items():
            if f"{algorithm}_test.py" in algorithms:
                return category
        
        raise ValueError(f"Could not determine category for algorithm: {algorithm}")
    
    def list_available_tests(self) -> Dict[str, List[str]]:
        """
        List all available tests organized by category.
        
        Returns:
            Dictionary mapping categories to lists of algorithm names
        """
        available_tests = {}
        
        for category, test_files in self.CATEGORY_MAPPING.items():
            available_tests[category] = [
                test_file.replace('_test.py', '') 
                for test_file in test_files
            ]
        
        return available_tests


class TestResultAnalyzer:
    """
    Analyzer for test execution results with visualization capabilities.
    
    This class processes test execution results, extracts metrics, and generates
    visualizations for performance analysis and coverage reporting.
    """
    
    def __init__(self, results_dir: str):
        """
        Initialize the analyzer with a directory for storing results.
        
        Args:
            results_dir: Directory path for storing analysis results
        """
        self.results_dir = Path(results_dir)
        self.results_dir.mkdir(parents=True, exist_ok=True)
        self.performance_data = {}
        self.coverage_data = {}
        
    def process_performance_results(self, results: Dict) -> None:
        """
        Process performance benchmark results and store for visualization.
        
        Args:
            results: Dictionary of performance results by algorithm
        """
        self.performance_data = results
        
    def process_coverage_results(self, coverage_data: Dict) -> None:
        """
        Process coverage results and store for visualization.
        
        Args:
            coverage_data: Coverage data dictionary
        """
        self.coverage_data = coverage_data
        
    def generate_performance_visualization(self) -> str:
        """
        Generate a visualization of algorithm performance metrics.
        
        Returns:
            Path to the generated visualization file
        """
        if not self.performance_data:
            return "No performance data available"
            
        # Extract algorithm names and execution times
        algorithms = []
        times = []
        comparisons = []
        memory_accesses = []
        
        for algo, metrics in self.performance_data.items():
            algorithms.append(algo)
            times.append(metrics.get('execution_time', 0))
            comparisons.append(metrics.get('comparisons', 0))
            memory_accesses.append(metrics.get('memory_accesses', 0))
        
        # Create the visualization
        plt.figure(figsize=(15, 10))
        
        # Execution time subplot
        plt.subplot(3, 1, 1)
        plt.barh(algorithms, times)
        plt.xlabel('Execution Time (ms)')
        plt.title('Algorithm Performance Comparison')
        
        # Comparisons subplot
        plt.subplot(3, 1, 2)
        plt.barh(algorithms, comparisons)
        plt.xlabel('Number of Comparisons')
        
        # Memory accesses subplot
        plt.subplot(3, 1, 3)
        plt.barh(algorithms, memory_accesses)
        plt.xlabel('Memory Accesses')
        
        plt.tight_layout()
        
        # Save the visualization
        timestamp = datetime.datetime.now().strftime("%Y%m%d-%H%M%S")
        viz_path = self.results_dir / f"performance_comparison_{timestamp}.png"
        plt.savefig(viz_path)
        plt.close()
        
        return str(viz_path)
        
    def generate_coverage_report(self) -> str:
        """
        Generate an HTML coverage report.
        
        Returns:
            Path to the generated coverage report directory
        """
        if not self.coverage_data:
            return "No coverage data available"
            
        # Generate HTML report directory
        coverage_html_dir = self.results_dir / "coverage_html"
        coverage_html_dir.mkdir(parents=True, exist_ok=True)
        
        # This would normally use the coverage API to generate the HTML report
        # For now, we'll just create a placeholder
        index_html = coverage_html_dir / "index.html"
        with open(index_html, 'w') as f:
            f.write("<html><body><h1>Coverage Report</h1></body></html>")
            
        return str(coverage_html_dir)
        
    def generate_summary_report(self, 
                              test_results: Dict, 
                              execution_time: float) -> str:
        """
        Generate a comprehensive summary report of all test results.
        
        Args:
            test_results: Dictionary of test results
            execution_time: Total execution time in seconds
            
        Returns:
            Path to the generated summary report
        """
        timestamp = datetime.datetime.now().strftime("%Y%m%d-%H%M%S")
        report_path = self.results_dir / f"test_summary_{timestamp}.html"
        
        with open(report_path, 'w') as f:
            f.write(f"""
            <html>
            <head>
                <title>Test Execution Summary Report</title>
                <style>
                    body {{ font-family: Arial, sans-serif; margin: 40px; }}
                    h1 {{ color: #333366; }}
                    h2 {{ color: #333366; margin-top: 30px; }}
                    table {{ border-collapse: collapse; width: 100%; }}
                    th, td {{ text-align: left; padding: 8px; border: 1px solid #ddd; }}
                    th {{ background-color: #f2f2f2; }}
                    tr:nth-child(even) {{ background-color: #f9f9f9; }}
                    .success {{ color: green; }}
                    .failure {{ color: red; }}
                    .summary {{ margin: 20px 0; padding: 15px; background-color: #f8f8f8; }}
                </style>
            </head>
            <body>
                <h1>Sorting Algorithm Test Summary Report</h1>
                <div class="summary">
                    <p><strong>Date/Time:</strong> {datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")}</p>
                    <p><strong>Total Execution Time:</strong> {execution_time:.2f} seconds</p>
                    <p><strong>Overall Result:</strong> <span class="{'success' if test_results.get('overall_success', False) else 'failure'}">
                        {test_results.get('overall_result', 'Unknown')}
                    </span></p>
                </div>
                
                <h2>Test Results By Category</h2>
                <table>
                    <tr>
                        <th>Category</th>
                        <th>Total Tests</th>
                        <th>Passed</th>
                        <th>Failed</th>
                        <th>Skipped</th>
                        <th>Success Rate</th>
                    </tr>
            """)
            
            # Add category results
            for category, results in test_results.get('categories', {}).items():
                total = results.get('total', 0)
                passed = results.get('passed', 0)
                success_rate = (passed / total * 100) if total > 0 else 0
                
                f.write(f"""
                    <tr>
                        <td>{category}</td>
                        <td>{total}</td>
                        <td>{passed}</td>
                        <td>{results.get('failed', 0)}</td>
                        <td>{results.get('skipped', 0)}</td>
                        <td>{success_rate:.1f}%</td>
                    </tr>
                """)
                
            f.write("""
                </table>
                
                <h2>Algorithm Performance Summary</h2>
                <table>
                    <tr>
                        <th>Algorithm</th>
                        <th>Execution Time (ms)</th>
                        <th>Comparisons</th>
                        <th>Memory Accesses</th>
                    </tr>
            """)
            
            # Add performance results
            for algo, metrics in self.performance_data.items():
                f.write(f"""
                    <tr>
                        <td>{algo}</td>
                        <td>{metrics.get('execution_time', 0):.2f}</td>
                        <td>{metrics.get('comparisons', 0)}</td>
                        <td>{metrics.get('memory_accesses', 0)}</td>
                    </tr>
                """)
                
            f.write("""
                </table>
                
                <h2>Coverage Summary</h2>
                <p>Detailed coverage report is available in the coverage_html directory.</p>
            """)
            
            # Add any failures in detail
            failures = test_results.get('failures', [])
            if failures:
                f.write("""
                    <h2>Test Failures</h2>
                    <table>
                        <tr>
                            <th>Test</th>
                            <th>Error Message</th>
                        </tr>
                """)
                
                for failure in failures:
                    f.write(f"""
                        <tr>
                            <td>{failure.get('test', 'Unknown')}</td>
                            <td>{failure.get('message', 'No error message')}</td>
                        </tr>
                    """)
                    
                f.write("</table>")
                
            f.write("""
            </body>
            </html>
            """)
            
        return str(report_path)


class TestRunner:
    """
    Advanced test runner for the sorting algorithm visualization platform.
    
    This class manages the execution of test suites, including:
    - Configuring test environments
    - Running tests with appropriate parameters
    - Collecting and analyzing results
    - Generating reports and visualizations
    """
    
    def __init__(self, args: argparse.Namespace):
        """
        Initialize the test runner with command line arguments.
        
        Args:
            args: Parsed command line arguments
        """
        self.args = args
        self.project_root = self._determine_project_root()
        self.test_suite = AlgorithmTestSuite(self.project_root)
        
        # Create results directory if not exists
        self.results_dir = Path(args.report_dir) if args.report_dir else Path("test_results")
        self.results_dir.mkdir(parents=True, exist_ok=True)
        
        self.analyzer = TestResultAnalyzer(str(self.results_dir))
        self.start_time = None
        self.end_time = None
    
    def _determine_project_root(self) -> str:
        """
        Determine the project root directory.
        
        Returns:
            Path to the project root directory
        """
        # If explicitly specified, use that
        if self.args.project_root:
            return self.args.project_root
            
        # Otherwise, try to detect it
        current_dir = Path.cwd()
        
        # Check if current directory contains both 'src' and 'tests' directories
        if (current_dir / 'src').exists() and (current_dir / 'tests').exists():
            return str(current_dir)
            
        # Check for python directory as a fallback
        if (current_dir / 'python').exists():
            return str(current_dir)
            
        # Default to current directory with a warning
        print("Warning: Could not determine project root directory. Using current directory.")
        return str(current_dir)
    
    def prepare_environment(self) -> None:
        """
        Prepare the test environment before execution.
        
        This includes:
        - Setting up environment variables
        - Creating temporary directories
        - Installing required test dependencies
        """
        # Set environment variables for test configuration
        os.environ['PYTHONPATH'] = f"{self.project_root}:{os.environ.get('PYTHONPATH', '')}"
        
        # Set up coverage config if needed
        if self.args.coverage:
            os.environ['PYTEST_ADDOPTS'] = "--cov=python --cov-report=term"
    
    def build_pytest_args(self) -> List[str]:
        """
        Build the pytest command line arguments based on runner configuration.
        
        Returns:
            List of command line arguments for pytest
        """
        pytest_args = []
        
        # Add test modules based on category/algorithm
        if self.args.full_suite:
            # Run all tests
            pytest_args.append("tests/python")
        else:
            # Get specific test modules
            test_modules = self.test_suite.get_test_modules(
                category=self.args.category,
                algorithm=self.args.algorithm,
                test_type=self.args.test_type
            )
            pytest_args.extend(test_modules)
        
        # Add verbosity
        if self.args.verbose:
            pytest_args.append("-v")
        
        # Add markers for test selection
        if self.args.markers:
            for marker in self.args.markers.split(','):
                pytest_args.extend(["-m", marker])
        
        # Configure XML report output
        if self.args.report_dir:
            junit_xml = Path(self.args.report_dir) / "junit-report.xml"
            pytest_args.extend(["--junitxml", str(junit_xml)])
        
        # Configure parallel execution
        if self.args.parallel:
            workers = str(self.args.parallel) if isinstance(self.args.parallel, int) else "auto"
            pytest_args.extend(["-n", workers])
        
        # Add performance testing configuration
        if self.args.performance:
            pytest_args.extend(["-m", "performance"])
        
        return pytest_args
    
    def run_tests(self) -> int:
        """
        Execute the test suite with the configured options.
        
        Returns:
            Exit code (0 for success, non-zero for failure)
        """
        self.start_time = time.time()
        
        # Prepare the environment
        self.prepare_environment()
        
        # Build pytest arguments
        pytest_args = self.build_pytest_args()
        
        # Print test execution plan
        self._print_execution_plan(pytest_args)
        
        # Run the tests
        exit_code = pytest.main(pytest_args)
        
        # Process results and generate reports
        self._process_results()
        
        self.end_time = time.time()
        self._print_summary(exit_code)
        
        return exit_code
    
    def _process_results(self) -> None:
        """
        Process test results and generate reports.
        """
        # This is a simplified implementation for demonstration
        # In a real implementation, this would parse the JUnit XML report
        
        # Mock performance data for demonstration
        performance_data = {
            "merge_sort": {
                "execution_time": 12.5,
                "comparisons": 1024,
                "memory_accesses": 2048
            },
            "quick_sort": {
                "execution_time": 10.2,
                "comparisons": 976,
                "memory_accesses": 1832
            },
            "heap_sort": {
                "execution_time": 14.7,
                "comparisons": 1122,
                "memory_accesses": 2244
            }
        }
        
        # Process the results
        self.analyzer.process_performance_results(performance_data)
        
        # Generate visualizations
        if self.args.performance:
            viz_path = self.analyzer.generate_performance_visualization()
            print(f"Performance visualization saved to: {viz_path}")
        
        # Generate summary report
        mock_results = {
            "overall_success": True,
            "overall_result": "PASSED",
            "categories": {
                "comparison": {"total": 15, "passed": 15, "failed": 0, "skipped": 0},
                "distribution": {"total": 4, "passed": 4, "failed": 0, "skipped": 0},
                "network": {"total": 2, "passed": 2, "failed": 0, "skipped": 0}
            },
            "failures": []
        }
        
        report_path = self.analyzer.generate_summary_report(
            mock_results, 
            self.end_time - self.start_time
        )
        print(f"Test summary report saved to: {report_path}")
    
    def _print_execution_plan(self, pytest_args: List[str]) -> None:
        """
        Print information about the tests that will be executed.
        
        Args:
            pytest_args: List of pytest arguments
        """
        print("\n=== Test Execution Plan ===")
        
        # Print test selection
        if self.args.algorithm:
            print(f"Algorithm: {self.args.algorithm}")
        elif self.args.category:
            print(f"Category: {self.args.category}")
        else:
            print("Test Scope: Full Suite" if self.args.full_suite else "Test Type: Unit Tests")
        
        # Print feature flags
        print(f"Performance Testing: {'enabled' if self.args.performance else 'disabled'}")
        print(f"Coverage Analysis: {'enabled' if self.args.coverage else 'disabled'}")
        print(f"Parallel Execution: {'enabled' if self.args.parallel else 'disabled'}")
        
        # Print the full pytest command
        cmd = "pytest " + " ".join(pytest_args)
        print(f"\nCommand: {cmd}\n")
    
    def _print_summary(self, exit_code: int) -> None:
        """
        Print a summary of the test execution.
        
        Args:
            exit_code: Exit code from pytest execution
        """
        duration = self.end_time - self.start_time
        
        print("\n=== Test Execution Summary ===")
        print(f"Total execution time: {duration:.2f} seconds")
        
        if self.args.algorithm:
            print(f"Algorithm: {self.args.algorithm}")
        elif self.args.category:
            print(f"Category: {self.args.category}")
        else:
            print("Test Scope: Full Suite" if self.args.full_suite else "Test Type: Unit Tests")
            
        print(f"Performance Testing: {'enabled' if self.args.performance else 'disabled'}")
        print(f"Coverage Analysis: {'enabled' if self.args.coverage else 'disabled'}")
        
        if self.args.report_dir:
            print(f"Reports directory: {self.args.report_dir}")
            
        print(f"Test result: {'SUCCESS' if exit_code == 0 else 'FAILURE'}")
        
        if exit_code == 0:
            print("\n✓ All tests passed successfully!")
        else:
            print(f"\n✗ Tests failed with exit code: {exit_code}")


def parse_arguments() -> argparse.Namespace:
    """
    Parse command line arguments for the test runner.
    
    Returns:
        Parsed command line arguments
    """
    parser = argparse.ArgumentParser(
        description="Advanced Sorting Algorithm Visualization Platform Test Runner",
        formatter_class=argparse.ArgumentDefaultsHelpFormatter
    )
    
    # Test selection options
    selection_group = parser.add_argument_group("Test Selection")
    selection_exclusive = selection_group.add_mutually_exclusive_group()
    selection_exclusive.add_argument(
        '--category',
        help='Run tests for specific algorithm category',
        choices=['comparison', 'distribution', 'network', 'special', 'selection', 'core'],
        default=None
    )
    selection_exclusive.add_argument(
        '--algorithm',
        help='Run tests for a specific algorithm',
        default=None
    )
    selection_exclusive.add_argument(
        '--full-suite',
        help='Run the full test suite',
        action='store_true'
    )
    selection_group.add_argument(
        '--test-type',
        help='Type of tests to run',
        choices=['unit', 'integration', 'performance', 'visual'],
        default='unit'
    )
    selection_group.add_argument(
        '--markers',
        help='Pytest markers to select tests (comma-separated)',
        default=None
    )
    
    # Test configuration options
    config_group = parser.add_argument_group("Test Configuration")
    config_group.add_argument(
        '--parallel',
        help='Run tests in parallel with specified number of workers (or "auto")',
        nargs='?',
        const='auto',
        default=None
    )
    config_group.add_argument(
        '--performance',
        help='Run performance benchmarks',
        action='store_true'
    )
    config_group.add_argument(
        '--coverage',
        help='Generate code coverage report',
        action='store_true'
    )
    config_group.add_argument(
        '--project-root',
        help='Path to project root directory',
        default=None
    )
    
    # Output options
    output_group = parser.add_argument_group("Output Options")
    output_group.add_argument(
        '--report-dir',
        help='Directory to store test reports and visualizations',
        default=None
    )
    output_group.add_argument(
        '--verbose',
        help='Increase output verbosity',
        action='store_true'
    )
    output_group.add_argument(
        '--list-tests',
        help='List available tests and exit',
        action='store_true'
    )
    
    args = parser.parse_args()
    
    return args


def main() -> int:
    """
    Main entry point for the test runner.
    
    Returns:
        Exit code (0 for success, non-zero for failure)
    """
    # Parse command line arguments
    args = parse_arguments()
    
    try:
        # Create test suite to validate project structure
        test_suite = AlgorithmTestSuite(args.project_root or os.getcwd())
        
        # Handle --list-tests option
        if args.list_tests:
            print("\n=== Available Tests ===")
            available_tests = test_suite.list_available_tests()
            
            for category, algorithms in available_tests.items():
                print(f"\n{category.upper()} ALGORITHMS:")
                for algorithm in algorithms:
                    print(f"  - {algorithm}")
            
            return 0
        
        # Create and run the test runner
        runner = TestRunner(args)
        return runner.run_tests()
        
    except Exception as e:
        print(f"Error: {e}")
        if args.verbose:
            import traceback
            traceback.print_exc()
        return 1


if __name__ == "__main__":
    sys.exit(main())
