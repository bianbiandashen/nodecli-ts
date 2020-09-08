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
export interface IAgentPersonService {
  // cropperRefPic(params: cropperRefPicOptions): Promise<cropperRefPicResult>
  judgeAgentInfo(userId, transaction?:any): Promise<any>
  getUserIdsBySubmiiters(userIds, transaction?:any): Promise<any>
  getOtherPersonByUserOrgId(userId, transaction?:any): Promise<any>
  agentSearch(userId, transaction?:any): Promise<any>
  agentGetDetail(params, transaction?:any): Promise<any>
  agentAdd(params, userId, transaction?:any): Promise<any>
  agentWithdrawalOfLeave(params, transaction?:any): Promise<any>
  agentDelete(params, transaction?:any): Promise<any>

}
