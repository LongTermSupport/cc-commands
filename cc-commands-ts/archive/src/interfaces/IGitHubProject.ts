/**
 * Represents a GitHub Project (v2)
 */
export interface IGitHubProject {
  /**
   * Whether the project is closed
   */
  closed: boolean
  
  /**
   * Optional description of the project
   */
  description?: string
  
  /**
   * The project's unique identifier
   */
  id: number
  
  /**
   * Total number of items in the project
   */
  itemCount: number
  
  /**
   * The project number within the organization
   */
  number: number
  
  /**
   * The organization that owns the project
   */
  organization: string
  
  /**
   * Whether the project is public
   */
  public: boolean
  
  /**
   * The project's title
   */
  title: string
  
  /**
   * When the project was last updated
   */
  updatedAt: Date
  
  /**
   * The full URL to the project
   */
  url: string
}