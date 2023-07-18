import { defineConfig } from 'tsup';

export default defineConfig([
  {
    // 打包 node
    entry: {
      index: 'src/node/cli.ts'
    },
    outDir: 'dist/node',
    // 产物格式，包含 esm 和 cjs 格式
    format: ['esm', 'cjs'],
    // 目标语法
    target: 'es2020',
    // 生成 sourcemap
    sourcemap: true,
    // 没有拆包需求，关闭拆包能力
    splitting: false,
    dts: true,
    external: ['@babel/core', 'react-refresh']
  },
  {
    // 打包 client
    entry: {
      client: 'src/client/client.ts'
    },
    outDir: 'dist/client',
    // 产物格式，包含 esm 和 cjs 格式
    format: ['esm', 'cjs'],
    // 目标语法
    target: 'es2020',
    // 生成 sourcemap
    sourcemap: true,
    // 没有拆包需求，关闭拆包能力
    splitting: false,
    dts: true,
    external: ['@babel/core', 'react-refresh']
  }
]);
