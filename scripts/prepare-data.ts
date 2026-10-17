import fs from 'node:fs/promises';
import path from 'node:path';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {canonicalJson} from '../src/data/canonical';
import {validateSiteData} from '../src/data/schema';
import {matchesLegacyContentHash} from '../src/data/schema-compat';
import {DATA_FILES, type DataManifest, type SiteData} from '../src/types/site-data';

const root = process.cwd();
const generatedDir = path.join(root, 'src', 'generated');
const localAssetsDir = path.join(root, 'public', 'data-assets');
const dataRefCandidates = [process.env.DATA_REF, 'data', 'origin/data'].filter(Boolean) as string[];

function git(args: string[], options: {encoding?: BufferEncoding} = {}): string {
  return execFileSync('git', args, {cwd: root, encoding: options.encoding ?? 'utf8'}).toString().trim();
}

function resolveDataRef(): {ref: string; sha: string} {
  for (const candidate of dataRefCandidates) {
    try {
      const sha = git(['rev-parse', '--verify', `${candidate}^{commit}`]);
      if (sha) return {ref: candidate, sha};
    } catch {
      // Try the next known ref.
    }
  }
  throw new Error('找不到 data 分支。请先创建并推送同仓库的 data 分支，或设置 DATA_REF 指向有效提交。');
}

function readGitFile(ref: string, relativePath: string): string {
  return git(['show', `${ref}:data/${relativePath}`]);
}

function readJson<T>(ref: string, relativePath: string): T {
  try {
    return JSON.parse(readGitFile(ref, relativePath)) as T;
  } catch (error) {
    throw new Error(`无法读取或解析 data/${relativePath}: ${error instanceof Error ? error.message : String(error)}`);
  }
}

function combineFiles(files: Record<string, unknown>): SiteData {
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

function hash(value: string): string {
  return createHash('sha256').update(value).digest('hex');
}

function generatedModule(name: string, typeName: string, value: unknown): string {
  return `import type {${typeName}} from '@/src/types/site-data';\n\nexport const ${name}: ${typeName} = ${JSON.stringify(value, null, 2)} as ${typeName};\n`;
}

const {ref, sha} = resolveDataRef();
const files = Object.fromEntries(DATA_FILES.map((file) => [file, readJson<unknown>(ref, file)]));
const data = combineFiles(files);
const contentHash = hash(canonicalJson(data));
const manifest = readJson<DataManifest>(ref, 'manifest.json');
if (manifest.schemaVersion !== data.schemaVersion) throw new Error('manifest.json 与数据 schemaVersion 不一致');
for (const file of DATA_FILES) {
  if (!manifest.files.includes(file)) throw new Error(`manifest.json 缺少 ${file}`);
}
if (manifest.contentHash !== contentHash && !(await matchesLegacyContentHash(data, files['members.json'], files['site.json'], manifest.contentHash))) {
  throw new Error(`manifest.json contentHash 不匹配：期望 ${contentHash}，实际 ${manifest.contentHash}`);
}

const meta = {
  schemaVersion: data.schemaVersion,
  dataBranch: (data.site.repository.dataBranch || 'data'),
  dataCommitSha: sha,
  contentRevision: manifest.contentRevision,
  contentHash,
  builtAt: new Date().toISOString(),
  ...(process.env.GITHUB_SHA ? {buildCommitSha: process.env.GITHUB_SHA} : {}),
};

await fs.rm(generatedDir, {recursive: true, force: true});
await fs.mkdir(generatedDir, {recursive: true});
await fs.writeFile(path.join(generatedDir, 'site-data.ts'), generatedModule('SITE_DATA', 'SiteData', data), 'utf8');
await fs.writeFile(path.join(generatedDir, 'build-meta.ts'), generatedModule('BUILD_META', 'BuildMeta', meta), 'utf8');

await fs.rm(localAssetsDir, {recursive: true, force: true});
await fs.mkdir(localAssetsDir, {recursive: true});
let assetPaths: string[] = [];
try {
  assetPaths = execFileSync('git', ['-c', 'core.quotePath=false', 'ls-tree', '-r', '--name-only', '-z', ref, 'data/assets'])
    .toString('utf8')
    .split('\0')
    .filter(Boolean);
} catch {
  assetPaths = [];
}
for (const assetPath of assetPaths) {
  const relative = assetPath.replace(/^data\/assets\//, '');
  const destination = path.join(localAssetsDir, relative);
  await fs.mkdir(path.dirname(destination), {recursive: true});
  await fs.writeFile(
    destination,
    execFileSync('git', ['show', `${ref}:${assetPath}`], {maxBuffer: 64 * 1024 * 1024}),
  );
}

console.log(`已准备 data 快照：${sha.slice(0, 12)}，内容哈希：${contentHash.slice(0, 12)}，资源：${assetPaths.length}`);
