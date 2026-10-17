import {setSiteDataPreview, useSiteData} from '@/src/data/SiteDataProvider';
import AboutPage from '@/src/pages/AboutPage';
import DonatePage from '@/src/pages/DonatePage';
import HomePage from '@/src/pages/HomePage';
import MomentPage from '@/src/pages/MomentPage';
import ServerPage from '@/src/pages/ServerPage';
import PreviewPanel from '@/src/components/admin/PreviewPanel';
import ColorPicker from '@/src/components/admin/ColorPicker';
import IconPicker from '@/src/components/admin/IconPicker';
import AssetPicker, {type AssetScope} from '@/src/components/admin/AssetPicker';
import GalleryEditor from '@/src/components/admin/GalleryEditor';
import AssetLibrary from '@/src/components/admin/AssetLibrary';
import {dataFilesToSiteData, commitDataFiles, serializeDataFile, type AssetChange} from '@/src/lib/github-editor';
import type {PreparedAsset} from '@/src/lib/assets';
import {GitHubApiError, GitHubClient, type GitHubWorkflowRun} from '@/src/lib/github-api';
import type {
  ActionLink,
  Announcement,
  Attachment,
  ContactItem,
  DataFileName,
  DataManifest,
  Donation,
  HomeFeature,
  HomeHighlight,
  Moment,
  MomentCategory,
  NavigationItem,
  ResourceItem,
  ServerArchive,
  SiteConfig,
  SiteCopy,
  SiteData,
  TeamMember,
} from '@/src/types/site-data';
import {DATA_FILES} from '@/src/types/site-data';
import {
  AlertTriangle,
  ArrowDown,
  ArrowUp,
  Check,
  ChevronDown,
  ChevronRight,
  CircleHelp,
  FileJson,
  GitBranch,
  Image,
  KeyRound,
  LayoutDashboard,
  List,
  LoaderCircle,
  Menu,
  MessageSquare,
  Pencil,
  Play,
  Plus,
  RefreshCw,
  Save,
  Server,
  Settings2,
  ShieldCheck,
  Sparkles,
  Trash2,
  Users,
  WalletCards,
  X,
} from 'lucide-react';
import {useEffect, useMemo, useRef, useState, type ReactNode} from 'react';

const TOKEN_KEY = 'site-admin-github-token';
const BUILD_WORKFLOW = 'deploy.yml';
type DataFiles = Record<DataFileName, unknown>;
type ModuleId = 'overview' | 'site' | 'home' | 'navigation' | 'servers' | 'resources' | 'members' | 'moments' | 'donations' | 'copy' | 'advanced';

type SiteFile = {
  schemaVersion: number;
  site: SiteConfig;
  navigation: NavigationItem[];
  contact: ContactItem[];
  home: SiteData['home'];
  announcements: Announcement[];
};

type ItemFile<T> = {items: T[]};

const MODULES: Array<{id: ModuleId; label: string; description: string; icon: typeof LayoutDashboard}> = [
  {id: 'overview', label: '概览', description: '查看内容状态与最近保存信息', icon: LayoutDashboard},
  {id: 'site', label: '站点设置', description: '品牌、首页 Hero、页脚和外链', icon: Settings2},
  {id: 'home', label: '首页内容', description: '亮点、功能卡片和精选内容', icon: Sparkles},
  {id: 'navigation', label: '导航与联系', description: '导航菜单、联系方式和公告', icon: Menu},
  {id: 'servers', label: '服务器', description: '服务器档案、规则与附件', icon: Server},
  {id: 'resources', label: '资源', description: '资源卡片与下载附件', icon: FileJson},
  {id: 'members', label: '成员', description: '团队、社区成员和头像服务', icon: Users},
  {id: 'moments', label: '瞬间', description: '分类、图片和视频内容', icon: Image},
  {id: 'donations', label: '赞助', description: '付款方式与赞助记录', icon: WalletCards},
  {id: 'copy', label: '页面文案', description: '页面标题、说明和操作提示', icon: MessageSquare},
  {id: 'advanced', label: '高级 JSON', description: '直接编辑原始数据文件', icon: FileJson},
];

function getStoredToken(): string {
  try {
    return sessionStorage.getItem(TOKEN_KEY) ?? '';
  } catch {
    return '';
  }
}

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function friendlyError(error: unknown): string {
  if (error instanceof GitHubApiError) return error.message;
  return error instanceof Error ? error.message : '操作失败，请稍后重试';
}

function emptyAttachment(): Attachment {
  return {name: '', url: ''};
}

function emptyServer(): ServerArchive {
  return {
    id: `server-${Date.now()}`,
    title: '新服务器记录',
    period: {start: new Date().toISOString().slice(0, 10)},
    tags: [],
    version: '',
    status: 'unknown',
    rules: [],
    mods: [],
    attachments: [],
    description: '',
  };
}

function emptyResource(): ResourceItem {
  return {id: `resource-${Date.now()}`, title: '新资源', tags: [], description: '', attachments: []};
}

function emptyMomentCategory(): MomentCategory {
  return {id: `category-${Date.now()}`, label: '新分类', sortOrder: 1};
}

function emptyMoment(): Moment {
  return {id: `moment-${Date.now()}`, type: 'image', url: '', previewUrl: '', description: '', categoryId: '', date: ''};
}

function emptyDonation(): Donation {
  return {id: `donation-${Date.now()}`, date: new Date().toISOString().slice(0, 10), channel: '', orderId: '', amount: 0, note: '', donor: ''};
}

function emptyFeature(): HomeFeature {
  return {id: `feature-${Date.now()}`, title: '新功能', tip: '点击查看', tag: '功能', description: '', target: {type: 'route', value: '/'}, enabled: true};
}

function emptyHighlight(): HomeHighlight {
  return {id: `highlight-${Date.now()}`, icon: 'heart', color: 'brand', title: '新亮点', description: ''};
}

function emptyNavigation(): NavigationItem {
  return {id: `nav-${Date.now()}`, label: '新导航', route: '/', enabled: true};
}

function emptyContact(): ContactItem {
  return {id: `contact-${Date.now()}`, label: '新联系方式', type: 'text', value: ''};
}

function emptyAnnouncement(): Announcement {
  return {id: `announcement-${Date.now()}`, title: '新公告', content: '', date: new Date().toISOString().slice(0, 10), pinned: false};
}

function emptyTeamMember(): TeamMember {
  return {id: `member-${Date.now()}`, name: '新成员', useDefaultSkin: true, role: '', description: ''};
}

function filesFromSiteData(data: SiteData): DataFiles {
  return Object.fromEntries(DATA_FILES.map((file) => [file, serializeDataFile(file, data)])) as DataFiles;
}

function manifestAssetUrls(manifest: DataManifest, assetBase: string): Record<string, string> {
  return Object.fromEntries((manifest.assets ?? []).map((asset) => [asset.path, `${assetBase}${asset.path}`]));
}

function Input({label, value, onChange, type = 'text', placeholder, required = false}: {label: string; value: string | number; onChange: (value: string) => void; type?: string; placeholder?: string; required?: boolean}) {
  return <label className="block space-y-2"><span className="text-xs font-medium text-slate-400">{label}{required && <span className="text-rose-300"> *</span>}</span><input type={type} value={value} placeholder={placeholder} onChange={(event) => onChange(event.target.value)} className="w-full rounded-lg border border-border-dark bg-black/20 px-3 py-2.5 text-sm text-white outline-none transition focus:border-brand-primary" /></label>;
}

function TextArea({label, value, onChange, rows = 4, placeholder}: {key?: string; label: string; value: string; onChange: (value: string) => void; rows?: number; placeholder?: string}) {
  return <label className="block space-y-2"><span className="text-xs font-medium text-slate-400">{label}</span><textarea value={value} rows={rows} placeholder={placeholder} onChange={(event) => onChange(event.target.value)} className="w-full resize-y rounded-lg border border-border-dark bg-black/20 px-3 py-2.5 text-sm leading-relaxed text-white outline-none transition focus:border-brand-primary" /></label>;
}

function Select({label, value, options, onChange}: {label: string; value: string; options: Array<{label: string; value: string}>; onChange: (value: string) => void}) {
  return <label className="block space-y-2"><span className="text-xs font-medium text-slate-400">{label}</span><select value={value} onChange={(event) => onChange(event.target.value)} className="w-full rounded-lg border border-border-dark bg-neutral-950 px-3 py-2.5 text-sm text-white outline-none focus:border-brand-primary">{options.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select></label>;
}

function Toggle({label, checked, onChange}: {label: string; checked: boolean; onChange: (value: boolean) => void}) {
  return <label className="flex cursor-pointer items-center justify-between gap-4 rounded-lg border border-border-dark bg-black/10 px-3 py-2.5"><span className="text-sm text-slate-300">{label}</span><input type="checkbox" checked={checked} onChange={(event) => onChange(event.target.checked)} className="h-4 w-4 accent-sky-400" /></label>;
}

function Panel({title, description, children, actions}: {key?: string; title: string; description?: string; children: ReactNode; actions?: ReactNode}) {
  return <section className="rounded-2xl border border-border-dark bg-white/[0.025] p-5 shadow-xl shadow-black/10"><div className="mb-5 flex flex-wrap items-start justify-between gap-3 border-b border-border-dark pb-4"><div><h2 className="text-lg font-semibold text-white">{title}</h2>{description && <p className="mt-1 text-xs leading-relaxed text-slate-500">{description}</p>}</div>{actions}</div>{children}</section>;
}

function ArrayToolbar({label, count, onAdd}: {label: string; count: number; onAdd: () => void}) {
  return <div className="mb-4 flex items-center justify-between gap-3"><div><h3 className="text-sm font-semibold text-white">{label}</h3><p className="text-xs text-slate-500">{count} 项</p></div><button type="button" onClick={onAdd} className="inline-flex items-center gap-1.5 rounded-lg bg-brand-primary px-3 py-2 text-xs font-semibold text-white"><Plus size={14} />新增</button></div>;
}

function ItemActions({index, length, onMove, onRemove}: {index: number; length: number; onMove: (direction: -1 | 1) => void; onRemove: () => void}) {
  return <div className="flex items-center gap-1"><button type="button" title="上移" disabled={index === 0} onClick={() => onMove(-1)} className="rounded-md p-1.5 text-slate-500 hover:bg-white/10 hover:text-white disabled:opacity-30"><ArrowUp size={14} /></button><button type="button" title="下移" disabled={index === length - 1} onClick={() => onMove(1)} className="rounded-md p-1.5 text-slate-500 hover:bg-white/10 hover:text-white disabled:opacity-30"><ArrowDown size={14} /></button><button type="button" title="删除" onClick={onRemove} className="rounded-md p-1.5 text-rose-300/70 hover:bg-rose-400/10 hover:text-rose-200"><Trash2 size={14} /></button></div>;
}

function ListEditor({label, values, onChange, placeholder = '输入内容'}: {label: string; values: string[]; onChange: (values: string[]) => void; placeholder?: string}) {
  return <div className="space-y-2"><div className="flex items-center justify-between"><span className="text-xs font-medium text-slate-400">{label}</span><button type="button" onClick={() => onChange([...values, ''])} className="text-xs text-brand-primary hover:underline">添加</button></div>{values.length === 0 && <p className="rounded-lg border border-dashed border-border-dark px-3 py-3 text-xs text-slate-600">暂无内容</p>}{values.map((value, index) => <div key={`${index}-${value}`} className="flex gap-2"><input value={value} placeholder={placeholder} onChange={(event) => onChange(values.map((item, itemIndex) => itemIndex === index ? event.target.value : item))} className="min-w-0 flex-1 rounded-lg border border-border-dark bg-black/20 px-3 py-2 text-sm text-white outline-none focus:border-brand-primary" /><button type="button" title="删除" onClick={() => onChange(values.filter((_, itemIndex) => itemIndex !== index))} className="rounded-lg border border-border-dark px-2 text-slate-500 hover:text-rose-200"><X size={14} /></button></div>)}</div>;
}

function AttachmentEditor({attachments, onChange, manifest, assetPaths, scope, entityId, assetUrls, assetBase, onAssetPrepared}: {attachments: Attachment[]; onChange: (value: Attachment[]) => void; manifest: DataManifest; assetPaths: string[]; scope: AssetScope; entityId: string; assetUrls: Record<string, string>; assetBase: string; onAssetPrepared: (asset: PreparedAsset) => void}) {
  const update = (index: number, patch: Partial<Attachment>) => onChange(attachments.map((item, itemIndex) => itemIndex === index ? {...item, ...patch} : item));
  return <div className="space-y-3"><div className="flex items-center justify-between"><span className="text-xs font-medium text-slate-400">附件</span><button type="button" onClick={() => onChange([...attachments, emptyAttachment()])} className="text-xs text-brand-primary hover:underline">添加附件</button></div>{attachments.map((attachment, index) => <div key={`${index}-${attachment.name}`} className="rounded-lg border border-border-dark bg-black/10 p-3"><div className="mb-3 flex items-center justify-between"><span className="text-xs text-slate-500">附件 {index + 1}</span><button type="button" onClick={() => onChange(attachments.filter((_, itemIndex) => itemIndex !== index))} className="text-xs text-rose-300 hover:text-rose-200">删除</button></div><div className="grid gap-3 md:grid-cols-2"><Input label="名称" value={attachment.name} onChange={(value) => update(index, {name: value})} required /><AssetPicker label="文件资源" value={attachment.url} manifest={manifest}  scope={scope} entityId={`${entityId}-${index}`} assetUrls={assetUrls} assetPaths={assetPaths} assetBase={assetBase} onPrepared={onAssetPrepared} onChange={(value) => update(index, {url: value})} /><Input label="提取码" value={attachment.code ?? ''} onChange={(value) => update(index, {code: value})} /><AssetPicker label="附件图标（可选）" value={attachment.icon ?? ''} manifest={manifest}  scope={scope} entityId={`${entityId}-${index}-icon`} assetUrls={assetUrls} assetPaths={assetPaths} assetBase={assetBase} onPrepared={onAssetPrepared} onChange={(value) => update(index, {icon: value || undefined})} /></div></div>)}</div>;
}

function SectionHeader({title, description}: {title: string; description: string}) {
  return <div className="mb-6"><p className="text-xs font-bold uppercase tracking-[0.18em] text-brand-primary">Content Studio</p><h1 className="mt-2 text-3xl font-bold text-white">{title}</h1><p className="mt-2 max-w-3xl text-sm leading-relaxed text-slate-400">{description}</p></div>;
}

export default function AdminPage() {
  const {data: runtimeData} = useSiteData();
  const repository = runtimeData.site.repository;
  const assetBase = `https://raw.githubusercontent.com/${encodeURIComponent(repository.owner)}/${encodeURIComponent(repository.name)}/${encodeURIComponent(repository.dataBranch)}/data/`;
  const [token, setToken] = useState(getStoredToken);
  const [connected, setConnected] = useState(false);
  const [files, setFiles] = useState<DataFiles | null>(null);
  const [savedFiles, setSavedFiles] = useState<DataFiles | null>(null);
  const [manifest, setManifest] = useState<DataManifest | null>(null);
  const [expectedHeadSha, setExpectedHeadSha] = useState('');
  const [module, setModule] = useState<ModuleId>('overview');
  const [advancedFile, setAdvancedFile] = useState<DataFileName>('site.json');
  const [rawText, setRawText] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [run, setRun] = useState<GitHubWorkflowRun>();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewPage, setPreviewPage] = useState<'home' | 'moment' | 'server' | 'about' | 'donate'>('home');
  const [assetChanges, setAssetChanges] = useState<AssetChange[]>([]);
  const [assetPaths, setAssetPaths] = useState<string[]>([]);
  const [assetUrls, setAssetUrls] = useState<Record<string, string>>({});
  const assetUrlsRef = useRef<Record<string, string>>({});
  assetUrlsRef.current = assetUrls;

  const client = useMemo(() => token ? new GitHubClient({owner: repository.owner, repo: repository.name, token}) : null, [repository.name, repository.owner, token]);
  const advancedDirty = Boolean(module === 'advanced' && files && rawText !== JSON.stringify(files[advancedFile], null, 2));
  const dirty = Boolean((files && savedFiles && JSON.stringify(files) !== JSON.stringify(savedFiles)) || advancedDirty || assetChanges.length > 0);
  const parsedData = useMemo(() => {
    if (!files) return undefined;
    try {
      return dataFilesToSiteData(files);
    } catch {
      return undefined;
    }
  }, [files]);
  const siteFile = files?.['site.json'] as SiteFile | undefined;
  const draftError = files && !parsedData ? '当前草稿存在校验错误，请在高级 JSON 中修正后再继续编辑。' : '';

  useEffect(() => {
    if (files) setRawText(JSON.stringify(files[advancedFile], null, 2));
  }, [advancedFile, files]);

  useEffect(() => () => setSiteDataPreview(null), []);
  useEffect(() => () => {
    Object.values(assetUrlsRef.current).forEach((url: string) => {
      if (url.startsWith('blob:')) URL.revokeObjectURL(url);
    });
  }, []);

  const selectModule = (nextModule: ModuleId) => {
    if (module === 'advanced' && advancedDirty && !window.confirm('高级 JSON 有未保存修改，切换模块会放弃这些文本修改。是否继续？')) return;
    setModule(nextModule);
    setMobileNavOpen(false);
  };

  const updateData = (updater: (data: SiteData) => void) => {
    setFiles((current) => {
      if (!current) return current;
      try {
        const next = clone(dataFilesToSiteData(current));
        updater(next);
        return filesFromSiteData(next);
      } catch (caught) {
        setError(friendlyError(caught));
        return current;
      }
    });
    setMessage('');
  };

  const updateSite = (updater: (site: SiteConfig) => void) => updateData((data) => updater(data.site));

  const loadFiles = async (activeClient: GitHubClient = client!) => {
    setBusy(true);
    setError('');
    try {
      const reference = await activeClient.getReference(repository.dataBranch);
      const loaded = Object.fromEntries(await Promise.all(DATA_FILES.map(async (file) => {
        const response = await activeClient.getFile(`data/${file}`, reference.sha);
        return [file, JSON.parse(response.content)];
      }))) as DataFiles;
      const manifestResponse = await activeClient.getFile('data/manifest.json', reference.sha);
      const loadedManifest = JSON.parse(manifestResponse.content) as DataManifest;
      const baseCommit = await activeClient.getCommit(reference.sha);
      const tree = await activeClient.getTree(baseCommit.treeSha);
      const loadedAssetPaths = tree
        .filter((entry) => entry.type === 'blob' && entry.path.startsWith('data/assets/'))
        .map((entry) => entry.path.replace(/^data\//, ''));
      dataFilesToSiteData(loaded);
      setFiles(loaded);
      setSavedFiles(clone(loaded));
      setManifest(loadedManifest);
      setAssetPaths(loadedManifest.assets?.map((asset) => asset.path) ?? loadedAssetPaths);
      releaseAssetDraft();
      setAssetUrls(manifestAssetUrls(loadedManifest, assetBase));
      setExpectedHeadSha(reference.sha);
      setConnected(true);
      setMessage('已读取 data 分支，所有模块均可编辑');
    } catch (caught) {
      setError(friendlyError(caught));
    } finally {
      setBusy(false);
    }
  };

  const connect = async () => {
    if (!client) return;
    setBusy(true);
    setError('');
    setMessage('');
    try {
      await client.verifyAccess();
      sessionStorage.setItem(TOKEN_KEY, token);
      setConnected(true);
      await loadFiles(client);
    } catch (caught) {
      setConnected(false);
      setError(friendlyError(caught));
      setBusy(false);
    }
  };

  const save = async (andRebuild: boolean) => {
    if (!client || !files || !manifest) return;
    setBusy(true);
    setError('');
    setMessage('');
    try {
      let nextFiles = files;
      if (module === 'advanced') {
        let parsed: unknown;
        try {
          parsed = JSON.parse(rawText);
        } catch {
          throw new Error('当前 JSON 格式无效，请先修正语法');
        }
        nextFiles = {...files, [advancedFile]: parsed};
      }
      dataFilesToSiteData(nextFiles);
      const result = await commitDataFiles({client, branch: repository.dataBranch, currentFiles: nextFiles, manifest, expectedHeadSha, assetChanges, message: 'data: 更新站点内容'});
      setFiles(nextFiles);
      setSavedFiles(clone(nextFiles));
      setManifest(result.manifest);
      setAssetPaths(result.manifest.assets?.map((asset) => asset.path) ?? assetPaths);
      setExpectedHeadSha(result.commitSha);
      releaseAssetDraft();
      setAssetUrls(manifestAssetUrls(result.manifest, assetBase));
      setMessage(`已保存 data 分支（${result.commitSha.slice(0, 12)}）`);
      if (andRebuild) await rebuild(client);
    } catch (caught) {
      setError(friendlyError(caught));
    } finally {
      setBusy(false);
    }
  };

  const rebuild = async (activeClient = client!) => {
    const requestedAt = new Date().toISOString();
    await activeClient.dispatchWorkflow(BUILD_WORKFLOW, 'main', {reason: '站内内容管理器触发重建'});
    setMessage('已触发 GitHub Actions 重建，正在等待任务出现');
    for (let attempt = 0; attempt < 6; attempt += 1) {
      await new Promise((resolve) => window.setTimeout(resolve, 1000));
      const latest = await activeClient.getLatestWorkflowRun(BUILD_WORKFLOW, 'main', requestedAt);
      if (latest) {
        setRun(latest);
        setMessage('已触发 GitHub Actions 重建');
        return;
      }
    }
    setMessage('已触发 GitHub Actions 重建，任务状态暂未返回');
  };

  const addPreparedAsset = (asset: PreparedAsset) => {
    setAssetChanges((current) => [...current.filter((change) => (change.kind === 'upsert' ? change.asset.path : change.path) !== asset.path), {kind: 'upsert', asset}]);
    const previousUrl = assetUrlsRef.current[asset.path];
    if (previousUrl?.startsWith('blob:')) URL.revokeObjectURL(previousUrl);
    setAssetUrls((current) => ({...current, [asset.path]: URL.createObjectURL(new Blob([asset.bytes], {type: asset.contentType}))}));
  };

  const queueAssetDelete = (path: string) => {
    if (assetChanges.some((change) => change.kind === 'upsert' && change.asset.path === path)) {
      const url = assetUrlsRef.current[path];
      if (url?.startsWith('blob:')) URL.revokeObjectURL(url);
      setAssetUrls((current) => {const next = {...current}; delete next[path]; return next;});
      setAssetChanges((current) => current.filter((change) => !(change.kind === 'upsert' && change.asset.path === path)));
      return;
    }
    setAssetChanges((current) => [...current.filter((change) => !(change.kind === 'delete' && change.path === path)), {kind: 'delete', path}]);
  };

  const releaseAssetDraft = () => {
    Object.values(assetUrls).forEach((url: string) => URL.revokeObjectURL(url));
    setAssetUrls((current) => {
      Object.values(current).forEach((url: string) => {
        if (url.startsWith('blob:')) URL.revokeObjectURL(url);
      });
      return {};
    });
    setAssetChanges([]);
  };

  const preview = () => {
    if (!parsedData || !files) return;
    setSiteDataPreview({data: parsedData, assets: assetUrls});
    setPreviewOpen(true);
  };

  const discardDraft = () => {
    if (!window.confirm('放弃所有未提交修改并重新读取 data 分支？')) return;
    setSiteDataPreview(null);
    setPreviewOpen(false);
    releaseAssetDraft();
    if (client) void loadFiles(client);
  };

  const disconnect = () => {
    setSiteDataPreview(null);
    setPreviewOpen(false);
    releaseAssetDraft();
    sessionStorage.removeItem(TOKEN_KEY);
    setToken('');
    setConnected(false);
    setFiles(null);
    setSavedFiles(null);
    setManifest(null);
    setAssetPaths([]);
    setMessage('已清除本次会话 Token');
  };

  if (!connected || !files || !manifest) {
    return <div className="mx-auto max-w-5xl px-6 py-14"><SectionHeader title="站点内容管理" description="这是一个面向站点维护者的内容工作台。连接后可以在表单中维护品牌、页面、服务器、成员和媒体信息，并以一次原子提交写入 data 分支。" /><ConnectionPanel token={token} setToken={setToken} connected={connected} busy={busy} repository={repository} error={error} message={message} onConnect={() => void connect()} onDisconnect={disconnect} /></div>;
  }

  const current = MODULES.find((item) => item.id === module) ?? MODULES[0];
  const ModuleIcon = current.icon;

  return <div className="mx-auto max-w-[1500px] px-4 py-8 sm:px-6"><div className="mb-6 flex flex-wrap items-end justify-between gap-4"><div><div className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.18em] text-brand-primary"><ShieldCheck size={16} />Content Studio</div><h1 className="text-3xl font-bold text-white">站点内容管理</h1><p className="mt-2 text-sm text-slate-400">{repository.owner}/{repository.name} · data 分支 · 修订 {manifest.contentRevision}</p></div><div className="flex items-center gap-2"><span className={`rounded-full px-3 py-1.5 text-xs ${dirty ? 'bg-amber-400/10 text-amber-200' : 'bg-emerald-400/10 text-emerald-200'}`}>{dirty ? '有未保存修改' : '已同步'}</span><button type="button" onClick={disconnect} className="rounded-lg border border-border-dark px-3 py-2 text-xs text-slate-400 hover:text-white">清除会话</button></div></div><div className="mb-4 lg:hidden"><button type="button" onClick={() => setMobileNavOpen((value) => !value)} className="flex w-full items-center justify-between rounded-xl border border-border-dark bg-white/[0.03] px-4 py-3 text-sm text-white"><span className="flex items-center gap-2"><ModuleIcon size={16} />{current.label}</span><ChevronDown size={16} /></button></div><div className="grid gap-6 lg:grid-cols-[240px_minmax(0,1fr)]"><aside className={`${mobileNavOpen ? 'block' : 'hidden'} lg:block`}><nav className="sticky top-24 space-y-1 rounded-2xl border border-border-dark bg-white/[0.025] p-2">{MODULES.map((item) => { const Icon = item.icon; return <button key={item.id} type="button" onClick={() => selectModule(item.id)} className={`flex w-full items-start gap-3 rounded-xl px-3 py-3 text-left transition ${module === item.id ? 'bg-brand-primary/10 text-brand-primary' : 'text-slate-400 hover:bg-white/5 hover:text-white'}`}><Icon size={17} className="mt-0.5 shrink-0" /><span><span className="block text-sm font-medium">{item.label}</span><span className="mt-0.5 block text-[11px] leading-snug text-slate-600">{item.description}</span></span></button>; })}</nav></aside><main className="min-w-0 space-y-6">{previewOpen && <PreviewPanel page={previewPage} setPage={setPreviewPage} onClose={() => {setSiteDataPreview(null); setPreviewOpen(false);}} />}{error && <div role="alert" className="flex items-start gap-2 rounded-xl border border-rose-400/30 bg-rose-400/10 px-4 py-3 text-sm text-rose-100"><AlertTriangle size={17} className="mt-0.5 shrink-0" />{error}</div>}{message && <div role="status" className="flex items-start gap-2 rounded-xl border border-emerald-400/30 bg-emerald-400/10 px-4 py-3 text-sm text-emerald-100"><Check size={17} className="mt-0.5 shrink-0" />{message}</div>}{draftError && <div className="rounded-xl border border-amber-400/30 bg-amber-400/10 px-4 py-3 text-sm text-amber-100">{draftError}</div>}<SectionHeader title={current.label} description={current.description} />{module === 'overview' && <Overview data={parsedData!} manifest={manifest} dirty={dirty} onRefresh={() => void loadFiles()} busy={busy} />}{module === 'site' && <SiteEditor data={parsedData!} updateSite={updateSite} manifest={manifest} assetUrls={assetUrls} assetPaths={assetPaths} assetBase={assetBase} onAssetPrepared={addPreparedAsset} />}{module === 'home' && <HomeEditor data={parsedData!} updateData={updateData} />}{module === 'navigation' && <NavigationEditor data={parsedData!} updateData={updateData} manifest={manifest} assetUrls={assetUrls} assetPaths={assetPaths} assetBase={assetBase} onAssetPrepared={addPreparedAsset} />}{module === 'servers' && <ServersEditor data={parsedData!} updateData={updateData} manifest={manifest} assetUrls={assetUrls} assetPaths={assetPaths} assetBase={assetBase} onAssetPrepared={addPreparedAsset} />}{module === 'resources' && <><ResourcesEditor data={parsedData!} updateData={updateData} manifest={manifest} assetUrls={assetUrls} assetPaths={assetPaths} assetBase={assetBase} onAssetPrepared={addPreparedAsset} /><AssetLibrary data={parsedData!} manifest={manifest} assetUrls={assetUrls} assetPaths={assetPaths} assetBase={assetBase} onDelete={queueAssetDelete} /></>}{module === 'members' && <MembersEditor data={parsedData!} updateData={updateData} manifest={manifest} assetUrls={assetUrls} assetPaths={assetPaths} assetBase={assetBase} onAssetPrepared={addPreparedAsset} />}{module === 'moments' && <GalleryEditor data={parsedData!} updateData={updateData} assetUrls={assetUrls} assetPaths={assetPaths} assetBase={assetBase} onAssetPrepared={addPreparedAsset} onAssetDelete={queueAssetDelete} />}{module === 'donations' && <DonationsEditor data={parsedData!} updateData={updateData} manifest={manifest} assetUrls={assetUrls} assetPaths={assetPaths} assetBase={assetBase} onAssetPrepared={addPreparedAsset} />}{module === 'copy' && <CopyEditor data={parsedData!} updateSite={updateSite} />}{module === 'advanced' && <AdvancedEditor files={files} selected={advancedFile} rawText={rawText} setSelected={setAdvancedFile} setRawText={setRawText} />}{module !== 'overview' && <div className="sticky bottom-4 z-10 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-brand-primary/20 bg-neutral-950/95 p-3 shadow-2xl shadow-black/40 backdrop-blur"><span className="flex items-center gap-2 text-xs text-slate-400">{dirty ? <><Pencil size={14} className="text-amber-300" />修改尚未保存</> : <><Check size={14} className="text-emerald-300" />当前没有未保存修改</>}</span><div className="flex flex-wrap gap-2"><button type="button" disabled={busy || !dirty} onClick={preview} className="inline-flex items-center gap-2 rounded-lg border border-sky-400/50 px-4 py-2 text-sm font-semibold text-sky-200 disabled:cursor-not-allowed disabled:opacity-40"><Image size={15} />预览草稿</button><button type="button" disabled={busy || !dirty} onClick={discardDraft} className="inline-flex items-center gap-2 rounded-lg border border-border-dark px-4 py-2 text-sm text-slate-300 disabled:opacity-40"><X size={15} />放弃草稿</button><button type="button" disabled={busy || !dirty} onClick={() => void save(false)} className="inline-flex items-center gap-2 rounded-lg bg-brand-primary px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-40"><Save size={15} />提交 data</button><button type="button" disabled={busy || !dirty} onClick={() => void save(true)} className="inline-flex items-center gap-2 rounded-lg border border-brand-primary/50 px-4 py-2 text-sm font-semibold text-brand-primary disabled:cursor-not-allowed disabled:opacity-40"><Play size={15} />提交并重建</button><button type="button" disabled={busy} onClick={() => void rebuild()} className="inline-flex items-center gap-2 rounded-lg border border-border-dark px-4 py-2 text-sm text-slate-300 disabled:opacity-40"><RefreshCw size={15} />仅重建</button></div></div>}{run && <p className="text-xs text-slate-500">最近任务：<a href={run.html_url} target="_blank" rel="noopener noreferrer" className="text-brand-primary hover:underline">#{run.id}</a> · {run.status}{run.conclusion ? ` / ${run.conclusion}` : ''}</p>}</main></div></div>;
}

function ConnectionPanel({token, setToken, connected, busy, repository, error, message, onConnect, onDisconnect}: {token: string; setToken: (value: string) => void; connected: boolean; busy: boolean; repository: SiteConfig['repository']; error: string; message: string; onConnect: () => void; onDisconnect: () => void}) {
  return <div className="rounded-2xl border border-border-dark bg-white/[0.025] p-6 shadow-2xl shadow-black/20"><div className="mb-5 flex items-center gap-3"><KeyRound className="text-brand-primary" size={20} /><div><h2 className="font-semibold text-white">连接 GitHub 内容仓库</h2><p className="text-xs text-slate-500">{repository.owner}/{repository.name} · {repository.dataBranch}</p></div>{connected && <span className="ml-auto flex items-center gap-1 text-xs text-emerald-300"><Check size={14} />已连接</span>}</div><div className="flex flex-col gap-3 md:flex-row"><input type="password" value={token} onChange={(event) => setToken(event.target.value)} placeholder="fine-grained GitHub Token" autoComplete="off" className="min-w-0 flex-1 rounded-lg border border-border-dark bg-black/30 px-4 py-3 text-sm text-white outline-none focus:border-brand-primary" /><button type="button" disabled={!token || busy} onClick={onConnect} className="rounded-lg bg-brand-primary px-5 py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50">{busy ? '读取中…' : '连接并读取内容'}</button></div><div className="mt-4 flex items-start gap-2 rounded-lg bg-amber-400/5 p-3 text-xs leading-relaxed text-amber-200"><AlertTriangle size={16} className="mt-0.5 shrink-0" />Token 仅保存在当前浏览器会话。建议只授予此仓库的 Contents read/write 与 Actions read/write 权限，不要使用组织级高权限 Token。</div>{error && <p role="alert" className="mt-4 text-sm text-rose-200">{error}</p>}{message && <p role="status" className="mt-4 text-sm text-emerald-200">{message}</p>}{connected && <button type="button" onClick={onDisconnect} className="mt-4 text-xs text-slate-500 hover:text-white">清除会话 Token</button>}</div>;
}

function Overview({data, manifest, dirty, onRefresh, busy}: {data: SiteData; manifest: DataManifest; dirty: boolean; onRefresh: () => void; busy: boolean}) {
  const cards = [{label: '服务器', value: data.servers.length, icon: Server}, {label: '资源', value: data.resources.length, icon: FileJson}, {label: '团队成员', value: data.members.team.length, icon: Users}, {label: '瞬间', value: data.moments.items.length, icon: Image}, {label: '赞助记录', value: data.donations.items.length, icon: WalletCards}, {label: '公告', value: data.announcements.length, icon: MessageSquare}];
  return <><Panel title="内容状态" description="所有模块共用同一份 data 草稿，保存时会进行全量 schema 校验并生成一个原子提交。" actions={<button type="button" disabled={busy} onClick={onRefresh} className="inline-flex items-center gap-1.5 rounded-lg border border-border-dark px-3 py-2 text-xs text-slate-300 hover:text-white disabled:opacity-40"><RefreshCw size={14} />重新读取</button>}><div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">{cards.map(({label, value, icon: Icon}) => <div key={label} className="rounded-xl border border-border-dark bg-black/10 p-4"><div className="flex items-center justify-between"><span className="text-xs text-slate-500">{label}</span><Icon size={16} className="text-brand-primary" /></div><p className="mt-2 text-2xl font-bold text-white">{value}</p></div>)}</div></Panel><Panel title="版本信息" description="运行时页面会公开读取 data 分支；静态 HTML 需要重建后才会同步。"><div className="grid gap-3 text-sm sm:grid-cols-2"><InfoRow label="内容修订" value={String(manifest.contentRevision)} /><InfoRow label="更新于" value={manifest.updatedAt} /><InfoRow label="内容哈希" value={manifest.contentHash} mono /><InfoRow label="编辑状态" value={dirty ? '存在未保存修改' : '已与远端读取版本一致'} tone={dirty ? 'amber' : 'green'} /></div></Panel></>;
}

function InfoRow({label, value, mono = false, tone}: {label: string; value: string; mono?: boolean; tone?: 'amber' | 'green'}) { return <div className="rounded-lg border border-border-dark bg-black/10 p-3"><p className="text-xs text-slate-500">{label}</p><p className={`mt-1 break-all ${mono ? 'font-mono text-xs' : 'text-sm'} ${tone === 'amber' ? 'text-amber-200' : tone === 'green' ? 'text-emerald-200' : 'text-slate-200'}`}>{value}</p></div>; }

function SiteEditor({data, updateSite, manifest, assetUrls, assetPaths, assetBase, onAssetPrepared}: {data: SiteData; updateSite: (updater: (site: SiteConfig) => void) => void; manifest: DataManifest; assetUrls: Record<string, string>; assetPaths: string[]; assetBase: string; onAssetPrepared: (asset: PreparedAsset) => void}) {
  const site = data.site;
  return <><Panel title="品牌与基础信息" description="这些字段会影响浏览器标题、SEO 描述、favicon 和整体品牌展示。"><div className="grid gap-4 md:grid-cols-2"><Input label="站点名称" value={site.brand.name} onChange={(value) => updateSite((draft) => {draft.brand.name = value;})} required /><Input label="短名称" value={site.brand.shortName} onChange={(value) => updateSite((draft) => {draft.brand.shortName = value;})} required /><TextArea label="站点描述" value={site.brand.description} onChange={(value) => updateSite((draft) => {draft.brand.description = value;})} rows={3} /><div className="grid gap-4 sm:grid-cols-2"><Input label="语言" value={site.brand.language} onChange={(value) => updateSite((draft) => {draft.brand.language = value;})} /><ColorPicker label="主题色" value={site.brand.themeColor} onChange={(value) => updateSite((draft) => {draft.brand.themeColor = value;})} /></div><AssetPicker label="Logo" value={site.brand.logo} manifest={manifest}  scope="site" entityId="brand" assetUrls={assetUrls} assetPaths={assetPaths} assetBase={assetBase} onPrepared={onAssetPrepared} onChange={(value) => updateSite((draft) => {draft.brand.logo = value;})} /><AssetPicker label="Favicon" value={site.brand.favicon} manifest={manifest}  scope="site" entityId="brand" assetUrls={assetUrls} assetPaths={assetPaths} assetBase={assetBase} onPrepared={onAssetPrepared} onChange={(value) => updateSite((draft) => {draft.brand.favicon = value;})} /></div></Panel><Panel title="首页 Hero" description="首页首屏的宣传语、背景和行动按钮。"><div className="grid gap-4 md:grid-cols-2"><Input label="徽章文案" value={site.hero.badge} onChange={(value) => updateSite((draft) => {draft.hero.badge = value;})} /><Input label="主标题" value={site.hero.title} onChange={(value) => updateSite((draft) => {draft.hero.title = value;})} required /><Input label="副标题" value={site.hero.subtitle ?? ''} onChange={(value) => updateSite((draft) => {draft.hero.subtitle = value;})} /><AssetPicker label="Hero 背景" value={site.hero.background} manifest={manifest}  scope="site" entityId="hero" assetUrls={assetUrls} assetPaths={assetPaths} assetBase={assetBase} onPrepared={onAssetPrepared} onChange={(value) => updateSite((draft) => {draft.hero.background = value;})} /><div className="md:col-span-2"><TextArea label="Hero 描述" value={site.hero.description} onChange={(value) => updateSite((draft) => {draft.hero.description = value;})} rows={3} /></div><Input label="主按钮文字" value={site.hero.primaryAction?.label ?? ''} onChange={(value) => updateSite((draft) => {draft.hero.primaryAction = {...(draft.hero.primaryAction ?? {url: ''}), label: value};})} /><Input label="主按钮 URL" value={site.hero.primaryAction?.url ?? ''} onChange={(value) => updateSite((draft) => {draft.hero.primaryAction = {...(draft.hero.primaryAction ?? {label: ''}), url: value};})} /><Input label="次按钮文字" value={site.hero.secondaryAction?.label ?? ''} onChange={(value) => updateSite((draft) => {draft.hero.secondaryAction = {...(draft.hero.secondaryAction ?? {route: '/'}), label: value};})} /><Input label="次按钮路由" value={site.hero.secondaryAction?.route ?? ''} onChange={(value) => updateSite((draft) => {draft.hero.secondaryAction = {...(draft.hero.secondaryAction ?? {label: ''}), route: value};})} /></div></Panel><Panel title="页脚"><div className="grid gap-4 md:grid-cols-2"><TextArea label="页脚描述" value={site.footer.description} onChange={(value) => updateSite((draft) => {draft.footer.description = value;})} rows={3} /><TextArea label="版权文案" value={site.footer.copyright} onChange={(value) => updateSite((draft) => {draft.footer.copyright = value;})} rows={3} /></div></Panel><Panel title="外部功能入口" description="启用并填写 URL 后，入口会出现在首页功能区域。"><div className="grid gap-4 md:grid-cols-2">{Object.entries(site.externalFeatures).map(([id, feature]) => <div key={id} className="rounded-xl border border-border-dark bg-black/10 p-4"><div className="mb-3 flex items-center justify-between"><h3 className="text-sm font-semibold text-white">{id}</h3><Toggle label="启用" checked={feature.enabled} onChange={(value) => updateSite((draft) => {draft.externalFeatures[id as keyof typeof draft.externalFeatures].enabled = value;})} /></div><div className="space-y-3"><Input label="显示名称" value={feature.label ?? ''} onChange={(value) => updateSite((draft) => {draft.externalFeatures[id as keyof typeof draft.externalFeatures].label = value;})} /><Input label="URL" value={feature.url ?? ''} onChange={(value) => updateSite((draft) => {draft.externalFeatures[id as keyof typeof draft.externalFeatures].url = value;})} /><TextArea label="说明" value={feature.description ?? ''} onChange={(value) => updateSite((draft) => {draft.externalFeatures[id as keyof typeof draft.externalFeatures].description = value;})} rows={2} /></div></div>)}</div></Panel><Panel title="仓库连接" description="仓库地址用于运行时读取公开 data 和后台 API，编辑时固定为构建快照中的目标。"><div className="grid gap-3 sm:grid-cols-2"><InfoRow label="Owner" value={site.repository.owner} /><InfoRow label="Repository" value={site.repository.name} /><InfoRow label="Data branch" value={site.repository.dataBranch} /><InfoRow label="Workflow" value={site.repository.buildWorkflow} /></div></Panel></>;
}

function HomeEditor({data, updateData}: {data: SiteData; updateData: (updater: (data: SiteData) => void) => void}) {
  return <><Panel title="首页亮点" description="首页首屏下方的三张或多张宣传卡片，支持排序。" actions={<button type="button" onClick={() => updateData((draft) => {draft.home.highlights.push(emptyHighlight());})} className="inline-flex items-center gap-1.5 rounded-lg bg-brand-primary px-3 py-2 text-xs font-semibold text-white"><Plus size={14} />新增亮点</button>}><div className="space-y-3">{data.home.highlights.map((item, index) => <div key={item.id} className="rounded-xl border border-border-dark bg-black/10 p-4"><div className="mb-4 flex items-center justify-between"><span className="text-xs font-semibold text-slate-500">亮点 {index + 1}</span><ItemActions index={index} length={data.home.highlights.length} onMove={(direction) => updateData((draft) => moveItem(draft.home.highlights, index, direction))} onRemove={() => updateData((draft) => {draft.home.highlights.splice(index, 1);})} /></div><div className="grid gap-3 md:grid-cols-2"><Input label="ID" value={item.id} onChange={(value) => updateData((draft) => {draft.home.highlights[index].id = value;})} required /><IconPicker label="图标" value={item.icon} onChange={(value) => updateData((draft) => {draft.home.highlights[index].icon = value;})} /><Select label="颜色" value={item.color} options={[{label: '蓝色', value: 'blue'}, {label: '琥珀', value: 'amber'}, {label: '品牌色', value: 'brand'}, {label: '绿色', value: 'emerald'}, {label: '玫瑰', value: 'rose'}]} onChange={(value) => updateData((draft) => {draft.home.highlights[index].color = value;})} /><Input label="标题" value={item.title} onChange={(value) => updateData((draft) => {draft.home.highlights[index].title = value;})} required /><div className="md:col-span-2"><TextArea label="说明" value={item.description} onChange={(value) => updateData((draft) => {draft.home.highlights[index].description = value;})} rows={3} /></div><Input label="按钮文字" value={item.action?.label ?? ''} onChange={(value) => updateData((draft) => {draft.home.highlights[index].action = {...(draft.home.highlights[index].action ?? {route: '/'}), label: value};})} /><Input label="按钮路由" value={item.action?.route ?? ''} onChange={(value) => updateData((draft) => {draft.home.highlights[index].action = {...(draft.home.highlights[index].action ?? {label: ''}), route: value};})} /></div></div>)}</div></Panel><Panel title="精选瞬间"><ListEditor label="瞬间 ID" values={data.home.featuredMomentIds} onChange={(values) => updateData((draft) => {draft.home.featuredMomentIds = values;})} placeholder="例如 moment-001" /></Panel><Panel title="首页功能卡片" actions={<button type="button" onClick={() => updateData((draft) => {draft.features.push(emptyFeature());})} className="inline-flex items-center gap-1.5 rounded-lg bg-brand-primary px-3 py-2 text-xs font-semibold text-white"><Plus size={14} />新增功能</button>}><div className="space-y-3">{data.features.map((item, index) => <FeatureItem key={item.id} item={item} index={index} length={data.features.length} updateData={updateData} />)}</div></Panel></>;
}

function FeatureItem({item, index, length, updateData}: {key?: string; item: HomeFeature; index: number; length: number; updateData: (updater: (data: SiteData) => void) => void}) {
  return <div className="rounded-xl border border-border-dark bg-black/10 p-4"><div className="mb-4 flex items-center justify-between"><span className="text-xs font-semibold text-slate-500">功能 {index + 1}</span><ItemActions index={index} length={length} onMove={(direction) => updateData((draft) => moveItem(draft.features, index, direction))} onRemove={() => updateData((draft) => {draft.features.splice(index, 1);})} /></div><div className="grid gap-3 md:grid-cols-2"><Input label="ID" value={item.id} onChange={(value) => updateData((draft) => {draft.features[index].id = value;})} required /><Input label="标题" value={item.title} onChange={(value) => updateData((draft) => {draft.features[index].title = value;})} required /><Input label="提示" value={item.tip} onChange={(value) => updateData((draft) => {draft.features[index].tip = value;})} /><Input label="标签" value={item.tag} onChange={(value) => updateData((draft) => {draft.features[index].tag = value;})} /><div className="md:col-span-2"><TextArea label="说明" value={item.description} onChange={(value) => updateData((draft) => {draft.features[index].description = value;})} rows={2} /></div><Select label="目标类型" value={item.target.type} options={[{label: '站内路由', value: 'route'}, {label: '外部链接', value: 'external'}, {label: '配置功能', value: 'feature'}]} onChange={(value) => updateData((draft) => {draft.features[index].target.type = value as HomeFeature['target']['type'];})} /><Input label="目标值" value={item.target.value} onChange={(value) => updateData((draft) => {draft.features[index].target.value = value;})} /><Toggle label="启用" checked={item.enabled} onChange={(value) => updateData((draft) => {draft.features[index].enabled = value;})} /><Input label="禁用原因" value={item.disabledReason ?? ''} onChange={(value) => updateData((draft) => {draft.features[index].disabledReason = value;})} /></div></div>;
}

function NavigationEditor({data, updateData, manifest, assetUrls, assetPaths, assetBase, onAssetPrepared}: {data: SiteData; updateData: (updater: (data: SiteData) => void) => void; manifest: DataManifest; assetUrls: Record<string, string>; assetPaths: string[]; assetBase: string; onAssetPrepared: (asset: PreparedAsset) => void}) {
  return <><Panel title="导航菜单" actions={<button type="button" onClick={() => updateData((draft) => {draft.navigation.push(emptyNavigation());})} className="inline-flex items-center gap-1.5 rounded-lg bg-brand-primary px-3 py-2 text-xs font-semibold text-white"><Plus size={14} />新增导航</button>}><div className="space-y-3">{data.navigation.map((item, index) => <div key={item.id} className="grid gap-3 rounded-xl border border-border-dark bg-black/10 p-4 md:grid-cols-[1fr_1fr_1fr_auto]"><Input label="ID" value={item.id} onChange={(value) => updateData((draft) => {draft.navigation[index].id = value;})} required /><Input label="标签" value={item.label} onChange={(value) => updateData((draft) => {draft.navigation[index].label = value;})} required /><Input label="路由" value={item.route} onChange={(value) => updateData((draft) => {draft.navigation[index].route = value;})} required /><div className="flex items-end gap-2"><Toggle label="显示" checked={item.enabled} onChange={(value) => updateData((draft) => {draft.navigation[index].enabled = value;})} /><button type="button" onClick={() => updateData((draft) => {draft.navigation.splice(index, 1);})} className="mb-0.5 rounded-lg border border-border-dark p-2 text-rose-300 hover:bg-rose-400/10"><Trash2 size={15} /></button></div></div>)}</div></Panel><Panel title="联系方式" actions={<button type="button" onClick={() => updateData((draft) => {draft.contact.push(emptyContact());})} className="inline-flex items-center gap-1.5 rounded-lg bg-brand-primary px-3 py-2 text-xs font-semibold text-white"><Plus size={14} />新增联系方式</button>}><div className="space-y-3">{data.contact.map((item, index) => <ContactItemEditor key={item.id} item={item} index={index} updateData={updateData} manifest={manifest} assetUrls={assetUrls} assetPaths={assetPaths} assetBase={assetBase} onAssetPrepared={onAssetPrepared} />)}</div></Panel><Panel title="公告" actions={<button type="button" onClick={() => updateData((draft) => {draft.announcements.push(emptyAnnouncement());})} className="inline-flex items-center gap-1.5 rounded-lg bg-brand-primary px-3 py-2 text-xs font-semibold text-white"><Plus size={14} />新增公告</button>}><div className="space-y-3">{data.announcements.map((item, index) => <div key={item.id} className="rounded-xl border border-border-dark bg-black/10 p-4"><div className="mb-4 flex items-center justify-between"><span className="text-xs text-slate-500">公告 {index + 1}</span><button type="button" onClick={() => updateData((draft) => {draft.announcements.splice(index, 1);})} className="text-xs text-rose-300">删除</button></div><div className="grid gap-3 md:grid-cols-2"><Input label="ID" value={item.id} onChange={(value) => updateData((draft) => {draft.announcements[index].id = value;})} required /><Input label="标题" value={item.title} onChange={(value) => updateData((draft) => {draft.announcements[index].title = value;})} required /><Input label="日期" value={item.date} onChange={(value) => updateData((draft) => {draft.announcements[index].date = value;})} /><Toggle label="置顶" checked={item.pinned ?? false} onChange={(value) => updateData((draft) => {draft.announcements[index].pinned = value;})} /><div className="md:col-span-2"><TextArea label="内容" value={item.content} onChange={(value) => updateData((draft) => {draft.announcements[index].content = value;})} rows={5} /></div></div></div>)}</div></Panel></>;
}

function ContactItemEditor({item, index, updateData, manifest, assetUrls, assetPaths, assetBase, onAssetPrepared}: {key?: string; item: ContactItem; index: number; updateData: (updater: (data: SiteData) => void) => void; manifest: DataManifest; assetUrls: Record<string, string>; assetPaths: string[]; assetBase: string; onAssetPrepared: (asset: PreparedAsset) => void}) {
  const update = (patch: Partial<ContactItem>) => updateData((draft) => {draft.contact[index] = {...draft.contact[index], ...patch};});
  return <div className="rounded-xl border border-border-dark bg-black/10 p-4"><div className="mb-3 flex items-center justify-between"><span className="text-xs text-slate-500">联系方式 {index + 1}</span><button type="button" onClick={() => updateData((draft) => {draft.contact.splice(index, 1);})} className="text-xs text-rose-300">删除</button></div><div className="grid gap-3 md:grid-cols-2"><Input label="ID" value={item.id} onChange={(value) => update({id: value})} required /><Input label="标签" value={item.label} onChange={(value) => update({label: value})} required /><Select label="类型" value={item.type} options={[{label: '链接', value: 'link'}, {label: '邮箱', value: 'email'}, {label: '文本', value: 'text'}, {label: '图片', value: 'image'}]} onChange={(value) => update({type: value as ContactItem['type']})} /><Input label="值" value={item.value} onChange={(value) => update({value})} required /><AssetPicker label="头像资源（可选）" value={item.avatar ?? ''} manifest={manifest}  scope="site" entityId={`contact-${item.id}`} assetUrls={assetUrls} assetPaths={assetPaths} assetBase={assetBase} onPrepared={onAssetPrepared} onChange={(value) => update({avatar: value || undefined})} /><AssetPicker label="图片/二维码资源（可选）" value={item.image ?? ''} manifest={manifest}  scope="site" entityId={`contact-${item.id}`} assetUrls={assetUrls} assetPaths={assetPaths} assetBase={assetBase} onPrepared={onAssetPrepared} onChange={(value) => update({image: value || undefined})} /><Input label="提示文字" value={item.hint ?? ''} onChange={(value) => update({hint: value || undefined})} /><Input label="图标 key（兼容字段）" value={item.icon ?? ''} onChange={(value) => update({icon: value || undefined})} /></div></div>;
}

function ServersEditor({data, updateData, manifest, assetUrls, assetPaths, assetBase, onAssetPrepared}: {data: SiteData; updateData: (updater: (data: SiteData) => void) => void; manifest: DataManifest; assetUrls: Record<string, string>; assetPaths: string[]; assetBase: string; onAssetPrepared: (asset: PreparedAsset) => void}) {
  return <Panel title="服务器档案" description="日期使用 YYYY-MM-DD，状态决定页面中的运行中/历史分组。" actions={<button type="button" onClick={() => updateData((draft) => {draft.servers.push(emptyServer());})} className="inline-flex items-center gap-1.5 rounded-lg bg-brand-primary px-3 py-2 text-xs font-semibold text-white"><Plus size={14} />新增服务器</button>}><div className="space-y-4">{data.servers.map((item, index) => <div key={item.id} className="rounded-xl border border-border-dark bg-black/10 p-4"><div className="mb-4 flex items-center justify-between"><div><span className="text-xs font-semibold text-slate-500">服务器 {index + 1}</span><p className="mt-1 text-sm text-white">{item.title || '未命名'}</p></div><ItemActions index={index} length={data.servers.length} onMove={(direction) => updateData((draft) => moveItem(draft.servers, index, direction))} onRemove={() => updateData((draft) => {draft.servers.splice(index, 1);})} /></div><div className="grid gap-3 md:grid-cols-2"><Input label="ID" value={item.id} onChange={(value) => updateData((draft) => {draft.servers[index].id = value;})} required /><Input label="标题" value={item.title} onChange={(value) => updateData((draft) => {draft.servers[index].title = value;})} required /><Input label="版本" value={item.version} onChange={(value) => updateData((draft) => {draft.servers[index].version = value;})} required /><Select label="状态" value={item.status} options={[{label: '运行中', value: 'active'}, {label: '已关闭', value: 'closed'}, {label: '未知', value: 'unknown'}]} onChange={(value) => updateData((draft) => {draft.servers[index].status = value as ServerArchive['status'];})} /><Input label="开始日期" type="date" value={item.period.start} onChange={(value) => updateData((draft) => {draft.servers[index].period.start = value;})} required /><Input label="结束日期" type="date" value={item.period.end ?? ''} onChange={(value) => updateData((draft) => {draft.servers[index].period.end = value || undefined;})} /><Input label="持续天数" type="number" value={item.durationDays ?? ''} onChange={(value) => updateData((draft) => {draft.servers[index].durationDays = value === '' ? undefined : Number(value);})} /><Input label="服务器地址" value={item.address ?? ''} onChange={(value) => updateData((draft) => {draft.servers[index].address = value;})} /><Input label="地图种子" value={item.seed ?? ''} onChange={(value) => updateData((draft) => {draft.servers[index].seed = value;})} /><Input label="更新时间" value={item.updatedAt ?? ''} onChange={(value) => updateData((draft) => {draft.servers[index].updatedAt = value;})} /><div className="md:col-span-2"><TextArea label="描述" value={item.description} onChange={(value) => updateData((draft) => {draft.servers[index].description = value;})} rows={4} /></div><div className="md:col-span-2"><ListEditor label="标签" values={item.tags} onChange={(values) => updateData((draft) => {draft.servers[index].tags = values;})} /></div><ListEditor label="规则" values={item.rules} onChange={(values) => updateData((draft) => {draft.servers[index].rules = values;})} /><ListEditor label="模组" values={item.mods} onChange={(values) => updateData((draft) => {draft.servers[index].mods = values;})} /><div className="md:col-span-2"><AttachmentEditor attachments={item.attachments} onChange={(value) => updateData((draft) => {draft.servers[index].attachments = value;})} manifest={manifest}  scope="servers" entityId={item.id} assetUrls={assetUrls} assetPaths={assetPaths} assetBase={assetBase} onAssetPrepared={onAssetPrepared} /></div></div></div>)}</div></Panel>;
}

function ResourcesEditor({data, updateData, manifest, assetUrls, assetPaths, assetBase, onAssetPrepared}: {data: SiteData; updateData: (updater: (data: SiteData) => void) => void; manifest: DataManifest; assetUrls: Record<string, string>; assetPaths: string[]; assetBase: string; onAssetPrepared: (asset: PreparedAsset) => void}) {
  return <Panel title="资源卡片" actions={<button type="button" onClick={() => updateData((draft) => {draft.resources.push(emptyResource());})} className="inline-flex items-center gap-1.5 rounded-lg bg-brand-primary px-3 py-2 text-xs font-semibold text-white"><Plus size={14} />新增资源</button>}><div className="space-y-4">{data.resources.map((item, index) => <div key={item.id} className="rounded-xl border border-border-dark bg-black/10 p-4"><div className="mb-4 flex items-center justify-between"><span className="text-xs text-slate-500">资源 {index + 1}</span><ItemActions index={index} length={data.resources.length} onMove={(direction) => updateData((draft) => moveItem(draft.resources, index, direction))} onRemove={() => updateData((draft) => {draft.resources.splice(index, 1);})} /></div><div className="grid gap-3 md:grid-cols-2"><Input label="ID" value={item.id} onChange={(value) => updateData((draft) => {draft.resources[index].id = value;})} required /><Input label="标题" value={item.title} onChange={(value) => updateData((draft) => {draft.resources[index].title = value;})} required /><Input label="时期" value={item.period ?? ''} onChange={(value) => updateData((draft) => {draft.resources[index].period = value;})} /><div className="md:col-span-2"><TextArea label="描述" value={item.description} onChange={(value) => updateData((draft) => {draft.resources[index].description = value;})} rows={3} /></div><div className="md:col-span-2"><ListEditor label="标签" values={item.tags} onChange={(values) => updateData((draft) => {draft.resources[index].tags = values;})} /><div className="mt-4"><AttachmentEditor attachments={item.attachments} onChange={(value) => updateData((draft) => {draft.resources[index].attachments = value;})} manifest={manifest}  scope="resources" entityId={item.id} assetUrls={assetUrls} assetPaths={assetPaths} assetBase={assetBase} onAssetPrepared={onAssetPrepared} /></div></div></div></div>)}</div></Panel>;
}

function MembersEditor({data, updateData, manifest, assetUrls, assetPaths, assetBase, onAssetPrepared}: {data: SiteData; updateData: (updater: (data: SiteData) => void) => void; manifest: DataManifest; assetUrls: Record<string, string>; assetPaths: string[]; assetBase: string; onAssetPrepared: (asset: PreparedAsset) => void}) {
  return <><Panel title="团队成员" description="关闭默认皮肤后，头像只能选择受控资源路径。" actions={<button type="button" onClick={() => updateData((draft) => {draft.members.team.push(emptyTeamMember());})} className="inline-flex items-center gap-1.5 rounded-lg bg-brand-primary px-3 py-2 text-xs font-semibold text-white"><Plus size={14} />新增成员</button>}><div className="space-y-4">{data.members.team.map((item, index) => <div key={item.id} className="rounded-xl border border-border-dark bg-black/10 p-4"><div className="mb-4 flex items-center justify-between"><span className="text-xs text-slate-500">团队成员 {index + 1}</span><button type="button" onClick={() => updateData((draft) => {draft.members.team.splice(index, 1);})} className="text-xs text-rose-300">删除</button></div><div className="grid gap-3 md:grid-cols-2"><Input label="玩家 ID" value={item.id} onChange={(value) => updateData((draft) => {draft.members.team[index].id = value;})} required /><Input label="姓名" value={item.name} onChange={(value) => updateData((draft) => {draft.members.team[index].name = value;})} required /><Input label="角色" value={item.role} onChange={(value) => updateData((draft) => {draft.members.team[index].role = value;})} required /><Toggle label="使用默认皮肤头像" checked={item.useDefaultSkin} onChange={(value) => updateData((draft) => {draft.members.team[index].useDefaultSkin = value;})} />{!item.useDefaultSkin && <AssetPicker label="头像资源" value={item.avatar ?? ''} manifest={manifest}  scope="team" entityId={item.id} assetUrls={assetUrls} assetPaths={assetPaths} assetBase={assetBase} onPrepared={onAssetPrepared} onChange={(value) => updateData((draft) => {draft.members.team[index].avatar = value || undefined;})} />}<div className="md:col-span-2"><TextArea label="介绍" value={item.description} onChange={(value) => updateData((draft) => {draft.members.team[index].description = value;})} rows={3} /></div><ListEditor label="链接标签（高级模式可编辑 URL）" values={(item.links ?? []).map((link) => link.label)} onChange={(values) => updateData((draft) => {draft.members.team[index].links = values.map((label, linkIndex) => ({label, url: draft.members.team[index].links?.[linkIndex]?.url ?? ''}));})} /></div></div>)}</div></Panel><Panel title="社区玩家 ID" description="每行维护一个名称或 UUID，头像统一使用默认皮肤服务。" actions={<button type="button" onClick={() => updateData((draft) => {draft.members.communityPlayerIds.push('');})} className="inline-flex items-center gap-1.5 rounded-lg bg-brand-primary px-3 py-2 text-xs font-semibold text-white"><Plus size={14} />新增玩家</button>}><ListEditor label="玩家名称或 UUID" values={data.members.communityPlayerIds} onChange={(values) => updateData((draft) => {draft.members.communityPlayerIds = values;})} placeholder="例如 PlayerName 或 UUID" /></Panel><Panel title="社区头像"><Toggle label="启用默认皮肤头像" checked={data.members.useDefaultSkinAvatars} onChange={(value) => updateData((draft) => {draft.members.useDefaultSkinAvatars = value;})} /></Panel></>;
}

function MomentsEditor({data, updateData}: {data: SiteData; updateData: (updater: (data: SiteData) => void) => void}) {
  return <><Panel title="瞬间分类" actions={<button type="button" onClick={() => updateData((draft) => {draft.moments.categories.push(emptyMomentCategory());})} className="inline-flex items-center gap-1.5 rounded-lg bg-brand-primary px-3 py-2 text-xs font-semibold text-white"><Plus size={14} />新增分类</button>}><div className="space-y-3">{data.moments.categories.map((item, index) => <div key={item.id} className="grid gap-3 rounded-xl border border-border-dark bg-black/10 p-4 md:grid-cols-[1fr_1fr_120px_auto]"><Input label="ID" value={item.id} onChange={(value) => updateData((draft) => {draft.moments.categories[index].id = value;})} required /><Input label="名称" value={item.label} onChange={(value) => updateData((draft) => {draft.moments.categories[index].label = value;})} required /><Input label="排序" type="number" value={item.sortOrder} onChange={(value) => updateData((draft) => {draft.moments.categories[index].sortOrder = Number(value);})} /><div className="flex items-end"><button type="button" onClick={() => updateData((draft) => {draft.moments.categories.splice(index, 1);})} className="rounded-lg border border-border-dark p-2 text-rose-300"><Trash2 size={15} /></button></div></div>)}</div></Panel><Panel title="瞬间内容" actions={<button type="button" onClick={() => updateData((draft) => {draft.moments.items.push(emptyMoment());})} className="inline-flex items-center gap-1.5 rounded-lg bg-brand-primary px-3 py-2 text-xs font-semibold text-white"><Plus size={14} />新增瞬间</button>}><div className="space-y-4">{data.moments.items.map((item, index) => <div key={item.id} className="rounded-xl border border-border-dark bg-black/10 p-4"><div className="mb-4 flex items-center justify-between"><span className="text-xs text-slate-500">瞬间 {index + 1}</span><ItemActions index={index} length={data.moments.items.length} onMove={(direction) => updateData((draft) => moveItem(draft.moments.items, index, direction))} onRemove={() => updateData((draft) => {draft.moments.items.splice(index, 1);})} /></div><div className="grid gap-3 md:grid-cols-2"><Input label="ID" value={item.id} onChange={(value) => updateData((draft) => {draft.moments.items[index].id = value;})} required /><Select label="类型" value={item.type} options={[{label: '图片', value: 'image'}, {label: '视频', value: 'video'}]} onChange={(value) => updateData((draft) => {draft.moments.items[index].type = value as Moment['type'];})} /><Input label="原始媒体 URL" value={item.url} onChange={(value) => updateData((draft) => {draft.moments.items[index].url = value;})} required /><Input label="预览图路径" value={item.previewUrl} onChange={(value) => updateData((draft) => {draft.moments.items[index].previewUrl = value;})} required /><Select label="分类" value={item.categoryId} options={data.moments.categories.map((category) => ({label: category.label, value: category.id}))} onChange={(value) => updateData((draft) => {draft.moments.items[index].categoryId = value;})} /><Input label="日期" type="date" value={item.date ?? ''} onChange={(value) => updateData((draft) => {draft.moments.items[index].date = value;})} /><div className="md:col-span-2"><TextArea label="描述" value={item.description} onChange={(value) => updateData((draft) => {draft.moments.items[index].description = value;})} rows={2} /></div></div></div>)}</div></Panel></>;
}

function DonationsEditor({data, updateData, manifest, assetUrls, assetPaths, assetBase, onAssetPrepared}: {data: SiteData; updateData: (updater: (data: SiteData) => void) => void; manifest: DataManifest; assetUrls: Record<string, string>; assetPaths: string[]; assetBase: string; onAssetPrepared: (asset: PreparedAsset) => void}) {
  return <><Panel title="付款方式" actions={<button type="button" onClick={() => updateData((draft) => {draft.donations.paymentMethods.push({id: `method-${Date.now()}`, label: '新付款方式', description: '', image: ''});})} className="inline-flex items-center gap-1.5 rounded-lg bg-brand-primary px-3 py-2 text-xs font-semibold text-white"><Plus size={14} />新增方式</button>}><div className="grid gap-4 md:grid-cols-2">{data.donations.paymentMethods.map((item, index) => <div key={item.id} className="rounded-xl border border-border-dark bg-black/10 p-4"><div className="mb-3 flex items-center justify-between"><span className="text-xs text-slate-500">付款方式 {index + 1}</span><button type="button" onClick={() => updateData((draft) => {draft.donations.paymentMethods.splice(index, 1);})} className="text-xs text-rose-300">删除</button></div><div className="space-y-3"><Input label="ID" value={item.id} onChange={(value) => updateData((draft) => {draft.donations.paymentMethods[index].id = value;})} required /><Input label="名称" value={item.label} onChange={(value) => updateData((draft) => {draft.donations.paymentMethods[index].label = value;})} required /><TextArea label="说明" value={item.description} onChange={(value) => updateData((draft) => {draft.donations.paymentMethods[index].description = value;})} rows={2} /><AssetPicker label="收款码" value={item.image} manifest={manifest}  scope="donations" entityId={item.id} assetUrls={assetUrls} assetPaths={assetPaths} assetBase={assetBase} onPrepared={onAssetPrepared} onChange={(value) => updateData((draft) => {draft.donations.paymentMethods[index].image = value;})} /></div></div>)}</div></Panel><Panel title="赞助记录" description={`当前合计：${data.donations.currency} ${data.donations.items.reduce((sum, item) => sum + item.amount, 0)}`} actions={<button type="button" onClick={() => updateData((draft) => {draft.donations.items.push(emptyDonation());})} className="inline-flex items-center gap-1.5 rounded-lg bg-brand-primary px-3 py-2 text-xs font-semibold text-white"><Plus size={14} />新增记录</button>}><div className="space-y-3">{data.donations.items.map((item, index) => <div key={item.id} className="rounded-xl border border-border-dark bg-black/10 p-4"><div className="mb-4 flex items-center justify-between"><span className="text-xs text-slate-500">记录 {index + 1}</span><button type="button" onClick={() => updateData((draft) => {draft.donations.items.splice(index, 1);})} className="text-xs text-rose-300">删除</button></div><div className="grid gap-3 md:grid-cols-2"><Input label="ID" value={item.id} onChange={(value) => updateData((draft) => {draft.donations.items[index].id = value;})} required /><Input label="日期" type="date" value={item.date} onChange={(value) => updateData((draft) => {draft.donations.items[index].date = value;})} required /><Input label="渠道" value={item.channel} onChange={(value) => updateData((draft) => {draft.donations.items[index].channel = value;})} required /><Input label="金额" type="number" value={item.amount} onChange={(value) => updateData((draft) => {draft.donations.items[index].amount = Number(value);})} required /><Input label="订单号" value={item.orderId} onChange={(value) => updateData((draft) => {draft.donations.items[index].orderId = value;})} required /><Input label="支持者" value={item.donor} onChange={(value) => updateData((draft) => {draft.donations.items[index].donor = value;})} required /><div className="md:col-span-2"><TextArea label="备注" value={item.note} onChange={(value) => updateData((draft) => {draft.donations.items[index].note = value;})} rows={2} /></div></div></div>)}</div></Panel></>;
}

function CopyEditor({data, updateSite}: {data: SiteData; updateSite: (updater: (site: SiteConfig) => void) => void}) {
  const sections: Array<{key: keyof SiteCopy; label: string; fields: Array<{key: string; label: string}>}> = [
    {key: 'navigation', label: '导航与页脚', fields: [{key: 'openMenu', label: '打开菜单'}, {key: 'closeMenu', label: '关闭菜单'}, {key: 'quickLinks', label: '快速链接'}, {key: 'contact', label: '联系我们'}]},
    {key: 'home', label: '首页', fields: [{key: 'announcementsTitle', label: '公告标题'}, {key: 'announcementCountSuffix', label: '公告数量后缀'}, {key: 'momentsTitle', label: '瞬间标题'}, {key: 'momentsDescription', label: '瞬间说明'}, {key: 'viewAll', label: '查看全部'}, {key: 'featuresTitle', label: '功能标题'}, {key: 'featuresDescription', label: '功能说明'}, {key: 'externalFeatureTip', label: '外链提示'}]},
    {key: 'server', label: '服务器', fields: [{key: 'title', label: '页面标题'}, {key: 'description', label: '页面说明'}, {key: 'activeTitle', label: '运行中标题'}, {key: 'recordsTitle', label: '记录标题'}, {key: 'resourcesTitle', label: '资源标题'}, {key: 'emptyRecords', label: '空记录提示'}, {key: 'statusActive', label: '运行中'}, {key: 'statusClosed', label: '已关服'}, {key: 'statusUnknown', label: '状态未知'}, {key: 'durationLabel', label: '持续时间标签'}, {key: 'durationLong', label: '长期标签'}, {key: 'durationDaysSuffix', label: '天数后缀'}, {key: 'addressLabel', label: '地址标签'}, {key: 'seedLabel', label: '种子标签'}, {key: 'modsTitle', label: '模组标题'}, {key: 'rulesTitle', label: '规则标题'}, {key: 'attachmentsTitle', label: '附件标题'}, {key: 'extractCodeLabel', label: '提取码标签'}, {key: 'expandDetails', label: '展开详情'}, {key: 'collapseDetails', label: '收起详情'}, {key: 'emptyDescription', label: '空描述提示'}]},
    {key: 'moment', label: '瞬间', fields: [{key: 'title', label: '页面标题'}, {key: 'description', label: '页面说明'}, {key: 'allLabel', label: '全部'}, {key: 'empty', label: '空内容提示'}, {key: 'viewDetails', label: '查看详情'}]},
    {key: 'about', label: '关于', fields: [{key: 'title', label: '页面标题'}, {key: 'motto', label: '标语'}, {key: 'description', label: '页面说明'}, {key: 'communityTitle', label: '社区标题'}, {key: 'memberCountSuffix', label: '成员数后缀'}, {key: 'memberSortLabel', label: '排序说明'}, {key: 'empty', label: '空内容提示'}, {key: 'avatarCredit', label: '头像服务说明'}]},
    {key: 'donate', label: '赞助', fields: [{key: 'title', label: '页面标题'}, {key: 'motto', label: '标语'}, {key: 'description', label: '页面说明'}, {key: 'paymentHint', label: '收款码提示'}, {key: 'recordsTitle', label: '记录标题'}, {key: 'totalLabel', label: '合计标签'}, {key: 'timeLabel', label: '时间'}, {key: 'channelLabel', label: '渠道'}, {key: 'orderLabel', label: '单号'}, {key: 'amountLabel', label: '金额'}, {key: 'noteLabel', label: '说明'}, {key: 'donorLabel', label: '支持者'}, {key: 'totalCurrencyLabel', label: '合计行'}, {key: 'emptyRecords', label: '空记录提示'}]},
  ];
  return <div className="space-y-4">{sections.map((section) => <Panel key={section.key} title={section.label} description="修改后会同步到对应页面。"><div className="grid gap-4 md:grid-cols-2">{section.fields.map((field) => { const value = data.site.copy[section.key][field.key as never] as string; return <TextArea key={field.key} label={field.label} value={value ?? ''} onChange={(next) => updateSite((site) => { (site.copy[section.key] as Record<string, string>)[field.key] = next; })} rows={field.key === 'description' || field.key === 'motto' ? 3 : 2} />; })}</div></Panel>)}</div>;
}

function AdvancedEditor({files, selected, rawText, setSelected, setRawText}: {files: DataFiles; selected: DataFileName; rawText: string; setSelected: (file: DataFileName) => void; setRawText: (value: string) => void}) {
  return <Panel title="高级 JSON 编辑器" description="仅用于批量修改、迁移或处理模块化表单未覆盖的字段。保存时仍会经过完整 schema 校验。"><div className="mb-4 flex flex-wrap gap-2">{DATA_FILES.map((file) => <button key={file} type="button" onClick={() => setSelected(file)} className={`rounded-lg px-3 py-2 text-xs ${selected === file ? 'bg-brand-primary text-white' : 'bg-white/5 text-slate-400 hover:text-white'}`}>{file}</button>)}</div><textarea value={rawText} onChange={(event) => setRawText(event.target.value)} spellCheck={false} className="min-h-[620px] w-full rounded-xl border border-border-dark bg-black/30 p-4 font-mono text-xs leading-relaxed text-slate-200 outline-none focus:border-brand-primary" /><p className="mt-3 flex items-center gap-2 text-xs text-slate-500"><CircleHelp size={14} />高级模式直接修改当前文件，切换模块前请先保存或放弃文本修改。</p></Panel>;
}

function moveItem<T>(items: T[], index: number, direction: -1 | 1): void {
  const target = index + direction;
  if (target < 0 || target >= items.length) return;
  [items[index], items[target]] = [items[target], items[index]];
}
