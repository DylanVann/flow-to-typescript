// Adapted from https://github.com/babel/babel/blob/master/packages/babel-plugin-proposal-optional-chaining/src/index.js

import {
  isCallExpression,
  conditionalExpression,
  binaryExpression,
  nullLiteral,
  // @ts-ignore missing in typedef
  cloneNode
} from '@babel/types'
import { addRule } from '..'

addRule('OptionalChaining', () => ({
  OptionalMemberExpression(path: any) {
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

      const isCall = isCallExpression(node)
      const replaceKey = isCall ? 'callee' : 'object'
      const chain = node[replaceKey]

      // Ensure call expressions have the proper `this`
      // `foo.bar()` has context `foo`.
      if (isCall) {
        throw new Error('Calls are not supported')
      }

      replacementPath.replaceWith(
        conditionalExpression(
          binaryExpression('==', cloneNode(chain), nullLiteral()),
          nullLiteral(),
          replacementPath.node
        )
      )

      replacementPath = replacementPath.get('alternate')
    }
  }
}))
