export interface IpatrolTaskPointService {
  getTaskPointDetail(params:any, transaction?:any): Promise<any>
  queryTaskPointAllListByTransactionId(params:any, transaction?:any): Promise<any>
  queryTaskPointAllListByPatrolTaskItemId(params:any, transaction?:any): Promise<any>
}