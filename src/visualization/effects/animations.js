/**
 * @file animations.js
 * @module AnimationSystem
 * @author Algorithm Visualization Platform Team
 * @version 2.1.0
 * @copyright MIT License
 * 
 * @description
 * Advanced animation system for algorithm visualization with time-based interpolation,
 * composition, and synchronization capabilities. Provides a comprehensive framework
 * for creating smooth, performant, and educational transitions between algorithm states.
 * 
 * This system is designed around several core computational principles:
 * 1. Temporal coherence - animations maintain consistent timing regardless of frame rate
 * 2. Compositional semantics - animations can be composed in sequences and parallel groups
 * 3. Transformation invariants - animation transforms preserve identity properties
 * 4. Performance optimization - O(1) property lookup with minimal memory overhead
 * 
 * The implementation uses a declarative approach to animation definition with imperative
 * execution, allowing complex animation sequences to be defined concisely while maintaining
 * precise control over their execution.
 * 
 * Time complexity:
 * - Animation creation: O(1)
 * - Animation update: O(n) where n is the number of active properties
 * - Animation sequencing: O(1) amortized
 * 
 * Space complexity:
 * - O(p + a) where p is the number of properties and a is the number of active animations
 */

/**
 * Standard easing functions with mathematically correct implementations
 * Each function maps the domain [0,1] to the range [0,1] with various curves
 * 
 * @namespace Easing
 */
const Easing = Object.freeze({
    /**
     * Linear interpolation (constant velocity)
     * f(t) = t
     * 
     * @param {number} t - Normalized time (0 to 1)
     * @returns {number} Interpolated value (0 to 1)
     */
    linear: t => t,
    
    /**
     * Quadratic ease-in (accelerating from zero velocity)
     * f(t) = t²
     * 
     * @param {number} t - Normalized time (0 to 1)
     * @returns {number} Interpolated value (0 to 1)
     */
    easeInQuad: t => t * t,
    
    /**
     * Quadratic ease-out (decelerating to zero velocity)
     * f(t) = t * (2-t)
     * 
     * @param {number} t - Normalized time (0 to 1)
     * @returns {number} Interpolated value (0 to 1)
     */
    easeOutQuad: t => t * (2 - t),
    
    /**
     * Quadratic ease-in-out (acceleration until halfway, then deceleration)
     * f(t) = t<.5 ? 2t² : -1+(4-2t)*t
     * 
     * @param {number} t - Normalized time (0 to 1)
     * @returns {number} Interpolated value (0 to 1)
     */
    easeInOutQuad: t => t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t,
    
    /**
     * Cubic ease-in
     * f(t) = t³
     * 
     * @param {number} t - Normalized time (0 to 1)
     * @returns {number} Interpolated value (0 to 1)
     */
    easeInCubic: t => t * t * t,
    
    /**
     * Cubic ease-out
     * f(t) = (t-1)³ + 1
     * 
     * @param {number} t - Normalized time (0 to 1)
     * @returns {number} Interpolated value (0 to 1)
     */
    easeOutCubic: t => (--t) * t * t + 1,
    
    /**
     * Cubic ease-in-out
     * f(t) = t<.5 ? 4t³ : (t-1)*(2t-2)²+1
     * 
     * @param {number} t - Normalized time (0 to 1)
     * @returns {number} Interpolated value (0 to 1)
     */
    easeInOutCubic: t => t < 0.5 ? 4 * t * t * t : (t - 1) * (2 * t - 2) * (2 * t - 2) + 1,
    
    /**
     * Quartic ease-in
     * f(t) = t⁴
     * 
     * @param {number} t - Normalized time (0 to 1)
     * @returns {number} Interpolated value (0 to 1)
     */
    easeInQuart: t => t * t * t * t,
    
    /**
     * Quartic ease-out
     * f(t) = 1-(t-1)⁴
     * 
     * @param {number} t - Normalized time (0 to 1)
     * @returns {number} Interpolated value (0 to 1)
     */
    easeOutQuart: t => 1 - (--t) * t * t * t,
    
    /**
     * Quartic ease-in-out
     * f(t) = t<.5 ? 8t⁴ : 1-8*(t-1)⁴
     * 
     * @param {number} t - Normalized time (0 to 1)
     * @returns {number} Interpolated value (0 to 1)
     */
    easeInOutQuart: t => t < 0.5 ? 8 * t * t * t * t : 1 - 8 * (--t) * t * t * t,
    
    /**
     * Quintic ease-in
     * f(t) = t⁵
     * 
     * @param {number} t - Normalized time (0 to 1)
     * @returns {number} Interpolated value (0 to 1)
     */
    easeInQuint: t => t * t * t * t * t,
    
    /**
     * Quintic ease-out
     * f(t) = 1+(t-1)⁵
     * 
     * @param {number} t - Normalized time (0 to 1)
     * @returns {number} Interpolated value (0 to 1)
     */
    easeOutQuint: t => 1 + (--t) * t * t * t * t,
    
    /**
     * Quintic ease-in-out
     * f(t) = t<.5 ? 16t⁵ : 1+16*(t-1)⁵
     * 
     * @param {number} t - Normalized time (0 to 1)
     * @returns {number} Interpolated value (0 to 1)
     */
    easeInOutQuint: t => t < 0.5 ? 16 * t * t * t * t * t : 1 + 16 * (--t) * t * t * t * t,
    
    /**
     * Sine ease-in
     * f(t) = 1-cos(t * π/2)
     * 
     * @param {number} t - Normalized time (0 to 1)
     * @returns {number} Interpolated value (0 to 1)
     */
    easeInSine: t => 1 - Math.cos(t * Math.PI / 2),
    
    /**
     * Sine ease-out
     * f(t) = sin(t * π/2)
     * 
     * @param {number} t - Normalized time (0 to 1)
     * @returns {number} Interpolated value (0 to 1)
     */
    easeOutSine: t => Math.sin(t * Math.PI / 2),
    
    /**
     * Sine ease-in-out
     * f(t) = -(cos(π * t) - 1) / 2
     * 
     * @param {number} t - Normalized time (0 to 1)
     * @returns {number} Interpolated value (0 to 1)
     */
    easeInOutSine: t => -(Math.cos(Math.PI * t) - 1) / 2,
    
    /**
     * Circular ease-in
     * f(t) = 1 - √(1 - t²)
     * 
     * @param {number} t - Normalized time (0 to 1)
     * @returns {number} Interpolated value (0 to 1)
     */
    easeInCirc: t => 1 - Math.sqrt(1 - t * t),
    
    /**
     * Circular ease-out
     * f(t) = √(1 - (t-1)²)
     * 
     * @param {number} t - Normalized time (0 to 1)
     * @returns {number} Interpolated value (0 to 1)
     */
    easeOutCirc: t => Math.sqrt(1 - (--t) * t),
    
    /**
     * Circular ease-in-out
     * f(t) = t<.5 ? (1-√(1-4t²))/2 : (√(1-(2t-2)²)+1)/2
     * 
     * @param {number} t - Normalized time (0 to 1)
     * @returns {number} Interpolated value (0 to 1)
     */
    easeInOutCirc: t => t < 0.5 
        ? (1 - Math.sqrt(1 - 4 * t * t)) / 2 
        : (Math.sqrt(1 - (2 * t - 2) * (2 * t - 2)) + 1) / 2,
    
    /**
     * Exponential ease-in
     * f(t) = 2^(10*(t-1))
     * 
     * @param {number} t - Normalized time (0 to 1)
     * @returns {number} Interpolated value (0 to 1)
     */
    easeInExpo: t => t === 0 ? 0 : Math.pow(2, 10 * (t - 1)),
    
    /**
     * Exponential ease-out
     * f(t) = 1 - 2^(-10t)
     * 
     * @param {number} t - Normalized time (0 to 1)
     * @returns {number} Interpolated value (0 to 1)
     */
    easeOutExpo: t => t === 1 ? 1 : 1 - Math.pow(2, -10 * t),
    
    /**
     * Exponential ease-in-out
     * f(t) = t=0 ? 0 : t=1 ? 1 : t<.5 ? 2^(10(2t-1)-1) : 2-2^(-10(2t-1))
     * 
     * @param {number} t - Normalized time (0 to 1)
     * @returns {number} Interpolated value (0 to 1)
     */
    easeInOutExpo: t => {
        if (t === 0) return 0;
        if (t === 1) return 1;
        if (t < 0.5) return Math.pow(2, 20 * t - 10) / 2;
        return (2 - Math.pow(2, -20 * t + 10)) / 2;
    },
    
    /**
     * Elastic ease-in
     * f(t) = -(2^(10(t-1))) * sin((t-1.1)*5π)
     * 
     * @param {number} t - Normalized time (0 to 1)
     * @returns {number} Interpolated value (0 to 1)
     */
    easeInElastic: t => {
        if (t === 0) return 0;
        if (t === 1) return 1;
        const p = 0.3;
        const s = p / 4;
        return -(Math.pow(2, 10 * (t - 1)) * Math.sin((t - 1 - s) * (2 * Math.PI) / p));
    },
    
    /**
     * Elastic ease-out
     * f(t) = 2^(-10t) * sin((t-0.1)*5π) + 1
     * 
     * @param {number} t - Normalized time (0 to 1)
     * @returns {number} Interpolated value (0 to 1)
     */
    easeOutElastic: t => {
        if (t === 0) return 0;
        if (t === 1) return 1;
        const p = 0.3;
        const s = p / 4;
        return Math.pow(2, -10 * t) * Math.sin((t - s) * (2 * Math.PI) / p) + 1;
    },
    
    /**
     * Elastic ease-in-out
     * Complex sinusoidal combined with exponential function
     * 
     * @param {number} t - Normalized time (0 to 1)
     * @returns {number} Interpolated value (0 to 1)
     */
    easeInOutElastic: t => {
        if (t === 0) return 0;
        if (t === 1) return 1;
        if (t < 0.5) {
            const p = 0.3 * 1.5;
            const s = p / 4;
            return -0.5 * (Math.pow(2, 20 * t - 10) * Math.sin((20 * t - 11.125) * (2 * Math.PI) / p));
        }
        const p = 0.3 * 1.5;
        const s = p / 4;
        return Math.pow(2, -20 * t + 10) * Math.sin((20 * t - 11.125) * (2 * Math.PI) / p) * 0.5 + 1;
    },
    
    /**
     * Back ease-in (overshooting)
     * f(t) = t² * ((s+1)*t - s), where s = 1.70158
     * 
     * @param {number} t - Normalized time (0 to 1)
     * @returns {number} Interpolated value (0 to 1)
     */
    easeInBack: t => {
        const s = 1.70158;
        return t * t * ((s + 1) * t - s);
    },
    
    /**
     * Back ease-out (overshooting)
     * f(t) = 1 + (t-1)² * ((s+1)*(t-1) + s), where s = 1.70158
     * 
     * @param {number} t - Normalized time (0 to 1)
     * @returns {number} Interpolated value (0 to 1)
     */
    easeOutBack: t => {
        const s = 1.70158;
        return 1 + (--t) * t * ((s + 1) * t + s);
    },
    
    /**
     * Back ease-in-out (overshooting both sides)
     * 
     * @param {number} t - Normalized time (0 to 1)
     * @returns {number} Interpolated value (0 to 1)
     */
    easeInOutBack: t => {
        const s = 1.70158 * 1.525;
        if (t < 0.5) {
            return t * t * ((s + 1) * t - s) * 2;
        }
        return 1 + 2 * (--t) * t * ((s + 1) * t + s);
    },
    
    /**
     * Bounce ease-out (bouncing effect)
     * Simulates a bouncing effect with diminishing rebounds
     * 
     * @param {number} t - Normalized time (0 to 1)
     * @returns {number} Interpolated value (0 to 1)
     */
    easeOutBounce: t => {
        if (t < 1/2.75) {
            return 7.5625 * t * t;
        } else if (t < 2/2.75) {
            return 7.5625 * (t -= 1.5/2.75) * t + 0.75;
        } else if (t < 2.5/2.75) {
            return 7.5625 * (t -= 2.25/2.75) * t + 0.9375;
        } else {
            return 7.5625 * (t -= 2.625/2.75) * t + 0.984375;
        }
    },
    
    /**
     * Bounce ease-in (bouncing effect)
     * Inverse of easeOutBounce
     * 
     * @param {number} t - Normalized time (0 to 1)
     * @returns {number} Interpolated value (0 to 1)
     */
    easeInBounce: t => 1 - Easing.easeOutBounce(1 - t),
    
    /**
     * Bounce ease-in-out (bouncing effect on both sides)
     * Combined easeInBounce and easeOutBounce
     * 
     * @param {number} t - Normalized time (0 to 1)
     * @returns {number} Interpolated value (0 to 1)
     */
    easeInOutBounce: t => {
        if (t < 0.5) {
            return Easing.easeInBounce(t * 2) * 0.5;
        }
        return Easing.easeOutBounce(t * 2 - 1) * 0.5 + 0.5;
    },
    
    /**
     * Step function (discrete steps)
     * 
     * @param {number} steps - Number of steps
     * @returns {Function} - Easing function with the specified number of steps
     */
    steps: steps => t => Math.floor(t * steps) / steps,
    
    /**
     * Custom easing function based on a Bézier curve
     * 
     * @param {number} x1 - First control point x coordinate
     * @param {number} y1 - First control point y coordinate
     * @param {number} x2 - Second control point x coordinate
     * @param {number} y2 - Second control point y coordinate
     * @returns {Function} - Cubic Bézier easing function
     */
    cubicBezier: (x1, y1, x2, y2) => {
        // Implementation of cubic Bézier curve easing
        // Algorithm based on CSS specification
        
        // Ensure control points are in valid range
        if (x1 < 0 || x1 > 1 || x2 < 0 || x2 > 1) {
            console.warn('Control points should be in the range [0, 1]');
        }
        
        // Cache precomputed values for efficiency
        const sampleValues = new Float32Array(11);
        const a = (a1, a2) => 1.0 - 3.0 * a2 + 3.0 * a1;
        const b = (a1, a2) => 3.0 * a2 - 6.0 * a1;
        const c = (a1) => 3.0 * a1;
        
        // Compute polynomial coefficients
        const cx = a(x1, x2);
        const bx = b(x1, x2);
        const ax = c(x1);
        
        const cy = a(y1, y2);
        const by = b(y1, y2);
        const ay = c(y1);
        
        // Sample the curve and build a lookup table
        for (let i = 0; i < 11; ++i) {
            sampleValues[i] = calcBezier(i * 0.1, ax, bx, cx);
        }
        
        // Return the easing function
        return (t) => {
            if (t === 0 || t === 1) {
                return t;
            }
            
            // Find the t value using Newton-Raphson iteration
            let x = t;
            let currentT;
            let i = 0;
            
            do {
                currentT = calcBezier(x, ax, bx, cx) - t;
                x -= currentT / derivBezier(x, ax, bx);
                i++;
            } while (Math.abs(currentT) > 1e-6 && i < 8);
            
            // Compute the y coordinate
            return calcBezier(x, ay, by, cy);
        };
        
        // Helper functions for Bézier calculation
        function calcBezier(t, a, b, c) {
            return ((a * t + b) * t + c) * t;
        }
        
        function derivBezier(t, a, b) {
            return (3.0 * a * t + 2.0 * b) * t + c(x1);
        }
    }
});

/**
 * Animation utilities for interpolating values
 * 
 * @namespace Interpolation
 */
const Interpolation = Object.freeze({
    /**
     * Linear interpolation between two values
     * 
     * @param {number} a - Start value
     * @param {number} b - End value
     * @param {number} t - Interpolation factor (0-1)
     * @returns {number} - Interpolated value
     */
    lerp: (a, b, t) => a + (b - a) * t,
    
    /**
     * Interpolate between two arrays of values
     * 
     * @param {Array<number>} a - Start array
     * @param {Array<number>} b - End array
     * @param {number} t - Interpolation factor (0-1)
     * @returns {Array<number>} - Interpolated array
     * @throws {Error} If arrays have different lengths
     */
    lerpArray: (a, b, t) => {
        if (a.length !== b.length) {
            throw new Error('Arrays must have the same length');
        }
        
        return a.map((val, i) => Interpolation.lerp(val, b[i], t));
    },
    
    /**
     * Interpolate between two colors represented as RGB arrays
     * 
     * @param {Array<number>} colorA - Start color [r, g, b]
     * @param {Array<number>} colorB - End color [r, g, b]
     * @param {number} t - Interpolation factor (0-1)
     * @returns {Array<number>} - Interpolated color
     */
    lerpColor: (colorA, colorB, t) => {
        return [
            Math.round(Interpolation.lerp(colorA[0], colorB[0], t)),
            Math.round(Interpolation.lerp(colorA[1], colorB[1], t)),
            Math.round(Interpolation.lerp(colorA[2], colorB[2], t))
        ];
    },
    
    /**
     * Smoothstep interpolation - Hermite polynomial
     * Has zero 1st-order derivatives at t=0 and t=1
     * 
     * @param {number} a - Start value
     * @param {number} b - End value
     * @param {number} t - Interpolation factor (0-1)
     * @returns {number} - Smoothly interpolated value
     */
    smoothstep: (a, b, t) => {
        // Clamp t to [0, 1]
        t = Math.max(0, Math.min(1, t));
        
        // Apply smoothstep formula: 3t² - 2t³
        t = t * t * (3 - 2 * t);
        
        return a + (b - a) * t;
    },
    
    /**
     * Smootherstep interpolation - 5th degree polynomial
     * Has zero 1st and 2nd-order derivatives at t=0 and t=1
     * 
     * @param {number} a - Start value
     * @param {number} b - End value
     * @param {number} t - Interpolation factor (0-1)
     * @returns {number} - Very smoothly interpolated value
     */
    smootherstep: (a, b, t) => {
        // Clamp t to [0, 1]
        t = Math.max(0, Math.min(1, t));
        
        // Apply smootherstep formula: 6t⁵ - 15t⁴ + 10t³
        t = t * t * t * (t * (t * 6 - 15) + 10);
        
        return a + (b - a) * t;
    },
    
    /**
     * Interpolate along a Catmull-Rom spline
     * 
     * @param {Array<number>} points - Array of control points
     * @param {number} t - Interpolation factor (0-1)
     * @returns {number} - Interpolated value
     * @throws {Error} If fewer than 4 points are provided
     */
    catmullRom: (points, t) => {
        if (points.length < 4) {
            throw new Error('Catmull-Rom interpolation requires at least 4 points');
        }
        
        // Scale t to the appropriate segment
        const segments = points.length - 3;
        const segment = Math.min(Math.floor(t * segments), segments - 1);
        const localT = (t * segments) - segment;
        
        // Get the four points for this segment
        const p0 = points[segment];
        const p1 = points[segment + 1];
        const p2 = points[segment + 2];
        const p3 = points[segment + 3];
        
        // Apply Catmull-Rom formula
        const t2 = localT * localT;
        const t3 = t2 * localT;
        
        return 0.5 * (
            (2 * p1) +
            (-p0 + p2) * localT +
            (2 * p0 - 5 * p1 + 4 * p2 - p3) * t2 +
            (-p0 + 3 * p1 - 3 * p2 + p3) * t3
        );
    }
});

/**
 * AnimationTimeline manages a sequence of animations with precise timing control
 * 
 * @class AnimationTimeline
 */
class AnimationTimeline {
    /**
     * Create a new animation timeline
     * 
     * @param {Object} [options] - Configuration options
     * @param {boolean} [options.autoStart=false] - Whether to start the timeline automatically
     * @param {number} [options.timeScale=1] - Timeline speed multiplier
     * @param {Function} [options.onComplete] - Callback when timeline completes
     * @param {Function} [options.onUpdate] - Callback on each timeline update
     */
    constructor(options = {}) {
        /**
         * @private
         * @type {Object}
         */
        this.options = {
            autoStart: false,
            timeScale: 1,
            onComplete: null,
            onUpdate: null,
            ...options
        };
        
        /**
         * @private
         * @type {Array<Object>}
         */
        this.tracks = [];
        
        /**
         * @private
         * @type {number}
         */
        this.currentTime = 0;
        
        /**
         * @private
         * @type {number}
         */
        this.duration = 0;
        
        /**
         * @private
         * @type {boolean}
         */
        this.isPlaying = false;
        
        /**
         * @private
         * @type {boolean}
         */
        this.isComplete = false;
        
        /**
         * @private
         * @type {number|null}
         */
        this.animationFrameId = null;
        
        /**
         * @private
         * @type {number}
         */
        this.lastFrameTime = 0;
        
        // Auto-start if configured
        if (this.options.autoStart) {
            this.play();
        }
    }
    
    /**
     * Add a tween to the timeline
     * 
     * @param {Object} options - Tween options
     * @param {Object} options.target - Target object to animate
     * @param {Object} options.to - Target properties and values
     * @param {number} options.duration - Duration in milliseconds
     * @param {number} [options.delay=0] - Delay before starting in milliseconds
     * @param {string|Function} [options.easing='linear'] - Easing function name or custom function
     * @param {Function} [options.onStart] - Callback when tween starts
     * @param {Function} [options.onUpdate] - Callback on each tween update
     * @param {Function} [options.onComplete] - Callback when tween completes
     * @returns {AnimationTimeline} - This timeline for chaining
     * @throws {TypeError} If required options are missing
     */
    to(options) {
        if (!options.target || !options.to || options.duration === undefined) {
            throw new TypeError('Missing required tween options: target, to, duration');
        }
        
        // Create from/to property maps
        const fromValues = {};
        const toValues = {};
        
        // Store initial values
        for (const prop in options.to) {
            if (Object.prototype.hasOwnProperty.call(options.to, prop)) {
                fromValues[prop] = options.target[prop];
                toValues[prop] = options.to[prop];
            }
        }
        
        // Get easing function
        const easing = typeof options.easing === 'function' 
            ? options.easing 
            : (Easing[options.easing] || Easing.linear);
        
        // Calculate timing
        const startTime = options.delay ? this.duration + options.delay : this.duration;
        const endTime = startTime + options.duration;
        
        // Update timeline duration
        if (endTime > this.duration) {
            this.duration = endTime;
        }
        
        // Create the track
        this.tracks.push({
            target: options.target,
            fromValues,
            toValues,
            startTime,
            endTime,
            duration: options.duration,
            easing,
            onStart: options.onStart || null,
            onUpdate: options.onUpdate || null,
            onComplete: options.onComplete || null,
            started: false,
            completed: false
        });
        
        return this;
    }
    
    /**
     * Add a delay to the timeline
     * 
     * @param {number} duration - Delay duration in milliseconds
     * @returns {AnimationTimeline} - This timeline for chaining
     */
    delay(duration) {
        this.duration += duration;
        return this;
    }
    
    /**
     * Add a callback at a specific time in the timeline
     * 
     * @param {Function} callback - Function to call
     * @param {number} [time] - Time to call at (defaults to current end of timeline)
     * @returns {AnimationTimeline} - This timeline for chaining
     */
    call(callback, time = null) {
        const callTime = time !== null ? time : this.duration;
        
        this.tracks.push({
            isCallback: true,
            callback,
            startTime: callTime,
            endTime: callTime,
            executed: false
        });
        
        // Update duration if needed
        if (callTime > this.duration) {
            this.duration = callTime;
        }
        
        return this;
    }
    
    /**
     * Play the timeline
     * 
     * @param {number} [startTime] - Time to start from (defaults to current time)
     * @returns {AnimationTimeline} - This timeline for chaining
     */
    play(startTime = null) {
        // Reset if previously completed
        if (this.isComplete) {
            this.reset();
        }
        
        if (startTime !== null) {
            this.currentTime = startTime;
        }
        
        this.isPlaying = true;
        this.lastFrameTime = performance.now();
        
        // Start the animation loop
        this.tick();
        
        return this;
    }
    
    /**
     * Pause the timeline
     * 
     * @returns {AnimationTimeline} - This timeline for chaining
     */
    pause() {
        this.isPlaying = false;
        
        if (this.animationFrameId !== null) {
            cancelAnimationFrame(this.animationFrameId);
            this.animationFrameId = null;
        }
        
        return this;
    }
    
    /**
     * Stop the timeline and reset to beginning
     * 
     * @returns {AnimationTimeline} - This timeline for chaining
     */
    stop() {
        this.pause();
        this.reset();
        return this;
    }
    
    /**
     * Reset the timeline to its initial state
     * 
     * @returns {AnimationTimeline} - This timeline for chaining
     */
    reset() {
        this.currentTime = 0;
        this.isComplete = false;
        
        // Reset all tracks
        this.tracks.forEach(track => {
            if (track.isCallback) {
                track.executed = false;
            } else {
                track.started = false;
                track.completed = false;
                
                // Reset target properties to initial values
                for (const prop in track.fromValues) {
                    track.target[prop] = track.fromValues[prop];
                }
            }
        });
        
        return this;
    }
    
    /**
     * Seek to a specific time in the timeline
     * 
     * @param {number} time - Time to seek to in milliseconds
     * @returns {AnimationTimeline} - This timeline for chaining
     */
    seek(time) {
        const prevTime = this.currentTime;
        this.currentTime = Math.max(0, Math.min(time, this.duration));
        
        // Update tracks based on new time
        this.tracks.forEach(track => {
            if (track.isCallback) {
                // Execute callbacks if we crossed their time
                if (!track.executed && 
                    prevTime < track.startTime && 
                    this.currentTime >= track.startTime) {
                    track.callback();
                    track.executed = true;
                }
            } else {
                // Update animation tracks
                this.updateTrack(track);
            }
        });
        
        return this;
    }
    
    /**
     * Main animation tick function
     * 
     * @private
     */
    tick() {
        if (!this.isPlaying) return;
        
        const now = performance.now();
        const deltaTime = (now - this.lastFrameTime) * this.options.timeScale;
        this.lastFrameTime = now;
        
        // Update current time
        this.currentTime += deltaTime;
        
        // Check if timeline is complete
        if (this.currentTime >= this.duration) {
            this.currentTime = this.duration;
            this.isComplete = true;
            this.isPlaying = false;
        }
        
        // Update all tracks
        this.tracks.forEach(track => {
            if (track.isCallback) {
                // Execute callback at its time
                if (!track.executed && this.currentTime >= track.startTime) {
                    track.callback();
                    track.executed = true;
                }
            } else {
                // Update animation track
                this.updateTrack(track);
            }
        });
        
        // Call onUpdate callback
        if (this.options.onUpdate) {
            this.options.onUpdate(this.currentTime / this.duration);
        }
        
        // Check for completion
        if (this.isComplete) {
            // Call onComplete callback
            if (this.options.onComplete) {
                this.options.onComplete();
            }
        } else {
            // Continue animation loop
            this.animationFrameId = requestAnimationFrame(() => this.tick());
        }
    }
    
    /**
     * Update a single animation track based on current time
     * 
     * @private
     * @param {Object} track - The track to update
     */
    updateTrack(track) {
        // Skip if track is not active yet or already complete
        if (this.currentTime < track.startTime || track.completed) {
            return;
        }
        
        // Call onStart if this is the first update
        if (!track.started) {
            track.started = true;
            if (track.onStart) {
                track.onStart();
            }
        }
        
        // Check if track is now complete
        if (this.currentTime >= track.endTime) {
            // Set final values
            for (const prop in track.toValues) {
                track.target[prop] = track.toValues[prop];
            }
            
            // Mark as complete and call onComplete
            if (!track.completed) {
                track.completed = true;
                if (track.onComplete) {
                    track.onComplete();
                }
            }
            
            return;
        }
        
        // Calculate progress for this track
        const trackProgress = (this.currentTime - track.startTime) / track.duration;
        const easedProgress = track.easing(trackProgress);
        
        // Update properties
        for (const prop in track.fromValues) {
            const from = track.fromValues[prop];
            const to = track.toValues[prop];
            
            // Interpolate based on value type
            if (Array.isArray(from) && Array.isArray(to)) {
                track.target[prop] = Interpolation.lerpArray(from, to, easedProgress);
            } else if (typeof from === 'number' && typeof to === 'number') {
                track.target[prop] = Interpolation.lerp(from, to, easedProgress);
            }
            // Skip non-numeric, non-array properties
        }
        
        // Call onUpdate callback
        if (track.onUpdate) {
            track.onUpdate(easedProgress);
        }
    }
    
    /**
     * Get the current progress of the timeline (0-1)
     * 
     * @returns {number} - Progress value between 0 and 1
     */
    getProgress() {
        return this.duration > 0 ? this.currentTime / this.duration : 0;
    }
    
    /**
     * Get the total duration of the timeline
     * 
     * @returns {number} - Duration in milliseconds
     */
    getDuration() {
        return this.duration;
    }
    
    /**
     * Check if the timeline is currently playing
     * 
     * @returns {boolean} - True if playing
     */
    isActive() {
        return this.isPlaying;
    }
}

/**
 * Manages a collection of animations with advanced control capabilities
 * 
 * @class AnimationManager
 */
class AnimationManager {
    /**
     * Create a new animation manager
     */
    constructor() {
        /**
         * @private
         * @type {Map<string, AnimationTimeline>}
         */
        this.animations = new Map();
        
        /**
         * @private
         * @type {Set<AnimationTimeline>}
         */
        this.activeAnimations = new Set();
        
        /**
         * @private
         * @type {number|null}
         */
        this.updateLoopId = null;
        
        /**
         * @private
         * @type {boolean}
         */
        this.isPaused = false;
        
        /**
         * @private
         * @type {Object}
         */
        this.metrics = {
            activeCount: 0,
            totalCreated: 0,
            completedCount: 0
        };
        
        // Start the update loop
        this.startUpdateLoop();
    }
    
    /**
     * Create a new animation timeline
     * 
     * @param {string} id - Unique identifier for the animation
     * @param {Object} [options] - Animation options
     * @returns {AnimationTimeline} - The created timeline
     * @throws {Error} If an animation with the same ID already exists
     */
    create(id, options = {}) {
        if (this.animations.has(id)) {
            throw new Error(`Animation with ID "${id}" already exists`);
        }
        
        const timeline = new AnimationTimeline({
            ...options,
            onComplete: () => {
                // Handle animation completion
                this.activeAnimations.delete(timeline);
                this.metrics.activeCount = this.activeAnimations.size;
                this.metrics.completedCount++;
                
                // Call user's onComplete if provided
                if (options.onComplete) {
                    options.onComplete();
                }
            }
        });
        
        this.animations.set(id, timeline);
        this.metrics.totalCreated++;
        
        return timeline;
    }
    
    /**
     * Get an existing animation by ID
     * 
     * @param {string} id - Animation identifier
     * @returns {AnimationTimeline|undefined} - The animation timeline or undefined if not found
     */
    get(id) {
        return this.animations.get(id);
    }
    
    /**
     * Play an animation
     * 
     * @param {string} id - Animation identifier
     * @param {number} [startTime] - Optional start time
     * @returns {boolean} - True if animation was found and played
     */
    play(id, startTime = null) {
        const animation = this.animations.get(id);
        
        if (animation) {
            animation.play(startTime);
            this.activeAnimations.add(animation);
            this.metrics.activeCount = this.activeAnimations.size;
            return true;
        }
        
        return false;
    }
    
    /**
     * Pause an animation
     * 
     * @param {string} id - Animation identifier
     * @returns {boolean} - True if animation was found and paused
     */
    pause(id) {
        const animation = this.animations.get(id);
        
        if (animation) {
            animation.pause();
            return true;
        }
        
        return false;
    }
    
    /**
     * Stop an animation
     * 
     * @param {string} id - Animation identifier
     * @returns {boolean} - True if animation was found and stopped
     */
    stop(id) {
        const animation = this.animations.get(id);
        
        if (animation) {
            animation.stop();
            this.activeAnimations.delete(animation);
            this.metrics.activeCount = this.activeAnimations.size;
            return true;
        }
        
        return false;
    }
    
    /**
     * Pause all active animations
     * 
     * @returns {AnimationManager} - This manager for chaining
     */
    pauseAll() {
        this.isPaused = true;
        this.activeAnimations.forEach(animation => animation.pause());
        return this;
    }
    
    /**
     * Resume all previously active animations
     * 
     * @returns {AnimationManager} - This manager for chaining
     */
    resumeAll() {
        this.isPaused = false;
        this.activeAnimations.forEach(animation => animation.play());
        return this;
    }
    
    /**
     * Stop all animations
     * 
     * @returns {AnimationManager} - This manager for chaining
     */
    stopAll() {
        this.animations.forEach(animation => animation.stop());
        this.activeAnimations.clear();
        this.metrics.activeCount = 0;
        return this;
    }
    
    /**
     * Remove an animation
     * 
     * @param {string} id - Animation identifier
     * @returns {boolean} - True if animation was found and removed
     */
    remove(id) {
        const animation = this.animations.get(id);
        
        if (animation) {
            animation.stop();
            this.activeAnimations.delete(animation);
            this.animations.delete(id);
            this.metrics.activeCount = this.activeAnimations.size;
            return true;
        }
        
        return false;
    }
    
    /**
     * Start the update loop
     * 
     * @private
     */
    startUpdateLoop() {
        const update = () => {
            // Continue the loop
            this.updateLoopId = requestAnimationFrame(update);
        };
        
        this.updateLoopId = requestAnimationFrame(update);
    }
    
    /**
     * Stop the update loop
     * 
     * @private
     */
    stopUpdateLoop() {
        if (this.updateLoopId !== null) {
            cancelAnimationFrame(this.updateLoopId);
            this.updateLoopId = null;
        }
    }
    
    /**
     * Get performance metrics
     * 
     * @returns {Object} - Animation performance metrics
     */
    getMetrics() {
        return { ...this.metrics };
    }
    
    /**
     * Clean up resources and stop all animations
     */
    dispose() {
        this.stopAll();
        this.stopUpdateLoop();
        this.animations.clear();
    }
}

/**
 * Specialized animations for algorithm visualizations
 * 
 * @namespace AlgorithmAnimations
 */
const AlgorithmAnimations = {
    /**
     * Create a swap animation between two array elements
     * 
     * @param {Object} renderer - The visualization renderer
     * @param {number} index1 - First element index
     * @param {number} index2 - Second element index
     * @param {Object} [options] - Animation options
     * @param {number} [options.duration=500] - Animation duration in milliseconds
     * @param {string} [options.easing='easeOutCubic'] - Easing function name
     * @param {Function} [options.onComplete] - Callback on completion
     * @returns {AnimationTimeline} - Animation timeline
     */
    createSwapAnimation(renderer, index1, index2, options = {}) {
        const duration = options.duration || 500;
        const easing = options.easing || 'easeOutCubic';
        
        // Create positions for swapping
        const position1 = { x: index1 };
        const position2 = { x: index2 };
        
        // Create a timeline
        const timeline = new AnimationTimeline();
        
        // Highlight the elements being swapped
        timeline.call(() => {
            renderer.highlight([index1, index2]);
        });
        
        // Animate the first element
        timeline.to({
            target: position1,
            to: { x: index2 },
            duration: duration / 2,
            easing: 'easeOutQuad'
        });
        
        // Animate the second element simultaneously
        timeline.to({
            target: position2,
            to: { x: index1 },
            duration: duration / 2,
            easing: 'easeOutQuad',
            onUpdate: (progress) => {
                // Update renderer positions
                renderer.positions[index1] = position1.x;
                renderer.positions[index2] = position2.x;
                renderer.updateBuffers();
            }
        });
        
        // Complete the swap in the data array
        timeline.call(() => {
            // Actually swap the elements in the underlying data
            [renderer.data[index1], renderer.data[index2]] = 
            [renderer.data[index2], renderer.data[index1]];
            
            // Reset positions
            renderer.positions[index1] = index1;
            renderer.positions[index2] = index2;
            renderer.updateBuffers();
            
            // Call user-provided completion callback
            if (options.onComplete) {
                options.onComplete();
            }
        });
        
        return timeline;
    },
    
    /**
     * Create a comparison animation between two array elements
     * 
     * @param {Object} renderer - The visualization renderer
     * @param {number} index1 - First element index
     * @param {number} index2 - Second element index
     * @param {Object} [options] - Animation options
     * @param {number} [options.duration=300] - Animation duration in milliseconds
     * @param {number} [options.pulseCount=1] - Number of pulse cycles
     * @param {Function} [options.onComplete] - Callback on completion
     * @returns {AnimationTimeline} - Animation timeline
     */
    createComparisonAnimation(renderer, index1, index2, options = {}) {
        const duration = options.duration || 300;
        const pulseCount = options.pulseCount || 1;
        
        // Create a timeline
        const timeline = new AnimationTimeline();
        
        // Highlight elements being compared
        timeline.call(() => {
            renderer.markComparing([index1, index2]);
        });
        
        // Pulse animation for comparison visualization
        const initialScale = { value: 1.0 };
        
        for (let i = 0; i < pulseCount; i++) {
            // Scale up
            timeline.to({
                target: initialScale,
                to: { value: 1.2 },
                duration: duration / (pulseCount * 2),
                easing: 'easeOutQuad',
                onUpdate: (progress) => {
                    // Apply scaling effect (renderer implementation specific)
                    renderer.setAmplitude(0.1 * initialScale.value);
                }
            });
            
            // Scale down
            timeline.to({
                target: initialScale,
                to: { value: 1.0 },
                duration: duration / (pulseCount * 2),
                easing: 'easeInQuad',
                onUpdate: (progress) => {
                    renderer.setAmplitude(0.1 * initialScale.value);
                }
            });
        }
        
        // Clean up
        timeline.call(() => {
            // Reset the comparison state
            renderer.markComparing([]);
            renderer.setAmplitude(0.05); // Reset to default
            
            // Call user-provided completion callback
            if (options.onComplete) {
                options.onComplete();
            }
        });
        
        return timeline;
    },
    
    /**
     * Create an animation for marking elements as sorted
     * 
     * @param {Object} renderer - The visualization renderer
     * @param {Array<number>} indices - Indices to mark as sorted
     * @param {Object} [options] - Animation options
     * @param {number} [options.duration=400] - Animation duration in milliseconds
     * @param {boolean} [options.sequential=false] - Whether to animate sequentially
     * @param {Function} [options.onComplete] - Callback on completion
     * @returns {AnimationTimeline} - Animation timeline
     */
    createSortedAnimation(renderer, indices, options = {}) {
        const duration = options.duration || 400;
        const sequential = options.sequential || false;
        
        // Create a timeline
        const timeline = new AnimationTimeline();
        
        if (sequential) {
            // Mark elements as sorted one by one
            const stepDuration = duration / indices.length;
            
            indices.forEach((index, i) => {
                timeline.call(() => {
                    const currentSorted = new Set(renderer.sortedIndices);
                    currentSorted.add(index);
                    renderer.markSorted(Array.from(currentSorted));
                }, i * stepDuration);
            });
        } else {
            // Mark all elements as sorted simultaneously
            timeline.call(() => {
                const currentSorted = new Set(renderer.sortedIndices);
                indices.forEach(index => currentSorted.add(index));
                renderer.markSorted(Array.from(currentSorted));
            });
            
            // Add delay for the animation effect
            timeline.delay(duration);
        }
        
        // Completion
        timeline.call(() => {
            if (options.onComplete) {
                options.onComplete();
            }
        });
        
        return timeline;
    },
    
    /**
     * Create a pivot selection animation for partition-based algorithms
     * 
     * @param {Object} renderer - The visualization renderer
     * @param {number} pivotIndex - Index of the pivot element
     * @param {Array<number>} range - Range of the current partition [start, end]
     * @param {Object} [options] - Animation options
     * @param {number} [options.duration=500] - Animation duration in milliseconds
     * @param {Function} [options.onComplete] - Callback on completion
     * @returns {AnimationTimeline} - Animation timeline
     */
    createPivotAnimation(renderer, pivotIndex, range, options = {}) {
        const duration = options.duration || 500;
        
        // Create a timeline
        const timeline = new AnimationTimeline();
        
        // Highlight the partition range
        timeline.call(() => {
            // Create effect for the entire partition range
            const rangeIndices = [];
            for (let i = range[0]; i <= range[1]; i++) {
                rangeIndices.push(i);
            }
            
            // Apply a subtle effect to the range
            renderer.setEffectMode(1); // Gradient effect
        });
        
        // Highlight pivot
        const pivot = { scale: 1.0, offset: 0 };
        
        // Animate the pivot
        timeline.to({
            target: pivot,
            to: { scale: 1.3, offset: 0.2 },
            duration: duration / 2,
            easing: 'easeOutElastic',
            onUpdate: (progress) => {
                // Update renderer to show pivot prominently
                renderer.highlight([pivotIndex]);
                
                // Apply custom effect (implementation specific)
                const originalValue = renderer.data[pivotIndex];
                renderer.updateValue(pivotIndex, originalValue * pivot.scale + pivot.offset);
            }
        });
        
        // Hold the highlight
        timeline.delay(duration / 4);
        
        // Return to normal
        timeline.to({
            target: pivot,
            to: { scale: 1.0, offset: 0 },
            duration: duration / 4,
            easing: 'easeInOutQuad',
            onUpdate: (progress) => {
                const originalValue = renderer.data[pivotIndex] / pivot.scale - pivot.offset;
                renderer.updateValue(pivotIndex, originalValue * pivot.scale + pivot.offset);
            }
        });
        
        // Reset effects
        timeline.call(() => {
            renderer.highlight([]); // Clear highlights
            renderer.setEffectMode(0); // Reset effect mode
            
            // Reset the data to ensure accuracy
            renderer.data[pivotIndex] = renderer.originalData[pivotIndex];
            
            if (options.onComplete) {
                options.onComplete();
            }
        });
        
        return timeline;
    },
    
    /**
     * Create a merge animation for merge-based algorithms
     * 
     * @param {Object} renderer - The visualization renderer
     * @param {Array<number>} leftIndices - Indices of the left subarray
     * @param {Array<number>} rightIndices - Indices of the right subarray
     * @param {Object} [options] - Animation options
     * @param {number} [options.duration=800] - Animation duration in milliseconds
     * @param {string} [options.easing='easeInOutCubic'] - Easing function name
     * @param {Function} [options.onComplete] - Callback on completion
     * @returns {AnimationTimeline} - Animation timeline
     */
    createMergeAnimation(renderer, leftIndices, rightIndices, options = {}) {
        const duration = options.duration || 800;
        const easing = options.easing || 'easeInOutCubic';
        
        // Calculate the merged array indices
        const mergedIndices = [...leftIndices, ...rightIndices].sort((a, b) => a - b);
        
        // Create a timeline
        const timeline = new AnimationTimeline();
        
        // Highlight subarrays
        timeline.call(() => {
            renderer.highlight([...leftIndices, ...rightIndices]);
        });
        
        // Create positions for merging animation
        const positions = {};
        
        // Store original positions
        mergedIndices.forEach(idx => {
            positions[idx] = { x: renderer.positions[idx] };
        });
        
        // Apply a wave effect to visualize merging
        const wave = { progress: 0 };
        timeline.to({
            target: wave,
            to: { progress: 1 },
            duration: duration,
            easing: easing,
            onUpdate: (progress) => {
                // Animate a wave through the elements
                leftIndices.forEach((idx, i) => {
                    const wavePos = Math.max(0, Math.min(1, (progress * 3) - (i / leftIndices.length)));
                    renderer.positions[idx] = positions[idx].x + Math.sin(wavePos * Math.PI) * 0.3;
                });
                
                rightIndices.forEach((idx, i) => {
                    const wavePos = Math.max(0, Math.min(1, (progress * 3) - (i / rightIndices.length)));
                    renderer.positions[idx] = positions[idx].x - Math.sin(wavePos * Math.PI) * 0.3;
                });
                
                renderer.updateBuffers();
            }
        });
        
        // Mark as sorted
        timeline.call(() => {
            // Reset positions
            mergedIndices.forEach(idx => {
                renderer.positions[idx] = idx;
            });
            
            // Mark as sorted
            renderer.markSorted(mergedIndices);
            
            if (options.onComplete) {
                options.onComplete();
            }
        });
        
        return timeline;
    },
    
    /**
     * Create a partitioning animation for quicksort-like algorithms
     * 
     * @param {Object} renderer - The visualization renderer
     * @param {number} pivotIndex - Index of the pivot element
     * @param {Array<number>} lessThan - Indices of elements less than pivot
     * @param {Array<number>} greaterThan - Indices of elements greater than pivot
     * @param {Object} [options] - Animation options
     * @param {number} [options.duration=1000] - Animation duration in milliseconds
     * @param {Function} [options.onProgress] - Progress callback
     * @param {Function} [options.onComplete] - Callback on completion
     * @returns {AnimationTimeline} - Animation timeline
     */
    createPartitionAnimation(renderer, pivotIndex, lessThan, greaterThan, options = {}) {
        const duration = options.duration || 1000;
        
        // Create a timeline
        const timeline = new AnimationTimeline();
        
        // Track positions for animation
        const positions = {};
        
        // Store starting positions
        [...lessThan, pivotIndex, ...greaterThan].forEach(idx => {
            positions[idx] = { x: idx };
        });
        
        // First highlight all elements
        timeline.call(() => {
            renderer.highlight([...lessThan, pivotIndex, ...greaterThan]);
        });
        
        // Then highlight pivot specially
        timeline.call(() => {
            renderer.markComparing([pivotIndex]);
        }, 200);
        
        // Animate the partitioning
        const partition = { progress: 0 };
        timeline.to({
            target: partition,
            to: { progress: 1 },
            duration: duration - 400, // Account for initial and final animations
            easing: 'easeInOutCubic',
            delay: 400, // Start after initial highlights
            onUpdate: (progress) => {
                // Move elements less than pivot to the left
                lessThan.forEach((idx, i) => {
                    const targetX = i;
                    positions[idx].x = Interpolation.lerp(idx, targetX, progress);
                });
                
                // Move pivot to its final position
                const pivotFinalPos = lessThan.length;
                positions[pivotIndex].x = Interpolation.lerp(pivotIndex, pivotFinalPos, progress);
                
                // Move elements greater than pivot to the right
                greaterThan.forEach((idx, i) => {
                    const targetX = lessThan.length + 1 + i;
                    positions[idx].x = Interpolation.lerp(idx, targetX, progress);
                });
                
                // Update renderer positions
                Object.entries(positions).forEach(([idx, pos]) => {
                    renderer.positions[idx] = pos.x;
                });
                
                renderer.updateBuffers();
                
                // Call progress callback if provided
                if (options.onProgress) {
                    options.onProgress(progress);
                }
            }
        });
        
        // Final state
        timeline.call(() => {
            // Reset highlights and mark pivot as properly positioned
            renderer.highlight([]);
            renderer.markComparing([]);
            renderer.markSorted([lessThan.length]); // Mark pivot position as sorted
            
            if (options.onComplete) {
                options.onComplete();
            }
        });
        
        return timeline;
    }
};

/**
 * Factory function to create coordinated animations for algorithm operations
 * 
 * @param {Object} renderer - The visualization renderer to animate
 * @returns {Object} - Animation factory methods
 */
const createAnimationFactory = (renderer) => {
    // Create an animation manager
    const manager = new AnimationManager();
    
    return {
        /**
         * Create and play a swap animation
         * 
         * @param {number} index1 - First element index
         * @param {number} index2 - Second element index
         * @param {Object} [options] - Animation options
         * @returns {string} - Animation ID
         */
        swap(index1, index2, options = {}) {
            const id = `swap-${Date.now()}-${index1}-${index2}`;
            const animation = AlgorithmAnimations.createSwapAnimation(
                renderer, index1, index2, options
            );
            
            manager.animations.set(id, animation);
            animation.play();
            
            return id;
        },
        
        /**
         * Create and play a comparison animation
         * 
         * @param {number} index1 - First element index
         * @param {number} index2 - Second element index
         * @param {Object} [options] - Animation options
         * @returns {string} - Animation ID
         */
        compare(index1, index2, options = {}) {
            const id = `compare-${Date.now()}-${index1}-${index2}`;
            const animation = AlgorithmAnimations.createComparisonAnimation(
                renderer, index1, index2, options
            );
            
            manager.animations.set(id, animation);
            animation.play();
            
            return id;
        },
        
        /**
         * Create and play a sorted marking animation
         * 
         * @param {Array<number>} indices - Indices to mark as sorted
         * @param {Object} [options] - Animation options
         * @returns {string} - Animation ID
         */
        markSorted(indices, options = {}) {
            const id = `sorted-${Date.now()}`;
            const animation = AlgorithmAnimations.createSortedAnimation(
                renderer, indices, options
            );
            
            manager.animations.set(id, animation);
            animation.play();
            
            return id;
        },
        
        /**
         * Create and play a pivot selection animation
         * 
         * @param {number} pivotIndex - Index of the pivot element
         * @param {Array<number>} range - Range of the current partition [start, end]
         * @param {Object} [options] - Animation options
         * @returns {string} - Animation ID
         */
        selectPivot(pivotIndex, range, options = {}) {
            const id = `pivot-${Date.now()}-${pivotIndex}`;
            const animation = AlgorithmAnimations.createPivotAnimation(
                renderer, pivotIndex, range, options
            );
            
            manager.animations.set(id, animation);
            animation.play();
            
            return id;
        },
        
        /**
         * Create and play a merge animation
         * 
         * @param {Array<number>} leftIndices - Indices of the left subarray
         * @param {Array<number>} rightIndices - Indices of the right subarray
         * @param {Object} [options] - Animation options
         * @returns {string} - Animation ID
         */
        merge(leftIndices, rightIndices, options = {}) {
            const id = `merge-${Date.now()}`;
            const animation = AlgorithmAnimations.createMergeAnimation(
                renderer, leftIndices, rightIndices, options
            );
            
            manager.animations.set(id, animation);
            animation.play();
            
            return id;
        },
        
        /**
         * Create and play a partition animation
         * 
         * @param {number} pivotIndex - Index of the pivot element
         * @param {Array<number>} lessThan - Indices of elements less than pivot
         * @param {Array<number>} greaterThan - Indices of elements greater than pivot
         * @param {Object} [options] - Animation options
         * @returns {string} - Animation ID
         */
        partition(pivotIndex, lessThan, greaterThan, options = {}) {
            const id = `partition-${Date.now()}`;
            const animation = AlgorithmAnimations.createPartitionAnimation(
                renderer, pivotIndex, lessThan, greaterThan, options
            );
            
            manager.animations.set(id, animation);
            animation.play();
            
            return id;
        },
        
        /**
         * Pause a specific animation
         * 
         * @param {string} id - Animation ID
         * @returns {boolean} - Success status
         */
        pause(id) {
            return manager.pause(id);
        },
        
        /**
         * Stop all animations
         */
        stopAll() {
            manager.stopAll();
        },
        
        /**
         * Get the animation manager
         * 
         * @returns {AnimationManager} - The animation manager
         */
        getManager() {
            return manager;
        }
    };
};

// Export animation utilities
export {
    Easing,
    Interpolation,
    AnimationTimeline,
    AnimationManager,
    AlgorithmAnimations,
    createAnimationFactory
};
