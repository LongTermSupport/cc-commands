import { resolve as resolveTs } from 'ts-node/esm'
import * as tsConfigPaths from 'tsconfig-paths'
import { pathToFileURL } from 'url'
import { resolve } from 'path'

const { absoluteBaseUrl, paths } = tsConfigPaths.loadConfig()
const matchPath = tsConfigPaths.createMatchPath(absoluteBaseUrl, paths)

export { load, transformSource } from 'ts-node/esm'

export async function resolve(specifier, context, defaultResolve) {
  // Handle relative imports without extensions
  if (specifier.startsWith('.') && !specifier.endsWith('.js')) {
    try {
      const resolved = new URL(specifier + '.js', context.parentURL)
      return { url: resolved.href, format: 'module' }
    } catch {
      // Fall through to default resolution
    }
  }

  const mappedSpecifier = matchPath(specifier)
  if (mappedSpecifier) {
    specifier = pathToFileURL(mappedSpecifier).href
  }

  return resolveTs(specifier, context, defaultResolve)
}