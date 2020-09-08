export interface IrelationObjPersonService {
  createRelation(params:any, transaction?:any): Promise<any>
  batchCreateRelation(params:any, transaction?:any): Promise<any>
  updateRelation(params:any, transaction?:any): Promise<any>
  queryAllList(params:any, transaction?:any): Promise<any>
  queryRelationList(params:any, transaction?:any): Promise<any>
  deleteDate(params:any, transaction?:any): Promise<any>
}