export interface IplanSchemaService {
  planTempIsExist(params:any): Promise<any>
  planTempDetailByPlan(params:any): Promise<any>
  queryAllPlanTemp(params:any): Promise<any>
  queryPlanSchemaDetail(params:any): Promise<any>
  queryPlanTempDetail(params:any): Promise<any>
}