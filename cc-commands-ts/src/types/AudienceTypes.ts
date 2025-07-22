/**
 * Enum for different audience types that reports can be generated for
 */
export enum AudienceType {
  Client = 'client',
  Technical = 'technical',
  Management = 'management',
  ProductOwner = 'product-owner'
}

/**
 * Type guard to check if a string is a valid AudienceType
 */
export function isAudienceType(value: string): value is AudienceType {
  return Object.values(AudienceType).includes(value as AudienceType)
}

/**
 * Get audience type from string with fallback to Client
 */
export function parseAudienceType(value?: string): AudienceType {
  if (!value) return AudienceType.Client
  
  const normalized = value.toLowerCase().replace(/[_\s]/g, '-')
  
  if (isAudienceType(normalized)) {
    return normalized
  }
  
  // Handle common variations
  switch (normalized) {
    case 'po':
    case 'product':
    case 'owner':
      return AudienceType.ProductOwner
    case 'tech':
    case 'dev':
    case 'developer':
      return AudienceType.Technical
    case 'mgmt':
    case 'manager':
      return AudienceType.Management
    default:
      return AudienceType.Client
  }
}