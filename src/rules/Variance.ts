import { addRule } from '..'
import { toTs } from '../convert'

addRule('Variance', warnings => ({
  ObjectTypeProperty(path) {
    if (path.node.variance && path.node.variance.kind === 'plus') {
      warnings.push([
        `Contravariance can't be expressed in TypeScript`,
        'https://github.com/Microsoft/TypeScript/issues/1394',
        path.node.loc ? path.node.loc.start.line : 0,
        path.node.loc ? path.node.loc.start.column : 0
      ])
    }
    path.replaceWith(toTs(path.node))
  }
}))
