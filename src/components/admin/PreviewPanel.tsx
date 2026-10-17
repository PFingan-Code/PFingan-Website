import AboutPage from '@/src/pages/AboutPage';
import DonatePage from '@/src/pages/DonatePage';
import HomePage from '@/src/pages/HomePage';
import MomentPage from '@/src/pages/MomentPage';
import ServerPage from '@/src/pages/ServerPage';
import {Eye, X} from 'lucide-react';

export type PreviewPage = 'home' | 'moment' | 'server' | 'about' | 'donate';

const PAGES: Array<{id: PreviewPage; label: string}> = [
  {id: 'home', label: '首页'},
  {id: 'moment', label: '图库'},
  {id: 'server', label: '服务器'},
  {id: 'about', label: '关于'},
  {id: 'donate', label: '赞助'},
];

export default function PreviewPanel({page, setPage, onClose}: {page: PreviewPage; setPage: (page: PreviewPage) => void; onClose: () => void}) {
  const content = {
    home: <HomePage />,
    moment: <MomentPage />,
    server: <ServerPage />,
    about: <AboutPage />,
    donate: <DonatePage />,
  }[page];

  return (
    <section className="overflow-hidden border border-amber-300/30 bg-black/30" aria-label="草稿预览">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-amber-300/20 bg-amber-300/5 px-4 py-3">
        <div className="flex items-center gap-2 text-sm font-medium text-amber-100"><Eye size={16} />未提交草稿预览</div>
        <div className="flex flex-wrap items-center gap-1" role="tablist" aria-label="预览页面">
          {PAGES.map((item) => <button key={item.id} type="button" role="tab" aria-selected={page === item.id} onClick={() => setPage(item.id)} className={`px-3 py-1.5 text-xs ${page === item.id ? 'bg-amber-200/15 text-amber-100' : 'text-slate-400 hover:text-white'}`}>{item.label}</button>)}
        </div>
        <button type="button" onClick={onClose} title="关闭预览" aria-label="关闭预览" className="rounded-md p-1.5 text-slate-400 hover:bg-white/10 hover:text-white"><X size={16} /></button>
      </div>
      <div className="max-h-[75vh] overflow-auto bg-bg-dark">{content}</div>
    </section>
  );
}
