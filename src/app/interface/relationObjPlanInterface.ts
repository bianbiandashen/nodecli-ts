export interface IrelationObjPlanService {
  createRelationObjPlanService(params:any, transaction?:any): Promise<any>
  updateRelationObjPlanDateService(params:any, transaction?:any): Promise<any>
  queryDataAllList(params:any, transaction?:any): Promise<any>
  queryManyAllList(params:any, transaction?:any): Promise<any>
  queryPlanItemIds(params:any, transaction?:any): Promise<any>
  queryPlanPointIds(params:any, transaction?:any): Promise<any>
  queryDataManyList(patrolPlanIds:any, transaction?:any): Promise<any>
  physicsDeleteData(params:any, transaction?:any): Promise<any>
  deleteDataByGroupIds(params:any, transaction?:any): Promise<any>
}