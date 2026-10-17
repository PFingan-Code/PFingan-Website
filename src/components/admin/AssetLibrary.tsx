import type {DataManifest, SiteData} from '@/src/types/site-data';
import {Download, FileText, Search, Trash2} from 'lucide-react';
import {useMemo, useState, type ReactNode} from 'react';

export default function AssetLibrary({data, manifest, assetPaths, assetUrls, assetBase, onDelete}: {data: SiteData; manifest: DataManifest; assetPaths: string[]; assetUrls: Record<string, string>; assetBase: string; onDelete: (path: string) => void}) {
  const [query, setQuery] = useState('');
  const referenced = useMemo(() => {
    const paths = new Set<string>();
    const scan = (value: unknown) => {
      if (typeof value === 'string' && value.startsWith('assets/')) paths.add(value);
      else if (Array.isArray(value)) value.forEach(scan);
      else if (value && typeof value === 'object') Object.values(value).forEach(scan);
    };
    scan(data);
    return paths;
  }, [data]);
  const entries = useMemo(() => assetPaths.filter((path) => path.toLowerCase().includes(query.trim().toLowerCase())), [assetPaths, query]);
  const metadata = new Map((manifest.assets ?? []).map((asset) => [asset.path, asset]));
  return <Panel title="资源库" description="资源路径由系统生成。仍被站点内容引用的资源不能删除；删除会和 JSON 修改一起进入当前草稿。"><label className="relative block"><Search size={15} className="pointer-events-none absolute left-3 top-3 text-slate-500" /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="搜索资源路径" className="w-full rounded-lg border border-border-dark bg-black/20 py-2.5 pl-9 pr-3 text-sm text-white outline-none focus:border-brand-primary" /></label>{entries.length === 0 ? <p className="mt-4 rounded-lg border border-dashed border-border-dark px-4 py-8 text-center text-sm text-slate-500">没有匹配的资源</p> : <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">{entries.map((path) => { const item = metadata.get(path); const src = assetUrls[path] ?? `${assetBase}${path}`; const image = item?.contentType.startsWith('image/') || /\.(jpg|jpeg|png|webp)$/i.test(path); const isReferenced = referenced.has(path); return <article key={path} className="overflow-hidden rounded-xl border border-border-dark bg-black/10"><div className="flex aspect-[4/2] items-center justify-center bg-neutral-950">{image ? <img src={src} alt={path} className="h-full w-full object-contain" /> : <FileText size={28} className="text-slate-600" />}</div><div className="space-y-2 p-3"><p className="break-all font-mono text-[11px] text-slate-300">{path}</p><p className="text-[11px] text-slate-500">{item ? `${item.contentType} · ${formatBytes(item.bytes)}` : '旧 manifest 未记录元数据'}</p><div className="flex items-center justify-between gap-2"><a href={src} target="_blank" rel="noopener noreferrer" title="打开资源" aria-label="打开资源" className="rounded-md p-1.5 text-slate-400 hover:bg-white/10 hover:text-white"><Download size={15} /></a><button type="button" disabled={isReferenced} title={isReferenced ? '资源仍被引用' : '删除资源'} aria-label={isReferenced ? '资源仍被引用' : '删除资源'} onClick={() => {if (!isReferenced && window.confirm(`确认删除资源 ${path}？`)) onDelete(path);}} className="rounded-md p-1.5 text-rose-300 disabled:cursor-not-allowed disabled:opacity-30"><Trash2 size={15} /></button></div></div></article>; })}</div>}</Panel>;
}

function Panel({title, description, children}: {title: string; description?: string; children: ReactNode}) {
  return <section className="rounded-2xl border border-border-dark bg-white/[0.025] p-5 shadow-xl shadow-black/10"><div className="mb-5 border-b border-border-dark pb-4"><h2 className="text-lg font-semibold text-white">{title}</h2>{description && <p className="mt-1 text-xs leading-relaxed text-slate-500">{description}</p>}</div>{children}</section>;
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KiB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MiB`;
}
