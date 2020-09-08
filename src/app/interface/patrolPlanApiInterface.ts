export interface IPatrolPlanApiService {
  queryPlanList(params:any): Promise<any>
  queryPlanDetail(params:any): Promise<any>
}