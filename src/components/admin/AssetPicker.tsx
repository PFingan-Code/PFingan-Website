import {prepareAsset, stableAssetPath, type PreparedAsset} from '@/src/lib/assets';
import type {DataManifest} from '@/src/types/site-data';
import {Upload} from 'lucide-react';
import {useRef, useState} from 'react';

export type AssetScope = 'site' | 'resources' | 'servers' | 'moments' | 'team' | 'donations';

export default function AssetPicker({label, value, manifest, assetPaths, scope, entityId, assetUrls, assetBase, onChange, onPrepared}: {label: string; value: string; manifest: DataManifest; assetPaths?: string[]; scope: AssetScope; entityId: string; assetUrls?: Record<string, string>; assetBase: string; onChange: (path: string) => void; onPrepared: (asset: PreparedAsset) => void}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState('');
  const options = assetPaths ?? manifest.assets?.map((asset) => asset.path) ?? [];
  const hasCurrent = value && !options.includes(value);

  const upload = async (file: File) => {
    setError('');
    try {
      const path = stableAssetPath(scope, entityId || 'global', crypto.randomUUID(), file.type.toLowerCase());
      const asset = await prepareAsset(file, path);
      onPrepared(asset);
      onChange(path);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : '上传资源失败');
    }
  };

  return <div className="block space-y-2"><span className="text-xs font-medium text-slate-400">{label}</span><div className="flex gap-2"><select value={value} onChange={(event) => onChange(event.target.value)} className="min-w-0 flex-1 rounded-lg border border-border-dark bg-neutral-950 px-3 py-2.5 text-sm text-white outline-none focus:border-brand-primary"><option value="">未选择</option>{hasCurrent && <option value={value}>当前引用：{value}</option>}{options.map((path) => <option key={path} value={path}>{path}</option>)}</select><button type="button" title="上传资源" aria-label="上传资源" onClick={() => inputRef.current?.click()} className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-brand-primary/40 px-3 text-xs text-brand-primary hover:bg-brand-primary/10"><Upload size={14} />上传</button><input ref={inputRef} type="file" accept="image/jpeg,image/png,image/webp,application/pdf,application/zip" className="hidden" onChange={(event) => { const file = event.target.files?.[0]; if (file) void upload(file); event.target.value = ''; }} /></div>{value && (assetUrls?.[value] || value.match(/\.(jpg|jpeg|png|webp)$/i)) && <img src={assetUrls?.[value] ?? (value.startsWith('assets/') ? `${assetBase}${value}` : value)} alt="资源预览" className="mt-2 h-20 w-32 rounded-lg border border-border-dark object-cover" />}{error && <p role="alert" className="text-xs text-rose-200">{error}</p>}</div>;
}
