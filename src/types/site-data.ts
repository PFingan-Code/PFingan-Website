export type ExternalFeatureId = 'announcement' | 'poll' | 'feedback' | 'submission';

export interface RepositoryConfig {
  owner: string;
  name: string;
  dataBranch: string;
  buildWorkflow: string;
}

export interface ActionLink {
  label: string;
  url: string;
  icon?: string;
}

export interface SiteBrand {
  name: string;
  shortName: string;
  description: string;
  language: string;
  themeColor: string;
  logo: string;
  favicon: string;
}

export interface HeroConfig {
  badge: string;
  title: string;
  subtitle?: string;
  description: string;
  background: string;
  primaryAction?: ActionLink;
  secondaryAction?: {label: string; route: string};
}

export interface FooterConfig {
  description: string;
  copyright: string;
}

export interface SiteCopy {
  navigation: {
    openMenu: string;
    closeMenu: string;
    quickLinks: string;
    contact: string;
  };
  home: {
    announcementsTitle: string;
    announcementCountSuffix: string;
    momentsTitle: string;
    momentsDescription: string;
    viewAll: string;
    featuresTitle: string;
    featuresDescription: string;
    externalFeatureTip: string;
  };
  server: {
    title: string;
    description: string;
    activeTitle: string;
    recordsTitle: string;
    resourcesTitle: string;
    emptyRecords: string;
    statusActive: string;
    statusClosed: string;
    statusUnknown: string;
    durationLabel: string;
    durationLong: string;
    durationDaysSuffix: string;
    addressLabel: string;
    seedLabel: string;
    modsTitle: string;
    rulesTitle: string;
    attachmentsTitle: string;
    extractCodeLabel: string;
    expandDetails: string;
    collapseDetails: string;
    emptyDescription: string;
  };
  moment: {
    title: string;
    description: string;
    allLabel: string;
    empty: string;
    viewDetails: string;
  };
  about: {
    title: string;
    motto: string;
    description: string;
    communityTitle: string;
    memberCountSuffix: string;
    memberSortLabel: string;
    empty: string;
    avatarCredit: string;
  };
  donate: {
    title: string;
    motto: string;
    description: string;
    paymentHint: string;
    recordsTitle: string;
    totalLabel: string;
    timeLabel: string;
    channelLabel: string;
    orderLabel: string;
    amountLabel: string;
    noteLabel: string;
    donorLabel: string;
    totalCurrencyLabel: string;
    emptyRecords: string;
  };
}

export interface NavigationItem {
  id: string;
  label: string;
  route: string;
  enabled: boolean;
}

export interface ContactItem {
  id: string;
  label: string;
  type: 'link' | 'email' | 'text' | 'image';
  value: string;
  image?: string;
  avatar?: string;
  icon?: string;
  hint?: string;
}

export interface ExternalFeature {
  enabled: boolean;
  label?: string;
  url?: string;
  description?: string;
}

export interface SiteConfig {
  repository: RepositoryConfig;
  brand: SiteBrand;
  hero: HeroConfig;
  footer: FooterConfig;
  copy: SiteCopy;
  externalFeatures: Record<ExternalFeatureId, ExternalFeature>;
}

export interface HomeHighlight {
  id: string;
  icon: string;
  color: string;
  title: string;
  description: string;
  action?: {label: string; route: string};
}

export interface HomeConfig {
  highlights: HomeHighlight[];
  featuredMomentIds: string[];
}

export interface HomeFeature {
  id: string;
  title: string;
  tip: string;
  tag: string;
  description: string;
  target: {type: 'route' | 'external' | 'feature'; value: string};
  enabled: boolean;
  disabledReason?: string;
}

export interface Attachment {
  name: string;
  url: string;
  code?: string;
  icon?: string;
}

export interface ServerArchive {
  id: string;
  title: string;
  period: {start: string; end?: string};
  durationDays?: number;
  tags: string[];
  version: string;
  status: 'closed' | 'active' | 'unknown';
  address?: string;
  seed?: string;
  rules: string[];
  mods: string[];
  attachments: Attachment[];
  description: string;
  updatedAt?: string;
}

export interface ResourceItem {
  id: string;
  title: string;
  period?: string;
  tags: string[];
  description: string;
  attachments: Attachment[];
}

export interface TeamMember {
  name: string;
  id: string;
  avatar?: string;
  useDefaultSkin: boolean;
  role: string;
  description: string;
  links?: ActionLink[];
}

export interface MembersData {
  team: TeamMember[];
  communityPlayerIds: string[];
  useDefaultSkinAvatars: boolean;
}

export interface AssetManifestEntry {
  path: string;
  sha256: string;
  bytes: number;
  contentType: string;
}

export interface MomentCategory {
  id: string;
  label: string;
  sortOrder: number;
}

export interface Moment {
  id: string;
  type: 'image' | 'video';
  url: string;
  previewUrl: string;
  description: string;
  categoryId: string;
  date?: string;
}

export interface MomentsData {
  categories: MomentCategory[];
  items: Moment[];
}

export interface PaymentMethod {
  id: string;
  label: string;
  description: string;
  image: string;
}

export interface Donation {
  id: string;
  date: string;
  channel: string;
  orderId: string;
  amount: number;
  note: string;
  donor: string;
}

export interface DonationsData {
  currency: string;
  paymentMethods: PaymentMethod[];
  items: Donation[];
}

export interface Announcement {
  id: string;
  title: string;
  content: string;
  date: string;
  pinned?: boolean;
}

export interface SiteData {
  schemaVersion: number;
  site: SiteConfig;
  navigation: NavigationItem[];
  contact: ContactItem[];
  home: HomeConfig;
  announcements: Announcement[];
  features: HomeFeature[];
  servers: ServerArchive[];
  resources: ResourceItem[];
  members: MembersData;
  moments: MomentsData;
  donations: DonationsData;
}

export interface DataManifest {
  schemaVersion: number;
  contentRevision: number;
  contentHash: string;
  assetHash?: string;
  updatedAt: string;
  files: string[];
  assets?: AssetManifestEntry[];
}

export interface BuildMeta {
  schemaVersion: number;
  dataBranch: string;
  dataCommitSha: string;
  contentRevision: number;
  contentHash: string;
  builtAt: string;
  buildCommitSha?: string;
}

export type DataSource = 'snapshot' | 'runtime';

export interface DataStatus {
  source: DataSource;
  state: 'checking' | 'synchronized' | 'updated' | 'unavailable' | 'invalid';
  message: string;
  latestCommitSha?: string;
  latestContentHash?: string;
}

export const DATA_FILES = [
  'site.json',
  'features.json',
  'servers.json',
  'resources.json',
  'members.json',
  'moments.json',
  'donations.json',
] as const;

export type DataFileName = (typeof DATA_FILES)[number];

export const EDITABLE_DATA_FILES = DATA_FILES.map((file) => `data/${file}`);
export const EDITABLE_ASSET_PREFIX = 'data/assets/';
