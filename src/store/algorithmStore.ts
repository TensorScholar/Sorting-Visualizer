import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';

export interface AlgorithmState {
  id: string;
  name: string;
  category: string;
  isRunning: boolean;
  isPaused: boolean;
  currentStep: number;
  totalSteps: number;
  metrics: {
    comparisons: number;
    swaps: number;
    reads: number;
    writes: number;
    executionTime: number;
  };
  history: Array<{
    array: number[];
    step: number;
    metadata: Record<string, any>;
  }>;
}

export interface VisualizationState {
  data: number[];
  dataSize: number;
  dataType: 'random' | 'sorted' | 'reversed' | 'nearly-sorted' | 'few-unique';
  renderMode: 'webgl' | 'canvas' | 'three';
  animationSpeed: number;
  showMetrics: boolean;
  showHeapView: boolean;
  colorScheme: 'default' | 'gradient' | 'rainbow' | 'monochrome';
}

export interface UIState {
  selectedAlgorithm: string;
  view: 'visualizer' | 'comparison' | 'tutorial';
  theme: 'light' | 'dark' | 'auto';
  sidebarOpen: boolean;
  notifications: Array<{
    id: string;
    type: 'success' | 'error' | 'warning' | 'info';
    message: string;
    duration?: number;
  }>;
}

interface AppState {
  // Algorithm state
  algorithm: AlgorithmState;
  
  // Visualization state
  visualization: VisualizationState;
  
  // UI state
  ui: UIState;
  
  // Actions
  setAlgorithm: (algorithm: Partial<AlgorithmState>) => void;
  setVisualization: (visualization: Partial<VisualizationState>) => void;
  setUI: (ui: Partial<UIState>) => void;
  
  // Algorithm actions
  startAlgorithm: () => void;
  pauseAlgorithm: () => void;
  resetAlgorithm: () => void;
  stepForward: () => void;
  stepBackward: () => void;
  
  // Data actions
  generateData: (size: number, type: VisualizationState['dataType']) => void;
  shuffleData: () => void;
  
  // Notification actions
  addNotification: (notification: Omit<UIState['notifications'][0], 'id'>) => void;
  removeNotification: (id: string) => void;
}

const initialState = {
  algorithm: {
    id: 'merge-sort',
    name: 'Merge Sort',
    category: 'comparison',
    isRunning: false,
    isPaused: false,
    currentStep: 0,
    totalSteps: 0,
    metrics: {
      comparisons: 0,
      swaps: 0,
      reads: 0,
      writes: 0,
      executionTime: 0,
    },
    history: [],
  },
  visualization: {
    data: [],
    dataSize: 30,
    dataType: 'random' as const,
    renderMode: 'webgl' as const,
    animationSpeed: 1,
    showMetrics: true,
    showHeapView: false,
    colorScheme: 'default' as const,
  },
  ui: {
    selectedAlgorithm: 'merge-sort',
    view: 'visualizer' as const,
    theme: 'dark' as const,
    sidebarOpen: false,
    notifications: [],
  },
};

export const useAppStore = create<AppState>()(
  devtools(
    persist(
      (set, get) => ({
        ...initialState,
        
        setAlgorithm: (algorithm) =>
          set((state) => ({
            algorithm: { ...state.algorithm, ...algorithm },
          })),
        
        setVisualization: (visualization) =>
          set((state) => ({
            visualization: { ...state.visualization, ...visualization },
          })),
        
        setUI: (ui) =>
          set((state) => ({
            ui: { ...state.ui, ...ui },
          })),
        
        startAlgorithm: () =>
          set((state) => ({
            algorithm: {
              ...state.algorithm,
              isRunning: true,
              isPaused: false,
            },
          })),
        
        pauseAlgorithm: () =>
          set((state) => ({
            algorithm: {
              ...state.algorithm,
              isRunning: false,
              isPaused: true,
            },
          })),
        
        resetAlgorithm: () =>
          set((state) => ({
            algorithm: {
              ...state.algorithm,
              isRunning: false,
              isPaused: false,
              currentStep: 0,
              metrics: initialState.algorithm.metrics,
              history: [],
            },
          })),
        
        stepForward: () =>
          set((state) => ({
            algorithm: {
              ...state.algorithm,
              currentStep: Math.min(
                state.algorithm.currentStep + 1,
                state.algorithm.totalSteps
              ),
            },
          })),
        
        stepBackward: () =>
          set((state) => ({
            algorithm: {
              ...state.algorithm,
              currentStep: Math.max(state.algorithm.currentStep - 1, 0),
            },
          })),
        
        generateData: (size, type) => {
          const generateRandomArray = (size: number) => {
            return Array.from({ length: size }, () =>
              Math.floor(Math.random() * 100) + 1
            );
          };
          
          const generateSortedArray = (size: number) => {
            return Array.from({ length: size }, (_, i) => i + 1);
          };
          
          const generateReversedArray = (size: number) => {
            return Array.from({ length: size }, (_, i) => size - i);
          };
          
          const generateNearlySortedArray = (size: number) => {
            const sorted = generateSortedArray(size);
            // Swap a few random elements
            for (let i = 0; i < Math.floor(size * 0.1); i++) {
              const idx1 = Math.floor(Math.random() * size);
              const idx2 = Math.floor(Math.random() * size);
              [sorted[idx1], sorted[idx2]] = [sorted[idx2], sorted[idx1]];
            }
            return sorted;
          };
          
          const generateFewUniqueArray = (size: number) => {
            const uniqueValues = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
            return Array.from({ length: size }, () =>
              uniqueValues[Math.floor(Math.random() * uniqueValues.length)]
            );
          };
          
          let data: number[];
          switch (type) {
            case 'sorted':
              data = generateSortedArray(size);
              break;
            case 'reversed':
              data = generateReversedArray(size);
              break;
            case 'nearly-sorted':
              data = generateNearlySortedArray(size);
              break;
            case 'few-unique':
              data = generateFewUniqueArray(size);
              break;
            default:
              data = generateRandomArray(size);
          }
          
          set((state) => ({
            visualization: {
              ...state.visualization,
              data,
              dataSize: size,
              dataType: type,
            },
          }));
        },
        
        shuffleData: () => {
          const { data } = get().visualization;
          const shuffled = [...data].sort(() => Math.random() - 0.5);
          set((state) => ({
            visualization: {
              ...state.visualization,
              data: shuffled,
            },
          }));
        },
        
        addNotification: (notification) => {
          const id = Math.random().toString(36).substr(2, 9);
          set((state) => ({
            ui: {
              ...state.ui,
              notifications: [
                ...state.ui.notifications,
                { ...notification, id },
              ],
            },
          }));
          
          // Auto-remove notification after duration
          if (notification.duration) {
            setTimeout(() => {
              get().removeNotification(id);
            }, notification.duration);
          }
        },
        
        removeNotification: (id) =>
          set((state) => ({
            ui: {
              ...state.ui,
              notifications: state.ui.notifications.filter((n) => n.id !== id),
            },
          })),
      }),
      {
        name: 'sorting-visualizer-storage',
        partialize: (state) => ({
          ui: { theme: state.ui.theme },
          visualization: {
            dataSize: state.visualization.dataSize,
            dataType: state.visualization.dataType,
            renderMode: state.visualization.renderMode,
            animationSpeed: state.visualization.animationSpeed,
            colorScheme: state.visualization.colorScheme,
          },
        }),
      }
    ),
    {
      name: 'sorting-visualizer-store',
    }
  )
);
