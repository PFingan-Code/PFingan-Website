import React from 'react';
import {renderToString} from 'react-dom/server';
import {StaticRouter} from 'react-router';
import {SNAPSHOT} from '@/src/data/snapshot';
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

  return {
    html,
    metadata: {
      language: SNAPSHOT.data.site.brand.language,
      title: SNAPSHOT.data.site.brand.name,
      description: SNAPSHOT.data.site.brand.description,
    },
  };
}

