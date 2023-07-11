import fs from 'node:fs';
import path from 'node:path';
import spawn from 'cross-spawn';
import minimist from 'minimist';
import prompts from 'prompts';
import { blue, cyan, green, red, reset, yellow } from 'kolorist';
import { emptyDir } from 'fs-extra';

const argv = minimist<{
  t?: string;
  template?: string;
}>(process.argv.slice(2), { string: ['_'] });
// 当前程序执行目录
const cwd = process.cwd();

type ColorFunc = (str: string | number) => string;
type Framework = {
  name: string;
  display: string;
  color: ColorFunc;
  variants: FrameworkVariant[];
};
type FrameworkVariant = {
  name: string;
  display: string;
  color: ColorFunc;
  customCommand?: string;
};

const FRAMEWORKS: Framework[] = [
  {
    name: 'none',
    display: 'None',
    color: yellow,
    variants: [
      {
        name: 'none-ts',
        display: 'TypeScript',
        color: blue
      },
      {
        name: 'none',
        display: 'JavaScript',
        color: yellow
      }
    ]
  },
  {
    name: 'react',
    display: 'React',
    color: cyan,
    variants: [
      {
        name: 'react-ts',
        display: 'TypeScript',
        color: blue
      },
      {
        name: 'react',
        display: 'JavaScript',
        color: yellow
      }
    ]
  },
  {
    name: 'vue',
    display: 'Vue',
    color: green,
    variants: [
      {
        name: 'vue-ts',
        display: 'TypeScript',
        color: blue
      },
      {
        name: 'vue',
        display: 'JavaScript',
        color: yellow
      }
    ]
  }
];
const TEMPLATES = FRAMEWORKS.map(
  f => (f.variants && f.variants.map(v => v.name)) || [f.name]
).reduce((a, b) => a.concat(b), []);

async function init() {
  // 命令行第一个参数，替换反斜杠 / 为空字符串
  const argTargetDir = formatTargetDir(argv._[0]);
  // 命令行参数 --template 或者 -t
  const argTemplate = argv.template || argv.t;
  const defaultTargetDir = 'chovrio-project';
  let targetDir = argTargetDir || defaultTargetDir;
  // 获取项目名
  const getProjectName = () =>
    targetDir === '.' ? path.basename(path.resolve()) : targetDir;

  let result: prompts.Answers<
    'projectName' | 'overwrite' | 'packageName' | 'framework' | 'variant'
  >;
  try {
    result = await prompts(
      [
        {
          type: argTargetDir ? null : 'text',
          name: 'projectName',
          message: reset('Project name:'),
          initial: defaultTargetDir,
          onState: state => {
            targetDir = formatTargetDir(state.value) || defaultTargetDir;
          }
        },
        {
          type: () =>
            !fs.existsSync(targetDir) || isEmpty(targetDir) ? null : 'confirm',
          name: 'overwrite',
          message: () =>
            targetDir === '.'
              ? 'Current directory'
              : `Target directory "${targetDir}"` +
                ` is not empty. Remove existing files and continue?`
        },
        {
          type: (_, { overwrite }: { overwrite?: boolean }) => {
            if (overwrite === false) {
              throw new Error(red('✖') + ' Operation cancelled');
            }
            return null;
          },
          name: 'overwriteChecker'
        },
        {
          type: () => (isValidPackageName(getProjectName()) ? null : 'text'),
          name: 'packageName',
          message: reset('Package name:'),
          validate: dir =>
            isValidPackageName(dir) || 'Invalid package.json name'
        },
        {
          type:
            argTemplate && TEMPLATES.includes(argTemplate) ? null : 'select',
          name: 'framework',
          message:
            typeof argTemplate === 'string' && !TEMPLATES.includes(argTemplate)
              ? reset(
                  `"${argTemplate}" isn't a valid template. Please choose from below: `
                )
              : reset(`Select a framework:`),
          initial: 0,
          choices: FRAMEWORKS.map(framework => {
            const frameworkColor = framework.color;
            return {
              title: frameworkColor(framework.display || framework.name),
              value: framework
            };
          })
        },
        {
          type: (framework: Framework) =>
            framework && framework.variants ? 'select' : null,
          name: 'variant',
          message: reset('Select a variant:'),
          choices: (framework: Framework) =>
            framework.variants.map(variant => {
              const variantColor = variant.color;
              return {
                title: variantColor(variant.display || variant.name),
                value: variant.name
              };
            })
        }
      ],
      {
        onCancel: () => {
          throw new Error(red('✖') + ' Operation cancelled');
        }
      }
    );
  } catch (cancelled: any) {
    console.log(cancelled.message);
    return;
  }

  // user choice associated with prompts
  const { framework, overwrite, packageName, variant } = result;
  const root = path.join(cwd, targetDir);
  if (overwrite) {
    emptyDir(root);
  } else if (!fs.existsSync(root)) {
    fs.mkdirSync(root, { recursive: true });
  }

  // determine template
  const template: string = variant || framework?.name || argTemplate;
  const pkgInfo = pkgFromUserAgent(process.env.npm_config_user_agent);
  const pkgManager = pkgInfo ? pkgInfo.name : 'npm';
  const isYarn1 = pkgManager === 'yarn' && pkgInfo?.version.startsWith('1.');

  const { customCommand } =
    FRAMEWORKS.flatMap(f => f.variants).find(v => v.name === template) ?? {};
  if (customCommand) {
    const fullCustomCommand = customCommand
      .replace(/^npm create /, () => {
        if (pkgManager === 'bun') {
          return 'bun x create-';
        }
        return `${pkgManager} create`;
      })
      .replace('@latest', () => (isYarn1 ? '' : '@latest'))
      .replace(/^npm exec/, () => {
        if (pkgManager === 'pnpm') {
          return 'pnpm dlx';
        }
        if (pkgManager === 'yarn' && !isYarn1) {
          return 'yarn dlx';
        }
        if (pkgManager === 'bun') {
          return 'bun x';
        }
        return 'npm exec';
      });
    const [command, ...args] = fullCustomCommand.split(' ');
    const replacedArgs = args.map(arg => arg.replace('TARGET_DIR', targetDir));
    const { status } = spawn.sync(command, replacedArgs, {
      stdio: 'inherit'
    });
    process.exit(status ?? 0);
  }
  console.log(`\nScaffolding project in ${root}...`);

  const templateDir = path.resolve(__dirname, '../', `${template}`);
  const write = (file: string, content?: string) => {
    const targetPath = path.join(root, renameFiles[file] ?? file);
    if (content) {
      fs.writeFileSync(targetPath, content);
    } else {
      copy(path.join(templateDir, file), targetPath);
    }
  };
  const files = fs.readdirSync(templateDir);
  for (const file of files.filter(f => f !== 'package.json')) {
    write(file);
  }
  const pkg = JSON.parse(
    fs.readFileSync(path.join(templateDir, `package.json`), 'utf-8')
  );
  pkg.name = packageName || getProjectName();
  write('package.json', JSON.stringify(pkg, null, 2) + '\n');

  const cdProjectName = path.relative(cwd, root);
  console.log(`\nDone. Now run:\n`);
  if (root !== cwd) {
    console.log(
      ` cd ${
        cdProjectName.includes(' ') ? `"${cdProjectName}"` : cdProjectName
      }`
    );
  }
  switch (pkgManager) {
    case 'yarn':
      console.log('   yarn');
      console.log('   yarn dev');
      break;
    default:
      console.log(`   ${pkgManager} install`);
      console.log(`   ${pkgManager} run dev`);
      break;
  }
  console.log();
}

init().catch(e => {
  console.error(e);
});
function formatTargetDir(targetDir: string) {
  return targetDir?.trim().replace(/\/+$/g, '');
}
function isValidPackageName(projectName: string) {
  return /^(?:@[a-z\d\-*~][a-z\d\-*._~]*\/)?[a-z\d\-~][a-z\d\-._~]*$/.test(
    projectName
  );
}
function isEmpty(path: string) {
  const files = fs.readdirSync(path);
  return files.length === 0 || (files.length === 1 && files[0] === '.git');
}
function pkgFromUserAgent(userAgent: string | undefined) {
  if (!userAgent) return undefined;
  const pkgSpec = userAgent.split(' ')[0];
  const pkgSpecArr = pkgSpec.split('/');
  return {
    name: pkgSpecArr[0],
    version: pkgSpecArr[1]
  };
}
const renameFiles: Record<string, string | undefined> = {
  _gitignore: '.gitignore'
};
function copy(src: string, dest: string) {
  const stat = fs.statSync(src);
  if (stat.isDirectory()) {
    copyDir(src, dest);
  } else {
    fs.copyFileSync(src, dest);
  }
}
function copyDir(srcDir: string, destDir: string) {
  fs.mkdirSync(destDir, { recursive: true });
  for (const file of fs.readdirSync(srcDir)) {
    const srcFile = path.resolve(srcDir, file);
    const destFile = path.resolve(destDir, file);
    copy(srcFile, destFile);
  }
}
