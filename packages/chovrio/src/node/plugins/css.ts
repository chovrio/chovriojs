import { readFile } from 'fs-extra';
import { CLIENT_PUBLIC_PATH } from '../constants';
import { Plugin } from '../plugin';
import { ServerContext } from '../server';
import { getShortName, normalizePath } from '../utils';

export function cssPlugin(): Plugin {
  let serverContext: ServerContext;
  return {
    name: 'm-chovrio:css',
    configureServer(s) {
      serverContext = s;
    },
    load(id) {
      // 加载
      if (id.endsWith('.css')) {
        return readFile(id, 'utf-8');
      }
    },
    // 转换逻辑
    async transform(code, id) {
      if (id.endsWith('.css')) {
        // 包装成 JS 模块
        const jsContent = `
import { createHotContext as __chovrio__createHotContext } from "${CLIENT_PUBLIC_PATH}";
import.meta.hot = __chovrio__createHotContext("/${getShortName(
          normalizePath(id),
          serverContext.root
        )}");
import { updateStyle, removeStyle } from "${CLIENT_PUBLIC_PATH}"
  
const id = '${normalizePath(id)}';
const css = \`${code.replace(/\n/g, '')}\`;

updateStyle(id, css);
import.meta.hot.accept();
export default css;
import.meta.hot.prune(() => removeStyle(id));`.trim();
        return {
          code: jsContent
        };
      }
      return null;
    }
  };
}
