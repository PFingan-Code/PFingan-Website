import {Clock, Globe, Heart, Image, Server, Shield, Sparkles, Star, Users} from 'lucide-react';

const OPTIONS = [
  {id: 'clock', label: '时钟', icon: Clock},
  {id: 'shield', label: '盾牌', icon: Shield},
  {id: 'heart', label: '爱心', icon: Heart},
  {id: 'sparkles', label: '闪光', icon: Sparkles},
  {id: 'users', label: '成员', icon: Users},
  {id: 'server', label: '服务器', icon: Server},
  {id: 'image', label: '图片', icon: Image},
  {id: 'globe', label: '地球', icon: Globe},
  {id: 'star', label: '星标', icon: Star},
] as const;

export default function IconPicker({label, value, onChange}: {label: string; value: string; onChange: (value: string) => void}) {
  return <label className="block space-y-2"><span className="text-xs font-medium text-slate-400">{label}</span><select value={value} onChange={(event) => onChange(event.target.value)} className="w-full rounded-lg border border-border-dark bg-neutral-950 px-3 py-2.5 text-sm text-white outline-none focus:border-brand-primary">{OPTIONS.map(({id, label: optionLabel, icon: Icon}) => <option key={id} value={id}>{optionLabel}</option>)}</select><span className="inline-flex items-center gap-2 text-xs text-slate-500">{(() => { const Icon = OPTIONS.find((option) => option.id === value)?.icon ?? Heart; return <Icon size={16} className="text-brand-primary" />; })()}{OPTIONS.find((option) => option.id === value)?.label ?? '图标'}</span></label>;
}
