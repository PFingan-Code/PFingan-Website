import fs from 'node:fs/promises';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {canonicalJson} from '../src/data/canonical';
import {CURRENT_SCHEMA_VERSION, validateSiteData} from '../src/data/schema';
import {DATA_FILES, type DataManifest, type SiteData} from '../src/types/site-data';

const root = process.cwd();
const args = process.argv.slice(2);
if (args.includes('--help') || args.includes('-h')) {
  console.log('用法：npm run migrate:data -- <data 目录或工作树根目录> [--write]');
  console.log('默认只预检；添加 --write 后才会改写七个 JSON 和 manifest.json。');
  process.exit(0);
}
const requestedTarget = args.find((argument) => !argument.startsWith('-')) ?? 'data';
let target = path.resolve(root, requestedTarget);
const shouldWrite = args.includes('--write');
try {
  await fs.access(path.join(target, 'site.json'));
} catch {
  const nestedData = path.join(target, 'data');
  try {
    await fs.access(path.join(nestedData, 'site.json'));
    target = nestedData;
  } catch {
    throw new Error(`目标目录必须包含 site.json、manifest.json 和其他 data JSON：${target}`);
  }
}

const CONTENT_TYPES: Record<string, string> = {
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.webp': 'image/webp',
  '.pdf': 'application/pdf',
  '.zip': 'application/zip',
};

async function readJson<T>(file: string): Promise<T> {
  return JSON.parse(await fs.readFile(path.join(target, file), 'utf8')) as T;
}

async function walkAssets(directory: string, relative = ''): Promise<string[]> {
  let entries;
  try {
    entries = await fs.readdir(directory, {withFileTypes: true});
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') return [];
    throw error;
  }
  const files: string[] = [];
  for (const entry of entries) {
    if (entry.isSymbolicLink()) throw new Error(`资源目录不允许符号链接：${path.join(relative, entry.name)}`);
    const nextRelative = path.join(relative, entry.name);
    const nextPath = path.join(directory, entry.name);
    if (entry.isDirectory()) files.push(...await walkAssets(nextPath, nextRelative));
    else if (entry.isFile()) files.push(nextRelative);
  }
  return files;
}

function combine(raw: Record<string, unknown>): SiteData {
  const site = raw['site.json'] as Record<string, unknown>;
  return validateSiteData({
    schemaVersion: site.schemaVersion,
    site: site.site,
    navigation: site.navigation,
    contact: site.contact,
    home: site.home,
    announcements: site.announcements,
    features: (raw['features.json'] as {items: unknown[]}).items,
    servers: (raw['servers.json'] as {items: unknown[]}).items,
    resources: (raw['resources.json'] as {items: unknown[]}).items,
    members: raw['members.json'],
    moments: raw['moments.json'],
    donations: raw['donations.json'],
  });
}

function siteFile(data: SiteData): unknown {
  return {
    schemaVersion: data.schemaVersion,
    site: data.site,
    navigation: data.navigation,
    contact: data.contact,
    home: data.home,
    announcements: data.announcements,
  };
}

function hashText(value: string): string {
  return createHash('sha256').update(value).digest('hex');
}

const rawFiles = Object.fromEntries(
  await Promise.all(DATA_FILES.map(async (file) => [file, await readJson<unknown>(file)])),
);
const oldManifest = await readJson<DataManifest>('manifest.json');
const normalized = combine(rawFiles);
const data: SiteData = {...normalized, schemaVersion: CURRENT_SCHEMA_VERSION};
const assetRoot = path.join(target, 'assets');
const assetFiles = await walkAssets(assetRoot);
const assets = await Promise.all(assetFiles.map(async (relativePath) => {
  const bytes = await fs.readFile(path.join(assetRoot, relativePath));
  const contentType = CONTENT_TYPES[path.extname(relativePath).toLowerCase()] ?? 'application/octet-stream';
  const normalizedPath = `assets/${relativePath.split(path.sep).join('/')}`;
  return {
    path: normalizedPath,
    sha256: createHash('sha256').update(bytes).digest('hex'),
    bytes: bytes.byteLength,
    contentType,
  };
}));
assets.sort((left, right) => left.path.localeCompare(right.path));
const nextManifest: DataManifest = {
  ...oldManifest,
  schemaVersion: CURRENT_SCHEMA_VERSION,
  contentRevision: Number.isFinite(oldManifest.contentRevision) ? oldManifest.contentRevision + 1 : 1,
  contentHash: hashText(canonicalJson(data)),
  assetHash: hashText(canonicalJson(assets)),
  updatedAt: new Date().toISOString(),
  files: [...DATA_FILES],
  assets,
};

const output: Record<string, unknown> = {
  'site.json': siteFile(data),
  'features.json': {items: data.features},
  'servers.json': {items: data.servers},
  'resources.json': {items: data.resources},
  'members.json': data.members,
  'moments.json': data.moments,
  'donations.json': data.donations,
  'manifest.json': nextManifest,
};

const externalTeamAvatars = data.members.team.filter((member) => member.avatar && !member.avatar.startsWith('assets/'));
console.log(`待迁移目录：${target}`);
console.log(`schemaVersion：${normalized.schemaVersion} -> ${CURRENT_SCHEMA_VERSION}`);
console.log(`资源清单：${assets.length} 项`);
if (externalTeamAvatars.length > 0) {
  console.warn(`发现 ${externalTeamAvatars.length} 个团队头像仍是外部 URL：`);
  for (const member of externalTeamAvatars) console.warn(`- ${member.id}: ${member.avatar}`);
  if (shouldWrite) {
    throw new Error('迁移已停止：请先在后台为这些成员上传受控头像资源，再重新执行 --write；不会生成不符合 schema 2 的 data。');
  }
}
if (!shouldWrite) {
  console.log('预检完成。确认目标目录是 data 分支工作树后，添加 --write 才会写入文件。');
  process.exit(0);
}

for (const [file, value] of Object.entries(output)) {
  await fs.writeFile(path.join(target, file), `${JSON.stringify(value, null, 2)}\n`, 'utf8');
}
console.log(`迁移完成：${Object.keys(output).length} 个 JSON 文件已写入 ${target}`);
