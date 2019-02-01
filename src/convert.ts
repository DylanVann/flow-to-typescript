import {
  booleanLiteral,
  Flow,
  FlowType,
  FunctionTypeAnnotation,
  identifier,
  Identifier,
  isTSTypeParameter,
  isTypeParameter,
  Node,
  numericLiteral,
  objectTypeIndexer,
  QualifiedTypeIdentifier,
  stringLiteral,
  tsAnyKeyword,
  tsArrayType,
  tsAsExpression,
  tsBooleanKeyword,
  tsFunctionType,
  TSFunctionType,
  tsIntersectionType,
  tsLiteralType,
  tsNullKeyword,
  tsNumberKeyword,
  tsPropertySignature,
  tsQualifiedName,
  TSQualifiedName,
  tsStringKeyword,
  tsThisType,
  tsTupleType,
  TSType,
  tsTypeAliasDeclaration,
  tsTypeAnnotation,
  TSTypeElement,
  tsTypeLiteral,
  tsTypeParameter,
  tsTypeParameterDeclaration,
  tsTypeParameterInstantiation,
  tsTypeQuery,
  tsTypeReference,
  tsUndefinedKeyword,
  tsUnionType,
  tsUnknownKeyword,
  TypeAnnotation,
  TypeParameter,
  ObjectTypeIndexer,
  tsIndexSignature,
  TSTypeParameterDeclaration,
  TSTypeParameter,
  TSTypeAliasDeclaration,
  TypeAlias,
  TSTypeAnnotation,
  InterfaceDeclaration,
  TSInterfaceDeclaration,
  tsInterfaceDeclaration,
  InterfaceExtends,
  TSExpressionWithTypeArguments,
  tsInterfaceBody,
  ObjectTypeAnnotation,
  ObjectTypeProperty,
  TSPropertySignature
} from '@babel/types'
import { generateFreeIdentifier } from './utils'

export function typeAliasToTsTypeAliasDeclaration(
  node: TypeAlias
): TSTypeAliasDeclaration {
  if (node.type !== 'TypeAlias') {
    throw new Error('Expected TypeAlias!')
  }
  const typeParameters: TSTypeParameterDeclaration | null = node.typeParameters
    ? tsTypeParameterDeclaration(
        node.typeParameters.params.map(toTsTypeParameter)
      )
    : null
  return tsTypeAliasDeclaration(node.id, typeParameters, toTs(node.right))
}

/*
let depth = 0
let stack: string[] = []
export function toTs(node: Flow | TSType): TSType {
  try {
    depth++
    stack.push('  '.repeat(depth) + ` >${node.type}`)
    return _toTs(node)
  } catch (e) {
    if (!e.logged) {
      e.logged = true
      stack.push('  '.repeat(depth) + ` !${node.type}`)
      console.error(stack.join('\n'))
      console.error(e)
      console.dir(node, { depth: 8 })
    }
    throw e
  } finally {
    stack.push('  '.repeat(depth) + ` <${node.type}`)
    depth--
    if (depth === 0) {
      stack = []
    }
  }
}
*/

// TODO: Add more overloads
export function toTs(node: TypeAnnotation): TSTypeAnnotation
export function toTs(node: InterfaceDeclaration): TSInterfaceDeclaration
export function toTs(node: InterfaceExtends): TSExpressionWithTypeArguments
export function toTs(node: ObjectTypeProperty): TSPropertySignature
export function toTs(node: Flow): TSType
export function toTs(
  node: Flow | TSType | InterfaceDeclaration | InterfaceExtends
):
  | TSType
  | TSTypeAnnotation
  | TSInterfaceDeclaration
  | TSExpressionWithTypeArguments
  | TSPropertySignature {
  switch (node.type) {
    // TS types
    // TODO: Why does tsTs get called with TSTypes? It should only get called with Flow types.
    case 'TSAnyKeyword':
    case 'TSArrayType':
    case 'TSBooleanKeyword':
    case 'TSConstructorType':
    case 'TSExpressionWithTypeArguments':
    case 'TSFunctionType':
    case 'TSIndexedAccessType':
    case 'TSIntersectionType':
    case 'TSLiteralType':
    case 'TSMappedType':
    case 'TSNeverKeyword':
    case 'TSNullKeyword':
    case 'TSNumberKeyword':
    case 'TSObjectKeyword':
    case 'TSParenthesizedType':
    case 'TSStringKeyword':
    case 'TSSymbolKeyword':
    case 'TSThisType':
    case 'TSTupleType':
    case 'TSTypeLiteral':
    case 'TSTypeOperator':
    case 'TSTypePredicate':
    case 'TSTypeQuery':
    case 'TSTypeReference':
    case 'TSUndefinedKeyword':
    case 'TSUnionType':
    case 'TSVoidKeyword':
    // @ts-ignore
    case 'TSTypeAnnotation':
    // @ts-ignore
    case 'TSTypeParameterDeclaration':
    // @ts-ignore
    case 'TSAsExpression':
    // @ts-ignore
    case 'TSPropertySignature':
      return node

    case 'TypeAnnotation':
      return tsTypeAnnotation(toTsType(node))

    case 'InterfaceDeclaration':
      const { properties, spreads } = objectTypeAnnotationPropertiesAndSpreads(
        node.body
      )
      if (spreads.length) {
        throw new Error('Spreads in interfaces unsupported')
      }
      return tsInterfaceDeclaration(
        node.id,
        node.typeParameters
          ? tsTypeParameterDeclaration(
              node.typeParameters.params.map(toTsTypeParameter)
            )
          : null,
        node.extends && node.extends.length
          ? node.extends.map(
              (_: InterfaceExtends): TSExpressionWithTypeArguments => toTs(_)
            )
          : null,
        tsInterfaceBody(properties)
      )

    // Flow types
    case 'AnyTypeAnnotation':
    case 'ArrayTypeAnnotation':
    case 'BooleanTypeAnnotation':
    case 'BooleanLiteralTypeAnnotation':
    case 'ExistsTypeAnnotation':
    case 'FunctionTypeAnnotation':
    case 'GenericTypeAnnotation':
    case 'IntersectionTypeAnnotation':
    case 'MixedTypeAnnotation':
    case 'NullableTypeAnnotation':
    case 'NullLiteralTypeAnnotation':
    case 'NumberTypeAnnotation':
    case 'StringLiteralTypeAnnotation':
    case 'StringTypeAnnotation':
    case 'ThisTypeAnnotation':
    case 'TupleTypeAnnotation':
    case 'TypeofTypeAnnotation':
    case 'ObjectTypeAnnotation':
    case 'UnionTypeAnnotation':
    case 'VoidTypeAnnotation':
    // @ts-ignore
    case 'NumericLiteralTypeAnnotation':
      return toTsType(node)

    case 'ObjectTypeIndexer':
      //return tsTypeLiteral([tsIndexSignature(node.parameters)])
      // @ts-ignore CHEATING!
      return objectTypeIndexer(
        node.id || identifier(generateFreeIdentifier([])),
        node.key,
        node.value
      )

    case 'ObjectTypeProperty':
      let _ = tsPropertySignature(node.key, tsTypeAnnotation(toTs(node.value)))
      _.optional = node.optional
      _.readonly = node.variance && node.variance.kind === 'minus'
      // TODO: anonymous indexers
      // TODO: named indexers
      // TODO: call properties
      // TODO: variance
      return _

    case 'TypeCastExpression':
      // @ts-ignore
      return tsAsExpression(node.expression, toTsType(node.typeAnnotation))

    case 'TypeParameterDeclaration':
      let params = node.params.map(_ => {
        let d = ((_ as any) as TypeParameter).default
        let p = tsTypeParameter(
          hasBound(_) ? toTsType(_.bound.typeAnnotation) : undefined,
          d ? toTs(d) : undefined
        )
        p.name = _.name
        return p
      })

      // @ts-ignore
      return tsTypeParameterDeclaration(params)

    case 'QualifiedTypeIdentifier':
      // @ts-ignore
      return tsQualifiedName(toTsTypeName(node.qualification), node.id)

    case 'ClassImplements':
    case 'DeclareClass':
    case 'DeclareFunction':
    case 'DeclareInterface':
    case 'DeclareModule':
    case 'DeclareTypeAlias':
    case 'DeclareVariable':
    case 'FunctionTypeParam':
    case 'InterfaceExtends':
    case 'InterfaceDeclaration':
    case 'TypeAlias':
    case 'TypeParameterInstantiation':
    case 'ObjectTypeCallProperty':
    case 'ObjectTypeIndexer':
    // @ts-ignore
    case 'ClassProperty':
    // @ts-ignore
    case 'ExistentialTypeParam':
      console.log('WUT')
      console.dir(node)
      throw new Error('Not implemented')
  }
  throw new Error(`Note type not understood: '${node.type}'`)
}

export function toTsTypeName(
  node: Identifier | QualifiedTypeIdentifier
): Identifier | TSQualifiedName {
  switch (node.type) {
    case 'Identifier':
      return node
    case 'QualifiedTypeIdentifier':
      return tsQualifiedName(toTsTypeName(node.qualification), node.id)
  }
  throw new Error('Could not convert to TS identifier')
}

export function toTsType(node: FlowType | TypeAnnotation): TSType {
  if (node.type.match(/^TS[A-Z]/)) {
    // @ts-ignore
    return node
  }
  switch (node.type) {
    // @ts-ignore
    case 'Identifier':
    // @ts-ignore
    case 'QualifiedTypeIdentifier':
      throw new Error(
        `'${
          // @ts-ignore
          node.type
        }' passed to toTsType, instead use \`tsTypeReference(toTsTypeName(node))\``
      )

    case 'TypeAnnotation':
      return toTsType(node.typeAnnotation)

    case 'AnyTypeAnnotation':
      return tsAnyKeyword()
    case 'ArrayTypeAnnotation':
      return tsArrayType(toTsType(node.elementType))
    case 'BooleanTypeAnnotation':
      return tsBooleanKeyword()
    case 'BooleanLiteralTypeAnnotation':
      return tsLiteralType(booleanLiteral(node.value!))
    case 'FunctionTypeAnnotation':
      return functionToTsType(node)
    case 'GenericTypeAnnotation': {
      if (node.id.name === '$Exact') {
        /*
        warnings.push([
          `$Exact types can't be expressed in TypeScript`,
          'https://github.com/Microsoft/TypeScript/issues/12936',
          path.node.loc.start.line,
          path.node.loc.start.column
        ])
        */
        return toTsType(node.typeParameters!.params[0])
      } else if (node.id.name === '$ReadOnly') {
        // Rename to 'Readonly'
        node.id.name = 'Readonly'
        return toTsType(node)
      } else if (node.id.name === '$FlowFixMe') {
        return tsAnyKeyword()
      } else if (node.typeParameters && node.typeParameters.params.length) {
        return tsTypeReference(
          toTsTypeName(node.id),
          tsTypeParameterInstantiation(
            node.typeParameters.params.map(p => toTsType(p))
          )
        )
      } else {
        return tsTypeReference(toTsTypeName(node.id))
      }
    }
    case 'IntersectionTypeAnnotation':
      return tsIntersectionType(node.types.map(toTsType))
    case 'MixedTypeAnnotation':
      return tsUnknownKeyword()
    case 'NullLiteralTypeAnnotation':
      return tsNullKeyword()
    case 'NullableTypeAnnotation':
      return tsUnionType([
        toTsType(node.typeAnnotation),
        tsNullKeyword(),
        tsUndefinedKeyword()
      ])
    case 'NumberLiteralTypeAnnotation':
      return tsLiteralType(numericLiteral(node.value!))
    case 'NumberTypeAnnotation':
      return tsNumberKeyword()
    case 'StringLiteralTypeAnnotation':
      return tsLiteralType(stringLiteral(node.value!))
    case 'StringTypeAnnotation':
      return tsStringKeyword()
    case 'ThisTypeAnnotation':
      return tsThisType()
    case 'TupleTypeAnnotation':
      return tsTupleType(node.types.map(toTsType))
    case 'TypeofTypeAnnotation':
      return tsTypeQuery(getId(node.argument))

    case 'ObjectTypeAnnotation': {
      const { properties, spreads } = objectTypeAnnotationPropertiesAndSpreads(
        node
      )
      const propertyType = tsTypeLiteral(properties)
      return spreads.length
        ? tsIntersectionType([
            ...(properties.length ? [propertyType] : []),
            ...spreads
          ])
        : propertyType
    }
    case 'UnionTypeAnnotation':
      return tsUnionType(node.types.map(toTs))
    case 'VoidTypeAnnotation':
      return tsUndefinedKeyword()
    case 'ExistsTypeAnnotation':
      return tsAnyKeyword()
    default:
      throw new Error(`Didn't understand type '${node.type}'`)
  }
}

function toTsIndexSignature(indexer: ObjectTypeIndexer): TSTypeElement {
  const id = indexer.id ? indexer.id : identifier(generateFreeIdentifier([]))
  id.typeAnnotation = tsTypeAnnotation(toTsType(indexer.key))
  return tsIndexSignature([id], tsTypeAnnotation(toTsType(indexer.value)))
}

function toTsTypeParameter(_: TypeParameter): TSTypeParameter {
  // TODO: How is this possible?
  if (isTSTypeParameter(_)) {
    return _
  }

  let constraint = _.bound ? toTsType(_.bound) : undefined
  let default_ = _.default ? toTs(_.default) : undefined
  let param = tsTypeParameter(constraint, default_)
  param.name = _.name
  return param
}

function getId(node: FlowType): Identifier {
  switch (node.type) {
    case 'GenericTypeAnnotation':
      return node.id
    default:
      throw ReferenceError('typeof query must reference a node that has an id')
  }
}

function functionToTsType(node: FunctionTypeAnnotation): TSFunctionType {
  let typeParams

  if (node.typeParameters) {
    typeParams = tsTypeParameterDeclaration(
      node.typeParameters.params.map(toTsTypeParameter)
    )
  }

  const returnTypeType = node.returnType ? toTs(node.returnType) : null
  if (node.returnType && !returnTypeType) {
    console.dir(node.returnType)
    throw new Error(`Could not convert return type '${node.returnType.type}'`)
  }
  let f = tsFunctionType(
    typeParams,
    node.returnType ? tsTypeAnnotation(returnTypeType as any) : undefined
  )
  // Params
  if (node.params) {
    // TODO: Rest params
    let paramNames = node.params
      .map(_ => _.name)
      .filter(_ => _ !== null)
      .map(_ => (_ as Identifier).name)
    f.parameters = node.params.map(_ => {
      let name = _.name && _.name.name

      // Generate param name? (Required in TS, optional in Flow)
      if (name == null) {
        name = generateFreeIdentifier(paramNames)
        paramNames.push(name)
      }

      let id = identifier(name)

      if (_.typeAnnotation) {
        id.typeAnnotation = tsTypeAnnotation(toTsType(_.typeAnnotation))
      }

      return id
    })
  }

  return f
}

function hasBound(node: Node): node is BoundedTypeParameter {
  return isTypeParameter(node) && node.bound != null
}

interface BoundedTypeParameter extends TypeParameter {
  bound: TypeAnnotation
}

function objectTypeAnnotationPropertiesAndSpreads(
  node: ObjectTypeAnnotation
): { properties: TSTypeElement[]; spreads: TSType[] } {
  const spreads: TSType[] = []
  const properties: TSTypeElement[] = []

  node.properties.forEach(_ => {
    if (_.type === 'ObjectTypeSpreadProperty') {
      spreads.push(toTs(_.argument))
    } else {
      properties.push(toTs(_))
    }
  })

  if (node.indexers) {
    node.indexers.forEach(_ => {
      properties.push(toTsIndexSignature(_))
    })
  }

  return {
    properties,
    spreads
  }
}
