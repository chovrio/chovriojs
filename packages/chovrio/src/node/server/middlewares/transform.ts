import { NextHandleFunction } from 'connect';
import {
  isJSRequest,
  cleanUrl,
  isImportRequest,
  isVUERequest
} from '../../utils';
import { ServerContext } from '..';
import { isCSSRequest } from '../../utils';
import createDebug from 'debug';

const debug = createDebug('dev');

export async function transformRequest(
  url: string,
  serverContext: ServerContext
): Promise<any> {
  const { moduleGraph, pluginContainer } = serverContext;
  url = cleanUrl(url);
  let mod = await moduleGraph.getModuleByUrl(url);
  if (mod && mod.transformResult) {
    return mod.transformResult;
  }
  // 简单来说,就是依次调用插件容器 resolveId、load、transform 方法
  const resolvedResult = await pluginContainer.resolveId(url);
  let transformResult;
  if (resolvedResult?.id) {
    let code = await pluginContainer.load(resolvedResult.id);
    if (typeof code === 'object' && code !== null) {
      code = code.code;
    }
    mod = await moduleGraph.ensureEntryFromUrl(url);
    if (code) {
      transformResult = await pluginContainer.transform(
        code,
        resolvedResult.id
      );
    }
  }
  return transformResult;
}

export function transformMiddleware(
  serverContext: ServerContext
): NextHandleFunction {
  return async (req, res, next) => {
    if (req.method !== 'GET' || !req.url) {
      return next();
    }
    const url = req.url;
    debug('transformMiddleware：%s', url);
    // transform JS request
    if (
      isJSRequest(url) ||
      isCSSRequest(url) ||
      isImportRequest(url) ||
      isVUERequest(url)
    ) {
      // 核心编译函数
      let result = await transformRequest(url, serverContext);
      if (!result) {
        return next();
      }
      if (result && typeof result !== 'string') {
        result = result.code;
      }
      res.statusCode = 200;
      res.setHeader('Content-Type', 'application/javascript');
      return res.end(result);
    }
    next();
  };
}
