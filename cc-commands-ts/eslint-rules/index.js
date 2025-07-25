/**
 * Custom ESLint rules for cc-commands-ts project
 */

const customRules = {
  rules: {
    'strict-orchestrator-service-typing': require('./strict-orchestrator-service-typing')
  }
}

module.exports = customRules
module.exports.default = customRules