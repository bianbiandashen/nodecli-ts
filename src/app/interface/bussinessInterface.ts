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
export interface IBussinessService {
  queryOneDetail(params): Promise<any>
  queryAllApp(params): Promise<any>
}

