/**
 * Three.js Renderer for Advanced 3D Sorting Algorithm Visualization
 * 
 * Provides 3D visualization capabilities using Three.js for large datasets
 * with advanced effects, camera controls, and immersive experiences.
 * 
 * @author Mohammad Atashi
 * @version 2.0.0
 */

import * as THREE from 'three';

export interface ThreeRendererOptions {
  antialias?: boolean;
  alpha?: boolean;
  preserveDrawingBuffer?: boolean;
}

export class ThreeRenderer {
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private renderer: THREE.WebGLRenderer;
  private canvas: HTMLCanvasElement;
  private data: number[] = [];
  private bars: THREE.Mesh[] = [];
  private animationFrame: number | null = null;
  private isAnimating = false;
  private colorScheme: string = 'default';
  private animationSpeed = 1;
  private clock = new THREE.Clock();

  constructor(canvas: HTMLCanvasElement, options: ThreeRendererOptions = {}) {
    this.canvas = canvas;
    
    // Initialize Three.js scene
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x000000);
    
    // Setup camera
    this.camera = new THREE.PerspectiveCamera(
      75,
      canvas.width / canvas.height,
      0.1,
      1000
    );
    this.camera.position.set(0, 5, 10);
    this.camera.lookAt(0, 0, 0);
    
    // Setup renderer
    this.renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: options.antialias ?? true,
      alpha: options.alpha ?? true,
      preserveDrawingBuffer: options.preserveDrawingBuffer ?? false,
    });
    
    this.setupLighting();
  }

  async initialize(): Promise<void> {
    try {
      this.resize();
      return Promise.resolve();
    } catch (error) {
      console.error('Failed to initialize Three.js renderer:', error);
      throw error;
    }
  }

  private setupLighting(): void {
    // Ambient light
    const ambientLight = new THREE.AmbientLight(0x404040, 0.6);
    this.scene.add(ambientLight);
    
    // Directional light
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(10, 10, 5);
    this.scene.add(directionalLight);
    
    // Point light for dramatic effect
    const pointLight = new THREE.PointLight(0x0088ff, 0.5, 100);
    pointLight.position.set(-5, 5, 5);
    this.scene.add(pointLight);
  }

  setData(data: number[], options: {
    colorScheme?: string;
    showHeapView?: boolean;
    animationSpeed?: number;
  } = {}): void {
    this.data = [...data];
    this.colorScheme = options.colorScheme || 'default';
    this.animationSpeed = options.animationSpeed || 1;
    
    this.createBars();
    this.startAnimation();
  }

  private createBars(): void {
    // Clear existing bars
    this.bars.forEach(bar => this.scene.remove(bar));
    this.bars = [];
    
    const numElements = this.data.length;
    const maxValue = Math.max(...this.data);
    const spacing = 1.2;
    const startX = -(numElements * spacing) / 2;
    
    for (let i = 0; i < numElements; i++) {
      const value = this.data[i];
      const height = (value / maxValue) * 5;
      const width = 0.8;
      const depth = 0.8;
      
      // Create geometry
      const geometry = new THREE.BoxGeometry(width, height, depth);
      
      // Create material with color
      const color = this.getColorForValue(value, maxValue, i);
      const material = new THREE.MeshPhongMaterial({
        color: new THREE.Color(color[0], color[1], color[2]),
        transparent: true,
        opacity: 0.9,
        shininess: 100,
      });
      
      // Create mesh
      const bar = new THREE.Mesh(geometry, material);
      bar.position.set(startX + i * spacing, height / 2, 0);
      
      // Store original position for animations
      (bar as any).originalPosition = bar.position.clone();
      (bar as any).originalHeight = height;
      (bar as any).value = value;
      (bar as any).index = i;
      
      this.bars.push(bar);
      this.scene.add(bar);
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

  updateState(state: any, metrics: any): void {
    // Update bar positions and properties based on algorithm state
    if (state.array && state.array.length === this.data.length) {
      this.data = [...state.array];
      
      // Animate bars to new positions
      this.animateBars();
    }
  }

  private animateBars(): void {
    const numElements = this.data.length;
    const maxValue = Math.max(...this.data);
    const spacing = 1.2;
    const startX = -(numElements * spacing) / 2;
    
    this.bars.forEach((bar, i) => {
      const value = this.data[i];
      const targetHeight = (value / maxValue) * 5;
      const targetX = startX + i * spacing;
      const targetY = targetHeight / 2;
      
      // Animate position and scale
      const targetPosition = new THREE.Vector3(targetX, targetY, 0);
      const currentPosition = bar.position;
      
      currentPosition.lerp(targetPosition, 0.1);
      
      // Animate height
      const currentHeight = bar.scale.y;
      const targetScale = targetHeight / (bar as any).originalHeight;
      bar.scale.y = THREE.MathUtils.lerp(currentHeight, targetScale, 0.1);
      
      // Update color if value changed
      if (value !== (bar as any).value) {
        const color = this.getColorForValue(value, maxValue, i);
        (bar.material as THREE.MeshPhongMaterial).color.setRGB(color[0], color[1], color[2]);
        (bar as any).value = value;
      }
    });
  }

  private startAnimation(): void {
    if (this.isAnimating) return;
    
    this.isAnimating = true;
    this.animate();
  }

  private animate = (): void => {
    if (!this.isAnimating) return;
    
    const delta = this.clock.getDelta() * this.animationSpeed;
    
    // Rotate camera slowly for dynamic effect
    this.camera.position.x = Math.cos(Date.now() * 0.0005) * 10;
    this.camera.position.z = Math.sin(Date.now() * 0.0005) * 10;
    this.camera.lookAt(0, 0, 0);
    
    // Animate bars
    this.animateBars();
    
    // Render scene
    this.renderer.render(this.scene, this.camera);
    
    this.animationFrame = requestAnimationFrame(this.animate);
  };

  render(timestamp: number): void {
    // Rendering is handled in the animation loop
  }

  resize(): void {
    const rect = this.canvas.getBoundingClientRect();
    this.canvas.width = rect.width * window.devicePixelRatio;
    this.canvas.height = rect.height * window.devicePixelRatio;
    
    this.camera.aspect = rect.width / rect.height;
    this.camera.updateProjectionMatrix();
    
    this.renderer.setSize(rect.width, rect.height);
    this.renderer.setPixelRatio(window.devicePixelRatio);
  }

  dispose(): void {
    if (this.animationFrame) {
      cancelAnimationFrame(this.animationFrame);
    }
    
    this.bars.forEach(bar => {
      bar.geometry.dispose();
      (bar.material as THREE.Material).dispose();
    });
    
    this.renderer.dispose();
    this.isAnimating = false;
  }
}
