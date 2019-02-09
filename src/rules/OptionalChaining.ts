// Adapted from https://github.com/babel/babel/blob/master/packages/babel-plugin-proposal-optional-chaining/src/index.js

import { types as t } from '@babel/core'
import { addRule } from '..'

addRule('OptionalChaining', () => ({
  'OptionalCallExpression|OptionalMemberExpression'(path) {
    const { parentPath } = path
    const optionals: any[] = []

    let optionalPath = path
    while (
      optionalPath.isOptionalMemberExpression() ||
      optionalPath.isOptionalCallExpression()
    ) {
      const { node } = optionalPath
      if (node.optional) {
        optionals.push(node)
      }

      if (optionalPath.isOptionalMemberExpression()) {
        optionalPath.node.type = 'MemberExpression'
        optionalPath = optionalPath.get('object')
      } else if (optionalPath.isOptionalCallExpression()) {
        optionalPath.node.type = 'CallExpression'
        optionalPath = optionalPath.get('callee')
      }
    }

    let replacementPath = path
    if (parentPath.isUnaryExpression({ operator: 'delete' })) {
      replacementPath = parentPath
    }
    for (let i = optionals.length - 1; i >= 0; i--) {
      const node = optionals[i]

      const isCall = t.isCallExpression(node)
      const replaceKey = isCall ? 'callee' : 'object'
      const chain = node[replaceKey]

      // Ensure call expressions have the proper `this`
      // `foo.bar()` has context `foo`.
      if (isCall) {
        throw new Error('Calls are not supported')
      }

      replacementPath.replaceWith(
        t.conditionalExpression(
          t.binaryExpression('==', t.cloneNode(chain), t.nullLiteral()),
          t.nullLiteral(),
          replacementPath.node
        )
      )

      replacementPath = replacementPath.get('alternate')
    }
  }
}))
