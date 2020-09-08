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

export interface IRemoteDevopsService {
  // cropperRefPic(params: cropperRefPicOptions): Promise<cropperRefPicResult>
  remoteDevopsShow(params):Promise<any>
  remoteDevopsSavePoint(params):Promise<any>
  remoteDevopsQueryPoint(params):Promise<any>
  getMannerInfo(params):Promise<any>

}
