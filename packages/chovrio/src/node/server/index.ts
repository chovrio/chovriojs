// connect 是一个具有中间件机制的轻量级 Node.js 框架。
// 既可以单独作为服务器，也可以接入到任何具有中间件机制的框架，如 Koa、Express
import connect from 'connect';
// picocolors 是一个用来再命令行显示不同颜色文本的工具
import { blue, green } from 'picocolors';
import chokidar, { FSWatcher } from 'chokidar';
import { optimize } from '../optimizer';
import { resolvePlugins } from '../plugins';
import { createPluginContainer, PluginContainer } from '../pluginContainer';
import { Plugin } from '../plugin';
import { indexHtmlMiddware } from './middlewares/indexHtml';
import { transformMiddleware } from './middlewares/transform';
import { staticMiddleware } from './middlewares/static';
import { ModuleGraph } from '../ModuleGraph';
import { createWebSocketServer } from '../ws';
import { bindingHMREvents } from '../hmr';
import { normalizePath } from '../utils';
import { Config } from '../config';

export interface ServerContext {
  command: 'dev' | 'build' | 'test';
  root: string;
  pluginContainer: PluginContainer;
  app: connect.Server;
  plugins: Plugin[];
  moduleGraph: ModuleGraph;
  ws: { send: (data: any) => void; close: () => void };
  watcher: FSWatcher;
}

export async function startDevServer(config: Config) {
  const app = connect();
  const root = process.cwd();
  const startTime = Date.now();
  let plugins = resolvePlugins();
  if (config.plugins?.length) {
    plugins = [...plugins, ...config.plugins.flat(Infinity)];
  }
  // console.log(plugins.length);
  // console.log(plugins);
  const moduleGraph = new ModuleGraph(url => pluginContainer.resolveId(url));
  const pluginContainer = createPluginContainer(plugins);
  // WebSocket 对象
  const ws = createWebSocketServer(app);
  // 监听除了node_modules和.git文件夹以外的文件的变化
  const watcher = chokidar.watch(root, {
    ignored: ['**/node_modules/**', '**/.git/**'],
    ignoreInitial: true
  });
  const serverContext: ServerContext = {
    command: 'dev',
    root: normalizePath(process.cwd()),
    app,
    pluginContainer,
    plugins,
    moduleGraph,
    ws,
    watcher
  };
  bindingHMREvents(serverContext);
  for (const plugin of plugins) {
    if (plugin.configureServer) {
      await plugin.configureServer(serverContext);
    }
  }

  app.use(transformMiddleware(serverContext));
  // 处理入口 HTML 资源
  app.use(indexHtmlMiddware(serverContext));
  app.use(staticMiddleware(serverContext.root));
  app.listen(3000, async () => {
    await optimize(root);
    console.log(
      green('🚀 No-Bundle 服务已经成功启动!'),
      `耗时: ${Date.now() - startTime}ms`
    );
  });
  console.log(`> 本地访问路径: ${blue('http://localhost:3000')}`);
}
