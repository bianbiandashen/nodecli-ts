/**
 * @description getProcessList-Service 入参
 */
export interface planNameIsExistParams {
  patrolPlanName:string
}
export interface queryPlanListParams {
  patrolPlanName?:string,
  patrolAreaIds?:string,
  executeType?:string,
  patrolPlanStatus?:string,
  psId?:string,
  planEffectiveStart?:string,
  planEffectiveEnd?:string,
  createTimeStart?:string,
  createTimeEnd?:string,
  pageNo:string,
  pageSize:string
}
export interface deletePatrolPlanDataParams {
  ids:string
}
export interface updatePatrolStatusParams {
  patrolPlanId:string,
  patrolPlanStatus:number
}
export interface getProcessListParams {}

/**
 * @description getProcessList-Service 返回
 */
export interface getProcessListResult {}

export interface createPatrolPlanServiceParams{}
export interface addPatrolPlanParams{
  planGroup:any,
  psId:any,
  flowConfigList: any[]
}
export interface updatePatrolPlanParams{
  patrolPlanId:string,
  planGroup:any,
  psId:any,
  flowConfigList: any[]
}
/**
 * @description User-Service abstractions
 */
export interface IPatrolPlanService {
  getPatrolPlanUuid(): Promise<string>
  planNameIsExist(patrolPlanName,transaction?:any): Promise<any>
  queryPlanList(queryPlanListParams): Promise<any>
  deletePatrolPlanData(deletePatrolPlanDataParams): Promise<any>
  updatePatrolStatus(updatePatrolStatusParams): Promise<any>
  updatePatrolPlanInfo(updatePatrolPlanParams): Promise<any>
  getProcessList(options: getProcessListParams): Promise<getProcessListResult>
  createPatrolPlanService(params: createPatrolPlanServiceParams): Promise<string>
  addPatrolPlan(params: addPatrolPlanParams): Promise<string>
  queryPlanAllListByIds(patrolPlanIds:string): Promise<any>
  queryPlanAllList(params:any): Promise<any>
  queryPlanListOriginal(params:any): Promise<any>
  queryPlanDetail(params:any): Promise<any>
  queryPlanGroupNoAll(params:any): Promise<any>
  queryAllPlanDetailByApi(params:any): Promise<any>
  queryAllPlanDetail(params:any): Promise<any>
  queryPlanGroup(params:any): Promise<any>
  queryPlanDetailStep(params:any): Promise<any>
  queryPlanAllDetailStep(params:any): Promise<any>
  queryPlanItems(params:any): Promise<any>
  queryPlanItemsFromObjType(params:any): Promise<any>
  queryPlanItemsTitle(params:any): Promise<any>
  stopPatrolPlan(params:any): Promise<any>
  getLevelItemsList(params:any): Promise<any>
}
