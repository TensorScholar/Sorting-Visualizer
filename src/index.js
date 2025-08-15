/**
 * Advanced Sorting Algorithm Visualization Platform
 * Entry Point Module
 * 
 * This module serves as the application's initialization point, establishing
 * the React rendering tree and importing global stylesheets.
 */

import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './styles/index.css';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);