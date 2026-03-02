import {BASE_URL, HOME_FEATURES, MOMENTS} from '@/src/constants';
import {cn} from '@/src/lib/utils';
import {ChevronRight, Clock, Heart, Shield, Zap} from 'lucide-react';
import {motion} from 'motion/react';
import {useNavigate} from 'react-router-dom';

const TAB_PATHS: Record<string, string> = {
  home: '/',
  server: '/server',
  moment: '/moment',
  about: '/about',
  donate: '/donate',
};

export default function HomePage() {
  const navigate = useNavigate();

  const goToTab = (tab: string) => {
    const path = TAB_PATHS[tab] ?? '/';
    navigate(path);
  };

  return (
    <motion.div
      initial={{opacity: 0}}
      animate={{opacity: 1}}
      exit={{opacity: 0}}
      className="space-y-20"
    >
      {/* Hero */}
      <section className="relative h-[80vh] flex items-center px-6 overflow-hidden">
        <div className="absolute inset-0 z-0">
          <img
            src={BASE_URL + 'src/img/bg.png'}
            className="w-full h-full object-cover opacity-30"
            alt="Hero Background"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-bg-dark/20 via-bg-dark/60 to-bg-dark" />
        </div>

        <div className="max-w-7xl mx-auto w-full relative z-10">
          <motion.div
            initial={{y: 30, opacity: 0}}
            animate={{y: 0, opacity: 1}}
            transition={{delay: 0.2}}
            className="max-w-2xl space-y-8"
          >
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-primary/10 border border-brand-primary/20 text-brand-primary text-xs font-bold uppercase tracking-wider">
              <Zap size={14} />
              和谐温馨的生存体验
            </div>
            <h1 className="text-6xl md:text-8xl font-bold tracking-tighter text-white leading-tight">
              PFingan <br />
              <span className="text-gradient">“养老”生存</span>
            </h1>
            <p className="text-xl text-slate-400 leading-relaxed max-w-lg">
              在这里，每一块方块都承载着平凡玩家的热爱。加入我们，体验最纯粹的 Minecraft 生存乐趣。
            </p>
            <div className="flex flex-wrap gap-4 pt-4">
              <a
                href="https://jq.qq.com/?_wv=1027&k=2oUF0gg9"
                className="px-8 py-4 bg-brand-primary hover:bg-brand-secondary text-white rounded-xl font-bold transition-all shadow-xl shadow-brand-primary/20 flex items-center gap-2"
              >
                立即加入
                <ChevronRight size={20} />
              </a>
              <button
                onClick={() => goToTab('server')}
                className="px-8 py-4 bg-white/5 hover:bg-white/10 text-white border border-white/10 rounded-xl font-bold transition-all flex items-center gap-2"
              >
                查看服务器
              </button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Stats / History Preview */}
      <section className="max-w-7xl mx-auto px-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="glass-panel p-8 rounded-3xl space-y-4">
            <div className="w-12 h-12 bg-blue-500/10 rounded-2xl flex items-center justify-center text-blue-500">
              <Clock size={24} />
            </div>
            <h3 className="text-xl font-bold text-white">开服历史</h3>
            <p className="text-slate-400 text-sm leading-relaxed">
              自 2022 年以来，我们已经历了三个正式周目和多个特色临时服。
            </p>
            <div className="pt-2">
              <button
                onClick={() => goToTab('server')}
                className="text-brand-primary text-sm font-semibold flex items-center gap-1 hover:underline"
              >
                查看详情 <ChevronRight size={14} />
              </button>
            </div>
          </div>

          <div className="glass-panel p-8 rounded-3xl space-y-4">
            <div className="w-12 h-12 bg-amber-500/10 rounded-2xl flex items-center justify-center text-amber-500">
              <Shield size={24} />
            </div>
            <h3 className="text-xl font-bold text-white">公平公正</h3>
            <p className="text-slate-400 text-sm leading-relaxed">
              严格的规则管理，禁止作弊与破坏，为每一位玩家提供安全和谐的游玩环境。
            </p>
            <div className="pt-2">
              <button
                onClick={() => goToTab('about')}
                className="text-brand-primary text-sm font-semibold flex items-center gap-1 hover:underline"
              >
                了解团队 <ChevronRight size={14} />
              </button>
            </div>
          </div>

          <div className="glass-panel p-8 rounded-3xl space-y-4">
            <div className="w-12 h-12 bg-emerald-500/10 rounded-2xl flex items-center justify-center text-emerald-500">
              <Heart size={24} />
            </div>
            <h3 className="text-xl font-bold text-white">社区驱动</h3>
            <p className="text-slate-400 text-sm leading-relaxed">
              服务器的发展方向由玩家投票决定，你的每一个建议对我们都很重要。
            </p>
            <div className="pt-2">
              <button
                onClick={() => goToTab('donate')}
                className="text-brand-primary text-sm font-semibold flex items-center gap-1 hover:underline"
              >
                支持我们 <ChevronRight size={14} />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Moments */}
      <section className="max-w-7xl mx-auto px-6 py-20">
        <div className="flex justify-between items-end mb-12">
          <div>
            <h2 className="text-4xl font-bold text-white mb-4">精彩瞬间</h2>
            <p className="text-slate-400">记录我们在方块世界留下的足迹</p>
          </div>
          <button
            onClick={() => goToTab('moment')}
            className="text-brand-primary font-semibold flex items-center gap-2 hover:underline"
          >
            查看全部 <ChevronRight size={20} />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {MOMENTS.slice(0, 4).map((moment, idx) => (
            <motion.div
              key={idx}
              whileHover={{y: -5}}
              className="group relative aspect-[4/3] rounded-2xl overflow-hidden border border-border-dark cursor-pointer"
            >
              <img
                src={moment.previewUrl}
                alt={moment.description}
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-6">
                <span className="text-xs font-bold text-brand-primary uppercase mb-1">
                  {moment.category}
                </span>
                <p className="text-white font-medium">{moment.description}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Other Feature Sections */}
      <section className="max-w-7xl mx-auto px-6 py-20 border-t border-border-dark">
        <div className="mb-12">
          <h2 className="text-4xl font-bold text-white mb-4">其它功能板块</h2>
          <p className="text-slate-400">如果你想了解更多，以下是一些功能板块</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {HOME_FEATURES.map((feature, idx) => (
            <motion.div
              key={idx}
              whileHover={{y: -5}}
              onClick={() => {
                if (feature.status === '未开放') return;
                goToTab(feature.tab);
              }}
              className={cn(
                'glass-panel p-8 rounded-3xl space-y-4 cursor-pointer group transition-all',
                feature.status === '未开放' && 'opacity-60 cursor-not-allowed',
              )}
            >
              <div className="flex justify-between items-start">
                <span className="px-2 py-0.5 rounded bg-brand-primary/10 text-brand-primary text-[10px] font-bold uppercase">
                  {feature.tag}
                </span>
                <span className="text-[10px] text-slate-500">{feature.tip}</span>
              </div>
              <div className="space-y-2">
                <h3 className="text-xl font-bold text-white group-hover:text-brand-primary transition-colors">
                  {feature.title}
                </h3>
                <p className="text-slate-400 text-sm leading-relaxed">
                  {feature.description}
                </p>
              </div>
              {feature.status === '未开放' && (
                <div className="pt-2">
                  <span className="text-[10px] text-red-400 font-bold uppercase tracking-widest">
                    {feature.status}
                  </span>
                </div>
              )}
            </motion.div>
          ))}
        </div>
      </section>
    </motion.div>
  );
}

