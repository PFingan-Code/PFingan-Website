import {DataSyncStatus, useSiteData} from '@/src/data/SiteDataProvider';
import {cn} from '@/src/lib/utils';
import {
  ChevronRight,
  Github,
  Heart,
  Home as HomeIcon,
  Image as ImageIcon,
  Menu,
  Server as ServerIcon,
  Users,
  X,
} from 'lucide-react';
import {AnimatePresence, motion} from 'motion/react';
import {useEffect, useMemo, useState} from 'react';
import {Outlet, useLocation, useNavigate} from 'react-router-dom';

const ICONS = {home: HomeIcon, server: ServerIcon, moment: ImageIcon, about: Users, donate: Heart};

function isActive(route: string, pathname: string): boolean {
  if (route === '/') return pathname === '/' || pathname === '';
  return pathname === route || pathname.startsWith(`${route}/`);
}

export default function MainLayout() {
  const {data, resolveAsset, resolveUrl, previewActive} = useSiteData();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const navigation = useMemo(() => data.navigation.filter((item) => item.enabled), [data.navigation]);
  const copy = data.site.copy;

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleNav = (route: string) => {
    if (location.pathname !== route) navigate(route);
  };

  return (
    <div className="min-h-screen bg-bg-dark selection:bg-brand-primary/30">
      <nav
        className={cn(
          'fixed top-0 left-0 right-0 z-50 transition-all duration-300 border-b',
          scrolled ? 'bg-bg-dark/80 backdrop-blur-md border-border-dark py-3' : 'bg-transparent border-transparent py-6',
        )}
      >
        <div className="max-w-7xl mx-auto px-6 flex items-center justify-between">
          <button type="button" className="flex items-center gap-3 cursor-pointer" onClick={() => handleNav('/') }>
            <div className="w-10 h-10 flex items-center justify-center overflow-hidden">
              <img src={resolveAsset(data.site.brand.logo)} alt={data.site.brand.shortName} className="w-8 h-8 object-contain" />
            </div>
            <span className="text-xl font-bold tracking-tight text-white hidden sm:block">{data.site.brand.shortName}</span>
          </button>

          <div className="hidden md:flex items-center gap-1">
            {navigation.map((item) => {
              const Icon = ICONS[item.id as keyof typeof ICONS] ?? HomeIcon;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => handleNav(item.route)}
                  className={cn(
                    'px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2',
                    isActive(item.route, location.pathname) ? 'bg-brand-primary/10 text-brand-primary' : 'text-slate-400 hover:text-white hover:bg-white/5',
                  )}
                >
                  <Icon size={16} />
                  {item.label}
                </button>
              );
            })}
          </div>

          <div className="flex items-center gap-4">
            {data.site.hero.primaryAction && (
              <a href={resolveUrl(data.site.hero.primaryAction.url)} target={data.site.hero.primaryAction.url.startsWith('/') ? undefined : '_blank'} rel={data.site.hero.primaryAction.url.startsWith('/') ? undefined : 'noopener noreferrer'} className="bg-brand-primary hover:bg-brand-secondary text-white px-5 py-2 rounded-lg text-sm font-semibold transition-all shadow-lg shadow-brand-primary/20 flex items-center gap-2">
                {data.site.hero.primaryAction.label}
                <ChevronRight size={16} />
              </a>
            )}
            <button type="button" aria-label={isMenuOpen ? copy.navigation.closeMenu : copy.navigation.openMenu} className="md:hidden text-slate-400 hover:text-white" onClick={() => setIsMenuOpen((open) => !open)}>
              {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
      </nav>

      <AnimatePresence>
        {isMenuOpen && (
          <motion.div initial={{opacity: 0, y: -20}} animate={{opacity: 1, y: 0}} exit={{opacity: 0, y: -20}} className="fixed inset-0 z-40 bg-bg-dark pt-24 px-6 md:hidden">
            <div className="flex flex-col gap-2">
              {navigation.map((item) => {
                const Icon = ICONS[item.id as keyof typeof ICONS] ?? HomeIcon;
                return (
                  <button key={item.id} type="button" onClick={() => { handleNav(item.route); setIsMenuOpen(false); }} className={cn('w-full px-6 py-4 rounded-xl text-lg font-medium flex items-center gap-4 transition-all', isActive(item.route, location.pathname) ? 'bg-brand-primary/10 text-brand-primary' : 'text-slate-400 hover:bg-white/5')}>
                    <Icon size={20} />
                    {item.label}
                  </button>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <main className="pt-20">
        <DataSyncStatus />
        {previewActive && <div className="sticky top-0 z-40 border-b border-amber-300/30 bg-amber-300/10 px-4 py-2 text-center text-xs text-amber-100">当前显示未提交草稿预览</div>}
        <Outlet />
      </main>

      <footer className="bg-neutral-950 border-t border-border-dark py-16 mt-20">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            <div className="space-y-6">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 flex items-center justify-center overflow-hidden"><img src={resolveAsset(data.site.brand.logo)} alt={data.site.brand.shortName} className="w-6 h-6 object-contain" /></div>
                <span className="text-xl font-bold text-white">{data.site.brand.name}</span>
              </div>
              <p className="text-slate-400 max-w-xs leading-relaxed">{data.site.footer.description}</p>
            </div>

            <div className="space-y-6">
              <h4 className="text-white font-semibold">{copy.navigation.quickLinks}</h4>
              <div className="grid grid-cols-2 gap-4">
                {navigation.map((item) => <button key={item.id} type="button" onClick={() => handleNav(item.route)} className="text-slate-400 hover:text-brand-primary transition-colors text-sm text-left">{item.label}</button>)}
              </div>
            </div>

            <div className="space-y-6">
              <h4 className="text-white font-semibold">{copy.navigation.contact}</h4>
              <div className="space-y-4">
                {data.contact.map((contact) => (
                  <div key={contact.id} className="group relative flex items-center gap-3 text-slate-400">
                    <div className="w-10 h-10 rounded-full overflow-hidden border border-border-dark relative bg-white/5">
                      {contact.avatar && <img src={contact.avatar} alt="" className="w-full h-full object-cover" />}
                      {contact.image && <img src={resolveAsset(contact.image)} alt="" className="absolute bottom-0 right-0 w-4 h-4" />}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-white">{contact.label}</p>
                      {contact.type === 'link' ? <a href={resolveUrl(contact.value)} target={contact.value.startsWith('/') ? undefined : '_blank'} rel={contact.value.startsWith('/') ? undefined : 'noopener noreferrer'} className="text-xs hover:text-brand-primary">{contact.value}</a> : <p className="text-xs">{contact.value}</p>}
                    </div>
                    {contact.image && <div className="absolute bottom-full left-0 mb-2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50"><div className="bg-white p-2 rounded-xl shadow-2xl"><img src={resolveAsset(contact.image)} alt={contact.hint ?? contact.label} className="w-32 h-32 object-contain" /><p className="text-[10px] text-center text-slate-900 font-bold mt-1">{contact.hint ?? contact.label}</p></div></div>}
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="mt-16 pt-8 border-t border-border-dark flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-slate-500 text-sm">{data.site.footer.copyright} {new Date().getFullYear()}</p>
            <a href={`https://github.com/${data.site.repository.owner}/${data.site.repository.name}`} target="_blank" rel="noopener noreferrer" aria-label="GitHub" className="text-slate-500 hover:text-white transition-colors"><Github size={20} /></a>
          </div>
        </div>
      </footer>
    </div>
  );
}
