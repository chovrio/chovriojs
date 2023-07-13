/**
 * @description 节点的类型
 */
export enum NodeType {
  /** @description Program：表示整个程序或模块。*/
  Program = 'Program',
  /** @description VariableDeclaration：表示变量声明。 */
  VariableDeclaration = 'VariableDeclaration',
  /** @description FunctionDeclaration：表示函数声明。 */
  FunctionDeclaration = 'FunctionDeclaration',
  /** @description Identifier：表示标识符，即变量名或函数名等。 */
  Identifier = 'Identifier',
  /** @description BlockStatement：表示代码块，由大括号 {} 包围的一组语句。 */
  BlockStatement = 'BlockStatement',
  /** @description ExpressionStatement：表示表达式语句，即带有表达式的语句。 */
  ExpressionStatement = 'ExpressionStatement',
  /** @description ReturnStatement：表示返回语句，用于从函数中返回一个值。 */
  ReturnStatement = 'ReturnStatement',
  /** @description CallExpression：表示函数调用表达式，包括函数名和参数列表。 */
  CallExpression = 'CallExpression',
  /** @description BinaryExpression：表示二元表达式，即具有两个操作数和一个运算符的表达式。 */
  BinaryExpression = 'BinaryExpression',
  /** @description MemberExpression：表示成员表达式，用于访问对象的属性或方法。 */
  MemberExpression = 'MemberExpression',
  /** @description FunctionExpression：表示函数表达式，即将函数作为值进行赋值或传递的表达式。 */
  FunctionExpression = 'FunctionExpression',
  /** @description Literal：表示字面量，例如数字、字符串、布尔值等。 */
  Literal = 'Literal',
  /** @description ImportDeclaration：表示导入语句，用于引入其他模块的内容。 */
  ImportDeclaration = 'ImportDeclaration',
  /** @description ImportSpecifier：表示具体导入的内容，通常与 ImportDeclaration 结合使用。 */
  ImportSpecifier = 'ImportSpecifier',
  /** @description ImportDefaultSpecifier：表示默认导入的内容，通常与 ImportDeclaration 结合使用。 */
  ImportDefaultSpecifier = 'ImportDefaultSpecifier',
  /** @description ImportNamespaceSpecifier：表示命名空间导入的内容，通常与 ImportDeclaration 结合使用。 */
  ImportNamespaceSpecifier = 'ImportNamespaceSpecifier',
  /** @description ExportDeclaration：表示导出语句，用于将模块的内容暴露给其他模块使用。 */
  ExportDeclaration = 'ExportDeclaration',
  /** @description ExportSpecifier：表示具体要导出的内容，通常与 ExportDeclaration 结合使用。 */
  ExportSpecifier = 'ExportSpecifier',
  /** @description ExportDefaultDeclaration：表示默认导出的内容，通常与 ExportDeclaration 结合使用。 */
  ExportDefaultDeclaration = 'ExportDefaultDeclaration',
  /** @description ExportNamedDeclaration：表示具名导出的内容，通常与 ExportDeclaration 结合使用。 */
  ExportNamedDeclaration = 'ExportNamedDeclaration',
  /** @description ExportAllDeclaration：表示导出所有内容的声明，通常与 ExportDeclaration 结合使用。 */
  ExportAllDeclaration = 'ExportAllDeclaration',
  /** @description VariableDeclarator：表示变量声明符号，用于声明和初始化一个变量。 */
  VariableDeclarator = 'VariableDeclarator'
}

/** @description 函数的类型 */
export enum FunctionType {
  /** @description 函数声明 */
  FunctionDeclaration,
  /** @description @description 函数调用表达式 */
  CallExpression
}

/** @description 基础节点类型*/
export interface Node {
  /** @description NodeType 类型 */
  type: string;
  /** @description 节点开始索引 */
  start: number;
  /** @description 节点结束索引 */
  end: number;
}

/** @description 程序或模块节点类型 */
export interface Program extends Node {
  type: NodeType.Program;
  /** @description 程序里面的语句 也是一个一个的节点 */
  body: Statement[];
}

/** @description 字面量节点类型 */
export interface Literal extends Node {
  type: NodeType.Literal;
  /** @description 字面量 */
  value: string;
  /** @description 原始的、未经处理的字面量的字符串形式 */
  raw: string;
}

/** @description 标识符节点类型 */
export interface Identifier extends Node {
  type: NodeType.Identifier;
  /** 字面量 */
  name: string;
}

/** @description 函数调用表达式节点类型 */
export interface CallExpression extends Node {
  type: NodeType.CallExpression;
  /** @description 被调用的函数胡总和函数表达式 */
  callee: Expression;
  /** @description 函数参数列表 */
  arguments: Expression[];
}

/** @description 成员表达式节点类型 */
export interface MemberExpression extends Node {
  type: NodeType.MemberExpression;
  /** @description 对象部分是标识符或者表达式 */
  object: Identifier | MemberExpression;
  /** 属性部分是表达式 */
  property: Identifier;
  /** @description 是否使用计算表达式 */
  computed: boolean;
}

/** @description 代码块节点类型 */
export interface BlockStatement extends Node {
  type: NodeType.BlockStatement;
  /** @description 代码块里面包含的其它表达式的节点类型 */
  body: Statement[];
}

/** @description 表达式语句节点类型 */
export interface ExpressionStatement extends Node {
  type: NodeType.ExpressionStatement;
  /** @description 表达式类型 */
  expression: Expression;
}

/** @description 函数表达式类型节点 */
export interface FunctionExpression extends FunctionNode {
  type: NodeType.FunctionExpression;
}

/** @description 函数声明类型节点 */
export interface FunctionDeclaration extends FunctionNode {
  type: NodeType.FunctionDeclaration;
  /** @description 函数名称，为null就是匿名函数 */
  id: Identifier | null;
}

/** @description 声明变量的关键字 */
export type VariableKind = 'var' | 'let' | 'const';

/** @description 声明符号的节点类型 */
export interface VariableDeclarator extends Node {
  type: NodeType.VariableDeclarator;
  /** @description 变量名节点 */
  id: Identifier;
  /** @description 变量值节点 字面量 或 表达式 或null 即 let a; let a = xxx */
  init: Expression | Literal | null;
}

/** @description 变量声明的节点类型 */
export interface VariableDeclaration extends Node {
  type: NodeType.VariableDeclaration;
  /** 声明变量的关键字 */
  kind: 'var' | 'let' | 'const';
  /** 声明的变量 包含变量名和变量值 */
  declarations: VariableDeclarator[];
}

/**
 * @description 具体导入的节点类型
 * @example import { sum as sum1 } from 'math.js
 */
export interface ImportSpecifier extends Node {
  type: NodeType.ImportSpecifier;
  /** @description 表示导入的标识符，即在其他模块中可见和访问的标识符。 */
  imported: Identifier;
  /** @description 表示本地的标识符，即用于在当前模块内部引用导入标识符的名称。 */
  local: Identifier;
}

/**
 * @description 默认导入的节点类型
 * @example import A from "a.js"
 */
export interface ImportDefaultSpecifier extends Node {
  type: NodeType.ImportDefaultSpecifier;
  /** @description 表示默认绑定符号在其他模块中的标识符，即通常情况下为 default */
  imported: Identifier;
  /** @description 表示本地的标识符，即用于在当前模块内部引用默认绑定符号的名称。 */
  local: Identifier;
}

/**
 * @description 命名空间导入的节点类型
 * @example import "xxx.css"
 */
export interface ImportNamespaceSpecifier extends Node {
  type: NodeType.ImportNamespaceSpecifier;
  /** 表示本地的标识符，即定义在模块内部的标识符。 */
  local: Identifier;
}

export type ImportSpecifiers =
  | (ImportSpecifier | ImportDefaultSpecifier)[]
  | ImportNamespaceSpecifier[];

/**
 * @description 导入语句节点
 * @example import { Specifier1, Specifier2 } from 'module-path';
 */
export interface ImportDeclaration extends Node {
  type: NodeType.ImportDeclaration;
  /** @description 表示导入的规范符号（ImportSpecifier）或导入的默认绑定符号（ImportDefaultSpecifier）的集合 */
  specifiers: ImportSpecifiers;
  /** @description 表示要导入的模块的源代码路径 */
  source: Literal;
}

/** @description 声明类型节点 */
export type Declaration =
  | FunctionDeclaration
  | VariableDeclaration
  | ImportDeclaration
  | ExportDeclaration
  | VariableDeclarator;

/**
 * @description 具体导出节点类型
 * @example export { localIdentifier as exportedIdentifier };
 */
export interface ExportSpecifier extends Node {
  type: NodeType.ExportSpecifier;
  /** @description 表示导出的标识符，即将在模块中可见和访问的标识符。 */
  exported: Identifier;
  /** @description 表示本地的标识符，即定义在模块内部的标识符。 */
  local: Identifier;
}

/**
 * @description 具名导出节点类型
 * @example
 * export function add(a: number, b: number): number {
 *  return a + b
 * }
 * export { add as sum }
 */
export interface ExportNamedDeclaration extends Node {
  type: NodeType.ExportNamedDeclaration;
  /** @description 表示要导出的声明。它可以是一个声明节点（如变量声明、函数声明等），也可以是一个空值（null）。 */
  declaration: Declaration | null;
  /** @description 表示导出说明符（ExportSpecifier）的数组。每个导出说明符都指定了要导出的标识符及其别名。 */
  specifiers: ExportSpecifier[];
  /** @description 表示从其他模块导出的情况下的源模块路径。它可以是一个字符串字面量节点（Literal），也可以是一个空值（null）。 */
  source: Literal | null;
}

/**
 * @description 默认导出节点类型
 * @example
 * export default function add(a: number, b: number): number {
 *   return a + b
 * }
 */
export interface ExportDefaultDeclaration extends Node {
  type: NodeType.ExportDefaultDeclaration;
  /** @description 表示要导出的默认内容。它可以是一个声明节点（如函数声明、类声明等），也可以是一个表达式节点。这些节点描述了要作为默认导出的内容。 */
  declaration: Declaration | Expression;
}
/**
 * @description 导出所有内容节点类型
 * @example export * from 'module'
 */
export interface ExportAllDeclaration extends Node {
  type: NodeType.ExportAllDeclaration;
  /** @description 表示要导出的模块的源路径。它是一个字符串字面量节点（Literal），表示从哪个模块导出全部内容。 */
  source: Literal;
  /** @description 表示导出的别名标识符。它可以是一个标识符节点（Identifier），也可以是一个空值（null）。 */
  exported: Identifier | null;
}

export type ExportDeclaration =
  | ExportNamedDeclaration
  | ExportDefaultDeclaration
  | ExportAllDeclaration;

/**
 * @description 二元表达式节点类型
 * @example
 * x + y
 * a * (b - c)
 */
export interface BinaryExpression extends Node {
  type: NodeType.BinaryExpression;
  /** @description 表示二元表达式的左操作数（左侧的表达式）。 */
  left: Expression;
  /** @description 表示二元表达式的右操作数（右侧的表达式）。 */
  right: Expression;
  /** @description 表示二元运算的运算符（例如 +、-、*、/ 等）。 */
  operator: string;
}

/**
 * @description 函数节点类型
 * @example
 * function add(a,b){
 *  return a + b;
 * }
 */
export interface FunctionNode extends Node {
  /** @description 表示函数的标识符（函数名），可以是一个标识符节点或为 null。 */
  id: Identifier | null;
  /** @description 表示函数的参数列表，是一个由表达式或标识符组成的数组。 */
  params: Expression[] | Identifier[];
  /** @description 表示函数的函数体，即一系列语句组成的块语句。 */
  body: BlockStatement;
}

/**
 * @description 返回语句节点类型
 * @example
 * function multiply(x, y) {
 *   return x * y
 * }
 */
export interface ReturnStatement extends Node {
  type: NodeType.ReturnStatement;
  /** @description 表示返回语句的返回值，是一个表达式。 */
  argument: Expression;
}

export type Statement =
  | ImportDeclaration
  | ExportDeclaration
  | VariableDeclaration
  | FunctionDeclaration
  | ExpressionStatement
  | BlockStatement
  | ReturnStatement;

export type Expression =
  | CallExpression
  | MemberExpression
  | Identifier
  | Literal
  | BinaryExpression
  | FunctionExpression;
