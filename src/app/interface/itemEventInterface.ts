/**
/**
 * @description User-Service parameters
 */
export interface IUserOptions {
  
}

/**
 * @description User-Service response
 */
export interface IUserResult {
  
}

/**
 * @description User-Service abstractions
 */
export interface IItemEventService {
  mannerService(params): Promise<any>
  getItemManner(params): Promise<any>
}
