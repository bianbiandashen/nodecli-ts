export interface ItaskExecResultService {
  queryByItemId(params:any, transaction?:any): Promise<any>
  querySolvedProblemByPlanId(params:any, transaction?:any): Promise<any>
  queryProblemObjByPlanId(params:any, transaction?:any): Promise<any>
  queryProblemByPlanId(params:any, transaction?:any): Promise<any>
  queryProblemByTaskId(params:any, transaction?:any): Promise<any>
  queryObjProblem(params:any, transaction?:any): Promise<any>
  queryProblemByTaskItemIdArr(params:any, transaction?:any): Promise<any>
  getTaskItemResult(params:any, transaction?:any): Promise<any>
  getTaskItemResultByUuid(params:any, transaction?:any): Promise<any>
  getTaskItemResultOne(params:any, transaction?:any): Promise<any>
  getExecResultById(params:any, transaction?:any): Promise<any>
  getExecTypeByRelativeId(relativeId:any, transaction?:any): Promise<any>
  getExecResultByTaskPointId(taskPointId:any, transaction?:any): Promise<any>
  getExecResultByTaskItemId(patrolTaskItemId:any, transaction?:any): Promise<any>
  getExecResultByTask(params:any, transaction?:any): Promise<any>
}