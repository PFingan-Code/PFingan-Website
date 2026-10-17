const HEX_COLOR = /^#[0-9a-fA-F]{6}$/;

export default function ColorPicker({label, value, onChange}: {label: string; value: string; onChange: (value: string) => void}) {
  const pickerValue = HEX_COLOR.test(value) ? value : '#000000';
  return <label className="block space-y-2"><span className="text-xs font-medium text-slate-400">{label}</span><div className="flex items-center gap-2"><input type="color" aria-label={`${label}调色盘`} value={pickerValue} onChange={(event) => onChange(event.target.value.toLowerCase())} className="h-10 w-12 cursor-pointer rounded-lg border border-border-dark bg-transparent p-1" /><input value={value} onChange={(event) => onChange(event.target.value)} placeholder="#00a4ff" inputMode="text" spellCheck={false} className="min-w-0 flex-1 rounded-lg border border-border-dark bg-black/20 px-3 py-2.5 font-mono text-sm text-white outline-none transition focus:border-brand-primary" /></div></label>;
}
