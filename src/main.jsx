import React from 'react';
import { createRoot } from 'react-dom/client';
import Pipeline from './Pipeline.jsx';
import './storage-shim.js';

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <Pipeline />
  </React.StrictMode>
);
