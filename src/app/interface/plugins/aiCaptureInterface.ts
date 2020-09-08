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
export interface IAiCapture {
  // cropperRefPic(params: cropperRefPicOptions): Promise<cropperRefPicResult>
  saveRefPic(fileStream, itemId, patrolObjId):Promise<any>
  getRefPics(itemId, patrolObjId):Promise<any>
  getRefPicsBytaskItemId(taskItemId):Promise<any>
  deletePic(refPicId):Promise<any>
  getCapturedPicForXunJian(taskItemId, taskPointId):Promise<any>
  getCapturedPicForProblem(taskItemId, taskPointId):Promise<any>
  playBack(param, CTGC):Promise<any>
  getCameraDetail(params):Promise<any>
  preview(cameraid, CTGT):Promise<any>
  cameraControl(params):Promise<any>
  getPTZ(params):Promise<any>
  capturePicForRefPic(params):Promise<any>
  getCameraByRegion(params):Promise<any>
  savePoint(params, patrolItemId, patrolObjId, methodId):Promise<any>
  getPointTable(params):Promise<any>
  pointDelete(params):Promise<any>
  pointMove(params):Promise<any>
  urlToBase64(params):Promise<any>
  getZhengGaiPic(params):Promise<any>
  getOrbitalByCamera(params):Promise<any>
  orbitalControl(params):Promise<any>
  getOrbitalPosition(params):Promise<any>
  savePointWithOrbital(params):Promise<any>
  saveOrbitalPreset(params):Promise<any>
  getItemFullPathName(params):Promise<any>
  getItemNameByTaskItem(params):Promise<any>
  getMethodNameByMethodId(params):Promise<any>
}
