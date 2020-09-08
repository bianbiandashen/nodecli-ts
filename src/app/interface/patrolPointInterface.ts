export interface IPatrolPointService {
  queryPointAllList(params:any, transaction?:any): Promise<any>
  queryPointAllListByPointIds(params:any, transaction?:any): Promise<any>
}