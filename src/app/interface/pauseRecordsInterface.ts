export interface IpauseRecordsService {
  taskCancel(params:any): Promise<any>
  taskStopAll(params:any): Promise<any>
  create(params:any): Promise<any>
  getlist(params:any): Promise<any>
}