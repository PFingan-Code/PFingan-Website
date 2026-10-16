import {BUILD_META} from '@/src/generated/build-meta';
import {SITE_DATA} from '@/src/generated/site-data';
import type {BuildMeta, SiteData} from '@/src/types/site-data';

export interface DataSnapshot {
  data: SiteData;
  meta: BuildMeta;
}

export const SNAPSHOT: DataSnapshot = {
  data: SITE_DATA,
  meta: BUILD_META,
};
