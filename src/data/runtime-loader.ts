import {canonicalJson} from '@/src/data/canonical';
import {validateSiteData} from '@/src/data/schema';
import type {
  BuildMeta,
  DataManifest,
  DataStatus,
  SiteData,
} from '@/src/types/site-data';
import {DATA_FILES} from '@/src/types/site-data';

interface RepositoryLike {
  owner: string;
  name: string;
  dataBranch: string;
}

export interface RuntimeDataResult {
  data?: SiteData;
  manifest?: DataManifest;
  status: DataStatus;
}

function rawDataUrl(repository: RepositoryLike, file: string, cacheKey?: string): string {
  const base = `https://raw.githubusercontent.com/${encodeURIComponent(repository.owner)}/${encodeURIComponent(repository.name)}/${encodeURIComponent(repository.dataBranch)}/data/${file}`;
  return cacheKey ? `${base}?v=${encodeURIComponent(cacheKey)}` : base;
}

async function readJson<T>(url: string): Promise<T> {
  const response = await fetch(url, {
    headers: {Accept: 'application/json'},
    cache: 'no-store',
  });
  if (!response.ok) throw new Error(`数据请求失败 (${response.status})`);
  return (await response.json()) as T;
}

function combineFiles(files: Record<string, unknown>): unknown {
  const site = files['site.json'] as Record<string, unknown>;
  return {
    schemaVersion: site.schemaVersion,
    site: site.site,
    navigation: site.navigation,
    contact: site.contact,
    home: site.home,
    announcements: site.announcements,
    features: (files['features.json'] as {items: unknown[]}).items,
    servers: (files['servers.json'] as {items: unknown[]}).items,
    resources: (files['resources.json'] as {items: unknown[]}).items,
    members: files['members.json'],
    moments: files['moments.json'],
    donations: files['donations.json'],
  };
}

export async function loadLatestData(
  snapshot: SiteData,
  buildMeta: BuildMeta,
): Promise<RuntimeDataResult> {
  const repository = snapshot.site.repository;
  const manifestUrl = rawDataUrl(repository, 'manifest.json');
  try {
    const manifest = await readJson<DataManifest>(manifestUrl);
    if (manifest.schemaVersion !== buildMeta.schemaVersion) {
      return {
        manifest,
        status: {
          source: 'snapshot',
          state: 'invalid',
          message: '远端数据版本不兼容，继续使用构建快照',
          latestContentHash: manifest.contentHash,
        },
      };
    }
    if (manifest.contentHash === buildMeta.contentHash) {
      return {
        manifest,
        status: {
          source: 'snapshot',
          state: 'synchronized',
          message: '当前页面与 data 分支同步',
          latestContentHash: manifest.contentHash,
        },
      };
    }

    const files = Object.fromEntries(
      await Promise.all(
        DATA_FILES.map(async (file) => [file, await readJson<unknown>(rawDataUrl(repository, file, manifest.contentHash))]),
      ),
    );
    const data = validateSiteData(combineFiles(files));
    const actualHash = await hashText(canonicalJson(data));
    if (actualHash !== manifest.contentHash) {
      throw new Error('远端数据校验和不匹配');
    }
    return {
      data,
      manifest,
      status: {
        source: 'runtime',
        state: 'updated',
        message: '已加载 data 分支最新内容，静态页面等待重建',
        latestContentHash: manifest.contentHash,
      },
    };
  } catch (error) {
    return {
      status: {
        source: 'snapshot',
        state: 'unavailable',
        message: error instanceof Error ? `最新数据暂不可用：${error.message}` : '最新数据暂不可用，继续使用构建快照',
      },
    };
  }
}

async function hashText(value: string): Promise<string> {
  if (!globalThis.crypto?.subtle) throw new Error('当前浏览器不支持数据校验');
  const bytes = new TextEncoder().encode(value);
  const digest = await globalThis.crypto.subtle.digest('SHA-256', bytes);
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, '0')).join('');
}
