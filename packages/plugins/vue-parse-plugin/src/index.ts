import { Plugin, ServerContext } from 'chovrio';
import { readFileSync } from 'node:fs';
import { compileScript, compileStyle, compileTemplate } from 'vue/compiler-sfc';
export function vueParsePlugin(): Plugin {
  let serverContext: ServerContext;
  const include = /\.vue$/;
  return {
    name: 'm-chovrio:vue-parse-sfc',
    configureServer(s) {
      serverContext = s;
    },
    load(id) {
      if (id.endsWith('.vue')) {
        const code = readFileSync(id, 'utf-8');
        return {
          code
        };
      }
    },
    async transform(code: string, id: string) {
      // console.log(serverContext.moduleGraph);
      // compileTemplate({});
      if (id.endsWith('.vue')) {
        code = `console.log(1)
        export default {}
        `;
        return { code };
      }
      return null;
    }
  };
}
