import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';
import { ToastProvider } from './components/common/Primitives';

// Initialize dark mode from localStorage on first load
const savedTheme = localStorage.getItem('kb-theme');
document.documentElement.setAttribute('data-theme', savedTheme ?? 'light');

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ToastProvider>
      <App />
    </ToastProvider>
  </React.StrictMode>
);
