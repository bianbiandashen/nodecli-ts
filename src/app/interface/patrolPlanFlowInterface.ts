export interface IPatrolPlanFlowService {
  createPatrolPlanFlow(params:any, transaction?:any): Promise<any>
  createPatrolPlanFlowService(params:any, transaction?:any): Promise<any>
  updatePatrolPlanFlowService(params:any, transaction?:any): Promise<any>
  queryDataAllList(params:any, transaction?:any): Promise<any>
  queryManyDataList(params:any, transaction?:any): Promise<any>
  physicsDeleteData(params:any, transaction?:any): Promise<any>
}