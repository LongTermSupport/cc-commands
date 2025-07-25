/**
 * Custom ESLint rules for cc-commands-ts project
 */

import noDirectAbstractTypes from './no-direct-abstract-types.js'

export default {
  rules: {
    'no-direct-abstract-types': noDirectAbstractTypes
  }
}