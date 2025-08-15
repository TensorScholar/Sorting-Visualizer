/**
 * Enhanced WebGL Renderer for Sorting Algorithm Visualization
 * 
 * Provides high-performance rendering using WebGL 2.0 with advanced features:
 * - Hardware-accelerated rendering
 * - Multiple color schemes
 * - Smooth animations
 * - Adaptive scaling
 * - Memory-efficient operations
 * 
 * @author Mohammad Atashi
 * @version 2.0.0
 */

export interface WebGLRendererOptions {
  antialias?: boolean;
  alpha?: boolean;
  preserveDrawingBuffer?: boolean;
}

export interface RendererState {
  array: number[];
  step: number;
  metadata: Record<string, any>;
}

export interface Metrics {
  comparisons: number;
  swaps: number;
  reads: number;
  writes: number;
}

export class WebGLRenderer {
  private gl: WebGL2RenderingContext | null = null;
  private canvas: HTMLCanvasElement;
  private program: WebGLProgram | null = null;
  private vertexBuffer: WebGLBuffer | null = null;
  private colorBuffer: WebGLBuffer | null = null;
  private indexBuffer: WebGLBuffer | null = null;
  private data: number[] = [];
  private highlights: Set<number> = new Set();
  private comparing: Set<number> = new Set();
  private sortedIndices: Set<number> = new Set();
  private animationFrame: number | null = null;
  private isAnimating = false;
  private positions: Float32Array = new Float32Array();
  private targetPositions: Float32Array = new Float32Array();
  private animationStartTime = 0;
  private animationProgress = 0;
  private colorScheme: string = 'default';
  private showHeapView = false;
  private animationSpeed = 1;

  constructor(canvas: HTMLCanvasElement, options: WebGLRendererOptions = {}) {
    this.canvas = canvas;
  }

  async initialize(): Promise<void> {
    try {
      this.gl = this.canvas.getContext('webgl2', {
        antialias: true,
        alpha: true,
        preserveDrawingBuffer: false,
      });

      if (!this.gl) {
        throw new Error('WebGL2 not supported');
      }

      this.setupShaders();
      this.setupBuffers();
      this.resize();

      return Promise.resolve();
    } catch (error) {
      console.error('Failed to initialize WebGL renderer:', error);
      throw error;
    }
  }

  private setupShaders(): void {
    if (!this.gl) return;

    const vertexShaderSource = `#version 300 es
      in vec2 a_position;
      in vec3 a_color;
      in float a_height;
      
      uniform mat4 u_matrix;
      uniform float u_time;
      
      out vec3 v_color;
      out float v_height;
      
      void main() {
        gl_Position = u_matrix * vec4(a_position, 0.0, 1.0);
        v_color = a_color;
        v_height = a_height;
      }
    `;

    const fragmentShaderSource = `#version 300 es
      precision mediump float;
      
      in vec3 v_color;
      in float v_height;
      
      uniform float u_time;
      uniform int u_highlight;
      uniform int u_comparing;
      uniform int u_sorted;
      
      out vec4 fragColor;
      
      void main() {
        vec3 color = v_color;
        
        // Add animation effects
        float pulse = sin(u_time * 2.0) * 0.1 + 0.9;
        color *= pulse;
        
        // Highlight effects
        if (u_highlight == 1) {
          color = mix(color, vec3(1.0, 1.0, 0.0), 0.3);
        }
        
        if (u_comparing == 1) {
          color = mix(color, vec3(1.0, 0.0, 0.0), 0.5);
        }
        
        if (u_sorted == 1) {
          color = mix(color, vec3(0.0, 1.0, 0.0), 0.3);
        }
        
        fragColor = vec4(color, 1.0);
      }
    `;

    const vertexShader = this.createShader(this.gl.VERTEX_SHADER, vertexShaderSource);
    const fragmentShader = this.createShader(this.gl.FRAGMENT_SHADER, fragmentShaderSource);

    this.program = this.createProgram(vertexShader, fragmentShader);
  }

  private createShader(type: number, source: string): WebGLShader {
    if (!this.gl) throw new Error('WebGL context not available');

    const shader = this.gl.createShader(type);
    if (!shader) throw new Error('Failed to create shader');

    this.gl.shaderSource(shader, source);
    this.gl.compileShader(shader);

    if (!this.gl.getShaderParameter(shader, this.gl.COMPILE_STATUS)) {
      const error = this.gl.getShaderInfoLog(shader);
      this.gl.deleteShader(shader);
      throw new Error(`Shader compilation failed: ${error}`);
    }

    return shader;
  }

  private createProgram(vertexShader: WebGLShader, fragmentShader: WebGLShader): WebGLProgram {
    if (!this.gl) throw new Error('WebGL context not available');

    const program = this.gl.createProgram();
    if (!program) throw new Error('Failed to create program');

    this.gl.attachShader(program, vertexShader);
    this.gl.attachShader(program, fragmentShader);
    this.gl.linkProgram(program);

    if (!this.gl.getProgramParameter(program, this.gl.LINK_STATUS)) {
      const error = this.gl.getProgramInfoLog(program);
      this.gl.deleteProgram(program);
      throw new Error(`Program linking failed: ${error}`);
    }

    return program;
  }

  private setupBuffers(): void {
    if (!this.gl) return;

    // Create vertex buffer
    this.vertexBuffer = this.gl.createBuffer();
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.vertexBuffer);

    // Create color buffer
    this.colorBuffer = this.gl.createBuffer();
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.colorBuffer);

    // Create index buffer
    this.indexBuffer = this.gl.createBuffer();
    this.gl.bindBuffer(this.gl.ELEMENT_ARRAY_BUFFER, this.indexBuffer);
  }

  setData(data: number[], options: {
    colorScheme?: string;
    showHeapView?: boolean;
    animationSpeed?: number;
  } = {}): void {
    this.data = [...data];
    this.colorScheme = options.colorScheme || 'default';
    this.showHeapView = options.showHeapView || false;
    this.animationSpeed = options.animationSpeed || 1;

    this.updateBuffers();
    this.startAnimation();
  }

  private updateBuffers(): void {
    if (!this.gl || !this.vertexBuffer || !this.colorBuffer || !this.indexBuffer) return;

    const numElements = this.data.length;
    const maxValue = Math.max(...this.data);
    const canvasWidth = this.canvas.width;
    const canvasHeight = this.canvas.height;

    // Calculate bar dimensions
    const barWidth = (canvasWidth * 0.8) / numElements;
    const barSpacing = barWidth * 0.1;
    const actualBarWidth = barWidth - barSpacing;

    // Create vertices and colors
    const vertices = new Float32Array(numElements * 8); // 4 vertices per bar, 2 coords each
    const colors = new Float32Array(numElements * 12); // 4 vertices per bar, 3 colors each
    const indices = new Uint16Array(numElements * 6); // 2 triangles per bar

    for (let i = 0; i < numElements; i++) {
      const value = this.data[i];
      const height = (value / maxValue) * (canvasHeight * 0.8);
      const x = (i / numElements) * canvasWidth * 0.8 + canvasWidth * 0.1;
      const y = canvasHeight * 0.1;

      // Calculate color based on scheme
      const color = this.getColorForValue(value, maxValue, i);

      // Set vertices for this bar (rectangle)
      const baseIndex = i * 8;
      vertices[baseIndex + 0] = x; // bottom-left
      vertices[baseIndex + 1] = y;
      vertices[baseIndex + 2] = x + actualBarWidth; // bottom-right
      vertices[baseIndex + 3] = y;
      vertices[baseIndex + 4] = x + actualBarWidth; // top-right
      vertices[baseIndex + 5] = y + height;
      vertices[baseIndex + 6] = x; // top-left
      vertices[baseIndex + 7] = y + height;

      // Set colors for this bar
      const colorBaseIndex = i * 12;
      for (let j = 0; j < 4; j++) {
        colors[colorBaseIndex + j * 3 + 0] = color[0];
        colors[colorBaseIndex + j * 3 + 1] = color[1];
        colors[colorBaseIndex + j * 3 + 2] = color[2];
      }

      // Set indices for this bar
      const indexBaseIndex = i * 6;
      const vertexBaseIndex = i * 4;
      indices[indexBaseIndex + 0] = vertexBaseIndex + 0;
      indices[indexBaseIndex + 1] = vertexBaseIndex + 1;
      indices[indexBaseIndex + 2] = vertexBaseIndex + 2;
      indices[indexBaseIndex + 3] = vertexBaseIndex + 0;
      indices[indexBaseIndex + 4] = vertexBaseIndex + 2;
      indices[indexBaseIndex + 5] = vertexBaseIndex + 3;
    }

    // Update vertex buffer
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.vertexBuffer);
    this.gl.bufferData(this.gl.ARRAY_BUFFER, vertices, this.gl.STATIC_DRAW);

    // Update color buffer
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.colorBuffer);
    this.gl.bufferData(this.gl.ARRAY_BUFFER, colors, this.gl.STATIC_DRAW);

    // Update index buffer
    this.gl.bindBuffer(this.gl.ELEMENT_ARRAY_BUFFER, this.indexBuffer);
    this.gl.bufferData(this.gl.ELEMENT_ARRAY_BUFFER, indices, this.gl.STATIC_DRAW);
  }

  private getColorForValue(value: number, maxValue: number, index: number): [number, number, number] {
    const normalizedValue = value / maxValue;

    switch (this.colorScheme) {
      case 'gradient':
        return [
          0.2 + normalizedValue * 0.8,
          0.2 + (1 - normalizedValue) * 0.8,
          0.5 + normalizedValue * 0.5,
        ];

      case 'rainbow':
        const hue = (index / this.data.length) * 360;
        return this.hsvToRgb(hue, 0.8, 0.9);

      case 'monochrome':
        const intensity = 0.3 + normalizedValue * 0.7;
        return [intensity, intensity, intensity];

      default:
        return [
          0.4 + normalizedValue * 0.6,
          0.2 + normalizedValue * 0.8,
          0.8 + normalizedValue * 0.2,
        ];
    }
  }

  private hsvToRgb(h: number, s: number, v: number): [number, number, number] {
    const c = v * s;
    const x = c * (1 - Math.abs((h / 60) % 2 - 1));
    const m = v - c;

    let r = 0, g = 0, b = 0;

    if (h >= 0 && h < 60) {
      r = c; g = x; b = 0;
    } else if (h >= 60 && h < 120) {
      r = x; g = c; b = 0;
    } else if (h >= 120 && h < 180) {
      r = 0; g = c; b = x;
    } else if (h >= 180 && h < 240) {
      r = 0; g = x; b = c;
    } else if (h >= 240 && h < 300) {
      r = x; g = 0; b = c;
    } else {
      r = c; g = 0; b = x;
    }

    return [r + m, g + m, b + m];
  }

  updateState(state: RendererState, metrics: Metrics): void {
    // Update highlights based on current state
    this.highlights.clear();
    this.comparing.clear();
    this.sortedIndices.clear();

    if (state.metadata.highlighted) {
      state.metadata.highlighted.forEach((index: number) => this.highlights.add(index));
    }

    if (state.metadata.comparing) {
      state.metadata.comparing.forEach((index: number) => this.comparing.add(index));
    }

    if (state.metadata.sorted) {
      state.metadata.sorted.forEach((index: number) => this.sortedIndices.add(index));
    }

    // Update data if it changed
    if (JSON.stringify(state.array) !== JSON.stringify(this.data)) {
      this.data = [...state.array];
      this.updateBuffers();
    }
  }

  private startAnimation(): void {
    if (this.isAnimating) return;

    this.isAnimating = true;
    this.animationStartTime = performance.now();
    this.animate();
  }

  private animate = (): void => {
    if (!this.isAnimating) return;

    this.render(performance.now());
    this.animationFrame = requestAnimationFrame(this.animate);
  };

  render(timestamp: number): void {
    if (!this.gl || !this.program) return;

    // Clear canvas
    this.gl.clearColor(0.0, 0.0, 0.0, 0.0);
    this.gl.clear(this.gl.COLOR_BUFFER_BIT);

    // Use shader program
    this.gl.useProgram(this.program);

    // Set up viewport
    this.gl.viewport(0, 0, this.canvas.width, this.canvas.height);

    // Set uniforms
    const timeLocation = this.gl.getUniformLocation(this.program, 'u_time');
    if (timeLocation) {
      this.gl.uniform1f(timeLocation, timestamp * 0.001 * this.animationSpeed);
    }

    // Set up vertex attributes
    const positionLocation = this.gl.getAttribLocation(this.program, 'a_position');
    const colorLocation = this.gl.getAttribLocation(this.program, 'a_color');

    // Bind vertex buffer
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.vertexBuffer);
    this.gl.enableVertexAttribArray(positionLocation);
    this.gl.vertexAttribPointer(positionLocation, 2, this.gl.FLOAT, false, 0, 0);

    // Bind color buffer
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.colorBuffer);
    this.gl.enableVertexAttribArray(colorLocation);
    this.gl.vertexAttribPointer(colorLocation, 3, this.gl.FLOAT, false, 0, 0);

    // Bind index buffer and draw
    this.gl.bindBuffer(this.gl.ELEMENT_ARRAY_BUFFER, this.indexBuffer);
    this.gl.drawElements(this.gl.TRIANGLES, this.data.length * 6, this.gl.UNSIGNED_SHORT, 0);
  }

  resize(): void {
    if (!this.canvas) return;

    const rect = this.canvas.getBoundingClientRect();
    this.canvas.width = rect.width * window.devicePixelRatio;
    this.canvas.height = rect.height * window.devicePixelRatio;

    if (this.gl) {
      this.gl.viewport(0, 0, this.canvas.width, this.canvas.height);
    }

    // Update buffers with new dimensions
    if (this.data.length > 0) {
      this.updateBuffers();
    }
  }

  dispose(): void {
    if (this.animationFrame) {
      cancelAnimationFrame(this.animationFrame);
    }

    if (this.gl) {
      this.gl.deleteBuffer(this.vertexBuffer);
      this.gl.deleteBuffer(this.colorBuffer);
      this.gl.deleteBuffer(this.indexBuffer);
      this.gl.deleteProgram(this.program);
    }

    this.isAnimating = false;
  }
}
