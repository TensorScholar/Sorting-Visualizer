/**
 * Advanced Sorting Algorithm Visualization Platform
 * Entry Point Module
 * 
 * This module serves as the application's initialization point, establishing
 * the React rendering tree and importing global stylesheets.
 */

import React from 'react';
import ReactDOM from 'react-dom';

// Import global stylesheets (index.css internally imports normalize.css)
import './styles/index.css';

// Import main application component
import App from './App';

/**
 * Render the root application component within a StrictMode wrapper
 * to highlight potential problems in development
 */
ReactDOM.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
  document.getElementById('root')
);