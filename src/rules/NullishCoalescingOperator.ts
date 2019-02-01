import { LogicalExpression } from '@babel/types'

import { addRule } from '..'

addRule('NullishCoalescingOperator', () => ({
  LogicalExpression(path) {
    const node = path.node as LogicalExpression
    if (node.operator === '??') {
      node.operator = '||'
    }
  }
}))
