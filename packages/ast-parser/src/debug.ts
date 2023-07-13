import { parse } from './index';
const ast = parse('let a = function() {}');
console.log(JSON.stringify(ast, null, 2));
