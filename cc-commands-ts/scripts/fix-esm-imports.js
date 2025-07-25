#!/usr/bin/env node
import { readdir, readFile, writeFile } from 'fs/promises'
import { join } from 'path'

/**
 * Recursively fix ESM imports in compiled JS files by adding .js extensions
 */
async function fixImportsInDirectory(dir) {
  const entries = await readdir(dir, { withFileTypes: true })
  
  for (const entry of entries) {
    const fullPath = join(dir, entry.name)
    
    if (entry.isDirectory()) {
      await fixImportsInDirectory(fullPath)
    } else if (entry.name.endsWith('.js')) {
      await fixImportsInFile(fullPath)
    }
  }
}

async function fixImportsInFile(filePath) {
  const content = await readFile(filePath, 'utf8')
  
  // Fix relative imports that don't already have .js extension
  const fixed = content.replace(
    /from\s+['"](\.[^'"]+)(?<!\.js)(?<!\.json)['"]/g,
    (match, importPath) => {
      // Don't add .js to imports that already have an extension
      if (importPath.includes('.')) {
        const lastPart = importPath.split('/').pop()
        if (lastPart.includes('.')) {
          return match
        }
      }
      return `from '${importPath}.js'`
    }
  )
  
  if (fixed !== content) {
    await writeFile(filePath, fixed)
    console.log(`Fixed imports in: ${filePath}`)
  }
}

// Run the fix
const distDir = join(process.cwd(), 'dist')
console.log('Fixing ESM imports in dist directory...')
await fixImportsInDirectory(distDir)
console.log('Done!')