import { describe, expect, test } from 'vitest';
import { Parser } from '../Parser';
import { Tokenizer } from '../Tokenizer';

describe('testParserFunction', () => {
  test('test example code', () => {
    const result = {
      type: 'Program',
      body: [
        {
          type: 'VariableDeclaration',
          kind: 'let',
          declarations: [
            {
              type: 'VariableDeclarator',
              id: {
                type: 'Identifier',
                name: 'a',
                start: 4,
                end: 5
              },
              init: {
                type: 'FunctionExpression',
                id: null,
                params: [],
                body: {
                  type: 'BlockStatement',
                  body: [],
                  start: 19,
                  end: 21
                },
                start: 8,
                end: 21
              },
              start: 0,
              end: 21
            }
          ],
          start: 0,
          end: 21
        }
      ],
      start: 0,
      end: 21
    };
    const code = `let a = function() {};`;
    const tokenizer = new Tokenizer(code);
    // const parser = new Parser(tokenizer.tokenize());
    // expect(parser.parse()).toEqual(result);
  });
});
