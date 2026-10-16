import {useSiteData} from '@/src/data/SiteDataProvider';
import {cn} from '@/src/lib/utils';
import type {ExternalFeatureId, HomeFeature} from '@/src/types/site-data';
import {ChevronRight, Clock, ExternalLink, Heart, Shield, Zap} from 'lucide-react';
import {motion} from 'motion/react';
import {useNavigate} from 'react-router-dom';

const ICONS = {clock: Clock, shield: Shield, heart: Heart};
const HIGHLIGHT_STYLES: Record<string, string> = {
  blue: 'text-blue-500 bg-blue-500/10',
  amber: 'text-amber-500 bg-amber-500/10',
  brand: 'text-brand-primary bg-brand-primary/10',
};

export default function HomePage() {
  const {data, resolveAsset, resolveUrl} = useSiteData();
  const copy = data.site.copy.home;
  const navigate = useNavigate();
  const featured = data.home.featuredMomentIds.map((id) => data.moments.items.find((moment) => moment.id === id)).filter(Boolean);
  const configuredExternalFeatures: HomeFeature[] = (Object.entries(data.site.externalFeatures) as Array<[ExternalFeatureId, (typeof data.site.externalFeatures)[ExternalFeatureId]]>)
    .filter(([, feature]) => feature.enabled && Boolean(feature.url))
    .map(([id, feature]) => ({
      id: `external-${id}`,
      title: feature.label ?? id,
      tip: copy.externalFeatureTip,
      tag: feature.label ?? id,
      description: feature.description ?? '',
      target: {type: 'external', value: feature.url!},
      enabled: true,
    }));
  const enabledFeatures = [...data.features.filter((feature) => feature.enabled || feature.target.type !== 'feature'), ...configuredExternalFeatures];
  const announcements = [...data.announcements].sort((a, b) => Number(b.pinned ?? false) - Number(a.pinned ?? false) || b.date.localeCompare(a.date));

  return (
    <motion.div initial={{opacity: 0}} animate={{opacity: 1}} exit={{opacity: 0}} className="space-y-20">
      <section className="relative min-h-[80vh] flex items-center px-6 overflow-hidden">
        <div className="absolute inset-0 z-0">
          <img src={resolveAsset(data.site.hero.background)} className="w-full h-full object-cover opacity-30" alt="" />
          <div className="absolute inset-0 bg-gradient-to-b from-bg-dark/20 via-bg-dark/60 to-bg-dark" />
        </div>
        <div className="max-w-7xl mx-auto w-full relative z-10">
          <motion.div initial={{y: 30, opacity: 0}} animate={{y: 0, opacity: 1}} transition={{delay: 0.2}} className="max-w-2xl space-y-8">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-primary/10 border border-brand-primary/20 text-brand-primary text-xs font-bold uppercase tracking-wider"><Zap size={14} />{data.site.hero.badge}</div>
            <h1 className="text-6xl md:text-8xl font-bold tracking-tighter text-white leading-tight">{data.site.hero.title}{data.site.hero.subtitle && <><br /><span className="text-gradient">{data.site.hero.subtitle}</span></>}</h1>
            <p className="text-xl text-slate-400 leading-relaxed max-w-lg">{data.site.hero.description}</p>
            <div className="flex flex-wrap gap-4 pt-4">
              {data.site.hero.primaryAction && <a href={resolveUrl(data.site.hero.primaryAction.url)} target={data.site.hero.primaryAction.url.startsWith('/') ? undefined : '_blank'} rel={data.site.hero.primaryAction.url.startsWith('/') ? undefined : 'noopener noreferrer'} className="px-8 py-4 bg-brand-primary hover:bg-brand-secondary text-white rounded-xl font-bold transition-all shadow-xl shadow-brand-primary/20 flex items-center gap-2">{data.site.hero.primaryAction.label}<ChevronRight size={20} /></a>}
              {data.site.hero.secondaryAction && <button type="button" onClick={() => navigate(data.site.hero.secondaryAction!.route)} className="px-8 py-4 bg-white/5 hover:bg-white/10 text-white border border-white/10 rounded-xl font-bold transition-all flex items-center gap-2">{data.site.hero.secondaryAction.label}</button>}
            </div>
          </motion.div>
        </div>
      </section>

      {announcements.length > 0 && <section className="max-w-7xl mx-auto px-6"><div className="glass-panel rounded-2xl border-brand-primary/20 p-6 space-y-4"><div className="flex items-center justify-between gap-4"><h2 className="text-xl font-bold text-white">{copy.announcementsTitle}</h2><span className="text-xs text-slate-500">{announcements.length} {copy.announcementCountSuffix}</span></div><div className="grid gap-3 md:grid-cols-2">{announcements.map((announcement) => <article key={announcement.id} className="rounded-xl bg-white/5 p-4"><div className="flex items-start justify-between gap-3"><h3 className="font-semibold text-white">{announcement.title}</h3><time className="shrink-0 text-xs text-slate-500">{announcement.date}</time></div><p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-slate-400">{announcement.content}</p></article>)}</div></div></section>}

      {data.home.highlights.length > 0 && <section className="max-w-7xl mx-auto px-6"><div className="grid grid-cols-1 md:grid-cols-3 gap-8">{data.home.highlights.map((item) => { const Icon = ICONS[item.icon as keyof typeof ICONS] ?? Heart; return <div key={item.id} className="glass-panel p-8 rounded-3xl space-y-4"><div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${HIGHLIGHT_STYLES[item.color] ?? HIGHLIGHT_STYLES.brand}`}><Icon size={24} /></div><h3 className="text-xl font-bold text-white">{item.title}</h3><p className="text-slate-400 text-sm leading-relaxed">{item.description}</p>{item.action && <button type="button" onClick={() => navigate(item.action!.route)} className="text-brand-primary text-sm font-semibold flex items-center gap-1 hover:underline">{item.action.label}<ChevronRight size={14} /></button>}</div>; })}</div></section>}

      {featured.length > 0 && <section className="max-w-7xl mx-auto px-6 py-20"><div className="flex justify-between items-end mb-12"><div><h2 className="text-4xl font-bold text-white mb-4">{copy.momentsTitle}</h2><p className="text-slate-400">{copy.momentsDescription}</p></div><button type="button" onClick={() => navigate('/moment')} className="text-brand-primary font-semibold flex items-center gap-2 hover:underline">{copy.viewAll}<ChevronRight size={20} /></button></div><div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">{featured.map((moment) => moment && <motion.div key={moment.id} whileHover={{y: -5}} className="group relative aspect-[4/3] rounded-2xl overflow-hidden border border-border-dark"><img src={resolveAsset(moment.previewUrl)} alt={moment.description} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" /><div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-6"><span className="text-xs font-bold text-brand-primary uppercase mb-1">{data.moments.categories.find((category) => category.id === moment.categoryId)?.label}</span><p className="text-white font-medium">{moment.description}</p></div></motion.div>)}</div></section>}

      {enabledFeatures.length > 0 && <section className="max-w-7xl mx-auto px-6 py-20 border-t border-border-dark"><div className="mb-12"><h2 className="text-4xl font-bold text-white mb-4">{copy.featuresTitle}</h2><p className="text-slate-400">{copy.featuresDescription}</p></div><div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">{enabledFeatures.map((feature) => { const external = feature.target.type === 'external'; return <div key={feature.id} onClick={() => { if (!feature.enabled) return; if (external) window.open(feature.target.value, '_blank', 'noopener,noreferrer'); else if (feature.target.type === 'route') navigate(feature.target.value); }} className={cn('glass-panel p-8 rounded-3xl space-y-4 group transition-all', feature.enabled ? 'cursor-pointer hover:-translate-y-1' : 'opacity-60 cursor-not-allowed')}><div className="flex justify-between items-start"><span className="px-2 py-0.5 rounded bg-brand-primary/10 text-brand-primary text-[10px] font-bold uppercase">{feature.tag}</span><span className="text-[10px] text-slate-500 flex items-center gap-1">{feature.tip}{feature.target.type === 'external' && <ExternalLink size={11} />}</span></div><div className="space-y-2"><h3 className="text-xl font-bold text-white group-hover:text-brand-primary transition-colors">{feature.title}</h3><p className="text-slate-400 text-sm leading-relaxed">{feature.description}</p></div>{!feature.enabled && <span className="text-[10px] text-amber-400 font-bold uppercase tracking-widest">{feature.disabledReason ?? '未配置'}</span>}</div>; })}</div></section>}
    </motion.div>
  );
}
