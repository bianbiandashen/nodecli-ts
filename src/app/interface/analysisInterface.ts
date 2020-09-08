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
export interface IAnalysisService {
  getProblemRateByObj(params): Promise<any>
  getProblemRateByObjTypeAndRegionId(params): Promise<any>
  getProblemRate(params): Promise<any>
  getCompletionRate(params): Promise<any>
  timeoutRateService(params): Promise<any>
  timeoutRankService(params): Promise<any>
  problemRateContrastService(params): Promise<any>
  resultRankService(params): Promise<any>
  deductionListService(params): Promise<any>
  getProblemRateByItemId(params): Promise<any>













}
