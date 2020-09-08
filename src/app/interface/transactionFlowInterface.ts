export interface ITransactionFlowService {
  getQuestionlistByFirstItemId(parmas:any,userId:any, transaction?:any): Promise<any>
  getlistByObjId(parmas:any,userId:any, transaction?:any): Promise<any>
  getQuestionInfo(params:any, transaction?:any): Promise<any>
  createFlow(relatedId:any,execUsers:any,copyUsers:any,modifier:any,pageJson:any, transaction?:any): Promise<any>
  nextStep(relativeId:any,judge:any,info:any,execUsers:any,copyUsers:any,modifier:any, transaction?:any): Promise<any>
  getTransactionFlowList(params:any, transaction?:any): Promise<any>
  acceptProblem(relativeId:any,nextHandler:any, transaction?:any): Promise<any>
  getTransactionResultProblem(params:any, transaction?:any): Promise<any>
  getTransactionOneResultProblem(relativeId:any, transaction?:any): Promise<any>
  getTransactionResultNoRectifyProblem(params:any, transaction?:any): Promise<any>
  getTransactionFlowAllData(params:any, transaction?:any): Promise<any>
}