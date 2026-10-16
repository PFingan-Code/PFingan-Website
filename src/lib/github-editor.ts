import {canonicalJson} from '@/src/data/canonical';
import {validateSiteData} from '@/src/data/schema';
import {EDITABLE_ASSET_PREFIX, EDITABLE_DATA_FILES, type DataManifest, type DataFileName} from '@/src/types/site-data';
import {GitHubClient} from '@/src/lib/github-api';
import type {SiteData} from '@/src/types/site-data';

export const EDITABLE_FILES = new Set<string>([...EDITABLE_DATA_FILES, 'data/manifest.json']);

export function assertEditablePath(path: string): void {
  if (path.includes('..') || path.startsWith('/') || path.includes('\\')) throw new Error('文件路径不安全');
  if (!EDITABLE_FILES.has(path) && !path.startsWith(EDITABLE_ASSET_PREFIX)) throw new Error('该路径不在可编辑白名单中');
}

export function serializeDataFile(file: DataFileName, data: SiteData): unknown {
  switch (file) {
    case 'site.json':
      return {schemaVersion: data.schemaVersion, site: data.site, navigation: data.navigation, contact: data.contact, home: data.home, announcements: data.announcements};
    case 'features.json': return {items: data.features};
    case 'servers.json': return {items: data.servers};
    case 'resources.json': return {items: data.resources};
    case 'members.json': return data.members;
    case 'moments.json': return data.moments;
    case 'donations.json': return data.donations;
  }
}

export function dataFilesToSiteData(files: Record<DataFileName, unknown>): SiteData {
  const site = files['site.json'] as Record<string, unknown>;
  return validateSiteData({
    schemaVersion: site.schemaVersion,
    site: site.site,
    navigation: site.navigation,
    contact: site.contact,
    home: site.home,
    announcements: site.announcements,
    features: (files['features.json'] as {items: unknown[]}).items,
    servers: (files['servers.json'] as {items: unknown[]}).items,
    resources: (files['resources.json'] as {items: unknown[]}).items,
    members: files['members.json'],
    moments: files['moments.json'],
    donations: files['donations.json'],
  });
}

export async function calculateContentHash(data: SiteData): Promise<string> {
  const bytes = new TextEncoder().encode(canonicalJson(data));
  const digest = await crypto.subtle.digest('SHA-256', bytes);
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, '0')).join('');
}

export interface DataCommitResult {
  commitSha: string;
  contentHash: string;
}

export async function commitDataFiles(options: {
  client: GitHubClient;
  branch: string;
  currentFiles: Record<DataFileName, unknown>;
  manifest: DataManifest;
  message: string;
}): Promise<DataCommitResult> {
  const {client, branch, currentFiles, manifest} = options;
  const data = dataFilesToSiteData(currentFiles);
  const contentHash = await calculateContentHash(data);
  const nextManifest: DataManifest = {
    ...manifest,
    contentRevision: manifest.contentRevision + 1,
    contentHash,
    updatedAt: new Date().toISOString(),
    files: [...Object.keys(currentFiles)],
  };
  const ref = await client.getReference(branch);
  const baseCommit = await client.getCommit(ref.sha);
  const entries: Array<{path: string; sha: string}> = [];
  for (const file of Object.keys(currentFiles) as DataFileName[]) {
    const path = `data/${file}`;
    assertEditablePath(path);
    const blobSha = await client.createBlob(`${JSON.stringify(serializeDataFile(file, data), null, 2)}\n`);
    entries.push({path, sha: blobSha});
  }
  entries.push({path: 'data/manifest.json', sha: await client.createBlob(`${JSON.stringify(nextManifest, null, 2)}\n`)});
  const treeSha = await client.createTree(baseCommit.treeSha, entries);
  const commitSha = await client.createCommit(options.message.trim() || 'data: 更新站点内容', treeSha, ref.sha);
  await client.updateReference(branch, commitSha);
  return {commitSha, contentHash};
}
