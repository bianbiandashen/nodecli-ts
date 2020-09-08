export interface IpatrolTaskDateService {
  createPatrolTaskDateService(params:any,transaction?:any): Promise<any>
  updatePatrolTaskDateService(params:any,transaction?:any): Promise<any>
  queryPatrolTaskDate(params:any,transaction?:any): Promise<any>
  deletePatrolTaskDate(params:any,transaction?:any): Promise<any>
  deleteDateByPlanIds(params:any,transaction?:any): Promise<any>
  deleteDateByGroupIds(params:any,transaction?:any): Promise<any>
  deleteTaskDate(params:any,transaction?:any): Promise<any>
}