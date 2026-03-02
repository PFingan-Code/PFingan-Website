import {RESOURCES, SERVER_ARCHIVES} from '@/src/constants';
import {cn} from '@/src/lib/utils';
import {
  Archive,
  ChevronRight,
  Download,
  ExternalLink,
  FileCode,
  Shield,
  Zap,
} from 'lucide-react';
import {AnimatePresence, motion} from 'motion/react';
import {useState} from 'react';

export default function ServerPage() {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const currentServers = SERVER_ARCHIVES.filter((s) => s.status === 'active');
  const pastServers = SERVER_ARCHIVES.filter((s) => s.status === 'closed');

  return (
    <motion.div
      initial={{opacity: 0, y: 20}}
      animate={{opacity: 1, y: 0}}
      exit={{opacity: 0, y: 20}}
      className="max-w-7xl mx-auto px-6 py-12 space-y-20"
    >
      <div className="text-center max-w-2xl mx-auto space-y-4">
        <h2 className="text-4xl font-bold text-white">服务器开服情况</h2>
        <p className="text-slate-400">
          这里统计了 PFingan 所有服务器的开服情况与历史存档。
        </p>
      </div>

      {currentServers.length > 0 && (
        <div className="space-y-8">
          <h3 className="text-2xl font-bold text-white border-l-4 border-brand-primary pl-4">
            当前运行
          </h3>
          <div className="grid grid-cols-1 gap-8">
            {currentServers.map((archive) => (
              <ServerCard
                key={archive.id}
                archive={archive}
                isExpanded={expandedId === archive.id}
                onToggle={() =>
                  setExpandedId(expandedId === archive.id ? null : archive.id)
                }
              />
            ))}
          </div>
        </div>
      )}

      <div className="space-y-8">
        <h3 className="text-2xl font-bold text-white border-l-4 border-slate-700 pl-4">
          全部记录
        </h3>
        <div className="grid grid-cols-1 gap-8">
          {pastServers.map((archive) => (
            <ServerCard
              key={archive.id}
              archive={archive}
              isExpanded={expandedId === archive.id}
              onToggle={() =>
                setExpandedId(expandedId === archive.id ? null : archive.id)
              }
            />
          ))}
        </div>
      </div>

      {RESOURCES.length > 0 && (
        <div className="space-y-8">
          <h3 className="text-2xl font-bold text-white border-l-4 border-emerald-500 pl-4">
            相关资源与工具
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {RESOURCES.map((item) => (
              <ResourceCard key={item.id} item={item} />
            ))}
          </div>
        </div>
      )}
    </motion.div>
  );
}

function ServerCard({
  archive,
  isExpanded,
  onToggle,
}: {
  archive: any;
  isExpanded: boolean;
  onToggle: () => void;
}) {
  const hasDetails = archive.rules || archive.mods || archive.ip || archive.seed;

  return (
    <div className="glass-panel rounded-3xl overflow-hidden flex flex-col lg:flex-row">
      <div className="lg:w-1/3 bg-white/5 p-8 flex flex-col justify-between border-b lg:border-b-0 lg:border-r border-border-dark">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="px-3 py-1 rounded-full bg-brand-primary/10 text-brand-primary text-xs font-bold">
              {archive.version}
            </span>
            <span
              className={cn(
                'text-xs font-bold uppercase tracking-widest',
                archive.status === 'active'
                  ? 'text-emerald-400'
                  : 'text-slate-500',
              )}
            >
              {archive.status === 'active' ? '运行中' : '已关服'}
            </span>
          </div>
          <h3 className="text-2xl font-bold text-white">{archive.title}</h3>
          <div className="flex flex-wrap gap-2">
            {archive.tags.map((tag: string) => (
              <span
                key={tag}
                className="text-[10px] px-2 py-0.5 rounded bg-neutral-800 text-slate-400 border border-white/5"
              >
                {tag}
              </span>
            ))}
          </div>
        </div>
        <div className="mt-8 space-y-1">
          <p className="text-xs text-slate-500 uppercase font-bold tracking-wider">
            存活时间
          </p>
          <p className="text-lg font-mono text-white">
            {archive.days > 0 ? `${archive.days} 天` : '长期'}
          </p>
          <p className="text-xs text-slate-400">{archive.period}</p>
        </div>
      </div>

      <div className="lg:w-2/3 p-8 space-y-8">
        <div className="flex justify-between items-start gap-4">
          <div className="flex-1">
            {archive.description && (
              <p className="text-slate-400 text-sm leading-relaxed">
                {archive.description}
              </p>
            )}
          </div>
          {hasDetails && (
            <button
              onClick={onToggle}
              className="text-brand-primary text-xs font-bold flex items-center gap-1 hover:underline whitespace-nowrap"
            >
              {isExpanded ? '收起详情' : '展开详情'}
              <ChevronRight
                size={14}
                className={cn(
                  'transition-transform',
                  isExpanded && 'rotate-90',
                )}
              />
            </button>
          )}
        </div>

        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{height: 0, opacity: 0}}
              animate={{height: 'auto', opacity: 1}}
              exit={{height: 0, opacity: 0}}
              className="overflow-hidden space-y-8"
            >
              {(archive.ip || archive.seed) && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-4 border-t border-white/5">
                  {archive.ip && (
                    <div className="space-y-1">
                      <p className="text-xs text-slate-500 font-bold uppercase">
                        服务器 IP
                      </p>
                      <p className="text-white font-mono">{archive.ip}</p>
                    </div>
                  )}
                  {archive.seed && (
                    <div className="space-y-1">
                      <p className="text-xs text-slate-500 font-bold uppercase">
                        地图种子
                      </p>
                      <p className="text-white font-mono">{archive.seed}</p>
                    </div>
                  )}
                </div>
              )}

              {archive.mods && (
                <div className="space-y-3">
                  <h4 className="text-sm font-bold text-white flex items-center gap-2">
                    <Zap size={16} className="text-brand-primary" />
                    启用模组
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {archive.mods.map((mod: string) => (
                      <div
                        key={mod}
                        className="flex items-center gap-2 text-xs text-slate-400"
                      >
                        <div className="w-1 h-1 rounded-full bg-brand-primary" />
                        {mod}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {archive.rules && (
                <div className="space-y-3">
                  <h4 className="text-sm font-bold text-white flex items-center gap-2">
                    <Shield size={16} className="text-brand-primary" />
                    核心规则
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {archive.rules.map((rule: string) => (
                      <span
                        key={rule}
                        className="px-3 py-1 rounded-lg bg-white/5 text-xs text-slate-300 border border-white/5"
                      >
                        {rule}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {archive.attachments && (
          <div className="space-y-3 pt-4 border-t border-white/5">
            <h4 className="text-sm font-bold text-white flex items-center gap-2">
              <Download size={16} className="text-brand-primary" />
              附件
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {archive.attachments.map((file: any, idx: number) => (
                <a
                  key={idx}
                  href={file.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-4 rounded-xl bg-neutral-900 border border-border-dark hover:border-brand-primary/50 transition-all group flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-white/5 flex items-center justify-center text-slate-400 group-hover:text-brand-primary overflow-hidden">
                      <Archive size={18} />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-white">
                        {file.name}
                      </p>
                      {file.code && (
                        <p className="text-[10px] text-slate-500">
                          提取码: {file.code}
                        </p>
                      )}
                    </div>
                  </div>
                  <ExternalLink
                    size={14}
                    className="text-slate-600 group-hover:text-brand-primary"
                  />
                </a>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function ResourceCard({item}: {item: any}) {
  return (
    <div className="glass-panel rounded-3xl p-8 space-y-6">
      <div className="space-y-3">
        <div className="flex items-center justify-between gap-4">
          <h3 className="text-2xl font-bold text-white">{item.title}</h3>
          {item.period && (
            <span className="text-xs text-slate-500 font-mono whitespace-nowrap">
              {item.period}
            </span>
          )}
        </div>
        {item.tags && (
          <div className="flex flex-wrap gap-2">
            {item.tags.map((tag: string) => (
              <span
                key={tag}
                className="text-[10px] px-2 py-0.5 rounded bg-neutral-800 text-slate-400 border border-white/5"
              >
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>

      {item.description && (
        <p className="text-slate-400 text-sm leading-relaxed">
          {item.description}
        </p>
      )}

      {item.attachments && item.attachments.length > 0 && (
        <div className="space-y-3 pt-4 border-t border-white/5">
          <h4 className="text-sm font-bold text-white flex items-center gap-2">
            <Download size={16} className="text-brand-primary" />
            附件
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {item.attachments.map((file: any, idx: number) => (
              <a
                key={idx}
                href={file.url}
                target="_blank"
                rel="noopener noreferrer"
                className="p-4 rounded-xl bg-neutral-900 border border-border-dark hover:border-brand-primary/50 transition-all group flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-white/5 flex items-center justify-center text-slate-400 group-hover:text-brand-primary overflow-hidden">
                    {file.icon ? (
                      <img
                        src={file.icon}
                        alt="icon"
                        className="w-6 h-6 object-contain"
                      />
                    ) : (
                      <FileCode size={18} />
                    )}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-white">
                      {file.name}
                    </p>
                    {file.code && (
                      <p className="text-[10px] text-slate-500">
                        提取码: {file.code}
                      </p>
                    )}
                  </div>
                </div>
                <ExternalLink
                  size={14}
                  className="text-slate-600 group-hover:text-brand-primary"
                />
              </a>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

