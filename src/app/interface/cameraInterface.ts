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
export interface ICamera {
  // cropperRefPic(params: cropperRefPicOptions): Promise<cropperRefPicResult>
  playBack (cameraId, startTime, endTime, CTGT): Promise<any>
  getCameraDetail (cameraid): Promise<any>
  preview (cameraid, CTGT): Promise<any>
  dacTrans (params, method, ability: string, driveId, deviceId: string): Promise<any>
  ptzds (params, method): Promise<any>
  getTaskDetail (tid): Promise<any>
  getOrbitalByCamera (cameraId): Promise<any>
  getOrbitalPosition (orbitalId): Promise<any>
  setPresetToOrbitalWithOrms (orbitalId, preset): Promise<any>
}
