/**
 * @fileoverview Prevents casting API responses to 'any' type
 * 
 * This rule ensures that API responses are properly typed instead of using
 * the lazy 'as any' pattern which defeats type safety.
 * 
 * Instead of: response.data as any
 * Use: proper type definitions or response.data as GitHubApiResponse
 */

export default {
  meta: {
    type: 'problem',
    docs: {
      description: 'Require proper typing for API responses instead of using any',
      category: 'Type Safety',
      recommended: true
    },
    messages: {
      apiResponseAny: 'Do not cast API responses to "any". Create proper type definitions for "{{source}}".',
      dataAsAny: 'response.data should have proper types. Define the API response type.'
    },
    schema: [],
    fixable: null
  },

  create(context) {
    const sourceCode = context.getSourceCode()

    return {
      TSAsExpression(node) {
        // Check if casting to any
        if (node.typeAnnotation.type !== 'TSAnyKeyword') {
          return
        }

        const expression = sourceCode.getText(node.expression)
        
        // Check for common API response patterns
        if (expression.includes('response.data') || 
            expression.includes('.data') ||
            expression.includes('apiResponse') ||
            expression.includes('api.') ||
            expression.includes('await') && expression.includes('(')) {
          
          context.report({
            node,
            messageId: expression.includes('response.data') ? 'dataAsAny' : 'apiResponseAny',
            data: {
              source: expression.length > 30 ? expression.substring(0, 30) + '...' : expression
            }
          })
        }
      }
    }
  }
}