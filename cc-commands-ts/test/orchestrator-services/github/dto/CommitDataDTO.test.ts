/**
 * @file Unit tests for CommitDataDTO
 * 
 * Tests commit data transformation from GitHub CLI, REST API, and GraphQL responses
 * to standardized LLM data format. Covers edge cases, validation, and utility methods.
 */

import { describe, expect, it, vi } from 'vitest'

import { CommitDataDTO } from '../../../../src/orchestrator-services/github/dto/CommitDataDTO.js'

describe('CommitDataDTO', () => {
  describe('constructor', () => {
    it('should create instance with all required properties', () => {
      const dto = new CommitDataDTO(
        'abc123def456',
        'abc123d',
        'Initial commit',
        'John Doe',
        'john@example.com',
        new Date('2025-01-15T10:30:00Z'),
        'Jane Smith',
        'jane@example.com',
        new Date('2025-01-15T11:00:00Z'),
        'https://github.com/owner/repo/commit/abc123def456',
        'owner/repo',
        25,
        10,
        3,
        1,
        true,
        'valid',
        'signature123'
      )

      expect(dto.sha).toBe('abc123def456')
      expect(dto.shortSha).toBe('abc123d')
      expect(dto.message).toBe('Initial commit')
      expect(dto.authorName).toBe('John Doe')
      expect(dto.authorEmail).toBe('john@example.com')
      expect(dto.authorDate).toEqual(new Date('2025-01-15T10:30:00Z'))
      expect(dto.committerName).toBe('Jane Smith')
      expect(dto.committerEmail).toBe('jane@example.com')
      expect(dto.committerDate).toEqual(new Date('2025-01-15T11:00:00Z'))
      expect(dto.url).toBe('https://github.com/owner/repo/commit/abc123def456')
      expect(dto.repository).toBe('owner/repo')
      expect(dto.additions).toBe(25)
      expect(dto.deletions).toBe(10)
      expect(dto.filesChanged).toBe(3)
      expect(dto.parentCount).toBe(1)
      expect(dto.verificationVerified).toBe(true)
      expect(dto.verificationReason).toBe('valid')
      expect(dto.verificationSignature).toBe('signature123')
    })

    it('should handle readonly properties correctly', () => {
      const dto = new CommitDataDTO(
        'test-sha', 'test-sh', 'Test message', 'Author', 'author@test.com',
        new Date(), 'Committer', 'committer@test.com', new Date(),
        'https://test.com', 'test/repo', 0, 0, 0, 0, false, 'unsigned', null
      )

      // Properties should be readonly - TypeScript compile-time check only
      expect(dto.sha).toBe('test-sha')
      expect(dto.shortSha).toBe('test-sh')
      expect(dto.message).toBe('Test message')
    })
  })

  describe('fromCliOutput', () => {
    it('should create DTO from complete CLI output', () => {
       
      const cliOutputGitHubData = {
        additions: 45,
        author: {
          date: '2025-01-15T14:30:00Z',
          email: 'alice@dev.com',
          name: 'Alice Developer'
        },
        committer: {
          date: '2025-01-15T15:00:00Z',
          email: 'bob@maintainer.com',
          name: 'Bob Maintainer'
        },
        deletions: 12,
        files: 7,
        message: 'Fix bug in authentication\n\nThis commit resolves the login issue',
        oid: 'commit123abc456def',
        parents: { totalCount: 1 },
        repository: 'test/project',
        url: 'https://github.com/test/project/commit/commit123abc456def',
        verification: {
          reason: 'valid',
          signature: 'gpg-signature-data',
          verified: true
        }
      }
       

      const dto = CommitDataDTO.fromCliOutput(cliOutputGitHubData)

      expect(dto.sha).toBe('commit123abc456def')
      expect(dto.shortSha).toBe('commit1')
      expect(dto.message).toBe('Fix bug in authentication\n\nThis commit resolves the login issue')
      expect(dto.authorName).toBe('Alice Developer')
      expect(dto.authorEmail).toBe('alice@dev.com')
      expect(dto.authorDate).toEqual(new Date('2025-01-15T14:30:00Z'))
      expect(dto.committerName).toBe('Bob Maintainer')
      expect(dto.committerEmail).toBe('bob@maintainer.com')
      expect(dto.committerDate).toEqual(new Date('2025-01-15T15:00:00Z'))
      expect(dto.url).toBe('https://github.com/test/project/commit/commit123abc456def')
      expect(dto.repository).toBe('test/project')
      expect(dto.additions).toBe(45)
      expect(dto.deletions).toBe(12)
      expect(dto.filesChanged).toBe(7)
      expect(dto.parentCount).toBe(1)
      expect(dto.verificationVerified).toBe(true)
      expect(dto.verificationReason).toBe('valid')
      expect(dto.verificationSignature).toBe('gpg-signature-data')
    })

    it('should handle minimal CLI output with defaults', () => {
       
      const minimalCliGitHubData = {}
       

      const dto = CommitDataDTO.fromCliOutput(minimalCliGitHubData)

      expect(dto.sha).toBe('')
      expect(dto.shortSha).toBe('')
      expect(dto.message).toBe('No commit message')
      expect(dto.authorName).toBe('unknown')
      expect(dto.authorEmail).toBe('unknown@example.com')
      expect(dto.authorDate).toBeInstanceOf(Date)
      expect(dto.committerName).toBe('unknown')
      expect(dto.committerEmail).toBe('unknown@example.com')
      expect(dto.committerDate).toBeInstanceOf(Date)
      expect(dto.url).toBe('')
      expect(dto.repository).toBe('unknown/unknown')
      expect(dto.additions).toBe(0)
      expect(dto.deletions).toBe(0)
      expect(dto.filesChanged).toBe(0)
      expect(dto.parentCount).toBe(0)
      expect(dto.verificationVerified).toBe(false)
      expect(dto.verificationReason).toBe('unsigned')
      expect(dto.verificationSignature).toBeNull()
    })

    it('should use author data as committer fallback', () => {
       
      const cliOutputGitHubData = {
        author: {
          date: '2025-01-15T12:00:00Z',
          email: 'solo@dev.com',
          name: 'Solo Developer'
        }
      }
       

      const dto = CommitDataDTO.fromCliOutput(cliOutputGitHubData)

      expect(dto.authorName).toBe('Solo Developer')
      expect(dto.authorEmail).toBe('solo@dev.com')
      expect(dto.committerName).toBe('Solo Developer')
      expect(dto.committerEmail).toBe('solo@dev.com')
      expect(dto.committerDate).toEqual(new Date('2025-01-15T12:00:00Z'))
    })

    it('should throw error for invalid CLI output', () => {
      expect(() => CommitDataDTO.fromCliOutput(null)).toThrow(
        'Invalid GitHub CLI commit output: output is null, undefined, or not an object'
      )
      expect(() => CommitDataDTO.fromCliOutput()).toThrow(
        'Invalid GitHub CLI commit output: output is null, undefined, or not an object'
      )
      expect(() => CommitDataDTO.fromCliOutput('invalid')).toThrow(
        'Invalid GitHub CLI commit output: output is null, undefined, or not an object'
      )
    })
  })

  describe('fromGitHubApiResponse', () => {
    it('should create DTO from complete API response', () => {
      /* eslint-disable camelcase */
      const apiResponseGitHubData = {
        author: {
          date: '2025-01-16T09:15:00Z',
          email: 'doc-github@writer.com',
          name: 'Doc Writer GitHub'
        },
        commit: {
          author: {
            date: '2025-01-16T09:15:00Z',
            email: 'doc@writer.com',
            name: 'Doc Writer'
          },
          committer: {
            date: '2025-01-16T09:30:00Z',
            email: 'merge@auto.com',
            name: 'Auto Merge'
          },
          message: 'Update documentation\n\nAdded new API examples',
          url: 'https://api.github.com/repos/owner/repo/git/commits/api456def789ghi',
          verification: {
            reason: 'unsigned',
            signature: null,
            verified: false
          }
        },
        committer: {
          date: '2025-01-16T09:30:00Z',
          email: 'merge-github@auto.com',
          name: 'Auto Merge GitHub'
        },
        html_url: 'https://github.com/owner/repo/commit/api456def789ghi',
        parents: ['parent1', 'parent2'],
        repository: {
          full_name: 'owner/repo'
        },
        sha: 'api456def789ghi',
        stats: {
          additions: 33,
          deletions: 5,
          total: 6
        }
      }
      /* eslint-enable camelcase */

      const dto = CommitDataDTO.fromGitHubApiResponse(apiResponseGitHubData)

      expect(dto.sha).toBe('api456def789ghi')
      expect(dto.shortSha).toBe('api456d')
      expect(dto.message).toBe('Update documentation\n\nAdded new API examples')
      expect(dto.authorName).toBe('Doc Writer')
      expect(dto.authorEmail).toBe('doc@writer.com')
      expect(dto.committerName).toBe('Auto Merge')
      expect(dto.committerEmail).toBe('merge@auto.com')
      expect(dto.url).toBe('https://github.com/owner/repo/commit/api456def789ghi')
      expect(dto.repository).toBe('owner/repo')
      expect(dto.additions).toBe(33)
      expect(dto.deletions).toBe(5)
      expect(dto.filesChanged).toBe(6)
      expect(dto.parentCount).toBe(2)
      expect(dto.verificationVerified).toBe(false)
      expect(dto.verificationReason).toBe('unsigned')
      expect(dto.verificationSignature).toBeNull()
    })

    it('should prefer commit author/committer over top-level', () => {
       
      const apiResponseGitHubData = {
        author: {
          date: '2025-01-16T11:00:00Z',
          email: 'toplevel@author.com',
          name: 'Top Level Author'
        },
        commit: {
          author: {
            date: '2025-01-16T10:00:00Z',
            email: 'commit@author.com',
            name: 'Commit Author'
          },
          committer: {
            date: '2025-01-16T10:30:00Z',
            email: 'commit@committer.com',
            name: 'Commit Committer'
          }
        },
        committer: {
          date: '2025-01-16T11:30:00Z',
          email: 'toplevel@committer.com',
          name: 'Top Level Committer'
        },
        sha: 'preference-test'
      }
       

      const dto = CommitDataDTO.fromGitHubApiResponse(apiResponseGitHubData)

      expect(dto.authorName).toBe('Commit Author')
      expect(dto.authorEmail).toBe('commit@author.com')
      expect(dto.committerName).toBe('Commit Committer')
      expect(dto.committerEmail).toBe('commit@committer.com')
    })

    it('should extract repository from repository_url when full_name missing', () => {
      /* eslint-disable camelcase */
      const apiResponseGitHubData = {
        repository_url: 'https://api.github.com/repos/extracted/from-url'
      }
      /* eslint-enable camelcase */

      const dto = CommitDataDTO.fromGitHubApiResponse(apiResponseGitHubData)

      expect(dto.repository).toBe('extracted/from-url')
    })

    it('should throw error for invalid API response', () => {
      expect(() => CommitDataDTO.fromGitHubApiResponse(null)).toThrow(
        'Invalid GitHub commit API response: response is null, undefined, or not an object'
      )
    })
  })

  describe('fromGraphQLResponse', () => {
    it('should create DTO from complete GraphQL response', () => {
       
      const graphqlResponseGitHubData = {
        additions: 88,
        author: {
          date: '2025-01-17T08:45:00Z',
          email: 'graphql@author.com',
          name: 'GraphQL Author',
          user: { login: 'graphql-user' }
        },
        authoredDate: '2025-01-17T08:45:00Z',
        changedFiles: 15,
        committedDate: '2025-01-17T09:00:00Z',
        committer: {
          date: '2025-01-17T09:00:00Z',
          email: 'graphql@committer.com',
          name: 'GraphQL Committer',
          user: { login: 'committer-user' }
        },
        deletions: 22,
        message: 'Complete GraphQL commit message',
        messageBody: 'This is the body of the GraphQL commit\nWith multiple lines',
        messageHeadline: 'Complete GraphQL commit',
        oid: 'graphql789abc123def',
        parents: { totalCount: 2 },
        signature: {
          isValid: true,
          payload: 'commit-payload',
          signature: 'graphql-signature-data',
          state: 'VALID'
        },
        url: 'https://github.com/graphql/repo/commit/graphql789abc123def'
      }
       

      const dto = CommitDataDTO.fromGraphQLResponse(graphqlResponseGitHubData, 'graphql/repo')

      expect(dto.sha).toBe('graphql789abc123def')
      expect(dto.shortSha).toBe('graphql')
      expect(dto.message).toBe('Complete GraphQL commit message')
      expect(dto.authorName).toBe('GraphQL Author')
      expect(dto.authorEmail).toBe('graphql@author.com')
      expect(dto.authorDate).toEqual(new Date('2025-01-17T08:45:00Z'))
      expect(dto.committerName).toBe('GraphQL Committer')
      expect(dto.committerEmail).toBe('graphql@committer.com')
      expect(dto.committerDate).toEqual(new Date('2025-01-17T09:00:00Z'))
      expect(dto.url).toBe('https://github.com/graphql/repo/commit/graphql789abc123def')
      expect(dto.repository).toBe('graphql/repo')
      expect(dto.additions).toBe(88)
      expect(dto.deletions).toBe(22)
      expect(dto.filesChanged).toBe(15)
      expect(dto.parentCount).toBe(2)
      expect(dto.verificationVerified).toBe(true)
      expect(dto.verificationReason).toBe('VALID')
      expect(dto.verificationSignature).toBe('graphql-signature-data')
    })

    it('should combine messageHeadline and messageBody when message missing', () => {
       
      const graphqlResponseGitHubData = {
        messageBody: 'This component handles user authentication\nand provides secure login functionality',
        messageHeadline: 'Feature: Add new component'
      }
       

      const dto = CommitDataDTO.fromGraphQLResponse(graphqlResponseGitHubData, 'test/repo')

      expect(dto.message).toBe('Feature: Add new component\n\nThis component handles user authentication\nand provides secure login functionality')
    })

    it('should use messageHeadline when messageBody missing', () => {
       
      const graphqlResponseGitHubData = {
        messageHeadline: 'Simple commit message'
      }
       

      const dto = CommitDataDTO.fromGraphQLResponse(graphqlResponseGitHubData, 'test/repo')

      expect(dto.message).toBe('Simple commit message')
    })

    it('should use authoredDate when author.date missing', () => {
       
      const graphqlResponseGitHubData = {
        author: {
          email: 'test@author.com',
          name: 'Test Author'
        },
        authoredDate: '2025-01-17T12:00:00Z'
      }
       

      const dto = CommitDataDTO.fromGraphQLResponse(graphqlResponseGitHubData, 'test/repo')

      expect(dto.authorDate).toEqual(new Date('2025-01-17T12:00:00Z'))
    })

    it('should throw error for invalid GraphQL response', () => {
      expect(() => CommitDataDTO.fromGraphQLResponse(null, 'test/repo')).toThrow(
        'Invalid GitHub commit GraphQL response: response is null, undefined, or not an object'
      )
    })
  })

  describe('utility methods', () => {
    const testDto = new CommitDataDTO(
      'test-sha-123456789',
      'test-sha',
      'Test commit message\n\nWith detailed description',
      'Test Author',
      'test@author.com',
      new Date('2025-01-10T10:00:00Z'),
      'Test Committer',
      'test@committer.com',
      new Date('2025-01-10T10:30:00Z'),
      'https://github.com/test/repo/commit/test-sha-123456789',
      'test/repo',
      50,
      25,
      8,
      1,
      true,
      'valid',
      'test-signature'
    )

    describe('getAgeInDays', () => {
      it('should calculate age in days correctly', () => {
        // Mock current date to be exactly 5 days after author date
        const mockDate = new Date('2025-01-15T10:00:00Z')
        vi.useFakeTimers()
        vi.setSystemTime(mockDate)

        const age = testDto.getAgeInDays()
        expect(age).toBe(5)

        vi.useRealTimers()
      })

      it('should handle same day commits', () => {
        const now = new Date()
        const todayDto = new CommitDataDTO(
          'today-sha', 'today', 'Today commit', 'Author', 'author@test.com',
          now, 'Committer', 'committer@test.com', now,
          'https://test.com', 'test/repo', 0, 0, 0, 0, false, 'unsigned', null
        )

        const age = todayDto.getAgeInDays()
        expect(age).toBeGreaterThanOrEqual(0) // Age should be 0 or greater for same time commits
        expect(age).toBeLessThanOrEqual(1) // Should be very close to 0 for same time
      })
    })

    describe('getSummary', () => {
      it('should return formatted summary with short SHA and truncated message', () => {
        const summary = testDto.getSummary()
        expect(summary).toBe('test-sha: Test commit message')
      })

      it('should truncate long commit messages', () => {
        const longMessageDto = new CommitDataDTO(
          'long-sha', 'long-sh', 'This is a very long commit message that exceeds fifty characters and should be truncated',
          'Author', 'author@test.com', new Date(), 'Committer', 'committer@test.com',
          new Date(), 'https://test.com', 'test/repo', 0, 0, 0, 0, false, 'unsigned', null
        )

        const summary = longMessageDto.getSummary()
        expect(summary).toContain('...')
        expect(summary.startsWith('long-sh: This is a very long commit message that exceeds')).toBe(true)
        expect(summary.length).toBeLessThanOrEqual(65) // Reasonable limit for summary length
      })

      it('should handle multiline messages by using first line only', () => {
        const summary = testDto.getSummary()
        expect(summary).toBe('test-sha: Test commit message')
        expect(summary).not.toContain('With detailed description')
      })
    })

    describe('getNetChanges', () => {
      it('should calculate net changes correctly', () => {
        expect(testDto.getNetChanges()).toBe(25) // 50 additions - 25 deletions
      })

      it('should handle negative net changes', () => {
        const deletionDto = new CommitDataDTO(
          'del-sha', 'del-sh', 'Delete files', 'Author', 'author@test.com',
          new Date(), 'Committer', 'committer@test.com', new Date(),
          'https://test.com', 'test/repo', 10, 30, 5, 1, false, 'unsigned', null
        )

        expect(deletionDto.getNetChanges()).toBe(-20) // 10 additions - 30 deletions
      })
    })

    describe('getTotalChanges', () => {
      it('should calculate total changes correctly', () => {
        expect(testDto.getTotalChanges()).toBe(75) // 50 additions + 25 deletions
      })
    })

    describe('isMergeCommit', () => {
      it('should identify merge commits', () => {
        const mergeDto = new CommitDataDTO(
          'merge-sha', 'merge', 'Merge pull request', 'Author', 'author@test.com',
          new Date(), 'Committer', 'committer@test.com', new Date(),
          'https://test.com', 'test/repo', 0, 0, 0, 2, false, 'unsigned', null
        )

        expect(mergeDto.isMergeCommit()).toBe(true)
        expect(testDto.isMergeCommit()).toBe(false)
      })
    })

    describe('isVerified', () => {
      it('should return verification status', () => {
        expect(testDto.isVerified()).toBe(true)

        const unverifiedDto = new CommitDataDTO(
          'unver-sha', 'unver', 'Unverified', 'Author', 'author@test.com',
          new Date(), 'Committer', 'committer@test.com', new Date(),
          'https://test.com', 'test/repo', 0, 0, 0, 1, false, 'unsigned', null
        )

        expect(unverifiedDto.isVerified()).toBe(false)
      })
    })
  })

  describe('toLLMData', () => {
    it('should convert all properties to LLM data format', () => {
      const dto = new CommitDataDTO(
        'llmdata-sha-123456',
        'llmdata',
        'Convert to LLM data test',
        'LLM Author',
        'llm@author.com',
        new Date('2025-01-18T14:00:00Z'),
        'LLM Committer',
        'llm@committer.com',
        new Date('2025-01-18T14:30:00Z'),
        'https://github.com/llm/test/commit/llmdata-sha-123456',
        'llm/test',
        40,
        15,
        6,
        1,
        true,
        'valid',
        'llm-signature'
      )

      const llmData = dto.toLLMData()

      expect(llmData).toEqual({
        COMMIT_ADDITIONS: '40',
        COMMIT_AUTHOR_DATE: '2025-01-18T14:00:00.000Z',
        COMMIT_AUTHOR_EMAIL: 'llm@author.com',
        COMMIT_AUTHOR_NAME: 'LLM Author',
        COMMIT_COMMITTER_DATE: '2025-01-18T14:30:00.000Z',
        COMMIT_COMMITTER_EMAIL: 'llm@committer.com',
        COMMIT_COMMITTER_NAME: 'LLM Committer',
        COMMIT_DELETIONS: '15',
        COMMIT_FILES_CHANGED: '6',
        COMMIT_MESSAGE: 'Convert to LLM data test',
        COMMIT_PARENT_COUNT: '1',
        COMMIT_REPOSITORY: 'llm/test',
        COMMIT_SHA: 'llmdata-sha-123456',
        COMMIT_SHA_SHORT: 'llmdata',
        COMMIT_TOTAL_CHANGES: '55',
        COMMIT_URL: 'https://github.com/llm/test/commit/llmdata-sha-123456',
        COMMIT_VERIFICATION_REASON: 'valid',
        COMMIT_VERIFICATION_SIGNATURE: 'llm-signature',
        COMMIT_VERIFICATION_VERIFIED: 'true'
      })
    })

    it('should handle null signature in LLM data', () => {
      const dto = new CommitDataDTO(
        'null-sig', 'null-s', 'Test message', 'Author', 'author@test.com',
        new Date(), 'Committer', 'committer@test.com', new Date(),
        'https://test.com', 'test/repo', 0, 0, 0, 1, false, 'unsigned', null
      )

      const llmData = dto.toLLMData()

      expect(llmData.COMMIT_VERIFICATION_SIGNATURE).toBe('')
      expect(llmData.COMMIT_VERIFICATION_VERIFIED).toBe('false')
    })

    it('should use consistent key names matching private Keys constants', () => {
      const dto = new CommitDataDTO(
        'key-test', 'key-te', 'Key test', 'Author', 'author@test.com',
        new Date(), 'Committer', 'committer@test.com', new Date(),
        'https://test.com', 'test/repo', 5, 3, 2, 1, true, 'valid', 'sig'
      )

      const llmData = dto.toLLMData()
      const keys = Object.keys(llmData)

      // Verify all expected keys are present
      const expectedKeys = [
        'COMMIT_ADDITIONS', 'COMMIT_AUTHOR_DATE', 'COMMIT_AUTHOR_EMAIL',
        'COMMIT_AUTHOR_NAME', 'COMMIT_COMMITTER_DATE', 'COMMIT_COMMITTER_EMAIL',
        'COMMIT_COMMITTER_NAME', 'COMMIT_DELETIONS', 'COMMIT_FILES_CHANGED',
        'COMMIT_MESSAGE', 'COMMIT_PARENT_COUNT', 'COMMIT_REPOSITORY',
        'COMMIT_SHA', 'COMMIT_SHA_SHORT', 'COMMIT_TOTAL_CHANGES', 'COMMIT_URL',
        'COMMIT_VERIFICATION_REASON', 'COMMIT_VERIFICATION_SIGNATURE',
        'COMMIT_VERIFICATION_VERIFIED'
      ]

      for (const key of expectedKeys) {
        expect(keys).toContain(key)
      }

      expect(keys.length).toBe(expectedKeys.length)
    })
  })
})