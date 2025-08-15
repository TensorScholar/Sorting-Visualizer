/**
 * Canvas 2D Renderer for Sorting Algorithm Visualization
 * 
 * Provides fallback rendering using HTML5 Canvas 2D API
 * for environments without WebGL support.
 * 
 * @author Mohammad Atashi
 * @version 2.0.0
 */

export interface CanvasRendererOptions {
  antialias?: boolean;
}

export class CanvasRenderer {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private data: number[] = [];
  private animationFrame: number | null = null;
  private isAnimating = false;
  private colorScheme: string = 'default';
  private animationSpeed = 1;

  constructor(canvas: HTMLCanvasElement, options: CanvasRendererOptions = {}) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d', { alpha: true })!;
  }

  async initialize(): Promise<void> {
    try {
      this.resize();
      return Promise.resolve();
    } catch (error) {
      console.error('Failed to initialize Canvas renderer:', error);
      throw error;
    }
  }

  setData(data: number[], options: {
    colorScheme?: string;
    showHeapView?: boolean;
    animationSpeed?: number;
  } = {}): void {
    this.data = [...data];
    this.colorScheme = options.colorScheme || 'default';
    this.animationSpeed = options.animationSpeed || 1;
    
    this.startAnimation();
  }

  updateState(state: any, metrics: any): void {
    if (state.array && state.array.length === this.data.length) {
      this.data = [...state.array];
    }
  }

  private startAnimation(): void {
    if (this.isAnimating) return;
    
    this.isAnimating = true;
    this.animate();
  }

  private animate = (): void => {
    if (!this.isAnimating) return;
    
    this.render(performance.now());
    this.animationFrame = requestAnimationFrame(this.animate);
  };

  render(timestamp: number): void {
    if (!this.ctx) return;

    // Clear canvas
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    const numElements = this.data.length;
    if (numElements === 0) return;

    const maxValue = Math.max(...this.data);
    const barWidth = (this.canvas.width * 0.8) / numElements;
    const barSpacing = barWidth * 0.1;
    const actualBarWidth = barWidth - barSpacing;
    const startX = this.canvas.width * 0.1;

    for (let i = 0; i < numElements; i++) {
      const value = this.data[i];
      const height = (value / maxValue) * (this.canvas.height * 0.8);
      const x = startX + i * barWidth;
      const y = this.canvas.height * 0.1;

      // Get color based on scheme
      const color = this.getColorForValue(value, maxValue, i);
      
      // Draw bar
      this.ctx.fillStyle = `rgb(${color[0] * 255}, ${color[1] * 255}, ${color[2] * 255})`;
      this.ctx.fillRect(x, y + (this.canvas.height * 0.8) - height, actualBarWidth, height);
      
      // Add border
      this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
      this.ctx.lineWidth = 1;
      this.ctx.strokeRect(x, y + (this.canvas.height * 0.8) - height, actualBarWidth, height);
    }
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

  resize(): void {
    const rect = this.canvas.getBoundingClientRect();
    this.canvas.width = rect.width * window.devicePixelRatio;
    this.canvas.height = rect.height * window.devicePixelRatio;
    
    this.ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
  }

  dispose(): void {
    if (this.animationFrame) {
      cancelAnimationFrame(this.animationFrame);
    }
    this.isAnimating = false;
  }
}
