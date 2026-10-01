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

// Kiosks never reload on their own: poll index.html and reload once a new deploy changes the hashed bundle name.
const BUNDLE_RE = /\/assets\/index-[\w-]+\.js/;
const loadedBundle = document.querySelector<HTMLScriptElement>('script[type="module"][src*="/assets/"]')?.getAttribute('src');
if (import.meta.env.PROD && loadedBundle) {
  setInterval(async () => {
    try {
      const html = await (await fetch('/', { cache: 'no-store' })).text();
      const latest = html.match(BUNDLE_RE)?.[0];
      if (latest && !loadedBundle.endsWith(latest)) window.location.reload();
    } catch {
      // offline or mid-deploy: try again next tick
    }
  }, 2 * 60_000);
}

createRoot(document.getElementById('root') as HTMLElement).render(
  <StrictMode>
    <Page />
  </StrictMode>
);
