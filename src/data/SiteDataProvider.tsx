import {loadLatestData} from '@/src/data/runtime-loader';
import {SNAPSHOT} from '@/src/data/snapshot';
import type {DataSource, DataStatus, SiteData} from '@/src/types/site-data';
import {createContext, useContext, useEffect, useMemo, useState, type ReactNode} from 'react';

interface SiteDataProviderProps {
  children: ReactNode;
}

interface DraftPreview {
  data: SiteData;
  assets: Record<string, string>;
}

const DRAFT_PREVIEW_EVENT = 'site-draft-preview';
let activeDraftPreview: DraftPreview | null = null;

export function setSiteDataPreview(preview: DraftPreview | null): void {
  activeDraftPreview = preview;
  if (typeof window !== 'undefined') window.dispatchEvent(new Event(DRAFT_PREVIEW_EVENT));
}

interface SiteDataContextValue {
  data: SiteData;
  source: DataSource;
  status: DataStatus;
  buildMeta: typeof SNAPSHOT.meta;
  resolveAsset: (path: string) => string;
  resolveUrl: (url: string) => string;
  previewActive: boolean;
  exitPreview: () => void;
}

const initialStatus: DataStatus = {
  source: 'snapshot',
  state: 'checking',
  message: '正在检查 data 分支最新内容',
};

const SiteDataContext = createContext<SiteDataContextValue | null>(null);

function publicBase(): string {
  const base = import.meta.env.BASE_URL ?? '/';
  return base.endsWith('/') ? base : `${base}/`;
}

function rawAssetBase(data: SiteData): string {
  const {owner, name, dataBranch} = data.site.repository;
  return `https://raw.githubusercontent.com/${encodeURIComponent(owner)}/${encodeURIComponent(name)}/${encodeURIComponent(dataBranch)}/data/`;
}

function updateDocumentMetadata(data: SiteData, source: DataSource): void {
  if (typeof document === 'undefined') return;
  document.documentElement.lang = data.site.brand.language;
  document.title = data.site.brand.name;
  const description = document.querySelector('meta[name="description"]');
  if (description) description.setAttribute('content', data.site.brand.description);
  let themeColor = document.querySelector('meta[name="theme-color"]');
  if (!themeColor) {
    themeColor = document.createElement('meta');
    themeColor.setAttribute('name', 'theme-color');
    document.head.appendChild(themeColor);
  }
  themeColor.setAttribute('content', data.site.brand.themeColor);
  document.documentElement.style.setProperty('--color-brand-primary', data.site.brand.themeColor);
  document.documentElement.style.setProperty('--color-brand-gradient', `color-mix(in srgb, ${data.site.brand.themeColor} 72%, white)`);
  document.documentElement.style.setProperty('--color-brand-secondary', `color-mix(in srgb, ${data.site.brand.themeColor} 72%, black)`);
  let favicon = document.querySelector<HTMLLinkElement>('link[rel="icon"]');
  if (!favicon) {
    favicon = document.createElement('link');
    favicon.rel = 'icon';
    document.head.appendChild(favicon);
  }
  favicon.href = resolveAssetPath(data.site.brand.favicon, data, source);
}

function resolveAssetPath(path: string, data: SiteData, source: DataSource): string {
  if (/^(https?:|mailto:)/.test(path)) return path;
  if (path.startsWith('/')) return `${publicBase()}${path.replace(/^\/+/, '')}`;
  if (source === 'runtime') return `${rawAssetBase(data)}${path}`;
  return `${publicBase()}data-assets/${path.replace(/^assets\//, '')}`;
}

function resolveSiteUrl(url: string): string {
  if (!url.startsWith('/')) return url;
  return `${publicBase()}${url.replace(/^\/+/, '')}`;
}

export function SiteDataProvider({children}: SiteDataProviderProps) {
  const [remoteData, setRemoteData] = useState(SNAPSHOT.data);
  const [remoteSource, setRemoteSource] = useState<DataSource>('snapshot');
  const [remoteStatus, setRemoteStatus] = useState<DataStatus>(initialStatus);
  const [preview, setPreview] = useState<DraftPreview | null>(activeDraftPreview);
  const isPreview = Boolean(preview);
  const data = preview?.data ?? remoteData;
  const source = isPreview ? 'runtime' : remoteSource;
  const status = isPreview ? {source, state: 'updated' as const, message: '当前显示未提交草稿预览'} : remoteStatus;

  useEffect(() => {
    const handlePreview = () => setPreview(activeDraftPreview);
    window.addEventListener(DRAFT_PREVIEW_EVENT, handlePreview);
    return () => window.removeEventListener(DRAFT_PREVIEW_EVENT, handlePreview);
  }, []);

  useEffect(() => {
    if (isPreview) return;
    let cancelled = false;
    void loadLatestData(SNAPSHOT.data, SNAPSHOT.meta).then((result) => {
      if (cancelled) return;
      if (result.data) {
        setRemoteData(result.data);
        setRemoteSource('runtime');
      }
      setRemoteStatus(result.status);
    });
    return () => {
      cancelled = true;
    };
  }, [isPreview]);

  useEffect(() => {
    updateDocumentMetadata(data, source);
  }, [data, source]);

  const value = useMemo<SiteDataContextValue>(
    () => ({
      data,
      source,
      status,
      buildMeta: SNAPSHOT.meta,
      resolveAsset: (path: string) => preview?.assets[path] ?? resolveAssetPath(path, data, source),
      resolveUrl: resolveSiteUrl,
      previewActive: isPreview,
      exitPreview: () => setSiteDataPreview(null),
    }),
    [data, preview, source, status],
  );

  return <SiteDataContext.Provider value={value}>{children}</SiteDataContext.Provider>;
}

export function useSiteData(): SiteDataContextValue {
  const context = useContext(SiteDataContext);
  if (!context) throw new Error('useSiteData 必须在 SiteDataProvider 内使用');
  return context;
}

export function DataSyncStatus() {
  const {status, buildMeta} = useSiteData();
  if (status.state === 'checking' || status.state === 'synchronized') return null;
  const tone = status.state === 'updated' ? 'text-amber-300' : 'text-slate-400';
  return (
    <div className={`border-b border-white/10 bg-black/20 px-4 py-2 text-center text-xs ${tone}`} role="status">
      {status.message}
      {status.state === 'updated' && `（构建版本 ${buildMeta.contentHash.slice(0, 8)}）`}
    </div>
  );
}
