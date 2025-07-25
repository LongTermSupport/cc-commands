/**
 * @fileoverview Prevents unsafe type casting patterns like 'as unknown as Type'
 * 
 * This rule detects and prevents the dangerous pattern of double type casting
 * through 'unknown' which completely bypasses TypeScript's type checking.
 * 
 * Examples of violations:
 * - foo as unknown as Bar
 * - foo as any as Bar
 * - foo as unknown
 * - foo as any (in most cases)
 */

export default {
  meta: {
    type: 'problem',
    docs: {
      description: 'Prevent unsafe type casting that bypasses TypeScript type checking',
      category: 'Type Safety',
      recommended: true
    },
    messages: {
      unsafeDoubleCast: 'Unsafe type casting "{{cast}}" completely bypasses TypeScript type checking. Refactor to use proper types.',
      castToUnknown: 'Casting to "unknown" is usually a sign of improper typing. Consider using proper type definitions.',
      castToAny: 'Avoid casting to "any". Use proper type definitions or type guards instead.',
      unnecessaryCast: 'This type assertion may be unnecessary. TypeScript should infer the correct type.'
    },
    schema: [],
    fixable: null
  },

  create(context) {
    const sourceCode = context.getSourceCode()

    /**
     * Check if a node is a type assertion to unknown or any
     */
    function isUnsafeCast(node) {
      if (node.type !== 'TSAsExpression') return null
      
      const typeAnnotation = node.typeAnnotation
      if (typeAnnotation.type === 'TSUnknownKeyword') {
        return 'unknown'
      }
      if (typeAnnotation.type === 'TSAnyKeyword') {
        return 'any'
      }
      
      return null
    }

    /**
     * Get the type assertion chain (e.g., "as unknown as Type")
     */
    function getTypeAssertionChain(node) {
      const chain = []
      let current = node
      
      while (current && current.type === 'TSAsExpression') {
        const typeName = sourceCode.getText(current.typeAnnotation)
        chain.push(typeName)
        current = current.expression
      }
      
      return chain
    }

    return {
      TSAsExpression(node) {
        // Check for double casting pattern (as unknown as Type)
        if (node.expression && node.expression.type === 'TSAsExpression') {
          const innerCast = isUnsafeCast(node.expression)
          if (innerCast === 'unknown' || innerCast === 'any') {
            const chain = getTypeAssertionChain(node)
            context.report({
              node,
              messageId: 'unsafeDoubleCast',
              data: {
                cast: chain.reverse().join(' as ')
              }
            })
            return
          }
        }

        // Check for single cast to unknown
        const unsafeType = isUnsafeCast(node)
        if (unsafeType === 'unknown') {
          context.report({
            node,
            messageId: 'castToUnknown'
          })
        } else if (unsafeType === 'any') {
          // Check if this is an API response cast (common legitimate use)
          const parent = node.parent
          const isApiResponse = parent && parent.type === 'CallExpression' && 
            sourceCode.getText(parent).includes('response')
          
          if (!isApiResponse) {
            context.report({
              node,
              messageId: 'castToAny'
            })
          }
        }
      }
    }
  }
}