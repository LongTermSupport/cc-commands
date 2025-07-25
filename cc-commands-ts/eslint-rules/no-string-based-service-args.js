/**
 * @fileoverview Prevents string-based argument passing between orchestrator services
 * 
 * This rule ensures that orchestrator services use typed objects for communication
 * instead of error-prone string concatenation and parsing.
 * 
 * Violations:
 * - String concatenation for service arguments
 * - String parsing in orchestrator services
 * - Template literals for argument building
 */

export default {
  meta: {
    type: 'problem',
    docs: {
      description: 'Enforce typed argument passing between orchestrator services',
      category: 'Type Safety',
      recommended: true
    },
    messages: {
      stringConcatenation: 'Use typed objects instead of string concatenation for service arguments. Create a DTO or interface.',
      stringParsing: 'Parsing string arguments is error-prone. Use typed parameters instead.',
      templateLiteralArgs: 'Template literals for service arguments bypass type checking. Use typed objects.'
    },
    schema: [],
    fixable: null
  },

  create(context) {
    const sourceCode = context.getSourceCode()

    /**
     * Check if this is an orchestrator service file
     */
    function isOrchestratorService(filename) {
      return filename.includes('OrchServ') || filename.includes('Orch.ts')
    }

    /**
     * Check if a binary expression is building service arguments
     */
    function isArgumentBuilding(node) {
      // Look for patterns like: projectId + ' ' + commandArgs
      if (node.type === 'BinaryExpression' && node.operator === '+') {
        const leftText = sourceCode.getText(node.left)
        const rightText = sourceCode.getText(node.right)
        
        // Check if concatenating with spaces or building arg strings
        if (leftText.includes('Args') || rightText.includes('Args') ||
            leftText.includes("' '") || rightText.includes("' '") ||
            leftText.includes('" "') || rightText.includes('" "')) {
          return true
        }
      }
      return false
    }

    /**
     * Check if using string split for argument parsing
     */
    function isArgumentParsing(node) {
      if (node.type === 'CallExpression' && 
          node.callee.type === 'MemberExpression' &&
          node.callee.property.name === 'split') {
        
        const objectText = sourceCode.getText(node.callee.object)
        if (objectText.includes('args') || objectText.includes('Args')) {
          return true
        }
      }
      return false
    }

    const filename = context.getFilename()
    if (!isOrchestratorService(filename)) {
      return {}
    }

    return {
      // Check for string concatenation patterns
      BinaryExpression(node) {
        if (isArgumentBuilding(node)) {
          context.report({
            node,
            messageId: 'stringConcatenation'
          })
        }
      },

      // Check for template literals building arguments
      TemplateLiteral(node) {
        const parent = node.parent
        if (parent && parent.type === 'VariableDeclarator') {
          const varName = parent.id.name
          if (varName.includes('Args') || varName.includes('args')) {
            context.report({
              node,
              messageId: 'templateLiteralArgs'
            })
          }
        }
      },

      // Check for string parsing patterns
      CallExpression(node) {
        if (isArgumentParsing(node)) {
          context.report({
            node,
            messageId: 'stringParsing'
          })
        }
      }
    }
  }
}