import React from 'react';
import {renderToString} from 'react-dom/server';
import {StaticRouter} from 'react-router';
import {SiteDataProvider} from '@/src/data/SiteDataProvider';
import {AppRoutes, PRERENDER_PATHS} from './router';

export {PRERENDER_PATHS};

export async function render(url: string) {
  const html = renderToString(
    <SiteDataProvider>
      <StaticRouter location={url}>
        <AppRoutes />
      </StaticRouter>
    </SiteDataProvider>,
  );

  return {html};
}

