import { execSync } from 'node:child_process'
import { existsSync, writeFileSync } from 'node:fs'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { createCompressedJsonFile, ensureXzAvailable, validateCompressedFile } from '../../../src/core/utils/CompressionUtils.js'

// Mock child_process and fs
vi.mock('child_process')
vi.mock('fs')

describe('CompressionUtils', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })
  
  describe('ensureXzAvailable', () => {
    it('should pass when xz command is available', () => {
      vi.mocked(execSync).mockReturnValue(Buffer.from('/usr/bin/xz'))
      
      expect(() => ensureXzAvailable()).not.toThrow()
      expect(execSync).toHaveBeenCalledWith('which xz', { stdio: 'ignore' })
    })
    
    it('should throw with installation instructions when xz is not available', () => {
      vi.mocked(execSync).mockImplementation(() => {
        throw new Error('Command not found')
      })
      
      expect(() => ensureXzAvailable()).toThrow('XZ compression tool not found')
      expect(() => ensureXzAvailable()).toThrow('sudo apt-get install xz-utils')
    })
  })
  
  describe('createCompressedJsonFile', () => {
    it('should create compressed JSON file successfully', async () => {
      const testData = { numbers: [1, 2, 3], test: 'data' }
      const outputPath = '/tmp/test.json.xz'
      
      vi.mocked(execSync).mockReturnValueOnce(Buffer.from('/usr/bin/xz'))  // xz availability
      vi.mocked(writeFileSync).mockReturnValue()
      vi.mocked(execSync).mockReturnValueOnce(Buffer.from(''))  // compression command
      vi.mocked(existsSync).mockReturnValue(true)  // compressed file exists
      
      await expect(createCompressedJsonFile(testData, outputPath)).resolves.toBeUndefined()
      
      expect(writeFileSync).toHaveBeenCalledWith(
        '/tmp/test.json',
        JSON.stringify(testData, null, 2),
        'utf8'
      )
      expect(execSync).toHaveBeenCalledWith('xz -z -6 "/tmp/test.json"', { stdio: 'pipe' })
    })
    
    it('should handle compression failures', async () => {
      const testData = { test: 'data' }
      const outputPath = '/tmp/test.json.xz'
      
      vi.mocked(execSync).mockReturnValueOnce(Buffer.from('/usr/bin/xz'))  // xz availability
      vi.mocked(writeFileSync).mockReturnValue()
      vi.mocked(execSync).mockImplementation((cmd) => {
        if (cmd.includes('xz -z')) {
          throw new Error('Compression failed')
        }

        return Buffer.from('')
      })
      
      await expect(createCompressedJsonFile(testData, outputPath))
        .rejects.toThrow('Failed to create compressed JSON file')
    })
    
    it('should handle JSON stringification errors', async () => {
      // Create a data structure that causes JSON.stringify to fail
      const circularData: Record<string, unknown> = { name: 'test' }
      circularData.self = circularData  // Create circular reference
      const outputPath = '/tmp/test.json.xz'
      
      vi.mocked(execSync).mockReturnValueOnce(Buffer.from('/usr/bin/xz'))  // xz availability
      
      await expect(createCompressedJsonFile(circularData, outputPath))
        .rejects.toThrow('Converting circular structure to JSON')
    })
  })
  
  describe('validateCompressedFile', () => {
    it('should return true for valid compressed file', () => {
      const filePath = '/tmp/test.json.xz'
      
      vi.mocked(execSync).mockReturnValueOnce(Buffer.from('/usr/bin/xz'))  // xz availability
      vi.mocked(existsSync).mockReturnValue(true)
      vi.mocked(execSync).mockReturnValueOnce(Buffer.from('{"test": "data"}'))  // validation
      
      const result = validateCompressedFile(filePath)
      
      expect(result).toBe(true)
      expect(execSync).toHaveBeenCalledWith(`xzcat "${filePath}" | head -1`, { stdio: 'pipe' })
    })
    
    it('should return false for non-existent file', () => {
      const filePath = '/tmp/nonexistent.json.xz'
      
      vi.mocked(execSync).mockReturnValueOnce(Buffer.from('/usr/bin/xz'))  // xz availability
      vi.mocked(existsSync).mockReturnValue(false)
      
      const result = validateCompressedFile(filePath)
      expect(result).toBe(false)
    })
    
    it('should return false for corrupted compressed file', () => {
      const filePath = '/tmp/corrupted.json.xz'
      
      vi.mocked(execSync).mockReturnValueOnce(Buffer.from('/usr/bin/xz'))  // xz availability
      vi.mocked(existsSync).mockReturnValue(true)
      vi.mocked(execSync).mockImplementation((cmd) => {
        if (cmd.includes('xzcat')) {
          throw new Error('xz: corrupted data')
        }

        return Buffer.from('/usr/bin/xz')
      })
      
      const result = validateCompressedFile(filePath)
      expect(result).toBe(false)
    })
  })
})