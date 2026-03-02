export const BASE_URL = '/';

export interface ServerArchive {
  id: string;
  title: string;
  period: string;
  days: number;
  tags: string[];
  version: string;
  status: 'closed' | 'active';
  ip?: string;
  seed?: string;
  rules?: string[];
  mods?: string[];
  attachments?: { name: string; url: string; code?: string; icon?: string }[];
  description?: string;
}

export interface ResourceItem {
  id: string;
  title: string;
  period?: string;
  tags: string[];
  description: string;
  attachments: { name: string; url: string; code?: string; icon?: string }[];
}

export interface TeamMember {
  name: string;
  id: string;
  avatar: string;
  role: string;
  description: string;
  links?: { label: string; url: string }[];
}

export interface Moment {
  type: 'image' | 'video';
  url: string;
  previewUrl: string;
  description: string;
  category: string;
  date?: string;
}

export interface Donation {
  date: string;
  channel: string;
  orderId: string;
  amount: number;
  note: string;
  donor: string;
}

export interface HomeFeature {
  title: string;
  tip: string;
  tag: string;
  description: string;
  tab: string;
  status?: string;
}

export const HOME_FEATURES: HomeFeature[] = [
  { title: '服务器说明', tip: '点击查看', tag: '说明', description: '点击查看服务器说明哦~', tab: 'server' },
  { title: '瞬间', tip: '点击查看哦', tag: '相册', description: '服务器的照片和视频', tab: 'moment' },
  { title: '关于我们', tip: '点击查看哦', tag: '成员', description: '成员列表', tab: 'about' },
  { title: '公告', tip: '点击查看哦', tag: '公告', description: '服务器和其它内容的公告', tab: 'home', status: '未开放' },
  { title: '投票', tip: '点击查看哦', tag: '投票', description: '想参与服务器的发展方向？为你想要的投上一票吧', tab: 'home', status: '未开放' },
  { title: '反馈', tip: '点击查看哦', tag: '反馈', description: '有任何问题都可以反馈哦', tab: 'home', status: '未开放' },
  { title: '提交', tip: '点击查看哦', tag: '资源', description: '有好东西想向我们分享？我们正乐于此！', tab: 'home', status: '未开放' },
  { title: '待添加', tip: '点击查看哦', tag: '无', description: '未开放此功能', tab: 'home', status: '未开放' },
];

export const SERVER_ARCHIVES: ServerArchive[] = [
  {
    id: '1',
    title: '一周目',
    period: '2022年04月11日 - 2022年06月30日',
    days: 82,
    tags: ['生电', '插件', '正版'],
    version: '1.18',
    status: 'closed',
    attachments: [{ name: '一周目存档 (链接已失效)', url: '#' }]
  },
  {
    id: '2',
    title: '二周目',
    period: '2022年07月02日 - 2023年02月27日',
    days: 240,
    tags: ['生电', 'MCDR+Fabric', '正版'],
    version: '1.18',
    status: 'closed',
    attachments: [
      { name: '二周目存档', url: 'https://www.123pan.com/s/Jvh8Vv-6Quf3', code: '9JPU' },
      { name: '二周目存档数据 (不含地图)', url: 'https://www.123pan.com/s/Jvh8Vv-VQuf3', code: 'Rk0p' }
    ]
  },
  {
    id: '3',
    title: '三周目',
    period: '2023年07月01日 - 2023年12月22日',
    days: 174,
    tags: ['生电', 'MCDR+Fabric', '非正版'],
    version: '1.20',
    status: 'closed',
    attachments: [{ name: '三周目存档', url: 'https://www.123pan.com/s/Jvh8Vv-yQuf3', code: 'rqyt' }]
  },
  {
    id: 'pangu',
    title: '临时服：盘灵古域',
    period: '2023年11月11日 - 2023年12月22日',
    days: 41,
    tags: ['RPG', '公益', '临时服', '非正版'],
    version: '1.20',
    status: 'closed',
    attachments: [{ name: '盘灵古域存档', url: 'https://www.123pan.com/s/Jvh8Vv-jQuf3', code: 'z97f' }]
  },
  {
    id: 'summer2024',
    title: '暑期档',
    period: '2024年07月03日 - 2024年10月20日',
    days: 109,
    tags: ['生存', 'MCDR+Fabric', '临时服', '非正版'],
    version: '1.21',
    status: 'closed',
    ip: '已关服',
    seed: '98839034598504064',
    description: '服务器玩法为生存。死亡为墓碑，保护时间15分钟，超时将允许任何人进行拾取其中物资。添加数据包：允许合成鞘翅和附魔金苹果，切石机和篝火增加更多配方。无需正版验证。客户端不需要安装任何模组即可加入服务器。无白名单，无需加群。难度挑战：巨大化生物群系。服务器与群聊消息互通。',
    rules: [
      '和平游玩',
      '禁止进行刷屏',
      '禁止进行骚扰、辱骂他人',
      '禁止影响他人游玩',
      '禁止打广告',
      '禁止开挂或使用开挂物品（矿透也不行）',
      '禁止恶意利用BUG',
      '禁止攻击引战言论',
      '禁止色情低俗内容',
      '禁止引人不适话题',
      '禁止偷盗他人物品',
      '禁止恶意破坏毁坏机器/建筑（非恶意需要还原或获得建造者谅解）'
    ],
    mods: [
      '共享投影',
      'PCA同步',
      'lg查熊，指令为：!!c lg',
      '地毯：假人（将 / 换成 !! ，需要获得权限才可使用）',
      'AMS: 可合成无限+经验修补的弓，易碎的深板岩',
      '离线皮肤：/skin'
    ],
    attachments: [{ name: '暑期档存档', url: 'https://www.123684.com/s/Jvh8Vv-Djuf3', code: '0As6' }]
  },
  {
    id: 'winter2025',
    title: '寒期档',
    period: '2025年01月01日 - 2025年04月04日',
    days: 93,
    tags: ['生电', '模组', '非正版'],
    version: '1.21',
    status: 'closed',
    ip: '已关服',
    seed: '98839034598504064',
    description: '服务器将开放至2025/04/04（当前服务器续费状态），到期后视情况处理。服务器玩法为生存。死亡为墓碑，保护时间15分钟。添加数据包：允许合成鞘翅和附魔金苹果。无需正版验证。客户端不需要安装任何模组即可加入服务器。无白名单，无需加群。难度挑战：巨大化生物群系。服务器与群聊消息互通。',
    rules: [
      '和平游玩',
      '禁止进行刷屏',
      '禁止进行骚扰、辱骂他人',
      '禁止影响他人游玩',
      '禁止打广告',
      '禁止开挂或使用开挂物品（矿透也不行）',
      '禁止恶意利用BUG',
      '禁止攻击引战言论',
      '禁止色情低俗内容',
      '禁止引人不适话题',
      '禁止偷盗他人物品',
      '禁止恶意破坏毁坏机器/建筑（非恶意需要还原或获得建造者谅解）'
    ],
    mods: [
      '共享投影',
      'PCA同步',
      'lg查熊，指令为：!!c lg',
      '地毯：假人（将 / 换成 !! ，需要获得权限才可使用）',
      'AMS: 可合成无限+经验修补的弓，易碎的深板岩',
      '离线皮肤：/skin'
    ]
  }
];

export const RESOURCES: ResourceItem[] = [
  {
    id: 'tools',
    title: '可能会用到的工具',
    period: '长期更新',
    tags: ['工具', '软件'],
    description: '如果你想开一个服务器，你可能会需要这些工具。',
    attachments: [
      {
        name: '可能会用到的工具.zip',
        url: 'https://www.123pan.com/s/Jvh8Vv-TEuf3',
        code: 'TXLr'
      }
    ]
  },
  {
    id: 'source',
    title: 'PFingan.com 网页源码',
    period: '2025',
    tags: ['工具', '代码'],
    description: 'PFingan.com 的网页源码加文件素材等等。',
    attachments: [
      {
        name: 'neocities-pfingan.zip',
        url: 'https://www.123684.com/s/Jvh8Vv-awUf3?',
        code: 'bobW'
      }
    ]
  }
];

export const TEAM_MEMBERS: TeamMember[] = [
  {
    name: '树梢',
    id: 'Shusao',
    avatar: 'https://crafthead.net/helm/53a92c14e6724bde8f9d4232bd83b5da',
    role: '服主',
    description: 'PFingan 的核心团队领导者。'
  },
  {
    name: '雪开',
    id: 'XueK__',
    avatar: 'https://crafthead.net/helm/0a46df00cbe64b5db2c22fc1a165fe13',
    role: '管理员 / 技术支持',
    description: '服务器技术支持，负责服务器异常处理、部署及插件开发。目前负责 PF-GUGUBot 插件及其前置 PF-cq_qq_api 开发。',
    links: [
      { label: 'PF-GUGUBot', url: 'https://github.com/LoosePrince/PF-GUGUBot' },
      { label: 'PF-cq_qq_api', url: 'https://github.com/XueK66/PF-cq_qq_api' }
    ]
  },
  {
    name: 'fake_neko',
    id: 'fake_neko',
    avatar: 'https://crafthead.net/helm/33dff60d8a5148cf9ac99ea02c37364e',
    role: '管理员 / 资金提供 / 协助管理',
    description: '为服务器一周目后期和二周目全程提供资金，平时也会帮助群聊管理。'
  },
  {
    name: '流墨',
    id: 'LiuMo_Ya',
    avatar: 'https://crafthead.net/helm/9e833e40349047b9b36e82a236dd111a',
    role: '管理员 / 红石技术',
    description: '服务器认证红石大佬，曾负责红石审核。'
  }
];

export const MOMENTS: Moment[] = [
  // 一周目
  { type: 'image', url: BASE_URL + 'src/moment/01/02.png', previewUrl: BASE_URL + 'src/moment/01/freecompress-02.png', description: '无描述', category: '一周目' },
  { type: 'image', url: BASE_URL + 'src/moment/01/16.png', previewUrl: BASE_URL + 'src/moment/01/freecompress-16.png', description: '飞走的世吞', category: '一周目' },
  { type: 'image', url: BASE_URL + 'src/moment/01/75.png', previewUrl: BASE_URL + 'src/moment/01/freecompress-75.png', description: '一周目 Night7sky 的基地', category: '一周目' },
  { type: 'image', url: BASE_URL + 'src/moment/01/71.png', previewUrl: BASE_URL + 'src/moment/01/freecompress-71.png', description: '正在刷凋零玫瑰的 Night7sky', category: '一周目' },
  { type: 'image', url: BASE_URL + 'src/moment/01/20.png', previewUrl: BASE_URL + 'src/moment/01/freecompress-20.png', description: '海货塔', category: '一周目' },
  // 二周目
  { type: 'image', url: BASE_URL + 'src/moment/02/01.png', previewUrl: BASE_URL + 'src/moment/02/freecompress-01.png', description: 'PF大楼和自由刁民像', category: '二周目' },
  { type: 'image', url: BASE_URL + 'src/moment/02/02.png', previewUrl: BASE_URL + 'src/moment/02/freecompress-02.png', description: '交易所', category: '二周目' },
  { type: 'image', url: BASE_URL + 'src/moment/02/03.png', previewUrl: BASE_URL + 'src/moment/02/freecompress-03.png', description: '地狱门', category: '二周目' },
  { type: 'image', url: BASE_URL + 'src/moment/02/04.png', previewUrl: BASE_URL + 'src/moment/02/freecompress-04.png', description: '苏苏的面包房', category: '二周目' },
  { type: 'image', url: BASE_URL + 'src/moment/02/05.png', previewUrl: BASE_URL + 'src/moment/02/freecompress-05.png', description: '石镐的新家（天上那个）', category: '二周目' },
  { type: 'image', url: BASE_URL + 'src/moment/02/06.png', previewUrl: BASE_URL + 'src/moment/02/freecompress-06.png', description: '08的半成品', category: '二周目' },
  { type: 'image', url: BASE_URL + 'src/moment/02/09.png', previewUrl: BASE_URL + 'src/moment/02/freecompress-09.png', description: '服务器仓库', category: '二周目' },
  { type: 'image', url: BASE_URL + 'src/moment/02/07.png', previewUrl: BASE_URL + 'src/moment/02/freecompress-07.png', description: '溺尸塔', category: '二周目' },
  { type: 'image', url: BASE_URL + 'src/moment/02/08.png', previewUrl: BASE_URL + 'src/moment/02/freecompress-08.png', description: '未完成的主岛', category: '二周目' },
  { type: 'image', url: BASE_URL + 'src/moment/02/10.png', previewUrl: BASE_URL + 'src/moment/02/freecompress-10.png', description: '出生点空置域的服务器logo', category: '二周目' },
  { type: 'image', url: BASE_URL + 'src/moment/02/11.png', previewUrl: BASE_URL + 'src/moment/02/freecompress-11.png', description: '钢铁洪流（30核刷铁机）', category: '二周目' },
  { type: 'image', url: BASE_URL + 'src/moment/02/12.png', previewUrl: BASE_URL + 'src/moment/02/freecompress-12.png', description: '刷冰机', category: '二周目' },
  { type: 'image', url: BASE_URL + 'src/moment/02/13.jpg', previewUrl: BASE_URL + 'src/moment/02/freecompress-13.jpg', description: '42x42空置域', category: '二周目' },
  { type: 'image', url: BASE_URL + 'src/moment/02/14.png', previewUrl: BASE_URL + 'src/moment/02/freecompress-14.png', description: '双维度猪人塔', category: '二周目' },
  { type: 'image', url: BASE_URL + 'src/moment/02/15.png', previewUrl: BASE_URL + 'src/moment/02/freecompress-15.png', description: '史莱姆空置域', category: '二周目' },
  { type: 'image', url: BASE_URL + 'src/moment/02/16.png', previewUrl: BASE_URL + 'src/moment/02/freecompress-16.png', description: '凋零骷髅农场', category: '二周目' },
  { type: 'image', url: BASE_URL + 'src/moment/02/17.png', previewUrl: BASE_URL + 'src/moment/02/freecompress-17.png', description: '末地交易所', category: '二周目' },
  { type: 'image', url: BASE_URL + 'src/moment/02/18.png', previewUrl: BASE_URL + 'src/moment/02/freecompress-18.png', description: '炸雪机', category: '二周目' },
  { type: 'image', url: BASE_URL + 'src/moment/02/19.png', previewUrl: BASE_URL + 'src/moment/02/freecompress-19.png', description: '潜影贝农场', category: '二周目' },
  { type: 'image', url: BASE_URL + 'src/moment/02/20.png', previewUrl: BASE_URL + 'src/moment/02/freecompress-20.png', description: '无描述', category: '二周目' },
  // 三周目
  { type: 'image', url: BASE_URL + 'src/moment/03/01.png', previewUrl: BASE_URL + 'src/moment/03/freecompress-01.png', description: '交易所', category: '三周目' },
  { type: 'image', url: BASE_URL + 'src/moment/03/02.png', previewUrl: BASE_URL + 'src/moment/03/freecompress-02.png', description: '基地', category: '三周目' },
  { type: 'image', url: BASE_URL + 'src/moment/03/03.png', previewUrl: BASE_URL + 'src/moment/03/freecompress-03.png', description: '溺尸塔', category: '三周目' },
  { type: 'image', url: BASE_URL + 'src/moment/03/04.png', previewUrl: BASE_URL + 'src/moment/03/freecompress-04.png', description: '出生点地图画', category: '三周目' },
  { type: 'image', url: BASE_URL + 'src/moment/03/05.png', previewUrl: BASE_URL + 'src/moment/03/freecompress-05.png', description: '空中楼阁', category: '三周目' },
  { type: 'image', url: BASE_URL + 'src/moment/03/06.png', previewUrl: BASE_URL + 'src/moment/03/freecompress-06.png', description: '袭击塔', category: '三周目' },
  { type: 'image', url: BASE_URL + 'src/moment/03/07.png', previewUrl: BASE_URL + 'src/moment/03/freecompress-07.png', description: '无描述', category: '三周目' },
  { type: 'image', url: BASE_URL + 'src/moment/03/08.png', previewUrl: BASE_URL + 'src/moment/03/freecompress-08.png', description: '无描述', category: '三周目' },
  { type: 'image', url: BASE_URL + 'src/moment/03/09.png', previewUrl: BASE_URL + 'src/moment/03/freecompress-09.png', description: '末地主岛', category: '三周目' },
  { type: 'image', url: BASE_URL + 'src/moment/03/10.png', previewUrl: BASE_URL + 'src/moment/03/freecompress-10.png', description: '无描述', category: '三周目' },
  { type: 'image', url: BASE_URL + 'src/moment/03/11.png', previewUrl: BASE_URL + 'src/moment/03/freecompress-11.png', description: '无描述', category: '三周目' },
  { type: 'image', url: BASE_URL + 'src/moment/03/12.png', previewUrl: BASE_URL + 'src/moment/03/freecompress-12.png', description: '无描述', category: '三周目' },
  { type: 'image', url: BASE_URL + 'src/moment/03/13.png', previewUrl: BASE_URL + 'src/moment/03/freecompress-13.png', description: '无描述', category: '三周目' },
  { type: 'image', url: BASE_URL + 'src/moment/03/14.png', previewUrl: BASE_URL + 'src/moment/03/freecompress-14.png', description: '无描述', category: '三周目' },
  { type: 'image', url: BASE_URL + 'src/moment/03/15.png', previewUrl: BASE_URL + 'src/moment/03/freecompress-15.png', description: '无描述', category: '三周目' },
  { type: 'image', url: BASE_URL + 'src/moment/03/16.png', previewUrl: BASE_URL + 'src/moment/03/freecompress-16.png', description: '无描述', category: '三周目' },
  { type: 'image', url: BASE_URL + 'src/moment/03/17.png', previewUrl: BASE_URL + 'src/moment/03/freecompress-17.png', description: '无描述', category: '三周目' },
  // 其它
  { type: 'image', url: BASE_URL + 'src/img/bg.png', previewUrl: BASE_URL + 'src/img/bg.png', description: '服主在海上的庄园', category: '其它' },
  // 视频
  {
    type: 'video',
    url: 'https://www.bilibili.com/video/BV1na41137gn',
    previewUrl: BASE_URL + 'src/moment/BV1na41137gn.jpg',
    description: '堪比黑山大叔的因果律武器',
    category: '视频',
    date: '2022-09-02'
  },
  {
    type: 'video',
    url: 'https://www.bilibili.com/video/BV18M4m1y7Hg',
    previewUrl: BASE_URL + 'src/moment/BV18M4m1y7Hg.jpg',
    description: '1.21服务器开荒玩家合影',
    category: '视频',
    date: '2024-07-20'
  }
];

export const DONATIONS: Donation[] = [
  { date: '2025年01月01日', channel: '微信', orderId: '10000499***132617', amount: 50, note: '备注：新年好，老b登', donor: 'QQ：Bnz_m' },
  { date: '2024年12月21日', channel: '微信', orderId: '10000499***306553', amount: 10, note: '备注：冬至快乐（？）', donor: 'QQ：北葵' },
  { date: '2024年12月11日', channel: '支付宝', orderId: '20241211***091061', amount: 100, note: '备注：webui方便啊，v你们俩50', donor: '支付宝：**文，雪开（转赠）' },
  { date: '2024年11月24日', channel: '支付宝', orderId: '20241124***476806', amount: 20, note: '备注：插件很棒，加油', donor: 'QQ：青玉' },
  { date: '2024年09月22日', channel: '微信', orderId: '10001071***301526', amount: 20, note: '备注：大学牲，没多少马内，插件很好用，谢谢！', donor: 'QQ：小泽，雪开（转赠）' },
  { date: '2024年08月19日', channel: '支付宝', orderId: '20240819***381363', amount: 328, note: '备注：插件不错，服务器用上了。送你一份黑猴吧', donor: '支付宝：**文，雪开（转赠）' },
  { date: '2024年07月22日', channel: '微信', orderId: '10000399***800032', amount: 100, note: '-', donor: '微信：fake_neko（FRIEREN）' },
  { date: '2024年07月21日', channel: '支付宝', orderId: '20240721***971410', amount: 300, note: '备注：加油', donor: '支付宝：**文' },
  { date: '2022年05月24日', channel: '支付宝', orderId: '20220524***732803', amount: 20, note: '-', donor: 'QQ：FRIEREN' },
  { date: '2022年05月24日', channel: '支付宝（非转账）', orderId: '20220524***024546', amount: 303, note: '服务器升级', donor: 'QQ：FRIEREN' },
  { date: '2022年05月20日', channel: '支付宝（非转账）', orderId: '20220520***369170', amount: 50, note: '硬盘扩容续费一个月', donor: 'QQ：FRIEREN' },
  { date: '2022年05月20日', channel: '支付宝（非转账）', orderId: '20220520***413361', amount: 108, note: '服务器续费优惠续费一个月', donor: 'QQ：FRIEREN' },
  { date: '2022年05月16日', channel: '支付宝（非转账）', orderId: '20220516***231818', amount: 100, note: '硬盘扩容续费两个月', donor: 'QQ：FRIEREN' },
  { date: '2022年05月16日', channel: '支付宝（非转账）', orderId: '20220516***232754', amount: 540, note: '续费两个月', donor: 'QQ：FRIEREN' },
  { date: '2022年05月10日', channel: '支付宝（非转账）', orderId: '20220510***183255', amount: 50, note: '硬盘扩容购买一个月', donor: 'QQ：FRIEREN' },
  { date: '2022年05月10日', channel: '支付宝（非转账）', orderId: '20220510***742846', amount: 269, note: '服务器购买一个月', donor: 'QQ：FRIEREN' },
  { date: '2022年04月30日', channel: '微信', orderId: '10001071***695141', amount: 100, note: '备注：开服，快开服', donor: '微信：*。' }
];

