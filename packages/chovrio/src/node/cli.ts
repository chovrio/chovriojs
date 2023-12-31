import cac from 'cac';
import { loadConfigFromFile } from './config';
import { startDevServer } from './server';
const cli = cac();

// [] 中的内容为可选参数，也就是说仅输入 `vite` 命令下回执行下面的逻辑
// dev
cli
  .command('[root]', 'Run the development server')
  .alias('server')
  .alias('dev')
  .action(async (root: string, options: any) => {
    let config;
    try {
      const userConfig = await loadConfigFromFile('dev', process.cwd());
      config = userConfig.config;
    } catch {
      config = {};
    }
    await startDevServer(config);
  });

cli
  .command('build [root]', 'build project')
  .alias('--name [name]')
  .action(async (root: string, options: any) => {
    const config = await loadConfigFromFile('prod', process.cwd());
    console.log(root, options, config);
  });

cli.help();
cli.parse();
