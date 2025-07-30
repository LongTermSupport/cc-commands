/**
 * @fileoverview Enforce production types over any/unknown in test mocks
 * 
 * This rule prevents the use of 'any' and 'unknown' type casting in test files,
 * encouraging the use of specific production types for type-safe mocking.
 * 
 * Philosophy: "Mocking is like hot sauce - a little bit is all you need."
 * Use actual production DTOs and interfaces with minimal type casting.
 */

export default {
  meta: {
    type: 'problem',
    docs: {
      description: 'Enforce production types over any/unknown in test mocks',
      category: 'Best Practices',
      recommended: true,
    },
    fixable: null,
    schema: [],
    messages: {
      avoidAnyInTests: 'Avoid using "as any" in test files. Use specific production types instead (e.g., "as CommitDataDTO[]").',
      avoidUnknownInTests: 'Avoid using "as unknown" in test files. Use specific production types instead (e.g., "as RepositoryDataDTO").',
      avoidAnyUnknownArray: 'Avoid using "as any[]" or "as unknown[]" in test files. Use typed arrays like "as CommitDataDTO[]" instead.',
      preferProductionTypes: 'Use production DTOs and interfaces for type-safe mocking. Import the actual types from your codebase.',
    },
  },

  create(context) {
    const filename = context.getFilename();
    
    // Only apply this rule to test files
    if (!filename.includes('/test/') && !filename.includes('\\test\\') && 
        !filename.endsWith('.test.ts') && !filename.endsWith('.test.js') &&
        !filename.endsWith('.spec.ts') && !filename.endsWith('.spec.js')) {
      return {};
    }

    return {
      TSAsExpression(node) {
        const typeAnnotation = node.typeAnnotation;

        // Check for "as any"
        if (typeAnnotation.type === 'TSAnyKeyword') {
          context.report({
            node,
            messageId: 'avoidAnyInTests',
            data: {},
          });
          return;
        }

        // Check for "as unknown"
        if (typeAnnotation.type === 'TSUnknownKeyword') {
          context.report({
            node,
            messageId: 'avoidUnknownInTests',
            data: {},
          });
          return;
        }

        // Check for "as any[]" or "as unknown[]"
        if (typeAnnotation.type === 'TSArrayType') {
          const elementType = typeAnnotation.elementType;
          if (elementType.type === 'TSAnyKeyword' || elementType.type === 'TSUnknownKeyword') {
            context.report({
              node,
              messageId: 'avoidAnyUnknownArray',
              data: {},
            });
            return;
          }
        }

        // Check for more complex cases like Array<any> or Array<unknown>
        if (typeAnnotation.type === 'TSTypeReference' && 
            typeAnnotation.typeName && typeAnnotation.typeName.name === 'Array' &&
            typeAnnotation.typeParameters && typeAnnotation.typeParameters.params.length > 0) {
          const firstParam = typeAnnotation.typeParameters.params[0];
          if (firstParam.type === 'TSAnyKeyword' || firstParam.type === 'TSUnknownKeyword') {
            context.report({
              node,
              messageId: 'avoidAnyUnknownArray',
              data: {},
            });
            return;
          }
        }
      },

      // Also catch variable declarations with explicit any/unknown types
      TSTypeAnnotation(node) {
        const parent = node.parent;
        
        // Only check if we're in a variable declaration or similar context that might be a mock
        if (parent && (parent.type === 'VariableDeclarator' || parent.type === 'Parameter')) {
          const typeAnnotation = node.typeAnnotation;
          
          if (typeAnnotation.type === 'TSAnyKeyword') {
            context.report({
              node: parent,
              messageId: 'preferProductionTypes',
              data: {},
            });
          }
          
          if (typeAnnotation.type === 'TSUnknownKeyword') {
            context.report({
              node: parent,
              messageId: 'preferProductionTypes', 
              data: {},
            });
          }
        }
      }
    };
  },
};