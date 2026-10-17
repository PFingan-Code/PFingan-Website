import {stableAssetPath, prepareAsset, type PreparedAsset} from '@/src/lib/assets';
import type {Moment, SiteData} from '@/src/types/site-data';
import {ImagePlus, Trash2, Upload} from 'lucide-react';
import {useRef, useState} from 'react';

export default function GalleryEditor({data, updateData, assetUrls, assetPaths: _assetPaths, assetBase, onAssetPrepared, onAssetDelete}: {data: SiteData; updateData: (updater: (data: SiteData) => void) => void; assetUrls: Record<string, string>; assetPaths: string[]; assetBase: string; onAssetPrepared: (asset: PreparedAsset) => void; onAssetDelete: (path: string) => void}) {
  const picker = useRef<HTMLInputElement>(null);
  const [category, setCategory] = useState('all');
  const [error, setError] = useState('');
  const visible = data.moments.items.filter((moment) => category === 'all' || moment.categoryId === category);

  const addFiles = async (files: FileList | File[]) => {
    setError('');
    try {
      for (const file of Array.from(files)) {
        const id = `moment-${crypto.randomUUID()}`;
        const defaultCategory = data.moments.categories[0]?.id;
        if (!defaultCategory) throw new Error('请先创建图库分类');
        const path = stableAssetPath('moments', id, 'original', file.type.toLowerCase());
        const asset = await prepareAsset(file, path);
        const nextMoment: Moment = {id, type: 'image', url: path, previewUrl: path, description: file.name.replace(/\.[^.]+$/, ''), categoryId: defaultCategory, date: new Date().toISOString().slice(0, 10)};
        onAssetPrepared(asset);
        updateData((draft) => {draft.moments.items.push(nextMoment);});
      }
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : '上传图片失败');
    }
  };

  const replaceImage = async (moment: Moment, file: File) => {
    try {
      const path = stableAssetPath('moments', moment.id, 'original', file.type.toLowerCase());
      const asset = await prepareAsset(file, path);
      onAssetPrepared(asset);
      updateData((draft) => {const target = draft.moments.items.find((item) => item.id === moment.id); if (target) {target.url = path; target.previewUrl = path; target.type = 'image';}});
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : '替换图片失败');
    }
  };

  return <div className="space-y-5"><section className="border-b border-border-dark pb-4"><div className="flex flex-wrap items-end justify-between gap-3"><label className="block space-y-1.5"><span className="text-xs text-slate-400">分类</span><select value={category} onChange={(event) => setCategory(event.target.value)} className="min-w-40 rounded-lg border border-border-dark bg-neutral-950 px-3 py-2 text-sm text-white"><option value="all">全部分类</option>{data.moments.categories.map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}</select></label><div className="flex gap-2"><button type="button" onClick={() => updateData((draft) => {draft.moments.categories.push({id: `category-${crypto.randomUUID()}`, label: '新分类', sortOrder: draft.moments.categories.length + 1});})} className="rounded-lg border border-border-dark px-3 py-2 text-xs text-slate-300">新增分类</button><button type="button" onClick={() => picker.current?.click()} className="inline-flex items-center gap-2 rounded-lg bg-brand-primary px-3 py-2 text-xs font-semibold text-white"><Upload size={14} />上传图片</button><input ref={picker} type="file" accept="image/jpeg,image/png,image/webp" multiple className="hidden" onChange={(event) => {if (event.target.files) void addFiles(event.target.files); event.target.value = '';}} /></div></div>{data.moments.categories.length > 0 && <div className="mt-4 flex flex-wrap gap-2">{data.moments.categories.map((item, index) => <div key={item.id} className="flex items-center gap-1"><input aria-label="分类名称" value={item.label} onChange={(event) => updateData((draft) => {draft.moments.categories[index].label = event.target.value;})} className="w-28 rounded-md border border-border-dark bg-black/20 px-2 py-1.5 text-xs text-white" /><button type="button" title="删除分类" onClick={() => {if (data.moments.items.some((moment) => moment.categoryId === item.id)) {setError('分类下仍有图片，请先移动或删除图片'); return;} updateData((draft) => {draft.moments.categories.splice(index, 1);});}} className="p-1 text-slate-500 hover:text-rose-300"><Trash2 size={13} /></button></div>)}</div>}</section>{error && <p role="alert" className="text-sm text-rose-200">{error}</p>}{visible.length === 0 ? <div className="border border-dashed border-border-dark py-14 text-center text-sm text-slate-500"><ImagePlus className="mx-auto mb-2" />图库暂无图片</div> : <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-4">{visible.map((moment) => <GalleryItem key={moment.id} moment={moment} categories={data.moments.categories} imageUrl={assetUrls[moment.url] ?? assetUrls[moment.previewUrl] ?? (moment.previewUrl.startsWith('assets/') ? `${assetBase}${moment.previewUrl}` : moment.previewUrl)} onReplace={(file) => void replaceImage(moment, file)} onUpdate={(patch) => updateData((draft) => {Object.assign(draft.moments.items.find((item) => item.id === moment.id)!, patch);})} onDelete={() => {if (moment.url.startsWith('assets/')) onAssetDelete(moment.url); if (moment.previewUrl.startsWith('assets/') && moment.previewUrl !== moment.url) onAssetDelete(moment.previewUrl); updateData((draft) => {draft.moments.items = draft.moments.items.filter((item) => item.id !== moment.id); draft.home.featuredMomentIds = draft.home.featuredMomentIds.filter((id) => id !== moment.id);});}} />)}</div>}</div>;
}

function GalleryItem({moment, categories, imageUrl, onReplace, onUpdate, onDelete}: {key?: string; moment: Moment; categories: SiteData['moments']['categories']; imageUrl: string; onReplace: (file: File) => void; onUpdate: (patch: Partial<Moment>) => void; onDelete: () => void}) {
  const input = useRef<HTMLInputElement>(null);
  return <article className="overflow-hidden border border-border-dark bg-white/[0.025]"><div className="relative aspect-[4/3] bg-black/30"><img src={imageUrl} alt={moment.description} className="h-full w-full object-cover" /><button type="button" title="替换图片" aria-label="替换图片" onClick={() => input.current?.click()} className="absolute right-2 top-2 rounded-md bg-black/70 p-2 text-white"><Upload size={14} /></button><input ref={input} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={(event) => {const file = event.target.files?.[0]; if (file) onReplace(file); event.target.value = '';}} /></div><div className="space-y-2 p-3"><input value={moment.description} onChange={(event) => onUpdate({description: event.target.value})} aria-label="图片描述" className="w-full border-b border-border-dark bg-transparent py-1 text-sm text-white outline-none focus:border-brand-primary" /><div className="flex items-center gap-2"><select value={moment.categoryId} onChange={(event) => onUpdate({categoryId: event.target.value})} className="min-w-0 flex-1 rounded-md border border-border-dark bg-neutral-950 px-2 py-1.5 text-xs text-white">{categories.map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}</select><input type="date" value={moment.date ?? ''} onChange={(event) => onUpdate({date: event.target.value})} aria-label="日期" className="w-32 rounded-md border border-border-dark bg-neutral-950 px-2 py-1.5 text-xs text-white" /><button type="button" title="删除图片" aria-label="删除图片" onClick={onDelete} className="rounded-md p-1.5 text-rose-300 hover:bg-rose-300/10"><Trash2 size={15} /></button></div></div></article>;
}
