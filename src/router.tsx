import MainLayout from '@/src/layouts/MainLayout';
import AboutPage from '@/src/pages/AboutPage';
import DonatePage from '@/src/pages/DonatePage';
import HomePage from '@/src/pages/HomePage';
import MomentPage from '@/src/pages/MomentPage';
import ServerPage from '@/src/pages/ServerPage';
import {Route, Routes} from 'react-router-dom';

export const PRERENDER_PATHS = [
  '/',
  '/server',
  '/moment',
  '/about',
  '/donate',
] as const;

export function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<MainLayout />}>
        <Route index element={<HomePage />} />
        <Route path="server" element={<ServerPage />} />
        <Route path="moment" element={<MomentPage />} />
        <Route path="about" element={<AboutPage />} />
        <Route path="donate" element={<DonatePage />} />
      </Route>
    </Routes>
  );
}

