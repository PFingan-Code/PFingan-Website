import {useSiteData} from '@/src/data/SiteDataProvider';
import {SNAPSHOT} from '@/src/data/snapshot';
import {dataFilesToSiteData, commitDataFiles} from '@/src/lib/github-editor';
import {GitHubApiError, GitHubClient, type GitHubWorkflowRun} from '@/src/lib/github-api';
import {DATA_FILES, type DataFileName, type DataManifest} from '@/src/types/site-data';
import {AlertTriangle, Check, GitBranch, KeyRound, LoaderCircle, Play, Save, ShieldCheck} from 'lucide-react';
import {useEffect, useMemo, useState} from 'react';

const TOKEN_KEY = 'site-admin-github-token';
const BUILD_WORKFLOW = 'deploy.yml';
type DataFiles = Record<DataFileName, unknown>;

function getStoredToken(): string {
  try { return sessionStorage.getItem(TOKEN_KEY) ?? ''; } catch { return ''; }
}

function friendlyError(error: unknown): string {
  if (error instanceof GitHubApiError) return error.message;
  return error instanceof Error ? error.message : '操作失败，请稍后重试';
}

export default function AdminPage() {
  const {data} = useSiteData();
  // Keep write targets tied to the build snapshot so public runtime data cannot redirect a PAT.
  const repository = SNAPSHOT.data.site.repository;
  const [token, setToken] = useState(getStoredToken);
  const [connected, setConnected] = useState(false);
  const [files, setFiles] = useState<DataFiles | null>(null);
  const [manifest, setManifest] = useState<DataManifest | null>(null);
  const [selected, setSelected] = useState<DataFileName>('site.json');
  const [mode, setMode] = useState<'structured' | 'raw'>('structured');
  const [rawText, setRawText] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [run, setRun] = useState<GitHubWorkflowRun | undefined>();

  const client = useMemo(() => token ? new GitHubClient({owner: repository.owner, repo: repository.name, token}) : null, [repository.name, repository.owner, token]);
  const selectedValue = files?.[selected];

  useEffect(() => {
    if (selectedValue !== undefined) setRawText(JSON.stringify(selectedValue, null, 2));
  }, [selected, selectedValue]);

  const connect = async () => {
    if (!client) return;
    setBusy(true); setError(''); setMessage('');
    try {
      await client.verifyAccess();
      sessionStorage.setItem(TOKEN_KEY, token);
      setConnected(true);
      await loadFiles(client);
    } catch (caught) {
      setConnected(false); setError(friendlyError(caught));
    } finally { setBusy(false); }
  };

  const loadFiles = async (activeClient: GitHubClient = client!) => {
    setBusy(true); setError('');
    try {
      const loaded = Object.fromEntries(await Promise.all(DATA_FILES.map(async (file) => {
        const response = await activeClient.getFile(`data/${file}`, repository.dataBranch);
        return [file, JSON.parse(response.content)];
      }))) as DataFiles;
      const manifestResponse = await activeClient.getFile('data/manifest.json', repository.dataBranch);
      const loadedManifest = JSON.parse(manifestResponse.content) as DataManifest;
      dataFilesToSiteData(loaded);
      setFiles(loaded); setManifest(loadedManifest); setConnected(true); setMessage('已加载 data 分支内容');
    } catch (caught) { setError(friendlyError(caught)); }
    finally { setBusy(false); }
  };

  const updateSelected = (next: unknown) => {
    setFiles((current) => current ? {...current, [selected]: next} : current);
    setRawText(JSON.stringify(next, null, 2));
  };

  const commit = async (andRebuild: boolean) => {
    if (!client || !files || !manifest) return;
    setBusy(true); setError(''); setMessage('');
    try {
      let parsed: unknown;
      try { parsed = JSON.parse(rawText); } catch { throw new Error('当前 JSON 格式无效，请先修正语法'); }
      const nextFiles = {...files, [selected]: parsed} as DataFiles;
      dataFilesToSiteData(nextFiles);
      const result = await commitDataFiles({client, branch: repository.dataBranch, currentFiles: nextFiles, manifest, message: `data: 更新 ${selected}`});
      setFiles(nextFiles); setManifest({...manifest, contentHash: result.contentHash, contentRevision: manifest.contentRevision + 1, updatedAt: new Date().toISOString()});
      setMessage(`已提交 data 分支（${result.commitSha.slice(0, 12)}）`);
      if (andRebuild) await rebuild(client);
    } catch (caught) { setError(friendlyError(caught)); }
    finally { setBusy(false); }
  };

  const rebuild = async (activeClient = client!) => {
    const requestedAt = new Date().toISOString();
    await activeClient.dispatchWorkflow(BUILD_WORKFLOW, 'main', {reason: '站内数据管理器触发重建'});
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

  const disconnect = () => {
    sessionStorage.removeItem(TOKEN_KEY); setToken(''); setConnected(false); setFiles(null); setManifest(null); setMessage('已清除本次会话 Token');
  };

  const siteFile = files?.['site.json'] as {site?: {brand?: {name?: string; shortName?: string; description?: string}}} | undefined;
  const updateSiteField = (field: 'name' | 'shortName' | 'description', value: string) => {
    if (!siteFile) return;
    updateSelected({...(siteFile ?? {}), site: {...(siteFile.site ?? {}), brand: {...(siteFile.site?.brand ?? {}), [field]: value}}});
  };

  return <div className="max-w-7xl mx-auto px-6 py-12 space-y-8"><header className="space-y-3"><div className="flex items-center gap-3"><ShieldCheck className="text-brand-primary" /><p className="text-xs uppercase tracking-widest text-brand-primary">Content Control</p></div><h1 className="text-4xl font-bold text-white">站点内容管理</h1><p className="max-w-3xl text-slate-400">通过受限 GitHub Token 编辑 data 分支内容。Token 只保存在当前浏览器会话，提交范围固定为 data 内容文件。</p></header><div className="glass-panel rounded-2xl p-6 space-y-4"><div className="flex flex-wrap items-center justify-between gap-4"><div className="flex items-center gap-3"><KeyRound className="text-slate-400" size={18} /><span className="text-white font-medium">GitHub 连接</span>{connected && <span className="text-xs text-emerald-400 flex items-center gap-1"><Check size={14} />已连接</span>}</div>{connected && <button type="button" onClick={disconnect} className="text-sm text-slate-400 hover:text-white">清除会话</button>}</div><div className="flex flex-col md:flex-row gap-3"><input type="password" value={token} onChange={(event) => setToken(event.target.value)} placeholder="输入目标仓库的 fine-grained Token" autoComplete="off" className="flex-1 rounded-lg border border-border-dark bg-black/20 px-4 py-3 text-sm text-white outline-none focus:border-brand-primary" /><button type="button" disabled={!token || busy} onClick={connect} className="rounded-lg bg-brand-primary px-5 py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50">{busy ? '连接中…' : '连接并读取数据'}</button></div><div className="flex items-start gap-2 text-xs text-amber-300"><AlertTriangle size={16} className="mt-0.5 shrink-0" /><span>仅使用限制到此仓库的 fine-grained Token，授予 Contents 和 Actions 的必要权限。浏览器 Token 不是服务端密钥，请勿使用组织级高权限 Token。</span></div><p className="text-xs text-slate-500"><GitBranch size={13} className="inline mr-1" />{repository.owner}/{repository.name} · data 分支：{repository.dataBranch}</p></div>{error && <div role="alert" className="rounded-lg border border-red-400/30 bg-red-400/10 px-4 py-3 text-sm text-red-200">{error}</div>}{message && <div role="status" className="rounded-lg border border-emerald-400/30 bg-emerald-400/10 px-4 py-3 text-sm text-emerald-200">{message}</div>}{files && manifest && <div className="grid grid-cols-1 lg:grid-cols-[220px_1fr] gap-6"><aside className="glass-panel rounded-2xl p-4 space-y-2"><p className="px-3 py-2 text-xs font-bold uppercase tracking-widest text-slate-500">数据文件</p>{DATA_FILES.map((file) => <button key={file} type="button" onClick={() => setSelected(file)} className={`w-full rounded-lg px-3 py-2 text-left text-sm ${selected === file ? 'bg-brand-primary/10 text-brand-primary' : 'text-slate-400 hover:bg-white/5 hover:text-white'}`}>{file}</button>)}<button type="button" onClick={() => void loadFiles()} disabled={busy} className="mt-3 w-full rounded-lg border border-border-dark px-3 py-2 text-sm text-slate-400 hover:text-white">重新读取</button></aside><section className="glass-panel rounded-2xl p-6 space-y-5"><div className="flex flex-wrap items-center justify-between gap-3"><div><h2 className="text-xl font-bold text-white">{selected}</h2><p className="text-xs text-slate-500">提交前会校验全部数据文件并更新 manifest 内容哈希</p></div><div className="flex gap-2"><button type="button" onClick={() => setMode('structured')} className={`rounded-lg px-3 py-2 text-sm ${mode === 'structured' ? 'bg-brand-primary text-white' : 'bg-white/5 text-slate-400'}`}>结构化</button><button type="button" onClick={() => setMode('raw')} className={`rounded-lg px-3 py-2 text-sm ${mode === 'raw' ? 'bg-brand-primary text-white' : 'bg-white/5 text-slate-400'}`}>原始 JSON</button></div></div>{mode === 'structured' && selected === 'site.json' ? <div className="grid gap-4 md:grid-cols-2"><label className="space-y-2"><span className="text-xs text-slate-400">站点名称</span><input value={siteFile?.site?.brand?.name ?? ''} onChange={(event) => updateSiteField('name', event.target.value)} className="w-full rounded-lg border border-border-dark bg-black/20 px-3 py-2 text-sm text-white" /></label><label className="space-y-2"><span className="text-xs text-slate-400">短名称</span><input value={siteFile?.site?.brand?.shortName ?? ''} onChange={(event) => updateSiteField('shortName', event.target.value)} className="w-full rounded-lg border border-border-dark bg-black/20 px-3 py-2 text-sm text-white" /></label><label className="space-y-2 md:col-span-2"><span className="text-xs text-slate-400">站点描述</span><textarea value={siteFile?.site?.brand?.description ?? ''} onChange={(event) => updateSiteField('description', event.target.value)} rows={4} className="w-full rounded-lg border border-border-dark bg-black/20 px-3 py-2 text-sm text-white" /></label><p className="text-xs text-slate-500 md:col-span-2">常用品牌字段可直接编辑；其余字段切换到原始 JSON 模式进行修改。</p></div> : <textarea value={rawText} onChange={(event) => setRawText(event.target.value)} spellCheck={false} className="min-h-[520px] w-full rounded-xl border border-border-dark bg-black/30 p-4 font-mono text-xs leading-relaxed text-slate-200 outline-none focus:border-brand-primary" />}{<div className="flex flex-wrap gap-3 border-t border-border-dark pt-5"><button type="button" disabled={busy} onClick={() => void commit(false)} className="inline-flex items-center gap-2 rounded-lg bg-brand-primary px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"><Save size={16} />提交数据</button><button type="button" disabled={busy} onClick={() => void commit(true)} className="inline-flex items-center gap-2 rounded-lg border border-brand-primary/50 px-4 py-2 text-sm font-semibold text-brand-primary disabled:opacity-50"><Play size={16} />提交并重建</button><button type="button" disabled={busy} onClick={() => void rebuild()} className="inline-flex items-center gap-2 rounded-lg border border-border-dark px-4 py-2 text-sm text-slate-300 disabled:opacity-50"><LoaderCircle size={16} />仅触发重建</button></div>}{run && <p className="text-xs text-slate-500">最近任务：<a href={run.html_url} target="_blank" rel="noopener noreferrer" className="text-brand-primary hover:underline">#{run.id}</a> · {run.status}{run.conclusion ? ` / ${run.conclusion}` : ''}</p>}</section></div>}</div>;
}
