import path from 'node:path';
import fs from 'node:fs';
import { pathToFileURL } from 'node:url';
import { red } from 'picocolors';
import { build } from 'tsup';
import { dynamicImport } from './utils';
import { Plugin } from './plugin';
// import { build } from 'tsup';
// 存放所有和配置相关的内容

// 配置文件环境
type ConfigEnv = 'dev' | 'prod' | 'test';

type Entry = string[] | Record<string, string>;

// 基本配置
interface basicConfig {
  entry: Entry;
}
// 开发配置
interface serverConfig {
  host: string;
  port: number;
}
// 打包配置
interface buildConfig {
  outfile: string;
  outDir: string;
}
// 配置文件类型
export interface Config {
  basic?: basicConfig;
  dev?: serverConfig;
  build?: buildConfig;
  plugins?: [];
  deplay?: any;
}

/**
 *
 * @param configEnv 运行的环境 dev | prod | test
 * @param configRoot 配置文件存放目录(命令运行目录)
 * @param configFile 配置文件名称
 */
export const loadConfigFromFile = async (
  configEnv: ConfigEnv,
  configRoot: string,
  configFile?: string
): Promise<{
  path: string;
  config: Config;
}> => {
  let userConfig;
  // 1.确定配置文件的格式
  const flags = judgeFileFormat(configRoot, configFile);
  if (flags === null) {
    return {
      path: configRoot,
      config: {}
    };
  }
  const { resolvedPath, isESM, isTS } = flags;
  // 2.加载配置文件，根据不同的格式，有不同的加载方法
  // 对配置文件进行打包，输出 code 代码文本和 dependcies 该文件的依赖
  try {
    const bundleConfigFileName = `config-${+Date.now()}`;

    await build({
      entry: {
        [`${bundleConfigFileName}`]: resolvedPath
      },
      outDir: configRoot,
      format: isESM ? 'esm' : 'cjs',
      target: 'es2020',
      splitting: false,
      treeshake: 'recommended'
    });
    if (isESM) {
      userConfig = await dynamicImport(
        pathToFileURL(`${path.resolve(configRoot, bundleConfigFileName)}.js`)
      );
    } else {
      userConfig = require(`${path.resolve(
        configRoot,
        bundleConfigFileName
      )}.js`);
    }

    // 模拟清空命令行
    // process.stdout.write('\x1Bc');
    fs.rmSync(path.resolve(configRoot, bundleConfigFileName + '.js'));
    if (!userConfig) {
      // 加载普通的 CJS 格式的配置文件
      userConfig = {};
    }
    // 如果配置是函数，则调用，其返回值作为配置
    const config = await (typeof userConfig === 'function'
      ? userConfig.default(configEnv)
      : userConfig);
    // 3.返回配置文件信息
    return {
      path: resolvedPath,
      config: config.default
    };
  } catch (e) {
    console.log('未存在配置文件', e);
    // console.error('出错了', e);
  }
  return {
    path: configRoot,
    config: {}
  };
};

type ConfigType = {
  isTS: boolean;
  isESM: boolean;
  resolvedPath: string;
};

export const judgeFileFormat = (
  configRoot: string,
  configFile?: string
): ConfigType => {
  // 配置文件的真实路径
  let resolvedPath = '';
  let isTS = false;
  let isESM = false;
  // 1.1 沿着运行目录往上查找，找到最近的 package.json 确定是否为 ESM
  try {
    const path = lookupFile(configRoot, 'package.json');
    if (!path) {
      console.log(red('❌ 运行目录不合法!!!'));
    }
    const pkg = require(path!);
    if (pkg && pkg.type === 'module') {
      isESM = true;
    }
  } catch (e) {
    console.log(red('❌ 查找 package.json 文件过程出错!!!'));
  }
  // 1.2 有指定的配置文件
  if (configFile) {
    resolvedPath = path.resolve(configFile);
    // 根据后缀判断是否为 ts 文件
    isTS = configFile.endsWith('.ts');
    // 根据后缀判断是否为 ESM
    isESM = configFile.endsWith('.mjs') || configFile.endsWith('.mts');
  }
  // 1.3 没有指定配置文件
  else {
    // 1.3.1 尝试使用 chovrio.config.js
    const jsConfigFile = path.resolve(configRoot, 'chovrio.config.js');
    if (fs.existsSync(jsConfigFile)) {
      resolvedPath = jsConfigFile;
    }
    // 1.3.2 尝试使用 chovrio.config.mjs
    if (!resolvedPath) {
      const mjsconfigFile = path.resolve(configRoot, 'chovrio.config.mjs');
      if (fs.existsSync(mjsconfigFile)) {
        resolvedPath = mjsconfigFile;
        isESM = true;
      }
    }
    // 1.3.3 尝试使用 chovrio.config.ts
    if (!resolvedPath) {
      const tsconfigFile = path.resolve(configRoot, 'chovrio.config.ts');
      if (fs.existsSync(tsconfigFile)) {
        resolvedPath = tsconfigFile;
        isTS = true;
      }
    }
    // 1.3.4 尝试使用 chovrio.config.cjs
    if (!resolvedPath) {
      const cjsConfigFile = path.resolve(configRoot, 'chovrio.config.cjs');
      if (fs.existsSync(cjsConfigFile)) {
        resolvedPath = cjsConfigFile;
        isESM = false;
      }
    }
  }
  return {
    resolvedPath,
    isTS,
    isESM
  };
};

/**
 * @description 逐步往上级查找对应文件
 * @param directory 查找目录
 * @param fileName 查找文件
 * @returns {string | null}
 */
export function lookupFile(directory: string, fileName: string): string | null {
  let currentPath = directory;
  let flag = true;
  while (flag) {
    const filePath = path.join(currentPath, fileName);
    if (fs.existsSync(filePath)) {
      flag = false;
      return filePath;
    }
    // 上级目录
    const parentPath = path.dirname(currentPath);
    // 已经到达根目录了，未找到指定文件
    if (parentPath === currentPath) {
      flag = false;
      return null;
    }
    currentPath = parentPath;
  }
  return null;
}

interface IConfig {
  plugins: Plugin[];
}
export const defineConfig = (config: IConfig) => config;
