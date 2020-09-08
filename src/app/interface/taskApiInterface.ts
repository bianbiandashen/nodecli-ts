export interface ItaskApiService {
  taskItemByUse(params:any): Promise<any>
  taskStateCount(params:any): Promise<any>
  taskList(params:any): Promise<any>
  taskDetail(params:any): Promise<any>
  taskItemList(params:any): Promise<any>
  taskProblemList(params:any): Promise<any>
  taskProblemDetail(params:any): Promise<any>
  taskProblemTypeCount(params:any): Promise<any>
  problemPlanTemplateCount(params:any): Promise<any>
  problemStateCount(params:any): Promise<any>
  planObjList(params:any): Promise<any>
}