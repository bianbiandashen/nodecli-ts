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
export interface IHuayanCapture {
  // cropperRefPic(params: cropperRefPicOptions): Promise<cropperRefPicResult>
  saveRefPic(fileStream, itemId, patrolObjId): Promise<any>
  getRefPics(itemId, patrolObjId): Promise<any>
  getRefPicsBytaskItemId(taskItemId:any): Promise<any>
  deletePic(refPicId:any): Promise<any>
  getCapturedPicForXunJian(taskItemId, taskPointId): Promise<any>
  getCapturedPicForProblem(taskItemId, taskPointId): Promise<any>
  playBack(param, CTGC): Promise<any>
  preview(cameraid, CTGT): Promise<any>
  cameraControl(params:any): Promise<any>
  getPTZ(params:any): Promise<any>
  capturePicForRefPic(params:any): Promise<any>
  getCameraByRegion(params:any): Promise<any>
  savePoint(params:any): Promise<any>
  getPointTable(params:any): Promise<any>
  pointDelete(params:any): Promise<any>
  pointMove(params:any): Promise<any>
  urlToBase64(params:any): Promise<any>
  getZhengGaiPic(params:any): Promise<any>
  getOrbitalByCamera(params:any): Promise<any>
  orbitalControl(params:any): Promise<any>
  getOrbitalPosition(params:any): Promise<any>
  savePointWithOrbital(params:any): Promise<any>
  saveOrbitalPreset(params:any): Promise<any>
  getItemFullPathName(params:any): Promise<any>
  getItemNameByTaskItem(params:any): Promise<any>
  getEventTypeOptions(params:any): Promise<any>
  updatePointEvent(params:any): Promise<any>
  getMethodNameByMethodId(params:any): Promise<any>
}
