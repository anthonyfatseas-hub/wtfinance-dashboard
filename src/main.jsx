import React from 'react';
import { createRoot } from 'react-dom/client';
import Pipeline from './Pipeline.jsx';
import IntegrationStatus from './IntegrationStatus.jsx';
import './storage-shim.js';

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <Pipeline />
    <IntegrationStatus />
  </React.StrictMode>
);
