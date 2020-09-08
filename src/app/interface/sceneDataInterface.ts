export interface IsceneDataService {
  findBySchemaCode(params:any, transaction?:any): Promise<any>
  getOnePageConfig(params:any, transaction?:any): Promise<any>
  getTaskDealType(query:any, transaction?:any): Promise<any>
}