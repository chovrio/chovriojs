import path from 'path';
import { build } from 'esbuild';
import { green, red } from 'picocolors';
import { scanPlugin } from './scanPlugin';
import { PRE_BUNDLE_DIR } from '../constants';
import { preBundlePlugin } from './preBundlePlugin';
import { determineEntryFile } from '../utils';
export async function optimize(root: string) {
  // 1.确定入口
  const entry = determineEntryFile(root);
  if (entry === null) {
    console.log(
      red(`入口文件不存在, 请确定根目录或src目录下存在main.{js,ts,jsx,tsx}文件`)
    );
  }
  // 2.从入口处扫描依赖
  const deps = new Set<string>();
  await build({
    entryPoints: [entry!],
    bundle: true,
    write: false,
    plugins: [scanPlugin(deps)]
  });
  console.log(
    `${green('需要预构建的依赖')}:\n${[...deps]
      .map(green)
      .map(item => `  ${item}`)
      .join('\n')}`
  );
  // 3.预构建依赖
  await build({
    entryPoints: [...deps],
    write: true,
    bundle: true,
    format: 'esm',
    splitting: true,
    outdir: path.resolve(root, PRE_BUNDLE_DIR),
    plugins: [preBundlePlugin(deps)]
  });
}
