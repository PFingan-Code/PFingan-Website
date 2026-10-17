import {canonicalJson} from '@/src/data/canonical';
import type {SiteData} from '@/src/types/site-data';

export function legacyContentHashInput(data: SiteData, rawMembers: unknown, rawSite: unknown): SiteData {
  const members = rawMembers && typeof rawMembers === 'object' ? rawMembers as Record<string, unknown> : {};
  const team = Array.isArray(members.team) ? members.team.map((raw) => {
    const member = raw as Record<string, unknown>;
    return {
      name: member.name,
      id: member.id,
      avatar: member.avatar,
      role: member.role,
      description: member.description,
      ...(member.links === undefined ? {} : {links: member.links}),
    };
  }) : [];
  const community = Array.isArray(members.community) ? members.community.map((raw) => {
    const member = raw as Record<string, unknown>;
    return {
      id: member.id,
      name: member.name,
      ...(member.avatar === undefined ? {} : {avatar: member.avatar}),
      ...(member.sortOrder === undefined ? {} : {sortOrder: member.sortOrder}),
    };
  }) : [];
  const avatarProvider = members.avatarProvider && typeof members.avatarProvider === 'object'
    ? members.avatarProvider as Record<string, unknown>
    : undefined;
  const siteFile = rawSite && typeof rawSite === 'object' ? rawSite as Record<string, unknown> : {};
  const rawSiteConfig = siteFile.site && typeof siteFile.site === 'object' ? siteFile.site as Record<string, unknown> : siteFile;
  const brand = rawSiteConfig.brand && typeof rawSiteConfig.brand === 'object' ? rawSiteConfig.brand as Record<string, unknown> : {};
  return {
    ...data,
    site: {...data.site, brand: {...data.site.brand, themeColor: typeof brand.themeColor === 'string' ? brand.themeColor : data.site.brand.themeColor}},
    members: {
      team,
      community,
      ...(avatarProvider ? {avatarProvider} : {}),
    } as unknown as SiteData['members'],
  };
}

export async function matchesLegacyContentHash(data: SiteData, rawMembers: unknown, rawSite: unknown, expectedHash: string): Promise<boolean> {
  const bytes = new TextEncoder().encode(canonicalJson(legacyContentHashInput(data, rawMembers, rawSite)));
  const digest = await crypto.subtle.digest('SHA-256', bytes);
  const hash = Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, '0')).join('');
  return hash === expectedHash;
}
