import { StrictMode } from 'react';
import type { ComponentType } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import { TargiDashboard } from './pages/TargiDashboard';
import { InauguracjaDashboard } from './pages/InauguracjaDashboard';
import { InauguracjaZadania, InauguracjaSciagawka } from './pages/InauguracjaZadania';
import { InauguracjaInfografika } from './pages/InauguracjaInfografika';

const ROUTES: [string, ComponentType][] = [
  ['/targi', TargiDashboard],
  ['/inauguracja/zadania', InauguracjaZadania],
  ['/inauguracja/sciagawka', InauguracjaSciagawka],
  ['/inauguracja/infografika', InauguracjaInfografika],
  ['/inauguracja', InauguracjaDashboard],
];

const Page = ROUTES.find(([prefix]) => window.location.pathname.startsWith(prefix))?.[1] ?? App;

createRoot(document.getElementById('root') as HTMLElement).render(
  <StrictMode>
    <Page />
  </StrictMode>
);
