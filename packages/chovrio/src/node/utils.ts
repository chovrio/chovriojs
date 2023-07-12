import os from 'node:os';
import fs from 'node:fs';
import path from 'node:path';
import {
  CLIENT_PUBLIC_PATH,
  HASH_RE,
  JS_TYPES_RE,
  QEURY_RE
} from './constants';
// 将 \ -> /
export function slash(p: string): string {
  return p.replace(/\\/g, '/');
}
// 判断是否是 windows 系统
export const isWindows = os.platform() === 'win32';

export function normalizePath(id: string): string {
  return path.posix.normalize(isWindows ? slash(id) : id);
}

export const isJSRequest = (id: string): boolean => {
  id = cleanUrl(id);
  if (JS_TYPES_RE.test(id)) {
    return true;
  }
  if (!path.extname(id) && !id.endsWith('/')) {
    return true;
  }
  return false;
};
export const cleanUrl = (url: string): string =>
  url.replace(HASH_RE, '').replace(QEURY_RE, '');

export const isCSSRequest = (id: string): boolean =>
  cleanUrl(id).endsWith('.css');

export function isImportRequest(url: string): boolean {
  return url.endsWith('?import');
}

export function getShortName(file: string, root: string) {
  return file.startsWith(root + '/') ? path.posix.relative(root, file) : file;
}

export function removeImportQuery(url: string): string {
  return url.replace(/\?import$/, '');
}

const INTERNAL_LIST = [CLIENT_PUBLIC_PATH, '/@react-refresh'];

export function isInternalRequest(url: string): boolean {
  return INTERNAL_LIST.includes(url);
}

/**
 * 判断文件是否存在
 * @param root 目录路径
 * @param file 文件名
 * @returns {boolean} 是否存在该文件
 */
export function fileIsExist(root: string, file: string): string | null {
  const resolvedPath = path.resolve(root, file);
  if (fs.existsSync(resolvedPath)) {
    return resolvedPath;
  }
  return null;
}

export function determineEntryFile(root: string): string | null {
  return (
    fileIsExist(root, 'main.js') ||
    fileIsExist(root, 'main.ts') ||
    fileIsExist(root, 'main.jsx') ||
    fileIsExist(root, 'main.tsx') ||
    fileIsExist(root, 'src/main.js') ||
    fileIsExist(root, 'src/main.ts') ||
    fileIsExist(root, 'src/main.jsx') ||
    fileIsExist(root, 'src/main.tsx')
  );
}
