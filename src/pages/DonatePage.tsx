import {BASE_URL, DONATIONS} from '@/src/constants';
import {cn} from '@/src/lib/utils';
import {ChevronRight, MessageSquare, Zap} from 'lucide-react';
import {motion} from 'motion/react';
import {useMemo, useState} from 'react';

export default function DonatePage() {
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  const {sortedDonations, totalAmount} = useMemo(() => {
    const sorted = [...DONATIONS].sort((a, b) => {
      const dateA = new Date(
        a.date.replace('年', '-').replace('月', '-').replace('日', ''),
      ).getTime();
      const dateB = new Date(
        b.date.replace('年', '-').replace('月', '-').replace('日', ''),
      ).getTime();
      return sortOrder === 'desc' ? dateB - dateA : dateA - dateB;
    });
    const total = DONATIONS.reduce((sum, item) => sum + item.amount, 0);
    return {sortedDonations: sorted, totalAmount: total};
  }, [sortOrder]);

  return (
    <motion.div
      initial={{opacity: 0, y: 20}}
      animate={{opacity: 1, y: 0}}
      exit={{opacity: 0, y: 20}}
      className="max-w-7xl mx-auto px-6 py-12 space-y-20"
    >
      <div className="text-center max-w-2xl mx-auto space-y-4">
        <h2 className="text-4xl font-bold text-white">感谢您的支持</h2>
        <p className="text-slate-400 italic">
          “赞助不会使您在服务器中享有额外权力或物资”
        </p>
        <p className="text-slate-400">
          服务器的运行离不开大家的支持。所有赞助将全部用于服务器续费与硬件升级。
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="glass-panel p-10 rounded-3xl space-y-8 text-center">
          <div className="w-16 h-16 bg-brand-primary/10 rounded-2xl flex items-center justify-center text-brand-primary mx-auto">
            <MessageSquare size={32} />
          </div>
          <div className="space-y-2">
            <h3 className="text-2xl font-bold text-white">微信赞助</h3>
            <p className="text-slate-400 text-sm">一块也是爱哦~</p>
          </div>
          <div className="aspect-square max-w-[240px] mx-auto bg-white p-4 rounded-2xl overflow-hidden relative group">
            <img
              src={BASE_URL + 'src/img/wx.jpeg'}
              alt="WeChat QR"
              className="w-full h-full object-contain transition-all duration-300 filter blur-sm group-hover:blur-none"
            />
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <span className="px-3 py-1 rounded-full bg-white/70 text-slate-700 text-xs font-semibold opacity-100 group-hover:opacity-0 transition-opacity duration-300">
                悬停查看收款码
              </span>
            </div>
          </div>
        </div>

        <div className="glass-panel p-10 rounded-3xl space-y-8 text-center">
          <div className="w-16 h-16 bg-blue-500/10 rounded-2xl flex items-center justify-center text-blue-500 mx-auto">
            <Zap size={32} />
          </div>
          <div className="space-y-2">
            <h3 className="text-2xl font-bold text-white">支付宝赞助</h3>
            <p className="text-slate-400 text-sm">一块也是爱哦~</p>
          </div>
          <div className="aspect-square max-w-[240px] mx-auto bg-white p-4 rounded-2xl overflow-hidden relative group">
            <img
              src={BASE_URL + 'src/img/zfb.jpeg'}
              alt="Alipay QR"
              className="w-full h-full object-contain transition-all duration-300 filter blur-sm group-hover:blur-none"
            />
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <span className="px-3 py-1 rounded-full bg-white/70 text-slate-700 text-xs font-semibold opacity-100 group-hover:opacity-0 transition-opacity duration-300">
                悬停查看收款码
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="glass-panel rounded-3xl overflow-hidden">
        <div className="p-8 border-b border-border-dark flex items-center justify-between">
          <h3 className="text-xl font-bold text-white">赞助列表</h3>
          <div className="flex items-center gap-2 text-brand-primary">
            <span className="text-sm font-bold">总计: ¥{totalAmount}</span>
          </div>
        </div>
        <div className="overflow-x-auto scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-transparent">
          <table className="w-full text-left border-collapse min-w-[800px]">
            <thead>
              <tr className="bg-white/5 text-slate-500 text-xs uppercase tracking-wider">
                <th
                  className="px-8 py-4 font-bold cursor-pointer hover:text-white transition-colors"
                  onClick={() =>
                    setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc')
                  }
                >
                  <div className="flex items-center gap-2">
                    时间
                    <ChevronRight
                      size={14}
                      className={cn(
                        'transition-transform',
                        sortOrder === 'desc' ? 'rotate-90' : '-rotate-90',
                      )}
                    />
                  </div>
                </th>
                <th className="px-8 py-4 font-bold">渠道</th>
                <th className="px-8 py-4 font-bold">单号</th>
                <th className="px-8 py-4 font-bold">金额</th>
                <th className="px-8 py-4 font-bold">说明</th>
                <th className="px-8 py-4 font-bold">赞助者</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-dark">
              {sortedDonations.map((item, idx) => (
                <tr key={idx} className="hover:bg-white/5 transition-colors">
                  <td className="px-8 py-4 text-sm text-slate-400 font-mono whitespace-nowrap">
                    {item.date}
                  </td>
                  <td className="px-8 py-4 text-sm text-slate-400 whitespace-nowrap">
                    {item.channel}
                  </td>
                  <td className="px-8 py-4 text-sm text-slate-500 font-mono whitespace-nowrap">
                    {item.orderId}
                  </td>
                  <td className="px-8 py-4 text-sm text-brand-primary font-bold whitespace-nowrap">
                    ¥{item.amount}
                  </td>
                  <td className="px-8 py-4 text-sm text-slate-500 italic min-w-[200px]">
                    {item.note}
                  </td>
                  <td className="px-8 py-4 text-sm font-medium text-white whitespace-nowrap">
                    {item.donor}
                  </td>
                </tr>
              ))}
              <tr className="bg-white/5 font-bold">
                <td className="px-8 py-4 text-sm text-white">总计(人民币)</td>
                <td className="px-8 py-4 text-sm text-slate-400">-</td>
                <td className="px-8 py-4 text-sm text-slate-400">-</td>
                <td className="px-8 py-4 text-sm text-brand-primary">
                  ¥{totalAmount}
                </td>
                <td className="px-8 py-4 text-sm text-slate-400">-</td>
                <td className="px-8 py-4 text-sm text-slate-400">-</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </motion.div>
  );
}

