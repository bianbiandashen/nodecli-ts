export interface IpictureService {
  getRealPic(picId:any, transaction?:any): Promise<any>
  getRealPicWithLocal(picId:any, transaction?:any): Promise<any>
  getPromise(realUrl:any, transaction?:any): Promise<any>
  urlToBase64(url:any, transaction?:any): Promise<any>
}