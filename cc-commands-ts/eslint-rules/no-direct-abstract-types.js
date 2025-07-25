/**
 * @fileoverview Prevents direct use of abstract types as function parameters
 * 
 * This rule ensures that abstract types are not used directly as function parameter
 * or return types. Abstract types are meant to be extended, not used directly.
 * This enforces proper type composition and explicit dependencies.
 * 
 * Naming convention: Abstract types should be prefixed with 'TAbstract' to clearly
 * indicate they are meant for extension only.
 */

// List of abstract types that should not be used directly
const ABSTRACT_TYPES = [
  'TOrchestratorServiceMap',
  // Add future abstract types here with TAbstract prefix
  // e.g., 'TAbstractBaseDTO', 'TAbstractServiceConfig'
]

export default {
  meta: {
    type: 'problem',
    docs: {
      description: 'Enforce that abstract types like TOrchestratorServiceMap cannot be used directly as parameter types',
      category: 'Best Practices',
      recommended: true,
      url: 'https://github.com/your-repo/docs/ESLint.md#no-direct-abstract-types'
    },
    messages: {
      genericServiceType: 'Orchestrator "{{name}}" must not use abstract type TOrchestratorServiceMap directly. Define a specific type like T{{suggestedName}}Services that extends TOrchestratorServiceMap.',
      orchServiceGenericType: 'Orchestrator service "{{name}}" must not use abstract type TOrchestratorServiceMap directly. Define a specific type like T{{suggestedName}}Services that extends TOrchestratorServiceMap.'
    },
    schema: [],
    fixable: null
  },

  create(context) {
    const sourceCode = context.getSourceCode()

    /**
     * Get the suggested service type name from a function/variable name
     */
    function getSuggestedServiceName(name) {
      // Remove 'Orch' or 'OrchServ' suffix and capitalize
      let baseName = name
        .replace(/OrchServ$/, '')
        .replace(/Orch$/, '')
      
      // Convert to PascalCase if needed
      baseName = baseName.charAt(0).toUpperCase() + baseName.slice(1)
      
      return baseName
    }

    /**
     * Check if a type annotation is an abstract type
     */
    function isAbstractType(typeAnnotation) {
      if (!typeAnnotation) return false

      // Handle TypeReference
      if (typeAnnotation.type === 'TSTypeReference') {
        const typeName = typeAnnotation.typeName
        if (typeName.type === 'Identifier' && ABSTRACT_TYPES.includes(typeName.name)) {
          return typeName.name
        }
      }

      return false
    }

    /**
     * Check if a function parameter has TOrchestratorServiceMap type
     */
    function checkFunctionParams(node, functionName, isOrchService = false) {
      if (!node.params || node.params.length < 2) return

      const servicesParam = node.params[1] // Second parameter should be services
      if (!servicesParam || !servicesParam.typeAnnotation) return

      const typeAnnotation = servicesParam.typeAnnotation.typeAnnotation
      const abstractType = isAbstractType(typeAnnotation)
      if (abstractType) {
        const suggestedName = getSuggestedServiceName(functionName)
        
        context.report({
          node: servicesParam,
          messageId: isOrchService ? 'orchServiceGenericType' : 'genericServiceType',
          data: {
            name: functionName,
            suggestedName
          }
        })
      }
    }

    /**
     * Check if a variable/const is an orchestrator based on naming or type
     */
    function isOrchestratorDeclaration(node) {
      if (!node.id || !node.id.name) return false
      
      const name = node.id.name
      const endsWithOrch = name.endsWith('Orch')
      const endsWithOrchServ = name.endsWith('OrchServ')
      
      // Check if it has IOrchestrator or IOrchestratorService type annotation
      if (node.id.typeAnnotation && node.id.typeAnnotation.typeAnnotation) {
        const typeAnnotation = node.id.typeAnnotation.typeAnnotation
        if (typeAnnotation.type === 'TSTypeReference' && typeAnnotation.typeName.type === 'Identifier') {
          const typeName = typeAnnotation.typeName.name
          if (typeName === 'IOrchestrator' || typeName === 'IOrchestratorService') {
            return { name, isOrchService: typeName === 'IOrchestratorService' }
          }
        }
      }
      
      // Check by naming convention
      if (endsWithOrch || endsWithOrchServ) {
        return { name, isOrchService: endsWithOrchServ }
      }
      
      return false
    }

    return {
      // Check arrow function expressions assigned to variables
      VariableDeclarator(node) {
        const orchInfo = isOrchestratorDeclaration(node)
        if (!orchInfo) return

        if (node.init && node.init.type === 'ArrowFunctionExpression') {
          checkFunctionParams(node.init, orchInfo.name, orchInfo.isOrchService)
        }
      },

      // Check function declarations
      FunctionDeclaration(node) {
        if (!node.id || !node.id.name) return
        
        const name = node.id.name
        const isOrchService = name.endsWith('OrchServ')
        
        if (name.endsWith('Orch') || isOrchService) {
          checkFunctionParams(node, name, isOrchService)
        }
      },

      // Check exported functions
      ExportNamedDeclaration(node) {
        if (node.declaration) {
          if (node.declaration.type === 'FunctionDeclaration') {
            const funcNode = node.declaration
            if (funcNode.id && funcNode.id.name) {
              const name = funcNode.id.name
              const isOrchService = name.endsWith('OrchServ')
              
              if (name.endsWith('Orch') || isOrchService) {
                checkFunctionParams(funcNode, name, isOrchService)
              }
            }
          } else if (node.declaration.type === 'VariableDeclaration') {
            node.declaration.declarations.forEach(declarator => {
              const orchInfo = isOrchestratorDeclaration(declarator)
              if (!orchInfo) return

              if (declarator.init && declarator.init.type === 'ArrowFunctionExpression') {
                checkFunctionParams(declarator.init, orchInfo.name, orchInfo.isOrchService)
              }
            })
          }
        }
      }
    }
  }
}