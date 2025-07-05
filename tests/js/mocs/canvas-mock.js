/**
 * @file canvas.js
 * @description Comprehensive mock implementations for HTML Canvas and WebGL contexts.
 * This module provides sophisticated mocking of the Canvas API and WebGL rendering
 * contexts for testing visualization components without DOM dependencies.
 * 
 * @module tests/__mocks__/canvas
 * @author Advanced Sorting Algorithm Visualization Platform Team
 * @version 1.0.0
 * @license MIT
 */

/**
 * Constants for WebGL
 * @constant {Object} WebGLConstants
 */
const WebGLConstants = {
  // Buffer constants
  ARRAY_BUFFER: 0x8892,
  ELEMENT_ARRAY_BUFFER: 0x8893,
  STATIC_DRAW: 0x88E4,
  DYNAMIC_DRAW: 0x88E8,
  
  // Primitive type constants
  POINTS: 0x0000,
  LINES: 0x0001,
  LINE_LOOP: 0x0002,
  LINE_STRIP: 0x0003,
  TRIANGLES: 0x0004,
  TRIANGLE_STRIP: 0x0005,
  TRIANGLE_FAN: 0x0006,
  
  // Data type constants
  BYTE: 0x1400,
  UNSIGNED_BYTE: 0x1401,
  SHORT: 0x1402,
  UNSIGNED_SHORT: 0x1403,
  INT: 0x1404,
  UNSIGNED_INT: 0x1405,
  FLOAT: 0x1406,
  
  // Shader constants
  VERTEX_SHADER: 0x8B31,
  FRAGMENT_SHADER: 0x8B30,
  COMPILE_STATUS: 0x8B81,
  LINK_STATUS: 0x8B82,
  
  // Blend mode constants
  BLEND: 0x0BE2,
  SRC_ALPHA: 0x0302,
  ONE_MINUS_SRC_ALPHA: 0x0303,
  
  // Depth test constants
  DEPTH_TEST: 0x0B71,
  LEQUAL: 0x0203,
  
  // Framebuffer constants
  COLOR_BUFFER_BIT: 0x4000,
  DEPTH_BUFFER_BIT: 0x0100,
  
  // Texture constants
  TEXTURE_2D: 0x0DE1,
  TEXTURE0: 0x84C0,
  RGB: 0x1907,
  RGBA: 0x1908,
  UNSIGNED_SHORT_5_6_5: 0x8363,
  UNSIGNED_SHORT_4_4_4_4: 0x8033,
  UNSIGNED_SHORT_5_5_5_1: 0x8034,
};

/**
 * Mock implementation of WebGLBuffer
 * @class WebGLBuffer
 */
class MockWebGLBuffer {
  constructor() {
    this.id = `buffer_${Math.random().toString(36).substr(2, 9)}`;
    this.data = null;
    this.size = 0;
    this.usage = null;
    this.type = null;
    this.isDeleted = false;
  }
}

/**
 * Mock implementation of WebGLShader
 * @class WebGLShader
 */
class MockWebGLShader {
  /**
   * Create a new shader mock
   * @param {number} type - The type of shader (VERTEX_SHADER or FRAGMENT_SHADER)
   */
  constructor(type) {
    this.id = `shader_${Math.random().toString(36).substr(2, 9)}`;
    this.type = type;
    this.source = '';
    this.isCompiled = false;
    this.isDeleted = false;
    this.compileStatus = false;
    this.infoLog = '';
  }
}

/**
 * Mock implementation of WebGLProgram
 * @class WebGLProgram
 */
class MockWebGLProgram {
  constructor() {
    this.id = `program_${Math.random().toString(36).substr(2, 9)}`;
    this.shaders = [];
    this.isLinked = false;
    this.isDeleted = false;
    this.linkStatus = false;
    this.infoLog = '';
    this.attributes = new Map();
    this.uniforms = new Map();
  }
}

/**
 * Mock implementation of WebGLUniformLocation
 * @class WebGLUniformLocation
 */
class MockWebGLUniformLocation {
  /**
   * Create a new uniform location mock
   * @param {string} name - The name of the uniform
   */
  constructor(name) {
    this.id = `uniform_${Math.random().toString(36).substr(2, 9)}`;
    this.name = name;
    this.value = null;
    this.type = null;
  }
}

/**
 * Mock implementation of WebGLVertexArrayObject
 * @class WebGLVertexArrayObject
 */
class MockWebGLVertexArrayObject {
  constructor() {
    this.id = `vao_${Math.random().toString(36).substr(2, 9)}`;
    this.attributes = new Map();
    this.isDeleted = false;
  }
}

/**
 * Mock implementation of WebGLTexture
 * @class WebGLTexture
 */
class MockWebGLTexture {
  constructor() {
    this.id = `texture_${Math.random().toString(36).substr(2, 9)}`;
    this.width = 0;
    this.height = 0;
    this.format = null;
    this.type = null;
    this.isDeleted = false;
    this.data = null;
  }
}

/**
 * Mock implementation of WebGLRenderbuffer
 * @class WebGLRenderbuffer
 */
class MockWebGLRenderbuffer {
  constructor() {
    this.id = `renderbuffer_${Math.random().toString(36).substr(2, 9)}`;
    this.width = 0;
    this.height = 0;
    this.format = null;
    this.isDeleted = false;
  }
}

/**
 * Mock implementation of a WebGLRenderingContext
 * Simulates the behavior of WebGL for testing purposes
 * @class MockWebGLRenderingContext
 */
class MockWebGLRenderingContext {
  /**
   * Create a new WebGLRenderingContext mock
   * @param {Object} canvas - The canvas element this context is associated with
   * @param {Object} contextAttributes - Optional context attributes
   */
  constructor(canvas, contextAttributes = {}) {
    // Canvas reference
    this.canvas = canvas;
    
    // Current state
    this.currentProgram = null;
    this.currentVAO = null;
    this.currentFramebuffer = null;
    this.clearColor = [0, 0, 0, 0];
    this.viewport = { x: 0, y: 0, width: canvas.width, height: canvas.height };
    
    // Feature flags
    this.depthTest = false;
    this.scissorTest = false;
    this.blending = false;
    this.cullFace = false;
    
    // Resources
    this.buffers = new Map();
    this.shaders = new Map();
    this.programs = new Map();
    this.vaos = new Map();
    this.textures = new Map();
    this.renderbuffers = new Map();
    this.framebuffers = new Map();
    
    // Track function calls for testing
    this.calls = [];
    
    // Add all WebGL constants
    Object.assign(this, WebGLConstants);
    
    // Context attributes
    this.contextAttributes = {
      alpha: true,
      antialias: true,
      depth: true,
      failIfMajorPerformanceCaveat: false,
      powerPreference: 'default',
      premultipliedAlpha: true,
      preserveDrawingBuffer: false,
      stencil: false,
      ...contextAttributes
    };
    
    // Store the function mocks for later inspection
    this._mockFunctions = new Map();
    
    // Initialize function mocks
    this._initializeFunctionMocks();
  }
  
  /**
   * Initialize all WebGL function mocks
   * @private
   */
  _initializeFunctionMocks() {
    // Buffer operations
    this._mockFunction('createBuffer', () => {
      const buffer = new MockWebGLBuffer();
      this.buffers.set(buffer.id, buffer);
      return buffer;
    });
    
    this._mockFunction('bindBuffer', (target, buffer) => {
      if (buffer === null) {
        return;
      }
      if (!this.buffers.has(buffer.id)) {
        throw new Error('Invalid buffer object');
      }
      const bufferObj = this.buffers.get(buffer.id);
      bufferObj.type = target;
    });
    
    this._mockFunction('bufferData', (target, data, usage) => {
      // In real WebGL, this would associate data with the currently bound buffer
      // Here we just record the call
      const dataSize = data instanceof ArrayBuffer ? data.byteLength 
                     : ArrayBuffer.isView(data) ? data.byteLength 
                     : data;
      this.calls.push({ 
        name: 'bufferData', 
        args: { target, dataSize, usage } 
      });
    });
    
    this._mockFunction('deleteBuffer', (buffer) => {
      if (buffer && this.buffers.has(buffer.id)) {
        const bufferObj = this.buffers.get(buffer.id);
        bufferObj.isDeleted = true;
        this.buffers.delete(buffer.id);
      }
    });
    
    // Shader operations
    this._mockFunction('createShader', (type) => {
      const shader = new MockWebGLShader(type);
      this.shaders.set(shader.id, shader);
      return shader;
    });
    
    this._mockFunction('shaderSource', (shader, source) => {
      if (shader && this.shaders.has(shader.id)) {
        const shaderObj = this.shaders.get(shader.id);
        shaderObj.source = source;
      }
    });
    
    this._mockFunction('compileShader', (shader) => {
      if (shader && this.shaders.has(shader.id)) {
        const shaderObj = this.shaders.get(shader.id);
        shaderObj.isCompiled = true;
        
        // Simple validation that shader source exists
        shaderObj.compileStatus = shaderObj.source && shaderObj.source.length > 0;
        
        if (!shaderObj.compileStatus) {
          shaderObj.infoLog = 'Mock shader compilation failed: No source provided';
        }
      }
    });
    
    this._mockFunction('getShaderParameter', (shader, pname) => {
      if (shader && this.shaders.has(shader.id)) {
        const shaderObj = this.shaders.get(shader.id);
        if (pname === this.COMPILE_STATUS) {
          return shaderObj.compileStatus;
        }
        // Add other parameter checks as needed
      }
      return null;
    });
    
    this._mockFunction('getShaderInfoLog', (shader) => {
      if (shader && this.shaders.has(shader.id)) {
        return this.shaders.get(shader.id).infoLog;
      }
      return '';
    });
    
    this._mockFunction('deleteShader', (shader) => {
      if (shader && this.shaders.has(shader.id)) {
        const shaderObj = this.shaders.get(shader.id);
        shaderObj.isDeleted = true;
        this.shaders.delete(shader.id);
      }
    });
    
    // Program operations
    this._mockFunction('createProgram', () => {
      const program = new MockWebGLProgram();
      this.programs.set(program.id, program);
      return program;
    });
    
    this._mockFunction('attachShader', (program, shader) => {
      if (program && this.programs.has(program.id) && 
          shader && this.shaders.has(shader.id)) {
        const programObj = this.programs.get(program.id);
        programObj.shaders.push(shader.id);
      }
    });
    
    this._mockFunction('linkProgram', (program) => {
      if (program && this.programs.has(program.id)) {
        const programObj = this.programs.get(program.id);
        programObj.isLinked = true;
        
        // Check if program has both vertex and fragment shaders
        const hasVertexShader = programObj.shaders.some(shaderId => {
          const shader = this.shaders.get(shaderId);
          return shader && shader.type === this.VERTEX_SHADER && shader.compileStatus;
        });
        
        const hasFragmentShader = programObj.shaders.some(shaderId => {
          const shader = this.shaders.get(shaderId);
          return shader && shader.type === this.FRAGMENT_SHADER && shader.compileStatus;
        });
        
        programObj.linkStatus = hasVertexShader && hasFragmentShader;
        
        if (!programObj.linkStatus) {
          programObj.infoLog = 'Mock program linking failed: Missing required shaders';
        }
      }
    });
    
    this._mockFunction('getProgramParameter', (program, pname) => {
      if (program && this.programs.has(program.id)) {
        const programObj = this.programs.get(program.id);
        if (pname === this.LINK_STATUS) {
          return programObj.linkStatus;
        }
        // Add other parameter checks as needed
      }
      return null;
    });
    
    this._mockFunction('getProgramInfoLog', (program) => {
      if (program && this.programs.has(program.id)) {
        return this.programs.get(program.id).infoLog;
      }
      return '';
    });
    
    this._mockFunction('useProgram', (program) => {
      if (program === null) {
        this.currentProgram = null;
        return;
      }
      
      if (this.programs.has(program.id)) {
        this.currentProgram = program;
      }
    });
    
    this._mockFunction('deleteProgram', (program) => {
      if (program && this.programs.has(program.id)) {
        const programObj = this.programs.get(program.id);
        programObj.isDeleted = true;
        this.programs.delete(program.id);
        
        if (this.currentProgram === program) {
          this.currentProgram = null;
        }
      }
    });
    
    // Attribute and uniform operations
    this._mockFunction('getAttribLocation', (program, name) => {
      if (program && this.programs.has(program.id)) {
        const programObj = this.programs.get(program.id);
        if (!programObj.attributes.has(name)) {
          const location = programObj.attributes.size;
          programObj.attributes.set(name, location);
          return location;
        }
        return programObj.attributes.get(name);
      }
      return -1;
    });
    
    this._mockFunction('getUniformLocation', (program, name) => {
      if (program && this.programs.has(program.id)) {
        const programObj = this.programs.get(program.id);
        if (!programObj.uniforms.has(name)) {
          const location = new MockWebGLUniformLocation(name);
          programObj.uniforms.set(name, location);
          return location;
        }
        return programObj.uniforms.get(name);
      }
      return null;
    });
    
    this._mockFunction('enableVertexAttribArray', (index) => {
      // Just record the call
      this.calls.push({ name: 'enableVertexAttribArray', args: { index } });
    });
    
    this._mockFunction('vertexAttribPointer', (index, size, type, normalized, stride, offset) => {
      this.calls.push({ 
        name: 'vertexAttribPointer', 
        args: { index, size, type, normalized, stride, offset } 
      });
    });
    
    // Uniform setters
    this._mockFunction('uniform1f', (location, x) => {
      if (location) location.value = x;
    });
    
    this._mockFunction('uniform2f', (location, x, y) => {
      if (location) location.value = [x, y];
    });
    
    this._mockFunction('uniform3f', (location, x, y, z) => {
      if (location) location.value = [x, y, z];
    });
    
    this._mockFunction('uniform4f', (location, x, y, z, w) => {
      if (location) location.value = [x, y, z, w];
    });
    
    this._mockFunction('uniform1i', (location, x) => {
      if (location) location.value = x;
    });
    
    this._mockFunction('uniform2i', (location, x, y) => {
      if (location) location.value = [x, y];
    });
    
    this._mockFunction('uniform3i', (location, x, y, z) => {
      if (location) location.value = [x, y, z];
    });
    
    this._mockFunction('uniform4i', (location, x, y, z, w) => {
      if (location) location.value = [x, y, z, w];
    });
    
    // Vertex Array Objects (WebGL2)
    this._mockFunction('createVertexArray', () => {
      const vao = new MockWebGLVertexArrayObject();
      this.vaos.set(vao.id, vao);
      return vao;
    });
    
    this._mockFunction('bindVertexArray', (vao) => {
      if (vao === null) {
        this.currentVAO = null;
        return;
      }
      
      if (this.vaos.has(vao.id)) {
        this.currentVAO = vao;
      }
    });
    
    this._mockFunction('deleteVertexArray', (vao) => {
      if (vao && this.vaos.has(vao.id)) {
        const vaoObj = this.vaos.get(vao.id);
        vaoObj.isDeleted = true;
        this.vaos.delete(vao.id);
        
        if (this.currentVAO === vao) {
          this.currentVAO = null;
        }
      }
    });
    
    // Drawing operations
    this._mockFunction('clear', (mask) => {
      // Just record the call
      this.calls.push({ name: 'clear', args: { mask } });
    });
    
    this._mockFunction('clearColor', (r, g, b, a) => {
      this.clearColor = [r, g, b, a];
    });
    
    this._mockFunction('drawArrays', (mode, first, count) => {
      // Just record the call
      this.calls.push({ name: 'drawArrays', args: { mode, first, count } });
    });
    
    this._mockFunction('drawElements', (mode, count, type, offset) => {
      // Just record the call
      this.calls.push({ name: 'drawElements', args: { mode, count, type, offset } });
    });
    
    // Viewport and scissor
    this._mockFunction('viewport', (x, y, width, height) => {
      this.viewport = { x, y, width, height };
    });
    
    // State changes
    this._mockFunction('enable', (cap) => {
      switch (cap) {
        case this.DEPTH_TEST:
          this.depthTest = true;
          break;
        case this.SCISSOR_TEST:
          this.scissorTest = true;
          break;
        case this.BLEND:
          this.blending = true;
          break;
        // Add more as needed
      }
    });
    
    this._mockFunction('disable', (cap) => {
      switch (cap) {
        case this.DEPTH_TEST:
          this.depthTest = false;
          break;
        case this.SCISSOR_TEST:
          this.scissorTest = false;
          break;
        case this.BLEND:
          this.blending = false;
          break;
        // Add more as needed
      }
    });
    
    this._mockFunction('blendFunc', (sfactor, dfactor) => {
      // Just record the call
      this.calls.push({ name: 'blendFunc', args: { sfactor, dfactor } });
    });
    
    // Texture operations
    this._mockFunction('createTexture', () => {
      const texture = new MockWebGLTexture();
      this.textures.set(texture.id, texture);
      return texture;
    });
    
    this._mockFunction('bindTexture', (target, texture) => {
      if (texture === null) {
        return;
      }
      
      if (this.textures.has(texture.id)) {
        const textureObj = this.textures.get(texture.id);
        textureObj.target = target;
      }
    });
    
    this._mockFunction('texImage2D', (target, level, internalformat, width, height, border, format, type, pixels) => {
      // Just record the call
      this.calls.push({ 
        name: 'texImage2D', 
        args: { 
          target, level, internalformat, width, height, 
          border, format, type,
          // Don't store the actual pixels, just the dimensions if available
          pixelsWidth: pixels?.width,
          pixelsHeight: pixels?.height
        } 
      });
    });
    
    this._mockFunction('deleteTexture', (texture) => {
      if (texture && this.textures.has(texture.id)) {
        const textureObj = this.textures.get(texture.id);
        textureObj.isDeleted = true;
        this.textures.delete(texture.id);
      }
    });
  }
  
  /**
   * Create a mock implementation of a WebGL function
   * @param {string} name - Function name
   * @param {Function} implementation - Mock implementation
   * @private
   */
  _mockFunction(name, implementation) {
    this[name] = (...args) => {
      // Record the call for testing
      this.calls.push({ name, args });
      // Execute the mock implementation
      return implementation(...args);
    };
    this._mockFunctions.set(name, implementation);
  }
  
  /**
   * Get the call history for a specific function
   * @param {string} functionName - The name of the function to get calls for
   * @returns {Array} Array of call objects
   */
  getCallsFor(functionName) {
    return this.calls.filter(call => call.name === functionName);
  }
  
  /**
   * Clear the call history
   */
  clearCalls() {
    this.calls = [];
  }
  
  /**
   * Get any errors that have occurred
   * This mocks the getError() WebGL method
   * @returns {number} - Error code or 0 if no error
   */
  getError() {
    return 0; // No error
  }
}

/**
 * Mock implementation of CanvasRenderingContext2D
 * @class MockCanvasRenderingContext2D
 */
class MockCanvasRenderingContext2D {
  /**
   * Create a new CanvasRenderingContext2D mock
   * @param {Object} canvas - The canvas element this context is associated with
   */
  constructor(canvas) {
    // Canvas reference
    this.canvas = canvas;
    
    // Drawing state
    this.fillStyle = '#000000';
    this.strokeStyle = '#000000';
    this.lineWidth = 1;
    this.lineCap = 'butt';
    this.lineJoin = 'miter';
    this.miterLimit = 10;
    this.font = '10px sans-serif';
    this.textAlign = 'start';
    this.textBaseline = 'alphabetic';
    this.direction = 'inherit';
    
    // Transformation state
    this.currentTransform = { a: 1, b: 0, c: 0, d: 1, e: 0, f: 0 };
    
    // Compositing state
    this.globalAlpha = 1.0;
    this.globalCompositeOperation = 'source-over';
    
    // Image smoothing
    this.imageSmoothingEnabled = true;
    this.imageSmoothingQuality = 'low';
    
    // Shadow state
    this.shadowBlur = 0;
    this.shadowColor = 'rgba(0, 0, 0, 0)';
    this.shadowOffsetX = 0;
    this.shadowOffsetY = 0;
    
    // Current path
    this.path = [];
    
    // Pixel manipulation data
    this.imageData = null;
    
    // Track function calls for testing
    this.calls = [];
    
    // Initialize function mocks
    this._initializeFunctionMocks();
  }
  
  /**
   * Initialize Canvas2D function mocks
   * @private
   */
  _initializeFunctionMocks() {
    // State functions
    this._mockFunction('save', () => {
      // In a real implementation, this would save the current state
      // Here we just record the call
    });
    
    this._mockFunction('restore', () => {
      // In a real implementation, this would restore the previously saved state
      // Here we just record the call
    });
    
    // Transformation functions
    this._mockFunction('scale', (x, y) => {
      this.currentTransform.a *= x;
      this.currentTransform.d *= y;
    });
    
    this._mockFunction('rotate', (angle) => {
      const cos = Math.cos(angle);
      const sin = Math.sin(angle);
      const { a, b, c, d } = this.currentTransform;
      
      this.currentTransform.a = a * cos - b * sin;
      this.currentTransform.b = a * sin + b * cos;
      this.currentTransform.c = c * cos - d * sin;
      this.currentTransform.d = c * sin + d * cos;
    });
    
    this._mockFunction('translate', (x, y) => {
      this.currentTransform.e += x;
      this.currentTransform.f += y;
    });
    
    this._mockFunction('transform', (a, b, c, d, e, f) => {
      // Mock implementation for transform matrix multiplication
      const { a: a1, b: b1, c: c1, d: d1, e: e1, f: f1 } = this.currentTransform;
      
      this.currentTransform.a = a1 * a + c1 * b;
      this.currentTransform.b = b1 * a + d1 * b;
      this.currentTransform.c = a1 * c + c1 * d;
      this.currentTransform.d = b1 * c + d1 * d;
      this.currentTransform.e = a1 * e + c1 * f + e1;
      this.currentTransform.f = b1 * e + d1 * f + f1;
    });
    
    this._mockFunction('setTransform', (a, b, c, d, e, f) => {
      this.currentTransform = { a, b, c, d, e, f };
    });
    
    this._mockFunction('resetTransform', () => {
      this.currentTransform = { a: 1, b: 0, c: 0, d: 1, e: 0, f: 0 };
    });
    
    // Path functions
    this._mockFunction('beginPath', () => {
      this.path = [];
    });
    
    this._mockFunction('closePath', () => {
      if (this.path.length > 0) {
        this.path.push({ type: 'closePath' });
      }
    });
    
    this._mockFunction('moveTo', (x, y) => {
      this.path.push({ type: 'moveTo', x, y });
    });
    
    this._mockFunction('lineTo', (x, y) => {
      this.path.push({ type: 'lineTo', x, y });
    });
    
    this._mockFunction('bezierCurveTo', (cp1x, cp1y, cp2x, cp2y, x, y) => {
      this.path.push({ type: 'bezierCurveTo', cp1x, cp1y, cp2x, cp2y, x, y });
    });
    
    this._mockFunction('quadraticCurveTo', (cpx, cpy, x, y) => {
      this.path.push({ type: 'quadraticCurveTo', cpx, cpy, x, y });
    });
    
    this._mockFunction('arc', (x, y, radius, startAngle, endAngle, counterclockwise) => {
      this.path.push({ type: 'arc', x, y, radius, startAngle, endAngle, counterclockwise });
    });
    
    this._mockFunction('arcTo', (x1, y1, x2, y2, radius) => {
      this.path.push({ type: 'arcTo', x1, y1, x2, y2, radius });
    });
    
    this._mockFunction('ellipse', (x, y, radiusX, radiusY, rotation, startAngle, endAngle, counterclockwise) => {
      this.path.push({ 
        type: 'ellipse', 
        x, y, radiusX, radiusY, 
        rotation, startAngle, endAngle, counterclockwise 
      });
    });
    
    this._mockFunction('rect', (x, y, width, height) => {
      this.path.push({ type: 'rect', x, y, width, height });
    });
    
    // Drawing functions
    this._mockFunction('fill', (fillRule) => {
      // In a real implementation, this would fill the current path
      // Here we just record the call
      this.calls.push({ name: 'fill', args: { fillRule, fillStyle: this.fillStyle } });
    });
    
    this._mockFunction('stroke', () => {
      // In a real implementation, this would stroke the current path
      // Here we just record the call
      this.calls.push({ name: 'stroke', args: { strokeStyle: this.strokeStyle, lineWidth: this.lineWidth } });
    });
    
    this._mockFunction('clip', (fillRule) => {
      // Just record the call
      this.calls.push({ name: 'clip', args: { fillRule } });
    });
    
    this._mockFunction('isPointInPath', (x, y, fillRule) => {
      // Simplified mock that always returns false
      return false;
    });
    
    this._mockFunction('isPointInStroke', (x, y) => {
      // Simplified mock that always returns false
      return false;
    });
    
    // Text drawing functions
    this._mockFunction('fillText', (text, x, y, maxWidth) => {
      this.calls.push({ 
        name: 'fillText', 
        args: { text, x, y, maxWidth, fillStyle: this.fillStyle, font: this.font } 
      });
    });
    
    this._mockFunction('strokeText', (text, x, y, maxWidth) => {
      this.calls.push({ 
        name: 'strokeText', 
        args: { text, x, y, maxWidth, strokeStyle: this.strokeStyle, font: this.font } 
      });
    });
    
    this._mockFunction('measureText', (text) => {
      // Return a simplified TextMetrics object with just the width
      // For testing, we'll use a simple approximation of 10px per character
      const width = text.length * 10;
      return { 
        width,
        actualBoundingBoxLeft: width / 2,
        actualBoundingBoxRight: width / 2,
        actualBoundingBoxAscent: 10,
        actualBoundingBoxDescent: 3,
        fontBoundingBoxAscent: 10,
        fontBoundingBoxDescent: 3,
        emHeightAscent: 10,
        emHeightDescent: 3,
        hangingBaseline: 3,
        alphabeticBaseline: 0,
        ideographicBaseline: -3
      };
    });
    
    // Rectangle functions
    this._mockFunction('clearRect', (x, y, width, height) => {
      // Just record the call
      this.calls.push({ name: 'clearRect', args: { x, y, width, height } });
    });
    
    this._mockFunction('fillRect', (x, y, width, height) => {
      this.calls.push({ name: 'fillRect', args: { x, y, width, height, fillStyle: this.fillStyle } });
    });
    
    this._mockFunction('strokeRect', (x, y, width, height) => {
      this.calls.push({ 
        name: 'strokeRect', 
        args: { x, y, width, height, strokeStyle: this.strokeStyle, lineWidth: this.lineWidth } 
      });
    });
    
    // Image drawing
    this._mockFunction('drawImage', (image, sx, sy, sWidth, sHeight, dx, dy, dWidth, dHeight) => {
      // Determine which overload is being used
      if (arguments.length === 3) {
        // drawImage(image, dx, dy)
        this.calls.push({ name: 'drawImage', args: { image, dx: sx, dy: sy } });
      } else if (arguments.length === 5) {
        // drawImage(image, dx, dy, dWidth, dHeight)
        this.calls.push({ name: 'drawImage', args: { image, dx: sx, dy: sy, dWidth: sWidth, dHeight: sHeight } });
      } else {
        // drawImage(image, sx, sy, sWidth, sHeight, dx, dy, dWidth, dHeight)
        this.calls.push({ 
          name: 'drawImage', 
          args: { image, sx, sy, sWidth, sHeight, dx, dy, dWidth, dHeight } 
        });
      }
    });
    
    // Pixel manipulation
    this._mockFunction('createImageData', (width, height) => {
      if (arguments.length === 1 && typeof width === 'object') {
        // createImageData(imageData)
        const { width: w, height: h } = width;
        return {
          width: w,
          height: h,
          data: new Uint8ClampedArray(w * h * 4)
        };
      } else {
        // createImageData(width, height)
        return {
          width,
          height,
          data: new Uint8ClampedArray(width * height * 4)
        };
      }
    });
    
    this._mockFunction('getImageData', (sx, sy, sw, sh) => {
      // Create a blank ImageData object of the requested size
      this.calls.push({ name: 'getImageData', args: { sx, sy, sw, sh } });
      
      return {
        width: sw,
        height: sh,
        data: new Uint8ClampedArray(sw * sh * 4)
      };
    });
    
    this._mockFunction('putImageData', (imageData, dx, dy, dirtyX, dirtyY, dirtyWidth, dirtyHeight) => {
      if (arguments.length <= 3) {
        // putImageData(imageData, dx, dy)
        this.calls.push({ name: 'putImageData', args: { imageData, dx, dy } });
      } else {
        // putImageData(imageData, dx, dy, dirtyX, dirtyY, dirtyWidth, dirtyHeight)
        this.calls.push({ 
          name: 'putImageData', 
          args: { imageData, dx, dy, dirtyX, dirtyY, dirtyWidth, dirtyHeight } 
        });
      }
    });
  }
  
  /**
   * Create a mock implementation of a Canvas2D function
   * @param {string} name - Function name
   * @param {Function} implementation - Mock implementation
   * @private
   */
  _mockFunction(name, implementation) {
    this[name] = (...args) => {
      // Record the call for testing
      this.calls.push({ name, args });
      // Execute the mock implementation
      return implementation(...args);
    };
  }
  
  /**
   * Get the call history for a specific function
   * @param {string} functionName - The name of the function to get calls for
   * @returns {Array} Array of call objects
   */
  getCallsFor(functionName) {
    return this.calls.filter(call => call.name === functionName);
  }
  
  /**
   * Clear the call history
   */
  clearCalls() {
    this.calls = [];
  }
}

/**
 * Mock implementation of HTMLCanvasElement
 * @class MockHTMLCanvasElement
 */
class MockHTMLCanvasElement {
  /**
   * Create a new canvas mock
   * @param {number} width - Canvas width
   * @param {number} height - Canvas height
   */
  constructor(width = 300, height = 150) {
    this.width = width;
    this.height = height;
    this._contexts = new Map();
  }
  
  /**
   * Get a rendering context for the canvas
   * @param {string} contextType - The context type ('2d', 'webgl', 'webgl2')
   * @param {Object} contextAttributes - Optional context attributes
   * @returns {Object} The rendering context
   */
  getContext(contextType, contextAttributes = {}) {
    // Return existing context if already created
    if (this._contexts.has(contextType)) {
      return this._contexts.get(contextType);
    }
    
    // Create new context based on type
    let context;
    switch (contextType) {
      case '2d':
        context = new MockCanvasRenderingContext2D(this);
        break;
      case 'webgl':
      case 'experimental-webgl':
        context = new MockWebGLRenderingContext(this, contextAttributes);
        break;
      case 'webgl2':
        // WebGL2 extends WebGL1, but for the mock we'll just use the same implementation
        context = new MockWebGLRenderingContext(this, contextAttributes);
        break;
      default:
        return null;
    }
    
    this._contexts.set(contextType, context);
    return context;
  }
  
  /**
   * Convert the canvas content to a data URL
   * @param {string} type - MIME type (default: 'image/png')
   * @param {number} quality - Image quality for image/jpeg (0-1)
   * @returns {string} Data URL
   */
  toDataURL(type = 'image/png', quality) {
    // For testing, return a fake data URL
    return `data:${type};base64,mockCanvasData`;
  }
  
  /**
   * Convert the canvas content to a Blob
   * @param {Function} callback - Callback function with the Blob
   * @param {string} type - MIME type (default: 'image/png')
   * @param {number} quality - Image quality for image/jpeg (0-1)
   */
  toBlob(callback, type = 'image/png', quality) {
    // Create a mock Blob
    setTimeout(() => {
      const mockBlob = new Blob(['mockCanvasData'], { type });
      callback(mockBlob);
    }, 0);
  }
  
  /**
   * Get the canvas dimensions as a DOMRect
   * @returns {Object} DOMRect-like object
   */
  getBoundingClientRect() {
    return {
      x: 0,
      y: 0,
      width: this.width,
      height: this.height,
      top: 0,
      right: this.width,
      bottom: this.height,
      left: 0
    };
  }
}

/**
 * Create a mock canvas element with specified dimensions
 * @param {number} width - Canvas width
 * @param {number} height - Canvas height
 * @returns {MockHTMLCanvasElement} Mock canvas element
 */
function createMockCanvas(width = 300, height = 150) {
  return new MockHTMLCanvasElement(width, height);
}

/**
 * Create a mock 2D rendering context
 * @param {number} width - Canvas width
 * @param {number} height - Canvas height
 * @returns {MockCanvasRenderingContext2D} Mock 2D context
 */
function createMock2DContext(width = 300, height = 150) {
  const canvas = createMockCanvas(width, height);
  return canvas.getContext('2d');
}

/**
 * Create a mock WebGL rendering context
 * @param {number} width - Canvas width
 * @param {number} height - Canvas height
 * @param {Object} contextAttributes - Optional WebGL context attributes
 * @returns {MockWebGLRenderingContext} Mock WebGL context
 */
function createMockWebGLContext(width = 300, height = 150, contextAttributes = {}) {
  const canvas = createMockCanvas(width, height);
  return canvas.getContext('webgl', contextAttributes);
}

/**
 * Create a mock WebGL2 rendering context
 * @param {number} width - Canvas width
 * @param {number} height - Canvas height
 * @param {Object} contextAttributes - Optional WebGL context attributes
 * @returns {MockWebGLRenderingContext} Mock WebGL2 context
 */
function createMockWebGL2Context(width = 300, height = 150, contextAttributes = {}) {
  const canvas = createMockCanvas(width, height);
  return canvas.getContext('webgl2', contextAttributes);
}

// Export mock classes and utilities
module.exports = {
  MockHTMLCanvasElement,
  MockCanvasRenderingContext2D,
  MockWebGLRenderingContext,
  createMockCanvas,
  createMock2DContext,
  createMockWebGLContext,
  createMockWebGL2Context,
  WebGLConstants
};
