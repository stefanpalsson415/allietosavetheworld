import React from 'react';
import ReactDOM from 'react-dom/client';
import { HelmetProvider } from 'react-helmet-async';
import './index.css';
import './styles/notion.css'; // Import Notion-style CSS
import './styles/smooth-transitions.css'; // Import smooth transitions for better UX
import './components/dashboard/nordic-styles.css'; // Import Nordic design system
import App from './App';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <HelmetProvider>
      <App />
    </HelmetProvider>
  </React.StrictMode>
);

