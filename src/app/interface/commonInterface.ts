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
export interface ICommonService {
  getAppIdByPublicBySchema(transaction?:any): Promise<any>
  getAppIdByPublicBusinessSchema(transaction?:any): Promise<any>
  getItemManner(transaction?:any): Promise<any>
  getItemMannerByTaskItemId(params,transaction?:any): Promise<any>
  getUserInfo(transaction?:any): Promise<any>
  getPersonInfo(transaction?:any): Promise<any>
  uploadPicToAsw (fileStream, taskPointId, cameraId,transaction?:any): Promise<any>
  getCameraObj (params, transaction?:any): Promise<any>
  uploadImgToDb(params, transaction?:any): Promise<any>
  getRegionIdsFromFirstRegion (regionId, transaction?:any): Promise<any>
  getImageUrlForBS (picId, transaction?:any): Promise<any>
  getUserList (params, transaction?:any): Promise<any>
  getUserListInSameOrg (params, userId, transaction?:any): Promise<any>
  getUserInfoByUserIds (params, transaction?:any): Promise<any>
  partrolItemsPath(params, transaction?:any): Promise<any>
  getPatrolResultByTaskItemId(params, transaction?:any): Promise<any>
  getPatrolPic(params, transaction?:any): Promise<any>
  getRealPic(params, transaction?:any): Promise<any>


}
