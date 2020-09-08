/**
 * @description Service parameters
 */
export interface cropperRefPicOptions {
  base64Pic: string;
  refPicId: string;
}
/**
 * @description Service response
 */
export interface cropperRefPicResult {}

/**
 * @description User-Service abstractions
 */
export interface IPatrolObjService {
  itemServiceByPath(params, transaction?:any): Promise<any>
  itemService(params, transaction?:any): Promise<any>
  itemPathNameService(params, transaction?:any): Promise<any>
  queryPathByTaskItemId(params, transaction?:any): Promise<any>
  queryItemName(params, transaction?:any): Promise<any>
}
