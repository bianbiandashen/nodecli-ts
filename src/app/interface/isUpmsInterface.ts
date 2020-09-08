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
export interface IIsupmService {
  getPersonReigonListByUserId(userId): Promise<any>
  getObjectListByOrgId(params): Promise<any>
  getObjectListByRegionId(params): Promise<any>
  getPatrolItemsByObjectId(params): Promise<any>
}
