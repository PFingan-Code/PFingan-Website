import {canonicalJson} from '@/src/data/canonical';
import {CURRENT_SCHEMA_VERSION, validateSiteData} from '@/src/data/schema';
import {assertManagedAssetPath, MAX_ASSET_BATCH_BYTES, toBase64, type PreparedAsset} from '@/src/lib/assets';
import {EDITABLE_ASSET_PREFIX, EDITABLE_DATA_FILES, type AssetManifestEntry, type DataManifest, type DataFileName} from '@/src/types/site-data';
import {GitHubApiError, GitHubClient} from '@/src/lib/github-api';
import type {SiteData} from '@/src/types/site-data';

export const EDITABLE_FILES = new Set<string>([...EDITABLE_DATA_FILES, 'data/manifest.json']);

export type AssetChange =
  | {kind: 'upsert'; asset: PreparedAsset}
  | {kind: 'delete'; path: string};

export interface DataCommitResult {
  commitSha: string;
  contentHash: string;
  assetHash: string;
  manifest: DataManifest;
}

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
  return digestText(canonicalJson(data));
}

export async function calculateAssetHash(assets: AssetManifestEntry[]): Promise<string> {
  return digestText(canonicalJson([...assets].sort((left, right) => left.path.localeCompare(right.path))));
}

export function updateAssetManifest(previous: AssetManifestEntry[] | undefined, changes: AssetChange[]): AssetManifestEntry[] {
  const entries = new Map((previous ?? []).map((entry) => [entry.path, entry]));
  for (const change of changes) {
    assertManagedAssetPath(change.kind === 'upsert' ? change.asset.path : change.path);
    if (change.kind === 'upsert') {
      entries.set(change.asset.path, {
        path: change.asset.path,
        sha256: change.asset.sha256,
        bytes: change.asset.bytes.byteLength,
        contentType: change.asset.contentType,
      });
    } else {
      entries.delete(change.path);
    }
  }
  return [...entries.values()].sort((left, right) => left.path.localeCompare(right.path));
}

export async function commitDataFiles(options: {
  client: GitHubClient;
  branch: string;
  currentFiles: Record<DataFileName, unknown>;
  manifest: DataManifest;
  expectedHeadSha: string;
  assetChanges?: AssetChange[];
  message: string;
}): Promise<DataCommitResult> {
  const {client, branch, currentFiles, manifest, expectedHeadSha} = options;
  const data = validateSiteData({...dataFilesToSiteData(currentFiles), schemaVersion: CURRENT_SCHEMA_VERSION});
  const contentHash = await calculateContentHash(data);
  const assetChanges = options.assetChanges ?? [];
  validateAssetChanges(data, assetChanges);
  const assets = updateAssetManifest(manifest.assets, assetChanges);
  const assetHash = await calculateAssetHash(assets);
  const nextManifest: DataManifest = {
    ...manifest,
    schemaVersion: CURRENT_SCHEMA_VERSION,
    contentRevision: manifest.contentRevision + 1,
    contentHash,
    assetHash,
    assets,
    updatedAt: new Date().toISOString(),
    files: [...Object.keys(currentFiles)],
  };

  const ref = await client.getReference(branch);
  if (ref.sha !== expectedHeadSha) {
    throw new GitHubApiError(409, 'conflict', 'data 分支已被其他修改更新，请重新读取后再提交');
  }
  const baseCommit = await client.getCommit(expectedHeadSha);
  const entries: Array<{path: string; sha: string | null}> = [];
  for (const file of Object.keys(currentFiles) as DataFileName[]) {
    const path = `data/${file}`;
    assertEditablePath(path);
    const blobSha = await client.createBlob(`${JSON.stringify(serializeDataFile(file, data), null, 2)}\n`);
    entries.push({path, sha: blobSha});
  }
  entries.push({path: 'data/manifest.json', sha: await client.createBlob(`${JSON.stringify(nextManifest, null, 2)}\n`)});
  for (const change of assetChanges) {
    const relativePath = change.kind === 'upsert' ? change.asset.path : change.path;
    assertManagedAssetPath(relativePath);
    const path = `data/${relativePath}`;
    assertEditablePath(path);
    entries.push({path, sha: change.kind === 'upsert' ? await client.createBlob(toBase64(change.asset.bytes), 'base64') : null});
  }
  const treeSha = await client.createTree(baseCommit.treeSha, entries);
  const commitSha = await client.createCommit(options.message.trim() || 'data: 更新站点内容', treeSha, expectedHeadSha);
  try {
    await client.updateReference(branch, commitSha);
  } catch (error) {
    if (error instanceof GitHubApiError && error.kind === 'conflict') {
      throw new GitHubApiError(409, 'conflict', '提交期间 data 分支已被其他修改更新，本次草稿未覆盖远端内容');
    }
    throw error;
  }
  return {commitSha, contentHash, assetHash, manifest: nextManifest};
}

function validateAssetChanges(data: SiteData, changes: AssetChange[]): void {
  const paths = new Set<string>();
  let uploadBytes = 0;
  for (const change of changes) {
    const path = change.kind === 'upsert' ? change.asset.path : change.path;
    assertManagedAssetPath(path);
    if (paths.has(path)) throw new Error(`同一提交中包含重复资源路径：${path}`);
    paths.add(path);
    if (change.kind === 'upsert') uploadBytes += change.asset.bytes.byteLength;
  }
  if (uploadBytes > MAX_ASSET_BATCH_BYTES) throw new Error('单次新增或替换资源总量不能超过 20 MiB');

  const references = new Set<string>();
  const scan = (value: unknown) => {
    if (typeof value === 'string' && value.startsWith('assets/')) references.add(value);
    else if (Array.isArray(value)) value.forEach(scan);
    else if (value && typeof value === 'object') Object.values(value).forEach(scan);
  };
  scan(data);
  for (const change of changes) {
    if (change.kind === 'delete' && references.has(change.path)) {
      throw new Error(`资源仍被站点内容引用，不能删除：${change.path}`);
    }
  }
}

async function digestText(value: string): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value));
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, '0')).join('');
}
