import {BASE_URL} from '@/src/constants';
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
import {useEffect, useState} from 'react';
import {Outlet, useLocation, useNavigate} from 'react-router-dom';

const NAV_ITEMS = [
  {id: 'home', label: '首页', icon: HomeIcon},
  {id: 'server', label: '服务器', icon: ServerIcon},
  {id: 'moment', label: '瞬间', icon: ImageIcon},
  {id: 'about', label: '关于', icon: Users},
  {id: 'donate', label: '赞助', icon: Heart},
] as const;

const TAB_PATHS: Record<string, string> = {
  home: '/',
  server: '/server',
  moment: '/moment',
  about: '/about',
  donate: '/donate',
};

function getPathById(id: string): string {
  return TAB_PATHS[id] ?? '/';
}

function isActive(id: string, pathname: string): boolean {
  const target = getPathById(id);
  if (id === 'home') {
    return pathname === '/' || pathname === '';
  }
  return pathname === target || pathname.startsWith(target + '/');
}

export default function MainLayout() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleNav = (id: string) => {
    const path = getPathById(id);
    if (location.pathname === path) return;
    navigate(path);
  };

  const handleNavAndClose = (id: string) => {
    handleNav(id);
    setIsMenuOpen(false);
  };

  return (
    <div className="min-h-screen bg-bg-dark selection:bg-brand-primary/30">
      {/* Navigation */}
      <nav
        className={cn(
          'fixed top-0 left-0 right-0 z-50 transition-all duration-300 border-b',
          scrolled
            ? 'bg-bg-dark/80 backdrop-blur-md border-border-dark py-3'
            : 'bg-transparent border-transparent py-6',
        )}
      >
        <div className="max-w-7xl mx-auto px-6 flex items-center justify-between">
          <button
            type="button"
            className="flex items-center gap-3 cursor-pointer"
            onClick={() => handleNav('home')}
          >
            <div className="w-10 h-10 flex items-center justify-center overflow-hidden">
              <img
                src={BASE_URL + 'src/img/ico.png'}
                alt="Logo"
                className="w-8 h-8 object-contain"
              />
            </div>
            <span className="text-xl font-bold tracking-tight text-white hidden sm:block">
              PFingan
            </span>
          </button>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-1">
            {NAV_ITEMS.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => handleNav(item.id)}
                className={cn(
                  'px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2',
                  isActive(item.id, location.pathname)
                    ? 'bg-brand-primary/10 text-brand-primary'
                    : 'text-slate-400 hover:text-white hover:bg-white/5',
                )}
              >
                <item.icon size={16} />
                {item.label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-4">
            <a
              href="https://jq.qq.com/?_wv=1027&k=2oUF0gg9"
              target="_blank"
              rel="noopener noreferrer"
              className="bg-brand-primary hover:bg-brand-secondary text-white px-5 py-2 rounded-lg text-sm font-semibold transition-all shadow-lg shadow-brand-primary/20 flex items-center gap-2"
            >
              加入我们
              <ChevronRight size={16} />
            </a>
            <button
              type="button"
              className="md:hidden text-slate-400 hover:text-white"
              onClick={() => setIsMenuOpen((open) => !open)}
            >
              {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isMenuOpen && (
          <motion.div
            initial={{opacity: 0, y: -20}}
            animate={{opacity: 1, y: 0}}
            exit={{opacity: 0, y: -20}}
            className="fixed inset-0 z-40 bg-bg-dark pt-24 px-6 md:hidden"
          >
            <div className="flex flex-col gap-2">
              {NAV_ITEMS.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => handleNavAndClose(item.id)}
                  className={cn(
                    'w-full px-6 py-4 rounded-xl text-lg font-medium flex items-center gap-4 transition-all',
                    isActive(item.id, location.pathname)
                      ? 'bg-brand-primary/10 text-brand-primary'
                      : 'text-slate-400 hover:bg-white/5',
                  )}
                >
                  <item.icon size={20} />
                  {item.label}
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <main className="pt-20">
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="bg-neutral-950 border-t border-border-dark py-16 mt-20">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            <div className="space-y-6">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 flex items-center justify-center overflow-hidden">
                  <img
                    src={BASE_URL + 'src/img/ico.png'}
                    alt="Logo"
                    className="w-6 h-6 object-contain"
                  />
                </div>
                <span className="text-xl font-bold text-white">PFingan</span>
              </div>
              <p className="text-slate-400 max-w-xs leading-relaxed">
                和谐温馨的“肝帝”生存服务器，记录平凡玩家的不平凡瞬间。加入我们，开启你的生存之旅。
              </p>
            </div>

            <div className="space-y-6">
              <h4 className="text-white font-semibold">快速链接</h4>
              <div className="grid grid-cols-2 gap-4">
                {NAV_ITEMS.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => handleNav(item.id)}
                    className="text-slate-400 hover:text-brand-primary transition-colors text-sm text-left"
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-6">
              <h4 className="text-white font-semibold">联系我们</h4>
              <div className="space-y-4">
                <div className="group relative flex items-center gap-3 text-slate-400 cursor-help">
                  <div className="w-10 h-10 rounded-full overflow-hidden border border-border-dark relative">
                    <img
                      src="https://q1.qlogo.cn/g?b=qq&nk=1377820366&s=640"
                      alt="Owner"
                      className="w-full h-full object-cover"
                    />
                    <img
                      src={BASE_URL + 'src/img/qq1.png'}
                      alt="QQ"
                      className="absolute bottom-0 right-0 w-4 h-4"
                    />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-white">服主 QQ</p>
                    <p className="text-xs">1377820366</p>
                  </div>
                  {/* QR Popover */}
                  <div className="absolute bottom-full left-0 mb-2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">
                    <div className="bg-white p-2 rounded-xl shadow-2xl">
                      <img
                        src={BASE_URL + 'src/img/qq1.png'}
                        alt="Owner QR"
                        className="w-32 h-32 object-contain"
                      />
                      <p className="text-[10px] text-center text-slate-900 font-bold mt-1">
                        扫码联系服主
                      </p>
                    </div>
                  </div>
                </div>
                <div className="group relative flex items-center gap-3 text-slate-400 cursor-help">
                  <div className="w-10 h-10 rounded-full overflow-hidden border border-border-dark relative">
                    <img
                      src="https://p.qlogo.cn/gh/726741344/726741344/640"
                      alt="Group"
                      className="w-full h-full object-cover"
                    />
                    <img
                      src={BASE_URL + 'src/img/qq2.png'}
                      alt="QQ"
                      className="absolute bottom-0 right-0 w-4 h-4"
                    />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-white">官方 QQ 群</p>
                    <p className="text-xs">726741344</p>
                  </div>
                  {/* QR Popover */}
                  <div className="absolute bottom-full left-0 mb-2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">
                    <div className="bg-white p-2 rounded-xl shadow-2xl">
                      <img
                        src={BASE_URL + 'src/img/qq2.png'}
                        alt="Group QR"
                        className="w-32 h-32 object-contain"
                      />
                      <p className="text-[10px] text-center text-slate-900 font-bold mt-1">
                        扫码加入群聊
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-16 pt-8 border-t border-border-dark flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-slate-500 text-sm">
              版权 © 2022-2025 PFingan. 版权所有.
            </p>
            <div className="flex items-center gap-6">
              <a
                href="https://github.com/LoosePrince/PFingan-Website"
                className="text-slate-500 hover:text-white transition-colors"
              >
                <Github size={20} />
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

