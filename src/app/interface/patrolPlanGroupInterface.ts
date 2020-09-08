export interface IPatrolPlanGroupService {
  createPatrolPlanGroup(params:any,transaction?:any): Promise<any>
  queryAllPlanGroup(params:any,transaction?:any): Promise<any>
  queryPlanGroupDetail(params:any,transaction?:any): Promise<any>
  updatePlanGroup(params:any,transaction?:any): Promise<any>
  deleteGroupDate(params:any,transaction?:any): Promise<any>
  deleteGroupDateByPlanIds(params:any,transaction?:any): Promise<any>
  queryGroupDetail(params:any,transaction?:any): Promise<any>
}