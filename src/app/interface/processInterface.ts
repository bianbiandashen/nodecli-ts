export interface IprocessService {
  getProcess(params:any, transaction?:any): Promise<any>
  getProcessAllInfo(params:any, transaction?:any): Promise<any>
}