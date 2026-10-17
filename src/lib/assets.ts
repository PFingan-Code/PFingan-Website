import type {AssetManifestEntry} from '@/src/types/site-data';

export const MAX_ASSET_BYTES = 5 * 1024 * 1024;
export const MAX_ASSET_BATCH_BYTES = 20 * 1024 * 1024;

const FILE_TYPES: Record<string, {extension: string; kind: 'image' | 'attachment'}> = {
  'image/jpeg': {extension: 'jpg', kind: 'image'},
  'image/png': {extension: 'png', kind: 'image'},
  'image/webp': {extension: 'webp', kind: 'image'},
  'application/pdf': {extension: 'pdf', kind: 'attachment'},
  'application/zip': {extension: 'zip', kind: 'attachment'},
  'application/x-zip-compressed': {extension: 'zip', kind: 'attachment'},
};

export interface PreparedAsset {
  path: string;
  bytes: Uint8Array;
  contentType: string;
  sha256: string;
}

export function assetExtension(contentType: string): string {
  const definition = FILE_TYPES[contentType];
  if (!definition) throw new Error('仅支持 JPEG、PNG、WebP、PDF 和 ZIP 文件');
  return definition.extension;
}

export function assetKind(contentType: string): 'image' | 'attachment' {
  const definition = FILE_TYPES[contentType];
  if (!definition) throw new Error('不支持此文件类型');
  return definition.kind;
}

export function stableAssetPath(scope: 'site' | 'resources' | 'servers' | 'moments' | 'team' | 'donations', entityId: string, assetId: string, contentType: string): string {
  const extension = assetExtension(contentType);
  const entity = safePathSegment(entityId);
  const asset = safePathSegment(assetId);
  return scope === 'site'
    ? `assets/site/${asset}.${extension}`
    : `assets/${scope}/${entity}/${asset}.${extension}`;
}

export function safePathSegment(value: string): string {
  const normalized = value.toLowerCase().replace(/[^a-z0-9._-]+/g, '-').replace(/^-+|-+$/g, '');
  if (!normalized || normalized === '.' || normalized === '..') throw new Error('资源路径标识无效');
  return normalized.slice(0, 80);
}

export function assertManagedAssetPath(path: string): void {
  if (!/^assets\/(site\/[a-z0-9._-]+|resources\/[a-z0-9._-]+\/[a-z0-9._-]+|servers\/[a-z0-9._-]+\/[a-z0-9._-]+|moments\/[a-z0-9._-]+\/[a-z0-9._-]+|team\/[a-z0-9._-]+\/[a-z0-9._-]+|donations\/[a-z0-9._-]+\/[a-z0-9._-]+)\.(jpg|png|webp|pdf|zip)$/.test(path) && !/^assets\/(img|moments)\/[a-zA-Z0-9._/-]+$/.test(path)) {
    throw new Error(`资源路径不在受控目录中：${path}`);
  }
  if (path.includes('..') || path.includes('\\') || path.includes('?') || path.includes('#')) throw new Error('资源路径包含非法字符');
}

export async function prepareAsset(file: File, path: string): Promise<PreparedAsset> {
  if (file.size === 0 || file.size > MAX_ASSET_BYTES) throw new Error('单个文件必须大于 0 且不超过 5 MiB');
  const contentType = file.type.toLowerCase();
  const definition = FILE_TYPES[contentType];
  if (!definition) throw new Error('仅支持 JPEG、PNG、WebP、PDF 和 ZIP 文件');
  if (!path.toLowerCase().endsWith(`.${definition.extension}`)) throw new Error('资源扩展名与文件类型不匹配');
  const bytes = new Uint8Array(await file.arrayBuffer());
  if (!matchesSignature(bytes, contentType)) throw new Error('文件内容与声明的文件类型不匹配');
  if (definition.kind === 'image' && typeof createImageBitmap === 'function') {
    const bitmap = await createImageBitmap(file);
    bitmap.close();
  }
  const digest = await crypto.subtle.digest('SHA-256', bytes);
  const sha256 = Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, '0')).join('');
  return {path, bytes, contentType, sha256};
}

export function assetManifestEntry(asset: PreparedAsset): AssetManifestEntry {
  return {path: asset.path, sha256: asset.sha256, bytes: asset.bytes.byteLength, contentType: asset.contentType};
}

export function toBase64(bytes: Uint8Array): string {
  let binary = '';
  const chunkSize = 0x8000;
  for (let offset = 0; offset < bytes.length; offset += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(offset, offset + chunkSize));
  }
  return btoa(binary);
}

function matchesSignature(bytes: Uint8Array, contentType: string): boolean {
  const starts = (...values: number[]) => values.every((value, index) => bytes[index] === value);
  switch (contentType) {
    case 'image/png': return starts(0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a);
    case 'image/jpeg': return starts(0xff, 0xd8, 0xff);
    case 'image/webp': return starts(0x52, 0x49, 0x46, 0x46) && String.fromCharCode(...bytes.subarray(8, 12)) === 'WEBP';
    case 'application/pdf': return String.fromCharCode(...bytes.subarray(0, 5)) === '%PDF-';
    case 'application/zip':
    case 'application/x-zip-compressed': return starts(0x50, 0x4b, 0x03, 0x04) || starts(0x50, 0x4b, 0x05, 0x06) || starts(0x50, 0x4b, 0x07, 0x08);
    default: return false;
  }
}
