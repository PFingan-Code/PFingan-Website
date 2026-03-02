import {MOMENTS} from '@/src/constants';
import {cn} from '@/src/lib/utils';
import {Clock, ExternalLink, Zap} from 'lucide-react';
import {motion} from 'motion/react';
import {useState} from 'react';

export default function MomentPage() {
  const [filter, setFilter] = useState('全部');
  const categories = ['全部', '一周目', '二周目', '三周目', '临时服', '视频', '其它'];

  const filteredMoments =
    filter === '全部'
      ? MOMENTS
      : MOMENTS.filter((m) => m.category === filter);

  const groupedMoments =
    filter === '全部'
      ? categories
          .filter((c) => c !== '全部')
          .map((cat) => ({
            category: cat,
            items: MOMENTS.filter((m) => m.category === cat),
          }))
          .filter((group) => group.items.length > 0)
      : [{category: filter, items: filteredMoments}];

  return (
    <motion.div
      initial={{opacity: 0, scale: 0.95}}
      animate={{opacity: 1, scale: 1}}
      exit={{opacity: 0, scale: 0.95}}
      className="max-w-7xl mx-auto px-6 py-12 space-y-12"
    >
      <div className="flex flex-col md:flex-row justify-between items-center gap-6">
        <div>
          <h2 className="text-4xl font-bold text-white mb-2">瞬间</h2>
          <p className="text-slate-400">你所热爱的，就是你的生活。</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setFilter(cat)}
              className={cn(
                'px-4 py-2 rounded-full text-sm font-medium transition-all',
                filter === cat
                  ? 'bg-brand-primary text-white shadow-lg shadow-brand-primary/20'
                  : 'bg-white/5 text-slate-400 hover:text-white hover:bg-white/10',
              )}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-16">
        {groupedMoments.map((group, gIdx) => (
          <div key={gIdx} className="space-y-8">
            {filter === '全部' && (
              <div className="flex items-center gap-4">
                <h3 className="text-xl font-bold text-white whitespace-nowrap">
                  {group.category}
                </h3>
                <div className="h-px w-full bg-border-dark" />
              </div>
            )}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {group.items.map((moment, idx) => {
                if (moment.url === '') return null;
                return (
                  <motion.div
                    layout
                    key={`${group.category}-${idx}`}
                    initial={{opacity: 0}}
                    animate={{opacity: 1}}
                    className="group glass-panel rounded-2xl overflow-hidden cursor-pointer"
                  >
                    <div className="aspect-video relative overflow-hidden">
                      <img
                        src={moment.previewUrl}
                        alt={moment.description}
                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                      />
                      {moment.type === 'video' && (
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className="w-16 h-16 bg-brand-primary/90 rounded-full flex items-center justify-center text-white shadow-2xl scale-90 group-hover:scale-100 transition-transform">
                            <Zap size={32} fill="currentColor" />
                          </div>
                        </div>
                      )}
                      <div className="absolute top-4 left-4">
                        <span className="px-2 py-1 rounded bg-black/60 backdrop-blur-md text-[10px] font-bold text-white uppercase tracking-wider">
                          {moment.category}
                        </span>
                      </div>
                    </div>
                    <div className="p-6 space-y-2">
                      <p className="text-white font-medium line-clamp-1">
                        {moment.description}
                      </p>
                      {moment.date && (
                        <div className="flex items-center gap-2 text-slate-500 text-xs">
                          <Clock size={12} />
                          {moment.date}
                        </div>
                      )}
                      <a
                        href={moment.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="pt-2 text-brand-primary text-xs font-bold flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        查看详情 <ExternalLink size={12} />
                      </a>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </motion.div>
  );
}

