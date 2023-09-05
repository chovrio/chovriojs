import path from 'node:path';
import { HASH_RE, QEURY_RE } from './constants';
import os from 'node:os';

// 判断是否是 windows 系统
export const isWindows = os.platform() === 'win32';

export const cleanUrl = (url: string): string =>
  url.replace(HASH_RE, '').replace(QEURY_RE, '');

export function getShortName(file: string, root: string) {
  return file.startsWith(root + '/') ? path.posix.relative(root, file) : file;
}

export function normalizePath(id: string): string {
  return path.posix.normalize(isWindows ? slash(id) : id);
}

export function slash(p: string): string {
  return p.replace(/\\/g, '/');
}

export function removeImportQuery(url: string): string {
  return url.replace(/\?import$/, '');
}
