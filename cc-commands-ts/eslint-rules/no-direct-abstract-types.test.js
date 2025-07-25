/**
 * Tests for the strict-orchestrator-service-typing ESLint rule
 */

const { RuleTester } = require('eslint')
const rule = require('./strict-orchestrator-service-typing')

const ruleTester = new RuleTester({
  parser: require.resolve('@typescript-eslint/parser'),
  parserOptions: {
    ecmaVersion: 2022,
    sourceType: 'module',
    ecmaFeatures: {
      jsx: false
    }
  }
})

ruleTester.run('strict-orchestrator-service-typing', rule, {
  valid: [
    // Valid: Orchestrator with specific service type
    {
      code: `
        type TMyOrchServices = {
          projectService: IProjectService
          authService: IAuthService  
        }
        
        export const myOrch = async (args: string, services: TMyOrchServices) => {
          return new LLMInfo()
        }
      `
    },
    // Valid: Orchestrator service with specific service type
    {
      code: `
        type TMyOrchServServices = {
          dataService: IDataService
        }
        
        export const myOrchServ = async (args: string, services: TMyOrchServServices) => {
          return new LLMInfo()
        }
      `
    },
    // Valid: Regular function (not an orchestrator)
    {
      code: `
        export const regularFunction = async (args: string, services: TOrchestratorServiceMap) => {
          return something
        }
      `
    },
    // Valid: Orchestrator typed with IOrchestrator using specific services
    {
      code: `
        type TSpecificServices = {
          service1: IService1
        }
        
        export const typedOrch: IOrchestrator = async (args: string, services: TSpecificServices) => {
          return new LLMInfo()
        }
      `
    },
    // Valid: Service type without TOrchestratorServiceMap inheritance
    {
      code: `
        type TMyServices = {
          projectService: IProjectService
          authService: IAuthService
          [key: string]: IOrchestratorService
        }
      `
    }
  ],

  invalid: [
    // Invalid: Orchestrator using TOrchestratorServiceMap
    {
      code: `
        export const myOrch = async (args: string, services: TOrchestratorServiceMap) => {
          return new LLMInfo()
        }
      `,
      errors: [{
        messageId: 'genericServiceType',
        data: {
          name: 'myOrch',
          suggestedName: 'My'
        }
      }]
    },
    // Invalid: Orchestrator service using TOrchestratorServiceMap
    {
      code: `
        export const projectDataOrchServ = async (args: string, services: TOrchestratorServiceMap) => {
          return new LLMInfo()
        }
      `,
      errors: [{
        messageId: 'orchServiceGenericType',
        data: {
          name: 'projectDataOrchServ',
          suggestedName: 'ProjectData'
        }
      }]
    },
    // Invalid: Function declaration orchestrator
    {
      code: `
        export function summaryOrch(args: string, services: TOrchestratorServiceMap) {
          return Promise.resolve(new LLMInfo())
        }
      `,
      errors: [{
        messageId: 'genericServiceType',
        data: {
          name: 'summaryOrch',
          suggestedName: 'Summary'
        }
      }]
    },
    // Invalid: Typed as IOrchestrator with TOrchestratorServiceMap
    {
      code: `
        export const typedOrch: IOrchestrator = async (args: string, services: TOrchestratorServiceMap) => {
          return new LLMInfo()
        }
      `,
      errors: [{
        messageId: 'genericServiceType',
        data: {
          name: 'typedOrch',
          suggestedName: 'Typed'
        }
      }]
    },
    // Invalid: Type alias extending TOrchestratorServiceMap
    {
      code: `
        type TMyServices = TOrchestratorServiceMap & {
          myService: IMyService
        }
      `,
      errors: [{
        messageId: 'typeAliasBannedInheritance',
        data: {
          name: 'TMyServices'
        }
      }]
    }
  ]
})