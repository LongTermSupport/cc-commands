/**
 * @fileoverview Requires type-safe property access patterns
 * 
 * This rule prevents unsafe dynamic property access that can lead to runtime errors.
 * It enforces proper null checks, type guards, and safe navigation.
 * 
 * Violations:
 * - data['PROPERTY'] without type guards
 * - array[0] without bounds checking
 * - obj.prop without null checks
 */

export default {
  meta: {
    type: 'problem',
    docs: {
      description: 'Require type-safe property access with proper guards',
      category: 'Type Safety',
      recommended: true
    },
    messages: {
      unsafeBracketAccess: 'Use type guard before accessing property "{{property}}". Consider using optional chaining or null checks.',
      unsafeArrayAccess: 'Array access without bounds checking. Use optional chaining: array[{{index}}]?',
      missingNullCheck: 'Property access without null check. Use optional chaining: {{expression}}?',
      dynamicPropertyAccess: 'Dynamic property access on "{{object}}" bypasses type checking. Use a type guard or known property.'
    },
    schema: [],
    fixable: null
  },

  create(context) {
    const sourceCode = context.getSourceCode()

    /**
     * Check if a node has a null/undefined check
     */
    function hasNullCheck(node, variableName) {
      let parent = node.parent
      let depth = 0
      
      while (parent && depth < 5) {
        // Look for if statements with null checks
        if (parent.type === 'IfStatement') {
          const testText = sourceCode.getText(parent.test)
          if (testText.includes(variableName) && 
              (testText.includes('!==') || testText.includes('!=') || 
               testText.includes('&&') || testText.includes('?.'))) {
            return true
          }
        }
        
        // Look for ternary with null check
        if (parent.type === 'ConditionalExpression') {
          const testText = sourceCode.getText(parent.test)
          if (testText.includes(variableName)) {
            return true
          }
        }
        
        parent = parent.parent
        depth++
      }
      
      return false
    }

    /**
     * Check if this is a safe API response access
     */
    function isSafeApiAccess(node) {
      const text = sourceCode.getText(node)
      return text.includes('response.data') || 
             text.includes('?.') ||
             text.includes('|| {}') ||
             text.includes('|| []')
    }

    return {
      // Check bracket notation access (data['KEY'])
      MemberExpression(node) {
        if (node.computed && node.property.type === 'Literal') {
          const objectName = sourceCode.getText(node.object)
          const propertyName = node.property.value
          
          // Skip if it's a safe pattern
          if (isSafeApiAccess(node) || hasNullCheck(node, objectName)) {
            return
          }
          
          // Check for getData() result access
          if (objectName.includes('getData()') || objectName === 'data') {
            context.report({
              node,
              messageId: 'unsafeBracketAccess',
              data: { property: propertyName }
            })
          }
        }
        
        // Check array access without optional chaining
        if (node.computed && node.property.type === 'Literal' && 
            typeof node.property.value === 'number') {
          const objectText = sourceCode.getText(node.object)
          
          // Skip if using optional chaining or has null check
          if (!objectText.includes('?.') && !hasNullCheck(node, objectText)) {
            context.report({
              node,
              messageId: 'unsafeArrayAccess',
              data: { index: node.property.value }
            })
          }
        }
      },

      // Check for dynamic property access with variables
      'MemberExpression[computed=true]'(node) {
        if (node.property.type === 'Identifier') {
          const objectName = sourceCode.getText(node.object)
          
          // Skip safe patterns
          if (isSafeApiAccess(node) || hasNullCheck(node, objectName)) {
            return
          }
          
          // Flag dynamic access on certain objects
          if (objectName === 'params' || objectName === 'data' || 
              objectName.includes('getData()')) {
            context.report({
              node,
              messageId: 'dynamicPropertyAccess',
              data: { object: objectName }
            })
          }
        }
      }
    }
  }
}