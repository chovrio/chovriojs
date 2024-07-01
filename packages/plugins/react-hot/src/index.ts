import { transformAsync } from '@babel/core';
import template from '@babel/template';
import path from 'node:path';
import fs from 'node:fs';
import {
  isCallExpression,
  isReturnStatement,
  isMemberExpression,
  isFunctionExpression,
  isArrowFunctionExpression
} from '@babel/types';
const runtimePublicPath = 'virtual:@react-refresh';
const ast = template.ast;
const preambleCode = `
import RefreshRuntime from "/${runtimePublicPath}"
RefreshRuntime.injectIntoGlobalHook(window)
window.$RefreshReg$ = () => {}
window.$RefreshSig$ = () => (type) => type
window.__vite_plugin_react_preamble_installed__ = true
`;

function babelReactRefreshPlugin(jsxFunNames: any) {
  return {
    name: 'babel-react-refresh-plugin',
    visitor: {
      VariableDeclaration(path: any) {
        const { node } = path; //获取当前拦截的ast
        const declaration = node.declarations[0]; //获取声明语句
        const name = declaration.id.name; //获取变量名
        let _isJsxFunction = false;
        //如果这个变量声明值是一个函数 看看返回值是不是React.createElement如果是需要记录
        if (isFunctionExpression(declaration.init)) {
          _isJsxFunction = isJsxFunction(declaration);
        }
        //也有可能是箭头函数
        else if (isArrowFunctionExpression(declaration.init)) {
          //可能是()=>{return React.createElement}
          if (isJsxFunction(declaration)) {
            _isJsxFunction = true;
          }
          //可能是()=>React.createElement()类型
          else {
            if (
              isCallExpression(declaration.init.body) &&
              isMemberExpression(declaration.init.body.callee)
            ) {
              const callee = declaration.init.body.callee;
              //当前函数的返回值是否是以React.createElement开始的
              if (
                isMemberExpression(callee) &&
                // @ts-ignore
                callee.object.name === 'React' &&
                // @ts-ignore
                callee.property.name === 'createElement'
              ) {
                _isJsxFunction = true;
              }
            }
          }
        }

        //到这里就可以判断当前这个VariableDeclaration是否是一个需要被热处理的函数了
        if (_isJsxFunction) {
          //判断名称是否开头是大写
          if (!(name[0] >= 'A' && name[0] <= 'Z')) {
            return;
          }
          //将名称放入数组中 便于后面vite插件使用
          jsxFunNames.push(name);
          //在这个函数声明下面添加_c${n} = 函数名
          path.insertAfter(
            ast(
              `_c${jsxFunNames.length} = ${jsxFunNames[jsxFunNames.length - 1]}`
            )
          );
          path.skip(); //跳过后续子节点的遍历
        }
      },
      //这里的逻辑一样的
      FunctionDeclaration(path: any) {
        const { node } = path;
        const name = node.id.name;
        if (isJsxFunction({ init: node })) {
          if (!(name[0] >= 'A' && name[0] <= 'Z')) {
            return;
          }
          jsxFunNames.push(name);
          //在当前节点的后面插入_c1 = App
          path.insertAfter(
            ast(
              `_c${jsxFunNames.length} = ${jsxFunNames[jsxFunNames.length - 1]}`
            )
          ); //_c1 = App
          path.skip();
        }
      }
    }
  };
}

function isJsxFunction(declaration: any) {
  const body = declaration.init.body.body;
  if (!body) return false;
  const returnStatement = body[body.length - 1]; //最后一个可能是return语句
  //判断一下是返回语句且返回值是表达式调用
  if (
    isReturnStatement(returnStatement) &&
    isCallExpression(returnStatement.argument)
  ) {
    const callee = returnStatement.argument.callee;
    //如果是React.createElement 表示当前是一个函数组件
    if (
      isMemberExpression(callee) &&
      // @ts-ignore
      callee.object.name === 'React' &&
      // @ts-ignore
      callee.property.name === 'createElement'
    ) {
      return true;
    }
  }
  return false;
}

//这里是真正的vite-react-refresh导出的函数
export default function viteReact() {
  let resolvedConfig: any;
  //refresh插件
  const viteReactRefresh = {
    name: 'vite:react-refresh',
    enforce: 'pre',
    resolveId(id: string) {
      //如果请求的路径是"/@react-refresh"
      if (id === runtimePublicPath) {
        return '/' + runtimePublicPath;
      }
    },
    //接受当前的vite的config
    configResolved(config: any) {
      resolvedConfig = config;
    },
    //如果当前即将载入的内容路径是"/@react-refresh"
    async load(id: string) {
      if (id === '/' + runtimePublicPath) {
        let runtimeCode = ``;
        const root = resolvedConfig.root; //获取根目录
        //获取react-refresh的源代码路径
        const reactRefreshPath = path.resolve(
          root,
          'node_modules/react-refresh/cjs/react-refresh-runtime.development.js'
        );
        //尝试读取react-refresh文件
        try {
          const refreshCode = await fs.promises.readFile(
            reactRefreshPath,
            'utf-8'
          );

          //由于代码中含有process.env.NODE_ENV 浏览器是无法执行这段代码的
          //我们简单处理这个情况直接替换就可以了
          //同时我们还需要插入防抖的代码包装好 返回给接下来的vite钩子处理
          runtimeCode = `
        const exports = {}
        ${refreshCode.replace(
          'process.env.NODE_ENV',
          JSON.stringify('development')
        )}
          function debounce(fn, delay) {
          let handle
          return () => {
            clearTimeout(handle)
            handle = setTimeout(fn, delay)
          }
        }
        exports.performReactRefresh = debounce(exports.performReactRefresh, 16)
        export default exports
        `;
        } catch (e) {
          //错误处理
          console.log(`pluginError: [vite:react-refresh]错误 ${e}`);
        }
        //返回我们读取到的code
        return { code: runtimeCode };
      }
    },
    //当然别忘了注入react devtools api的代码哦
    //因为我自己的vite没有实现返回数组的形式,所以为了适配只能简单处理了
    //如果引入parser处理反而更麻烦了
    transformIndexHtml(html: string) {
      if (resolvedConfig.command === 'build') return html; //生产模式不执行这个钩子
      //我们匹配<head>标签获取他的位置
      const start = /<head>/g.exec(html)?.index;
      if (start) {
        //截取前面以及后面的代码
        const first = html.slice(0, start + 6);
        const last = html.slice(start + 6, html.length);
        //插入我们已经包装好的代码
        return first + `<script type="module">${preambleCode}</script>` + last;
      }
    }
  };

  const babelTransform = {
    name: 'vite:transform-refresh',
    //利用babel插件转换代码 如果有需要热更新的jsx函数需要注入热更新代码
    async transform(code: string, id: string) {
      //如果是build模式则不执行这个transform钩子(热更新不需要在生产模式中)
      if (resolvedConfig.command === 'build') return code;
      const ext = ['.jsx', '.tsx'];
      if (!ext.includes(path.extname(id))) return code; //如果不是jsx tsx不处理
      const jsxFunNames: string[] = []; //用于收集需要热更新的函数名
      //利用babel/core自带的api注入我们刚才写的babel插件执行代码的转换
      // @ts-ignore
      const { code: transformCode } = await transformAsync(code, {
        plugins: [babelReactRefreshPlugin(jsxFunNames)]
      });
      //如果没有需要热更新的地方 不插入热更新代码
      if (jsxFunNames.length === 0) {
        return code;
      }

      //拼接文件的头部
      const header = `
      import RefreshRuntime from "virtual:@react-refresh"
      if (!window.__vite_plugin_react_preamble_installed__) {
      throw new Error("@vitejs/plugin-react can't detect preamble. Something is wrong. See           https://github.com/vitejs/vite-plugin-react/pull/11#discussion_r430879201");
      }
      let prevRefreshReg;
      if (import.meta.hot) {
      prevRefreshReg = window.$RefreshReg$;
      window.$RefreshReg$ = (type, id) => {
      RefreshRuntime.register(type, "${id}" + id);
};
      window.$RefreshSig$ = RefreshRuntime.createSignatureFunctionForTransform;
}
`;
      //"_c1,_c2;" 拼接变量
      const Variables = jsxFunNames
        .map((a, index) => {
          const str =
            index === jsxFunNames.length - 1
              ? `_c${index + 1};`
              : `_c${index + 1},`;
          return str;
        })
        .join('');

      //$RefreshReg$(_c1,"App");
      const callExpression = jsxFunNames
        .map((a, index) => {
          return `$RefreshReg$(_c${index + 1}, "${a}");`;
        })
        .join('\r\n');

      //拼接底部模块
      const footer = `
       var ${Variables}
       ${callExpression}
       if (import.meta.hot) {
         window.$RefreshReg$ = prevRefreshReg;
         import.meta.hot.accept&&import.meta.hot.accept()
         if (!window.__vite_plugin_react_timeout) {
         window.__vite_plugin_react_timeout = setTimeout(() => {
          window.__vite_plugin_react_timeout = 0;
          RefreshRuntime.performReactRefresh();
    }, 30);
  }
}`;

      return {
        code: header + transformCode + footer
      };
    }
  };

  return [viteReactRefresh, babelTransform];
}
