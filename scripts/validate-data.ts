import fs from 'node:fs/promises';
import path from 'node:path';
import {execFileSync} from 'node:child_process';
import {canonicalJson} from '../src/data/canonical';
import {validateSiteData} from '../src/data/schema';
import {matchesLegacyContentHash} from '../src/data/schema-compat';
import {DATA_FILES, type DataManifest} from '../src/types/site-data';
import {createHash} from 'node:crypto';

const root = process.cwd();
const requested = process.argv[2] ?? 'data';

function git(args: string[]): string {
  return execFileSync('git', args, {cwd: root, encoding: 'utf8'}).toString();
}

function canResolveRef(ref: string): boolean {
  try {
    git(['rev-parse', '--verify', `${ref}^{commit}`]);
    return true;
  } catch {
    return false;
  }
}

async function readSourceFile(source: {directory?: string; ref?: string}, file: string): Promise<string> {
  if (source.directory) return fs.readFile(path.join(source.directory, file), 'utf8');
  return git(['show', `${source.ref}:data/${file}`]);
}

async function resolveSource(): Promise<{directory?: string; ref?: string}> {
  const requestedDirectory = path.resolve(root, requested);
  try {
    const stats = await fs.stat(requestedDirectory);
    if (stats.isDirectory()) return {directory: requestedDirectory};
  } catch {
    // The data branch may be available only as a Git ref.
  }

  const candidates = [process.env.DATA_REF, requested === 'data' ? 'data' : undefined, 'origin/data'].filter(Boolean) as string[];
  const ref = candidates.find(canResolveRef);
  if (!ref) throw new Error('找不到待校验的 data 目录或 Git ref');
  return {ref};
}

const source = await resolveSource();
const files = Object.fromEntries(
  await Promise.all(
    DATA_FILES.map(async (file) => [file, JSON.parse(await readSourceFile(source, file)) as unknown]),
  ),
);
const site = files['site.json'] as Record<string, unknown>;
const data = validateSiteData({
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
const manifest = JSON.parse(await readSourceFile(source, 'manifest.json')) as DataManifest;
const contentHash = createHash('sha256').update(canonicalJson(data)).digest('hex');
if (manifest.schemaVersion !== data.schemaVersion) throw new Error('manifest schemaVersion 不匹配');
if (manifest.contentHash !== contentHash && !(await matchesLegacyContentHash(data, files['members.json'], files['site.json'], manifest.contentHash))) throw new Error(`manifest contentHash 不匹配：${manifest.contentHash} != ${contentHash}`);
for (const file of DATA_FILES) {
  if (!manifest.files.includes(file)) throw new Error(`manifest 缺少 ${file}`);
}
console.log(`data 校验通过：${DATA_FILES.length} 个 JSON，内容哈希 ${contentHash}`);
