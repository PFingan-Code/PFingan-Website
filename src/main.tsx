import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import {BrowserRouter} from 'react-router-dom';
import {SiteDataProvider} from '@/src/data/SiteDataProvider';
import {AppRoutes} from './router';
import './index.css';

const baseName = (import.meta.env.BASE_URL ?? '/').replace(/\/$/, '');

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <SiteDataProvider>
      <BrowserRouter basename={baseName || undefined}>
        <AppRoutes />
      </BrowserRouter>
    </SiteDataProvider>
  </StrictMode>,
);
