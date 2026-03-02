import {BASE_URL, TEAM_MEMBERS} from '@/src/constants';
import {Github, Users} from 'lucide-react';
import {motion} from 'motion/react';
import {useEffect, useState} from 'react';

interface Player {
  id: string;
  name: string;
  avatar: string;
}

export default function AboutPage() {
  const [players, setPlayers] = useState<Player[]>([]);

  useEffect(() => {
    const loadPlayers = async () => {
      try {
        const res = await fetch(BASE_URL + 'src/GUGUbot.json');
        if (!res.ok) return;
        const data = (await res.json()) as Record<string, string>;
        const entries = Object.entries(data).sort(
          (a, b) => Number(a[0]) - Number(b[0]),
        );
        const mapped: Player[] = entries.map(([, name]) => ({
          id: name,
          name,
          avatar: `https://crafthead.net/helm/${encodeURIComponent(name)}`,
        }));
        setPlayers(mapped);
      } catch {
        // ignore fetch errors, keep default empty list
      }
    };

    loadPlayers();
  }, []);

  return (
    <motion.div
      initial={{opacity: 0}}
      animate={{opacity: 1}}
      exit={{opacity: 0}}
      className="max-w-7xl mx-auto px-6 py-12 space-y-20"
    >
      <div className="text-center max-w-2xl mx-auto space-y-4">
        <h2 className="text-4xl font-bold text-white">PFingan 团队</h2>
        <p className="text-slate-400 italic">
          “管理员在服务器内均不享有额外特权（如OP权限）”
        </p>
        <p className="text-slate-400">
          由一群热爱我的世界的人组成。我们致力于打造一个和谐、友好、开放的生存环境。
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
        {TEAM_MEMBERS.map((member) => (
          <div
            key={member.id}
            className="glass-panel p-8 rounded-3xl text-center space-y-6 group hover:border-brand-primary/30 transition-all"
          >
            <div className="relative w-24 h-24 mx-auto">
              <div className="absolute inset-0 bg-brand-primary rounded-2xl rotate-6 group-hover:rotate-12 transition-transform" />
              <img
                src={member.avatar}
                alt={member.name}
                className="relative w-full h-full object-cover rounded-2xl bg-neutral-800 border-2 border-border-dark"
              />
            </div>
            <div className="space-y-2">
              <h3 className="text-xl font-bold text-white">{member.name}</h3>
              <p className="text-brand-primary text-xs font-bold uppercase tracking-widest">
                {member.role}
              </p>
            </div>
            <p className="text-slate-400 text-sm leading-relaxed">
              {member.description}
            </p>
            {member.links && (
              <div className="flex flex-col gap-2 pt-2">
                {member.links.map((link) => (
                  <a
                    key={link.label}
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-slate-500 hover:text-white flex items-center justify-center gap-1"
                  >
                    <Github size={12} />
                    {link.label}
                  </a>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="glass-panel p-12 rounded-3xl space-y-8">
        <div className="flex items-center justify-between">
          <h3 className="text-2xl font-bold text-white">社区成员</h3>
          <span className="text-slate-500 text-sm">按字母顺序排列</span>
        </div>
        <p className="text-slate-400">
          此处列出了 PFingan 服务器截止关服前所有已绑定账号的成员，感谢每一位玩家的陪伴与支持。
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-4">
          {players.length === 0 ? (
            Array.from({length: 8}).map((_, i) => (
              <div key={i} className="flex flex-col items-center gap-2">
                <div className="w-12 h-12 rounded-lg bg-white/5 border border-border-dark flex items-center justify-center text-slate-600">
                  <Users size={20} />
                </div>
                <span className="text-[10px] text-slate-500">
                  玩家 {i + 1}
                </span>
              </div>
            ))
          ) : (
            players.map((player) => (
              <div
                key={player.id}
                className="flex flex-col items-center gap-2"
              >
                <div className="w-12 h-12 rounded-lg bg-white/5 border border-border-dark overflow-hidden">
                  <img
                    src={player.avatar}
                    alt={player.name}
                    className="w-full h-full object-cover"
                  />
                </div>
                <span className="text-[10px] text-slate-300">
                  {player.name}
                </span>
              </div>
            ))
          )}
        </div>
        <div className="pt-8 border-t border-border-dark text-center">
          <p className="text-xs text-slate-500">
            头像服务由 crafthead.net 提供
          </p>
        </div>
      </div>
    </motion.div>
  );
}

