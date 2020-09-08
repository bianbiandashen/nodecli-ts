export interface ItlncService {
  mq(params:any, transaction?:any): Promise<any>
}