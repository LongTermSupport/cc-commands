/**
 * Custom ESLint rules for cc-commands-ts project
 */

import noDirectAbstractTypes from './no-direct-abstract-types.js'
import noUnsafeTypeCasting from './no-unsafe-type-casting.js'
import noStringBasedServiceArgs from './no-string-based-service-args.js'
import requireTypedDataAccess from './require-typed-data-access.js'
import noApiResponseAny from './no-api-response-any.js'

export default {
  rules: {
    'no-direct-abstract-types': noDirectAbstractTypes,
    'no-unsafe-type-casting': noUnsafeTypeCasting,
    'no-string-based-service-args': noStringBasedServiceArgs,
    'require-typed-data-access': requireTypedDataAccess,
    'no-api-response-any': noApiResponseAny
  }
}