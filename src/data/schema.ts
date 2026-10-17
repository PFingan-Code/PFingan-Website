import type {
  DataFileName,
  DonationsData,
  MembersData,
  MomentsData,
  ResourceItem,
  ServerArchive,
  SiteConfig,
  SiteData,
} from '@/src/types/site-data';

const MAX_TEXT_LENGTH = 20_000;
const URL_PROTOCOLS = new Set(['http:', 'https:', 'mailto:']);
export const CURRENT_SCHEMA_VERSION = 2;
export const SUPPORTED_SCHEMA_VERSIONS = [1, CURRENT_SCHEMA_VERSION] as const;
export const HOME_ICON_KEYS = ['clock', 'shield', 'heart', 'sparkles', 'users', 'server', 'image', 'globe', 'star'] as const;
export const HIGHLIGHT_COLOR_KEYS = ['blue', 'amber', 'brand', 'emerald', 'rose'] as const;
const HEX_COLOR = /^#[0-9a-fA-F]{6}$/;

export class DataValidationError extends Error {
  readonly path: string;

  constructor(path: string, message: string) {
    super(`${path}: ${message}`);
    this.name = 'DataValidationError';
    this.path = path;
  }
}

function fail(path: string, message: string): never {
  throw new DataValidationError(path, message);
}

function object(value: unknown, path: string): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return fail(path, '必须是对象');
  }
  return value as Record<string, unknown>;
}

function string(value: unknown, path: string, options: {allowEmpty?: boolean} = {}): string {
  if (typeof value !== 'string') return fail(path, '必须是字符串');
  if (!options.allowEmpty && value.trim().length === 0) return fail(path, '不能为空');
  if (value.length > MAX_TEXT_LENGTH) return fail(path, `长度不能超过 ${MAX_TEXT_LENGTH}`);
  if (/\u0000/.test(value)) return fail(path, '不能包含控制字符');
  return value;
}

function boolean(value: unknown, path: string): boolean {
  if (typeof value !== 'boolean') return fail(path, '必须是布尔值');
  return value;
}

function number(value: unknown, path: string): number {
  if (typeof value !== 'number' || !Number.isFinite(value)) return fail(path, '必须是有限数字');
  return value;
}

function array(value: unknown, path: string): unknown[] {
  if (!Array.isArray(value)) return fail(path, '必须是数组');
  if (value.length > 2_000) return fail(path, '条目数量过多');
  return value;
}

function assertUniqueIds(items: Array<{id: string}>, path: string): void {
  const seen = new Set<string>();
  items.forEach((item, index) => {
    if (seen.has(item.id)) fail(`${path}[${index}].id`, `重复的 id：${item.id}`);
    seen.add(item.id);
  });
}

export function validateUrl(value: unknown, path: string): string {
  const candidate = string(value, path);
  if (candidate.includes('\\\\') || candidate.startsWith('//')) return fail(path, '不允许协议相对 URL 或反斜杠路径');
  if (candidate.startsWith('/')) return candidate;
  let parsed: URL;
  try {
    parsed = new URL(candidate);
  } catch {
    return fail(path, '不是有效 URL 或本站相对路径');
  }
  if (!URL_PROTOCOLS.has(parsed.protocol)) return fail(path, '只允许 http、https、mailto 或本站相对路径');
  return candidate;
}

export function validateAssetPath(value: unknown, path: string): string {
  const candidate = string(value, path);
  if (candidate.startsWith('assets/')) {
    const segments = candidate.split('/');
    if (candidate.includes('\\') || candidate.includes('?') || candidate.includes('#') || segments.some((segment) => !segment || segment === '.' || segment === '..' || !/^[a-zA-Z0-9._-]+$/.test(segment))) return fail(path, '资源路径包含非法目录段或字符');
    return candidate;
  }
  return validateUrl(candidate, path);
}

function stringArray(value: unknown, path: string): string[] {
  return array(value, path).map((item, index) => string(item, `${path}[${index}]`));
}

function validateColor(value: unknown, path: string): string {
  const color = string(value, path);
  if (!HEX_COLOR.test(color)) fail(path, '颜色必须是 #RRGGBB 格式');
  return color.toLowerCase();
}

function validateChoice<const T extends readonly string[]>(value: unknown, path: string, choices: T): T[number] {
  const candidate = string(value, path);
  if (!choices.includes(candidate)) fail(path, `值不受支持，可选值：${choices.join('、')}`);
  return candidate as T[number];
}

function validateAttachment(value: unknown, path: string) {
  const item = object(value, path);
  return {
    name: string(item.name, `${path}.name`),
    url: validateAssetPath(item.url, `${path}.url`),
    ...(item.code === undefined ? {} : {code: string(item.code, `${path}.code`, {allowEmpty: true})}),
    ...(item.icon === undefined ? {} : {icon: validateAssetPath(item.icon, `${path}.icon`)}),
  };
}

function validateServers(value: unknown): ServerArchive[] {
  const result = array(value, 'servers').map((raw, index) => {
    const path = `servers[${index}]`;
    const item = object(raw, path);
    const status = string(item.status, `${path}.status`);
    if (!['active', 'closed', 'unknown'].includes(status)) fail(`${path}.status`, '状态不受支持');
    const period = object(item.period, `${path}.period`);
    return {
      id: string(item.id, `${path}.id`),
      title: string(item.title, `${path}.title`),
      period: {
        start: string(period.start, `${path}.period.start`),
        ...(period.end === undefined ? {} : {end: string(period.end, `${path}.period.end`)}),
      },
      ...(item.durationDays === undefined ? {} : {durationDays: number(item.durationDays, `${path}.durationDays`)}),
      tags: stringArray(item.tags, `${path}.tags`),
      version: string(item.version, `${path}.version`),
      status: status as ServerArchive['status'],
      ...(item.address === undefined ? {} : {address: string(item.address, `${path}.address`, {allowEmpty: true})}),
      ...(item.seed === undefined ? {} : {seed: string(item.seed, `${path}.seed`, {allowEmpty: true})}),
      rules: stringArray(item.rules ?? [], `${path}.rules`),
      mods: stringArray(item.mods ?? [], `${path}.mods`),
      attachments: array(item.attachments ?? [], `${path}.attachments`).map((attachment, attachmentIndex) =>
        validateAttachment(attachment, `${path}.attachments[${attachmentIndex}]`),
      ),
      description: string(item.description ?? '', `${path}.description`, {allowEmpty: true}),
      ...(item.updatedAt === undefined ? {} : {updatedAt: string(item.updatedAt, `${path}.updatedAt`)}),
    };
  });
  assertUniqueIds(result, 'servers');
  return result;
}

function validateResources(value: unknown): ResourceItem[] {
  const result = array(value, 'resources').map((raw, index) => {
    const path = `resources[${index}]`;
    const item = object(raw, path);
    return {
      id: string(item.id, `${path}.id`),
      title: string(item.title, `${path}.title`),
      ...(item.period === undefined ? {} : {period: string(item.period, `${path}.period`)}),
      tags: stringArray(item.tags, `${path}.tags`),
      description: string(item.description, `${path}.description`),
      attachments: array(item.attachments, `${path}.attachments`).map((attachment, attachmentIndex) =>
        validateAttachment(attachment, `${path}.attachments[${attachmentIndex}]`),
      ),
    };
  });
  assertUniqueIds(result, 'resources');
  return result;
}

function validateMembers(value: unknown, schemaVersion: number): MembersData {
  const item = object(value, 'members');
  const team = array(item.team, 'members.team').map((raw, index) => {
    const path = `members.team[${index}]`;
    const member = object(raw, path);
    const avatar = member.avatar === undefined ? undefined : validateAssetPath(member.avatar, `${path}.avatar`);
    const useDefaultSkin = member.useDefaultSkin === undefined ? !avatar : boolean(member.useDefaultSkin, `${path}.useDefaultSkin`);
    if (schemaVersion >= CURRENT_SCHEMA_VERSION && !useDefaultSkin && (!avatar || !avatar.startsWith('assets/'))) {
      fail(`${path}.avatar`, '非默认皮肤头像必须引用受控 assets/ 资源');
    }
    return {
      name: string(member.name, `${path}.name`),
      id: string(member.id, `${path}.id`),
      ...(avatar === undefined ? {} : {avatar}),
      useDefaultSkin,
      role: string(member.role, `${path}.role`),
      description: string(member.description, `${path}.description`),
      ...(member.links === undefined
        ? {}
        : {links: array(member.links, `${path}.links`).map((rawLink, linkIndex) => {
            const linkPath = `${path}.links[${linkIndex}]`;
            const link = object(rawLink, linkPath);
            return {label: string(link.label, `${linkPath}.label`), url: validateUrl(link.url, `${linkPath}.url`)};
          })}),
    };
  });
  assertUniqueIds(team, 'members.team');
  const legacyCommunity = Array.isArray(item.community) ? item.community.map((raw, index) => {
    const member = object(raw, `members.community[${index}]`);
    return string(member.id, `members.community[${index}].id`);
  }) : undefined;
  const communityPlayerIds = stringArray(item.communityPlayerIds ?? legacyCommunity ?? [], 'members.communityPlayerIds');
  communityPlayerIds.forEach((id, index) => {
    if (!/^(?:[A-Za-z0-9_]{3,16}|[0-9a-fA-F]{32}|[0-9a-fA-F]{8}(?:-[0-9a-fA-F]{4}){3}-[0-9a-fA-F]{12})$/.test(id)) fail(`members.communityPlayerIds[${index}]`, '请输入 3–16 位玩家名称或有效 UUID');
  });
  if (new Set(communityPlayerIds.map((id) => id.toLowerCase())).size !== communityPlayerIds.length) fail('members.communityPlayerIds', '玩家 ID 不能重复');
  const useDefaultSkinAvatars = item.useDefaultSkinAvatars ?? (object(item.avatarProvider ?? {enabled: true}, 'members.avatarProvider').enabled ?? true);
  return {team, communityPlayerIds, useDefaultSkinAvatars: boolean(useDefaultSkinAvatars, 'members.useDefaultSkinAvatars')};
}

function validateMoments(value: unknown): MomentsData {
  const item = object(value, 'moments');
  const categories = array(item.categories, 'moments.categories').map((raw, index) => {
    const path = `moments.categories[${index}]`;
    const category = object(raw, path);
    return {
      id: string(category.id, `${path}.id`),
      label: string(category.label, `${path}.label`),
      sortOrder: number(category.sortOrder, `${path}.sortOrder`),
    };
  });
  const items = array(item.items, 'moments.items').map((raw, index) => {
    const path = `moments.items[${index}]`;
    const moment = object(raw, path);
    const type = string(moment.type, `${path}.type`);
    if (type !== 'image' && type !== 'video') fail(`${path}.type`, '类型不受支持');
    return {
      id: string(moment.id, `${path}.id`),
      type: type as 'image' | 'video',
      url: validateAssetPath(moment.url, `${path}.url`),
      previewUrl: validateAssetPath(moment.previewUrl, `${path}.previewUrl`),
      description: string(moment.description, `${path}.description`),
      categoryId: string(moment.categoryId, `${path}.categoryId`),
      ...(moment.date === undefined ? {} : {date: string(moment.date, `${path}.date`)}),
    };
  });
  assertUniqueIds(categories, 'moments.categories');
  assertUniqueIds(items, 'moments.items');
  const categoryIds = new Set(categories.map((category) => category.id));
  items.forEach((moment, index) => {
    if (!categoryIds.has(moment.categoryId)) fail(`moments.items[${index}].categoryId`, '引用了不存在的分类');
  });
  return {categories, items};
}

function validateDonations(value: unknown): DonationsData {
  const item = object(value, 'donations');
  const paymentMethods = array(item.paymentMethods, 'donations.paymentMethods').map((raw, index) => {
      const path = `donations.paymentMethods[${index}]`;
      const method = object(raw, path);
      return {
        id: string(method.id, `${path}.id`),
        label: string(method.label, `${path}.label`),
        description: string(method.description, `${path}.description`),
        image: validateAssetPath(method.image, `${path}.image`),
      };
    });
  const items = array(item.items, 'donations.items').map((raw, index) => {
      const path = `donations.items[${index}]`;
      const donation = object(raw, path);
      return {
        id: string(donation.id, `${path}.id`),
        date: string(donation.date, `${path}.date`),
        channel: string(donation.channel, `${path}.channel`),
        orderId: string(donation.orderId, `${path}.orderId`),
        amount: number(donation.amount, `${path}.amount`),
        note: string(donation.note, `${path}.note`, {allowEmpty: true}),
        donor: string(donation.donor, `${path}.donor`),
      };
    });
  assertUniqueIds(paymentMethods, 'donations.paymentMethods');
  assertUniqueIds(items, 'donations.items');
  return {currency: string(item.currency, 'donations.currency'), paymentMethods, items};
}

export function validateSiteData(value: unknown): SiteData {
  const root = object(value, 'data');
  const schemaVersion = number(root.schemaVersion, 'schemaVersion');
  if (!SUPPORTED_SCHEMA_VERSIONS.includes(schemaVersion as (typeof SUPPORTED_SCHEMA_VERSIONS)[number])) {
    fail('schemaVersion', `不支持的数据版本：${schemaVersion}`);
  }
  const site = object(root.site, 'site');
  const brand = object(site.brand, 'site.brand');
  const repository = object(site.repository, 'site.repository');
  const hero = object(site.hero, 'site.hero');
  const footer = object(site.footer, 'site.footer');
  const copy = object(site.copy, 'site.copy');
  const externalFeatures = object(site.externalFeatures, 'site.externalFeatures');
  const navigation = array(root.navigation, 'navigation').map((raw, index) => {
    const path = `navigation[${index}]`;
    const item = object(raw, path);
    return {
      id: string(item.id, `${path}.id`),
      label: string(item.label, `${path}.label`),
      route: string(item.route, `${path}.route`),
      enabled: boolean(item.enabled, `${path}.enabled`),
    };
  });
  assertUniqueIds(navigation, 'navigation');
  const contact = array(root.contact, 'contact').map((raw, index) => {
    const path = `contact[${index}]`;
    const item = object(raw, path);
    const type = string(item.type, `${path}.type`);
    if (!['link', 'email', 'text', 'image'].includes(type)) fail(`${path}.type`, '类型不受支持');
    return {
      id: string(item.id, `${path}.id`),
      label: string(item.label, `${path}.label`),
      type: type as 'link' | 'email' | 'text' | 'image',
      value: type === 'link' || type === 'email' ? validateUrl(item.value, `${path}.value`) : string(item.value, `${path}.value`),
      ...(item.image === undefined ? {} : {image: validateAssetPath(item.image, `${path}.image`)}),
      ...(item.avatar === undefined ? {} : {avatar: validateAssetPath(item.avatar, `${path}.avatar`)}),
      ...(item.icon === undefined ? {} : {icon: string(item.icon, `${path}.icon`)}),
      ...(item.hint === undefined ? {} : {hint: string(item.hint, `${path}.hint`)}),
    };
  });
  assertUniqueIds(contact, 'contact');
  const validatedFeatures = array(root.features, 'features').map((raw, index) => {
    const path = `features[${index}]`;
    const item = object(raw, path);
    const target = object(item.target, `${path}.target`);
    const targetType = string(target.type, `${path}.target.type`);
    if (!['route', 'external', 'feature'].includes(targetType)) fail(`${path}.target.type`, '类型不受支持');
    return {
      id: string(item.id, `${path}.id`),
      title: string(item.title, `${path}.title`),
      tip: string(item.tip, `${path}.tip`),
      tag: string(item.tag, `${path}.tag`),
      description: string(item.description, `${path}.description`),
      target: {
        type: targetType as 'route' | 'external' | 'feature',
        value: targetType === 'external' ? validateUrl(target.value, `${path}.target.value`) : string(target.value, `${path}.target.value`),
      },
      enabled: boolean(item.enabled, `${path}.enabled`),
      ...(item.disabledReason === undefined ? {} : {disabledReason: string(item.disabledReason, `${path}.disabledReason`)}),
    };
  });
  assertUniqueIds(validatedFeatures, 'features');
  const announcements = array(root.announcements, 'announcements').map((raw, index) => {
    const path = `announcements[${index}]`;
    const item = object(raw, path);
    return {
      id: string(item.id, `${path}.id`),
      title: string(item.title, `${path}.title`),
      content: string(item.content, `${path}.content`),
      date: string(item.date, `${path}.date`),
      ...(item.pinned === undefined ? {} : {pinned: boolean(item.pinned, `${path}.pinned`)}),
    };
  });
  assertUniqueIds(announcements, 'announcements');
  const navigationCopy = object(copy.navigation, 'site.copy.navigation');
  const homeCopy = object(copy.home, 'site.copy.home');
  const serverCopy = object(copy.server, 'site.copy.server');
  const momentCopy = object(copy.moment, 'site.copy.moment');
  const aboutCopy = object(copy.about, 'site.copy.about');
  const donateCopy = object(copy.donate, 'site.copy.donate');
  const text = (section: Record<string, unknown>, key: string, path: string) =>
    string(section[key], `${path}.${key}`);
  const validatedSite: SiteConfig = {
    repository: {
      owner: string(repository.owner, 'site.repository.owner'),
      name: string(repository.name, 'site.repository.name'),
      dataBranch: string(repository.dataBranch, 'site.repository.dataBranch'),
      buildWorkflow: string(repository.buildWorkflow, 'site.repository.buildWorkflow'),
    },
    brand: {
      name: string(brand.name, 'site.brand.name'),
      shortName: string(brand.shortName, 'site.brand.shortName'),
      description: string(brand.description, 'site.brand.description'),
      language: string(brand.language, 'site.brand.language'),
      themeColor: validateColor(brand.themeColor, 'site.brand.themeColor'),
      logo: validateAssetPath(brand.logo, 'site.brand.logo'),
      favicon: validateAssetPath(brand.favicon, 'site.brand.favicon'),
    },
    hero: {
      badge: string(hero.badge, 'site.hero.badge'),
      title: string(hero.title, 'site.hero.title'),
      ...(hero.subtitle === undefined ? {} : {subtitle: string(hero.subtitle, 'site.hero.subtitle')}),
      description: string(hero.description, 'site.hero.description'),
      background: validateAssetPath(hero.background, 'site.hero.background'),
      ...(hero.primaryAction === undefined
        ? {}
        : {primaryAction: {label: string(object(hero.primaryAction, 'site.hero.primaryAction').label, 'site.hero.primaryAction.label'), url: validateUrl(object(hero.primaryAction, 'site.hero.primaryAction').url, 'site.hero.primaryAction.url')} }),
      ...(hero.secondaryAction === undefined
        ? {}
        : {secondaryAction: {label: string(object(hero.secondaryAction, 'site.hero.secondaryAction').label, 'site.hero.secondaryAction.label'), route: string(object(hero.secondaryAction, 'site.hero.secondaryAction').route, 'site.hero.secondaryAction.route')} }),
    },
    footer: {
      description: string(footer.description, 'site.footer.description'),
      copyright: string(footer.copyright, 'site.footer.copyright'),
    },
    copy: {
      navigation: {
        openMenu: text(navigationCopy, 'openMenu', 'site.copy.navigation'),
        closeMenu: text(navigationCopy, 'closeMenu', 'site.copy.navigation'),
        quickLinks: text(navigationCopy, 'quickLinks', 'site.copy.navigation'),
        contact: text(navigationCopy, 'contact', 'site.copy.navigation'),
      },
      home: {
        announcementsTitle: text(homeCopy, 'announcementsTitle', 'site.copy.home'),
        announcementCountSuffix: text(homeCopy, 'announcementCountSuffix', 'site.copy.home'),
        momentsTitle: text(homeCopy, 'momentsTitle', 'site.copy.home'),
        momentsDescription: text(homeCopy, 'momentsDescription', 'site.copy.home'),
        viewAll: text(homeCopy, 'viewAll', 'site.copy.home'),
        featuresTitle: text(homeCopy, 'featuresTitle', 'site.copy.home'),
        featuresDescription: text(homeCopy, 'featuresDescription', 'site.copy.home'),
        externalFeatureTip: text(homeCopy, 'externalFeatureTip', 'site.copy.home'),
      },
      server: {
        title: text(serverCopy, 'title', 'site.copy.server'),
        description: text(serverCopy, 'description', 'site.copy.server'),
        activeTitle: text(serverCopy, 'activeTitle', 'site.copy.server'),
        recordsTitle: text(serverCopy, 'recordsTitle', 'site.copy.server'),
        resourcesTitle: text(serverCopy, 'resourcesTitle', 'site.copy.server'),
        emptyRecords: text(serverCopy, 'emptyRecords', 'site.copy.server'),
        statusActive: text(serverCopy, 'statusActive', 'site.copy.server'),
        statusClosed: text(serverCopy, 'statusClosed', 'site.copy.server'),
        statusUnknown: text(serverCopy, 'statusUnknown', 'site.copy.server'),
        durationLabel: text(serverCopy, 'durationLabel', 'site.copy.server'),
        durationLong: text(serverCopy, 'durationLong', 'site.copy.server'),
        durationDaysSuffix: text(serverCopy, 'durationDaysSuffix', 'site.copy.server'),
        addressLabel: text(serverCopy, 'addressLabel', 'site.copy.server'),
        seedLabel: text(serverCopy, 'seedLabel', 'site.copy.server'),
        modsTitle: text(serverCopy, 'modsTitle', 'site.copy.server'),
        rulesTitle: text(serverCopy, 'rulesTitle', 'site.copy.server'),
        attachmentsTitle: text(serverCopy, 'attachmentsTitle', 'site.copy.server'),
        extractCodeLabel: text(serverCopy, 'extractCodeLabel', 'site.copy.server'),
        expandDetails: text(serverCopy, 'expandDetails', 'site.copy.server'),
        collapseDetails: text(serverCopy, 'collapseDetails', 'site.copy.server'),
        emptyDescription: text(serverCopy, 'emptyDescription', 'site.copy.server'),
      },
      moment: {
        title: text(momentCopy, 'title', 'site.copy.moment'),
        description: text(momentCopy, 'description', 'site.copy.moment'),
        allLabel: text(momentCopy, 'allLabel', 'site.copy.moment'),
        empty: text(momentCopy, 'empty', 'site.copy.moment'),
        viewDetails: text(momentCopy, 'viewDetails', 'site.copy.moment'),
      },
      about: {
        title: text(aboutCopy, 'title', 'site.copy.about'),
        motto: text(aboutCopy, 'motto', 'site.copy.about'),
        description: text(aboutCopy, 'description', 'site.copy.about'),
        communityTitle: text(aboutCopy, 'communityTitle', 'site.copy.about'),
        memberCountSuffix: text(aboutCopy, 'memberCountSuffix', 'site.copy.about'),
        memberSortLabel: text(aboutCopy, 'memberSortLabel', 'site.copy.about'),
        empty: text(aboutCopy, 'empty', 'site.copy.about'),
        avatarCredit: text(aboutCopy, 'avatarCredit', 'site.copy.about'),
      },
      donate: {
        title: text(donateCopy, 'title', 'site.copy.donate'),
        motto: text(donateCopy, 'motto', 'site.copy.donate'),
        description: text(donateCopy, 'description', 'site.copy.donate'),
        paymentHint: text(donateCopy, 'paymentHint', 'site.copy.donate'),
        recordsTitle: text(donateCopy, 'recordsTitle', 'site.copy.donate'),
        totalLabel: text(donateCopy, 'totalLabel', 'site.copy.donate'),
        timeLabel: text(donateCopy, 'timeLabel', 'site.copy.donate'),
        channelLabel: text(donateCopy, 'channelLabel', 'site.copy.donate'),
        orderLabel: text(donateCopy, 'orderLabel', 'site.copy.donate'),
        amountLabel: text(donateCopy, 'amountLabel', 'site.copy.donate'),
        noteLabel: text(donateCopy, 'noteLabel', 'site.copy.donate'),
        donorLabel: text(donateCopy, 'donorLabel', 'site.copy.donate'),
        totalCurrencyLabel: text(donateCopy, 'totalCurrencyLabel', 'site.copy.donate'),
        emptyRecords: text(donateCopy, 'emptyRecords', 'site.copy.donate'),
      },
    },
    externalFeatures: Object.fromEntries(
      (['announcement', 'poll', 'feedback', 'submission'] as const).map((id) => {
        const feature = object(externalFeatures[id], `site.externalFeatures.${id}`);
        return [
          id,
          {
            enabled: boolean(feature.enabled, `site.externalFeatures.${id}.enabled`),
            ...(feature.label === undefined ? {} : {label: string(feature.label, `site.externalFeatures.${id}.label`)}),
            ...(feature.url === undefined ? {} : {url: validateUrl(feature.url, `site.externalFeatures.${id}.url`)}),
            ...(feature.description === undefined ? {} : {description: string(feature.description, `site.externalFeatures.${id}.description`)}),
          },
        ];
      }),
    ) as SiteConfig['externalFeatures'],
  };
  const home = object(root.home, 'home');
  const highlights = array(home.highlights, 'home.highlights').map((raw, index) => {
    const path = `home.highlights[${index}]`;
    const item = object(raw, path);
    const action = item.action === undefined ? undefined : object(item.action, `${path}.action`);
    return {
      id: string(item.id, `${path}.id`),
      icon: validateChoice(item.icon, `${path}.icon`, HOME_ICON_KEYS),
      color: validateChoice(item.color, `${path}.color`, HIGHLIGHT_COLOR_KEYS),
      title: string(item.title, `${path}.title`),
      description: string(item.description, `${path}.description`),
      ...(action ? {action: {label: string(action.label, `${path}.action.label`), route: string(action.route, `${path}.action.route`)}} : {}),
    };
  });
  assertUniqueIds(highlights, 'home.highlights');
  const featuredMomentIds = stringArray(home.featuredMomentIds, 'home.featuredMomentIds');
  if (new Set(featuredMomentIds).size !== featuredMomentIds.length) fail('home.featuredMomentIds', '不能包含重复的瞬间 id');
  const moments = validateMoments(root.moments);
  const momentIds = new Set(moments.items.map((moment) => moment.id));
  featuredMomentIds.forEach((id, index) => {
    if (!momentIds.has(id)) fail(`home.featuredMomentIds[${index}]`, `引用了不存在的瞬间：${id}`);
  });
  return {
    schemaVersion,
    site: validatedSite,
    navigation,
    contact,
    home: {
      highlights,
      featuredMomentIds,
    },
    announcements,
    features: validatedFeatures,
    servers: validateServers(root.servers),
    resources: validateResources(root.resources),
    members: validateMembers(root.members, schemaVersion),
    moments,
    donations: validateDonations(root.donations),
  };
}

export function assertDataFileName(value: string): asserts value is DataFileName {
  if (!['site.json', 'features.json', 'servers.json', 'resources.json', 'members.json', 'moments.json', 'donations.json'].includes(value)) {
    throw new DataValidationError('file', '不是允许的数据文件');
  }
}
