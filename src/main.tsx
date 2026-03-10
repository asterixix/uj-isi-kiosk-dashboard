import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import { TargiDashboard } from './pages/TargiDashboard';

const isTargiPage = window.location.pathname.startsWith('/targi');

createRoot(document.getElementById('root') as HTMLElement).render(
  <StrictMode>
    {isTargiPage ? <TargiDashboard /> : <App />}
  </StrictMode>
);
