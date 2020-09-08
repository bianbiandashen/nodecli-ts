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
export interface IPlannedCaptureServer {
  // cropperRefPic(params: cropperRefPicOptions): Promise<cropperRefPicResult>
  saveRefPic(fileStream, itemId, patrolObjId):Promise<any>
  saveRefPicAynsc(picUrl, itemId, patrolObjId, cameraId, name):Promise<any>
  getRefPics(itemId, patrolObjId):Promise<any>
  getReferPicsByTaskPoint(taskPointId, taskItemId):Promise<any>
  getRefPicsBytaskItemId(taskItemId):Promise<any>
  deletePic(refPicId):Promise<any>
  getCapturedPicForXunJian(taskItemId, taskPointId):Promise<any>
  getCapturedPicForProblem(taskItemId, taskPointId):Promise<any>
  getShenHePic(params):Promise<any>
  playBack(param, CTGC):Promise<any>
  preview(cameraid, CTGT):Promise<any>
  cameraControl(params):Promise<any>
  goToPtz(params):Promise<any>
  getTaskDetail(params):Promise<any>
  getPTZ(params):Promise<any>
  capturePicForRefPic(params):Promise<any>
  getCameraDetail(params):Promise<any>
  getCameraByRegion(params):Promise<any>
  savePoint(params):Promise<any>
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
  getAllRefPic(params):Promise<any>
  getMethodNameByMethodId(params):Promise<any>
  getCameraIdByTaskPoint(params):Promise<any>
  cropperRefPic(params):Promise<any>
  getCameraListByTaskItem(params):Promise<any>























}
