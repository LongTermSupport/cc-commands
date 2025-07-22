/**
 * Represents a GitHub Project (v2)
 */
export interface IGitHubProject {
  /**
   * The project's unique identifier
   */
  id: number
  
  /**
   * The project's title
   */
  title: string
  
  /**
   * The full URL to the project
   */
  url: string
  
  /**
   * The organization that owns the project
   */
  organization: string
  
  /**
   * The project number within the organization
   */
  number: number
  
  /**
   * When the project was last updated
   */
  updatedAt: Date
  
  /**
   * Total number of items in the project
   */
  itemCount: number
  
  /**
   * Optional description of the project
   */
  description?: string
  
  /**
   * Whether the project is public
   */
  public: boolean
  
  /**
   * Whether the project is closed
   */
  closed: boolean
}