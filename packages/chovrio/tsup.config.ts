import { defineConfig } from 'tsup';

export default defineConfig([
  {
    // 打包 node
    entry: ['src/node/cli.ts', 'src/node/index.ts', 'src/client/client.ts'],
    outDir: 'dist',
    // 产物格式，包含 esm 和 cjs 格式
    format: ['esm', 'cjs'],
    // 目标语法
    target: 'es2020',
    // 生成 sourcemap
    sourcemap: true,
    // 没有拆包需求，关闭拆包能力
    splitting: false,
    dts: {
      entry: 'src/node/index.ts'
    },
    external: ['@babel/core', 'react-refresh', 'rollup', 'esbuild']
  }
]);
